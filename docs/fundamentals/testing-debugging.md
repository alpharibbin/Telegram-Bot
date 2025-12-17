# Testing & Debugging Bots

A complete guide to testing, debugging, and maintaining Telegram bots.

---

## 📖 Table of Contents

1. [Mocking Updates](#mocking-updates)
2. [Local Webhook Testing](#local-webhook-testing)
3. [Debug Logging](#debug-logging)
4. [Telegram Error Handling](#telegram-error-handling)
5. [Bot Crash Recovery](#bot-crash-recovery)
6. [Replay Updates](#replay-updates)

---

## Mocking Updates

Creating fake updates for testing without Telegram.

### Update Structure

```javascript
// Basic message update
const mockMessageUpdate = {
  update_id: 123456789,
  message: {
    message_id: 1,
    from: {
      id: 12345678,
      is_bot: false,
      first_name: 'Test',
      last_name: 'User',
      username: 'testuser',
      language_code: 'en'
    },
    chat: {
      id: 12345678,
      first_name: 'Test',
      last_name: 'User',
      username: 'testuser',
      type: 'private'
    },
    date: Math.floor(Date.now() / 1000),
    text: '/start'
  }
};
```

### Mock Update Factory

```javascript
class MockUpdateFactory {
  constructor() {
    this.updateId = 0;
    this.messageId = 0;
  }
  
  createUser(overrides = {}) {
    return {
      id: 12345678,
      is_bot: false,
      first_name: 'Test',
      last_name: 'User',
      username: 'testuser',
      language_code: 'en',
      ...overrides
    };
  }
  
  createChat(type = 'private', overrides = {}) {
    const base = {
      id: type === 'private' ? 12345678 : -1001234567890,
      type
    };
    
    if (type === 'private') {
      return { ...base, first_name: 'Test', username: 'testuser', ...overrides };
    }
    
    return { ...base, title: 'Test Group', ...overrides };
  }
  
  createMessage(text, overrides = {}) {
    return {
      update_id: ++this.updateId,
      message: {
        message_id: ++this.messageId,
        from: this.createUser(),
        chat: this.createChat(),
        date: Math.floor(Date.now() / 1000),
        text,
        ...overrides
      }
    };
  }
  
  createCommand(command, args = '') {
    const text = args ? `/${command} ${args}` : `/${command}`;
    return this.createMessage(text, {
      entities: [{
        type: 'bot_command',
        offset: 0,
        length: command.length + 1
      }]
    });
  }
  
  createCallbackQuery(data, messageOverrides = {}) {
    return {
      update_id: ++this.updateId,
      callback_query: {
        id: `query_${Date.now()}`,
        from: this.createUser(),
        message: {
          message_id: ++this.messageId,
          from: { id: 987654321, is_bot: true, first_name: 'Bot' },
          chat: this.createChat(),
          date: Math.floor(Date.now() / 1000),
          text: 'Original message',
          ...messageOverrides
        },
        chat_instance: '123456789',
        data
      }
    };
  }
  
  createPhoto(caption = '') {
    return {
      update_id: ++this.updateId,
      message: {
        message_id: ++this.messageId,
        from: this.createUser(),
        chat: this.createChat(),
        date: Math.floor(Date.now() / 1000),
        photo: [
          { file_id: 'small_id', file_unique_id: 'small', width: 90, height: 90 },
          { file_id: 'medium_id', file_unique_id: 'medium', width: 320, height: 320 },
          { file_id: 'large_id', file_unique_id: 'large', width: 800, height: 800 }
        ],
        caption
      }
    };
  }
  
  createGroupMessage(text, chatOverrides = {}) {
    const update = this.createMessage(text);
    update.message.chat = this.createChat('supergroup', chatOverrides);
    return update;
  }
}

// Usage
const factory = new MockUpdateFactory();

const startCommand = factory.createCommand('start');
const helpCommand = factory.createCommand('help');
const searchCommand = factory.createCommand('search', 'test query');
const callbackQuery = factory.createCallbackQuery('button_clicked');
const photoMessage = factory.createPhoto('Check this out!');
```

### Unit Testing Handlers

```javascript
const { jest } = require('@jest/globals');

// Mock bot instance
const mockBot = {
  sendMessage: jest.fn().mockResolvedValue({ message_id: 1 }),
  answerCallbackQuery: jest.fn().mockResolvedValue(true),
  editMessageText: jest.fn().mockResolvedValue(true)
};

// Handler to test
async function handleStart(bot, msg) {
  await bot.sendMessage(msg.chat.id, 'Welcome!');
}

// Test
describe('handleStart', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('should send welcome message', async () => {
    const factory = new MockUpdateFactory();
    const update = factory.createCommand('start');
    
    await handleStart(mockBot, update.message);
    
    expect(mockBot.sendMessage).toHaveBeenCalledWith(
      update.message.chat.id,
      'Welcome!'
    );
  });
});
```

### Integration Testing

```javascript
const express = require('express');
const request = require('supertest');

// Create test app
function createTestApp(webhookHandler) {
  const app = express();
  app.use(express.json());
  app.post('/webhook', webhookHandler);
  return app;
}

// Test
describe('Webhook Integration', () => {
  let app;
  
  beforeEach(() => {
    app = createTestApp(async (req, res) => {
      // Your webhook handler
      const update = req.body;
      if (update.message?.text === '/start') {
        // Handle start
      }
      res.sendStatus(200);
    });
  });
  
  it('should handle /start command', async () => {
    const factory = new MockUpdateFactory();
    const update = factory.createCommand('start');
    
    const response = await request(app)
      .post('/webhook')
      .send(update)
      .expect(200);
  });
  
  it('should handle callback query', async () => {
    const factory = new MockUpdateFactory();
    const update = factory.createCallbackQuery('action_1');
    
    await request(app)
      .post('/webhook')
      .send(update)
      .expect(200);
  });
});
```

---

## Local Webhook Testing

Testing webhooks on your local machine.

### Using ngrok

```bash
# Install ngrok
npm install -g ngrok

# Start your bot server
node server.js  # Runs on port 3000

# In another terminal, expose it
ngrok http 3000
```

```
ngrok output:
┌─────────────────────────────────────────────────────────────┐
│  Forwarding: https://abc123.ngrok.io -> http://localhost:3000│
└─────────────────────────────────────────────────────────────┘
```

```bash
# Set webhook to ngrok URL
curl "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://abc123.ngrok.io/webhook"
```

### Using localtunnel

```bash
# Install localtunnel
npm install -g localtunnel

# Expose local server
lt --port 3000 --subdomain mybot

# URL: https://mybot.loca.lt
```

### Local Webhook Server

```javascript
const express = require('express');
const app = express();

app.use(express.json());

// Log all incoming requests
app.use((req, res, next) => {
  console.log('📥 Incoming request:');
  console.log('  Method:', req.method);
  console.log('  Path:', req.path);
  console.log('  Body:', JSON.stringify(req.body, null, 2));
  next();
});

app.post('/webhook', (req, res) => {
  const update = req.body;
  
  console.log('📨 Update received:');
  console.log(JSON.stringify(update, null, 2));
  
  // Process update
  handleUpdate(update);
  
  res.sendStatus(200);
});

app.listen(3000, () => {
  console.log('🚀 Webhook server running on http://localhost:3000');
  console.log('📡 Expose with: ngrok http 3000');
});
```

### Webhook Simulator

```javascript
const axios = require('axios');

class WebhookSimulator {
  constructor(webhookUrl) {
    this.webhookUrl = webhookUrl;
    this.factory = new MockUpdateFactory();
  }
  
  async sendUpdate(update) {
    try {
      const response = await axios.post(this.webhookUrl, update);
      console.log('✅ Response:', response.status);
      return response;
    } catch (error) {
      console.error('❌ Error:', error.message);
      throw error;
    }
  }
  
  async simulateCommand(command, args = '') {
    const update = this.factory.createCommand(command, args);
    return this.sendUpdate(update);
  }
  
  async simulateMessage(text) {
    const update = this.factory.createMessage(text);
    return this.sendUpdate(update);
  }
  
  async simulateCallback(data) {
    const update = this.factory.createCallbackQuery(data);
    return this.sendUpdate(update);
  }
}

// Usage
const simulator = new WebhookSimulator('http://localhost:3000/webhook');

// Test commands
await simulator.simulateCommand('start');
await simulator.simulateCommand('help');
await simulator.simulateMessage('Hello bot!');
await simulator.simulateCallback('button_1');
```

### Test Script

```javascript
// test-webhook.js
const simulator = new WebhookSimulator('http://localhost:3000/webhook');

async function runTests() {
  console.log('🧪 Running webhook tests...\n');
  
  // Test 1: Start command
  console.log('Test 1: /start command');
  await simulator.simulateCommand('start');
  
  // Test 2: Help command
  console.log('\nTest 2: /help command');
  await simulator.simulateCommand('help');
  
  // Test 3: Regular message
  console.log('\nTest 3: Regular message');
  await simulator.simulateMessage('Hello!');
  
  // Test 4: Callback query
  console.log('\nTest 4: Callback query');
  await simulator.simulateCallback('action_test');
  
  console.log('\n✅ All tests completed');
}

runTests().catch(console.error);
```

---

## Debug Logging

Comprehensive logging for debugging.

### Structured Logging

```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'telegram-bot' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

// Usage
logger.info('Bot started', { token: '***' });
logger.debug('Processing update', { updateId: 123 });
logger.warn('Rate limit approaching', { userId: 456, count: 18 });
logger.error('Failed to send message', { error: err, chatId: 789 });
```

### Update Logging Middleware

```javascript
function logUpdate(update) {
  const logData = {
    updateId: update.update_id,
    type: getUpdateType(update),
    timestamp: new Date().toISOString()
  };
  
  if (update.message) {
    logData.chatId = update.message.chat.id;
    logData.userId = update.message.from.id;
    logData.username = update.message.from.username;
    logData.text = update.message.text?.slice(0, 100);
  }
  
  if (update.callback_query) {
    logData.callbackData = update.callback_query.data;
    logData.userId = update.callback_query.from.id;
  }
  
  logger.info('Update received', logData);
}

function getUpdateType(update) {
  if (update.message) return 'message';
  if (update.callback_query) return 'callback_query';
  if (update.inline_query) return 'inline_query';
  if (update.edited_message) return 'edited_message';
  return 'unknown';
}
```

### Request/Response Logging

```javascript
// Log all bot API calls
const originalRequest = bot._request.bind(bot);

bot._request = async function(method, params) {
  const startTime = Date.now();
  
  logger.debug('API Request', { method, params: sanitizeParams(params) });
  
  try {
    const result = await originalRequest(method, params);
    
    logger.debug('API Response', {
      method,
      duration: Date.now() - startTime,
      success: true
    });
    
    return result;
  } catch (error) {
    logger.error('API Error', {
      method,
      duration: Date.now() - startTime,
      error: error.message,
      code: error.response?.statusCode
    });
    throw error;
  }
};

function sanitizeParams(params) {
  const sanitized = { ...params };
  // Don't log file contents
  if (sanitized.photo) sanitized.photo = '[FILE]';
  if (sanitized.document) sanitized.document = '[FILE]';
  return sanitized;
}
```

### Debug Mode

```javascript
const DEBUG = process.env.DEBUG === 'true';

function debug(...args) {
  if (DEBUG) {
    console.log('[DEBUG]', new Date().toISOString(), ...args);
  }
}

// Usage
debug('Processing command:', command);
debug('User session:', session);
debug('API response:', response);
```

### Performance Logging

```javascript
class PerformanceLogger {
  constructor() {
    this.timers = new Map();
  }
  
  start(label) {
    this.timers.set(label, process.hrtime.bigint());
  }
  
  end(label) {
    const start = this.timers.get(label);
    if (!start) return;
    
    const duration = Number(process.hrtime.bigint() - start) / 1e6; // ms
    this.timers.delete(label);
    
    logger.debug('Performance', { label, duration: `${duration.toFixed(2)}ms` });
    
    if (duration > 1000) {
      logger.warn('Slow operation', { label, duration });
    }
    
    return duration;
  }
}

const perf = new PerformanceLogger();

// Usage
bot.on('message', async (msg) => {
  perf.start(`message_${msg.message_id}`);
  
  await handleMessage(msg);
  
  perf.end(`message_${msg.message_id}`);
});
```

---

## Telegram Error Handling

Handling Telegram API errors gracefully.

### Common Error Codes

| Code | Description | Action |
|------|-------------|--------|
| 400 | Bad Request | Check parameters |
| 401 | Unauthorized | Invalid token |
| 403 | Forbidden | Bot blocked/kicked |
| 404 | Not Found | Chat/message doesn't exist |
| 409 | Conflict | Webhook/polling conflict |
| 429 | Too Many Requests | Rate limited |
| 500+ | Server Error | Retry later |

### Error Handler

```javascript
class TelegramError extends Error {
  constructor(message, code, response) {
    super(message);
    this.name = 'TelegramError';
    this.code = code;
    this.response = response;
  }
}

async function handleTelegramError(error, context = {}) {
  const code = error.response?.statusCode || error.code;
  const description = error.response?.body?.description || error.message;
  
  switch (code) {
    case 400:
      logger.warn('Bad request', { description, ...context });
      // Usually a bug in our code
      break;
      
    case 401:
      logger.error('Invalid token!');
      // Critical - bot won't work
      process.exit(1);
      break;
      
    case 403:
      if (description.includes('bot was blocked')) {
        logger.info('Bot blocked by user', context);
        await markUserBlocked(context.userId);
      } else if (description.includes('bot was kicked')) {
        logger.info('Bot kicked from group', context);
        await markGroupLeft(context.chatId);
      }
      break;
      
    case 404:
      logger.warn('Not found', { description, ...context });
      break;
      
    case 409:
      logger.error('Conflict - another instance running?');
      break;
      
    case 429:
      const retryAfter = error.response?.body?.parameters?.retry_after || 30;
      logger.warn('Rate limited', { retryAfter, ...context });
      await sleep(retryAfter * 1000);
      break;
      
    default:
      if (code >= 500) {
        logger.error('Telegram server error', { code, description });
        // Retry with backoff
      } else {
        logger.error('Unknown error', { code, description, ...context });
      }
  }
}
```

### Retry with Backoff

```javascript
async function withRetry(fn, options = {}) {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 30000,
    shouldRetry = () => true
  } = options;
  
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries || !shouldRetry(error)) {
        throw error;
      }
      
      // Handle rate limiting
      if (error.response?.statusCode === 429) {
        const retryAfter = error.response.body?.parameters?.retry_after || 30;
        await sleep(retryAfter * 1000);
        continue;
      }
      
      // Exponential backoff
      const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
      logger.debug('Retrying', { attempt: attempt + 1, delay });
      await sleep(delay);
    }
  }
  
  throw lastError;
}

// Usage
await withRetry(() => bot.sendMessage(chatId, text), {
  maxRetries: 3,
  shouldRetry: (error) => {
    const code = error.response?.statusCode;
    return code >= 500 || code === 429;
  }
});
```

### Safe Send Functions

```javascript
async function safeSendMessage(chatId, text, options = {}) {
  try {
    return await bot.sendMessage(chatId, text, options);
  } catch (error) {
    await handleTelegramError(error, { chatId, action: 'sendMessage' });
    return null;
  }
}

async function safeSendPhoto(chatId, photo, options = {}) {
  try {
    return await bot.sendPhoto(chatId, photo, options);
  } catch (error) {
    await handleTelegramError(error, { chatId, action: 'sendPhoto' });
    return null;
  }
}

async function safeAnswerCallback(queryId, options = {}) {
  try {
    return await bot.answerCallbackQuery(queryId, options);
  } catch (error) {
    // Callback queries expire after 10 seconds
    if (error.response?.description?.includes('query is too old')) {
      logger.debug('Callback query expired');
      return null;
    }
    await handleTelegramError(error, { queryId, action: 'answerCallback' });
    return null;
  }
}
```

---

## Bot Crash Recovery

Handling crashes and ensuring reliability.

### Graceful Shutdown

```javascript
let isShuttingDown = false;

async function shutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  
  logger.info(`Received ${signal}, shutting down...`);
  
  // Stop accepting new updates
  if (bot.isPolling()) {
    await bot.stopPolling();
  }
  
  // Wait for pending operations
  await Promise.race([
    waitForPendingOperations(),
    sleep(10000) // Max 10 seconds
  ]);
  
  // Close connections
  await closeDatabase();
  await closeRedis();
  
  logger.info('Shutdown complete');
  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
```

### Uncaught Exception Handler

```javascript
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', { error: error.stack });
  
  // Attempt graceful shutdown
  shutdown('uncaughtException').catch(() => {
    process.exit(1);
  });
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection', { 
    reason: reason instanceof Error ? reason.stack : reason,
    promise 
  });
});
```

### Process Manager (PM2)

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'telegram-bot',
    script: 'src/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production'
    },
    error_file: 'logs/pm2-error.log',
    out_file: 'logs/pm2-out.log',
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};
```

```bash
# Start with PM2
pm2 start ecosystem.config.js

# Monitor
pm2 monit

# Restart on crash
pm2 startup
pm2 save
```

### Health Check Endpoint

```javascript
app.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  };
  
  // Check bot connection
  try {
    await bot.getMe();
    health.telegram = 'connected';
  } catch (error) {
    health.telegram = 'disconnected';
    health.status = 'degraded';
  }
  
  // Check database
  try {
    await db.ping();
    health.database = 'connected';
  } catch (error) {
    health.database = 'disconnected';
    health.status = 'degraded';
  }
  
  const statusCode = health.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(health);
});
```

### Auto-Recovery

```javascript
class BotManager {
  constructor(token) {
    this.token = token;
    this.bot = null;
    this.restartCount = 0;
    this.maxRestarts = 5;
  }
  
  async start() {
    try {
      this.bot = new TelegramBot(this.token, { polling: true });
      this.setupHandlers();
      this.setupErrorHandling();
      
      logger.info('Bot started successfully');
      this.restartCount = 0;
    } catch (error) {
      logger.error('Failed to start bot', { error });
      await this.handleStartFailure();
    }
  }
  
  setupErrorHandling() {
    this.bot.on('polling_error', async (error) => {
      logger.error('Polling error', { error: error.message });
      
      if (error.code === 'EFATAL') {
        await this.restart();
      }
    });
    
    this.bot.on('error', async (error) => {
      logger.error('Bot error', { error: error.message });
    });
  }
  
  async restart() {
    if (this.restartCount >= this.maxRestarts) {
      logger.error('Max restarts reached, giving up');
      process.exit(1);
    }
    
    this.restartCount++;
    logger.info(`Restarting bot (attempt ${this.restartCount})`);
    
    try {
      await this.bot.stopPolling();
    } catch (e) {}
    
    await sleep(5000 * this.restartCount);
    await this.start();
  }
  
  async handleStartFailure() {
    if (this.restartCount < this.maxRestarts) {
      await sleep(10000);
      this.restartCount++;
      await this.start();
    } else {
      process.exit(1);
    }
  }
}
```

---

## Replay Updates

Storing and replaying updates for debugging.

### Update Storage

```javascript
const fs = require('fs');
const path = require('path');

class UpdateRecorder {
  constructor(logDir = './update_logs') {
    this.logDir = logDir;
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }
  
  record(update) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `update_${timestamp}_${update.update_id}.json`;
    const filepath = path.join(this.logDir, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(update, null, 2));
    logger.debug('Update recorded', { filename });
  }
  
  getRecordedUpdates() {
    const files = fs.readdirSync(this.logDir)
      .filter(f => f.endsWith('.json'))
      .sort();
    
    return files.map(f => {
      const content = fs.readFileSync(path.join(this.logDir, f), 'utf8');
      return JSON.parse(content);
    });
  }
}

// Record all updates
const recorder = new UpdateRecorder();

app.post('/webhook', (req, res) => {
  if (process.env.RECORD_UPDATES === 'true') {
    recorder.record(req.body);
  }
  
  handleUpdate(req.body);
  res.sendStatus(200);
});
```

### Update Replay

```javascript
class UpdateReplayer {
  constructor(webhookUrl) {
    this.webhookUrl = webhookUrl;
    this.recorder = new UpdateRecorder();
  }
  
  async replayAll(options = {}) {
    const { delay = 100, filter = () => true } = options;
    
    const updates = this.recorder.getRecordedUpdates().filter(filter);
    
    logger.info(`Replaying ${updates.length} updates`);
    
    for (const update of updates) {
      await this.replayOne(update);
      await sleep(delay);
    }
    
    logger.info('Replay complete');
  }
  
  async replayOne(update) {
    try {
      await axios.post(this.webhookUrl, update);
      logger.debug('Replayed update', { updateId: update.update_id });
    } catch (error) {
      logger.error('Replay failed', { updateId: update.update_id, error });
    }
  }
  
  async replayFromUser(userId) {
    await this.replayAll({
      filter: (update) => {
        const from = update.message?.from || update.callback_query?.from;
        return from?.id === userId;
      }
    });
  }
  
  async replayCommands() {
    await this.replayAll({
      filter: (update) => update.message?.text?.startsWith('/')
    });
  }
}

// Usage
const replayer = new UpdateReplayer('http://localhost:3000/webhook');
await replayer.replayAll();
await replayer.replayFromUser(12345678);
await replayer.replayCommands();
```

### Debug Session Recording

```javascript
class DebugSession {
  constructor() {
    this.updates = [];
    this.responses = [];
    this.errors = [];
    this.startTime = Date.now();
  }
  
  recordUpdate(update) {
    this.updates.push({
      timestamp: Date.now(),
      update
    });
  }
  
  recordResponse(method, params, result) {
    this.responses.push({
      timestamp: Date.now(),
      method,
      params: sanitizeParams(params),
      result
    });
  }
  
  recordError(error, context) {
    this.errors.push({
      timestamp: Date.now(),
      error: error.message,
      stack: error.stack,
      context
    });
  }
  
  export() {
    return {
      duration: Date.now() - this.startTime,
      updates: this.updates,
      responses: this.responses,
      errors: this.errors
    };
  }
  
  save(filename) {
    fs.writeFileSync(filename, JSON.stringify(this.export(), null, 2));
  }
}

// Usage for debugging specific issues
const debugSession = new DebugSession();

// Record everything during debug
app.post('/webhook', (req, res) => {
  debugSession.recordUpdate(req.body);
  // ...
});

// Save session when done
process.on('SIGINT', () => {
  debugSession.save(`debug_session_${Date.now()}.json`);
  process.exit();
});
```

---

## Quick Reference

```javascript
// Mock update
const update = factory.createCommand('start');

// Local webhook testing
// ngrok http 3000 → set webhook to ngrok URL

// Logging
logger.info('Message', { data });
logger.error('Error', { error });

// Error handling
try {
  await bot.sendMessage(chatId, text);
} catch (error) {
  await handleTelegramError(error, { chatId });
}

// Retry with backoff
await withRetry(() => apiCall(), { maxRetries: 3 });

// Graceful shutdown
process.on('SIGTERM', shutdown);

// Health check
app.get('/health', healthCheckHandler);

// Record updates
recorder.record(update);

// Replay updates
await replayer.replayAll();
```


