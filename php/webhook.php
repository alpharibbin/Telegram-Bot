<?php
require __DIR__ . '/vendor/autoload.php';

use Telegram\Bot\Api;

// Get bot token from environment variable
$token = getenv('TELEGRAM_BOT_TOKEN') ?: '8262047387:AAEaQYI7PKAxLCwabtmM9jrnE9rW8nvWU50';
$telegram = new Api($token);

// Get the webhook update
$update = $telegram->getWebhookUpdate();

if ($update && $update->getMessage()) {
    $message = $update->getMessage();
    $chatId = $message->getChat()->getId();
    $text = $message->getText();

    // Handle /start command
    if ($text === '/start') {
        $telegram->sendMessage([
            'chat_id' => $chatId,
            'text' => "Hello! Welcome to my PHP bot! 👋\n\nUse /help to see available commands."
        ]);
    }
    // Handle /help command
    elseif ($text === '/help') {
        $telegram->sendMessage([
            'chat_id' => $chatId,
            'text' => "Available commands:\n/start - Start the bot\n/help - Show this help message\n/echo <text> - Echo back your message"
        ]);
    }
    // Handle /echo command
    elseif (strpos($text, '/echo ') === 0) {
        $echoText = substr($text, 6);
        $telegram->sendMessage([
            'chat_id' => $chatId,
            'text' => "You said: $echoText"
        ]);
    }
    // Handle regular messages
    elseif ($text && strpos($text, '/') !== 0) {
        $telegram->sendMessage([
            'chat_id' => $chatId,
            'text' => "You said: $text"
        ]);
    }
}

// Handle callback queries (inline buttons)
if ($update && $update->getCallbackQuery()) {
    $query = $update->getCallbackQuery();
    $chatId = $query->getMessage()->getChat()->getId();
    $data = $query->getData();

    if ($data === 'button_clicked') {
        $telegram->answerCallbackQuery([
            'callback_query_id' => $query->getId(),
            'text' => 'Button clicked!',
            'show_alert' => false
        ]);
        $telegram->sendMessage([
            'chat_id' => $chatId,
            'text' => 'You clicked the button! 🎉'
        ]);
    }
}

// Return 200 OK
http_response_code(200);
echo json_encode(['ok' => true]);

