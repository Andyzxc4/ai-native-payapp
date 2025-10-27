require('dotenv').config();
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const path = require('path');
const {
  db,
  dbRun,
  getUserByEmail,
  getUserById,
  updateUserBalance,
  insertTransaction,
  getTransactionsByUserId,
  getAllUsers
} = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

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

// Server-Sent Events for real-time updates
app.get('/api/events', isAuthenticated, (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Send initial connection message
  res.write('data: {"type":"connected","message":"Connected to real-time updates"}\n\n');

  // Keep connection alive
  const keepAlive = setInterval(() => {
    res.write('data: {"type":"ping"}\n\n');
  }, 30000);

  // Clean up on client disconnect
  req.on('close', () => {
    clearInterval(keepAlive);
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
app.listen(PORT, () => {
  console.log(`🚀 Payment Application running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('\n💡 To get started:');
  console.log('   1. Run: npm run init-db (if not already done)');
  console.log('   2. Visit: http://localhost:3000');
  console.log('   3. Login with sample credentials\n');
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
