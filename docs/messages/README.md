# Message Handling

A complete guide to handling all types of messages in Telegram bots.

---

## 📖 Table of Contents

1. [Text Messages](#text-messages)
2. [Commands & Arguments](#commands--arguments)
3. [Mentions](#mentions)
4. [Media Messages](#media-messages)
5. [Message Entities](#message-entities)
6. [Forwarded Messages](#forwarded-messages)
7. [Replies & Threading](#replies--threading)
8. [Message Editing & Deletion](#message-editing--deletion)

---

## Text Messages

The most basic form of communication with your bot.

### Receiving Text Messages

```javascript
bot.on('message', (msg) => {
  if (msg.text) {
    console.log(`Received: ${msg.text}`);
    console.log(`From: ${msg.from.first_name} (${msg.from.id})`);
    console.log(`Chat: ${msg.chat.id}`);
  }
});
```

### Message Object Structure

```json
{
  "message_id": 123,
  "from": {
    "id": 12345678,
    "is_bot": false,
    "first_name": "John",
    "last_name": "Doe",
    "username": "johndoe",
    "language_code": "en"
  },
  "chat": {
    "id": 12345678,
    "first_name": "John",
    "last_name": "Doe",
    "username": "johndoe",
    "type": "private"
  },
  "date": 1234567890,
  "text": "Hello, bot!"
}
```

### Sending Text Messages

```javascript
// Simple text
bot.sendMessage(chatId, 'Hello!');

// With options
bot.sendMessage(chatId, 'Hello!', {
  parse_mode: 'HTML',
  disable_notification: true,
  protect_content: true
});
```

### Text Formatting

#### HTML Mode

```javascript
bot.sendMessage(chatId, `
<b>Bold</b>
<i>Italic</i>
<u>Underline</u>
<s>Strikethrough</s>
<code>Inline code</code>
<pre>Code block</pre>
<a href="https://example.com">Link</a>
<tg-spoiler>Spoiler</tg-spoiler>
`, { parse_mode: 'HTML' });
```

#### Markdown Mode

```javascript
bot.sendMessage(chatId, `
*Bold*
_Italic_
__Underline__
~Strikethrough~
\`Inline code\`
\`\`\`
Code block
\`\`\`
[Link](https://example.com)
||Spoiler||
`, { parse_mode: 'MarkdownV2' });
```

#### Escaping Special Characters (MarkdownV2)

```javascript
function escapeMarkdown(text) {
  return text.replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, '\\$&');
}

const userInput = 'Hello! How are you?';
bot.sendMessage(chatId, escapeMarkdown(userInput), { parse_mode: 'MarkdownV2' });
```

---

## Commands & Arguments

Commands are messages starting with `/`.

### Basic Command Handling

```javascript
// Match /start
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, 'Welcome!');
});

// Match /help
bot.onText(/\/help/, (msg) => {
  bot.sendMessage(msg.chat.id, 'Here is help...');
});
```

### Commands with Arguments

```javascript
// /echo Hello World → captures "Hello World"
bot.onText(/\/echo (.+)/, (msg, match) => {
  const text = match[1];
  bot.sendMessage(msg.chat.id, `You said: ${text}`);
});

// /set name John → captures "name" and "John"
bot.onText(/\/set (\w+) (.+)/, (msg, match) => {
  const key = match[1];
  const value = match[2];
  bot.sendMessage(msg.chat.id, `Set ${key} to ${value}`);
});
```

### Parsing Arguments Manually

```javascript
bot.onText(/\/command/, (msg) => {
  const text = msg.text;
  const args = text.split(' ').slice(1); // Remove command
  
  // /command arg1 arg2 arg3
  // args = ['arg1', 'arg2', 'arg3']
  
  console.log('Arguments:', args);
});
```

### Command with Username (Groups)

In groups, commands can include bot username:

```javascript
// Matches both /start and /start@YourBot
bot.onText(/\/start(@\w+)?/, (msg) => {
  bot.sendMessage(msg.chat.id, 'Started!');
});
```

### Deep Linking (Start Parameters)

Users can start your bot with parameters:

```
https://t.me/YourBot?start=ref123
```

```javascript
bot.onText(/\/start (.+)/, (msg, match) => {
  const param = match[1];
  // param = 'ref123'
  
  if (param.startsWith('ref')) {
    const referrer = param.slice(3);
    bot.sendMessage(msg.chat.id, `Referred by: ${referrer}`);
  }
});

// Handle /start without params
bot.onText(/\/start$/, (msg) => {
  bot.sendMessage(msg.chat.id, 'Welcome!');
});
```

### Command Router Pattern

```javascript
const commands = {
  start: (msg) => bot.sendMessage(msg.chat.id, 'Welcome!'),
  help: (msg) => bot.sendMessage(msg.chat.id, 'Help message'),
  settings: (msg) => bot.sendMessage(msg.chat.id, 'Settings'),
};

bot.on('message', (msg) => {
  if (!msg.text?.startsWith('/')) return;
  
  const [command, ...args] = msg.text.slice(1).split(' ');
  const handler = commands[command.toLowerCase()];
  
  if (handler) {
    handler(msg, args);
  }
});
```

---

## Mentions

Detecting when users mention your bot or other users.

### Types of Mentions

1. **@username mention**: `@YourBot`
2. **Text mention**: Clickable name (for users without username)
3. **Reply**: Replying to a message

### Detecting @username Mentions

```javascript
bot.on('message', (msg) => {
  if (!msg.text) return;
  
  // Check if bot is mentioned
  const botUsername = 'YourBot';
  if (msg.text.includes(`@${botUsername}`)) {
    bot.sendMessage(msg.chat.id, 'You mentioned me!');
  }
});
```

### Using Message Entities

```javascript
bot.on('message', (msg) => {
  if (!msg.entities) return;
  
  for (const entity of msg.entities) {
    if (entity.type === 'mention') {
      // @username mention
      const mention = msg.text.substring(
        entity.offset,
        entity.offset + entity.length
      );
      console.log('Mentioned:', mention);
    }
    
    if (entity.type === 'text_mention') {
      // Text mention (user without username)
      console.log('Text mentioned user:', entity.user);
    }
  }
});
```

### Detecting Replies to Bot

```javascript
bot.on('message', (msg) => {
  if (msg.reply_to_message?.from?.is_bot) {
    // User replied to bot's message
    bot.sendMessage(msg.chat.id, 'Thanks for replying to me!');
  }
});
```

---

## Media Messages

Handling photos, videos, documents, and more.

### Photo Messages

```javascript
bot.on('photo', (msg) => {
  // Photos come in multiple sizes
  const photos = msg.photo;
  const largest = photos[photos.length - 1];
  
  console.log('Photo file_id:', largest.file_id);
  console.log('Dimensions:', largest.width, 'x', largest.height);
  
  // Download photo
  bot.downloadFile(largest.file_id, './downloads/');
});

// Send photo
bot.sendPhoto(chatId, 'path/to/photo.jpg', {
  caption: 'Check out this photo!'
});

// Send by URL
bot.sendPhoto(chatId, 'https://example.com/photo.jpg');

// Send by file_id (reuse uploaded file)
bot.sendPhoto(chatId, 'AgACAgIAAxk...');
```

### Video Messages

```javascript
bot.on('video', (msg) => {
  const video = msg.video;
  console.log('Video:', video.file_id);
  console.log('Duration:', video.duration, 'seconds');
  console.log('Size:', video.file_size, 'bytes');
});

// Send video
bot.sendVideo(chatId, 'path/to/video.mp4', {
  caption: 'Watch this!',
  duration: 30,
  width: 1920,
  height: 1080
});
```

### Document Messages

```javascript
bot.on('document', (msg) => {
  const doc = msg.document;
  console.log('Document:', doc.file_name);
  console.log('MIME type:', doc.mime_type);
  console.log('Size:', doc.file_size);
  
  // Download
  bot.downloadFile(doc.file_id, './downloads/');
});

// Send document
bot.sendDocument(chatId, 'path/to/file.pdf', {
  caption: 'Here is the document'
});
```

### Audio Messages

```javascript
bot.on('audio', (msg) => {
  const audio = msg.audio;
  console.log('Audio:', audio.title);
  console.log('Performer:', audio.performer);
  console.log('Duration:', audio.duration);
});

// Send audio
bot.sendAudio(chatId, 'path/to/song.mp3', {
  caption: 'Listen to this!',
  title: 'Song Title',
  performer: 'Artist Name'
});
```

### Voice Messages

```javascript
bot.on('voice', (msg) => {
  const voice = msg.voice;
  console.log('Voice duration:', voice.duration);
  
  // Download and process (e.g., speech-to-text)
  bot.downloadFile(voice.file_id, './downloads/');
});

// Send voice
bot.sendVoice(chatId, 'path/to/voice.ogg');
```

### Stickers

```javascript
bot.on('sticker', (msg) => {
  const sticker = msg.sticker;
  console.log('Sticker:', sticker.emoji);
  console.log('Set:', sticker.set_name);
  console.log('Is animated:', sticker.is_animated);
});

// Send sticker by file_id
bot.sendSticker(chatId, sticker.file_id);
```

### Location

```javascript
bot.on('location', (msg) => {
  const location = msg.location;
  console.log('Latitude:', location.latitude);
  console.log('Longitude:', location.longitude);
});

// Send location
bot.sendLocation(chatId, 40.7128, -74.0060);

// Send venue
bot.sendVenue(chatId, 40.7128, -74.0060, 'Central Park', '123 Park Ave');
```

### Contact

```javascript
bot.on('contact', (msg) => {
  const contact = msg.contact;
  console.log('Phone:', contact.phone_number);
  console.log('Name:', contact.first_name);
});

// Send contact
bot.sendContact(chatId, '+1234567890', 'John Doe');
```

### Media Group (Album)

```javascript
// Send multiple photos as album
bot.sendMediaGroup(chatId, [
  { type: 'photo', media: 'photo1.jpg', caption: 'Photo 1' },
  { type: 'photo', media: 'photo2.jpg' },
  { type: 'photo', media: 'photo3.jpg' }
]);
```

---

## Message Entities

Entities are special parts of a message (URLs, mentions, formatting, etc.).

### Entity Types

| Type | Description | Example |
|------|-------------|---------|
| `mention` | @username | @telegram |
| `hashtag` | #hashtag | #news |
| `cashtag` | $USD | $BTC |
| `bot_command` | /command | /start |
| `url` | URL | https://t.me |
| `email` | Email | user@example.com |
| `phone_number` | Phone | +1234567890 |
| `bold` | Bold text | **bold** |
| `italic` | Italic text | *italic* |
| `underline` | Underlined text | |
| `strikethrough` | Strikethrough | |
| `spoiler` | Hidden text | |
| `code` | Inline code | `code` |
| `pre` | Code block | |
| `text_link` | Clickable text link | |
| `text_mention` | Mention without username | |
| `custom_emoji` | Custom emoji | |

### Parsing Entities

```javascript
bot.on('message', (msg) => {
  if (!msg.entities) return;
  
  const text = msg.text;
  
  for (const entity of msg.entities) {
    const content = text.substring(
      entity.offset,
      entity.offset + entity.length
    );
    
    switch (entity.type) {
      case 'url':
        console.log('Found URL:', content);
        break;
      case 'email':
        console.log('Found email:', content);
        break;
      case 'bot_command':
        console.log('Found command:', content);
        break;
      case 'hashtag':
        console.log('Found hashtag:', content);
        break;
      case 'text_link':
        console.log('Found link:', entity.url);
        break;
    }
  }
});
```

### Extract All URLs

```javascript
function extractUrls(msg) {
  const urls = [];
  
  if (!msg.entities) return urls;
  
  for (const entity of msg.entities) {
    if (entity.type === 'url') {
      urls.push(msg.text.substring(
        entity.offset,
        entity.offset + entity.length
      ));
    } else if (entity.type === 'text_link') {
      urls.push(entity.url);
    }
  }
  
  return urls;
}
```

---

## Forwarded Messages

Handling messages forwarded from other chats.

### Detecting Forwarded Messages

```javascript
bot.on('message', (msg) => {
  if (msg.forward_date) {
    // This is a forwarded message
    console.log('Forwarded at:', new Date(msg.forward_date * 1000));
    
    if (msg.forward_from) {
      // Forwarded from a user
      console.log('From user:', msg.forward_from.first_name);
    }
    
    if (msg.forward_from_chat) {
      // Forwarded from a channel/group
      console.log('From chat:', msg.forward_from_chat.title);
    }
    
    if (msg.forward_sender_name) {
      // User hid their account
      console.log('From:', msg.forward_sender_name);
    }
  }
});
```

### Forward Properties

| Property | Description |
|----------|-------------|
| `forward_date` | Original message date |
| `forward_from` | Original sender (if visible) |
| `forward_from_chat` | Original chat (channels/groups) |
| `forward_from_message_id` | Original message ID |
| `forward_sender_name` | Sender name (if hidden) |
| `forward_signature` | Channel post signature |

### Forwarding Messages

```javascript
// Forward a message to another chat
bot.forwardMessage(targetChatId, sourceChatId, messageId);

// Copy message (without "Forwarded from" header)
bot.copyMessage(targetChatId, sourceChatId, messageId, {
  caption: 'New caption'
});
```

---

## Replies & Threading

Managing message replies and conversations.

### Detecting Replies

```javascript
bot.on('message', (msg) => {
  if (msg.reply_to_message) {
    const original = msg.reply_to_message;
    
    console.log('Reply to message ID:', original.message_id);
    console.log('Original text:', original.text);
    console.log('Original sender:', original.from.first_name);
  }
});
```

### Sending Replies

```javascript
// Reply to a specific message
bot.sendMessage(chatId, 'This is a reply!', {
  reply_to_message_id: msg.message_id
});

// Reply with "must reply" (fails if original deleted)
bot.sendMessage(chatId, 'Reply', {
  reply_to_message_id: msg.message_id,
  allow_sending_without_reply: false
});
```

### Quote in Reply

```javascript
// Reply with quote (Telegram 7.0+)
bot.sendMessage(chatId, 'My response', {
  reply_parameters: {
    message_id: msg.message_id,
    quote: 'specific text to quote'
  }
});
```

### Building Conversation Threads

```javascript
const conversations = new Map();

bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  
  // Get or create conversation
  if (!conversations.has(chatId)) {
    conversations.set(chatId, { step: 'start', data: {} });
  }
  
  const conv = conversations.get(chatId);
  
  switch (conv.step) {
    case 'start':
      bot.sendMessage(chatId, 'What is your name?');
      conv.step = 'name';
      break;
      
    case 'name':
      conv.data.name = msg.text;
      bot.sendMessage(chatId, `Nice to meet you, ${msg.text}! What is your age?`);
      conv.step = 'age';
      break;
      
    case 'age':
      conv.data.age = msg.text;
      bot.sendMessage(chatId, `Got it! Name: ${conv.data.name}, Age: ${conv.data.age}`);
      conv.step = 'done';
      break;
  }
});
```

---

## Message Editing & Deletion

Modifying and removing messages.

### Edit Text Message

```javascript
// Edit message text
bot.editMessageText('New text', {
  chat_id: chatId,
  message_id: messageId
});

// Edit with new formatting
bot.editMessageText('<b>Bold new text</b>', {
  chat_id: chatId,
  message_id: messageId,
  parse_mode: 'HTML'
});
```

### Edit Message Caption

```javascript
// Edit photo/video caption
bot.editMessageCaption('New caption', {
  chat_id: chatId,
  message_id: messageId
});
```

### Edit Message Media

```javascript
// Replace photo with different photo
bot.editMessageMedia({
  type: 'photo',
  media: 'new_photo.jpg',
  caption: 'New photo!'
}, {
  chat_id: chatId,
  message_id: messageId
});
```

### Edit Inline Keyboard

```javascript
// Update buttons on a message
bot.editMessageReplyMarkup({
  inline_keyboard: [
    [{ text: 'New Button', callback_data: 'new_action' }]
  ]
}, {
  chat_id: chatId,
  message_id: messageId
});
```

### Delete Messages

```javascript
// Delete a single message
bot.deleteMessage(chatId, messageId);

// Delete multiple messages (Telegram 7.0+)
bot.deleteMessages(chatId, [messageId1, messageId2, messageId3]);
```

### Handling Edited Messages

```javascript
bot.on('edited_message', (msg) => {
  console.log('Message edited!');
  console.log('New text:', msg.text);
  console.log('Edit date:', new Date(msg.edit_date * 1000));
});
```

### Self-Destructing Messages

```javascript
// Send message and delete after delay
const sentMsg = await bot.sendMessage(chatId, 'This will disappear in 5 seconds...');

setTimeout(() => {
  bot.deleteMessage(chatId, sentMsg.message_id);
}, 5000);
```

### Edit Limitations

- ❌ Cannot edit message type (text → photo)
- ❌ Cannot edit messages older than 48 hours
- ❌ Cannot edit other users' messages
- ✅ Can edit your bot's messages anytime
- ✅ Can edit inline keyboard anytime

---

## Quick Reference

```javascript
// Send text
bot.sendMessage(chatId, 'Hello');

// Send with formatting
bot.sendMessage(chatId, '<b>Bold</b>', { parse_mode: 'HTML' });

// Reply to message
bot.sendMessage(chatId, 'Reply', { reply_to_message_id: msgId });

// Send photo
bot.sendPhoto(chatId, 'photo.jpg', { caption: 'Caption' });

// Send document
bot.sendDocument(chatId, 'file.pdf');

// Edit message
bot.editMessageText('New text', { chat_id: chatId, message_id: msgId });

// Delete message
bot.deleteMessage(chatId, msgId);

// Forward message
bot.forwardMessage(toChatId, fromChatId, msgId);
```
