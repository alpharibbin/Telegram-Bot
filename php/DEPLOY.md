# Deploy PHP Telegram Bot to Render

## 🐳 Docker Deployment on Render

### Method 1: Using Render Dashboard

1. **Go to [render.com](https://render.com)** and sign in
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure:
   - **Name**: `telegram-bot-php`
   - **Root Directory**: `php`
   - **Environment**: `Docker`
   - **Dockerfile Path**: `./Dockerfile`
5. Add **Environment Variable**:
   - Key: `TELEGRAM_BOT_TOKEN`
   - Value: `8262047387:AAEaQYI7PKAxLCwabtmM9jrnE9rW8nvWU50`
6. Click **"Create Web Service"**

### Method 2: Using render.yaml (Blueprint)

1. Push your code to GitHub
2. Go to Render Dashboard
3. Click **"New +"** → **"Blueprint"**
4. Select your repository
5. Render will auto-detect `render.yaml` and deploy

---

## 🔗 Set Webhook

After deployment, get your Render URL (e.g., `https://telegram-bot-php.onrender.com`)

### Option A: Browser URL (Easiest)

Open this in your browser:

```
https://api.telegram.org/bot8262047387:AAEaQYI7PKAxLCwabtmM9jrnE9rW8nvWU50/setWebhook?url=https://telegram-bot-php.onrender.com/webhook.php
```

### Option B: Using curl

```bash
curl "https://api.telegram.org/bot8262047387:AAEaQYI7PKAxLCwabtmM9jrnE9rW8nvWU50/setWebhook?url=https://telegram-bot-php.onrender.com/webhook.php"
```

### Verify webhook:

```
https://api.telegram.org/bot8262047387:AAEaQYI7PKAxLCwabtmM9jrnE9rW8nvWU50/getWebhookInfo
```

---

## 🧪 Test Locally with Docker

```bash
cd php

# Build image
docker build -t telegram-bot-php .

# Run container
docker run -p 8080:80 -e TELEGRAM_BOT_TOKEN=8262047387:AAEaQYI7PKAxLCwabtmM9jrnE9rW8nvWU50 telegram-bot-php
```

Visit http://localhost:8080

---

## 📁 Project Structure

```
php/
├── Dockerfile          # Docker configuration
├── composer.json       # PHP dependencies
├── webhook.php         # Telegram webhook handler
├── index.php           # Landing page
├── .htaccess           # Apache rewrite rules
├── render.yaml         # Render blueprint
└── DEPLOY.md           # This file
```

---

## 🐛 Troubleshooting

### Bot not responding?
- Check Render logs in dashboard
- Verify `TELEGRAM_BOT_TOKEN` environment variable is set
- Make sure webhook URL ends with `/webhook.php`

### Docker build failing?
- Check Dockerfile syntax
- Verify composer.json is valid
- Review Render build logs

### Webhook errors?
- Ensure URL uses HTTPS (Render provides this)
- Check webhook endpoint returns 200 status
- Verify with `getWebhookInfo` API call

