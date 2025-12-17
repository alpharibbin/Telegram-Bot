require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  console.error('Error: TELEGRAM_BOT_TOKEN not found in environment variables');
  console.log('Please create a .env file with: TELEGRAM_BOT_TOKEN=your_token_here');
  process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });

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

