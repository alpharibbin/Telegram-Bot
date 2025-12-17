# Building a Telegram Bot with PHP

This guide will walk you through creating a Telegram bot using PHP.

## 📋 Prerequisites

- PHP 7.4 or higher
- Composer (PHP dependency manager)
- A Telegram Bot Token from [@BotFather](https://t.me/botfather)
- A web server (Apache/Nginx) or use PHP's built-in server for development

## 🚀 Step 1: Set Up Your Project

### Create a new directory for your bot:

```bash
mkdir telegram-bot-php
cd telegram-bot-php
```

### Initialize Composer:

```bash
composer init
```

## 📦 Step 2: Install Required Packages

We'll use the `irazasyed/telegram-bot-sdk` package, which is a popular PHP SDK for Telegram Bot API.

```bash
composer require irazasyed/telegram-bot-sdk
```

Or add it to your `composer.json`:

```json
{
    "require": {
        "irazasyed/telegram-bot-sdk": "^3.0"
    }
}
```

## 🔧 Step 3: Configure Your Bot

Create a `config.php` file to store your bot token:

```php
<?php
return [
    'telegram' => [
        'bot_token' => 'YOUR_BOT_TOKEN_HERE',
    ],
];
```

**⚠️ Important:** Never commit your bot token to version control! Add `config.php` to `.gitignore`.

## 💻 Step 4: Create Your Bot Script

Create a `bot.php` file:

```php
<?php
require __DIR__ . '/vendor/autoload.php';

use Telegram\Bot\Api;

$config = require __DIR__ . '/config.php';
$telegram = new Api($config['telegram']['bot_token']);

// Get updates
$updates = $telegram->getUpdates();

// Process each update
foreach ($updates as $update) {
    $message = $update->getMessage();
    $chatId = $message->getChat()->getId();
    $text = $message->getText();
    
    // Handle commands
    if ($text === '/start') {
        $telegram->sendMessage([
            'chat_id' => $chatId,
            'text' => 'Hello! Welcome to my bot! 👋'
        ]);
    } elseif ($text === '/help') {
        $telegram->sendMessage([
            'chat_id' => $chatId,
            'text' => 'Available commands:
/start - Start the bot
/help - Show this help message'
        ]);
    } else {
        // Echo back the message
        $telegram->sendMessage([
            'chat_id' => $chatId,
            'text' => "You said: $text"
        ]);
    }
}
```

## 🌐 Step 5: Set Up Webhook (Recommended for Production)

For production, use webhooks instead of polling. Create a `webhook.php` file:

```php
<?php
require __DIR__ . '/vendor/autoload.php';

use Telegram\Bot\Api;

$config = require __DIR__ . '/config.php';
$telegram = new Api($config['telegram']['bot_token']);

// Get the update
$update = $telegram->getWebhookUpdate();

$message = $update->getMessage();
$chatId = $message->getChat()->getId();
$text = $message->getText();

// Handle commands
if ($text === '/start') {
    $telegram->sendMessage([
        'chat_id' => $chatId,
        'text' => 'Hello! Welcome to my bot! 👋'
    ]);
} elseif ($text === '/help') {
    $telegram->sendMessage([
        'chat_id' => $chatId,
        'text' => 'Available commands:
/start - Start the bot
/help - Show this help message'
    ]);
} else {
    $telegram->sendMessage([
        'chat_id' => $chatId,
        'text' => "You said: $text"
    ]);
}
```

### Set the webhook URL:

#### Option A: Browser URL (Easiest - No code needed)

Just open this URL in your browser:

```
https://api.telegram.org/bot<BOT_TOKEN>/setWebhook?url=https://yourdomain.com/webhook.php
```

#### Option B: Using curl

```bash
curl "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook?url=https://yourdomain.com/webhook.php"
```

#### Option C: POST request (recommended)

```bash
curl -X POST "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://yourdomain.com/webhook.php"}'
```

#### Option D: Using PHP SDK

```php
<?php
require __DIR__ . '/vendor/autoload.php';

use Telegram\Bot\Api;

$config = require __DIR__ . '/config.php';
$telegram = new Api($config['telegram']['bot_token']);

// Set webhook (replace with your actual URL)
$response = $telegram->setWebhook([
    'url' => 'https://yourdomain.com/webhook.php'
]);

echo $response ? 'Webhook set successfully!' : 'Failed to set webhook';
```

#### Verify webhook is set:

```
https://api.telegram.org/bot<BOT_TOKEN>/getWebhookInfo
```

## 🔄 Step 6: Using Long Polling (Alternative)

If you prefer long polling instead of webhooks, create a `polling.php` file:

```php
<?php
require __DIR__ . '/vendor/autoload.php';

use Telegram\Bot\Api;

$config = require __DIR__ . '/config.php';
$telegram = new Api($config['telegram']['bot_token']);

$lastUpdateId = 0;

while (true) {
    $updates = $telegram->getUpdates([
        'offset' => $lastUpdateId + 1,
        'timeout' => 10
    ]);
    
    foreach ($updates as $update) {
        $lastUpdateId = $update->getUpdateId();
        $message = $update->getMessage();
        $chatId = $message->getChat()->getId();
        $text = $message->getText();
        
        // Handle your commands here
        if ($text === '/start') {
            $telegram->sendMessage([
                'chat_id' => $chatId,
                'text' => 'Hello! Welcome to my bot! 👋'
            ]);
        }
    }
    
    sleep(1);
}
```

## 🎯 Step 7: Advanced Features

### Sending Different Message Types

```php
// Send a photo
$telegram->sendPhoto([
    'chat_id' => $chatId,
    'photo' => 'path/to/image.jpg',
    'caption' => 'This is a photo!'
]);

// Send a document
$telegram->sendDocument([
    'chat_id' => $chatId,
    'document' => 'path/to/file.pdf',
    'caption' => 'Here is a document'
]);

// Send a keyboard
$keyboard = [
    ['Button 1', 'Button 2'],
    ['Button 3']
];

$replyMarkup = $telegram->replyKeyboardMarkup([
    'keyboard' => $keyboard,
    'resize_keyboard' => true,
    'one_time_keyboard' => true
]);

$telegram->sendMessage([
    'chat_id' => $chatId,
    'text' => 'Choose an option:',
    'reply_markup' => $replyMarkup
]);
```

### Inline Keyboards

```php
$inlineKeyboard = [
    [
        ['text' => 'Visit Website', 'url' => 'https://example.com'],
        ['text' => 'Callback Button', 'callback_data' => 'button_clicked']
    ]
];

$replyMarkup = $telegram->inlineKeyboardMarkup([
    'inline_keyboard' => $inlineKeyboard
]);

$telegram->sendMessage([
    'chat_id' => $chatId,
    'text' => 'Choose an action:',
    'reply_markup' => $replyMarkup
]);
```

## 📝 Step 8: Project Structure

Your final project structure should look like:

```
telegram-bot-php/
├── composer.json
├── composer.lock
├── config.php
├── bot.php
├── webhook.php
├── polling.php
├── .gitignore
└── vendor/
```

## 🔒 Security Best Practices

1. **Never commit your bot token** - Add `config.php` to `.gitignore`
2. **Validate webhook requests** - Verify that requests are coming from Telegram
3. **Use HTTPS** - Always use HTTPS for webhook URLs
4. **Sanitize user input** - Always validate and sanitize user messages
5. **Rate limiting** - Implement rate limiting to prevent abuse

## 🧪 Testing Your Bot

1. Run your bot script or set up the webhook
2. Open Telegram and search for your bot (using the username BotFather gave you)
3. Send `/start` command
4. Test other commands and features

## 📚 Additional Resources

- [Telegram Bot API Documentation](https://core.telegram.org/bots/api)
- [Telegram Bot SDK PHP Documentation](https://github.com/irazasyed/telegram-bot-sdk)
- [Telegram Bot Examples](https://core.telegram.org/bots/samples)

## 🐛 Troubleshooting

### Bot not responding?
- Check if your bot token is correct
- Verify webhook URL is accessible (if using webhooks)
- Check server logs for errors
- Ensure your server has internet access

### Webhook not working?
- Make sure your URL uses HTTPS
- Verify the webhook URL is publicly accessible
- Check that the webhook endpoint returns a 200 status code

## 🎉 Next Steps

- Add database integration for storing user data
- Implement more complex commands
- Add inline query support
- Create admin commands
- Add error handling and logging

