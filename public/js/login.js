function loginApp() {
  return {
    email: '',
    password: '',
    loading: false,
    error: '',
    success: '',

    async login() {
      this.error = '';
      this.success = '';
      this.loading = true;

      try {
        const response = await fetch('/api/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: this.email,
            password: this.password
          })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Login failed');
        }

        this.success = 'Login successful! Redirecting...';
        
        // Speak success message
        this.speak(`Welcome back, ${data.user.name}. Login successful.`);

        // Redirect to dashboard
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1000);

      } catch (error) {
        this.error = error.message;
        this.speak(`Login failed. ${error.message}`);
      } finally {
        this.loading = false;
      }
    },

    speak(text) {
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        window.speechSynthesis.speak(utterance);
      }
    }
  };
}

