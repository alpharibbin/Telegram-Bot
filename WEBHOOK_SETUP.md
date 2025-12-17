# Telegram Webhook Setup Guide

## 🔄 How to Register Your Webhook

After deploying your bot, you need to tell Telegram where to send messages. Here are all the ways to do it:

**Replace these values:**
- `<BOT_TOKEN>` → Your bot token from BotFather
- `<YOUR_WEBHOOK_URL>` → Your deployment URL (e.g., `https://your-app.vercel.app/api/webhook`)

---

## ✅ Method 1: Browser URL (Easiest)

Just open this URL in your browser:

```
https://api.telegram.org/bot<BOT_TOKEN>/setWebhook?url=<YOUR_WEBHOOK_URL>
```

✔ No npm needed  
✔ No scripts  
✔ Fastest way

---

## ✅ Method 2: Using curl (Command Line)

### Simple GET request:
```bash
curl "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook?url=<YOUR_WEBHOOK_URL>"
```

### POST request (recommended for production):
```bash
curl -X POST "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "<YOUR_WEBHOOK_URL>"}'
```

### With additional options:
```bash
curl -X POST "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "<YOUR_WEBHOOK_URL>",
    "allowed_updates": ["message", "callback_query"]
  }'
```

---

## ✅ Method 3: Using Node.js fetch

```javascript
fetch(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/setWebhook`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    url: "<YOUR_WEBHOOK_URL>"
  })
});
```

---

## ✅ Method 4: npm script (if available)

```bash
cd nextjs  # or nodejs
npm install
npm run set-webhook <YOUR_WEBHOOK_URL>
```

---

## 🔍 Verify Webhook is Set

```
https://api.telegram.org/bot<BOT_TOKEN>/getWebhookInfo
```

You should see:
```json
{
  "ok": true,
  "result": {
    "url": "<YOUR_WEBHOOK_URL>",
    "has_custom_certificate": false,
    "pending_update_count": 0
  }
}
```

---

## ❌ Delete Webhook (if needed)

```
https://api.telegram.org/bot<BOT_TOKEN>/deleteWebhook
```

---

## 📊 Method Comparison

| Method             | Needs npm | Recommended |
| ------------------ | --------- | ----------- |
| Browser URL        | ❌        | ⭐⭐⭐⭐      |
| curl POST request  | ❌        | ⭐⭐⭐⭐⭐     |
| Node.js fetch      | ❌        | ⭐⭐⭐⭐      |
| npm script         | ✅        | ⭐⭐         |
