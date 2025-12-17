# Bot Setup & Execution

A complete guide to setting up, running, and managing your Telegram bot.

---

## 📖 Table of Contents

1. [Bot Lifecycle](#bot-lifecycle)
2. [Local Development](#local-development)
3. [Webhook Setup](#webhook-setup)
4. [Webhook Security](#webhook-security)
5. [Polling Setup](#polling-setup)
6. [Switching Between Polling ↔ Webhook](#switching-between-polling--webhook)
7. [Multi-Bot Hosting](#multi-bot-hosting)

---

## Bot Lifecycle

Understanding how a bot runs from start to finish.

### Lifecycle Stages

```
┌─────────────────────────────────────────────────────────────┐
│                     BOT LIFECYCLE                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. INITIALIZATION                                           │
│     ├── Load environment variables                           │
│     ├── Validate bot token                                   │
│     ├── Initialize dependencies (DB, cache, etc.)            │
│     └── Register command handlers                            │
│                                                              │
│  2. CONNECTION                                               │
│     ├── [Polling] Start getUpdates loop                      │
│     └── [Webhook] Register webhook URL & start server        │
│                                                              │
│  3. RUNNING (Main Loop)                                      │
│     ├── Receive update                                       │
│     ├── Parse update type                                    │
│     ├── Route to appropriate handler                         │
│     ├── Process business logic                               │
│     ├── Send response(s)                                     │
│     └── Log & handle errors                                  │
│                                                              │
│  4. SHUTDOWN                                                 │
│     ├── Stop receiving updates                               │
│     ├── Complete pending operations                          │
│     ├── Close database connections                           │
│     └── Clean up resources                                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Initialization Example

```javascript
// 1. Load environment
require('dotenv').config();
const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  console.error('❌ TELEGRAM_BOT_TOKEN is required');
  process.exit(1);
}

// 2. Initialize bot
const TelegramBot = require('node-telegram-bot-api');
const bot = new TelegramBot(token);

// 3. Initialize dependencies
const db = await connectDatabase();
const cache = await initCache();

// 4. Register handlers
bot.onText(/\/start/, handleStart);
bot.onText(/\/help/, handleHelp);
bot.on('message', handleMessage);
bot.on('callback_query', handleCallback);

// 5. Start bot
console.log('🤖 Bot is running...');
```

### Graceful Shutdown

```javascript
// Handle shutdown signals
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

async function shutdown() {
  console.log('🛑 Shutting down...');
  
  // Stop polling
  bot.stopPolling();
  
  // Close connections
  await db.close();
  await cache.quit();
  
  console.log('✅ Shutdown complete');
  process.exit(0);
}
```

---

## Local Development

Setting up your development environment.

### Prerequisites

```bash
# Node.js
node --version  # v18+

# Create project
mkdir my-telegram-bot
cd my-telegram-bot
npm init -y

# Install dependencies
npm install node-telegram-bot-api dotenv
```

### Project Structure

```
my-telegram-bot/
├── src/
│   ├── index.js          # Entry point
│   ├── handlers/
│   │   ├── commands.js   # Command handlers
│   │   ├── messages.js   # Message handlers
│   │   └── callbacks.js  # Callback handlers
│   └── utils/
│       └── helpers.js    # Utility functions
├── .env                  # Environment variables (git ignored)
├── .env.example          # Example env file
├── .gitignore
└── package.json
```

### Environment Setup

```bash
# .env
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
NODE_ENV=development
```

```bash
# .env.example (commit this)
TELEGRAM_BOT_TOKEN=your_bot_token_here
NODE_ENV=development
```

```bash
# .gitignore
node_modules/
.env
*.log
```

### Simple Local Bot

```javascript
// src/index.js
require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

// /start command
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, 'Hello! I am your bot 🤖');
});

// Echo all messages
bot.on('message', (msg) => {
  if (!msg.text?.startsWith('/')) {
    bot.sendMessage(msg.chat.id, `You said: ${msg.text}`);
  }
});

console.log('🤖 Bot is running in polling mode...');
```

### Running Locally

```bash
# Development (with auto-restart)
npm install -D nodemon
npx nodemon src/index.js

# Or simple run
node src/index.js
```

### Testing Your Bot

1. Open Telegram
2. Search for your bot by username
3. Send `/start`
4. Bot should respond!

---

## Webhook Setup

Configure your bot to receive updates via webhooks.

### Requirements

- ✅ Public HTTPS URL
- ✅ Valid SSL certificate (self-signed NOT recommended)
- ✅ Port 443, 80, 88, or 8443
- ✅ Server responds within 60 seconds

### Setting Up Webhook

#### Method 1: Browser/curl (Simplest)

```bash
# Set webhook
https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://yourdomain.com/webhook

# With curl
curl "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://yourdomain.com/webhook"
```

#### Method 2: POST with options

```bash
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://yourdomain.com/webhook",
    "allowed_updates": ["message", "callback_query"],
    "drop_pending_updates": true,
    "max_connections": 40
  }'
```

### Webhook Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `url` | String | HTTPS URL for webhook |
| `certificate` | InputFile | Self-signed cert (optional) |
| `ip_address` | String | Fixed IP for webhook |
| `max_connections` | Integer | Max simultaneous connections (1-100, default 40) |
| `allowed_updates` | Array | Update types to receive |
| `drop_pending_updates` | Boolean | Drop old updates on set |
| `secret_token` | String | Secret for validation (1-256 chars) |

### Allowed Updates

```json
{
  "allowed_updates": [
    "message",
    "edited_message",
    "channel_post",
    "edited_channel_post",
    "inline_query",
    "chosen_inline_result",
    "callback_query",
    "shipping_query",
    "pre_checkout_query",
    "poll",
    "poll_answer",
    "my_chat_member",
    "chat_member",
    "chat_join_request"
  ]
}
```

### Webhook Server Example (Node.js/Express)

```javascript
const express = require('express');
const TelegramBot = require('node-telegram-bot-api');

const app = express();
const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token);

// Parse JSON bodies
app.use(express.json());

// Webhook endpoint
app.post('/webhook', (req, res) => {
  const update = req.body;
  
  // Process update
  if (update.message) {
    const chatId = update.message.chat.id;
    const text = update.message.text;
    
    if (text === '/start') {
      bot.sendMessage(chatId, 'Hello from webhook! 🚀');
    }
  }
  
  // Must respond with 200 OK
  res.sendStatus(200);
});

// Health check
app.get('/', (req, res) => {
  res.send('Bot is running!');
});

app.listen(3000, () => {
  console.log('Webhook server running on port 3000');
});
```

### Webhook Server Example (Next.js)

```typescript
// app/api/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import TelegramBot from 'node-telegram-bot-api';

const token = process.env.TELEGRAM_BOT_TOKEN!;
const bot = new TelegramBot(token);

export async function POST(request: NextRequest) {
  const update = await request.json();
  
  if (update.message) {
    const chatId = update.message.chat.id;
    const text = update.message.text;
    
    if (text === '/start') {
      await bot.sendMessage(chatId, 'Hello from Next.js! 🚀');
    }
  }
  
  return NextResponse.json({ ok: true });
}
```

### Verify Webhook Status

```bash
curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"
```

Response:
```json
{
  "ok": true,
  "result": {
    "url": "https://yourdomain.com/webhook",
    "has_custom_certificate": false,
    "pending_update_count": 0,
    "last_error_date": null,
    "last_error_message": null,
    "max_connections": 40,
    "allowed_updates": ["message", "callback_query"]
  }
}
```

### Common Webhook Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `Wrong response from webhook` | Server returns non-200 | Always return 200 OK |
| `SSL certificate problem` | Invalid/expired cert | Use valid SSL (Let's Encrypt) |
| `Connection timed out` | Server too slow | Respond within 60s |
| `Bad Gateway` | Server not reachable | Check firewall, DNS |

---

## Webhook Security

Protecting your webhook endpoint from abuse.

### 1. Secret Token Validation

Telegram can send a secret token in headers for validation.

**Set webhook with secret:**
```bash
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
  -d "url=https://yourdomain.com/webhook" \
  -d "secret_token=my_super_secret_token_123"
```

**Validate in your server:**
```javascript
app.post('/webhook', (req, res) => {
  const secretToken = req.headers['x-telegram-bot-api-secret-token'];
  
  if (secretToken !== process.env.WEBHOOK_SECRET) {
    console.warn('⚠️ Invalid secret token');
    return res.sendStatus(401);
  }
  
  // Process update...
  res.sendStatus(200);
});
```

### 2. IP Whitelist

Telegram sends webhooks from specific IP ranges:

```
149.154.160.0/20
91.108.4.0/22
```

**Validate IP:**
```javascript
const TELEGRAM_IPS = [
  '149.154.160.0/20',
  '91.108.4.0/22'
];

function isTelegramIP(ip) {
  // Use a library like 'ip-range-check'
  return TELEGRAM_IPS.some(range => ipRangeCheck(ip, range));
}

app.post('/webhook', (req, res) => {
  const clientIP = req.ip || req.connection.remoteAddress;
  
  if (!isTelegramIP(clientIP)) {
    console.warn(`⚠️ Request from non-Telegram IP: ${clientIP}`);
    return res.sendStatus(403);
  }
  
  // Process update...
});
```

### 3. Rate Limiting

Protect against abuse:

```javascript
const rateLimit = require('express-rate-limit');

const webhookLimiter = rateLimit({
  windowMs: 1000, // 1 second
  max: 30, // 30 requests per second (Telegram's limit)
  message: 'Too many requests'
});

app.post('/webhook', webhookLimiter, (req, res) => {
  // Process update...
});
```

### 4. HTTPS Only

Never use HTTP for webhooks:

```javascript
// Redirect HTTP to HTTPS (if needed)
app.use((req, res, next) => {
  if (req.headers['x-forwarded-proto'] !== 'https') {
    return res.redirect(`https://${req.hostname}${req.url}`);
  }
  next();
});
```

### Security Checklist

- ✅ Use HTTPS with valid SSL certificate
- ✅ Implement secret token validation
- ✅ Consider IP whitelist
- ✅ Add rate limiting
- ✅ Don't expose bot token in URLs
- ✅ Log suspicious requests
- ✅ Keep dependencies updated

---

## Polling Setup

Configure your bot to fetch updates via long polling.

### Basic Polling

```javascript
const TelegramBot = require('node-telegram-bot-api');

const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

bot.on('message', (msg) => {
  console.log('Received:', msg.text);
});
```

### Polling Options

```javascript
const bot = new TelegramBot(token, {
  polling: {
    interval: 300,        // Polling interval (ms)
    autoStart: true,      // Start polling automatically
    params: {
      timeout: 30,        // Long polling timeout (seconds)
      allowed_updates: ['message', 'callback_query']
    }
  }
});
```

### Manual Polling (Raw API)

```javascript
const fetch = require('node-fetch');

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const API = `https://api.telegram.org/bot${TOKEN}`;

let offset = 0;

async function poll() {
  while (true) {
    try {
      const response = await fetch(
        `${API}/getUpdates?offset=${offset}&timeout=30`
      );
      const data = await response.json();
      
      if (data.ok && data.result.length > 0) {
        for (const update of data.result) {
          await processUpdate(update);
          offset = update.update_id + 1;
        }
      }
    } catch (error) {
      console.error('Polling error:', error);
      await sleep(5000); // Wait before retry
    }
  }
}

async function processUpdate(update) {
  if (update.message) {
    const chatId = update.message.chat.id;
    const text = update.message.text;
    
    if (text === '/start') {
      await sendMessage(chatId, 'Hello!');
    }
  }
}

async function sendMessage(chatId, text) {
  await fetch(`${API}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text })
  });
}

poll();
```

### Polling Error Handling

```javascript
bot.on('polling_error', (error) => {
  console.error('Polling error:', error.code, error.message);
  
  if (error.code === 'ETELEGRAM') {
    // Telegram API error
    if (error.response?.statusCode === 409) {
      console.error('Conflict: Another instance is polling');
    }
  }
});

bot.on('error', (error) => {
  console.error('Bot error:', error);
});
```

### Delete Webhook for Polling

Before using polling, ensure webhook is disabled:

```bash
curl "https://api.telegram.org/bot<TOKEN>/deleteWebhook"
```

Or with drop pending updates:
```bash
curl "https://api.telegram.org/bot<TOKEN>/deleteWebhook?drop_pending_updates=true"
```

---

## Switching Between Polling ↔ Webhook

### From Polling to Webhook

```bash
# 1. Stop your polling bot

# 2. Set webhook
curl "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://yourdomain.com/webhook"

# 3. Start webhook server

# 4. Verify
curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"
```

### From Webhook to Polling

```bash
# 1. Stop your webhook server

# 2. Delete webhook
curl "https://api.telegram.org/bot<TOKEN>/deleteWebhook"

# 3. Start polling bot

# 4. Verify (url should be empty)
curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"
```

### Environment-Based Switching

```javascript
const TelegramBot = require('node-telegram-bot-api');
const express = require('express');

const token = process.env.TELEGRAM_BOT_TOKEN;
const isProduction = process.env.NODE_ENV === 'production';
const webhookUrl = process.env.WEBHOOK_URL;

let bot;

if (isProduction && webhookUrl) {
  // Production: Use webhook
  bot = new TelegramBot(token);
  
  const app = express();
  app.use(express.json());
  
  app.post('/webhook', (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
  });
  
  app.listen(3000, async () => {
    await bot.setWebHook(webhookUrl);
    console.log('🚀 Webhook mode');
  });
  
} else {
  // Development: Use polling
  bot = new TelegramBot(token, { polling: true });
  console.log('🔄 Polling mode');
}

// Same handlers work for both modes
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, 'Hello!');
});
```

---

## Multi-Bot Hosting

Running multiple bots on the same server.

### Method 1: Separate Processes

```bash
# Start each bot as separate process
node bots/bot1.js &
node bots/bot2.js &
node bots/bot3.js &
```

### Method 2: Single Process, Multiple Instances

```javascript
const TelegramBot = require('node-telegram-bot-api');

const bots = [
  { token: process.env.BOT1_TOKEN, name: 'Bot 1' },
  { token: process.env.BOT2_TOKEN, name: 'Bot 2' },
  { token: process.env.BOT3_TOKEN, name: 'Bot 3' }
];

const instances = bots.map(({ token, name }) => {
  const bot = new TelegramBot(token, { polling: true });
  
  bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, `Hello from ${name}!`);
  });
  
  console.log(`✅ ${name} started`);
  return bot;
});
```

### Method 3: Single Server, Multiple Webhooks

```javascript
const express = require('express');
const TelegramBot = require('node-telegram-bot-api');

const app = express();
app.use(express.json());

// Bot configurations
const bots = {
  bot1: new TelegramBot(process.env.BOT1_TOKEN),
  bot2: new TelegramBot(process.env.BOT2_TOKEN),
  bot3: new TelegramBot(process.env.BOT3_TOKEN)
};

// Separate webhook endpoints
app.post('/webhook/bot1', (req, res) => {
  handleUpdate(bots.bot1, req.body, 'Bot 1');
  res.sendStatus(200);
});

app.post('/webhook/bot2', (req, res) => {
  handleUpdate(bots.bot2, req.body, 'Bot 2');
  res.sendStatus(200);
});

app.post('/webhook/bot3', (req, res) => {
  handleUpdate(bots.bot3, req.body, 'Bot 3');
  res.sendStatus(200);
});

function handleUpdate(bot, update, name) {
  if (update.message?.text === '/start') {
    bot.sendMessage(update.message.chat.id, `Hello from ${name}!`);
  }
}

// Set webhooks on startup
async function setupWebhooks() {
  const baseUrl = process.env.WEBHOOK_BASE_URL;
  
  await bots.bot1.setWebHook(`${baseUrl}/webhook/bot1`);
  await bots.bot2.setWebHook(`${baseUrl}/webhook/bot2`);
  await bots.bot3.setWebHook(`${baseUrl}/webhook/bot3`);
  
  console.log('✅ All webhooks set');
}

app.listen(3000, setupWebhooks);
```

### Method 4: Dynamic Bot Loading

```javascript
const express = require('express');
const TelegramBot = require('node-telegram-bot-api');

const app = express();
app.use(express.json());

// Load bot configs from database or config file
const botConfigs = [
  { id: 'weather', token: process.env.WEATHER_BOT_TOKEN },
  { id: 'news', token: process.env.NEWS_BOT_TOKEN },
  { id: 'support', token: process.env.SUPPORT_BOT_TOKEN }
];

const bots = new Map();

// Initialize all bots
botConfigs.forEach(config => {
  bots.set(config.id, new TelegramBot(config.token));
});

// Single dynamic webhook endpoint
app.post('/webhook/:botId', (req, res) => {
  const { botId } = req.params;
  const bot = bots.get(botId);
  
  if (!bot) {
    return res.sendStatus(404);
  }
  
  // Route to appropriate handler
  const handler = require(`./handlers/${botId}`);
  handler(bot, req.body);
  
  res.sendStatus(200);
});

app.listen(3000);
```

### Resource Considerations

| Bots | Polling Memory | Webhook Memory |
|------|----------------|----------------|
| 1 | ~50MB | ~30MB |
| 5 | ~250MB | ~50MB |
| 10 | ~500MB | ~70MB |
| 50 | ~2.5GB | ~150MB |

**Recommendation**: Use webhooks for multi-bot hosting to save resources.

---

## Quick Reference

```bash
# Set webhook
curl "https://api.telegram.org/bot<TOKEN>/setWebhook?url=<URL>"

# Get webhook info
curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"

# Delete webhook
curl "https://api.telegram.org/bot<TOKEN>/deleteWebhook"

# Delete webhook and drop pending updates
curl "https://api.telegram.org/bot<TOKEN>/deleteWebhook?drop_pending_updates=true"
```

