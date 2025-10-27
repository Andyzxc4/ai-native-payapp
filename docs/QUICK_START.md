# Quick Start Guide

## 🚀 Get Started in 3 Steps

### Step 1: Install Dependencies
```bash
cd /Users/andre-d.lacra/ai-native-projects/payment-app-1
npm install
```

### Step 2: Initialize Database
```bash
npm run init-db
```

### Step 3: Start the Application
```bash
npm start
```

The application will be available at: **http://localhost:3000**

## 🔐 Login Credentials

### User 1 (Andres Lacra)
- **Email**: `andres.lacra@example.com`
- **Password**: `password123`
- **Initial Balance**: ₱10,000

### User 2 (Maria Cruz)
- **Email**: `maria.cruz@example.com`
- **Password**: `password123`
- **Initial Balance**: ₱10,000

## 📝 How to Test the Application

### Test Scenario 1: Login
1. Open http://localhost:3000
2. Enter User 1 credentials
3. Listen for audio confirmation: "Welcome back, Andres Lacra. Login successful."
4. You'll be redirected to the dashboard

### Test Scenario 2: Send Payment
1. On the dashboard, you'll see your balance (₱10,000)
2. In the "Send Money" form:
   - Start typing "maria" in the recipient field
   - Select "Maria Cruz" from the autocomplete suggestions
   - Enter amount: `500`
3. Click "Send Payment"
4. Listen for audio: "Payment successful. You sent 500 pesos to Maria Cruz. Your new balance is 9500 pesos."
5. Watch your balance update to ₱9,500
6. See the transaction appear in "Recent Transactions"

### Test Scenario 3: View Received Payment
1. Logout (click "Logout" button in the top right)
2. Login as User 2 (maria.cruz@example.com)
3. You'll see balance of ₱10,500 (original 10,000 + 500 received)
4. View the transaction in history showing "+₱500" from Andres Lacra

### Test Scenario 4: Error Handling
1. Try sending ₱11,000 (more than your balance)
2. Listen for audio: "Payment failed. Insufficient balance"
3. See error message displayed

## 🎵 Audio Features

The application uses Text-to-Speech (TTS) for:
- Login confirmations
- Successful payments with details
- Error messages
- Logout confirmations

**Note**: Make sure your browser supports Web Speech API (Chrome, Edge, Safari) and volume is not muted.

## 🛑 Stop the Server

Press `Ctrl + C` in the terminal where the server is running.

## 🔄 Reset Database

To reset the database to initial state:
```bash
rm payment.db
npm run init-db
```

## 🐛 Troubleshooting

### Server not starting?
- Check if port 3000 is already in use
- Change port in `.env` file: `PORT=3001`

### Audio not working?
- Check browser compatibility (use Chrome, Edge, or Safari)
- Verify browser audio permissions
- Ensure volume is not muted

### Database errors?
- Remove and recreate: `rm payment.db && npm run init-db`

## 📱 Browser Support

- ✅ Google Chrome (Recommended)
- ✅ Microsoft Edge
- ✅ Safari
- ⚠️ Firefox (limited TTS support)

## 🎯 Key Features to Test

1. **Session Persistence**: Login, refresh the page, you'll still be logged in
2. **Real-time Balance Updates**: Send money and watch balance update instantly
3. **Transaction History**: All transactions are logged and displayed
4. **Auto-complete Recipients**: Start typing to see suggestions
5. **Audio Feedback**: Every action has voice confirmation
6. **Responsive Design**: Try on different screen sizes
7. **Error Handling**: Try invalid operations (insufficient funds, self-transfer, etc.)

Enjoy testing your payment application! 🎉

