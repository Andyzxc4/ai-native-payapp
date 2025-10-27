# Server Management Guide - Beginner Friendly 🚀

## 📚 **Complete Guide to Running and Stopping Your PayApp**

This guide is for beginners who are new to npm and Node.js. Follow these simple commands to manage your application!

---

## 🎯 **Quick Command Reference**

```bash
# START SERVER
npm start                          # Start server (recommended)
node server.js                     # Alternative: Direct start

# STOP SERVER
Ctrl + C                           # Stop server in current terminal
lsof -ti:3000 | xargs kill -9      # Force stop (if Ctrl+C doesn't work)

# CHECK IF RUNNING
lsof -ti:3000                      # Check if server is running on port 3000
curl http://localhost:3000         # Test if server responds

# RESTART SERVER
npm restart                        # Restart server
```

---

## 🚀 **How to Start the Server**

### **Method 1: Using npm start (Recommended)**

```bash
cd /Users/andre-d.lacra/ai-native-projects/projects-in-git/ai-native-payapp
npm start
```

**What happens:**
```
🚀 Payment Application running on:
   - Local:   http://localhost:3000
   - Network: http://192.168.86.6:3000
📊 Environment: development
Connected to SQLite database
```

✅ Server is now running!  
✅ Visit: http://localhost:3000  
✅ Press `Ctrl + C` to stop  

---

### **Method 2: Using node directly**

```bash
cd /Users/andre-d.lacra/ai-native-projects/projects-in-git/ai-native-payapp
node server.js
```

**Same result as Method 1!**

---

### **Method 3: Run in Background (keeps running even if you close terminal)**

```bash
cd /Users/andre-d.lacra/ai-native-projects/projects-in-git/ai-native-payapp
node server.js &
```

**Notice the `&` at the end** - This runs the server in the background.

✅ You can continue using terminal  
✅ Server keeps running  
⚠️ To stop: Use force kill command (see below)  

---

## 🛑 **How to Stop the Server**

### **Method 1: Ctrl + C (Graceful Stop)**

If server is running in your terminal:
1. Click on the terminal window
2. Press `Ctrl + C` (or `Cmd + C` on Mac)
3. Server stops gracefully

```bash
^C  # This appears when you press Ctrl+C
Server stopped
```

✅ **Best method** - Clean shutdown  
✅ Works for foreground processes  

---

### **Method 2: Force Kill by Port (If Ctrl+C doesn't work)**

```bash
lsof -ti:3000 | xargs kill -9
```

**Breakdown:**
- `lsof -ti:3000` → Find process using port 3000
- `|` → Pipe (pass result to next command)
- `xargs kill -9` → Force kill that process

✅ Works for background processes  
✅ Works when Ctrl+C fails  
✅ Immediate shutdown  

**Silent version (no error if nothing running):**
```bash
lsof -ti:3000 | xargs kill -9 2>/dev/null
```

---

### **Method 3: Using pkill (Kill by Process Name)**

```bash
pkill -f "node server.js"
```

**What this does:**
- `pkill` → Process kill command
- `-f` → Match full command line (not just process name)
- `"node server.js"` → The exact command you want to kill

✅ Simple and intuitive  
✅ Kills specific Node.js process  
✅ No need to find port or PID  

**Alternative pkill commands:**
```bash
# Kill by exact match
pkill -f "node server.js"

# Kill any node process running server.js
pkill -f server.js

# Kill with signal 9 (force kill)
pkill -9 -f "node server.js"

# Show what would be killed (dry run)
pgrep -f "node server.js"
```

**⚠️ Be Careful:**
```bash
# DON'T DO THIS - kills ALL node processes!
pkill node

# DO THIS - specific to your server
pkill -f "node server.js"
```

---

### **Method 4: Find and Kill Manually**

**Step 1: Find the process**
```bash
lsof -i:3000
```

**Output:**
```
COMMAND   PID        USER
node    12345  andre-d.lacra
```

**Step 2: Kill by PID (Process ID)**
```bash
kill -9 12345
```

Replace `12345` with your actual PID.

---

### **Method 5: Using killall (Kill All Node Processes)**

```bash
killall node
```

**What this does:**
- Kills **ALL** Node.js processes on your system
- Use with caution!

⚠️ **Warning:** This kills every node process, not just your server!

**When to use:**
- Last resort when nothing else works
- You're sure no other Node.js apps are running

---

## 🔍 **Comparison: Which Method to Use?**

| Method | Command | Best For | Safety |
|--------|---------|----------|--------|
| **Ctrl+C** | `Ctrl + C` | Foreground processes, daily use | ✅ Safest |
| **By Port** | `lsof -ti:3000 \| xargs kill -9` | Background processes, specific port | ✅ Safe |
| **pkill** | `pkill -f "node server.js"` | Specific process by name | ✅ Safe if careful |
| **killall** | `killall node` | Emergency only | ⚠️ Kills all Node |
| **Manual** | Find PID then `kill -9 PID` | When you need control | ✅ Safe |

**Our Recommendation:**
1. **First try:** `Ctrl + C`
2. **If that fails:** `pkill -f "node server.js"`
3. **Still running?:** `lsof -ti:3000 | xargs kill -9`
4. **Nuclear option:** `killall node`

---

## ✅ **How to Check If Server Is Running**

### **Method 1: Check Port 3000**

```bash
lsof -i:3000
```

**If running:**
```
COMMAND   PID        USER
node    12345  andre-d.lacra
```

**If NOT running:**
```
(no output)
```

---

### **Method 2: Test HTTP Response**

```bash
curl http://localhost:3000
```

**If running:**
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  ...
```

**If NOT running:**
```
curl: (7) Failed to connect to localhost port 3000
```

---

### **Method 3: Visit in Browser**

Open browser and go to:
```
http://localhost:3000
```

**If running:** ✅ Login page loads  
**If NOT running:** ❌ "Can't reach this page" error  

---

## 🔄 **How to Restart the Server**

### **Option 1: Stop and Start**

```bash
# Terminal 1: Stop
Ctrl + C

# Terminal 1: Start again
npm start
```

---

### **Option 2: Force Restart (One command)**

```bash
lsof -ti:3000 | xargs kill -9 2>/dev/null; sleep 1; npm start
```

**Breakdown:**
1. Kill any existing server
2. Wait 1 second
3. Start new server

---

### **Option 3: Background Restart**

```bash
lsof -ti:3000 | xargs kill -9 2>/dev/null; sleep 1; node server.js &
```

Restarts server in background.

---

## 📝 **Understanding npm Commands**

### **What is npm?**
- **npm** = Node Package Manager
- Manages JavaScript packages and scripts
- Comes with Node.js

### **Common npm Commands**

```bash
# View available scripts
npm run

# Install dependencies (do this first time!)
npm install

# Start server (as defined in package.json)
npm start

# Initialize database
npm run init-db

# Run tests (if you have them)
npm test
```

---

## 📦 **Your package.json Scripts**

Your app has these custom scripts:

```json
{
  "scripts": {
    "start": "node server.js",
    "init-db": "node init-db.js"
  }
}
```

So when you run:
```bash
npm start        # Actually runs: node server.js
npm run init-db  # Actually runs: node init-db.js
```

---

## 🎓 **Step-by-Step: First Time Setup**

### **1. Open Terminal**
- Mac: Applications → Utilities → Terminal
- Windows: Search "cmd" or "PowerShell"

### **2. Navigate to Project**
```bash
cd /Users/andre-d.lacra/ai-native-projects/projects-in-git/ai-native-payapp
```

### **3. Install Dependencies (First time only)**
```bash
npm install
```

**What this does:**
- Reads `package.json`
- Downloads required packages
- Creates `node_modules` folder

### **4. Initialize Database (First time only)**
```bash
npm run init-db
```

**What this does:**
- Creates `payment.db` file
- Sets up database tables
- Adds sample users

### **5. Start Server**
```bash
npm start
```

### **6. Open Browser**
```
http://localhost:3000
```

✅ **You're ready!** Login and use the app.

---

## 🔧 **Common Scenarios**

### **Scenario 1: Port Already in Use**

**Error:**
```
Error: listen EADDRINUSE: address already in use 0.0.0.0:3000
```

**Solution:**
```bash
# Kill existing server
lsof -ti:3000 | xargs kill -9 2>/dev/null

# Start again
npm start
```

---

### **Scenario 2: Server Won't Stop**

**Problem:** Ctrl+C doesn't work

**Solution:**
```bash
# Force kill
lsof -ti:3000 | xargs kill -9

# Or kill all node processes (use carefully!)
killall node
```

---

### **Scenario 3: Changes Not Showing**

**Problem:** Made code changes but they don't appear

**Solution:**
```bash
# Restart server
Ctrl + C
npm start

# Also: Hard refresh browser
Cmd + Shift + R  (Mac)
Ctrl + Shift + R (Windows/Linux)
```

---

### **Scenario 4: Can't Access on Phone**

**Problem:** Localhost doesn't work on mobile

**Solution:**
Use your network IP:
```
http://192.168.86.6:3000
```

**Find your IP:**
```bash
# Mac
ifconfig | grep "inet " | grep -v 127.0.0.1

# Windows
ipconfig

# Linux
ip addr show
```

---

## 🎯 **Best Practices**

### **1. Always Stop Server When Done**
```bash
Ctrl + C
```
Don't leave servers running unnecessarily.

### **2. Check Before Starting**
```bash
lsof -i:3000
```
Make sure port is free before starting.

### **3. Use Foreground for Development**
```bash
npm start  # NOT: npm start &
```
Easier to see logs and stop.

### **4. Use Background for Production-like Testing**
```bash
node server.js &
```
Only when you need terminal free.

---

## 📋 **Cheat Sheet**

Print this out or save it! 📌

```bash
# ============================================
# PAYAPP SERVER MANAGEMENT CHEAT SHEET
# ============================================

# NAVIGATE TO PROJECT
cd /Users/andre-d.lacra/ai-native-projects/projects-in-git/ai-native-payapp

# START SERVER
npm start                                      # Foreground
node server.js &                               # Background

# STOP SERVER
Ctrl + C                                       # If foreground
lsof -ti:3000 | xargs kill -9                  # Force stop

# CHECK STATUS
lsof -i:3000                                   # Check if running
curl http://localhost:3000                     # Test response

# RESTART
lsof -ti:3000 | xargs kill -9; npm start       # Clean restart

# BROWSER
http://localhost:3000                          # Local access
http://192.168.86.6:3000                       # Network access

# TROUBLESHOOTING
npm install                                    # Reinstall packages
npm run init-db                                # Reinitialize database
killall node                                   # Kill all Node processes
```

---

## 🆘 **Troubleshooting Guide**

### **Problem: "command not found: npm"**

**Solution:** Install Node.js
```bash
# Check if Node is installed
node --version
npm --version

# If not installed:
# Visit: https://nodejs.org/
# Download and install LTS version
```

---

### **Problem: "Cannot find module 'express'"**

**Solution:** Install dependencies
```bash
npm install
```

---

### **Problem: "EACCES: permission denied"**

**Solution:** Don't use sudo, fix permissions
```bash
# Check node/npm location
which node
which npm

# If you used sudo before, fix:
sudo chown -R $USER ~/.npm
```

---

### **Problem: Server starts but can't access in browser**

**Solution:** Check firewall
- Make sure port 3000 is not blocked
- Disable VPN temporarily
- Check antivirus settings

---

## 🌐 **Understanding Localhost**

### **What is localhost?**
- `localhost` = Your own computer
- `127.0.0.1` = IP address of localhost
- `0.0.0.0` = Listen on all network interfaces

### **What is port 3000?**
- Port = Door number for network traffic
- `:3000` = Your app's door number
- Can be changed (but 3000 is common for dev)

### **Full URL Explained:**
```
http://localhost:3000
 ↓        ↓         ↓
Protocol  Host    Port

http://      → Protocol (how to communicate)
localhost    → Your computer
:3000        → Port number (app's door)
```

---

## 💡 **Pro Tips**

### **Tip 1: Use Terminal Tabs**
Open multiple terminal tabs:
- Tab 1: Run server
- Tab 2: Run git commands
- Tab 3: Run other commands

```bash
# Mac: Cmd + T (new tab)
# Windows Terminal: Ctrl + Shift + T
```

---

### **Tip 2: Create Aliases**

Add to `~/.bash_profile` or `~/.zshrc`:

```bash
# PayApp shortcuts
alias payapp-start='cd /Users/andre-d.lacra/ai-native-projects/projects-in-git/ai-native-payapp && npm start'
alias payapp-stop='lsof -ti:3000 | xargs kill -9'
alias payapp-restart='lsof -ti:3000 | xargs kill -9 2>/dev/null; sleep 1; cd /Users/andre-d.lacra/ai-native-projects/projects-in-git/ai-native-payapp && npm start'
```

Then just use:
```bash
payapp-start     # Start server
payapp-stop      # Stop server
payapp-restart   # Restart server
```

---

### **Tip 3: View Logs**

Server logs appear in terminal. To save them:

```bash
# Save logs to file
npm start > server.log 2>&1

# View logs live
tail -f server.log
```

---

### **Tip 4: Use nodemon for Auto-Restart**

Install nodemon (restarts server on file changes):

```bash
# Install globally
npm install -g nodemon

# Use instead of node
nodemon server.js
```

Now server auto-restarts when you edit files! 🎉

---

## 🎓 **Learning Resources**

### **npm Basics:**
- Official npm docs: https://docs.npmjs.com/
- npm tutorial: https://nodesource.com/blog/an-absolute-beginners-guide-to-using-npm/

### **Node.js Basics:**
- Official Node docs: https://nodejs.org/en/docs/
- Node.js tutorial: https://nodejs.dev/learn

### **Terminal Commands:**
- Mac terminal guide: https://support.apple.com/guide/terminal/
- Linux command line: https://ubuntu.com/tutorials/command-line-for-beginners

---

## ✅ **Daily Workflow**

### **Starting Your Day:**
```bash
# 1. Open Terminal
# 2. Navigate to project
cd /Users/andre-d.lacra/ai-native-projects/projects-in-git/ai-native-payapp

# 3. Check if server is running
lsof -i:3000

# 4. If running, stop it
lsof -ti:3000 | xargs kill -9

# 5. Start fresh
npm start

# 6. Open browser
# Visit: http://localhost:3000
```

### **During Development:**
```bash
# Made changes? Restart:
Ctrl + C
npm start

# Check logs in terminal
# Look for errors or status messages
```

### **Ending Your Day:**
```bash
# Stop server
Ctrl + C

# Or force stop
lsof -ti:3000 | xargs kill -9

# Close terminal
exit
```

---

## 🎉 **You're All Set!**

You now know how to:
✅ Start the server  
✅ Stop the server  
✅ Check if it's running  
✅ Restart it  
✅ Troubleshoot common issues  
✅ Understand npm basics  

**Need help?** Just refer back to this guide! 📖

**Quick reminder:**
- `npm start` → Start server
- `Ctrl + C` → Stop server
- `lsof -i:3000` → Check if running
- `http://localhost:3000` → Access in browser

**Happy coding!** 🚀


