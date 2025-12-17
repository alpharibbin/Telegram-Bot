# Telegram Webhook Setup Guide

## 🔄 How to Register Your Webhook

After deploying your bot, you need to tell Telegram where to send messages. Here are all the ways to do it:

---

## ✅ Method 1: Browser URL (Easiest)

Just open this URL in your browser:

```
https://api.telegram.org/bot<BOT_TOKEN>/setWebhook?url=https://your-project.vercel.app/api/webhook
```

**Example with your token:**
```
https://api.telegram.org/bot8581525362:AAFiKs_0uF5SOoIs7-LpVf3MFhzqugbVnkw/setWebhook?url=https://your-project.vercel.app/api/webhook
```

✔ No npm needed  
✔ No scripts  
✔ Fastest way

---

## ✅ Method 2: Using curl (Command Line)

### Simple GET request:
```bash
curl "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook?url=https://your-project.vercel.app/api/webhook"
```

### POST request (recommended for production):
```bash
curl -X POST "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://your-project.vercel.app/api/webhook"}'
```

### With additional options:
```bash
curl -X POST "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-project.vercel.app/api/webhook",
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
    url: "https://your-project.vercel.app/api/webhook"
  })
});
```

---

## ✅ Method 4: npm script (if available)

```bash
cd nextjs  # or nodejs
npm install
npm run set-webhook https://your-project.vercel.app/api/webhook
```

---

## 🔍 Verify Webhook is Set

Open this URL in browser or use curl:

```
https://api.telegram.org/bot<BOT_TOKEN>/getWebhookInfo
```

**Example:**
```
https://api.telegram.org/bot8581525362:AAFiKs_0uF5SOoIs7-LpVf3MFhzqugbVnkw/getWebhookInfo
```

You should see:
```json
{
  "ok": true,
  "result": {
    "url": "https://your-project.vercel.app/api/webhook",
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

---

## 🔑 Replace These Values

- `<BOT_TOKEN>` → Your bot token from BotFather
- `https://your-project.vercel.app` → Your actual Vercel deployment URL

