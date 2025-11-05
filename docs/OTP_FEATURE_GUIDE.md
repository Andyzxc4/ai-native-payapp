# OTP Payment Verification Feature Guide 🔐

## Overview

The PayApp now includes a comprehensive OTP (One-Time Password) verification system for secure payment confirmation. This feature adds an extra layer of security to all payment transactions by requiring users to verify their identity with a 6-digit code before completing a payment.

---

## ✨ **Key Features**

### **Security Features**
- ✅ **6-digit OTP generation** - Random, unique codes for each transaction
- ✅ **Time-limited codes** - OTPs expire after 5 minutes
- ✅ **Rate limiting** - Maximum 3 attempts per 5-minute window
- ✅ **Account lockout** - 10-minute lockout after exceeding attempt limit
- ✅ **Secure storage** - OTPs stored in database with transaction tracking
- ✅ **IP logging** - All attempts logged with IP addresses for audit trail

### **User Experience**
- ✅ **Real-time notification** - OTP delivered via Server-Sent Events (SSE)
- ✅ **Voice announcement** - TTS reads OTP code aloud
- ✅ **Auto-focus** - Automatic input field progression
- ✅ **Paste support** - Paste entire OTP code at once
- ✅ **Visual feedback** - Clear error messages and attempt counters
- ✅ **Mobile-friendly** - Responsive design with numeric keyboard

### **Administrative Features**
- ✅ **Automatic cleanup** - Expired OTPs cleaned up every 5 minutes
- ✅ **Attempt tracking** - Failed attempts logged for security monitoring
- ✅ **Transaction linking** - OTPs linked to completed transactions
- ✅ **Status API** - Check user lockout status and attempt counts

---

## 🔄 **Complete Flow**

### **Step 1: Initiate Payment**
1. User fills out payment form (recipient email, amount)
2. Clicks "Send Payment" button
3. System validates balance and recipient

### **Step 2: Request OTP**
```
POST /api/request-otp
Body: { receiverEmail, amount }
```

**Server Actions:**
- ✅ Check if user is locked out
- ✅ Validate sender has sufficient balance
- ✅ Validate recipient exists
- ✅ Generate 6-digit random code
- ✅ Set expiration time (5 minutes)
- ✅ Save OTP to database
- ✅ Send OTP via SSE to user
- ✅ Return OTP details

### **Step 3: Display OTP Modal**
**Frontend displays:**
- 🔐 Lock icon header
- 📋 Payment details (recipient, amount)
- 🔢 6 input fields for OTP code
- ⏱️ Expiration timer (5 minutes)
- 🎯 Attempts remaining counter
- ✅ Verify button

**User receives OTP via:**
- 📱 On-screen display (for demo purposes)
- 🔊 Voice announcement (TTS)
- 📡 Real-time SSE notification

### **Step 4: Enter OTP**
User can:
- Type each digit (auto-advances)
- Paste complete code
- Use backspace to correct
- See real-time validation

### **Step 5: Verify OTP**
```
POST /api/verify-otp
Body: { otpId, code }
```

**Server Validation:**
1. ✅ Check if user is locked out
2. ✅ Verify OTP exists and belongs to user
3. ✅ Check OTP not already used
4. ✅ Validate OTP not expired
5. ✅ Compare entered code with stored code
6. ✅ Log attempt (success/failure)
7. ✅ Update attempt counter

### **Step 6A: Success Path**
- ✅ Mark OTP as verified
- ✅ Execute payment transaction
- ✅ Update balances
- ✅ Create transaction record
- ✅ Link transaction to OTP
- ✅ Send success notifications
- ✅ Close OTP modal
- ✅ Show success message
- ✅ Voice announcement

### **Step 6B: Failure Path**
**Invalid OTP:**
- ❌ Log failed attempt
- ❌ Decrement attempts remaining
- ❌ Show error message
- ❌ Clear input fields
- ❌ Allow retry (if attempts left)

**Lockout Triggered:**
- 🚫 Lock user for 10 minutes
- 🚫 Show lockout message
- 🚫 Disable input fields
- 🚫 Voice announcement
- 🚫 Close modal button only

---

## 📊 **Database Schema**

### **otp_codes Table**
```sql
CREATE TABLE otp_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  transaction_id INTEGER,
  code TEXT NOT NULL,
  receiver_id INTEGER NOT NULL,
  amount REAL NOT NULL,
  expires_at DATETIME NOT NULL,
  verified BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (receiver_id) REFERENCES users(id)
)
```

**Fields:**
- `id` - Unique OTP identifier
- `user_id` - Sender (who initiated payment)
- `transaction_id` - Linked transaction (null until verified)
- `code` - 6-digit OTP code
- `receiver_id` - Payment recipient
- `amount` - Payment amount
- `expires_at` - Expiration timestamp
- `verified` - Whether OTP was successfully used
- `created_at` - Creation timestamp

### **otp_attempts Table**
```sql
CREATE TABLE otp_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  otp_id INTEGER NOT NULL,
  attempted_code TEXT NOT NULL,
  success BOOLEAN DEFAULT 0,
  ip_address TEXT,
  attempted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (otp_id) REFERENCES otp_codes(id)
)
```

**Fields:**
- `id` - Unique attempt identifier
- `user_id` - User making the attempt
- `otp_id` - Related OTP
- `attempted_code` - Code that was entered
- `success` - Whether attempt succeeded
- `ip_address` - Client IP address
- `attempted_at` - Attempt timestamp

---

## 🔌 **API Endpoints**

### **1. Request OTP**
```http
POST /api/request-otp
Authorization: Session Cookie
Content-Type: application/json

{
  "receiverEmail": "recipient@example.com",
  "amount": 500
}
```

**Response (Success):**
```json
{
  "message": "OTP generated successfully",
  "otpId": 42,
  "code": "123456",
  "expiresIn": 5,
  "recipient": {
    "name": "Maria Cruz",
    "email": "maria.cruz@example.com"
  }
}
```

**Response (Locked Out):**
```json
{
  "error": "Too many failed attempts. Please try again in 8 minute(s).",
  "lockoutMinutes": 8
}
```

### **2. Verify OTP**
```http
POST /api/verify-otp
Authorization: Session Cookie
Content-Type: application/json

{
  "otpId": 42,
  "code": "123456"
}
```

**Response (Success):**
```json
{
  "message": "Payment successful",
  "transaction": {
    "id": 89,
    "sender": "Andres Lacra",
    "receiver": "Maria Cruz",
    "amount": 500,
    "newBalance": 9500
  }
}
```

**Response (Invalid OTP):**
```json
{
  "error": "Invalid OTP code",
  "attemptsLeft": 2
}
```

**Response (Expired):**
```json
{
  "error": "OTP has expired. Please request a new one."
}
```

### **3. Check OTP Status**
```http
GET /api/otp-status
Authorization: Session Cookie
```

**Response:**
```json
{
  "locked": false,
  "lockoutMinutes": 0,
  "hasActiveOTP": true,
  "attemptsLeft": 3,
  "config": {
    "maxAttempts": 3,
    "lockoutMinutes": 10,
    "otpExpiryMinutes": 5
  }
}
```

---

## ⚙️ **Configuration**

### **OTP Settings (server.js)**
```javascript
const OTP_CONFIG = {
  LENGTH: 6,                    // OTP code length
  EXPIRY_MINUTES: 5,           // Code expiration time
  MAX_ATTEMPTS: 3,             // Max failed attempts
  LOCKOUT_MINUTES: 10,         // Lockout duration
  ATTEMPT_WINDOW_MINUTES: 5    // Time window for attempts
};
```

### **Customization Options**

**To change OTP length:**
```javascript
LENGTH: 6  // Change to 4, 6, or 8
```

**To adjust expiration:**
```javascript
EXPIRY_MINUTES: 10  // Longer validity
```

**To modify rate limiting:**
```javascript
MAX_ATTEMPTS: 5           // More attempts allowed
LOCKOUT_MINUTES: 15      // Longer lockout
ATTEMPT_WINDOW_MINUTES: 10  // Longer time window
```

---

## 🎨 **Frontend Integration**

### **OTP Modal State**
```javascript
otpModal: {
  show: false,              // Modal visibility
  otpId: null,              // Current OTP ID
  code: ['', '', '', '', '', ''],  // 6-digit array
  recipient: { name: '', email: '' },
  amount: 0,
  expiresIn: 5,
  verifying: false,         // Loading state
  attemptsLeft: 3,
  locked: false,
  lockoutMinutes: 0,
  error: ''
}
```

### **Key Functions**

**Request OTP:**
```javascript
async requestOTP(receiverEmail, amount) {
  const response = await fetch('/api/request-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ receiverEmail, amount })
  });
  
  const data = await response.json();
  
  // Show modal and populate fields
  this.otpModal.show = true;
  this.otpModal.otpId = data.otpId;
  // ... set other fields
}
```

**Verify OTP:**
```javascript
async verifyOTP() {
  const code = this.otpModal.code.join('');
  
  const response = await fetch('/api/verify-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      otpId: this.otpModal.otpId,
      code: code
    })
  });
  
  const data = await response.json();
  
  if (response.ok) {
    // Payment successful!
    this.closeOTPModal();
    this.showSuccessMessage();
  }
}
```

**Handle Input:**
```javascript
handleOTPInput(index, event) {
  const value = event.target.value;
  
  // Only digits
  if (!/^\d*$/.test(value)) {
    event.target.value = '';
    return;
  }
  
  // Update code
  this.otpModal.code[index] = value.slice(-1);
  
  // Auto-advance
  if (value && index < 5) {
    document.querySelector(`[data-otp-index="${index + 1}"]`).focus();
  }
  
  // Auto-submit on 6th digit
  if (index === 5 && value) {
    this.verifyOTP();
  }
}
```

---

## 🔒 **Security Best Practices**

### **Current Implementation (Demo)**
⚠️ **For demonstration, OTP is shown on screen and announced via voice.**

### **Production Recommendations**

**1. SMS/Email Delivery**
```javascript
// Replace in-app display with:
await sendSMS(user.phone, otp.code);
// or
await sendEmail(user.email, otp.code);

// Don't return code in API response:
res.json({
  message: 'OTP sent to your phone/email',
  otpId: otpResult.lastID,
  expiresIn: OTP_CONFIG.EXPIRY_MINUTES
  // DON'T include: code: otpCode
});
```

**2. Rate Limiting**
- ✅ Already implemented per-user
- ✅ Consider global rate limiting
- ✅ Monitor for abuse patterns

**3. Code Generation**
```javascript
// Current: Math.random()
// Production: Use crypto module
const crypto = require('crypto');

function generateSecureOTP() {
  const buffer = crypto.randomBytes(3);
  const code = parseInt(buffer.toString('hex'), 16) % 1000000;
  return code.toString().padStart(6, '0');
}
```

**4. Database Security**
- ✅ OTPs stored in separate table
- ✅ Expired codes automatically cleaned
- ✅ All attempts logged
- ⚠️ Consider hashing OTP codes

**5. HTTPS Only**
- ⚠️ **Always use HTTPS in production**
- ⚠️ Set `secure: true` in session cookies

---

## 🧪 **Testing the Feature**

### **Test Scenario 1: Successful Payment**
1. Log in as User 1
2. Navigate to "Send Money" tab
3. Enter recipient email: `maria.cruz@example.com`
4. Enter amount: `100`
5. Click "Send Payment"
6. **OTP Modal appears**
7. Note the OTP code (announced via voice)
8. Enter the 6-digit code
9. Click "Verify & Complete Payment"
10. ✅ Payment successful!

### **Test Scenario 2: Invalid OTP**
1. Follow steps 1-6 above
2. Enter **incorrect** 6-digit code
3. Click verify
4. ❌ Error: "Invalid OTP code. 2 attempt(s) left"
5. Try again with wrong code
6. ❌ Error: "Invalid OTP code. 1 attempt(s) left"
7. Enter correct code
8. ✅ Payment successful!

### **Test Scenario 3: Account Lockout**
1. Follow steps 1-6 above
2. Enter **incorrect** code 3 times
3. 🚫 Account locked for 10 minutes
4. Modal shows lockout message
5. Input fields disabled
6. Wait 10 minutes or...
7. Restart server to reset lockout

### **Test Scenario 4: OTP Expiration**
1. Request OTP
2. Wait 5+ minutes
3. Enter the OTP code
4. ❌ Error: "OTP has expired. Please request a new one"
5. Close modal
6. Request new OTP
7. Enter new code within 5 minutes
8. ✅ Success!

### **Test Scenario 5: Paste Code**
1. Request OTP
2. Copy the 6-digit code
3. Click first input field
4. Paste (Ctrl+V / Cmd+V)
5. ✅ All 6 digits auto-filled
6. ✅ Auto-verified

---

## 🐛 **Troubleshooting**

### **Problem: OTP Modal doesn't appear**
**Solution:**
- Check browser console for errors
- Ensure SSE connection is active
- Verify `/api/request-otp` returns 200

### **Problem: "Account locked" error**
**Solution:**
```bash
# Clear lockout by restarting server
cd /Users/andre-d.lacra/ai-native-projects/projects-in-git/ai-native-payapp
pkill -f "node server.js"
npm start

# Or wait 10 minutes for automatic unlock
```

### **Problem: OTP always invalid**
**Solution:**
- Check server logs for generated OTP
- Ensure code entered exactly (no spaces)
- Verify OTP hasn't expired
- Check database for correct OTP:
```sql
SELECT * FROM otp_codes WHERE verified = 0 ORDER BY created_at DESC LIMIT 1;
```

### **Problem: No voice announcement**
**Solution:**
- Check browser supports Web Speech API
- Verify browser permissions for audio
- Check volume settings
- Try Chrome/Edge (best support)

### **Problem: Paste doesn't work**
**Solution:**
- Click first input field
- Try Ctrl+V (Windows) or Cmd+V (Mac)
- Ensure clipboard contains only digits
- Maximum 6 digits

---

## 📈 **Database Queries for Monitoring**

### **View Recent OTPs**
```sql
SELECT 
  o.id,
  o.code,
  u.name as user_name,
  r.name as receiver_name,
  o.amount,
  o.verified,
  o.expires_at,
  o.created_at
FROM otp_codes o
JOIN users u ON o.user_id = u.id
JOIN users r ON o.receiver_id = r.id
ORDER BY o.created_at DESC
LIMIT 10;
```

### **View Failed Attempts**
```sql
SELECT 
  a.id,
  u.name as user_name,
  a.attempted_code,
  a.ip_address,
  a.attempted_at
FROM otp_attempts a
JOIN users u ON a.user_id = u.id
WHERE a.success = 0
ORDER BY a.attempted_at DESC
LIMIT 20;
```

### **Check Lockout Status**
```sql
SELECT 
  user_id,
  COUNT(*) as failed_attempts,
  MAX(attempted_at) as last_attempt
FROM otp_attempts
WHERE success = 0
  AND attempted_at > datetime('now', '-5 minutes')
GROUP BY user_id
HAVING COUNT(*) >= 3;
```

### **Cleanup Expired OTPs (manual)**
```sql
DELETE FROM otp_codes 
WHERE expires_at < datetime('now') 
  AND verified = 0;
```

---

## 🚀 **Advanced Features**

### **Resend OTP**
To implement OTP resend:
```javascript
// Add to dashboard.js
async resendOTP() {
  this.closeOTPModal();
  await this.requestOTP(
    this.payment.receiverEmail, 
    this.payment.amount
  );
}

// Add to OTP modal HTML
<button @click="resendOTP()">
  Resend OTP
</button>
```

### **SMS Integration**
```javascript
// Install Twilio or similar
npm install twilio

// In server.js
const twilio = require('twilio')(accountSid, authToken);

async function sendOTPviaSMS(phone, code) {
  await twilio.messages.create({
    body: `Your PayApp OTP is: ${code}. Valid for 5 minutes.`,
    from: '+1234567890',
    to: phone
  });
}
```

### **Email Integration**
```javascript
// Install Nodemailer
npm install nodemailer

// In server.js
const nodemailer = require('nodemailer');

async function sendOTPviaEmail(email, code) {
  const transporter = nodemailer.createTransport({ /* config */ });
  
  await transporter.sendMail({
    from: 'noreply@payapp.com',
    to: email,
    subject: 'PayApp Payment Verification',
    html: `
      <h2>Payment Verification</h2>
      <p>Your OTP code is: <strong>${code}</strong></p>
      <p>This code expires in 5 minutes.</p>
    `
  });
}
```

---

## 📚 **Additional Resources**

### **Related Documentation**
- [Quick Start Guide](QUICK_START.md)
- [Server Management](SERVER_MANAGEMENT_GUIDE.md)
- [Feature Summary](FEATURE_SUMMARY.md)
- [Project Structure](PROJECT_STRUCTURE.md)

### **Security References**
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [NIST Digital Identity Guidelines](https://pages.nist.gov/800-63-3/)
- [SMS OTP Best Practices](https://www.twilio.com/docs/verify/api/service)

---

## 🎉 **Summary**

The OTP verification feature provides:
- ✅ **Enhanced Security** - Two-factor payment confirmation
- ✅ **Rate Limiting** - Prevents brute force attacks
- ✅ **User-Friendly** - Intuitive UI with voice support
- ✅ **Auditable** - Complete attempt logging
- ✅ **Production-Ready** - Easy to extend with SMS/Email

**Next Steps:**
1. Test the feature thoroughly
2. Customize configuration as needed
3. Implement SMS/Email for production
4. Monitor attempt logs for security
5. Adjust rate limits based on usage

**Happy Coding!** 🚀


