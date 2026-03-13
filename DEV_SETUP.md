# 🚀 Kovari Development Setup Guide

This guide will help you set up the Kovari development environment quickly and easily.

## 🎯 Quick Start (Recommended)

### First Time Setup
```bash
# 1. Set up your .env.local file with Render Redis URL
# 2. Run the automated setup
npm run setup
```

### Daily Development
```bash
# Just run dev - it will automatically check Redis and create test data if needed
npm run dev
```

## 🔧 Manual Setup (Alternative)

### 1. Redis is Deployed on Render.com
```bash
# Redis is now cloud-hosted - no local Docker needed!
# Your .env.local should contain:
# REDIS_URL=rediss://default:password@your-redis-instance.render.com:6379
```

### 2. Create Test Data
```bash
# Create test sessions for development (with future dates - recommended)
npm run fresh-test-data

# Or use the original test data
npm run test-data
```

### 3. Start Development Server
```bash
npm run dev
```

## 📋 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server with automatic Redis check |
| `npm run setup` | Full development environment setup |
| `npm run quick-start` | Check Redis and test data status |
| `npm run redis:start` | Redis is deployed on Render.com |
| `npm run redis:stop` | Redis is deployed on Render.com |
| `npm run redis:restart` | Redis is deployed on Render.com |
| `npm run redis:logs` | View logs at Render.com dashboard |
| `npm run test-data` | Create test data manually |
| `npm run fresh-test-data` | Create test data with future dates (recommended) |

## ☁️ Cloud Redis (Render.com)

### Redis Management
```bash
# Redis is now deployed on Render.com
# No local Docker needed!

# View Redis status and logs:
# https://dashboard.render.com

# Redis connection string format:
# rediss://default:password@your-instance.render.com:6379
```

### Environment Setup
```bash
# Make sure your .env.local contains:
REDIS_URL=rediss://default:YOUR_PASSWORD@YOUR_INSTANCE.render.com:6379
```

## 🔍 Troubleshooting

### Redis Connection Issues
```bash
# Check if Redis is accessible
node test-redis-connection.js

# Check your .env.local file
echo %REDIS_URL%

# Verify Render Redis status
# https://dashboard.render.com
```

### Test Data Issues
```bash
# Clear Redis data (from Render dashboard)
# https://dashboard.render.com

# Recreate test data
npm run simple-test-data
```

### Environment Issues
```bash
# Check environment variables
echo %REDIS_URL%

# Verify .env.local file exists
dir .env.local

# Test Redis connection
node test-redis-connection.js
```

## 📁 File Structure

```
kovari/
├── docker-compose.yml          # Docker services configuration
├── setup-dev.js               # Automated setup script
├── quick-start.js             # Quick start with Redis check
├── create-redis-test-sessions.js  # Test data creation
├── package.json               # NPM scripts
└── DEV_SETUP.md              # This file
```

## 🎉 What Happens Automatically

When you run `npm run dev`:

1. ✅ Checks if Redis is accessible (cloud-hosted)
2. ✅ Verifies connection to Render Redis
3. ✅ Checks if test data exists
4. ✅ Creates test data if needed
5. ✅ Starts Next.js development server

## 🚨 Prerequisites

- Node.js 18+ installed
- NPM or Yarn package manager
- `.env.local` file with Render Redis URL

**Note**: Redis is now cloud-hosted on Render.com - no Docker needed!

## 💡 Tips

- **First time**: Set up `.env.local` with your Render Redis URL
- **Daily use**: Just run `npm run dev` - it handles everything automatically
- **Redis issues**: Check Render.com dashboard for Redis status
- **Test data**: Use `npm run simple-test-data` to create test data (recommended)
- **Connection test**: Use `npm run test-redis-connection` to verify Redis connection

## 🆘 Still Having Issues?

1. Check your `.env.local` file has the correct `REDIS_URL`
2. Verify Render Redis is running: https://dashboard.render.com
3. Test connection: `node test-redis-connection.js`
4. Check environment variables: `echo %REDIS_URL%`
5. Check the troubleshooting section above

---

**Happy coding! 🎯**
