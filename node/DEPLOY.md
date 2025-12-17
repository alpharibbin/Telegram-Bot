# Quick Deployment Guide to Vercel

## 🚀 Quick Start

### 1. Prepare Your Project

```bash
cd node
npm install
```

### 2. Create .env File

Create a `.env` file in the `node` folder:

```env
TELEGRAM_BOT_TOKEN=8581525362:AAFiKs_0uF5SOoIs7-LpVf3MFhzqugbVnkw
```

### 3. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit: Telegram bot with Node.js"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

### 4. Deploy to Vercel

#### Option A: Using Vercel Dashboard (Deploy from Subdirectory)

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your GitHub repository
4. **IMPORTANT:** Before deploying, click on "Root Directory" and set it to `node`
   - Click "Edit" next to Root Directory
   - Select `node` folder
   - Click "Continue"
5. Framework Preset: Leave as "Other" or "Vercel"
6. Build Command: Leave empty (not needed for serverless functions)
7. Output Directory: Leave empty
8. Install Command: `npm install` (should auto-detect)
9. Click "Deploy"
10. After deployment, go to **Settings** → **Environment Variables**
11. Add environment variable:
    - Name: `TELEGRAM_BOT_TOKEN`
    - Value: `8581525362:AAFiKs_0uF5SOoIs7-LpVf3MFhzqugbVnkw`
    - Environment: Production, Preview, Development (select all)
12. Click "Save"
13. Go to **Deployments** tab and click the three dots (⋯) on the latest deployment → **Redeploy**

#### Option B: Using Vercel CLI (Deploy from Subdirectory)

**From the root of your project:**

```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login

# Deploy from the node subdirectory
cd node
vercel
```

When prompted:
- Set up and deploy? **Yes**
- Which scope? **Your account**
- Link to existing project? **No**
- Project name? **telegram-bot-nodejs** (or your choice)
- Directory? **.** (current directory - node folder)
- Override settings? **No**

Then add environment variable (from the node folder):
```bash
vercel env add TELEGRAM_BOT_TOKEN
# Paste: 8581525362:AAFiKs_0uF5SOoIs7-LpVf3MFhzqugbVnkw
# Select: Production, Preview, Development
```

Redeploy:
```bash
vercel --prod
```

**Or deploy directly from root specifying the directory:**

```bash
# From project root
vercel --cwd node
```

### 5. Set Webhook

After deployment, Vercel will give you a URL like:
`https://your-project.vercel.app`

Set the webhook:

```bash
npm run set-webhook https://your-project.vercel.app/api/webhook
```

Or manually:
```bash
node scripts/set-webhook.js https://your-project.vercel.app/api/webhook
```

### 6. Test Your Bot

1. Open Telegram
2. Search for your bot (the username BotFather gave you)
3. Send `/start` command
4. Your bot should respond! 🎉

## 🔍 Verify Deployment

Check your Vercel dashboard:
- Functions tab should show `/api/webhook`
- Logs tab will show webhook requests
- Settings > Environment Variables should have `TELEGRAM_BOT_TOKEN`

## 🐛 Troubleshooting

### Bot not responding?
- Check Vercel function logs
- Verify `TELEGRAM_BOT_TOKEN` is set in Vercel environment variables
- Make sure webhook is set correctly
- Test webhook URL: `curl -X POST https://your-project.vercel.app/api/webhook`

### Webhook not working?
- Ensure webhook URL uses HTTPS (Vercel provides this automatically)
- Check that webhook endpoint returns 200 status
- Verify the function is deployed correctly

### Need to update?
Just push to GitHub and Vercel will auto-deploy:
```bash
git add .
git commit -m "Update bot"
git push
```

