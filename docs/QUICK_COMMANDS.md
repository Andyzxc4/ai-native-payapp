# Quick Commands Reference Card 🚀

## 📌 **Most Common Commands**

### **Start Server:**
```bash
cd /Users/andre-d.lacra/ai-native-projects/projects-in-git/ai-native-payapp
npm start
```

### **Stop Server:**
```bash
Ctrl + C
```
Or if that doesn't work, try these (in order):
```bash
# Method 1: By process name (recommended)
pkill -f "node server.js"

# Method 2: By port
lsof -ti:3000 | xargs kill -9

# Method 3: Kill all node (nuclear option)
killall node
```

### **Check if Running:**
```bash
lsof -i:3000
```

### **Restart Server:**
```bash
Ctrl + C
npm start
```

---

## 🌐 **Access URLs**

- **Local:** http://localhost:3000
- **Network:** http://192.168.86.6:3000

---

## ⚡ **One-Line Commands**

### **Clean Restart (Option 1 - Using pkill):**
```bash
pkill -f "node server.js"; sleep 1; cd /Users/andre-d.lacra/ai-native-projects/projects-in-git/ai-native-payapp && npm start
```

### **Clean Restart (Option 2 - Using port):**
```bash
lsof -ti:3000 | xargs kill -9 2>/dev/null; sleep 1; cd /Users/andre-d.lacra/ai-native-projects/projects-in-git/ai-native-payapp && npm start
```

### **Force Stop Options:**
```bash
# By process name (recommended)
pkill -f "node server.js"

# By port
lsof -ti:3000 | xargs kill -9

# Kill all node
killall node
```

### **Start in Background:**
```bash
cd /Users/andre-d.lacra/ai-native-projects/projects-in-git/ai-native-payapp && node server.js &
```

---

## 🔧 **First Time Setup**

```bash
cd /Users/andre-d.lacra/ai-native-projects/projects-in-git/ai-native-payapp
npm install
npm run init-db
npm start
```

---

## 🆘 **Emergency Commands**

### **Kill All Node Processes:**
```bash
killall node
```

### **Check All Running Ports:**
```bash
lsof -i -P | grep LISTEN
```

### **Reinstall Everything:**
```bash
rm -rf node_modules
npm install
```

---

## 💡 **Pro Tip**

Save this in your notes app for quick access! 📱

**Most used:** `npm start` and `Ctrl + C`

That's it! 🎉

