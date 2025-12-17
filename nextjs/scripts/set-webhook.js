const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

const token = process.env.TELEGRAM_BOT_TOKEN;
const webhookUrl = process.env.WEBHOOK_URL || process.argv[2];

if (!token) {
  console.error('Error: TELEGRAM_BOT_TOKEN not found in environment variables');
  process.exit(1);
}

if (!webhookUrl) {
  console.error('Please provide webhook URL as argument or set WEBHOOK_URL in .env');
  console.log('Usage: node scripts/set-webhook.js <webhook-url>');
  console.log('Example: node scripts/set-webhook.js https://your-project.vercel.app/api/webhook');
  process.exit(1);
}

const bot = new TelegramBot(token);

async function setWebhook() {
  try {
    await bot.setWebHook(webhookUrl);
    console.log('✅ Webhook set successfully!');
    console.log(`📍 Webhook URL: ${webhookUrl}`);

    const info = await bot.getWebHookInfo();
    console.log('\n📊 Webhook info:');
    console.log(JSON.stringify(info, null, 2));
  } catch (error) {
    console.error('❌ Error setting webhook:', error.message);
    process.exit(1);
  }
}

setWebhook();

