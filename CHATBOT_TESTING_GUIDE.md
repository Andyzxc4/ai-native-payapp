# Chatbot Testing Guide - Quick Reference

## 🧪 **Quick Test Scenarios**

### **Test Category 1: Real-Time Data Queries** 📊

| Test | What to Ask | Expected Response |
|------|------------|-------------------|
| **Balance** | "What's my balance?" | "Your current balance is ₱[AMOUNT]. ✅/💡 [Tip]" |
| **Transactions** | "Show my transactions" | List of last 5 transactions with details |
| **Stats** | "How much did I send today?" | "📊 Here are your statistics: • Today's Sent: ₱[AMOUNT]..." |
| **Affordability** | "Can I send 500?" | "Yes! ✅ You have ₱[BALANCE]..." or "Sorry, you don't have enough..." |

---

### **Test Category 2: Conversational Intelligence** 💬

| Test | What to Ask | Expected Response |
|------|------------|-------------------|
| **Greeting** | "Hello" or "Hi" or "Hey" | "Hello [YourName]! 👋 I'm your PayApp Assistant..." |
| **How Are You** | "How are you?" | "I'm doing great, thanks for asking! 😊..." |
| **Name** | "What's your name?" | "I'm your friendly PayApp Assistant! 🤖..." |
| **Thanks** | "Thanks" or "Thank you" | "You're very welcome! 😊 Is there anything else..." |
| **Goodbye** | "Bye" or "Goodbye" | "Goodbye [YourName]! Have a great day! 👋..." |

---

### **Test Category 3: Smart Feature Queries** 🎯

| Test | What to Ask | Expected Response |
|------|------------|-------------------|
| **Phone Payments** | "Can I send to a phone number?" | "Currently, you can only send money to registered email addresses. 📧..." |
| **Multiple Recipients** | "Can I send to multiple people?" | "Right now, you can send money to one person at a time..." |
| **Payment Limits** | "What's the maximum I can send?" | "You can send any amount as long as you have sufficient balance!..." |
| **Cancel Payment** | "Can I cancel a payment?" | "⚠️ Payments are instant and cannot be cancelled..." |
| **How to Send** | "How do I send money?" | Step-by-step guide with your current balance |
| **How to Receive** | "How do I receive money?" | QR code instructions with tips |
| **View History** | "How do I view my history?" | Instructions + your transaction count |

---

### **Test Category 4: Friendly Fallbacks** 😊

| Test | What to Ask | Expected Response |
|------|------------|-------------------|
| **Jokes** | "Tell me a joke" | "I can't tell jokes, but I can help make your payments smooth..." |
| **Weather** | "What's the weather?" | "I don't have weather information, but I can help you..." |
| **Food** | "Recommend a restaurant" | "I can't help with food recommendations, but I can help you send money..." |
| **Time** | "What time is it?" | "[Current Date & Time]. 🕐 How can I help you with your PayApp account?" |
| **Math** | "What's 2+2?" | "I'm not a calculator, but I can help you manage your money! 🧮..." |
| **Random** | "What's your favorite color?" | Friendly fallback: "I can only help with questions related to your PayApp account..." |

---

## 📝 **Test Script: Complete Walkthrough**

### **Step 1: Greet the Bot**
```
Type: "Hello"

Expected:
✅ Uses your first name
✅ Friendly greeting
✅ Offers help
✅ Voice output plays

Example: "Hello Alice! 👋 I'm your PayApp Assistant. How can I help you today?"
```

---

### **Step 2: Ask How It's Doing**
```
Type: "How are you?"

Expected:
✅ Conversational response
✅ One of 3 variations
✅ Redirects to helping you

Example: "I'm doing great, thanks for asking! 😊 How can I assist you with your PayApp account today?"
```

---

### **Step 3: Check Balance**
```
Type: "What's my balance?"

Expected:
✅ Shows your ACTUAL balance
✅ Includes helpful tip
✅ Uses Philippine Peso format (₱)

Example: "Your current balance is ₱1,000.00. ✅ You have sufficient funds for transactions."
```

---

### **Step 4: View Transactions**
```
Type: "Show my transaction history"

Expected:
✅ Shows last 5 transactions
✅ Includes emojis (📤 sent, 📥 received)
✅ Shows names, amounts, time ago
✅ Indicates if more transactions exist

Example:
"Here are your recent transactions:

1. 📤 Sent ₱500.00 to Maria Cruz (2h ago)
2. 📥 Received ₱1,000.00 from Andres Lacra (1d ago)
3. 📤 Sent ₱200.00 to Bob Johnson (2d ago)

... and 5 more transactions. Visit the History tab to see all!"
```

---

### **Step 5: Check Statistics**
```
Type: "How much did I send today?"

Expected:
✅ Shows today's sent amount
✅ Shows total received
✅ Shows transaction count
✅ Mentions where to see stats in UI

Example:
"📊 Here are your statistics:

• Today's Sent: ₱150.00
• Total Received: ₱500.00
• Transaction Count: 8

You can see these stats in the Quick Info box on the Send Money tab!"
```

---

### **Step 6: Affordability Check**
```
Type: "Can I send 100?"

Expected:
✅ Checks your balance vs amount
✅ Says yes or no
✅ Shows how much you have
✅ Shows shortage if insufficient

Example (sufficient):
"Yes! ✅ You have ₱1,000.00, so you can send ₱100. Would you like to send money now? Go to the Send Money tab!"

Example (insufficient):
"Sorry, you don't have enough balance. ❌ You need ₱50.00 more. Your current balance is ₱50.00."
```

---

### **Step 7: Ask About Phone Payments**
```
Type: "Can I send money to a phone number?"

Expected:
✅ Explains not supported
✅ Offers alternative
✅ Remains helpful

Example: "Currently, you can only send money to registered email addresses. 📧 We don't support phone number payments yet. Would you like to send money using an email address instead? Just go to the Send Money tab!"
```

---

### **Step 8: Ask for Instructions**
```
Type: "How do I send money?"

Expected:
✅ Step-by-step guide
✅ Includes your current balance
✅ Mentions QR alternative

Example:
"To send money:
1. Go to the 'Send Money' tab
2. Enter the recipient's email address
3. Enter the amount you want to send
4. Click 'Send Payment'

💡 Pro tip: You can also use the 'QR Code' tab to scan someone's payment QR code for faster transactions! Your current balance is ₱1,000.00."
```

---

### **Step 9: Test Context Memory**
```
First: "How do I send money?"
Bot: (Explains how)

Then type: "Yes, I want to do that"

Expected:
✅ Bot remembers context
✅ Provides follow-up action
✅ Includes balance

Example: "Great! Go to the 'Send Money' tab, enter the recipient's email and amount, then click 'Send Payment'. Your current balance is ₱1,000.00. 💸"
```

---

### **Step 10: Test Friendly Fallback**
```
Type: "Tell me a joke"

Expected:
✅ Politely declines
✅ Redirects to app help
✅ Stays friendly

Example: "I can't tell jokes, but I can help make your payments smooth and stress-free! 😊 That's pretty cool, right? What can I help you with today?"
```

---

### **Step 11: Thank the Bot**
```
Type: "Thanks"

Expected:
✅ One of 3 thank you variations
✅ Offers more help

Example: "You're very welcome! 😊 Is there anything else I can help you with?"
```

---

### **Step 12: Say Goodbye**
```
Type: "Goodbye"

Expected:
✅ Uses your name
✅ Friendly farewell
✅ Invites return

Example: "Goodbye Alice! Have a great day! 👋 Come back if you need any help."
```

---

## ✅ **Validation Checklist**

### **Real-Time Data:**
- [ ] Balance shows actual amount from user session
- [ ] Transactions show real transaction history
- [ ] Statistics show correct calculations
- [ ] Affordability checks use actual balance
- [ ] All amounts use ₱ format

### **Conversational:**
- [ ] Greetings use user's first name
- [ ] Multiple greeting variations work
- [ ] "How are you" responses vary
- [ ] Thanks responses vary
- [ ] Goodbye uses user's name

### **Context Awareness:**
- [ ] Bot remembers last topic
- [ ] Follow-up responses work
- [ ] User name persists in session
- [ ] Context resets on clear chat

### **Voice Features:**
- [ ] All responses are spoken
- [ ] Voice input button works
- [ ] Voice recognition captures speech
- [ ] Voice and text work together

### **UI/UX:**
- [ ] Messages display correctly
- [ ] Typing indicator shows
- [ ] Auto-scroll to bottom works
- [ ] Clear chat resets everything
- [ ] Timestamps are accurate

---

## 🎯 **Test Commands Quick List**

Copy-paste these to test quickly:

```
Hello
How are you?
What's my balance?
Show my transaction history
How much did I send today?
Can I send 100?
Can I send money to a phone number?
How do I send money?
Can I send to multiple people?
What's the maximum I can send?
Can I cancel a payment?
How do I view my transaction history?
Tell me a joke
What's the weather?
What time is it?
What's your name?
Thanks
Goodbye
```

---

## 🐛 **Troubleshooting**

### **Issue: Balance shows as "undefined"**
**Fix:** Make sure you're logged in and have a valid session

### **Issue: Transactions show "You don't have any transactions"**
**Fix:** Send or receive at least one payment first

### **Issue: Voice not working**
**Fix:** 
- Check browser permissions
- Enable microphone access
- Use Chrome/Edge/Safari (best support)

### **Issue: Bot doesn't remember context**
**Fix:** 
- Context resets on page refresh
- Context clears when you click "Clear Chat"
- This is normal behavior

### **Issue: Response takes too long**
**Fix:**
- Check internet connection
- Server may be processing
- Normal delay is 600-800ms

---

## 📊 **Performance Metrics**

### **Response Times:**
- **Conversational:** ~600ms
- **Data Queries:** ~600-800ms
- **Voice Output:** Starts immediately after response

### **Accuracy:**
- **Balance:** 100% (from session)
- **Transactions:** 100% (from database)
- **Statistics:** 100% (calculated real-time)
- **Context Memory:** Works within session only

---

## 🎉 **Success Criteria**

✅ All 12 test steps pass  
✅ Balance shows real data  
✅ Transactions show real history  
✅ Conversational responses work  
✅ Context memory functions  
✅ Friendly fallbacks active  
✅ Voice output works  
✅ All responses are helpful  

**If all above pass → Chatbot is fully functional!** 🚀


