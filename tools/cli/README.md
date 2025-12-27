# CLI Tools

Command-line helpers for Telegram bot development.

---

## 🔧 Available Scripts (Conceptual)

These are typical CLI commands you can implement as small Node.js scripts or shell one-liners.

### 1. Set Webhook

Register a webhook URL for your bot:

node tools/cli/set-webhook.js https://your-domain.tld/webhook
```

Example (`set-webhook.js`):

require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

const token = process.env.TELEGRAM_BOT_TOKEN;
const url = process.argv[2];

if (!url) {
  console.error('Usage: node set-webhook.js <WEBHOOK_URL>');
  process.exit(1);
}

const bot = new TelegramBot(token);

(async () => {
  await bot.setWebHook(url);
  console.log('Webhook set to:', url);
})();
