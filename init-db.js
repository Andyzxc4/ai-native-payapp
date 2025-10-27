const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');

// Create database
const db = new sqlite3.Database(path.join(__dirname, 'payment.db'), (err) => {
  if (err) {
    console.error('Error opening database:', err);
    process.exit(1);
  }
});

console.log('Initializing database...');

// Create tables
db.serialize(() => {
  // Create Users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      balance REAL NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('Error creating users table:', err);
    } else {
      console.log('✓ Users table created');
    }
  });

  // Create Transactions table
  db.run(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_id INTEGER NOT NULL,
      receiver_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      status TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sender_id) REFERENCES users(id),
      FOREIGN KEY (receiver_id) REFERENCES users(id)
    )
  `, (err) => {
    if (err) {
      console.error('Error creating transactions table:', err);
    } else {
      console.log('✓ Transactions table created');
    }
  });

  // Hash password
  const hashPassword = (password) => {
    return bcrypt.hashSync(password, 10);
  };

  // Insert sample users
  const insertUser = db.prepare(`
    INSERT INTO users (name, phone, email, password, balance)
    VALUES (?, ?, ?, ?, ?)
  `);

  // User 1: Andres Lacra
  insertUser.run(
    'Andres Lacra',
    '09171234567',
    'andres.lacra@example.com',
    hashPassword('password123'),
    10000,
    (err) => {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          console.log('⚠️  User 1 already exists');
        } else {
          console.error('Error creating User 1:', err);
        }
      } else {
        console.log('✓ User 1 created: Andres Lacra');
      }
    }
  );

  // User 2: Maria Cruz
  insertUser.run(
    'Maria Cruz',
    '09179876543',
    'maria.cruz@example.com',
    hashPassword('password123'),
    10000,
    (err) => {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          console.log('⚠️  User 2 already exists');
        } else {
          console.error('Error creating User 2:', err);
        }
      } else {
        console.log('✓ User 2 created: Maria Cruz');
      }
    }
  );

  insertUser.finalize();

  // Print credentials after all operations
  setTimeout(() => {
    console.log('\n✅ Database initialized successfully!');
    console.log('\n📋 Sample Login Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('User 1:');
    console.log('  Email: andres.lacra@example.com');
    console.log('  Password: password123');
    console.log('  Balance: 10,000 PHP');
    console.log('\nUser 2:');
    console.log('  Email: maria.cruz@example.com');
    console.log('  Password: password123');
    console.log('  Balance: 10,000 PHP');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err);
      } else {
        console.log('Database connection closed.');
      }
    });
  }, 1000);
});
