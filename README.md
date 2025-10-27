# PayApp - Modern Payment Web Application 💸

A modern Philippine Peso payment web application inspired by GCash, built with Node.js, Express, SQLite, and featuring QR code payments, AI chatbot assistant, and real-time audio confirmation using Text-to-Speech technology.

[![Node.js](https://img.shields.io/badge/Node.js-v14+-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Currency](https://img.shields.io/badge/Currency-PHP_(₱)-orange.svg)](https://en.wikipedia.org/wiki/Philippine_peso)

---

## 🚀 **Quick Start**

```bash
# 1. Install dependencies
npm install

# 2. Initialize database
npm run init-db

# 3. Start server
npm start

# 4. Open browser
# Visit: http://localhost:3000
```

**That's it! You're ready to go!** 🎉

📚 **Need help?** Check out [Quick Start Guide](docs/QUICK_START.md) or [Server Management Guide](docs/SERVER_MANAGEMENT_GUIDE.md)

---

## ✨ **Key Features**

### 💳 **Payment Features**
- ✅ Send and receive money instantly
- ✅ Real-time balance updates
- ✅ Transaction history tracking
- ✅ QR code payments (generate & scan)
- ✅ Auto-complete recipient search
- ✅ Daily spending statistics

### 🤖 **AI Chatbot Assistant**
- ✅ Context-aware help system
- ✅ Real-time balance inquiries
- ✅ Transaction history access
- ✅ Voice input/output support
- ✅ Smart feature guidance

### 🔐 **Security**
- ✅ Secure authentication
- ✅ Password hashing (bcrypt)
- ✅ Session management
- ✅ Balance verification
- ✅ Transaction validation

### 🎨 **Modern UI/UX**
- ✅ Beautiful responsive design
- ✅ Smooth animations
- ✅ Audio confirmations (TTS)
- ✅ Mobile-friendly interface
- ✅ Philippine Peso (₱) branding

---

## 🎯 **What's New**

**Latest Updates:**
- 🆕 **QR Code Payments** - Generate QR to receive, scan QR to pay
- 🆕 **AI Helpdesk Chatbot** - Smart assistant with voice support
- 🆕 **Enhanced Statistics** - Track daily spending and total received
- 🆕 **Philippine Peso Branding** - Full ₱ symbol integration
- 🆕 **Mobile Camera Support** - QR scanning with camera or image upload

See [Feature Summary](docs/FEATURE_SUMMARY.md) for complete details.

---

## 👥 **Sample Users**

Two pre-configured test accounts are available:

| Name | Email | Password | Initial Balance |
|------|-------|----------|-----------------|
| **Andres Lacra** | andres.lacra@example.com | password123 | ₱10,000 |
| **Maria Cruz** | maria.cruz@example.com | password123 | ₱10,000 |

---

## 🛠️ **Tech Stack**

### Frontend
- **Tailwind CSS** - Modern utility-first styling
- **Alpine.js** - Lightweight reactive framework
- **Web Speech API** - Voice recognition & TTS
- **HTML5-QRCode** - QR code scanning

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **SQLite** - Embedded database
- **bcrypt** - Password security
- **QRCode** - QR generation

---

## 📖 **Documentation**

All documentation is organized in the [`docs/`](docs/) folder:

### **🚀 Getting Started**
- [Quick Start Guide](docs/QUICK_START.md) - Get up and running
- [Server Management](docs/SERVER_MANAGEMENT_GUIDE.md) - Start/stop server
- [Quick Commands](docs/QUICK_COMMANDS.md) - Command reference
- [Kill Commands Explained](docs/KILL_COMMANDS_EXPLAINED.md) - Stop server methods

### **💡 Feature Guides**
- [QR Payment Feature](docs/QR_PAYMENT_FEATURE.md) - Complete QR guide
- [QR Quick Start](docs/QR_QUICK_START.md) - Fast QR setup
- [Helpdesk Guide](docs/HELPDESK_GUIDE.md) - Chatbot usage
- [Enhanced Chatbot](docs/ENHANCED_CHATBOT_GUIDE.md) - AI features

### **🔧 Technical Documentation**
- [Project Structure](docs/PROJECT_STRUCTURE.md) - Architecture overview
- [Feature Summary](docs/FEATURE_SUMMARY.md) - All features list
- [Summary](docs/SUMMARY.md) - Project summary

### **🐛 Troubleshooting**
- [Camera Permissions](docs/CAMERA_PERMISSION_GUIDE.md) - Fix camera issues
- [Samsung Android Guide](docs/SAMSUNG_ANDROID_GUIDE.md) - Samsung-specific
- [Final Fixes](docs/FINAL_FIXES_SUMMARY.md) - Recent bug fixes
- [UI Alignment Fixes](docs/UI_ALIGNMENT_FIXES.md) - Layout fixes

📚 **[View All Documentation →](docs/README.md)**

---

## 🗂️ **Project Structure**

```
ai-native-payapp/
├── 📁 docs/                    # All documentation
│   ├── README.md              # Documentation index
│   ├── QUICK_START.md         # Quick setup guide
│   ├── SERVER_MANAGEMENT_GUIDE.md
│   └── ... (15+ guides)
│
├── 📁 public/                 # Frontend files
│   ├── dashboard.html         # Main dashboard
│   ├── login.html             # Login page
│   └── js/
│       ├── dashboard.js       # Dashboard logic
│       └── login.js           # Login logic
│
├── server.js                  # Express server
├── database.js                # Database layer
├── init-db.js                 # DB initialization
├── package.json               # Dependencies
├── payment.db                 # SQLite database
└── README.md                  # This file
```

---

## 🚦 **Available Commands**

### **Start/Stop Server**
```bash
# Start server
npm start

# Stop server (in terminal)
Ctrl + C

# Force stop
pkill -f "node server.js"
# OR
lsof -ti:3000 | xargs kill -9
```

### **Database**
```bash
# Initialize/Reset database
npm run init-db

# Backup database
cp payment.db payment.db.backup
```

### **Access**
- **Local:** http://localhost:3000
- **Network:** http://192.168.86.6:3000 (for mobile testing)

📚 **More commands:** [Quick Commands Guide](docs/QUICK_COMMANDS.md)

---

## 🎮 **How to Use**

### **1. Login**
- Visit http://localhost:3000
- Use sample credentials above
- Hear "Welcome back" confirmation

### **2. Send Money**
- Enter recipient email (auto-complete available)
- Enter amount
- Click "Send Payment"
- Hear confirmation with new balance

### **3. Receive Money (QR Code)**
- Click "QR Code" tab
- Select "Receive Money"
- Show QR code to payer
- They scan and send payment

### **4. Pay with QR Code**
- Click "QR Code" tab
- Select "Scan QR Code"
- Scan recipient's QR code
- Enter amount and send

### **5. Chat with Assistant**
- Click "Helpdesk" tab
- Ask questions about your account
- Try "What's my balance?" or "Show my transactions"
- Use voice input button for hands-free

---

## 🔌 **API Endpoints**

### Authentication
- `POST /api/login` - User login
- `POST /api/logout` - User logout
- `GET /api/session` - Check session

### User & Payments
- `GET /api/profile` - Current user
- `GET /api/users` - All users (search)
- `POST /api/send-payment` - Send money
- `GET /api/transactions` - Transaction history

### QR Code
- `GET /api/generate-payment-qr` - Generate QR for receiving
- `POST /api/decode-payment-qr` - Decode scanned QR

### Real-time
- `GET /api/events` - Server-Sent Events (SSE)

---

## 🎨 **UI Highlights**

- **Philippine Peso (₱) Branding** - Authentic local currency display
- **Tab Navigation** - Send Money, QR Code, Helpdesk, History
- **Quick Info Dashboard** - Today's sent, total received, transaction count
- **Audio Feedback** - Voice confirmations for all actions
- **Responsive Design** - Works on desktop and mobile
- **Modern Gradients** - Beautiful blue/indigo color scheme
- **Smooth Animations** - Slide-in effects and transitions

---

## 🐛 **Troubleshooting**

### **Server won't start (port in use)**
```bash
lsof -ti:3000 | xargs kill -9
npm start
```

### **Camera not working on mobile**
- Check browser permissions
- Try "Upload QR Code Image" instead
- See [Camera Permission Guide](docs/CAMERA_PERMISSION_GUIDE.md)

### **Stats showing zero**
- Make sure transactions exist
- Refresh page
- See [Final Fixes Summary](docs/FINAL_FIXES_SUMMARY.md)

### **Database issues**
```bash
rm payment.db
npm run init-db
```

📖 **More help:** Check the [docs/](docs/) folder for detailed guides!

---

## 🔮 **Implemented Features**

✅ User authentication  
✅ Send/receive payments  
✅ Transaction history  
✅ QR code payments (generate & scan)  
✅ AI chatbot assistant  
✅ Voice input/output  
✅ Real-time updates (SSE)  
✅ Audio confirmations (TTS)  
✅ Mobile-friendly UI  
✅ Philippine Peso support  
✅ Daily statistics  
✅ Camera/image QR scanning  

---

## 💡 **Tips**

- 🎯 **Start here:** [Quick Start Guide](docs/QUICK_START.md)
- 🔧 **Daily reference:** [Quick Commands](docs/QUICK_COMMANDS.md)
- 📱 **Mobile testing:** Use network IP on same WiFi
- 🤖 **Try chatbot:** Ask "What's my balance?"
- 📊 **Check stats:** Quick Info shows spending summary

---

## 📚 **Learning Resources**

- [Complete Documentation](docs/README.md) - All guides indexed
- [Project Structure](docs/PROJECT_STRUCTURE.md) - Understand architecture
- [Feature Summary](docs/FEATURE_SUMMARY.md) - Complete feature list
- [Server Management](docs/SERVER_MANAGEMENT_GUIDE.md) - Development workflow

---

## 🎓 **For Beginners**

New to Node.js or npm? Start here:

1. **Day 1:** [Quick Start Guide](docs/QUICK_START.md)
2. **Day 2:** [Server Management](docs/SERVER_MANAGEMENT_GUIDE.md)
3. **Week 1:** [Feature Guides](docs/README.md#-feature-guides)
4. **Week 2:** [Technical Docs](docs/README.md#-technical-guides)

**All guides are beginner-friendly with step-by-step instructions!** 📖

---

## 📄 **License**

MIT License - Free to use for learning and development.

---

## 👨‍💻 **Development**

Built with ❤️ using modern web technologies for learning and demonstration.

**Key Technologies:**
- Node.js & Express.js
- SQLite & better-sqlite3
- Tailwind CSS & Alpine.js
- Web Speech API
- QRCode generation
- Server-Sent Events

---

## 🎉 **Ready to Start?**

```bash
npm install && npm run init-db && npm start
```

Then visit: **http://localhost:3000**

**Need help?** → [Documentation](docs/README.md) | [Quick Start](docs/QUICK_START.md) | [Quick Commands](docs/QUICK_COMMANDS.md)

---

**⚠️ Note:** This is a demonstration/learning application. For production use, implement additional security measures, use environment-specific configurations, and consider using a more robust database solution.

---

**Happy Coding! 🚀**

