# Deploy Next.js Telegram Bot to Vercel

## 🚀 Quick Deployment Steps

### 1. Install Dependencies Locally (for webhook setup)

```bash
cd nextjs
npm install
```

### 2. Create .env File (for local testing)

```bash
TELEGRAM_BOT_TOKEN=8581525362:AAFiKs_0uF5SOoIs7-LpVf3MFhzqugbVnkw
```

### 3. Deploy to Vercel

#### Option A: Vercel Dashboard

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your GitHub repository
4. **Set Root Directory to `nextjs`**
   - Click "Edit" next to Root Directory
   - Select `nextjs` folder
   - Click "Continue"
5. Framework Preset: Should auto-detect **Next.js**
6. Click "Deploy"
7. After deployment, go to **Settings** → **Environment Variables**
8. Add:
   - Name: `TELEGRAM_BOT_TOKEN`
   - Value: `8581525362:AAFiKs_0uF5SOoIs7-LpVf3MFhzqugbVnkw`
9. Go to **Deployments** → Click ⋯ → **Redeploy**

#### Option B: Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy from nextjs folder
cd nextjs
vercel

# Add environment variable
vercel env add TELEGRAM_BOT_TOKEN
# Paste: 8581525362:AAFiKs_0uF5SOoIs7-LpVf3MFhzqugbVnkw

# Deploy to production
vercel --prod
```

### 4. Set Webhook

After deployment, get your Vercel URL and set the webhook:

```bash
cd nextjs
npm run set-webhook https://your-project.vercel.app/api/webhook
```

### 5. Test Your Bot

1. Open Telegram
2. Search for your bot
3. Send `/start` command
4. Bot should respond! 🎉

## 📁 Project Structure

```
nextjs/
├── app/
│   ├── api/
│   │   └── webhook/
│   │       └── route.ts    # Webhook handler
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Home page
├── scripts/
│   └── set-webhook.js      # Webhook setup script
├── .env                    # Local env (not in git)
├── .gitignore
├── next.config.js
├── package.json
└── tsconfig.json
```

## ✅ Verify Deployment

1. Visit your Vercel URL - you should see the bot landing page
2. Visit `/api/webhook` - should return `{"status":"Telegram Bot Webhook is running!"}`
3. Send a message to your bot on Telegram

## 🐛 Troubleshooting

### Bot not responding?
- Check Vercel function logs
- Verify `TELEGRAM_BOT_TOKEN` is set
- Make sure webhook is set correctly

### Build errors?
- Ensure Node.js 18+ is used
- Check that all dependencies are installed
- Review build logs in Vercel dashboard

### Need to update?
Push to GitHub and Vercel will auto-deploy:
```bash
git add .
git commit -m "Update bot"
git push
```

