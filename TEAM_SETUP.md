# 🚀 KOVARI Team Setup Guide (Cloud Redis)

This guide helps your team set up the development environment with the cloud-hosted Redis on Render.com.

## 🎯 **Quick Setup for Team Members**

### **Step 1: Clone the Repository**
```bash
git clone <your-repo-url>
cd KOVARI
npm install
```

### **Step 2: Set Up Environment Variables**
Create a `.env.local` file in the root directory:

```env
# Redis Cloud Connection (Render.com)
REDIS_URL=rediss://default:YOUR_PASSWORD@YOUR_INSTANCE.render.com:6379

# Other environment variables...
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
```

### **Step 3: Test Redis Connection**
```bash
node test-redis-connection.js
```

**Expected Output:**
- ✅ REDIS_URL: Set
- ✅ Connected successfully!
- ✅ Ping response: PONG

### **Step 4: Create Test Data**
```bash
node create-simple-test-data.js
```

**Expected Output:**
- ✅ Connected to Redis successfully!
- ✅ Stored data for user_mumbai_1
- ✅ Successfully created test data for 8 users!

### **Step 5: Start Development**
```bash
npm run dev
```

## 🔑 **Getting Your Redis URL**

### **From Team Lead:**
Ask your team lead for the Redis connection string.

### **From Render Dashboard:**
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Find your Redis service
3. Copy the **External Key Value URL**
4. Format: `rediss://default:password@instance.render.com:6379`

## 🧪 **Testing Your Setup**

### **Test 1: Redis Connection**
```bash
node test-redis-connection.js
```

### **Test 2: Test Data Creation**
```bash
node create-simple-test-data.js
```

### **Test 3: Search Functionality**
1. Start the app: `npm run dev`
2. Go to explore page
3. Search for "Goa" with dates around October 12-17, 2025
4. Should see matches!

## 🚨 **Common Issues & Solutions**

### **Issue: "REDIS_URL: Not set"**
**Solution:**
- Check if `.env.local` exists
- Verify the file is in the root directory
- Make sure there are no spaces around `=`

### **Issue: "Connection failed"**
**Solution:**
- Verify your IP is whitelisted in Render Access Control
- Check if Redis status is "Active" in Render dashboard
- Verify the password in your Redis URL

### **Issue: "No matches found"**
**Solution:**
- Run `node create-simple-test-data.js` to create test data
- Check if test data exists in Redis
- Verify search dates match test data dates

## 📋 **Daily Workflow**

### **Morning Setup:**
```bash
# 1. Pull latest changes
git pull origin main

# 2. Check Redis connection
node test-redis-connection.js

# 3. Start development
npm run dev
```

### **If Test Data is Missing:**
```bash
node create-simple-test-data.js
```

## 🔒 **Security Notes**

- **Never commit** `.env.local` to git
- **Keep your Redis password** secure
- **Don't share** your Redis connection string publicly
- **Use Access Control** in Render to restrict IP access

## 🆘 **Need Help?**

1. **Check this guide** first
2. **Test Redis connection**: `node test-redis-connection.js`
3. **Ask team lead** for Redis URL
4. **Check Render dashboard** for Redis status
5. **Verify your IP** is whitelisted in Access Control

---

**Happy coding! 🎯**

## 📞 **Team Contacts**

- **Team Lead**: [Name] - [Email]
- **Redis Admin**: [Name] - [Email]
- **Tech Support**: [Name] - [Email]
