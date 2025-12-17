import { NextRequest, NextResponse } from 'next/server';
import TelegramBot from 'node-telegram-bot-api';

const token = process.env.TELEGRAM_BOT_TOKEN!;
const bot = new TelegramBot(token);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Handle message
    if (body.message) {
      const chatId = body.message.chat.id;
      const text = body.message.text;

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
    if (body.callback_query) {
      const query = body.callback_query;
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

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: 'Telegram Bot Webhook is running!' });
}

