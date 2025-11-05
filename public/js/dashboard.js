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
    otpModal: {
      show: false,
      otpId: null,
      code: ['', '', '', '', '', ''],
      recipient: {
        name: '',
        email: ''
      },
      amount: 0,
      expiresIn: 5,
      verifying: false,
      attemptsLeft: 3,
      locked: false,
      lockoutMinutes: 0,
      error: ''
    },
    chatMessages: [],
    chatInput: '',
    chatTyping: false,
    voiceListening: false,
    recognition: null,
    chatContext: {
      lastTopic: null,
      userName: null
    },
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
        // Request OTP for payment confirmation
        await this.requestOTP(this.payment.receiverEmail, parseFloat(this.payment.amount));
        
        // Reset loading state
        this.payment.loading = false;
      } catch (error) {
        this.showAlert('error', error.message);
        this.speak(error.message);
        this.payment.loading = false;
      }
    },

    async requestOTP(receiverEmail, amount) {
      try {
        const response = await fetch('/api/request-otp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            receiverEmail: receiverEmail,
            amount: amount
          })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to request OTP');
        }

        // Show OTP modal
        this.otpModal.show = true;
        this.otpModal.otpId = data.otpId;
        this.otpModal.recipient.name = data.recipient.name;
        this.otpModal.recipient.email = data.recipient.email;
        this.otpModal.amount = amount;
        this.otpModal.expiresIn = data.expiresIn;
        this.otpModal.code = ['', '', '', '', '', ''];
        this.otpModal.error = '';
        this.otpModal.attemptsLeft = 3;
        this.otpModal.locked = false;

        // TTS notification
        this.speak(`OTP generated. Please enter the 6-digit code: ${data.code.split('').join(', ')}. The code expires in ${data.expiresIn} minutes.`);

        // Focus on first OTP input
        setTimeout(() => {
          const firstInput = document.querySelector('.otp-input');
          if (firstInput) firstInput.focus();
        }, 100);
      } catch (error) {
        throw error;
      }
    },

    handleOTPInput(index, event) {
      const value = event.target.value;
      
      // Only allow digits
      if (!/^\d*$/.test(value)) {
        event.target.value = '';
        return;
      }

      // Update code array
      this.otpModal.code[index] = value.slice(-1);

      // Auto-focus next input
      if (value && index < 5) {
        const nextInput = document.querySelector(`[data-otp-index="${index + 1}"]`);
        if (nextInput) nextInput.focus();
      }

      // Auto-submit when all 6 digits entered
      if (index === 5 && value) {
        this.verifyOTP();
      }
    },

    handleOTPKeydown(index, event) {
      // Handle backspace
      if (event.key === 'Backspace' && !this.otpModal.code[index] && index > 0) {
        const prevInput = document.querySelector(`[data-otp-index="${index - 1}"]`);
        if (prevInput) {
          prevInput.focus();
          this.otpModal.code[index - 1] = '';
        }
      }
    },

    handleOTPPaste(event) {
      event.preventDefault();
      const paste = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
      
      for (let i = 0; i < paste.length && i < 6; i++) {
        this.otpModal.code[i] = paste[i];
      }

      // Focus last filled input or verify if complete
      if (paste.length === 6) {
        this.verifyOTP();
      } else if (paste.length > 0) {
        const nextInput = document.querySelector(`[data-otp-index="${paste.length}"]`);
        if (nextInput) nextInput.focus();
      }
    },

    async verifyOTP() {
      if (this.otpModal.verifying || this.otpModal.locked) return;

      const code = this.otpModal.code.join('');
      if (code.length !== 6) {
        this.otpModal.error = 'Please enter all 6 digits';
        return;
      }

      this.otpModal.verifying = true;
      this.otpModal.error = '';

      try {
        const response = await fetch('/api/verify-otp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            otpId: this.otpModal.otpId,
            code: code
          })
        });

        const data = await response.json();

        if (!response.ok) {
          // Handle lockout
          if (data.locked) {
            this.otpModal.locked = true;
            this.otpModal.lockoutMinutes = data.lockoutMinutes;
            this.otpModal.error = data.error;
            this.speak(data.error);
            return;
          }

          // Handle invalid OTP
          this.otpModal.attemptsLeft = data.attemptsLeft || 0;
          this.otpModal.error = `${data.error}. ${this.otpModal.attemptsLeft} attempt(s) left.`;
          this.otpModal.code = ['', '', '', '', '', ''];
          
          // Focus first input
          setTimeout(() => {
            const firstInput = document.querySelector('.otp-input');
            if (firstInput) firstInput.focus();
          }, 100);

          throw new Error(data.error);
        }

        // Success!
        this.closeOTPModal();
        
        // Success
        this.showAlert('success', `Payment of ₱${this.formatMoney(this.otpModal.amount)} sent successfully to ${this.otpModal.recipient.name}!`);
        
        // TTS success message
        this.speak(`Payment successful. You sent ${this.otpModal.amount} pesos to ${this.otpModal.recipient.name}. Your new balance is ${data.transaction.newBalance} pesos.`);

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
      let totalSentToday = 0;
      let totalReceived = 0;
      let transactionCount = this.transactions.length;

      // Get today's date in YYYY-MM-DD format for comparison
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0]; // e.g., "2025-10-27"

      this.transactions.forEach(transaction => {
        // Extract date from timestamp (handles both Date objects and strings)
        let transactionDateStr;
        if (typeof transaction.timestamp === 'string') {
          // If timestamp is a string like "2025-10-27 14:30:00" or "2025-10-27T14:30:00"
          transactionDateStr = transaction.timestamp.split(' ')[0].split('T')[0];
        } else {
          // If it's a Date object
          transactionDateStr = new Date(transaction.timestamp).toISOString().split('T')[0];
        }
        
        if (transaction.type === 'sent') {
          // Money I sent - count only today's
          if (transactionDateStr === todayStr) {
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

      console.log('Stats calculated:', this.stats); // Debug log
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

    closeOTPModal() {
      this.otpModal.show = false;
      this.otpModal.otpId = null;
      this.otpModal.code = ['', '', '', '', '', ''];
      this.otpModal.error = '';
      this.otpModal.verifying = false;
      this.otpModal.locked = false;
      this.otpModal.lockoutMinutes = 0;
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
          } else if (data.type === 'otp_generated') {
            // OTP generated notification (already handled in requestOTP)
            console.log('OTP generated via SSE:', data);
          } else if (data.type === 'otp_lockout') {
            // Lockout notification
            this.showAlert('error', data.message);
            this.speak(data.message);
          } else if (data.type === 'payment_success') {
            // Payment success notification
            this.checkSession();
            this.loadTransactions();
          } else if (data.type === 'payment_received') {
            // Received payment notification
            this.showAlert('success', `You received ₱${this.formatMoney(data.amount)} from ${data.sender}!`);
            this.speak(`You received ${data.amount} pesos from ${data.sender}`);
            this.checkSession();
            this.loadTransactions();
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
      await new Promise(resolve => setTimeout(resolve, 600));

      // Get bot response (now async to fetch real data)
      const response = await this.getBotResponse(message);
      
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
      this.chatContext = {
        lastTopic: null,
        userName: null
      };
      this.speak('Chat cleared. How can I help you?');
    },

    async getBotResponse(question) {
      const q = question.toLowerCase();

      // Set user name context
      if (!this.chatContext.userName && this.user.name) {
        this.chatContext.userName = this.user.name.split(' ')[0]; // First name
      }

      // === CONVERSATIONAL RESPONSES ===
      
      // Greetings
      if (q.match(/\b(hi|hello|hey|greetings|good morning|good afternoon|good evening)\b/)) {
        const greetings = [
          `Hello ${this.chatContext.userName || 'there'}! 👋 I'm your PayApp Assistant. How can I help you today?`,
          `Hi ${this.chatContext.userName || 'there'}! Great to see you! What can I help you with?`,
          `Hey ${this.chatContext.userName || 'there'}! 😊 I'm here to help. What do you need?`
        ];
        return greetings[Math.floor(Math.random() * greetings.length)];
      }

      // How are you / How's it going
      if (q.match(/\b(how are you|how's it going|how do you do|what's up|wassup)\b/)) {
        const responses = [
          `I'm doing great, thanks for asking! 😊 How can I assist you with your PayApp account today?`,
          `I'm fantastic! Ready to help you with anything you need. What can I do for you?`,
          `I'm doing wonderful! How about you? What can I help you with today?`
        ];
        return responses[Math.floor(Math.random() * responses.length)];
      }

      // What's your name
      if (q.match(/\b(what's your name|who are you|what are you called|your name)\b/)) {
        return `I'm your friendly PayApp Assistant! 🤖 I'm here to help you with payments, transactions, and anything related to your account. What would you like to know?`;
      }

      // Thanks
      if (q.match(/\b(thank|thanks|thx|appreciate)\b/)) {
        const thanks = [
          `You're very welcome! 😊 Is there anything else I can help you with?`,
          `Happy to help! Feel free to ask if you need anything else.`,
          `My pleasure! Let me know if you have any other questions.`
        ];
        return thanks[Math.floor(Math.random() * thanks.length)];
      }

      // Goodbye
      if (q.match(/\b(bye|goodbye|see you|later|cya)\b/)) {
        return `Goodbye ${this.chatContext.userName || 'there'}! Have a great day! 👋 Come back if you need any help.`;
      }

      // === REAL-TIME DATA QUERIES ===

      // Balance inquiry - SHOW ACTUAL BALANCE
      if (q.match(/\b(balance|how much money|my funds|account balance|check balance)\b/) && 
          q.match(/\b(what|show|tell|check|my|current)\b/)) {
        this.chatContext.lastTopic = 'balance';
        const balance = this.formatMoney(this.user.balance);
        return `Your current balance is ₱${balance}. ${this.user.balance < 100 ? '💡 Looks like your balance is running low.' : '✅ You have sufficient funds for transactions.'}`;
      }

      // Transaction history inquiry - SHOW ACTUAL TRANSACTIONS
      if (q.match(/\b(transaction|history|past payment|previous payment|recent transaction)\b/) &&
          q.match(/\b(what|show|tell|view|see|my)\b/) &&
          !q.match(/\b(how do|how to|how can)\b/)) {
        this.chatContext.lastTopic = 'transactions';
        
        if (this.transactions.length === 0) {
          return `You don't have any transactions yet. Once you send or receive money, they'll show up in your transaction history! 💸`;
        }

        const recentTransactions = this.transactions.slice(0, 5); // Get last 5 transactions
        let response = `Here are your recent transactions:\n\n`;
        
        recentTransactions.forEach((tx, index) => {
          const type = tx.type === 'sent' ? '📤 Sent' : '📥 Received';
          const amount = this.formatMoney(tx.amount);
          const party = tx.otherParty.name;
          const timeAgo = this.formatDate(tx.timestamp);
          response += `${index + 1}. ${type} ₱${amount} ${tx.type === 'sent' ? 'to' : 'from'} ${party} (${timeAgo})\n`;
        });

        if (this.transactions.length > 5) {
          response += `\n... and ${this.transactions.length - 5} more transactions. Visit the History tab to see all!`;
        }

        return response;
      }

      // Stats inquiry - SHOW ACTUAL STATS
      if (q.match(/\b(how much|total|spent|received|statistics|stats)\b/) &&
          q.match(/\b(today|sent|received)\b/)) {
        this.chatContext.lastTopic = 'stats';
        const sentToday = this.formatMoney(this.stats.totalSentToday);
        const received = this.formatMoney(this.stats.totalReceived);
        const count = this.stats.transactionCount;
        
        return `📊 Here are your statistics:\n\n• Today's Sent: ₱${sentToday}\n• Total Received: ₱${received}\n• Transaction Count: ${count}\n\nYou can see these stats in the Quick Info box on the Send Money tab!`;
      }

      // Check if can afford amount
      if (q.match(/\b(can i|am i able|do i have enough|afford)\b/) && 
          q.match(/\b(send|pay|transfer)\b/)) {
        const amountMatch = q.match(/(\d+)/);
        if (amountMatch) {
          const amount = parseInt(amountMatch[0]);
          const balance = this.user.balance;
          if (balance >= amount) {
            return `Yes! ✅ You have ₱${this.formatMoney(balance)}, so you can send ₱${amount}. Would you like to send money now? Go to the Send Money tab!`;
          } else {
            const needed = amount - balance;
            return `Sorry, you don't have enough balance. ❌ You need ₱${this.formatMoney(needed)} more. Your current balance is ₱${this.formatMoney(balance)}.`;
          }
        }
        return `Your current balance is ₱${this.formatMoney(this.user.balance)}. How much would you like to send?`;
      }

      // === ENHANCED KNOWLEDGE BASE ===
      
      const responses = {
        // Payment-related
        send: {
          keywords: ['how to send', 'how do i send', 'how can i send', 'send money to', 'transfer money', 'make payment'],
          response: `To send money:\n1. Go to the 'Send Money' tab\n2. Enter the recipient's email address\n3. Enter the amount you want to send\n4. Click 'Send Payment'\n\n💡 Pro tip: You can also use the 'QR Code' tab to scan someone's payment QR code for faster transactions! Your current balance is ₱${this.formatMoney(this.user.balance)}.`
        },
        receive: {
          keywords: ['how to receive', 'how do i receive', 'get paid', 'collect money', 'receive payment'],
          response: "To receive money:\n1. Go to the 'QR Code' tab\n2. Click 'Receive Money' to generate your payment QR code\n3. Show this QR code to the person who wants to pay you\n4. They scan it and send the payment\n\n✨ You'll receive a notification when someone sends you money! Your balance will update automatically."
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
          keywords: ['how to view history', 'how do i see', 'where is history', 'find transactions', 'view my transactions'],
          response: `To view your transaction history:\n1. Click the 'History' tab (last tab on the right)\n2. You'll see all your sent and received payments\n3. Each transaction shows:\n   • Date and time\n   • Amount (red for sent, green for received)\n   • Recipient/Sender name and email\n\n📊 You currently have ${this.stats.transactionCount} transactions. Click the refresh button to update your history!`
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

      // === MORE CONVERSATIONAL HANDLING ===

      // Phone number payments
      if (q.match(/\b(phone number|mobile number|contact number)\b/) && 
          q.match(/\b(send|pay|transfer)\b/)) {
        return `Currently, you can only send money to registered email addresses. 📧 We don't support phone number payments yet. Would you like to send money using an email address instead? Just go to the Send Money tab!`;
      }

      // Multiple recipients
      if (q.match(/\b(multiple|many|several)\b/) && 
          q.match(/\b(people|recipients|users)\b/)) {
        return `Right now, you can send money to one person at a time. For multiple payments, just repeat the process for each recipient. Quick tip: Use the QR Code feature for faster repeated payments! 🚀`;
      }

      // Payment limits
      if (q.match(/\b(limit|maximum|max|minimum|min)\b/) && 
          q.match(/\b(send|payment|transfer)\b/)) {
        return `You can send any amount as long as you have sufficient balance! Your current balance is ₱${this.formatMoney(this.user.balance)}. The only limit is what's in your account. 💰`;
      }

      // Cancel payment
      if (q.match(/\b(cancel|undo|reverse|refund)\b/) && 
          q.match(/\b(payment|transaction|transfer)\b/)) {
        return `⚠️ Payments are instant and cannot be cancelled or reversed once sent. Always double-check the recipient's email and amount before confirming. Stay safe! 🔒`;
      }

      // Check for matching keywords in knowledge base
      for (const [category, data] of Object.entries(responses)) {
        for (const keyword of data.keywords) {
          if (q.includes(keyword)) {
            this.chatContext.lastTopic = category;
            return data.response;
          }
        }
      }

      // === FRIENDLY FALLBACKS FOR NON-APP QUESTIONS ===

      // Jokes
      if (q.match(/\b(joke|funny|laugh)\b/)) {
        return `I can't tell jokes, but I can help make your payments smooth and stress-free! 😊 That's pretty cool, right? What can I help you with today?`;
      }

      // Weather
      if (q.match(/\b(weather|temperature|forecast)\b/)) {
        return `I don't have weather information, but I can help you with your PayApp account! ⛅ What would you like to know about payments or transactions?`;
      }

      // Food/Restaurant
      if (q.match(/\b(food|restaurant|eat|hungry)\b/)) {
        return `I can't help with food recommendations, but I can help you send money to pay for meals! 🍔 Need to send someone money? I'm here to help!`;
      }

      // Time/Date
      if (q.match(/\b(time|date|today|day)\b/) && !q.match(/\b(transaction|payment|sent|received)\b/)) {
        const now = new Date();
        const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        return `Today is ${dateStr}, and the time is ${timeStr}. 🕐 How can I help you with your PayApp account?`;
      }

      // Math/Calculations
      if (q.match(/\b(calculate|math|plus|minus|add|subtract)\b/)) {
        return `I'm not a calculator, but I can help you manage your money! 🧮 Want to check your balance or view your transactions? Just ask!`;
      }

      // === CONTEXTUAL FOLLOW-UPS ===
      
      // If user says "yes" or "sure" after certain topics
      if (q.match(/\b(yes|yeah|sure|okay|ok|yep)\b/) && this.chatContext.lastTopic) {
        if (this.chatContext.lastTopic === 'send') {
          return `Great! Go to the 'Send Money' tab, enter the recipient's email and amount, then click 'Send Payment'. Your current balance is ₱${this.formatMoney(this.user.balance)}. 💸`;
        } else if (this.chatContext.lastTopic === 'balance') {
          return `Awesome! Your balance is ₱${this.formatMoney(this.user.balance)}. Need anything else?`;
        }
      }

      // === DEFAULT FRIENDLY FALLBACK ===
      const fallbacks = [
        `I can only help with questions related to your PayApp account. 😊 Try asking me about:\n• Checking your balance\n• Viewing transaction history\n• Sending or receiving money\n• Using QR code payments\n\nWhat would you like to know?`,
        `Hmm, I'm not sure about that, but I'm great at helping with PayApp! 🤖 You can ask me about your balance, transactions, or how to send money. What can I help you with?`,
        `That's outside my expertise, but I'm your PayApp expert! 💪 Ask me anything about payments, balance, or transaction history. How can I assist you?`
      ];
      
      return fallbacks[Math.floor(Math.random() * fallbacks.length)];
    }
  };
}

