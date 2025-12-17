# Groups & Channels Bots

A complete guide to building bots for Telegram groups and channels.

---

## 📖 Table of Contents

1. [Bot Permissions](#bot-permissions)
2. [Privacy Mode](#privacy-mode)
3. [Admin Bots](#admin-bots)
4. [Moderation Bots](#moderation-bots)
5. [Channel Posting Bots](#channel-posting-bots)
6. [Handling Joins & Leaves](#handling-joins--leaves)
7. [Inline Mentions in Groups](#inline-mentions-in-groups)

---

## Bot Permissions

Understanding what bots can and cannot do in groups.

### Permission Levels

| Permission | Regular Member | Admin | Owner |
|------------|----------------|-------|-------|
| Send messages | ✅ | ✅ | ✅ |
| Read all messages | ❌* | ❌* | ❌* |
| Delete messages | ❌ | ✅ | ✅ |
| Ban users | ❌ | ✅ | ✅ |
| Pin messages | ❌ | ✅ | ✅ |
| Add members | ❌ | ✅ | ✅ |
| Change group info | ❌ | ✅ | ✅ |
| Manage topics | ❌ | ✅ | ✅ |

*Depends on privacy mode setting

### Checking Bot Permissions

```javascript
async function getBotPermissions(chatId) {
  try {
    const botInfo = await bot.getMe();
    const member = await bot.getChatMember(chatId, botInfo.id);
    
    return {
      status: member.status, // 'administrator', 'member', etc.
      canDeleteMessages: member.can_delete_messages || false,
      canRestrictMembers: member.can_restrict_members || false,
      canPinMessages: member.can_pin_messages || false,
      canManageChat: member.can_manage_chat || false,
      canInviteUsers: member.can_invite_users || false,
      canManageTopics: member.can_manage_topics || false
    };
  } catch (error) {
    return null; // Bot not in chat or error
  }
}

// Usage
bot.onText(/\/checkperm/, async (msg) => {
  const perms = await getBotPermissions(msg.chat.id);
  
  if (!perms) {
    return bot.sendMessage(msg.chat.id, 'Could not check permissions');
  }
  
  const permList = Object.entries(perms)
    .map(([key, val]) => `${key}: ${val ? '✅' : '❌'}`)
    .join('\n');
  
  bot.sendMessage(msg.chat.id, `Bot permissions:\n${permList}`);
});
```

### Requesting Admin Rights

```javascript
// When bot needs admin rights
bot.on('message', async (msg) => {
  if (msg.chat.type === 'private') return;
  
  const perms = await getBotPermissions(msg.chat.id);
  
  if (perms?.status !== 'administrator') {
    await bot.sendMessage(msg.chat.id,
      '⚠️ I need admin rights to perform this action.\n' +
      'Please make me an admin with these permissions:\n' +
      '• Delete messages\n' +
      '• Ban users\n' +
      '• Pin messages'
    );
  }
});
```

### Chat Types

```javascript
bot.on('message', (msg) => {
  switch (msg.chat.type) {
    case 'private':
      // Direct message
      break;
    case 'group':
      // Regular group (up to 200 members)
      break;
    case 'supergroup':
      // Supergroup (up to 200,000 members)
      break;
    case 'channel':
      // Channel
      break;
  }
});
```

---

## Privacy Mode

Controlling what messages your bot receives in groups.

### What is Privacy Mode?

By default, bots have **privacy mode enabled**:

```
┌─────────────────────────────────────────────────────────────┐
│                    PRIVACY MODE: ENABLED                     │
├─────────────────────────────────────────────────────────────┤
│  Bot receives:                                               │
│  ✅ Commands (/command)                                      │
│  ✅ Replies to bot's messages                                │
│  ✅ Messages mentioning @bot                                 │
│  ✅ Service messages (joins, leaves, etc.)                   │
│  ✅ Messages via inline mode                                 │
│                                                              │
│  Bot does NOT receive:                                       │
│  ❌ Regular text messages                                    │
│  ❌ Media without caption commands                           │
│  ❌ Edited messages (unless replies to bot)                  │
└─────────────────────────────────────────────────────────────┘
```

### Disabling Privacy Mode

Via BotFather:
```
1. Open @BotFather
2. Send /mybots
3. Select your bot
4. Bot Settings → Group Privacy
5. Turn off
```

After disabling:
```
┌─────────────────────────────────────────────────────────────┐
│                    PRIVACY MODE: DISABLED                    │
├─────────────────────────────────────────────────────────────┤
│  Bot receives ALL messages in groups                         │
│  ⚠️ Users may not want this - use responsibly!              │
└─────────────────────────────────────────────────────────────┘
```

### Admin Exception

Even with privacy mode ON, admin bots receive all messages:

```javascript
// Check if bot is admin (receives all messages)
async function botReceivesAllMessages(chatId) {
  const perms = await getBotPermissions(chatId);
  return perms?.status === 'administrator';
}
```

### Handling Privacy Mode

```javascript
bot.on('message', async (msg) => {
  if (msg.chat.type === 'private') {
    // Always receive all messages in private
    return handlePrivateMessage(msg);
  }
  
  // In groups, check what we received
  if (msg.text?.startsWith('/')) {
    // Command - always received
    return handleCommand(msg);
  }
  
  if (msg.reply_to_message?.from?.id === botInfo.id) {
    // Reply to bot - always received
    return handleReply(msg);
  }
  
  // Regular message - only if privacy mode off or bot is admin
  return handleGroupMessage(msg);
});
```

---

## Admin Bots

Building bots with administrative capabilities.

### Admin Commands

```javascript
// Check if user is admin
async function isAdmin(chatId, userId) {
  try {
    const member = await bot.getChatMember(chatId, userId);
    return ['administrator', 'creator'].includes(member.status);
  } catch {
    return false;
  }
}

// Admin-only command decorator
function adminOnly(handler) {
  return async (msg, ...args) => {
    if (!await isAdmin(msg.chat.id, msg.from.id)) {
      return bot.sendMessage(msg.chat.id, '⛔ Admin only command');
    }
    return handler(msg, ...args);
  };
}

// Usage
bot.onText(/\/ban/, adminOnly(async (msg) => {
  // Only admins can use this
  const targetUser = msg.reply_to_message?.from;
  if (!targetUser) {
    return bot.sendMessage(msg.chat.id, 'Reply to a user to ban them');
  }
  
  await bot.banChatMember(msg.chat.id, targetUser.id);
  bot.sendMessage(msg.chat.id, `🔨 Banned ${targetUser.first_name}`);
}));
```

### Group Settings Management

```javascript
// Set group title
bot.onText(/\/settitle (.+)/, adminOnly(async (msg, match) => {
  try {
    await bot.setChatTitle(msg.chat.id, match[1]);
    bot.sendMessage(msg.chat.id, '✅ Title updated');
  } catch (e) {
    bot.sendMessage(msg.chat.id, '❌ Failed: ' + e.message);
  }
}));

// Set group description
bot.onText(/\/setdesc (.+)/, adminOnly(async (msg, match) => {
  await bot.setChatDescription(msg.chat.id, match[1]);
}));

// Set group photo
bot.on('photo', adminOnly(async (msg) => {
  if (!msg.caption?.startsWith('/setphoto')) return;
  
  const photo = msg.photo[msg.photo.length - 1];
  const file = await bot.getFile(photo.file_id);
  // Set as group photo...
}));

// Pin message
bot.onText(/\/pin/, adminOnly(async (msg) => {
  if (!msg.reply_to_message) {
    return bot.sendMessage(msg.chat.id, 'Reply to a message to pin it');
  }
  
  await bot.pinChatMessage(msg.chat.id, msg.reply_to_message.message_id);
}));
```

### User Management

```javascript
// Kick user (can rejoin)
bot.onText(/\/kick/, adminOnly(async (msg) => {
  const target = msg.reply_to_message?.from;
  if (!target) return;
  
  await bot.banChatMember(msg.chat.id, target.id);
  await bot.unbanChatMember(msg.chat.id, target.id); // Allow rejoin
  
  bot.sendMessage(msg.chat.id, `👢 Kicked ${target.first_name}`);
}));

// Ban user (cannot rejoin)
bot.onText(/\/ban/, adminOnly(async (msg) => {
  const target = msg.reply_to_message?.from;
  if (!target) return;
  
  await bot.banChatMember(msg.chat.id, target.id);
  bot.sendMessage(msg.chat.id, `🔨 Banned ${target.first_name}`);
}));

// Mute user
bot.onText(/\/mute (\d+)?/, adminOnly(async (msg, match) => {
  const target = msg.reply_to_message?.from;
  if (!target) return;
  
  const duration = parseInt(match[1]) || 60; // Default 60 minutes
  const until = Math.floor(Date.now() / 1000) + (duration * 60);
  
  await bot.restrictChatMember(msg.chat.id, target.id, {
    can_send_messages: false,
    until_date: until
  });
  
  bot.sendMessage(msg.chat.id, `🔇 Muted ${target.first_name} for ${duration} minutes`);
}));

// Unmute user
bot.onText(/\/unmute/, adminOnly(async (msg) => {
  const target = msg.reply_to_message?.from;
  if (!target) return;
  
  await bot.restrictChatMember(msg.chat.id, target.id, {
    can_send_messages: true,
    can_send_media_messages: true,
    can_send_other_messages: true,
    can_add_web_page_previews: true
  });
  
  bot.sendMessage(msg.chat.id, `🔊 Unmuted ${target.first_name}`);
}));
```

---

## Moderation Bots

Building bots for content moderation.

### Anti-Spam Filter

```javascript
const spamPatterns = [
  /buy now/i,
  /click here/i,
  /free money/i,
  /t\.me\/\w+/i, // Telegram links
  /bit\.ly/i,
  /\$\d+/i // Price mentions
];

const userMessageCount = new Map();
const MESSAGE_LIMIT = 5;
const TIME_WINDOW = 10000; // 10 seconds

bot.on('message', async (msg) => {
  if (msg.chat.type === 'private') return;
  
  const userId = msg.from.id;
  const text = msg.text || msg.caption || '';
  
  // Check spam patterns
  for (const pattern of spamPatterns) {
    if (pattern.test(text)) {
      await bot.deleteMessage(msg.chat.id, msg.message_id);
      await bot.sendMessage(msg.chat.id, 
        `⚠️ Message from ${msg.from.first_name} removed (spam detected)`
      );
      return;
    }
  }
  
  // Rate limiting
  const now = Date.now();
  const userHistory = userMessageCount.get(userId) || [];
  const recentMessages = userHistory.filter(t => now - t < TIME_WINDOW);
  
  if (recentMessages.length >= MESSAGE_LIMIT) {
    await bot.deleteMessage(msg.chat.id, msg.message_id);
    await bot.restrictChatMember(msg.chat.id, userId, {
      can_send_messages: false,
      until_date: Math.floor(now / 1000) + 300 // 5 min mute
    });
    await bot.sendMessage(msg.chat.id,
      `🔇 ${msg.from.first_name} muted for 5 minutes (flooding)`
    );
    return;
  }
  
  recentMessages.push(now);
  userMessageCount.set(userId, recentMessages);
});
```

### Bad Word Filter

```javascript
const badWords = ['badword1', 'badword2', 'badword3'];
const warnings = new Map();
const MAX_WARNINGS = 3;

function containsBadWord(text) {
  const lower = text.toLowerCase();
  return badWords.some(word => lower.includes(word));
}

bot.on('message', async (msg) => {
  if (msg.chat.type === 'private') return;
  
  const text = msg.text || msg.caption || '';
  
  if (containsBadWord(text)) {
    // Delete message
    await bot.deleteMessage(msg.chat.id, msg.message_id);
    
    // Track warnings
    const userId = msg.from.id visitorId;
    const userWarnings = (warnings.get(userId) || 0) + 1;
    warnings.set(userId, userWarnings);
    
    if (userWarnings >= MAX_WARNINGS) {
      // Ban after max warnings
      await bot.banChatMember(msg.chat.id, userId);
      await bot.sendMessage(msg.chat.id,
        `🔨 ${msg.from.first_name} banned (${MAX_WARNINGS} warnings)`
      );
      warnings.delete(userId);
    } else {
      await bot.sendMessage(msg.chat.id,
        `⚠️ ${msg.from.first_name}, watch your language! ` +
        `Warning ${userWarnings}/${MAX_WARNINGS}`
      );
    }
  }
});
```

### Link Filter

```javascript
const allowedDomains = ['telegram.org', 'example.com'];

function extractUrls(text) {
  const urlRegex = /https?:\/\/[^\s]+/gi;
  return text.match(urlRegex) || [];
}

function isAllowedUrl(url) {
  try {
    const domain = new URL(url).hostname;
    return allowedDomains.some(allowed => 
      domain === allowed || domain.endsWith('.' + allowed)
    );
  } catch {
    return false;
  }
}

bot.on('message', async (msg) => {
  if (msg.chat.type === 'private') return;
  if (await isAdmin(msg.chat.id, msg.from.id)) return; // Admins exempt
  
  const text = msg.text || msg.caption || '';
  const urls = extractUrls(text);
  
  const hasDisallowedUrl = urls.some(url => !isAllowedUrl(url));
  
  if (hasDisallowedUrl) {
    await bot.deleteMessage(msg.chat.id, msg.message_id);
    await bot.sendMessage(msg.chat.id,
      `⚠️ ${msg.from.first_name}, external links are not allowed`
    );
  }
});
```

### Media Filter

```javascript
const mediaSettings = {
  allowPhotos: true,
  allowVideos: true,
  allowStickers: false,
  allowGifs: false,
  allowDocuments: false
};

bot.on('message', async (msg) => {
  if (msg.chat.type === 'private') return;
  if (await isAdmin(msg.chat.id, msg.from.id)) return;
  
  let shouldDelete = false;
  let mediaType = '';
  
  if (msg.photo && !mediaSettings.allowPhotos) {
    shouldDelete = true;
    mediaType = 'photos';
  } else if (msg.video && !mediaSettings.allowVideos) {
    shouldDelete = true;
    mediaType = 'videos';
  } else if (msg.sticker && !mediaSettings.allowStickers) {
    shouldDelete = true;
    mediaType = 'stickers';
  } else if (msg.animation && !mediaSettings.allowGifs) {
    shouldDelete = true;
    mediaType = 'GIFs';
  } else if (msg.document && !mediaSettings.allowDocuments) {
    shouldDelete = true;
    mediaType = 'documents';
  }
  
  if (shouldDelete) {
    await bot.deleteMessage(msg.chat.id, msg.message_id);
    await bot.sendMessage(msg.chat.id,
      `⚠️ ${msg.from.first_name}, ${mediaType} are not allowed in this group`
    );
  }
});
```

---

## Channel Posting Bots

Building bots that post to channels.

### Basic Channel Post

```javascript
const CHANNEL_ID = '@yourchannel'; // or numeric ID: -1001234567890

// Post text
await bot.sendMessage(CHANNEL_ID, 'Hello channel!');

// Post with formatting
await bot.sendMessage(CHANNEL_ID, '<b>Breaking News!</b>\n\nContent here...', {
  parse_mode: 'HTML'
});

// Post photo
await bot.sendPhoto(CHANNEL_ID, 'photo.jpg', {
  caption: 'Photo caption'
});

// Post with buttons
await bot.sendMessage(CHANNEL_ID, 'Check this out!', {
  reply_markup: {
    inline_keyboard: [
      [{ text: 'Read More', url: 'https://example.com' }]
    ]
  }
});
```

### Scheduled Posts

```javascript
const schedule = require('node-schedule');

// Post every day at 9 AM
schedule.scheduleJob('0 9 * * *', async () => {
  const content = await generateDailyContent();
  await bot.sendMessage(CHANNEL_ID, content);
});

// Post every hour
schedule.scheduleJob('0 * * * *', async () => {
  const update = await getHourlyUpdate();
  await bot.sendMessage(CHANNEL_ID, update);
});

// One-time scheduled post
const postDate = new Date('2024-12-25T00:00:00');
schedule.scheduleJob(postDate, async () => {
  await bot.sendMessage(CHANNEL_ID, '🎄 Merry Christmas!');
});
```

### Content Queue

```javascript
const postQueue = [];

function addToQueue(content, scheduledTime) {
  postQueue.push({ content, scheduledTime, posted: false });
  postQueue.sort((a, b) => a.scheduledTime - b.scheduledTime);
}

// Process queue
setInterval(async () => {
  const now = Date.now();
  
  for (const post of postQueue) {
    if (!post.posted && post.scheduledTime <= now) {
      try {
        await bot.sendMessage(CHANNEL_ID, post.content);
        post.posted = true;
      } catch (error) {
        console.error('Failed to post:', error);
      }
    }
  }
  
  // Clean up posted items
  postQueue = postQueue.filter(p => !p.posted);
}, 60000); // Check every minute
```

### Admin Panel for Channel

```javascript
// Only channel admins can use these commands
bot.onText(/\/post (.+)/, async (msg, match) => {
  if (msg.chat.type !== 'private') return;
  
  // Verify user is channel admin
  try {
    const member = await bot.getChatMember(CHANNEL_ID, msg.from.id);
    if (!['administrator', 'creator'].includes(member.status)) {
      return bot.sendMessage(msg.chat.id, '⛔ You are not a channel admin');
    }
  } catch {
    return bot.sendMessage(msg.chat.id, '⛔ Could not verify permissions');
  }
  
  // Post to channel
  const content = match[1];
  await bot.sendMessage(CHANNEL_ID, content);
  await bot.sendMessage(msg.chat.id, '✅ Posted to channel');
});

// Preview before posting
bot.onText(/\/preview (.+)/, async (msg, match) => {
  const content = match[1];
  
  await bot.sendMessage(msg.chat.id, '📝 Preview:\n\n' + content);
  await bot.sendMessage(msg.chat.id, 'Post this?', {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '✅ Post', callback_data: `post_${Buffer.from(content).toString('base64')}` },
          { text: '❌ Cancel', callback_data: 'cancel_post' }
        ]
      ]
    }
  });
});
```

---

## Handling Joins & Leaves

Detecting and responding to membership changes.

### New Member Welcome

```javascript
bot.on('new_chat_members', async (msg) => {
  for (const member of msg.new_chat_members) {
    // Skip if bot joined
    if (member.is_bot) continue;
    
    const welcome = `👋 Welcome ${member.first_name}!\n\n` +
      `Please read the rules:\n` +
      `1. Be respectful\n` +
      `2. No spam\n` +
      `3. Stay on topic`;
    
    await bot.sendMessage(msg.chat.id, welcome);
  }
});
```

### Captcha Verification

```javascript
const pendingVerification = new Map();

bot.on('new_chat_members', async (msg) => {
  for (const member of msg.new_chat_members) {
    if (member.is_bot) continue;
    
    // Restrict until verified
    await bot.restrictChatMember(msg.chat.id, member.id, {
      can_send_messages: false
    });
    
    // Generate captcha
    const captcha = Math.floor(1000 + Math.random() * 9000).toString();
    pendingVerification.set(member.id, {
      chatId: msg.chat.id,
      captcha,
      expires: Date.now() + 120000 // 2 minutes
    });
    
    await bot.sendMessage(msg.chat.id,
      `🔐 ${member.first_name}, please verify you're human.\n` +
      `Send me this code in private: ${captcha}\n` +
      `You have 2 minutes.`
    );
  }
});

// Handle verification in private
bot.on('message', async (msg) => {
  if (msg.chat.type !== 'private') return;
  
  const pending = pendingVerification.get(msg.from.id);
  if (!pending) return;
  
  if (Date.now() > pending.expires) {
    pendingVerification.delete(msg.from.id);
    await bot.sendMessage(msg.chat.id, '❌ Verification expired');
    return;
  }
  
  if (msg.text === pending.captcha) {
    // Verified!
    await bot.restrictChatMember(pending.chatId, msg.from.id, {
      can_send_messages: true,
      can_send_media_messages: true,
      can_send_other_messages: true,
      can_add_web_page_previews: true
    });
    
    pendingVerification.delete(msg.from.id);
    
    await bot.sendMessage(msg.chat.id, '✅ Verified! You can now chat.');
    await bot.sendMessage(pending.chatId, `✅ ${msg.from.first_name} verified`);
  } else {
    await bot.sendMessage(msg.chat.id, '❌ Wrong code. Try again.');
  }
});
```

### Member Left

```javascript
bot.on('left_chat_member', async (msg) => {
  const member = msg.left_chat_member;
  
  // Don't announce if kicked
  if (msg.from.id !== member.id) {
    // User was kicked/banned
    return;
  }
  
  await bot.sendMessage(msg.chat.id, `👋 ${member.first_name} left the group`);
});
```

### Chat Member Updates (Detailed)

```javascript
bot.on('chat_member', async (update) => {
  const { old_chat_member, new_chat_member, chat } = update;
  
  const oldStatus = old_chat_member.status;
  const newStatus = new_chat_member.status;
  const user = new_chat_member.user;
  
  // User joined
  if (oldStatus === 'left' && newStatus === 'member') {
    console.log(`${user.first_name} joined ${chat.title}`);
  }
  
  // User left
  if (oldStatus === 'member' && newStatus === 'left') {
    console.log(`${user.first_name} left ${chat.title}`);
  }
  
  // User promoted to admin
  if (newStatus === 'administrator' && oldStatus !== 'administrator') {
    console.log(`${user.first_name} is now admin`);
  }
  
  // User banned
  if (newStatus === 'kicked') {
    console.log(`${user.first_name} was banned`);
  }
});
```

---

## Inline Mentions in Groups

Mentioning users in bot messages.

### Mention by Username

```javascript
// Simple @mention
bot.sendMessage(chatId, 'Hello @username!');
```

### Mention by User ID (Text Mention)

```javascript
// For users without username
bot.sendMessage(chatId, 
  `Hello <a href="tg://user?id=${userId}">${firstName}</a>!`,
  { parse_mode: 'HTML' }
);

// MarkdownV2
bot.sendMessage(chatId,
  `Hello [${firstName}](tg://user?id=${userId})!`,
  { parse_mode: 'MarkdownV2' }
);
```

### Mention Multiple Users

```javascript
async function mentionUsers(chatId, userIds) {
  const mentions = [];
  
  for (const userId of userIds) {
    try {
      const member = await bot.getChatMember(chatId, userId);
      const user = member.user;
      
      if (user.username) {
        mentions.push(`@${user.username}`);
      } else {
        mentions.push(`<a href="tg://user?id=${userId}">${user.first_name}</a>`);
      }
    } catch {
      // User not found
    }
  }
  
  return mentions.join(', ');
}

// Usage
const adminIds = [123, 456, 789];
const mentionList = await mentionUsers(chatId, adminIds);
bot.sendMessage(chatId, `Attention admins: ${mentionList}`, { parse_mode: 'HTML' });
```

### Reply with Mention

```javascript
bot.on('message', async (msg) => {
  if (msg.text === '/tagme') {
    const mention = msg.from.username 
      ? `@${msg.from.username}`
      : `<a href="tg://user?id=${msg.from.id}">${msg.from.first_name}</a>`;
    
    await bot.sendMessage(msg.chat.id, `Hey ${mention}!`, {
      parse_mode: 'HTML',
      reply_to_message_id: msg.message_id
    });
  }
});
```

---

## Quick Reference

```javascript
// Check if admin
const member = await bot.getChatMember(chatId, userId);
const isAdmin = ['administrator', 'creator'].includes(member.status);

// Ban user
await bot.banChatMember(chatId, userId);

// Kick user (allow rejoin)
await bot.banChatMember(chatId, userId);
await bot.unbanChatMember(chatId, userId);

// Mute user
await bot.restrictChatMember(chatId, userId, {
  can_send_messages: false,
  until_date: Math.floor(Date.now() / 1000) + 3600
});

// Delete message
await bot.deleteMessage(chatId, messageId);

// Pin message
await bot.pinChatMessage(chatId, messageId);

// Post to channel
await bot.sendMessage('@channelname', 'Content');

// Mention user
`<a href="tg://user?id=${userId}">${name}</a>`
```

