# Bot Frameworks

## 📖 Table of Contents

1. telegraf  
2. grammY  
3. python-telegram-bot  
4. aiogram  
5. Raw HTTP Bot API  
6. Framework tradeoffs  

---

## telegraf (Node.js)
- Middleware-first; rich ecosystem, scenes/wizards, keyboards.  
- Example:
```javascript
const { Telegraf } = require('telegraf');
const bot = new Telegraf(process.env.BOT_TOKEN);

bot.start((ctx) => ctx.reply('Hello'));
bot.command('help', (ctx) => ctx.reply('Help'));
bot.on('text', (ctx) => ctx.reply(`You said: ${ctx.message.text}`));

bot.launch();
```

## grammY (Node.js/TS)
- Modern, strongly typed, plugin-friendly (conversations, menus).  
- Example:
```typescript
import { Bot } from 'grammy';
const bot = new Bot(process.env.BOT_TOKEN!);

bot.command('start', (ctx) => ctx.reply('Hello'));
bot.on('message:text', (ctx) => ctx.reply(ctx.message.text));

bot.start();
```

## python-telegram-bot (Python)
- Mature, large community, asyncio support (v20+).  
- Example:
```python
from telegram import Update
from telegram.ext import Application, CommandHandler, MessageHandler, filters

app = Application.builder().token(BOT_TOKEN).build()

async def start(update: Update, context):
    await update.message.reply_text("Hello")

app.add_handler(CommandHandler("start", start))
app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, start))

app.run_polling()
```

## aiogram (Python)
- Async-first, fast, middleware and FSM built-in.  
- Example:
```python
from aiogram import Bot, Dispatcher, types
from aiogram.filters import Command
import asyncio

bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()

@dp.message(Command("start"))
async def start(msg: types.Message):
    await msg.answer("Hello")

async def main():
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())
```

## Raw HTTP Bot API
- Minimal deps; good for serverless or full control.  
- Call `https://api.telegram.org/bot<TOKEN>/<METHOD>`.
```javascript
await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ chat_id, text: 'Hello' })
});
```

---

## Framework Tradeoffs

| Framework | Language | Strengths | Considerations |
|-----------|----------|-----------|----------------|
| telegraf | Node.js | Middleware, ecosystem | Heavier bundle, legacy typings |
| grammY | Node.js/TS | Modern, typed, plugins | Smaller ecosystem than telegraf |
| python-telegram-bot | Python | Mature, many examples | Can feel heavy; pre-v20 sync pitfalls |
| aiogram | Python | Async, fast, FSM | Smaller community than PTB |
| Raw HTTP | Any | Minimal deps, serverless friendly | More boilerplate, no helpers |

### Choosing
- Need TS + modern DX → grammY  
- Need scenes/wizards + middleware → telegraf  
- Prefer Python + big community → python-telegram-bot  
- Async Python + FSM → aiogram  
- Serverless/minimal deps → Raw HTTP

