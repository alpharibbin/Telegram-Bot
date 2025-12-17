# Deploy Next.js Telegram Bot to Vercel

## 🌐 Live Demo

**Demo URL:** [https://telegram-bot-nextjs-omega.vercel.app](https://telegram-bot-nextjs-omega.vercel.app/)

---

## 🔄 How Telegram Webhooks Work

```
┌─────────────┐     ┌─────────────────┐     ┌──────────────────────┐
│   User      │────▶│  Telegram       │────▶│  Your Vercel App     │
│  (Telegram) │     │  Servers        │     │  /api/webhook        │
└─────────────┘     └─────────────────┘     └──────────────────────┘
      │                    │                         │
      │  1. User sends     │  2. Telegram forwards   │  3. Your code
      │     message        │     message to your     │     processes &
      │                    │     webhook URL         │     sends response
      └────────────────────┴─────────────────────────┘
```

### How it works:

1. **User sends a message** to your bot on Telegram
2. **Telegram receives the message** and checks if a webhook URL is registered
3. **Telegram sends a POST request** to your webhook URL (`https://your-app.vercel.app/api/webhook`) with the message data
4. **Your webhook handler** (`app/api/webhook/route.ts`) receives the request, processes it, and sends a response back using the Bot API
5. **User receives the response** in Telegram

### Why set webhook?

By default, Telegram doesn't know where to send messages. You must **register your webhook URL** with Telegram using the `setWebhook` API call. This tells Telegram: "Send all messages for this bot to this URL."

```bash
# This command registers your URL with Telegram
npm run set-webhook https://your-project.vercel.app/api/webhook
```

---

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

After deployment, get your Vercel URL and register the webhook with Telegram.

#### Option A: Browser URL (Easiest - No npm needed)

Just open this URL in your browser:

```
https://api.telegram.org/bot8581525362:AAFiKs_0uF5SOoIs7-LpVf3MFhzqugbVnkw/setWebhook?url=https://your-project.vercel.app/api/webhook
```

Replace `your-project.vercel.app` with your actual Vercel URL.

#### Option B: Using curl

```bash
curl "https://api.telegram.org/bot8581525362:AAFiKs_0uF5SOoIs7-LpVf3MFhzqugbVnkw/setWebhook?url=https://your-project.vercel.app/api/webhook"
```

#### Option C: Using npm script

```bash
cd nextjs
npm run set-webhook https://your-project.vercel.app/api/webhook
```

#### Verify webhook is set:

```
https://api.telegram.org/bot8581525362:AAFiKs_0uF5SOoIs7-LpVf3MFhzqugbVnkw/getWebhookInfo
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

