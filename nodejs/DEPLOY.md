# Deploy Node.js Telegram Bot to Vercel

## 🌐 Live Demo

**Demo URL:** Coming soon

---

## 🔄 How Telegram Webhooks Work

```
┌─────────────┐     ┌─────────────────┐     ┌──────────────────────┐
│   User      │────▶│  Telegram       │────▶│  Your Vercel App     │
│  (Telegram) │     │  Servers        │     │  /api/webhook        │
└─────────────┘     └─────────────────┘     └──────────────────────┘
```

1. **User sends message** → Telegram receives it
2. **Telegram forwards** the message to your webhook URL (POST request)
3. **Your code processes** the message and sends response back via Bot API

---

## 🚀 Quick Deployment Steps

### 1. Deploy to Vercel

#### Vercel Dashboard

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your GitHub repository
4. **Set Root Directory to `nodejs`**
5. Click "Deploy"
6. After deployment, go to **Settings** → **Environment Variables**
7. Add:
   - Name: `TELEGRAM_BOT_TOKEN`
   - Value: `8581525362:AAFiKs_0uF5SOoIs7-LpVf3MFhzqugbVnkw`
8. Go to **Deployments** → Click ⋯ → **Redeploy**

### 2. Set Webhook

After deployment, register the webhook with Telegram.

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

#### Option C: POST request (recommended for production)

```bash
curl -X POST "https://api.telegram.org/bot8581525362:AAFiKs_0uF5SOoIs7-LpVf3MFhzqugbVnkw/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://your-project.vercel.app/api/webhook"}'
```

#### Option D: Using npm script

```bash
cd nodejs
npm install
npm run set-webhook https://your-project.vercel.app/api/webhook
```

#### Verify webhook is set:

```
https://api.telegram.org/bot8581525362:AAFiKs_0uF5SOoIs7-LpVf3MFhzqugbVnkw/getWebhookInfo
```

### 3. Test Your Bot

1. Open Telegram
2. Search for your bot
3. Send `/start` command
4. Bot should respond! 🎉

---

## 📁 Project Structure

```
nodejs/
├── api/
│   └── webhook.js      # Vercel serverless function
├── scripts/
│   └── set-webhook.js  # Webhook setup script
├── bot.js              # Local development (polling)
├── package.json
└── vercel.json
```

---

## 🐛 Troubleshooting

### Bot not responding?
- Check Vercel function logs
- Verify `TELEGRAM_BOT_TOKEN` is set in Vercel environment variables
- Make sure webhook is set correctly

### Verify webhook:
```
https://api.telegram.org/bot<BOT_TOKEN>/getWebhookInfo
```

### Delete webhook (if needed):
```
https://api.telegram.org/bot<BOT_TOKEN>/deleteWebhook
```

