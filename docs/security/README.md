# Bot Security

A complete guide to securing your Telegram bot.

---

## 📖 Table of Contents

1. [Token Protection](#token-protection)
2. [Webhook Secret Token](#webhook-secret-token)
3. [IP Filtering](#ip-filtering)
4. [Admin-Only Logic](#admin-only-logic)
5. [Rate Limiting](#rate-limiting)
6. [Abuse Prevention](#abuse-prevention)
7. [Anti-Spam Logic](#anti-spam-logic)

---

## Token Protection

Your bot token is the key to your bot. Protect it!

### Token Structure

```
123456789:ABCdefGHIjklMNOpqrsTUVwxyz1234567890
    │              │
    │              └── Secret key (alphanumeric)
    └── Bot ID (numeric)
```

### ❌ NEVER Do This

```javascript
// ❌ Hardcoded token
const bot = new TelegramBot('123456:ABC...');

// ❌ Token in public repository
// config.js (committed to git)
module.exports = {
  token: '123456:ABC...'
};

// ❌ Token in client-side code
// frontend.js
fetch(`https://api.telegram.org/bot123456:ABC.../sendMessage`);

// ❌ Token in logs
console.log('Bot started with token:', token);

// ❌ Token in error messages
throw new Error(`Failed with token ${token}`);
```

### ✅ Always Do This

```javascript
// ✅ Environment variables
const token = process.env.TELEGRAM_BOT_TOKEN;

// ✅ .env file (add to .gitignore!)
// .env
TELEGRAM_BOT_TOKEN=123456:ABC...

// ✅ Validate token exists
if (!process.env.TELEGRAM_BOT_TOKEN) {
  console.error('❌ TELEGRAM_BOT_TOKEN is required');
  process.exit(1);
}

// ✅ Secrets manager (production)
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const client = new SecretManagerServiceClient();
const [version] = await client.accessSecretVersion({
  name: 'projects/my-project/secrets/telegram-token/versions/latest'
});
const token = version.payload.data.toString();
```

### .gitignore Setup

```gitignore
# Environment files
.env
.env.local
.env.*.local

# Config files with secrets
config.local.js
secrets.json

# IDE
.idea/
.vscode/

# Logs
*.log
logs/
```

### Token Rotation

If your token is compromised:

```
1. Open @BotFather
2. Send /revoke
3. Select your bot
4. Get new token
5. Update all deployments IMMEDIATELY
6. Old token stops working instantly
```

```javascript
// Automate token rotation check
async function validateToken() {
  try {
    const me = await bot.getMe();
    console.log(`✅ Bot @${me.username} is running`);
    return true;
  } catch (error) {
    if (error.response?.statusCode === 401) {
      console.error('❌ Invalid token! Token may have been revoked.');
      // Alert admin
      await sendAlert('Bot token is invalid!');
      return false;
    }
    throw error;
  }
}
```

### Environment-Specific Tokens

```javascript
// Use different tokens for dev/staging/prod
const tokens = {
  development: process.env.DEV_BOT_TOKEN,
  staging: process.env.STAGING_BOT_TOKEN,
  production: process.env.PROD_BOT_TOKEN
};

const token = tokens[process.env.NODE_ENV] || tokens.development;
```

---

## Webhook Secret Token

Verify that webhook requests come from Telegram.

### Setting Up Secret Token

```javascript
const crypto = require('crypto');

// Generate a secure random token
const secretToken = crypto.randomBytes(32).toString('hex');
console.log('Secret token:', secretToken);
// Save this to environment variables
```

### Set Webhook with Secret

```bash
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
  -d "url=https://yourdomain.com/webhook" \
  -d "secret_token=your_secret_token_here"
```

```javascript
// Or via API
await bot.setWebHook(webhookUrl, {
  secret_token: process.env.WEBHOOK_SECRET
});
```

### Validate Secret Token

```javascript
const express = require('express');
const app = express();

app.use(express.json());

app.post('/webhook', (req, res) => {
  // Get secret token from header
  const secretToken = req.headers['x-telegram-bot-api-secret-token'];
  
  // Validate
  if (secretToken !== process.env.WEBHOOK_SECRET) {
    console.warn('⚠️ Invalid secret token from:', req.ip);
    return res.sendStatus(401);
  }
  
  // Process update
  const update = req.body;
  handleUpdate(update);
  
  res.sendStatus(200);
});
```

### Complete Webhook Security

```javascript
const express = require('express');
const app = express();

// Middleware for webhook validation
function validateWebhook(req, res, next) {
  // 1. Check secret token
  const secretToken = req.headers['x-telegram-bot-api-secret-token'];
  if (secretToken !== process.env.WEBHOOK_SECRET) {
    console.warn(`⚠️ Invalid secret token from ${req.ip}`);
    return res.sendStatus(401);
  }
  
  // 2. Check content type
  if (req.headers['content-type'] !== 'application/json') {
    console.warn(`⚠️ Invalid content type from ${req.ip}`);
    return res.sendStatus(400);
  }
  
  // 3. Check body exists
  if (!req.body || !req.body.update_id) {
    console.warn(`⚠️ Invalid body from ${req.ip}`);
    return res.sendStatus(400);
  }
  
  next();
}

app.use(express.json());
app.post('/webhook', validateWebhook, (req, res) => {
  handleUpdate(req.body);
  res.sendStatus(200);
});
```

---

## IP Filtering

Only accept requests from Telegram's IP ranges.

### Telegram IP Ranges

```
149.154.160.0/20
91.108.4.0/22
```

### IP Validation Middleware

```javascript
const ipRangeCheck = require('ip-range-check');

const TELEGRAM_IP_RANGES = [
  '149.154.160.0/20',
  '91.108.4.0/22'
];

function validateTelegramIP(req, res, next) {
  // Get client IP (handle proxies)
  const clientIP = req.headers['x-forwarded-for']?.split(',')[0]?.trim() 
    || req.connection.remoteAddress
    || req.ip;
  
  // Remove IPv6 prefix if present
  const ip = clientIP.replace(/^::ffff:/, '');
  
  if (!ipRangeCheck(ip, TELEGRAM_IP_RANGES)) {
    console.warn(`⚠️ Request from non-Telegram IP: ${ip}`);
    return res.sendStatus(403);
  }
  
  next();
}

app.post('/webhook', validateTelegramIP, validateWebhook, (req, res) => {
  handleUpdate(req.body);
  res.sendStatus(200);
});
```

### Manual IP Check

```javascript
function isValidIP(ip) {
  // 149.154.160.0/20 = 149.154.160.0 - 149.154.175.255
  // 91.108.4.0/22 = 91.108.4.0 - 91.108.7.255
  
  const parts = ip.split('.').map(Number);
  
  // Check 149.154.160.0/20
  if (parts[0] === 149 && parts[1] === 154 && parts[2] >= 160 && parts[2] <= 175) {
    return true;
  }
  
  // Check 91.108.4.0/22
  if (parts[0] === 91 && parts[1] === 108 && parts[2] >= 4 && parts[2] <= 7) {
    return true;
  }
  
  return false;
}
```

### Cloud Platform Considerations

```javascript
// On Vercel/Cloudflare/etc., use their headers
function getClientIP(req) {
  return (
    req.headers['cf-connecting-ip'] ||           // Cloudflare
    req.headers['x-real-ip'] ||                  // Nginx
    req.headers['x-forwarded-for']?.split(',')[0] || // Standard proxy
    req.connection.remoteAddress
  );
}
```

---

## Admin-Only Logic

Restricting commands to administrators.

### Define Admin Users

```javascript
// From environment
const ADMIN_IDS = process.env.ADMIN_IDS?.split(',').map(Number) || [];

// Or hardcoded (less flexible)
const ADMIN_IDS = [123456789, 987654321];
```

### Admin Check Function

```javascript
function isAdmin(userId) {
  return ADMIN_IDS.includes(userId);
}

// With database
async function isAdminDB(userId) {
  const user = await db.users.findOne({ id: userId });
  return user?.role === 'admin';
}
```

### Admin-Only Middleware

```javascript
function adminOnly(handler) {
  return async (msg, ...args) => {
    if (!isAdmin(msg.from.id)) {
      await bot.sendMessage(msg.chat.id, '⛔ This command is admin-only');
      console.warn(`⚠️ Unauthorized admin command from ${msg.from.id}`);
      return;
    }
    return handler(msg, ...args);
  };
}

// Usage
bot.onText(/\/broadcast (.+)/, adminOnly(async (msg, match) => {
  const message = match[1];
  await broadcastToAll(message);
  await bot.sendMessage(msg.chat.id, '✅ Broadcast sent');
}));

bot.onText(/\/stats/, adminOnly(async (msg) => {
  const stats = await getStats();
  await bot.sendMessage(msg.chat.id, `Users: ${stats.users}\nMessages: ${stats.messages}`);
}));
```

### Group Admin Check

```javascript
async function isGroupAdmin(chatId, userId) {
  try {
    const member = await bot.getChatMember(chatId, userId);
    return ['administrator', 'creator'].includes(member.status);
  } catch {
    return false;
  }
}

// Middleware for group admin commands
function groupAdminOnly(handler) {
  return async (msg, ...args) => {
    if (msg.chat.type === 'private') {
      return handler(msg, ...args);
    }
    
    if (!await isGroupAdmin(msg.chat.id, msg.from.id)) {
      await bot.sendMessage(msg.chat.id, '⛔ Admin only');
      return;
    }
    
    return handler(msg, ...args);
  };
}
```

### Role-Based Access

```javascript
const ROLES = {
  USER: 0,
  MODERATOR: 1,
  ADMIN: 2,
  SUPERADMIN: 3
};

const userRoles = new Map([
  [123456789, ROLES.SUPERADMIN],
  [987654321, ROLES.ADMIN],
  [111222333, ROLES.MODERATOR]
]);

function getUserRole(userId) {
  return userRoles.get(userId) || ROLES.USER;
}

function requireRole(minRole) {
  return (handler) => async (msg, ...args) => {
    const userRole = getUserRole(msg.from.id);
    
    if (userRole < minRole) {
      await bot.sendMessage(msg.chat.id, '⛔ Insufficient permissions');
      return;
    }
    
    return handler(msg, ...args);
  };
}

// Usage
bot.onText(/\/ban/, requireRole(ROLES.MODERATOR)(handleBan));
bot.onText(/\/broadcast/, requireRole(ROLES.ADMIN)(handleBroadcast));
bot.onText(/\/shutdown/, requireRole(ROLES.SUPERADMIN)(handleShutdown));
```

---

## Rate Limiting

Prevent abuse by limiting request frequency.

### Simple In-Memory Rate Limiter

```javascript
const rateLimits = new Map();

function rateLimit(userId, limit = 10, window = 60000) {
  const now = Date.now();
  const key = `${userId}`;
  
  if (!rateLimits.has(key)) {
    rateLimits.set(key, []);
  }
  
  const timestamps = rateLimits.get(key);
  
  // Remove old timestamps
  const validTimestamps = timestamps.filter(t => now - t < window);
  rateLimits.set(key, validTimestamps);
  
  // Check limit
  if (validTimestamps.length >= limit) {
    return false; // Rate limited
  }
  
  // Add current timestamp
  validTimestamps.push(now);
  return true; // Allowed
}

// Usage
bot.on('message', async (msg) => {
  if (!rateLimit(msg.from.id, 20, 60000)) { // 20 messages per minute
    await bot.sendMessage(msg.chat.id, '⚠️ Too many messages. Please slow down.');
    return;
  }
  
  // Process message
});
```

### Command-Specific Rate Limiting

```javascript
const commandLimits = {
  search: { limit: 5, window: 60000 },    // 5 per minute
  generate: { limit: 3, window: 300000 }, // 3 per 5 minutes
  export: { limit: 1, window: 3600000 }   // 1 per hour
};

function rateLimitCommand(userId, command) {
  const config = commandLimits[command] || { limit: 10, window: 60000 };
  return rateLimit(`${userId}:${command}`, config.limit, config.window);
}

bot.onText(/\/search (.+)/, async (msg, match) => {
  if (!rateLimitCommand(msg.from.id, 'search')) {
    await bot.sendMessage(msg.chat.id, '⚠️ Search limit reached. Try again later.');
    return;
  }
  
  // Process search
});
```

### Redis Rate Limiter (Production)

```javascript
const Redis = require('ioredis');
const redis = new Redis();

async function rateLimitRedis(key, limit, windowSec) {
  const current = await redis.incr(key);
  
  if (current === 1) {
    await redis.expire(key, windowSec);
  }
  
  return current <= limit;
}

// Usage
bot.on('message', async (msg) => {
  const key = `ratelimit:${msg.from.id}`;
  const allowed = await rateLimitRedis(key, 20, 60);
  
  if (!allowed) {
    await bot.sendMessage(msg.chat.id, '⚠️ Rate limited');
    return;
  }
  
  // Process message
});
```

### Sliding Window Rate Limiter

```javascript
async function slidingWindowLimit(userId, limit, windowMs) {
  const now = Date.now();
  const key = `ratelimit:${userId}`;
  
  // Remove old entries
  await redis.zremrangebyscore(key, 0, now - windowMs);
  
  // Count current entries
  const count = await redis.zcard(key);
  
  if (count >= limit) {
    return false;
  }
  
  // Add new entry
  await redis.zadd(key, now, `${now}-${Math.random()}`);
  await redis.expire(key, Math.ceil(windowMs / 1000));
  
  return true;
}
```

---

## Abuse Prevention

Protecting your bot from various attacks.

### Flood Protection

```javascript
const floodProtection = new Map();

function checkFlood(userId) {
  const now = Date.now();
  const data = floodProtection.get(userId) || { count: 0, firstMsg: now };
  
  // Reset if window passed
  if (now - data.firstMsg > 10000) {
    data.count = 1;
    data.firstMsg = now;
  } else {
    data.count++;
  }
  
  floodProtection.set(userId, data);
  
  // More than 10 messages in 10 seconds = flood
  return data.count > 10;
}

bot.on('message', async (msg) => {
  if (checkFlood(msg.from.id)) {
    // Ignore flooder
    console.warn(`⚠️ Flood detected from ${msg.from.id}`);
    return;
  }
  
  // Process message
});
```

### Ban System

```javascript
const bannedUsers = new Set();

async function banUser(userId, reason, duration = null) {
  bannedUsers.add(userId);
  
  // Store in database
  await db.bans.insert({
    userId,
    reason,
    bannedAt: new Date(),
    expiresAt: duration ? new Date(Date.now() + duration) : null
  });
  
  console.log(`🔨 Banned user ${userId}: ${reason}`);
}

async function unbanUser(userId) {
  bannedUsers.delete(userId);
  await db.bans.delete({ userId });
}

async function isBanned(userId) {
  if (bannedUsers.has(userId)) {
    return true;
  }
  
  const ban = await db.bans.findOne({ userId });
  if (ban) {
    if (ban.expiresAt && ban.expiresAt < new Date()) {
      await unbanUser(userId);
      return false;
    }
    bannedUsers.add(userId);
    return true;
  }
  
  return false;
}

// Middleware
bot.on('message', async (msg) => {
  if (await isBanned(msg.from.id)) {
    // Silently ignore banned users
    return;
  }
  
  // Process message
});
```

### Auto-Ban on Abuse

```javascript
const warnings = new Map();
const MAX_WARNINGS = 3;

async function warnUser(userId, reason) {
  const count = (warnings.get(userId) || 0) + 1;
  warnings.set(userId, count);
  
  if (count >= MAX_WARNINGS) {
    await banUser(userId, `Auto-ban: ${MAX_WARNINGS} warnings`);
    warnings.delete(userId);
    return { banned: true, warnings: count };
  }
  
  return { banned: false, warnings: count };
}

bot.on('message', async (msg) => {
  // Check for abuse patterns
  if (containsAbusiveContent(msg.text)) {
    const result = await warnUser(msg.from.id, 'Abusive content');
    
    if (result.banned) {
      await bot.sendMessage(msg.chat.id, '🔨 You have been banned for abuse.');
    } else {
      await bot.sendMessage(msg.chat.id, 
        `⚠️ Warning ${result.warnings}/${MAX_WARNINGS}. Stop abusive behavior.`
      );
    }
    return;
  }
});
```

### Input Validation

```javascript
function sanitizeInput(text) {
  if (!text || typeof text !== 'string') {
    return '';
  }
  
  // Remove control characters
  text = text.replace(/[\x00-\x1F\x7F]/g, '');
  
  // Limit length
  text = text.slice(0, 4096);
  
  return text.trim();
}

function validateCommand(text) {
  // Check for command injection
  const dangerous = ['eval', 'exec', 'spawn', 'require', 'import'];
  const lower = text.toLowerCase();
  
  for (const word of dangerous) {
    if (lower.includes(word)) {
      return false;
    }
  }
  
  return true;
}

bot.on('message', async (msg) => {
  const text = sanitizeInput(msg.text);
  
  if (!validateCommand(text)) {
    console.warn(`⚠️ Suspicious input from ${msg.from.id}: ${text}`);
    return;
  }
  
  // Process message
});
```

---

## Anti-Spam Logic

Detecting and preventing spam.

### Spam Detection Patterns

```javascript
const spamPatterns = [
  // URLs
  /https?:\/\/[^\s]+/gi,
  // Telegram links
  /t\.me\/[^\s]+/gi,
  // Phone numbers
  /\+?\d{10,}/g,
  // Crypto addresses
  /[13][a-km-zA-HJ-NP-Z1-9]{25,34}/g, // Bitcoin
  /0x[a-fA-F0-9]{40}/g, // Ethereum
  // Spam keywords
  /free money|earn \$|click here|buy now|limited offer/gi,
  // Excessive caps
  /[A-Z]{10,}/g,
  // Repeated characters
  /(.)\1{5,}/g
];

function calculateSpamScore(text) {
  let score = 0;
  
  for (const pattern of spamPatterns) {
    const matches = text.match(pattern);
    if (matches) {
      score += matches.length * 10;
    }
  }
  
  // Check message length
  if (text.length > 1000) score += 20;
  
  // Check for many newlines
  const newlines = (text.match(/\n/g) || []).length;
  if (newlines > 10) score += newlines;
  
  return score;
}

function isSpam(text) {
  return calculateSpamScore(text) > 50;
}
```

### Duplicate Message Detection

```javascript
const recentMessages = new Map();
const DUPLICATE_WINDOW = 60000; // 1 minute

function isDuplicate(userId, text) {
  const key = `${userId}:${text}`;
  const hash = require('crypto').createHash('md5').update(key).digest('hex');
  
  if (recentMessages.has(hash)) {
    return true;
  }
  
  recentMessages.set(hash, Date.now());
  
  // Cleanup old entries
  setTimeout(() => recentMessages.delete(hash), DUPLICATE_WINDOW);
  
  return false;
}

bot.on('message', async (msg) => {
  if (isDuplicate(msg.from.id, msg.text)) {
    console.warn(`⚠️ Duplicate message from ${msg.from.id}`);
    return; // Ignore duplicate
  }
  
  // Process message
});
```

### New User Restrictions

```javascript
const newUsers = new Map();
const NEW_USER_PERIOD = 24 * 60 * 60 * 1000; // 24 hours

async function isNewUser(userId) {
  if (newUsers.has(userId)) {
    return newUsers.get(userId) > Date.now();
  }
  
  const user = await db.users.findOne({ id: userId });
  if (!user) {
    // First time user
    await db.users.insert({ id: userId, createdAt: new Date() });
    newUsers.set(userId, Date.now() + NEW_USER_PERIOD);
    return true;
  }
  
  const isNew = Date.now() - user.createdAt.getTime() < NEW_USER_PERIOD;
  if (isNew) {
    newUsers.set(userId, user.createdAt.getTime() + NEW_USER_PERIOD);
  }
  
  return isNew;
}

bot.on('message', async (msg) => {
  const isNew = await isNewUser(msg.from.id);
  
  if (isNew) {
    // Apply stricter rules for new users
    if (msg.text?.includes('http') || msg.text?.includes('t.me')) {
      await bot.sendMessage(msg.chat.id, 
        '⚠️ New users cannot send links. Please wait 24 hours.'
      );
      return;
    }
  }
  
  // Process message
});
```

### Complete Anti-Spam System

```javascript
class AntiSpam {
  constructor() {
    this.userScores = new Map();
    this.recentMessages = new Map();
  }
  
  async check(msg) {
    const userId = msg.from.id;
    const text = msg.text || '';
    
    // 1. Check if banned
    if (await isBanned(userId)) {
      return { blocked: true, reason: 'banned' };
    }
    
    // 2. Rate limit
    if (!rateLimit(userId, 20, 60000)) {
      return { blocked: true, reason: 'rate_limited' };
    }
    
    // 3. Duplicate check
    if (this.isDuplicate(userId, text)) {
      return { blocked: true, reason: 'duplicate' };
    }
    
    // 4. Spam score
    const spamScore = calculateSpamScore(text);
    this.updateUserScore(userId, spamScore);
    
    if (spamScore > 50) {
      return { blocked: true, reason: 'spam_detected', score: spamScore };
    }
    
    // 5. Check cumulative score
    if (this.getUserScore(userId) > 200) {
      await banUser(userId, 'Cumulative spam score exceeded');
      return { blocked: true, reason: 'auto_banned' };
    }
    
    return { blocked: false };
  }
  
  isDuplicate(userId, text) {
    const key = `${userId}:${text}`;
    if (this.recentMessages.has(key)) return true;
    this.recentMessages.set(key, Date.now());
    setTimeout(() => this.recentMessages.delete(key), 60000);
    return false;
  }
  
  updateUserScore(userId, score) {
    const current = this.userScores.get(userId) || 0;
    this.userScores.set(userId, current + score);
    
    // Decay score over time
    setTimeout(() => {
      const s = this.userScores.get(userId) || 0;
      this.userScores.set(userId, Math.max(0, s - score));
    }, 300000); // 5 minutes
  }
  
  getUserScore(userId) {
    return this.userScores.get(userId) || 0;
  }
}

const antiSpam = new AntiSpam();

bot.on('message', async (msg) => {
  const result = await antiSpam.check(msg);
  
  if (result.blocked) {
    console.warn(`⚠️ Blocked ${msg.from.id}: ${result.reason}`);
    return;
  }
  
  // Process message
});
```

---

## Quick Reference

```javascript
// Environment variables
const token = process.env.TELEGRAM_BOT_TOKEN;

// Webhook secret
await bot.setWebHook(url, { secret_token: process.env.WEBHOOK_SECRET });

// Validate webhook
if (req.headers['x-telegram-bot-api-secret-token'] !== secret) {
  return res.sendStatus(401);
}

// Admin check
const isAdmin = ADMIN_IDS.includes(userId);

// Rate limit
if (!rateLimit(userId, 20, 60000)) {
  return; // Rate limited
}

// Ban user
bannedUsers.add(userId);

// Spam check
if (calculateSpamScore(text) > 50) {
  return; // Spam detected
}
```
