# Telegram Bot Fundamentals

A comprehensive guide to understanding Telegram bots from the ground up.

---

## 📖 Table of Contents

1. [What is a Telegram Bot?](#what-is-a-telegram-bot)
2. [BotFather Deep Dive](#botfather-deep-dive)
3. [Bot Tokens & Rotation](#bot-tokens--rotation)
4. [Bot API vs MTProto](#bot-api-vs-mtproto)
5. [Updates & Update Flow](#updates--update-flow)
6. [Long Polling vs Webhooks](#long-polling-vs-webhooks)
7. [Bot Limitations & Rules](#bot-limitations--rules)

---

## What is a Telegram Bot?

A Telegram bot is a **special type of account** that is operated by software, not a human. Bots can:

- **Receive messages** from users
- **Send messages** back to users
- **Process commands** (messages starting with `/`)
- **Handle inline queries** (type `@botname query` in any chat)
- **Manage groups** (admin bots)
- **Accept payments** (payment bots)
- **Play games** (game bots)

### Key Characteristics

| Feature | Regular User | Bot |
|---------|--------------|-----|
| Phone number required | ✅ Yes | ❌ No |
| Can initiate conversations | ✅ Yes | ❌ No (user must start first) |
| Can join groups | ✅ Yes | ✅ Yes (if invited) |
| Can read all group messages | ✅ Yes | ❌ Only commands by default |
| Profile picture | ✅ Yes | ✅ Yes |
| Username | Optional | **Required** (ends with `bot`) |

### Bot Username Rules

- Must end with `bot` (e.g., `@MyAwesomeBot`, `@weather_bot`)
- 5-32 characters long
- Only letters, numbers, and underscores
- Case-insensitive

---

## BotFather Deep Dive

**[@BotFather](https://t.me/botfather)** is the official Telegram bot for creating and managing bots. It's your control panel for everything bot-related.

### Creating a New Bot

```
1. Open Telegram and search for @BotFather
2. Send /newbot
3. Choose a display name (e.g., "My Weather Bot")
4. Choose a username (e.g., "my_weather_bot")
5. Receive your bot token 🎉
```

### Essential BotFather Commands

| Command | Description |
|---------|-------------|
| `/newbot` | Create a new bot |
| `/mybots` | List all your bots |
| `/setname` | Change bot's display name |
| `/setdescription` | Set bot description (shown on profile) |
| `/setabouttext` | Set "About" text |
| `/setuserpic` | Set bot profile picture |
| `/setcommands` | Define command menu |
| `/deletebot` | Delete a bot permanently |
| `/token` | View or regenerate bot token |
| `/revoke` | Revoke and regenerate token |

### Setting Up Commands Menu

The commands menu appears when users type `/` in the chat.

```
Send /setcommands to @BotFather
Select your bot
Send commands in this format:

start - Start the bot
help - Show help message
settings - Open settings
weather - Get weather forecast
```

### Bot Settings via BotFather

| Setting | Command | Description |
|---------|---------|-------------|
| Inline mode | `/setinline` | Enable `@bot query` in any chat |
| Privacy mode | `/setprivacy` | Control group message access |
| Join groups | `/setjoingroups` | Allow/disallow group joins |
| Inline feedback | `/setinlinefeedback` | Get stats on inline usage |

### Privacy Mode (Important!)

By default, bots have **privacy mode enabled**:

- ✅ Receives: Commands (`/command`), replies to bot, mentions
- ❌ Doesn't receive: Regular messages in groups

To receive ALL messages in groups:
```
/setprivacy → Disable
```

⚠️ **Warning**: Only disable if your bot needs to read all messages. Users may not want bots reading everything.

---

## Bot Tokens & Rotation

### What is a Bot Token?

A bot token is a **unique identifier + authentication key** for your bot. It looks like:

```
123456789:ABCdefGHIjklMNOpqrsTUVwxyz1234567890
```

Structure:
- `123456789` → Bot ID (numeric)
- `:` → Separator
- `ABCdefGHI...` → Secret key (alphanumeric)

### Token Security Rules

🔴 **NEVER DO THIS:**
- Commit tokens to Git/GitHub
- Share tokens publicly
- Hardcode tokens in client-side code
- Send tokens via unencrypted channels

🟢 **ALWAYS DO THIS:**
- Store tokens in environment variables
- Use `.env` files (add to `.gitignore`)
- Use secrets management in production
- Rotate tokens if compromised

### How to Rotate (Regenerate) a Token

If your token is compromised:

```
1. Open @BotFather
2. Send /revoke
3. Select your bot
4. Receive new token
5. Update your application immediately
```

⚠️ **Important**: The old token stops working **immediately**. Update your deployment before revoking!

### Environment Variables Example

```bash
# .env file (never commit this!)
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz

# In your code
const token = process.env.TELEGRAM_BOT_TOKEN;
```

---

## Bot API vs MTProto

Telegram has **two APIs**. Understanding the difference is crucial.

### MTProto (Telegram API)

- **What**: Low-level protocol for Telegram clients
- **Used by**: Official apps, third-party clients (Telethon, Pyrogram)
- **Features**: Full access to Telegram (user accounts, channels, etc.)
- **Complexity**: High (encryption, sessions, etc.)
- **Authentication**: Phone number + 2FA

### Bot API (HTTP API)

- **What**: High-level HTTP API specifically for bots
- **Used by**: All Telegram bots
- **Features**: Bot-specific features only
- **Complexity**: Low (simple HTTP requests)
- **Authentication**: Bot token only

### Comparison

| Feature | Bot API | MTProto |
|---------|---------|---------|
| Protocol | HTTPS | Custom binary |
| Complexity | Simple | Complex |
| User accounts | ❌ No | ✅ Yes |
| Bot accounts | ✅ Yes | ✅ Yes |
| File size limit | 50MB download, 50MB upload | 2GB |
| Rate limits | Strict | More flexible |
| Hosting | Webhooks/Polling | Long-running process |

### Why Bots Use Bot API

1. **Simplicity**: Just HTTP requests, any language works
2. **Security**: No need to handle encryption
3. **Hosting**: Works on serverless (Vercel, AWS Lambda)
4. **Official support**: Maintained by Telegram
5. **Sufficient features**: Everything bots need

### Bot API Endpoint

All Bot API requests go to:

```
https://api.telegram.org/bot<TOKEN>/<METHOD>
```

Example:
```bash
# Get bot info
curl https://api.telegram.org/bot123456:ABC.../getMe

# Send message
curl -X POST https://api.telegram.org/bot123456:ABC.../sendMessage \
  -d chat_id=12345 \
  -d text="Hello!"
```

---

## Updates & Update Flow

### What is an Update?

An **update** is any event that happens to your bot:

- User sends a message
- User presses an inline button
- User joins a group with your bot
- User starts a chat with your bot
- And more...

### Update Object Structure

```json
{
  "update_id": 123456789,
  "message": {
    "message_id": 1,
    "from": {
      "id": 12345678,
      "first_name": "John",
      "username": "johndoe"
    },
    "chat": {
      "id": 12345678,
      "type": "private"
    },
    "date": 1234567890,
    "text": "/start"
  }
}
```

### Update Types

| Type | Triggered When |
|------|----------------|
| `message` | User sends a message |
| `edited_message` | User edits a message |
| `callback_query` | User clicks inline button |
| `inline_query` | User types `@bot query` |
| `chosen_inline_result` | User selects inline result |
| `chat_member` | Bot's status changes in chat |
| `my_chat_member` | User's status changes in chat |

### Update Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        USER                                  │
│                          │                                   │
│                          ▼                                   │
│                   Sends message                              │
│                          │                                   │
└──────────────────────────┼──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   TELEGRAM SERVERS                           │
│                          │                                   │
│              Creates Update object                           │
│                          │                                   │
│         ┌────────────────┴────────────────┐                 │
│         │                                 │                  │
│         ▼                                 ▼                  │
│   [Long Polling]                    [Webhook]                │
│   Bot requests updates              Telegram POSTs           │
│   via getUpdates                    to your URL              │
│         │                                 │                  │
└─────────┼─────────────────────────────────┼─────────────────┘
          │                                 │
          ▼                                 ▼
┌─────────────────────────────────────────────────────────────┐
│                      YOUR BOT SERVER                         │
│                          │                                   │
│                 Process update                               │
│                          │                                   │
│                 Send response via                            │
│                 Bot API (sendMessage)                        │
│                          │                                   │
└──────────────────────────┼──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   TELEGRAM SERVERS                           │
│                          │                                   │
│              Deliver message to user                         │
│                          │                                   │
└──────────────────────────┼──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                        USER                                  │
│                          │                                   │
│                 Receives response                            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Update ID

Each update has a unique `update_id`. When using polling:

- Request updates with `offset = last_update_id + 1`
- This tells Telegram you've processed previous updates
- Prevents receiving the same update twice

---

## Long Polling vs Webhooks

There are **two ways** to receive updates from Telegram.

### Long Polling

Your bot **asks** Telegram for updates repeatedly.

```
Bot: "Any updates?" ──────────────────────▶ Telegram
Bot: ◀────────────────────── "No, wait..." Telegram
     (connection stays open for ~30 seconds)
Bot: ◀────────────────────── "Yes! Here's an update" Telegram
Bot: "Any updates?" ──────────────────────▶ Telegram
     (repeat)
```

**How to use:**

```bash
# Get updates (waits up to 30 seconds if no updates)
curl "https://api.telegram.org/bot<TOKEN>/getUpdates?timeout=30&offset=0"
```

**Code example:**

```javascript
let offset = 0;

while (true) {
  const updates = await fetch(
    `https://api.telegram.org/bot${TOKEN}/getUpdates?offset=${offset}&timeout=30`
  ).then(r => r.json());
  
  for (const update of updates.result) {
    processUpdate(update);
    offset = update.update_id + 1;
  }
}
```

### Webhooks

Telegram **sends** updates to your server automatically.

```
User sends message ──▶ Telegram ──▶ POST to your webhook URL
```

**How to set up:**

```bash
# Register your webhook URL
curl "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://yourapp.com/webhook"
```

**Your server receives:**

```javascript
// POST /webhook
app.post('/webhook', (req, res) => {
  const update = req.body;
  processUpdate(update);
  res.sendStatus(200); // Must respond quickly!
});
```

### Comparison Table

| Feature | Long Polling | Webhooks |
|---------|--------------|----------|
| **Setup** | Easy | Requires HTTPS URL |
| **Hosting** | Any server | Needs public URL |
| **Serverless** | ❌ No | ✅ Yes (Vercel, Lambda) |
| **Local dev** | ✅ Easy | Needs ngrok/tunnel |
| **Latency** | Higher (polling interval) | Lower (instant) |
| **Resources** | Always running | On-demand |
| **Scaling** | Harder | Easier |
| **Cost** | Higher (always on) | Lower (pay per request) |

### When to Use What

**Use Long Polling when:**
- Developing locally
- Simple bots with low traffic
- Can't set up HTTPS
- Learning/testing

**Use Webhooks when:**
- Production deployment
- Serverless platforms (Vercel, Render, AWS Lambda)
- High-traffic bots
- Need instant responses
- Want to minimize costs

### Switching Between Methods

```bash
# Enable webhook (disables polling)
curl "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://yourapp.com/webhook"

# Disable webhook (enables polling)
curl "https://api.telegram.org/bot<TOKEN>/deleteWebhook"

# Check current status
curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"
```

⚠️ **Important**: You can only use ONE method at a time. Setting a webhook automatically disables polling.

---

## Bot Limitations & Rules

### Technical Limits

| Limit | Value |
|-------|-------|
| Messages per second (to same chat) | 1 msg/sec |
| Messages per second (overall) | 30 msg/sec |
| Messages per minute (to same group) | 20 msg/min |
| Bulk messages (different chats) | 30 msg/sec |
| File download | 20 MB |
| File upload | 50 MB |
| Message length | 4096 characters |
| Caption length | 1024 characters |
| Inline query results | 50 results |
| Callback data | 64 bytes |

### Rate Limiting

If you exceed limits, you'll receive error 429:

```json
{
  "ok": false,
  "error_code": 429,
  "description": "Too Many Requests: retry after 35",
  "parameters": {
    "retry_after": 35
  }
}
```

**Best practices:**
- Implement exponential backoff
- Queue messages for bulk sending
- Respect `retry_after` values
- Use different chats to distribute load

### Bot Rules & Guidelines

**Bots MUST:**
- ✅ Respond to `/start` command
- ✅ Provide `/help` with usage instructions
- ✅ Handle errors gracefully
- ✅ Respect user privacy
- ✅ Follow Telegram ToS

**Bots MUST NOT:**
- ❌ Spam users
- ❌ Send unsolicited messages
- ❌ Collect data without consent
- ❌ Impersonate other services
- ❌ Facilitate illegal activities
- ❌ Abuse the API

### Privacy Considerations

1. **Don't store unnecessary data**
2. **Inform users what data you collect**
3. **Provide data deletion option**
4. **Use privacy mode in groups when possible**
5. **Don't share user data with third parties**

### Getting Your Bot Verified

For popular bots, you can request verification (blue checkmark):
- Contact @BotSupport
- Provide proof of bot ownership
- Explain bot's purpose and user base

---

## Next Steps

Now that you understand the fundamentals:

1. 📨 Learn about [Messages](../messages/) - sending different content types
2. ⌨️ Explore [Keyboards](../keyboards/) - interactive buttons
3. 🔒 Read about [Security](../security/) - protecting your bot
4. 📈 Study [Scaling](../scaling/) - handling growth

---

## Quick Reference

```bash
# Create bot
Message @BotFather: /newbot

# Get bot info
curl https://api.telegram.org/bot<TOKEN>/getMe

# Send message
curl -X POST https://api.telegram.org/bot<TOKEN>/sendMessage \
  -d chat_id=<CHAT_ID> \
  -d text="Hello!"

# Set webhook
curl https://api.telegram.org/bot<TOKEN>/setWebhook?url=<YOUR_URL>

# Get webhook info
curl https://api.telegram.org/bot<TOKEN>/getWebhookInfo

# Delete webhook
curl https://api.telegram.org/bot<TOKEN>/deleteWebhook
```
