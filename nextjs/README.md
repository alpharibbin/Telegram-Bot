# Building a Telegram Bot with Next.js

This guide will walk you through creating a Telegram bot using Next.js, a React framework for production.

## 📋 Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- A Telegram Bot Token from [@BotFather](https://t.me/botfather)
- Basic knowledge of React and JavaScript/TypeScript

## 🚀 Step 1: Set Up Your Next.js Project

### Create a new Next.js project:

```bash
npx create-next-app@latest telegram-bot-nextjs
cd telegram-bot-nextjs
```

Choose your preferred options:
- TypeScript: Yes (recommended)
- ESLint: Yes
- Tailwind CSS: Optional
- App Router: Yes (recommended for Next.js 13+)

### Or use the default setup:

```bash
npx create-next-app@latest telegram-bot-nextjs --typescript --tailwind --app
```

## 📦 Step 2: Install Required Packages

Install the Telegram Bot API library:

```bash
npm install node-telegram-bot-api
# or
yarn add node-telegram-bot-api
# or
pnpm add node-telegram-bot-api
```

## 🔧 Step 3: Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
TELEGRAM_BOT_TOKEN=YOUR_BOT_TOKEN_HERE
```

**⚠️ Important:** Never commit `.env.local` to version control! It should already be in `.gitignore`.

## 💻 Step 4: Create API Route for Webhook

Create the webhook API route at `app/api/webhook/route.ts` (or `pages/api/webhook.ts` for Pages Router):

### For App Router (`app/api/webhook/route.ts`):

```typescript
import { NextRequest, NextResponse } from 'next/server';
import TelegramBot from 'node-telegram-bot-api';

const token = process.env.TELEGRAM_BOT_TOKEN!;
const bot = new TelegramBot(token);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const chatId = body.message?.chat?.id;
    const text = body.message?.text;
    
    if (!chatId || !text) {
      return NextResponse.json({ ok: true });
    }
    
    // Handle commands
    if (text === '/start') {
      await bot.sendMessage(chatId, 'Hello! Welcome to my bot! 👋');
    } else if (text === '/help') {
      await bot.sendMessage(chatId, `Available commands:
/start - Start the bot
/help - Show this help message`);
    } else {
      await bot.sendMessage(chatId, `You said: ${text}`);
    }
    
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
```

### For Pages Router (`pages/api/webhook.ts`):

```typescript
import type { NextApiRequest, NextApiResponse } from 'next';
import TelegramBot from 'node-telegram-bot-api';

const token = process.env.TELEGRAM_BOT_TOKEN!;
const bot = new TelegramBot(token);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { message } = req.body;
    
    const chatId = message?.chat?.id;
    const text = message?.text;
    
    if (!chatId || !text) {
      return res.status(200).json({ ok: true });
    }
    
    // Handle commands
    if (text === '/start') {
      await bot.sendMessage(chatId, 'Hello! Welcome to my bot! 👋');
    } else if (text === '/help') {
      await bot.sendMessage(chatId, `Available commands:
/start - Start the bot
/help - Show this help message`);
    } else {
      await bot.sendMessage(chatId, `You said: ${text}`);
    }
    
    res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ ok: false });
  }
}
```

## 🔄 Step 5: Set Up Webhook

Create a utility script to set the webhook. Create `scripts/set-webhook.ts`:

```typescript
import TelegramBot from 'node-telegram-bot-api';

const token = process.env.TELEGRAM_BOT_TOKEN!;
const webhookUrl = process.env.WEBHOOK_URL || 'https://yourdomain.com/api/webhook';

const bot = new TelegramBot(token);

async function setWebhook() {
  try {
    await bot.setWebHook(webhookUrl);
    console.log('Webhook set successfully!');
    const info = await bot.getWebHookInfo();
    console.log('Webhook info:', info);
  } catch (error) {
    console.error('Error setting webhook:', error);
  }
}

setWebhook();
```

Add a script to `package.json`:

```json
{
  "scripts": {
    "set-webhook": "tsx scripts/set-webhook.ts"
  }
}
```

Install `tsx` for running TypeScript:

```bash
npm install -D tsx
```

## 🎯 Step 6: Advanced Features

### Handling Callback Queries (Inline Buttons)

Update your webhook handler to handle callback queries:

```typescript
// In your webhook route
const callbackQuery = body.callback_query;

if (callbackQuery) {
  const chatId = callbackQuery.message.chat.id;
  const data = callbackQuery.data;
  
  if (data === 'button_clicked') {
    await bot.answerCallbackQuery(callbackQuery.id, {
      text: 'Button clicked!',
      show_alert: false
    });
    await bot.sendMessage(chatId, 'You clicked the button!');
  }
  
  return NextResponse.json({ ok: true });
}
```

### Sending Inline Keyboards

```typescript
const keyboard = {
  inline_keyboard: [
    [
      { text: 'Visit Website', url: 'https://example.com' },
      { text: 'Click Me', callback_data: 'button_clicked' }
    ]
  ]
};

await bot.sendMessage(chatId, 'Choose an action:', {
  reply_markup: keyboard
});
```

### Sending Different Message Types

```typescript
// Send a photo
await bot.sendPhoto(chatId, 'https://example.com/image.jpg', {
  caption: 'This is a photo!'
});

// Send a document
await bot.sendDocument(chatId, 'https://example.com/file.pdf', {
  caption: 'Here is a document'
});

// Send with keyboard
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

## 🗄️ Step 7: Add Database (Optional)

For storing user data, you can integrate a database. Example with Prisma:

```bash
npm install @prisma/client
npm install -D prisma
npx prisma init
```

Example schema (`prisma/schema.prisma`):

```prisma
model User {
  id        Int      @id @default(autoincrement())
  chatId    String   @unique
  username  String?
  firstName String?
  createdAt DateTime @default(now())
}
```

## 🌐 Step 8: Deploy Your Bot

### Deploy to Vercel (Recommended):

1. Push your code to GitHub
2. Import your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Set webhook URL after deployment:

```bash
npm run set-webhook
```

### Deploy to Other Platforms:

- **Railway**: Similar to Vercel, supports Next.js out of the box
- **Heroku**: Use Next.js buildpack
- **DigitalOcean App Platform**: Supports Next.js
- **AWS/Google Cloud**: Use containerized deployment

## 📝 Step 9: Project Structure

Your final project structure should look like:

```
telegram-bot-nextjs/
├── app/
│   └── api/
│       └── webhook/
│           └── route.ts
├── scripts/
│   └── set-webhook.ts
├── .env.local
├── next.config.js
├── package.json
└── tsconfig.json
```

## 🔒 Security Best Practices

1. **Environment Variables** - Never commit `.env.local`
2. **Validate Requests** - Verify webhook requests are from Telegram
3. **Rate Limiting** - Implement rate limiting on your API routes
4. **Error Handling** - Always handle errors gracefully
5. **HTTPS Only** - Always use HTTPS for webhook URLs

### Add Request Validation:

```typescript
import crypto from 'crypto';

function validateTelegramWebhook(req: NextRequest, secretToken: string): boolean {
  const authHeader = req.headers.get('x-telegram-bot-api-secret-token');
  return authHeader === secretToken;
}

// In your webhook handler
const secretToken = process.env.WEBHOOK_SECRET!;
if (!validateTelegramWebhook(request, secretToken)) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

## 🧪 Testing Your Bot

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Use a tool like [ngrok](https://ngrok.com/) to expose your local server:
   ```bash
   ngrok http 3000
   ```

3. Set webhook to your ngrok URL:
   ```bash
   WEBHOOK_URL=https://your-ngrok-url.ngrok.io/api/webhook npm run set-webhook
   ```

4. Test your bot on Telegram

## 📚 Additional Resources

- [Telegram Bot API Documentation](https://core.telegram.org/bots/api)
- [node-telegram-bot-api Documentation](https://github.com/yagop/node-telegram-bot-api)
- [Next.js Documentation](https://nextjs.org/docs)
- [Telegram Bot Examples](https://core.telegram.org/bots/samples)

## 🐛 Troubleshooting

### Bot not responding?
- Check if your bot token is correct in `.env.local`
- Verify webhook URL is accessible
- Check Vercel/your hosting logs
- Ensure webhook is set correctly

### Webhook errors?
- Make sure your URL uses HTTPS
- Verify the webhook endpoint returns 200 status
- Check that the route handles POST requests correctly

### Development issues?
- Use ngrok for local testing
- Check console logs for errors
- Verify environment variables are loaded

## 🎉 Next Steps

- Add TypeScript types for better type safety
- Implement command handlers with a router pattern
- Add database integration for user management
- Create admin dashboard using Next.js pages
- Add inline query support for search functionality
- Implement middleware for authentication
- Add logging and monitoring

## 💡 Example: Command Router Pattern

Create a cleaner command handler:

```typescript
// lib/commands.ts
export const commands = {
  '/start': async (bot: TelegramBot, chatId: number) => {
    await bot.sendMessage(chatId, 'Hello! Welcome to my bot! 👋');
  },
  '/help': async (bot: TelegramBot, chatId: number) => {
    await bot.sendMessage(chatId, 'Available commands: /start, /help');
  },
};

// In your webhook handler
const command = commands[text as keyof typeof commands];
if (command) {
  await command(bot, chatId);
}
```

