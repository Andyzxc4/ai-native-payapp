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
  getAllUsers
};
