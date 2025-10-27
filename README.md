# PayApp - Payment Web Application

A modern payment web application inspired by GCash, built with Node.js, Express, SQLite, and featuring real-time audio confirmation using Text-to-Speech technology.

## 🚀 Features

- **User Authentication**: Secure login with express-session for persistent sessions
- **Payment Processing**: Send money between users with real-time balance updates
- **Transaction History**: View all sent and received transactions
- **Audio Confirmation**: TTS audio feedback for all transactions (success/failure)
- **Real-time Updates**: Server-Sent Events for live transaction updates
- **Responsive Design**: Beautiful UI built with Tailwind CSS
- **Lightweight Interactivity**: Alpine.js for minimal, efficient client-side logic
- **SQLite Database**: Simple, file-based database for users and transactions

## 🛠️ Tech Stack

### Frontend
- **Tailwind CSS**: Modern, utility-first CSS framework
- **Alpine.js**: Lightweight JavaScript framework for interactivity
- **Web Speech API**: Browser-based Text-to-Speech for audio confirmations

### Backend
- **Node.js**: JavaScript runtime
- **Express.js**: Web application framework
- **SQLite (better-sqlite3)**: Embedded database
- **bcrypt**: Password hashing
- **express-session**: Session management

## 📋 Prerequisites

- Node.js (v14 or higher)
- npm (Node Package Manager)

## 🔧 Installation

1. **Navigate to the project directory:**
   ```bash
   cd /Users/andre-d.lacra/ai-native-projects/payment-app-1
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Initialize the database:**
   ```bash
   npm run init-db
   ```
   This will create the SQLite database and populate it with two sample users.

4. **Start the server:**
   ```bash
   npm start
   ```
   For development with auto-reload:
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   Navigate to `http://localhost:3000`

## 👥 Sample Users

The application comes with two pre-configured test users:

### User 1
- **Name**: Andres Lacra
- **Email**: andres.lacra@example.com
- **Password**: password123
- **Initial Balance**: 10,000 PHP

### User 2
- **Name**: Maria Cruz
- **Email**: maria.cruz@example.com
- **Password**: password123
- **Initial Balance**: 10,000 PHP

## 📱 Usage

### Login
1. Navigate to `http://localhost:3000`
2. Enter one of the sample user credentials
3. Click "Sign In"
4. You'll hear an audio confirmation and be redirected to the dashboard

### Send Payment
1. On the dashboard, find the "Send Money" form
2. Start typing a recipient's email - autocomplete suggestions will appear
3. Select a recipient or enter their email manually
4. Enter the amount to send
5. Click "Send Payment"
6. You'll hear an audio confirmation of the transaction
7. Your balance and transaction history will update automatically

### View Transaction History
- All transactions appear in the "Recent Transactions" panel
- Sent payments are shown in red (with minus sign)
- Received payments are shown in green (with plus sign)
- Timestamps show relative time (e.g., "5m ago", "2h ago")

## 🗂️ Project Structure

```
payment-app-1/
├── server.js              # Main Express server
├── database.js            # Database queries and connections
├── init-db.js            # Database initialization script
├── package.json          # Project dependencies
├── .env                  # Environment variables
├── .gitignore           # Git ignore rules
├── README.md            # This file
└── public/              # Frontend files
    ├── login.html       # Login page
    ├── dashboard.html   # Main dashboard
    └── js/
        ├── login.js     # Login page logic
        └── dashboard.js # Dashboard logic
```

## 🔌 API Endpoints

### Authentication
- `POST /api/login` - User login
- `POST /api/logout` - User logout
- `GET /api/session` - Check current session

### User Management
- `GET /api/profile` - Get current user profile
- `GET /api/users` - Get all users (for recipient search)

### Payments
- `POST /api/send-payment` - Send money to another user
  - Body: `{ receiverEmail, amount }`
- `GET /api/transactions` - Get transaction history

### Real-time Updates
- `GET /api/events` - Server-Sent Events endpoint for real-time updates

## 🔒 Security Features

- **Password Hashing**: bcrypt with salt rounds for secure password storage
- **Session Management**: express-session with secure cookies
- **Input Validation**: Server-side validation for all transactions
- **Balance Verification**: Checks sufficient funds before processing payments
- **User Verification**: Validates sender and receiver exist
- **Transaction Integrity**: Database transactions ensure atomicity

## 🎵 Audio Confirmation (TTS)

The application uses the browser's built-in Web Speech API for audio feedback:

- **Login**: "Welcome back, [Name]. Login successful."
- **Successful Payment**: "Payment successful. You sent [amount] pesos to [recipient]. Your new balance is [balance] pesos."
- **Failed Payment**: "Payment failed. [error message]"
- **Logout**: "Logged out successfully. Goodbye!"

## 🔄 Real-time Updates

The application uses Server-Sent Events (SSE) for real-time communication:
- Automatic balance updates when receiving payments
- Live transaction history updates
- Connection kept alive with periodic ping messages
- Automatic reconnection on connection loss

## 🛡️ Error Handling

The application handles various error scenarios:
- Insufficient balance
- User not found
- Invalid credentials
- Sending to self
- Network errors
- Session expiration

## 🚦 Development Scripts

```bash
# Install dependencies
npm install

# Initialize database
npm run init-db

# Start production server
npm start

# Start development server with auto-reload
npm run dev
```

## 🎨 UI Features

- **Gradient backgrounds** for modern look
- **Smooth animations** and transitions
- **Responsive design** works on all screen sizes
- **Loading states** for better UX
- **Auto-complete** for recipient selection
- **Real-time balance** display
- **Transaction categorization** (sent/received)
- **Relative timestamps** for transactions

## 📝 Database Schema

### Users Table
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  balance REAL NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

### Transactions Table
```sql
CREATE TABLE transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sender_id INTEGER NOT NULL,
  receiver_id INTEGER NOT NULL,
  amount REAL NOT NULL,
  status TEXT NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sender_id) REFERENCES users(id),
  FOREIGN KEY (receiver_id) REFERENCES users(id)
)
```

## 🐛 Troubleshooting

### Database Issues
If you encounter database errors:
```bash
# Remove the database and reinitialize
rm payment.db
npm run init-db
```

### Port Already in Use
If port 3000 is already in use, modify the `.env` file:
```env
PORT=3001
```

### Audio Not Working
- Ensure your browser supports Web Speech API (Chrome, Edge, Safari)
- Check browser permissions for audio
- Verify volume is not muted

## 🔮 Future Enhancements

Potential features to add:
- User registration
- Password reset functionality
- Transaction receipts
- QR code payments
- Multi-currency support
- Transaction search and filters
- Email notifications
- Two-factor authentication
- Payment requests
- Scheduled payments

## 📄 License

MIT License - Feel free to use this project for learning and development purposes.

## 👨‍💻 Author

Built with ❤️ for learning and demonstration purposes.

---

**Note**: This is a demonstration application. For production use, implement additional security measures, use environment-specific configurations, and consider using a more robust database solution.

