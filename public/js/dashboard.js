function dashboardApp() {
  return {
    user: {
      id: null,
      name: '',
      email: '',
      balance: 0
    },
    payment: {
      receiverEmail: '',
      amount: '',
      loading: false
    },
    transactions: [],
    allUsers: [],
    filteredUsers: [],
    showSuggestions: false,
    alert: {
      show: false,
      type: 'success',
      message: ''
    },
    eventSource: null,

    async init() {
      await this.checkSession();
      await this.loadTransactions();
      await this.loadUsers();
      this.connectToRealTimeUpdates();
    },

    async checkSession() {
      try {
        const response = await fetch('/api/session');
        
        if (!response.ok) {
          window.location.href = '/';
          return;
        }

        const data = await response.json();
        this.user = data.user;
      } catch (error) {
        console.error('Session check failed:', error);
        window.location.href = '/';
      }
    },

    async loadUsers() {
      try {
        const response = await fetch('/api/users');
        if (response.ok) {
          const data = await response.json();
          this.allUsers = data;
        }
      } catch (error) {
        console.error('Failed to load users:', error);
      }
    },

    searchUsers() {
      const query = this.payment.receiverEmail.toLowerCase();
      if (query.length < 2) {
        this.filteredUsers = [];
        return;
      }
      
      this.filteredUsers = this.allUsers.filter(user => 
        user.email.toLowerCase().includes(query) || 
        user.name.toLowerCase().includes(query)
      ).slice(0, 5);
    },

    selectUser(user) {
      this.payment.receiverEmail = user.email;
      this.showSuggestions = false;
      this.filteredUsers = [];
    },

    async sendPayment() {
      this.payment.loading = true;
      this.hideAlert();

      try {
        const response = await fetch('/api/send-payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            receiverEmail: this.payment.receiverEmail,
            amount: parseFloat(this.payment.amount)
          })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Payment failed');
        }

        // Success
        this.showAlert('success', `Payment of ₱${this.formatMoney(this.payment.amount)} sent successfully to ${data.transaction.receiver}!`);
        
        // TTS success message
        this.speak(`Payment successful. You sent ${this.payment.amount} pesos to ${data.transaction.receiver}. Your new balance is ${data.transaction.newBalance} pesos.`);

        // Reset form
        this.payment.receiverEmail = '';
        this.payment.amount = '';

        // Reload data
        await this.checkSession();
        await this.loadTransactions();

      } catch (error) {
        this.showAlert('error', error.message);
        this.speak(`Payment failed. ${error.message}`);
      } finally {
        this.payment.loading = false;
      }
    },

    async loadTransactions() {
      try {
        const response = await fetch('/api/transactions');
        if (response.ok) {
          const data = await response.json();
          this.transactions = data;
        }
      } catch (error) {
        console.error('Failed to load transactions:', error);
      }
    },

    async logout() {
      try {
        await fetch('/api/logout', { method: 'POST' });
        this.speak('Logged out successfully. Goodbye!');
        setTimeout(() => {
          window.location.href = '/';
        }, 500);
      } catch (error) {
        console.error('Logout failed:', error);
      }
    },

    connectToRealTimeUpdates() {
      // Connect to Server-Sent Events
      this.eventSource = new EventSource('/api/events');
      
      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'transaction') {
            // Reload transactions and balance when notified
            this.loadTransactions();
            this.checkSession();
          }
        } catch (error) {
          console.error('SSE message error:', error);
        }
      };

      this.eventSource.onerror = (error) => {
        console.error('SSE error:', error);
        // Reconnect after 5 seconds
        setTimeout(() => {
          if (this.eventSource.readyState === EventSource.CLOSED) {
            this.connectToRealTimeUpdates();
          }
        }, 5000);
      };
    },

    showAlert(type, message) {
      this.alert = {
        show: true,
        type: type,
        message: message
      };

      // Auto-hide after 5 seconds
      setTimeout(() => {
        this.hideAlert();
      }, 5000);
    },

    hideAlert() {
      this.alert.show = false;
    },

    speak(text) {
      if ('speechSynthesis' in window) {
        // Cancel any ongoing speech
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        utterance.lang = 'en-US';
        
        window.speechSynthesis.speak(utterance);
      }
    },

    formatMoney(amount) {
      return parseFloat(amount).toLocaleString('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    },

    formatDate(dateString) {
      const date = new Date(dateString);
      const now = new Date();
      const diff = now - date;
      const seconds = Math.floor(diff / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);

      if (seconds < 60) return 'Just now';
      if (minutes < 60) return `${minutes}m ago`;
      if (hours < 24) return `${hours}h ago`;
      if (days < 7) return `${days}d ago`;
      
      return date.toLocaleDateString('en-PH', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  };
}

