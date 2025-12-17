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

