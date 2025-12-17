# Deploy Node.js Bot from Root Repository

This guide explains how to deploy **only the `node` folder** to Vercel when your entire project is in a GitHub repository.

## 🎯 Quick Deployment Steps

### Method 1: Vercel Dashboard (Recommended)

1. **Go to Vercel Dashboard**
   - Visit [vercel.com](https://vercel.com) and sign in
   - Click "New Project"

2. **Import Repository**
   - Connect your GitHub account if not already connected
   - Select your repository: `Telegram Bot`
   - Click "Import"

3. **Configure Project Settings**
   - **Root Directory**: Click "Edit" → Select `node` folder → Click "Continue"
   - **Framework Preset**: Leave as "Other" or "Vercel"
   - **Build Command**: Leave empty (not needed)
   - **Output Directory**: Leave empty
   - **Install Command**: `npm install` (auto-detected)
   - Click "Deploy"

4. **Add Environment Variable**
   - After deployment, go to **Settings** → **Environment Variables**
   - Click "Add New"
   - Name: `TELEGRAM_BOT_TOKEN`
   - Value: `8581525362:AAFiKs_0uF5SOoIs7-LpVf3MFhzqugbVnkw`
   - Select all environments: Production, Preview, Development
   - Click "Save"

5. **Redeploy**
   - Go to **Deployments** tab
   - Click the three dots (⋯) on the latest deployment
   - Click "Redeploy"
   - This ensures the environment variable is included

6. **Set Webhook**
   - Copy your deployment URL (e.g., `https://your-project.vercel.app`)
   - Run from the `node` folder:
     ```bash
     cd node
     npm install
     npm run set-webhook https://your-project.vercel.app/api/webhook
     ```

### Method 2: Vercel CLI

**From the project root:**

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy from node subdirectory
vercel --cwd node
```

When prompted:
- Set up and deploy? **Yes**
- Which scope? **Your account**
- Link to existing project? **No** (or **Yes** if redeploying)
- Project name? **telegram-bot-nodejs**

Add environment variable:
```bash
cd node
vercel env add TELEGRAM_BOT_TOKEN
# Paste: 8581525362:AAFiKs_0uF5SOoIs7-LpVf3MFhzqugbVnkw
# Select: Production, Preview, Development
```

Deploy to production:
```bash
vercel --prod --cwd node
```

## ✅ Verify Deployment

1. **Check Vercel Dashboard**
   - Go to your project → **Functions** tab
   - You should see `/api/webhook` listed

2. **Test Webhook**
   ```bash
   curl -X POST https://your-project.vercel.app/api/webhook
   ```

3. **Check Logs**
   - Go to **Deployments** → Click on latest deployment → **Logs**
   - Send a message to your bot on Telegram
   - Check logs for incoming requests

4. **Test Bot**
   - Open Telegram
   - Search for your bot
   - Send `/start` command
   - Bot should respond! 🎉

## 🔧 Important Notes

- **Root Directory**: Always set to `node` in Vercel settings
- **Environment Variables**: Must be set in Vercel dashboard, not in `.env` file
- **Webhook URL**: Use your Vercel deployment URL + `/api/webhook`
- **Auto-deploy**: Vercel will auto-deploy when you push to GitHub (only if root directory is set correctly)

## 🐛 Troubleshooting

### "Cannot find module" errors?
- Make sure Root Directory is set to `node` in Vercel settings
- Verify `package.json` exists in the `node` folder
- Check that `node_modules` is not in `.gitignore` incorrectly

### Bot not responding?
- Verify `TELEGRAM_BOT_TOKEN` is set in Vercel environment variables
- Check that webhook is set: `npm run set-webhook <your-url>/api/webhook`
- Review Vercel function logs for errors

### Webhook returns 404?
- Ensure the route `/api/webhook` is accessible
- Check `vercel.json` configuration
- Verify the function is deployed correctly

## 📝 Updating Your Bot

After making changes:

1. **Commit and push to GitHub:**
   ```bash
   git add .
   git commit -m "Update bot"
   git push
   ```

2. **Vercel will auto-deploy** (if GitHub integration is set up)

3. **Or manually redeploy:**
   - Go to Vercel dashboard → Deployments → Redeploy
   - Or run: `vercel --prod --cwd node`

## 🔗 Useful Links

- [Vercel Documentation](https://vercel.com/docs)
- [Deploying Subdirectories](https://vercel.com/docs/concepts/git#deploying-subdirectories)
- [Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

