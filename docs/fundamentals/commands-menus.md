# Bot Commands & Menus

A complete guide to setting up commands, menus, and deep linking.

---

## 📖 Table of Contents

1. [/setcommands](#setcommands)
2. [Scoped Commands](#scoped-commands)
3. [Command Localization](#command-localization)
4. [Bot Menu Button](#bot-menu-button)
5. [Deep Linking (Start Params)](#deep-linking-start-params)

---

## /setcommands

Setting up the command menu that appears when users type `/`.

### Via BotFather (Manual)

```
1. Open @BotFather
2. Send /setcommands
3. Select your bot
4. Send commands in this format:

start - Start the bot
help - Show help message
settings - Open settings
search - Search for something
```

### Via Bot API (Programmatic)

```javascript
// Set commands for all users
await bot.setMyCommands([
  { command: 'start', description: 'Start the bot' },
  { command: 'help', description: 'Show help message' },
  { command: 'settings', description: 'Open settings' },
  { command: 'search', description: 'Search for something' },
  { command: 'feedback', description: 'Send feedback' }
]);
```

### Get Current Commands

```javascript
const commands = await bot.getMyCommands();
console.log('Current commands:', commands);
// [{ command: 'start', description: 'Start the bot' }, ...]
```

### Delete Commands

```javascript
// Remove all commands
await bot.deleteMyCommands();

// Remove commands for specific scope
await bot.deleteMyCommands({
  scope: { type: 'chat', chat_id: chatId }
});
```

### Command Rules

| Rule | Requirement |
|------|-------------|
| Length | 1-32 characters |
| Characters | Lowercase a-z, 0-9, underscores |
| Description | 3-256 characters |
| Max commands | 100 per scope |

### Best Practices

```javascript
// ✅ Good command names
const goodCommands = [
  { command: 'start', description: 'Start the bot' },
  { command: 'help', description: 'Get help' },
  { command: 'new_order', description: 'Create new order' },
  { command: 'my_profile', description: 'View your profile' }
];

// ❌ Bad command names
const badCommands = [
  { command: 'Start', description: '...' },      // Uppercase
  { command: 'new-order', description: '...' },  // Hyphen
  { command: 'a', description: 'Too short' },    // Too short description
];
```

---

## Scoped Commands

Different commands for different contexts.

### Scope Types

```
┌─────────────────────────────────────────────────────────────┐
│                    COMMAND SCOPES                            │
├─────────────────────────────────────────────────────────────┤
│  default              → All users, all chats                │
│  all_private_chats    → All private chats                   │
│  all_group_chats      → All groups and supergroups          │
│  all_chat_administrators → All group admins                 │
│  chat                 → Specific chat                       │
│  chat_administrators  → Admins of specific chat             │
│  chat_member          → Specific user in specific chat      │
└─────────────────────────────────────────────────────────────┘
```

### Set Commands by Scope

```javascript
// Default commands (all users)
await bot.setMyCommands([
  { command: 'start', description: 'Start the bot' },
  { command: 'help', description: 'Get help' }
]);

// Private chat commands
await bot.setMyCommands([
  { command: 'start', description: 'Start the bot' },
  { command: 'help', description: 'Get help' },
  { command: 'settings', description: 'Your settings' },
  { command: 'profile', description: 'Your profile' }
], {
  scope: { type: 'all_private_chats' }
});

// Group commands
await bot.setMyCommands([
  { command: 'start', description: 'Start the bot' },
  { command: 'help', description: 'Get help' },
  { command: 'stats', description: 'Group statistics' }
], {
  scope: { type: 'all_group_chats' }
});

// Admin commands (in all groups)
await bot.setMyCommands([
  { command: 'start', description: 'Start the bot' },
  { command: 'help', description: 'Get help' },
  { command: 'ban', description: 'Ban a user' },
  { command: 'mute', description: 'Mute a user' },
  { command: 'settings', description: 'Group settings' }
], {
  scope: { type: 'all_chat_administrators' }
});

// Commands for specific chat
await bot.setMyCommands([
  { command: 'start', description: 'Start' },
  { command: 'special', description: 'Special command for this chat' }
], {
  scope: { type: 'chat', chat_id: -1001234567890 }
});

// Commands for specific user in specific chat
await bot.setMyCommands([
  { command: 'admin', description: 'Admin panel' },
  { command: 'broadcast', description: 'Send broadcast' }
], {
  scope: { type: 'chat_member', chat_id: chatId, user_id: adminUserId }
});
```

### Get Commands by Scope

```javascript
// Get default commands
const defaultCmds = await bot.getMyCommands();

// Get private chat commands
const privateCmds = await bot.getMyCommands({
  scope: { type: 'all_private_chats' }
});

// Get commands for specific chat
const chatCmds = await bot.getMyCommands({
  scope: { type: 'chat', chat_id: chatId }
});
```

### Scope Priority

Commands are resolved in this order (first match wins):

```
1. chat_member (specific user in specific chat)
2. chat_administrators (admins of specific chat)
3. chat (specific chat)
4. all_chat_administrators (all group admins)
5. all_group_chats (all groups)
6. all_private_chats (all private chats)
7. default (fallback)
```

### Complete Setup Example

```javascript
async function setupCommands() {
  // 1. Default (fallback)
  await bot.setMyCommands([
    { command: 'start', description: 'Start the bot' },
    { command: 'help', description: 'Get help' }
  ]);
  
  // 2. Private chats - more personal commands
  await bot.setMyCommands([
    { command: 'start', description: 'Start the bot' },
    { command: 'help', description: 'Get help' },
    { command: 'settings', description: 'Your settings' },
    { command: 'history', description: 'Your history' },
    { command: 'subscribe', description: 'Subscribe to updates' }
  ], { scope: { type: 'all_private_chats' } });
  
  // 3. Groups - group-relevant commands
  await bot.setMyCommands([
    { command: 'start', description: 'Start the bot' },
    { command: 'help', description: 'Get help' },
    { command: 'rules', description: 'Show group rules' },
    { command: 'report', description: 'Report a message' }
  ], { scope: { type: 'all_group_chats' } });
  
  // 4. Group admins - moderation commands
  await bot.setMyCommands([
    { command: 'start', description: 'Start the bot' },
    { command: 'help', description: 'Get help' },
    { command: 'ban', description: 'Ban user' },
    { command: 'mute', description: 'Mute user' },
    { command: 'warn', description: 'Warn user' },
    { command: 'settings', description: 'Bot settings' }
  ], { scope: { type: 'all_chat_administrators' } });
  
  console.log('✅ Commands configured');
}

setupCommands();
```

---

## Command Localization

Different command descriptions for different languages.

### Set Localized Commands

```javascript
// English (default)
await bot.setMyCommands([
  { command: 'start', description: 'Start the bot' },
  { command: 'help', description: 'Get help' },
  { command: 'settings', description: 'Settings' }
]);

// Spanish
await bot.setMyCommands([
  { command: 'start', description: 'Iniciar el bot' },
  { command: 'help', description: 'Obtener ayuda' },
  { command: 'settings', description: 'Configuración' }
], { language_code: 'es' });

// Russian
await bot.setMyCommands([
  { command: 'start', description: 'Запустить бота' },
  { command: 'help', description: 'Получить помощь' },
  { command: 'settings', description: 'Настройки' }
], { language_code: 'ru' });

// German
await bot.setMyCommands([
  { command: 'start', description: 'Bot starten' },
  { command: 'help', description: 'Hilfe erhalten' },
  { command: 'settings', description: 'Einstellungen' }
], { language_code: 'de' });

// French
await bot.setMyCommands([
  { command: 'start', description: 'Démarrer le bot' },
  { command: 'help', description: 'Obtenir de l\'aide' },
  { command: 'settings', description: 'Paramètres' }
], { language_code: 'fr' });
```

### Combine Scope and Language

```javascript
// Spanish commands for private chats
await bot.setMyCommands([
  { command: 'start', description: 'Iniciar' },
  { command: 'help', description: 'Ayuda' },
  { command: 'perfil', description: 'Tu perfil' }
], {
  scope: { type: 'all_private_chats' },
  language_code: 'es'
});

// German admin commands
await bot.setMyCommands([
  { command: 'ban', description: 'Benutzer sperren' },
  { command: 'mute', description: 'Benutzer stummschalten' }
], {
  scope: { type: 'all_chat_administrators' },
  language_code: 'de'
});
```

### Automated Localization Setup

```javascript
const translations = {
  en: {
    start: 'Start the bot',
    help: 'Get help',
    settings: 'Settings'
  },
  es: {
    start: 'Iniciar el bot',
    help: 'Obtener ayuda',
    settings: 'Configuración'
  },
  ru: {
    start: 'Запустить бота',
    help: 'Получить помощь',
    settings: 'Настройки'
  },
  de: {
    start: 'Bot starten',
    help: 'Hilfe erhalten',
    settings: 'Einstellungen'
  }
};

async function setupLocalizedCommands() {
  for (const [lang, texts] of Object.entries(translations)) {
    const commands = [
      { command: 'start', description: texts.start },
      { command: 'help', description: texts.help },
      { command: 'settings', description: texts.settings }
    ];
    
    if (lang === 'en') {
      // English as default (no language_code)
      await bot.setMyCommands(commands);
    } else {
      await bot.setMyCommands(commands, { language_code: lang });
    }
  }
  
  console.log('✅ Localized commands set');
}
```

### Language Codes

Common language codes (IETF BCP 47):

| Code | Language |
|------|----------|
| `en` | English |
| `es` | Spanish |
| `ru` | Russian |
| `de` | German |
| `fr` | French |
| `it` | Italian |
| `pt` | Portuguese |
| `zh` | Chinese |
| `ja` | Japanese |
| `ko` | Korean |
| `ar` | Arabic |
| `hi` | Hindi |

---

## Bot Menu Button

Customizing the menu button next to the text input.

### Menu Button Types

```
┌─────────────────────────────────────────────────────────────┐
│  Menu Button Types:                                          │
│                                                              │
│  1. commands (default) - Opens command menu                  │
│  2. web_app - Opens a Web App                               │
│  3. default - System default behavior                        │
└─────────────────────────────────────────────────────────────┘
```

### Set Menu Button

```javascript
// Commands menu (default)
await bot.setChatMenuButton({
  menu_button: { type: 'commands' }
});

// Web App button
await bot.setChatMenuButton({
  menu_button: {
    type: 'web_app',
    text: 'Open App',
    web_app: { url: 'https://example.com/webapp' }
  }
});

// Default (system decides)
await bot.setChatMenuButton({
  menu_button: { type: 'default' }
});
```

### Set for Specific Chat

```javascript
// Set menu button for specific user's private chat
await bot.setChatMenuButton({
  chat_id: userId,
  menu_button: {
    type: 'web_app',
    text: 'Dashboard',
    web_app: { url: 'https://example.com/dashboard' }
  }
});
```

### Get Menu Button

```javascript
// Get default menu button
const menuButton = await bot.getChatMenuButton();

// Get for specific chat
const chatMenuButton = await bot.getChatMenuButton({
  chat_id: chatId
});
```

### Dynamic Menu Button

```javascript
// Change menu button based on user state
async function updateMenuButton(userId, isPremium) {
  if (isPremium) {
    await bot.setChatMenuButton({
      chat_id: userId,
      menu_button: {
        type: 'web_app',
        text: '⭐ Premium Dashboard',
        web_app: { url: 'https://example.com/premium' }
      }
    });
  } else {
    await bot.setChatMenuButton({
      chat_id: userId,
      menu_button: {
        type: 'web_app',
        text: 'Upgrade to Premium',
        web_app: { url: 'https://example.com/upgrade' }
      }
    });
  }
}
```

---

## Deep Linking (Start Params)

Passing parameters when users start your bot.

### How Deep Links Work

```
User clicks: https://t.me/YourBot?start=abc123
                                      ↓
Bot receives: /start abc123
                     ↓
You extract: "abc123" as the parameter
```

### Creating Deep Links

```javascript
const BOT_USERNAME = 'YourBot';

function createDeepLink(param) {
  return `https://t.me/${BOT_USERNAME}?start=${param}`;
}

// Examples
const referralLink = createDeepLink('ref_user123');
// https://t.me/YourBot?start=ref_user123

const productLink = createDeepLink('product_456');
// https://t.me/YourBot?start=product_456

const campaignLink = createDeepLink('campaign_summer2024');
// https://t.me/YourBot?start=campaign_summer2024
```

### Handling Start Parameters

```javascript
// Handle /start with parameter
bot.onText(/\/start (.+)/, async (msg, match) => {
  const param = match[1];
  const userId = msg.from.id;
  
  console.log(`User ${userId} started with param: ${param}`);
  
  // Parse parameter
  if (param.startsWith('ref_')) {
    const referrerId = param.slice(4);
    await handleReferral(userId, referrerId);
    await bot.sendMessage(msg.chat.id, 
      `Welcome! You were referred by user ${referrerId}`
    );
  }
  else if (param.startsWith('product_')) {
    const productId = param.slice(8);
    await showProduct(msg.chat.id, productId);
  }
  else if (param.startsWith('verify_')) {
    const code = param.slice(7);
    await verifyEmail(userId, code);
  }
  else {
    // Unknown parameter
    await bot.sendMessage(msg.chat.id, 'Welcome!');
  }
});

// Handle /start without parameter
bot.onText(/^\/start$/, async (msg) => {
  await bot.sendMessage(msg.chat.id, 
    'Welcome! Use /help to see available commands.'
  );
});
```

### Group Deep Links

```javascript
// Add bot to group with parameter
const groupLink = `https://t.me/YourBot?startgroup=setup123`;

// Handle in group
bot.on('message', async (msg) => {
  if (msg.group_chat_created || msg.new_chat_members?.some(m => m.id === botId)) {
    // Bot was added to group
    // Check if there's a start parameter in the invite link
  }
});
```

### Encoded Parameters

```javascript
// Encode complex data
function encodeParam(data) {
  return Buffer.from(JSON.stringify(data)).toString('base64url');
}

function decodeParam(param) {
  return JSON.parse(Buffer.from(param, 'base64url').toString());
}

// Create link with complex data
const data = { action: 'buy', product: 123, discount: 10 };
const link = createDeepLink(encodeParam(data));

// Handle
bot.onText(/\/start (.+)/, async (msg, match) => {
  try {
    const data = decodeParam(match[1]);
    // data = { action: 'buy', product: 123, discount: 10 }
  } catch {
    // Invalid parameter
  }
});
```

### Parameter Limits

| Limit | Value |
|-------|-------|
| Max length | 64 characters |
| Characters | A-Z, a-z, 0-9, _, - |
| Base64 | Use base64url (no +/=) |

### Tracking & Analytics

```javascript
// Track deep link usage
const linkStats = new Map();

bot.onText(/\/start (.+)/, async (msg, match) => {
  const param = match[1];
  
  // Track
  const count = linkStats.get(param) || 0;
  linkStats.set(param, count + 1);
  
  // Log to analytics
  await trackEvent('deep_link_used', {
    param,
    userId: msg.from.id,
    timestamp: Date.now()
  });
});

// Generate tracked referral links
async function createTrackedLink(userId) {
  const param = `ref_${userId}_${Date.now()}`;
  const link = createDeepLink(param);
  
  // Store for tracking
  await saveReferralLink(userId, param);
  
  return link;
}
```

---

## Quick Reference

```javascript
// Set commands
await bot.setMyCommands([
  { command: 'start', description: 'Start' },
  { command: 'help', description: 'Help' }
]);

// Set scoped commands
await bot.setMyCommands(commands, {
  scope: { type: 'all_private_chats' }
});

// Set localized commands
await bot.setMyCommands(commands, {
  language_code: 'es'
});

// Get commands
const cmds = await bot.getMyCommands();

// Delete commands
await bot.deleteMyCommands();

// Set menu button
await bot.setChatMenuButton({
  menu_button: { type: 'commands' }
});

// Deep link
const link = `https://t.me/BotName?start=param`;

// Handle start param
bot.onText(/\/start (.+)/, (msg, match) => {
  const param = match[1];
});
```


