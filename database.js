const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'payment.db'), (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database');
    // Enable foreign keys
    db.run('PRAGMA foreign_keys = ON');
  }
});

// Promisify database queries
const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
};

const dbGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const dbAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

// User queries
const getUserByEmail = async (email) => {
  return dbGet('SELECT * FROM users WHERE email = ?', [email]);
};

const getUserById = async (id) => {
  return dbGet('SELECT * FROM users WHERE id = ?', [id]);
};

const updateUserBalance = async (balance, id) => {
  return dbRun('UPDATE users SET balance = ? WHERE id = ?', [balance, id]);
};

// Transaction queries
const insertTransaction = async (sender_id, receiver_id, amount, status) => {
  return dbRun(
    'INSERT INTO transactions (sender_id, receiver_id, amount, status) VALUES (?, ?, ?, ?)',
    [sender_id, receiver_id, amount, status]
  );
};

const getTransactionsByUserId = async (userId) => {
  return dbAll(
    `SELECT 
      t.id,
      t.amount,
      t.status,
      t.timestamp,
      sender.name as sender_name,
      sender.email as sender_email,
      receiver.name as receiver_name,
      receiver.email as receiver_email
    FROM transactions t
    JOIN users sender ON t.sender_id = sender.id
    JOIN users receiver ON t.receiver_id = receiver.id
    WHERE t.sender_id = ? OR t.receiver_id = ?
    ORDER BY t.timestamp DESC
    LIMIT 50`,
    [userId, userId]
  );
};

const getAllUsers = async () => {
  return dbAll('SELECT id, name, phone, email, balance FROM users');
};

// OTP queries
const insertOTP = async (user_id, code, receiver_id, amount, expires_at) => {
  return dbRun(
    'INSERT INTO otp_codes (user_id, code, receiver_id, amount, expires_at) VALUES (?, ?, ?, ?, ?)',
    [user_id, code, receiver_id, amount, expires_at]
  );
};

const getOTPById = async (id) => {
  return dbGet('SELECT * FROM otp_codes WHERE id = ?', [id]);
};

const getActiveOTPByUserId = async (user_id) => {
  const now = new Date().toISOString();
  return dbGet(
    'SELECT * FROM otp_codes WHERE user_id = ? AND verified = 0 AND expires_at > ? ORDER BY created_at DESC LIMIT 1',
    [user_id, now]
  );
};

const verifyOTP = async (id) => {
  return dbRun('UPDATE otp_codes SET verified = 1 WHERE id = ?', [id]);
};

const insertOTPAttempt = async (user_id, otp_id, attempted_code, success, ip_address) => {
  return dbRun(
    'INSERT INTO otp_attempts (user_id, otp_id, attempted_code, success, ip_address) VALUES (?, ?, ?, ?, ?)',
    [user_id, otp_id, attempted_code, success, ip_address]
  );
};

const getRecentFailedAttempts = async (user_id, minutes = 5) => {
  const cutoffTime = new Date(Date.now() - minutes * 60 * 1000).toISOString();
  return dbAll(
    'SELECT * FROM otp_attempts WHERE user_id = ? AND success = 0 AND attempted_at > ? ORDER BY attempted_at DESC',
    [user_id, cutoffTime]
  );
};

const cleanupExpiredOTPs = async () => {
  const now = new Date().toISOString();
  return dbRun('DELETE FROM otp_codes WHERE expires_at < ? AND verified = 0', [now]);
};

const updateOTPTransactionId = async (otp_id, transaction_id) => {
  return dbRun('UPDATE otp_codes SET transaction_id = ? WHERE id = ?', [transaction_id, otp_id]);
};

// Export database and query functions
module.exports = {
  db,
  dbRun,
  dbGet,
  dbAll,
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
};
