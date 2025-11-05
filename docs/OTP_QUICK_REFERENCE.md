# OTP Feature - Quick Reference 🔐

## 🚀 **Quick Start**

### **Using OTP for Payments**

1. **Send Payment**
   - Fill recipient email & amount
   - Click "Send Payment"
   
2. **Enter OTP**
   - Modal appears automatically
   - 6-digit code shown on screen + voice announcement
   - Type or paste code
   
3. **Verify**
   - Auto-submits on 6th digit
   - Or click "Verify & Complete Payment"
   
4. **Success!**
   - Payment completed
   - Modal closes
   - Success message appears

---

## ⚙️ **Configuration**

```javascript
OTP_CONFIG = {
  LENGTH: 6,                // OTP digits
  EXPIRY_MINUTES: 5,       // Code expires after
  MAX_ATTEMPTS: 3,         // Failed attempts allowed
  LOCKOUT_MINUTES: 10,     // Lockout duration
  ATTEMPT_WINDOW_MINUTES: 5  // Time window for attempts
}
```

---

## 🔌 **API Endpoints**

### **Request OTP**
```bash
POST /api/request-otp
Body: { "receiverEmail": "...", "amount": 100 }
Response: { "otpId": 42, "code": "123456", "expiresIn": 5 }
```

### **Verify OTP**
```bash
POST /api/verify-otp
Body: { "otpId": 42, "code": "123456" }
Response: { "message": "Payment successful", "transaction": {...} }
```

### **Check Status**
```bash
GET /api/otp-status
Response: { "locked": false, "attemptsLeft": 3, "hasActiveOTP": true }
```

---

## 🎯 **Key Features**

| Feature | Description |
|---------|-------------|
| **Security** | 6-digit random code, time-limited (5 min) |
| **Rate Limiting** | Max 3 attempts in 5 minutes |
| **Lockout** | 10-minute lockout after max attempts |
| **Real-time** | OTP delivered via SSE |
| **Voice** | TTS announces OTP code |
| **Auto-cleanup** | Expired OTPs removed every 5 min |

---

## 🧪 **Testing Scenarios**

### **✅ Success**
1. Request OTP
2. Enter correct code
3. Payment completes

### **❌ Invalid Code**
1. Request OTP
2. Enter wrong code
3. See error + attempts left
4. Try again

### **🚫 Lockout**
1. Request OTP
2. Enter wrong code 3 times
3. Account locked 10 minutes
4. Restart server to reset

### **⏰ Expiration**
1. Request OTP
2. Wait 5+ minutes
3. Enter code
4. Get "expired" error
5. Request new OTP

---

## 🐛 **Troubleshooting**

| Problem | Solution |
|---------|----------|
| Modal doesn't appear | Check console, verify SSE connection |
| "Account locked" | Wait 10 min or restart server: `pkill -f "node server.js" && npm start` |
| OTP always invalid | Check server logs for correct code |
| No voice | Check browser audio permissions |
| Paste doesn't work | Click first input, use Ctrl/Cmd+V |

---

## 📊 **Database Tables**

### **otp_codes**
- `id`, `user_id`, `code`, `receiver_id`, `amount`
- `expires_at`, `verified`, `transaction_id`, `created_at`

### **otp_attempts**
- `id`, `user_id`, `otp_id`, `attempted_code`
- `success`, `ip_address`, `attempted_at`

---

## 🔒 **Security Tips**

### **Current (Demo)**
- ⚠️ OTP shown on screen
- ⚠️ Voice announcement
- ⚠️ Math.random() generation

### **Production**
- ✅ Send via SMS/Email
- ✅ Use crypto.randomBytes()
- ✅ Enable HTTPS
- ✅ Hash OTP codes
- ✅ Add global rate limiting

---

## 📈 **Monitoring Queries**

**Recent OTPs:**
```sql
SELECT * FROM otp_codes ORDER BY created_at DESC LIMIT 10;
```

**Failed Attempts:**
```sql
SELECT * FROM otp_attempts WHERE success = 0 ORDER BY attempted_at DESC LIMIT 20;
```

**Locked Users:**
```sql
SELECT user_id, COUNT(*) as attempts
FROM otp_attempts
WHERE success = 0 AND attempted_at > datetime('now', '-5 minutes')
GROUP BY user_id
HAVING COUNT(*) >= 3;
```

---

## 🎨 **UI Components**

### **OTP Modal**
- 🔐 Lock icon header
- 📋 Payment details card
- 🔢 6 input fields (auto-advance)
- ⏱️ Expiration timer
- 🎯 Attempts counter
- ❌ Error messages
- ✅ Verify button

### **States**
- **Normal** - Enter OTP, 3 attempts
- **Error** - Invalid code, attempts decremented
- **Verifying** - Loading spinner
- **Locked** - Red alert, disabled inputs

---

## 🚀 **Quick Commands**

```bash
# Restart server
cd /Users/andre-d.lacra/ai-native-projects/projects-in-git/ai-native-payapp
pkill -f "node server.js"
npm start

# Reinitialize DB
npm run init-db

# Check server logs
# Look for: "🔐 OTP generated for user X: XXXXXX"

# Test on mobile
# Visit: http://192.168.86.6:3000
```

---

## 📚 **Related Docs**

- [Complete OTP Guide](OTP_FEATURE_GUIDE.md) - Full documentation
- [Quick Start](QUICK_START.md) - General setup
- [Server Management](SERVER_MANAGEMENT_GUIDE.md) - Server commands

---

## 💡 **Pro Tips**

1. **Paste Support** - Click first field, paste entire code
2. **Auto-Submit** - Fills all 6 digits and verifies automatically
3. **Voice Help** - Listen to code if hard to read
4. **SSE Connection** - Must be active for real-time OTP delivery
5. **Test Early** - Try lockout scenario before production

---

**Need Help?** Check [OTP_FEATURE_GUIDE.md](OTP_FEATURE_GUIDE.md) for detailed information!


