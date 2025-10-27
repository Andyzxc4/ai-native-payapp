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
    activeTab: 'send',
    qrMode: 'receive',
    stats: {
      totalSentToday: 0,
      totalReceived: 0,
      transactionCount: 0
    },
    qr: {
      loaded: false,
      dataUrl: '',
      url: '',
      networkIP: '',
      port: ''
    },
    paymentQr: {
      loaded: false,
      dataUrl: '',
      userData: {
        name: '',
        email: ''
      }
    },
    scanner: {
      active: false,
      scanning: false,
      instance: null
    },
    paymentModal: {
      show: false,
      recipient: {
        id: null,
        name: '',
        email: ''
      },
      amount: '',
      sending: false
    },
    chatMessages: [],
    chatInput: '',
    chatTyping: false,
    voiceListening: false,
    recognition: null,
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
      this.initVoiceRecognition();
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

        // Reload data (this will also recalculate stats)
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
          this.calculateStats();
        }
      } catch (error) {
        console.error('Failed to load transactions:', error);
      }
    },

    calculateStats() {
      // Get today's date at midnight
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      let totalSentToday = 0;
      let totalReceived = 0;
      let transactionCount = this.transactions.length;

      this.transactions.forEach(transaction => {
        const transactionDate = new Date(transaction.timestamp);
        transactionDate.setHours(0, 0, 0, 0);
        
        if (transaction.type === 'sent') {
          totalReceived += transaction.amount; // Money they received from others
          // Check if sent today
          if (transactionDate.getTime() === today.getTime()) {
            // This is money I sent today (but in transactions, if type is 'sent', it's actually received by me)
            // Wait, let me reconsider...
            // If type === 'sent', that means I sent it to someone
            // If type === 'received', that means I received it from someone
          }
        } else if (transaction.type === 'received') {
          totalReceived += transaction.amount;
        }
      });

      // Recalculate properly
      totalSentToday = 0;
      totalReceived = 0;

      this.transactions.forEach(transaction => {
        const transactionDate = new Date(transaction.timestamp);
        transactionDate.setHours(0, 0, 0, 0);
        
        if (transaction.type === 'sent') {
          // Money I sent
          if (transactionDate.getTime() === today.getTime()) {
            totalSentToday += transaction.amount;
          }
        } else if (transaction.type === 'received') {
          // Money I received (all time)
          totalReceived += transaction.amount;
        }
      });

      this.stats = {
        totalSentToday: totalSentToday,
        totalReceived: totalReceived,
        transactionCount: transactionCount
      };
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

    async switchToQRTab() {
      this.activeTab = 'qr';
      if (!this.paymentQr.loaded) {
        await this.generatePaymentQRCode();
      }
    },

    async generateQRCode() {
      this.qr.loaded = false;
      try {
        const response = await fetch('/api/generate-qr');
        if (!response.ok) {
          throw new Error('Failed to generate QR code');
        }

        const data = await response.json();
        this.qr.dataUrl = data.qrCode;
        this.qr.url = data.url;
        this.qr.networkIP = data.networkIP;
        this.qr.port = data.port;
        this.qr.loaded = true;

        this.showAlert('success', 'QR code generated successfully!');
      } catch (error) {
        console.error('QR generation failed:', error);
        this.showAlert('error', 'Failed to generate QR code. Please try again.');
      }
    },

    async generatePaymentQRCode() {
      this.paymentQr.loaded = false;
      try {
        const response = await fetch('/api/generate-payment-qr');
        if (!response.ok) {
          throw new Error('Failed to generate payment QR code');
        }

        const data = await response.json();
        this.paymentQr.dataUrl = data.qrCode;
        this.paymentQr.userData = data.userData;
        this.paymentQr.loaded = true;
      } catch (error) {
        console.error('Payment QR generation failed:', error);
        this.showAlert('error', 'Failed to generate payment QR code. Please try again.');
      }
    },

    async startScanner() {
      try {
        this.scanner.active = true;
        this.scanner.scanning = true;

        // Initialize the QR scanner
        if (!this.scanner.instance) {
          this.scanner.instance = new Html5Qrcode("qr-reader");
        }

        const config = {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        };

        // Request camera permission explicitly
        try {
          // Try to get camera permissions first
          await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: "environment" } 
          }).then(stream => {
            // Stop the stream immediately as Html5Qrcode will request it again
            stream.getTracks().forEach(track => track.stop());
          });
        } catch (permError) {
          console.error('Camera permission error:', permError);
          throw new Error('Camera access denied. Please enable camera permissions in your browser settings.');
        }

        // Now start the scanner
        await this.scanner.instance.start(
          { facingMode: "environment" }, // Use back camera on mobile
          config,
          (decodedText) => {
            this.onScanSuccess(decodedText);
          },
          (errorMessage) => {
            // Ignore scan errors (they happen continuously while scanning)
          }
        );
        
        this.speak('Camera started. Point at QR code to scan.');
      } catch (error) {
        console.error('Scanner start error:', error);
        const errorMsg = error.message || 'Failed to start camera. Please allow camera access in browser settings.';
        this.showAlert('error', errorMsg);
        this.speak('Camera access failed. Please check your browser permissions.');
        this.scanner.active = false;
        this.scanner.scanning = false;
      }
    },

    async stopScanner() {
      try {
        if (this.scanner.instance) {
          await this.scanner.instance.stop();
        }
        this.scanner.active = false;
        this.scanner.scanning = false;
        this.speak('Camera stopped.');
      } catch (error) {
        console.error('Scanner stop error:', error);
        this.scanner.active = false;
        this.scanner.scanning = false;
      }
    },

    async scanFromImage(event) {
      const file = event.target.files[0];
      if (!file) return;

      try {
        this.speak('Scanning QR code from image. Please wait.');

        // Create scanner instance if not exists
        if (!this.scanner.instance) {
          this.scanner.instance = new Html5Qrcode("qr-reader");
        }

        // Scan the image file
        const decodedText = await this.scanner.instance.scanFile(file, true);
        
        // Process the scanned QR code
        await this.onScanSuccess(decodedText);
        
      } catch (error) {
        console.error('Image scan error:', error);
        this.showAlert('error', 'Could not scan QR code from image. Please try again or use camera scanner.');
        this.speak('Failed to scan QR code from image. Please try again.');
      } finally {
        // Reset file input
        event.target.value = '';
      }
    },

    async onScanSuccess(decodedText) {
      // Stop scanner if it's active
      if (this.scanner.active) {
        await this.stopScanner();
      }

      // Vibrate if supported (mobile feedback)
      if (navigator.vibrate) {
        navigator.vibrate(200);
      }

      try {
        // Decode the QR data
        const response = await fetch('/api/decode-payment-qr', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ qrData: decodedText })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Invalid QR code');
        }

        // Open payment modal with recipient info
        this.paymentModal.recipient = data.recipient;
        this.paymentModal.amount = '';
        this.paymentModal.show = true;

        this.speak(`QR code scanned successfully for ${data.recipient.name}. Please enter the amount to send.`);
      } catch (error) {
        console.error('QR decode error:', error);
        this.showAlert('error', error.message);
        this.speak(`Scan failed. ${error.message}. Please try again.`);
      }
    },

    async sendPaymentFromQR() {
      this.paymentModal.sending = true;
      
      try {
        const amount = parseFloat(this.paymentModal.amount);
        const recipientName = this.paymentModal.recipient.name;
        
        const response = await fetch('/api/send-payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            receiverEmail: this.paymentModal.recipient.email,
            amount: amount
          })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Payment failed');
        }

        // Success - Vibrate on mobile
        if (navigator.vibrate) {
          navigator.vibrate([100, 50, 100]); // Success pattern
        }

        // Success message
        this.showAlert('success', `Payment of ₱${this.formatMoney(amount)} sent successfully to ${recipientName}!`);
        
        // Voice announcement for success
        this.speak(`Payment successful! You sent ${amount} pesos to ${recipientName}. Your new balance is ${data.transaction.newBalance} pesos.`);

        // Close modal and refresh data (this will also recalculate stats)
        this.closePaymentModal();
        await this.checkSession();
        await this.loadTransactions();

      } catch (error) {
        // Error - Different vibration pattern
        if (navigator.vibrate) {
          navigator.vibrate([200, 100, 200, 100, 200]); // Error pattern
        }
        
        // Error message
        this.showAlert('error', error.message);
        
        // Voice announcement for failure
        this.speak(`Payment failed. ${error.message}. Please try again.`);
      } finally {
        this.paymentModal.sending = false;
      }
    },

    closePaymentModal() {
      this.paymentModal.show = false;
      this.paymentModal.amount = '';
      this.paymentModal.recipient = {
        id: null,
        name: '',
        email: ''
      };
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
    },

    // ===== HELPDESK CHATBOT FUNCTIONS =====

    initVoiceRecognition() {
      // Check if browser supports speech recognition
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.lang = 'en-US';

        this.recognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          this.chatInput = transcript;
          this.voiceListening = false;
          // Auto-send after voice input
          setTimeout(() => this.sendChatMessage(), 500);
        };

        this.recognition.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          this.voiceListening = false;
          this.showAlert('error', 'Voice input failed. Please try again or type your question.');
        };

        this.recognition.onend = () => {
          this.voiceListening = false;
        };
      }
    },

    toggleVoiceInput() {
      if (!this.recognition) {
        this.showAlert('error', 'Voice input is not supported in this browser. Please type your question.');
        return;
      }

      if (this.voiceListening) {
        this.recognition.stop();
        this.voiceListening = false;
      } else {
        this.chatInput = '';
        this.recognition.start();
        this.voiceListening = true;
        this.speak('I\'m listening. Please speak your question now.');
      }
    },

    async sendChatMessage() {
      const message = this.chatInput.trim();
      if (!message) return;

      // Add user message
      this.addChatMessage('user', message);
      this.chatInput = '';

      // Show typing indicator
      this.chatTyping = true;

      // Simulate thinking delay
      await new Promise(resolve => setTimeout(resolve, 800));

      // Get bot response
      const response = this.getBotResponse(message);
      
      // Add bot response
      this.addChatMessage('bot', response);
      this.chatTyping = false;

      // Speak the response
      this.speak(response);

      // Scroll to bottom
      this.scrollChatToBottom();
    },

    addChatMessage(type, text) {
      const now = new Date();
      const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      
      this.chatMessages.push({
        type: type,
        text: text,
        time: time,
        timestamp: now
      });

      // Scroll after message is added
      setTimeout(() => this.scrollChatToBottom(), 100);
    },

    scrollChatToBottom() {
      const chatContainer = document.getElementById('chat-messages');
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    },

    clearChat() {
      this.chatMessages = [];
      this.speak('Chat cleared. How can I help you?');
    },

    getBotResponse(question) {
      const q = question.toLowerCase();

      // Knowledge base for app-related questions
      const responses = {
        // Payment-related
        send: {
          keywords: ['send', 'transfer', 'pay', 'payment', 'money', 'give'],
          response: "To send money:\n1. Go to the 'Send Money' tab\n2. Enter the recipient's email address\n3. Enter the amount you want to send\n4. Click 'Send Payment'\n\nYou can also use the 'QR Code' tab to scan someone's payment QR code for faster transactions!"
        },
        receive: {
          keywords: ['receive', 'get paid', 'incoming', 'collect'],
          response: "To receive money:\n1. Go to the 'QR Code' tab\n2. Click 'Receive Money' to generate your payment QR code\n3. Show this QR code to the person who wants to pay you\n4. They scan it and send the payment\n\nYou'll receive a notification when someone sends you money!"
        },
        qr: {
          keywords: ['qr', 'qr code', 'scan', 'camera', 'quick'],
          response: "QR Code payments are easy!\n\n📱 To receive money:\n• Go to 'QR Code' tab → 'Receive Money'\n• Show your QR code to the payer\n\n📸 To pay someone:\n• Go to 'QR Code' tab → 'Scan QR Code'\n• Click 'Start Camera Scanner' or 'Upload QR Code Image'\n• Scan their QR code\n• Enter amount and send!"
        },
        balance: {
          keywords: ['balance', 'money', 'how much', 'account', 'funds'],
          response: "Your current balance is displayed at the top of your dashboard in a large card.\n\nIt shows:\n• Available Balance in ₱\n• Your email address\n\nYour balance updates automatically after each transaction!"
        },
        history: {
          keywords: ['history', 'transactions', 'past', 'previous', 'record', 'log'],
          response: "To view your transaction history:\n1. Click the 'History' tab\n2. You'll see all your sent and received payments\n3. Each transaction shows:\n   • Date and time\n   • Amount (red for sent, green for received)\n   • Recipient/Sender name and email\n\nClick the refresh button to update your history!"
        },
        helpdesk: {
          keywords: ['help', 'support', 'assistant', 'chatbot', 'question'],
          response: "I'm your PayApp Assistant! I can help you with:\n• Sending and receiving payments\n• Using QR code features\n• Viewing transaction history\n• Managing your account\n• Understanding app features\n\nJust ask me anything about the app, and I'll do my best to help!"
        },
        login: {
          keywords: ['login', 'log in', 'sign in', 'access', 'account'],
          response: "To login:\n1. Go to the login page\n2. Enter your email address\n3. Enter your password\n4. Click 'Login'\n\nIf you're on mobile, you can also scan the network access QR code from another device to quickly access the app!"
        },
        logout: {
          keywords: ['logout', 'log out', 'sign out', 'exit'],
          response: "To logout:\n1. Click the 'Logout' button in the top-right corner of the dashboard\n2. You'll be redirected to the login page\n\nMake sure to logout when using shared devices for security!"
        },
        security: {
          keywords: ['security', 'safe', 'secure', 'protect', 'password', 'privacy'],
          response: "Security tips:\n• Never share your password\n• Always logout on shared devices\n• Verify recipient email before sending money\n• Use strong, unique passwords\n• Keep your balance information private\n\nPayApp uses secure session management to protect your account!"
        },
        error: {
          keywords: ['error', 'problem', 'issue', 'bug', 'not working', 'broken'],
          response: "If you're experiencing issues:\n1. Try refreshing the page (Cmd+Shift+R or Ctrl+Shift+R)\n2. Check your internet connection\n3. Clear your browser cache\n4. Make sure you're logged in\n5. Check if you have sufficient balance for payments\n\nIf the problem persists, contact support!"
        }
      };

      // Check for matching keywords
      for (const [category, data] of Object.entries(responses)) {
        for (const keyword of data.keywords) {
          if (q.includes(keyword)) {
            return data.response;
          }
        }
      }

      // Greetings
      if (q.match(/\b(hi|hello|hey|greetings)\b/)) {
        return "Hello! 👋 I'm your PayApp Assistant. I can help you with payments, QR codes, transaction history, and more. What would you like to know?";
      }

      // Thanks
      if (q.match(/\b(thank|thanks|thx)\b/)) {
        return "You're welcome! Feel free to ask if you need any more help with PayApp! 😊";
      }

      // Default response for irrelevant questions
      return "We can't solve this issue for now. I'm designed to help with PayApp-related questions only, such as:\n• Sending and receiving payments\n• Using QR code features\n• Viewing transaction history\n• Managing your account\n\nPlease ask me about these topics!";
    }
  };
}

