# Building a Telegram Bot with Node.js

This guide will walk you through creating a Telegram bot using Node.js that can be deployed to Vercel.

## 📋 Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- A Telegram Bot Token from [@BotFather](https://t.me/botfather)
- Git account (for version control)
- Vercel account (for deployment)

## 🚀 Step 1: Set Up Your Project

### Initialize a new Node.js project:

```bash
mkdir telegram-bot-nodejs
cd telegram-bot-nodejs
npm init -y
```

## 📦 Step 2: Install Required Packages

Install the Telegram Bot API library:

```bash
npm install node-telegram-bot-api
```

For development dependencies:

```bash
npm install -D vercel
```

## 🔧 Step 3: Configure Environment Variables

Create a `.env` file in the root directory:

```env
TELEGRAM_BOT_TOKEN=8581525362:AAFiKs_0uF5SOoIs7-LpVf3MFhzqugbVnkw
```

**⚠️ Important:** Never commit `.env` to version control! It should be in `.gitignore`.

Create a `.env.example` file for reference:

```env
TELEGRAM_BOT_TOKEN=YOUR_BOT_TOKEN_HERE
```

## 💻 Step 4: Create the Bot Logic

Create `bot.js` file with your bot logic:

```javascript
const TelegramBot = require('node-telegram-bot-api');

const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token);

// Handle /start command
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Hello! Welcome to my bot! 👋\n\nUse /help to see available commands.');
});

// Handle /help command
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, `Available commands:
/start - Start the bot
/help - Show this help message
/echo <text> - Echo back your message`);
});

// Handle /echo command
bot.onText(/\/echo (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const resp = match[1];
  bot.sendMessage(chatId, `You said: ${resp}`);
});

// Handle regular messages
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;
  
  // Ignore commands
  if (text && text.startsWith('/')) {
    return;
  }
  
  if (text) {
    bot.sendMessage(chatId, `You said: ${text}`);
  }
});

// Handle callback queries (inline buttons)
bot.on('callback_query', (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;
  
  if (data === 'button_clicked') {
    bot.answerCallbackQuery(query.id, {
      text: 'Button clicked!',
      show_alert: false
    });
    bot.sendMessage(chatId, 'You clicked the button! 🎉');
  }
});

console.log('Bot is running...');
```

## 🌐 Step 5: Create Vercel Serverless Function

For Vercel deployment, create `api/webhook.js`:

```javascript
const TelegramBot = require('node-telegram-bot-api');

const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token);

module.exports = async (req, res) => {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const update = req.body;
    
    // Handle message
    if (update.message) {
      const chatId = update.message.chat.id;
      const text = update.message.text;
      
      // Handle /start command
      if (text === '/start') {
        await bot.sendMessage(chatId, 'Hello! Welcome to my bot! 👋\n\nUse /help to see available commands.');
      }
      // Handle /help command
      else if (text === '/help') {
        await bot.sendMessage(chatId, `Available commands:
/start - Start the bot
/help - Show this help message
/echo <text> - Echo back your message`);
      }
      // Handle /echo command
      else if (text && text.startsWith('/echo ')) {
        const echoText = text.replace('/echo ', '');
        await bot.sendMessage(chatId, `You said: ${echoText}`);
      }
      // Handle regular messages
      else if (text && !text.startsWith('/')) {
        await bot.sendMessage(chatId, `You said: ${text}`);
      }
    }
    
    // Handle callback queries (inline buttons)
    if (update.callback_query) {
      const query = update.callback_query;
      const chatId = query.message.chat.id;
      const data = query.data;
      
      if (data === 'button_clicked') {
        await bot.answerCallbackQuery(query.id, {
          text: 'Button clicked!',
          show_alert: false
        });
        await bot.sendMessage(chatId, 'You clicked the button! 🎉');
      }
    }
    
    res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
};
```

## ⚙️ Step 6: Configure Vercel

Create `vercel.json` configuration file:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/webhook.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/webhook",
      "dest": "api/webhook.js"
    }
  ]
}
```

## 🔗 Step 7: Set Up Webhook

Create `scripts/set-webhook.js`:

```javascript
const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

const token = process.env.TELEGRAM_BOT_TOKEN;
const webhookUrl = process.env.WEBHOOK_URL || process.argv[2];

if (!webhookUrl) {
  console.error('Please provide webhook URL as argument or set WEBHOOK_URL in .env');
  console.log('Usage: node scripts/set-webhook.js <webhook-url>');
  process.exit(1);
}

const bot = new TelegramBot(token);

async function setWebhook() {
  try {
    await bot.setWebHook(webhookUrl);
    console.log('✅ Webhook set successfully!');
    const info = await bot.getWebHookInfo();
    console.log('Webhook info:', JSON.stringify(info, null, 2));
  } catch (error) {
    console.error('❌ Error setting webhook:', error.message);
    process.exit(1);
  }
}

setWebhook();
```

Add scripts to `package.json`:

```json
{
  "scripts": {
    "start": "node bot.js",
    "set-webhook": "node scripts/set-webhook.js",
    "dev": "node bot.js"
  }
}
```

## 🎯 Step 8: Advanced Features

### Sending Inline Keyboards

```javascript
const keyboard = {
  inline_keyboard: [
    [
      { text: 'Visit Website', url: 'https://example.com' },
      { text: 'Click Me', callback_data: 'button_clicked' }
    ],
    [
      { text: 'Another Button', callback_data: 'another_action' }
    ]
  ]
};

await bot.sendMessage(chatId, 'Choose an action:', {
  reply_markup: keyboard
});
```

### Sending Reply Keyboards

```javascript
const replyKeyboard = {
  keyboard: [
    [{ text: 'Button 1' }, { text: 'Button 2' }],
    [{ text: 'Button 3' }]
  ],
  resize_keyboard: true,
  one_time_keyboard: true
};

await bot.sendMessage(chatId, 'Choose an option:', {
  reply_markup: replyKeyboard
});
```

### Sending Different Message Types

```javascript
// Send a photo
await bot.sendPhoto(chatId, 'https://example.com/image.jpg', {
  caption: 'This is a photo!'
});

// Send a document
await bot.sendDocument(chatId, 'https://example.com/file.pdf', {
  caption: 'Here is a document'
});

// Send location
await bot.sendLocation(chatId, 40.7128, -74.0060);

// Send contact
await bot.sendContact(chatId, '+1234567890', 'John Doe');
```

## 📝 Step 9: Project Structure

Your final project structure should look like:

```
telegram-bot-nodejs/
├── api/
│   └── webhook.js          # Vercel serverless function
├── scripts/
│   └── set-webhook.js      # Webhook setup script
├── .env                    # Environment variables (not in git)
├── .env.example            # Example env file
├── .gitignore
├── bot.js                  # Local development bot
├── package.json
├── vercel.json             # Vercel configuration
└── README.md
```

## 🚀 Step 10: Deploy to Vercel

### Option 1: Using Vercel CLI

1. Install Vercel CLI globally:
   ```bash
   npm install -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy:
   ```bash
   vercel
   ```

4. Set environment variable in Vercel dashboard or via CLI:
   ```bash
   vercel env add TELEGRAM_BOT_TOKEN
   ```

5. Set webhook URL (replace with your Vercel URL):
   ```bash
   npm run set-webhook https://your-project.vercel.app/api/webhook
   ```

### Option 2: Using GitHub Integration

1. Push your code to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. Go to [Vercel Dashboard](https://vercel.com/dashboard)
3. Click "New Project"
4. Import your GitHub repository
5. Add environment variable `TELEGRAM_BOT_TOKEN` in project settings
6. Deploy
7. After deployment, set webhook:
   ```bash
   npm run set-webhook https://your-project.vercel.app/api/webhook
   ```

## 🔒 Security Best Practices

1. **Never commit `.env`** - Always use `.gitignore`
2. **Use Environment Variables** - Store sensitive data in Vercel environment variables
3. **Validate Requests** - Consider adding request validation
4. **Rate Limiting** - Implement rate limiting if needed
5. **Error Handling** - Always handle errors gracefully

### Add Request Validation (Optional)

```javascript
// In api/webhook.js
const crypto = require('crypto');

function validateTelegramWebhook(req, secretToken) {
  const authHeader = req.headers['x-telegram-bot-api-secret-token'];
  return authHeader === secretToken;
}

// In your handler
const secretToken = process.env.WEBHOOK_SECRET;
if (secretToken && !validateTelegramWebhook(req, secretToken)) {
  return res.status(401).json({ error: 'Unauthorized' });
}
```

## 🧪 Testing Locally

### Using Long Polling (for local development):

1. Make sure `.env` file exists with your bot token
2. Run the bot:
   ```bash
   npm start
   ```

### Using Webhook (for testing before deployment):

1. Use [ngrok](https://ngrok.com/) to expose your local server:
   ```bash
   ngrok http 3000
   ```

2. Create a simple Express server for testing (`server.js`):
   ```javascript
   const express = require('express');
   const app = express();
   const webhookHandler = require('./api/webhook');
   
   app.use(express.json());
   app.post('/api/webhook', webhookHandler);
   
   app.listen(3000, () => {
     console.log('Server running on http://localhost:3000');
   });
   ```

3. Set webhook to ngrok URL:
   ```bash
   npm run set-webhook https://your-ngrok-url.ngrok.io/api/webhook
   ```

## 📚 Additional Resources

- [Telegram Bot API Documentation](https://core.telegram.org/bots/api)
- [node-telegram-bot-api Documentation](https://github.com/yagop/node-telegram-bot-api)
- [Vercel Documentation](https://vercel.com/docs)
- [Telegram Bot Examples](https://core.telegram.org/bots/samples)

## 🐛 Troubleshooting

### Bot not responding?
- Check if your bot token is correct in Vercel environment variables
- Verify webhook URL is set correctly
- Check Vercel function logs in dashboard
- Ensure webhook endpoint returns 200 status

### Webhook errors?
- Make sure your URL uses HTTPS (Vercel provides this automatically)
- Verify the webhook endpoint handles POST requests
- Check that environment variables are set in Vercel

### Local development issues?
- Ensure `.env` file exists with `TELEGRAM_BOT_TOKEN`
- Check Node.js version (18+ required)
- Verify all dependencies are installed

## 🎉 Next Steps

- Add database integration (MongoDB, PostgreSQL, etc.)
- Implement command router pattern for better organization
- Add admin commands and user management
- Create inline query support for search
- Add logging and monitoring
- Implement rate limiting
- Add unit tests

## 💡 Example: Command Router Pattern

Create a cleaner command handler structure:

```javascript
// commands/index.js
const commands = {
  start: async (bot, chatId) => {
    await bot.sendMessage(chatId, 'Hello! Welcome to my bot! 👋');
  },
  help: async (bot, chatId) => {
    await bot.sendMessage(chatId, 'Available commands: /start, /help');
  },
  echo: async (bot, chatId, args) => {
    await bot.sendMessage(chatId, `You said: ${args.join(' ')}`);
  }
};

module.exports = commands;
```

```javascript
// In webhook.js
const commands = require('./commands');

// Handle commands
if (text && text.startsWith('/')) {
  const [command, ...args] = text.slice(1).split(' ');
  const handler = commands[command];
  if (handler) {
    await handler(bot, chatId, args);
  }
}
```

