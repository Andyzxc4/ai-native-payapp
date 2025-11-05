require('dotenv').config();
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const path = require('path');
const QRCode = require('qrcode');
const os = require('os');
const {
  db,
  dbRun,
  getUserByEmail,
  getUserById,
  updateUserBalance,
  insertTransaction,
  getTransactionsByUserId,
  getAllUsers,
  insertOTP,
  getOTPById,
  getActiveOTPByUserId,
  verifyOTP,
  insertOTPAttempt,
  getRecentFailedAttempts,
  cleanupExpiredOTPs,
  updateOTPTransactionId
} = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Helper function to get local network IP
function getLocalNetworkIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip internal (loopback) and non-IPv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost'; // fallback
}

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true if using HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Authentication middleware
const isAuthenticated = (req, res, next) => {
  if (req.session.userId) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized. Please login.' });
  }
};

// SSE clients registry for OTP notifications
const sseClients = new Map();

// OTP Configuration
const OTP_CONFIG = {
  LENGTH: 6,
  EXPIRY_MINUTES: 5,
  MAX_ATTEMPTS: 3,
  LOCKOUT_MINUTES: 10,
  ATTEMPT_WINDOW_MINUTES: 5
};

// Helper: Generate random OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Helper: Check if user is locked out
async function isUserLockedOut(userId) {
  const attempts = await getRecentFailedAttempts(userId, OTP_CONFIG.ATTEMPT_WINDOW_MINUTES);
  
  if (attempts.length >= OTP_CONFIG.MAX_ATTEMPTS) {
    const lastAttempt = new Date(attempts[0].attempted_at);
    const lockoutUntil = new Date(lastAttempt.getTime() + OTP_CONFIG.LOCKOUT_MINUTES * 60 * 1000);
    const now = new Date();
    
    if (now < lockoutUntil) {
      const minutesLeft = Math.ceil((lockoutUntil - now) / 60000);
      return { locked: true, minutesLeft };
    }
  }
  
  return { locked: false };
}

// Helper: Send SSE notification
function sendSSENotification(userId, event, data) {
  const client = sseClients.get(userId);
  if (client) {
    client.write(`data: ${JSON.stringify({ type: event, ...data })}\n\n`);
  }
}

// Cleanup expired OTPs every 5 minutes
setInterval(async () => {
  try {
    await cleanupExpiredOTPs();
    console.log('🧹 Cleaned up expired OTPs');
  } catch (error) {
    console.error('Error cleaning up OTPs:', error);
  }
}, 5 * 60 * 1000);

// Routes

// Login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const user = await getUserByEmail(email);

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isValidPassword = bcrypt.compareSync(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Set session
    req.session.userId = user.id;
    req.session.userEmail = user.email;
    req.session.userName = user.name;

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        balance: user.balance
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Logout
app.post('/api/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Could not logout' });
    }
    res.json({ message: 'Logout successful' });
  });
});

// Check session
app.get('/api/session', isAuthenticated, async (req, res) => {
  try {
    const user = await getUserById(req.session.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        balance: user.balance
      }
    });
  } catch (error) {
    console.error('Session check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user profile
app.get('/api/profile', isAuthenticated, async (req, res) => {
  try {
    const user = await getUserById(req.session.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      balance: user.balance
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all users (for searching recipients)
app.get('/api/users', isAuthenticated, async (req, res) => {
  try {
    const users = await getAllUsers();
    // Don't send current user
    const filteredUsers = users.filter(u => u.id !== req.session.userId);
    res.json(filteredUsers);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send payment
app.post('/api/send-payment', isAuthenticated, async (req, res) => {
  const { receiverEmail, amount } = req.body;
  const senderId = req.session.userId;

  if (!receiverEmail || !amount) {
    return res.status(400).json({ error: 'Receiver email and amount are required' });
  }

  if (amount <= 0) {
    return res.status(400).json({ error: 'Amount must be greater than zero' });
  }

  try {
    // Get sender
    const sender = await getUserById(senderId);
    if (!sender) {
      return res.status(404).json({ error: 'Sender not found' });
    }

    // Get receiver
    const receiver = await getUserByEmail(receiverEmail);
    if (!receiver) {
      return res.status(404).json({ error: 'Receiver not found' });
    }

    // Check if sending to self
    if (sender.id === receiver.id) {
      return res.status(400).json({ error: 'Cannot send payment to yourself' });
    }

    // Check sufficient balance
    if (sender.balance < amount) {
      return res.status(400).json({ 
        error: 'Insufficient balance',
        currentBalance: sender.balance,
        requiredAmount: amount
      });
    }

    // Perform transaction using database transaction
    await new Promise((resolve, reject) => {
      db.serialize(async () => {
        try {
          await dbRun('BEGIN TRANSACTION');
          
          // Update sender balance
          const newSenderBalance = sender.balance - amount;
          await updateUserBalance(newSenderBalance, sender.id);

          // Update receiver balance
          const newReceiverBalance = receiver.balance + amount;
          await updateUserBalance(newReceiverBalance, receiver.id);

          // Log transaction
          await insertTransaction(sender.id, receiver.id, amount, 'completed');

          await dbRun('COMMIT');
          resolve();
        } catch (error) {
          await dbRun('ROLLBACK');
          reject(error);
        }
      });
    });

    res.json({
      message: 'Payment successful',
      transaction: {
        sender: sender.name,
        receiver: receiver.name,
        amount: amount,
        newBalance: sender.balance - amount
      }
    });
  } catch (error) {
    console.error('Payment error:', error);
    res.status(500).json({ error: 'Payment failed. Please try again.' });
  }
});

// Request OTP for payment
app.post('/api/request-otp', isAuthenticated, async (req, res) => {
  const { receiverEmail, amount } = req.body;
  const senderId = req.session.userId;

  if (!receiverEmail || !amount) {
    return res.status(400).json({ error: 'Receiver email and amount are required' });
  }

  if (amount <= 0) {
    return res.status(400).json({ error: 'Amount must be greater than zero' });
  }

  try {
    // Check if user is locked out
    const lockoutStatus = await isUserLockedOut(senderId);
    if (lockoutStatus.locked) {
      return res.status(429).json({ 
        error: `Too many failed attempts. Please try again in ${lockoutStatus.minutesLeft} minute(s).`,
        lockoutMinutes: lockoutStatus.minutesLeft
      });
    }

    // Get sender
    const sender = await getUserById(senderId);
    if (!sender) {
      return res.status(404).json({ error: 'Sender not found' });
    }

    // Get receiver
    const receiver = await getUserByEmail(receiverEmail);
    if (!receiver) {
      return res.status(404).json({ error: 'Receiver not found' });
    }

    // Check if sending to self
    if (sender.id === receiver.id) {
      return res.status(400).json({ error: 'Cannot send payment to yourself' });
    }

    // Check sufficient balance
    if (sender.balance < amount) {
      return res.status(400).json({ 
        error: 'Insufficient balance',
        currentBalance: sender.balance,
        requiredAmount: amount
      });
    }

    // Generate OTP
    const otpCode = generateOTP();
    const expiresAt = new Date(Date.now() + OTP_CONFIG.EXPIRY_MINUTES * 60 * 1000).toISOString();

    // Save OTP to database
    const otpResult = await insertOTP(sender.id, otpCode, receiver.id, amount, expiresAt);

    // Log OTP generation
    console.log(`🔐 OTP generated for user ${sender.id}: ${otpCode} (expires at ${expiresAt})`);

    // Send OTP via SSE to the user
    sendSSENotification(sender.id, 'otp_generated', {
      otpId: otpResult.lastID,
      code: otpCode,
      expiresIn: OTP_CONFIG.EXPIRY_MINUTES,
      recipient: {
        name: receiver.name,
        email: receiver.email
      },
      amount: amount
    });

    res.json({
      message: 'OTP generated successfully',
      otpId: otpResult.lastID,
      code: otpCode, // In production, send via SMS/Email instead
      expiresIn: OTP_CONFIG.EXPIRY_MINUTES,
      recipient: {
        name: receiver.name,
        email: receiver.email
      }
    });
  } catch (error) {
    console.error('OTP request error:', error);
    res.status(500).json({ error: 'Failed to generate OTP. Please try again.' });
  }
});

// Verify OTP and complete payment
app.post('/api/verify-otp', isAuthenticated, async (req, res) => {
  const { otpId, code } = req.body;
  const userId = req.session.userId;
  const clientIP = req.ip || req.connection.remoteAddress;

  if (!otpId || !code) {
    return res.status(400).json({ error: 'OTP ID and code are required' });
  }

  try {
    // Check if user is locked out
    const lockoutStatus = await isUserLockedOut(userId);
    if (lockoutStatus.locked) {
      return res.status(429).json({ 
        error: `Too many failed attempts. Please try again in ${lockoutStatus.minutesLeft} minute(s).`,
        lockoutMinutes: lockoutStatus.minutesLeft,
        locked: true
      });
    }

    // Get OTP from database
    const otp = await getOTPById(otpId);

    if (!otp) {
      return res.status(404).json({ error: 'OTP not found' });
    }

    // Check if OTP belongs to the user
    if (otp.user_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized OTP access' });
    }

    // Check if OTP is already verified
    if (otp.verified) {
      return res.status(400).json({ error: 'OTP already used' });
    }

    // Check if OTP is expired
    const now = new Date();
    const expiresAt = new Date(otp.expires_at);
    if (now > expiresAt) {
      await insertOTPAttempt(userId, otpId, code, false, clientIP);
      return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
    }

    // Verify OTP code
    if (otp.code !== code) {
      // Log failed attempt
      await insertOTPAttempt(userId, otpId, code, false, clientIP);
      
      // Check how many failed attempts now
      const recentAttempts = await getRecentFailedAttempts(userId, OTP_CONFIG.ATTEMPT_WINDOW_MINUTES);
      const attemptsLeft = OTP_CONFIG.MAX_ATTEMPTS - recentAttempts.length;

      if (attemptsLeft <= 0) {
        sendSSENotification(userId, 'otp_lockout', {
          message: `Account locked for ${OTP_CONFIG.LOCKOUT_MINUTES} minutes due to too many failed attempts`,
          lockoutMinutes: OTP_CONFIG.LOCKOUT_MINUTES
        });

        return res.status(429).json({ 
          error: `Too many failed attempts. Account locked for ${OTP_CONFIG.LOCKOUT_MINUTES} minutes.`,
          lockoutMinutes: OTP_CONFIG.LOCKOUT_MINUTES,
          locked: true
        });
      }

      return res.status(400).json({ 
        error: 'Invalid OTP code',
        attemptsLeft: attemptsLeft
      });
    }

    // OTP is valid - log successful attempt
    await insertOTPAttempt(userId, otpId, code, true, clientIP);

    // Mark OTP as verified
    await verifyOTP(otpId);

    // Get sender and receiver
    const sender = await getUserById(otp.user_id);
    const receiver = await getUserById(otp.receiver_id);

    if (!sender || !receiver) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check balance again
    if (sender.balance < otp.amount) {
      return res.status(400).json({ 
        error: 'Insufficient balance',
        currentBalance: sender.balance,
        requiredAmount: otp.amount
      });
    }

    // Perform transaction
    await new Promise((resolve, reject) => {
      db.serialize(async () => {
        try {
          await dbRun('BEGIN TRANSACTION');
          
          // Update sender balance
          const newSenderBalance = sender.balance - otp.amount;
          await updateUserBalance(newSenderBalance, sender.id);

          // Update receiver balance
          const newReceiverBalance = receiver.balance + otp.amount;
          await updateUserBalance(newReceiverBalance, receiver.id);

          // Log transaction
          const txResult = await insertTransaction(sender.id, receiver.id, otp.amount, 'completed');
          
          // Update OTP with transaction ID
          await updateOTPTransactionId(otpId, txResult.lastID);

          await dbRun('COMMIT');
          resolve({ transactionId: txResult.lastID, newBalance: newSenderBalance });
        } catch (error) {
          await dbRun('ROLLBACK');
          reject(error);
        }
      });
    }).then(result => {
      // Send success notification via SSE
      sendSSENotification(userId, 'payment_success', {
        transactionId: result.transactionId,
        amount: otp.amount,
        recipient: receiver.name,
        newBalance: result.newBalance
      });

      // Notify receiver
      sendSSENotification(receiver.id, 'payment_received', {
        amount: otp.amount,
        sender: sender.name,
        newBalance: receiver.balance + otp.amount
      });

      res.json({
        message: 'Payment successful',
        transaction: {
          id: result.transactionId,
          sender: sender.name,
          receiver: receiver.name,
          amount: otp.amount,
          newBalance: result.newBalance
        }
      });
    });

  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ error: 'Payment verification failed. Please try again.' });
  }
});

// Get OTP status
app.get('/api/otp-status', isAuthenticated, async (req, res) => {
  const userId = req.session.userId;

  try {
    // Check if user is locked out
    const lockoutStatus = await isUserLockedOut(userId);
    
    // Get active OTP if exists
    const activeOTP = await getActiveOTPByUserId(userId);
    
    // Get recent failed attempts
    const recentAttempts = await getRecentFailedAttempts(userId, OTP_CONFIG.ATTEMPT_WINDOW_MINUTES);
    const attemptsLeft = Math.max(0, OTP_CONFIG.MAX_ATTEMPTS - recentAttempts.length);

    res.json({
      locked: lockoutStatus.locked,
      lockoutMinutes: lockoutStatus.minutesLeft || 0,
      hasActiveOTP: !!activeOTP,
      attemptsLeft: attemptsLeft,
      config: {
        maxAttempts: OTP_CONFIG.MAX_ATTEMPTS,
        lockoutMinutes: OTP_CONFIG.LOCKOUT_MINUTES,
        otpExpiryMinutes: OTP_CONFIG.EXPIRY_MINUTES
      }
    });
  } catch (error) {
    console.error('OTP status error:', error);
    res.status(500).json({ error: 'Failed to get OTP status' });
  }
});

// Get transaction history
app.get('/api/transactions', isAuthenticated, async (req, res) => {
  const userId = req.session.userId;

  try {
    const transactions = await getTransactionsByUserId(userId);
    
    // Format transactions for frontend
    const formattedTransactions = transactions.map(t => ({
      id: t.id,
      type: t.sender_email === req.session.userEmail ? 'sent' : 'received',
      amount: t.amount,
      status: t.status,
      timestamp: t.timestamp,
      otherParty: t.sender_email === req.session.userEmail 
        ? { name: t.receiver_name, email: t.receiver_email }
        : { name: t.sender_name, email: t.sender_email }
    }));

    res.json(formattedTransactions);
  } catch (error) {
    console.error('Transaction history error:', error);
    res.status(500).json({ error: 'Could not fetch transaction history' });
  }
});

// Generate QR Code for receiving payments
app.get('/api/generate-payment-qr', isAuthenticated, async (req, res) => {
  try {
    const user = await getUserById(req.session.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Create payment data object
    const paymentData = {
      type: 'payment_request',
      userId: user.id,
      email: user.email,
      name: user.name,
      timestamp: Date.now()
    };

    // Convert to JSON string for QR code
    const qrData = JSON.stringify(paymentData);
    
    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
      errorCorrectionLevel: 'H', // High error correction for payment data
      type: 'image/png',
      width: 300,
      margin: 2,
      color: {
        dark: '#2563eb', // Blue color
        light: '#ffffff'
      }
    });

    res.json({
      qrCode: qrCodeDataUrl,
      userData: {
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Payment QR generation error:', error);
    res.status(500).json({ error: 'Failed to generate payment QR code' });
  }
});

// Decode payment QR code
app.post('/api/decode-payment-qr', isAuthenticated, async (req, res) => {
  try {
    const { qrData } = req.body;
    
    if (!qrData) {
      return res.status(400).json({ error: 'QR data is required' });
    }

    // Parse the QR data
    const paymentData = JSON.parse(qrData);
    
    // Validate the data structure
    if (paymentData.type !== 'payment_request' || !paymentData.userId) {
      return res.status(400).json({ error: 'Invalid payment QR code' });
    }

    // Get recipient user info
    const recipient = await getUserById(paymentData.userId);
    
    if (!recipient) {
      return res.status(404).json({ error: 'Recipient not found' });
    }

    // Check if trying to pay yourself
    if (recipient.id === req.session.userId) {
      return res.status(400).json({ error: 'Cannot send payment to yourself' });
    }

    res.json({
      recipient: {
        id: recipient.id,
        name: recipient.name,
        email: recipient.email
      }
    });
  } catch (error) {
    console.error('QR decode error:', error);
    res.status(400).json({ error: 'Invalid QR code format' });
  }
});

// Generate QR Code for app access (original feature)
app.get('/api/generate-qr', isAuthenticated, async (req, res) => {
  try {
    const networkIP = getLocalNetworkIP();
    const loginUrl = `http://${networkIP}:${PORT}/`;
    
    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(loginUrl, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      width: 300,
      margin: 2,
      color: {
        dark: '#2563eb', // Blue color
        light: '#ffffff'
      }
    });

    res.json({
      qrCode: qrCodeDataUrl,
      url: loginUrl,
      networkIP: networkIP,
      port: PORT
    });
  } catch (error) {
    console.error('QR generation error:', error);
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

// Server-Sent Events for real-time updates
app.get('/api/events', isAuthenticated, (req, res) => {
  const userId = req.session.userId;
  
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Register client for notifications
  sseClients.set(userId, res);
  console.log(`📡 SSE client connected: User ${userId}`);

  // Send initial connection message
  res.write('data: {"type":"connected","message":"Connected to real-time updates"}\n\n');

  // Keep connection alive
  const keepAlive = setInterval(() => {
    res.write('data: {"type":"ping"}\n\n');
  }, 30000);

  // Clean up on client disconnect
  req.on('close', () => {
    clearInterval(keepAlive);
    sseClients.delete(userId);
    console.log(`📡 SSE client disconnected: User ${userId}`);
    res.end();
  });
});

// Serve HTML pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  const networkIP = getLocalNetworkIP();
  console.log(`🚀 Payment Application running on:`);
  console.log(`   - Local:   http://localhost:${PORT}`);
  console.log(`   - Network: http://${networkIP}:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('\n💡 To get started:');
  console.log('   1. Run: npm run init-db (if not already done)');
  console.log('   2. Visit: http://localhost:3000');
  console.log('   3. Login with sample credentials');
  console.log('   4. Use QR code to access from mobile devices on same network\n');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n👋 Shutting down gracefully...');
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err);
    }
    process.exit(0);
  });
});
