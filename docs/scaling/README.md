# Deployment & Scaling Bots

A complete guide to deploying and scaling Telegram bots for production.

---

## 📖 Table of Contents

1. [Stateless Bots](#stateless-bots)
2. [Horizontal Scaling](#horizontal-scaling)
3. [Queue-Based Update Processing](#queue-based-update-processing)
4. [Background Jobs](#background-jobs)
5. [Flood Wait Handling](#flood-wait-handling)
6. [Retry Strategies](#retry-strategies)
7. [High Availability Bot](#high-availability-bot)

---

## Stateless Bots

Designing bots that don't rely on local state.

### Why Stateless?

```
┌─────────────────────────────────────────────────────────────┐
│  STATEFUL BOT (Problems)                                     │
│                                                              │
│  Instance 1: user_sessions = { user123: { step: 2 } }       │
│  Instance 2: user_sessions = { }  ← User routed here = FAIL │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│  STATELESS BOT (Solution)                                    │
│                                                              │
│  Instance 1: reads from Redis/DB                            │
│  Instance 2: reads from Redis/DB  ← Same data = SUCCESS     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Externalize State

```javascript
// ❌ Stateful - state in memory
const sessions = new Map();

bot.on('message', (msg) => {
  const session = sessions.get(msg.from.id) || {};
  // Process with local session
  sessions.set(msg.from.id, session);
});

// ✅ Stateless - state in Redis
const Redis = require('ioredis');
const redis = new Redis(process.env.REDIS_URL);

bot.on('message', async (msg) => {
  const sessionKey = `session:${msg.from.id}`;
  const session = JSON.parse(await redis.get(sessionKey) || '{}');
  
  // Process with external session
  
  await redis.setex(sessionKey, 3600, JSON.stringify(session));
});
```

### Stateless Callback Data

```javascript
// ❌ Stateful - requires server memory
const pendingActions = new Map();
const actionId = uuid();
pendingActions.set(actionId, { userId, productId });

// Button: callback_data = actionId (requires lookup)

// ✅ Stateless - all data in callback
const callbackData = JSON.stringify({ a: 'buy', p: productId });

// Button: callback_data = callbackData (self-contained)

bot.on('callback_query', (query) => {
  const data = JSON.parse(query.data);
  // data.a = action, data.p = productId
  // No server lookup needed!
});
```

### Stateless Session Manager

```javascript
class StatelessSessionManager {
  constructor(redis) {
    this.redis = redis;
    this.ttl = 3600; // 1 hour
  }
  
  async get(userId) {
    const data = await this.redis.get(`session:${userId}`);
    return data ? JSON.parse(data) : { state: 'idle', data: {} };
  }
  
  async set(userId, session) {
    await this.redis.setex(
      `session:${userId}`,
      this.ttl,
      JSON.stringify(session)
    );
  }
  
  async update(userId, updates) {
    const session = await this.get(userId);
    Object.assign(session, updates);
    await this.set(userId, session);
    return session;
  }
  
  async delete(userId) {
    await this.redis.del(`session:${userId}`);
  }
}

const sessions = new StatelessSessionManager(redis);

// Usage
bot.on('message', async (msg) => {
  const session = await sessions.get(msg.from.id);
  // Process...
  await sessions.set(msg.from.id, session);
});
```

---

## Horizontal Scaling

Running multiple bot instances.

### Architecture

```
                    ┌─────────────────┐
                    │   Telegram      │
                    │   Servers       │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  Load Balancer  │
                    │  (nginx/ALB)    │
                    └────────┬────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
┌────────▼────────┐ ┌────────▼────────┐ ┌────────▼────────┐
│   Bot Instance  │ │   Bot Instance  │ │   Bot Instance  │
│       #1        │ │       #2        │ │       #3        │
└────────┬────────┘ └────────┬────────┘ └────────┬────────┘
         │                   │                   │
         └───────────────────┼───────────────────┘
                             │
                    ┌────────▼────────┐
                    │  Redis/Database │
                    │  (Shared State) │
                    └─────────────────┘
```

### Load Balancer Configuration (nginx)

```nginx
upstream telegram_bot {
    least_conn;
    server bot1:3000;
    server bot2:3000;
    server bot3:3000;
}

server {
    listen 443 ssl;
    server_name bot.example.com;
    
    ssl_certificate /etc/ssl/cert.pem;
    ssl_certificate_key /etc/ssl/key.pem;
    
    location /webhook {
        proxy_pass http://telegram_bot;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 60s;
    }
}
```

### Docker Compose for Multiple Instances

```yaml
# docker-compose.yml
version: '3.8'

services:
  bot:
    build: .
    deploy:
      replicas: 3
    environment:
      - TELEGRAM_BOT_TOKEN=${BOT_TOKEN}
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis
    
  redis:
    image: redis:alpine
    volumes:
      - redis_data:/data
    
  nginx:
    image: nginx:alpine
    ports:
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./certs:/etc/ssl
    depends_on:
      - bot

volumes:
  redis_data:
```

### Kubernetes Deployment

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: telegram-bot
spec:
  replicas: 3
  selector:
    matchLabels:
      app: telegram-bot
  template:
    metadata:
      labels:
        app: telegram-bot
    spec:
      containers:
      - name: bot
        image: your-registry/telegram-bot:latest
        ports:
        - containerPort: 3000
        env:
        - name: TELEGRAM_BOT_TOKEN
          valueFrom:
            secretKeyRef:
              name: bot-secrets
              key: token
        - name: REDIS_URL
          value: redis://redis-service:6379
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 30
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 10
---
apiVersion: v1
kind: Service
metadata:
  name: telegram-bot
spec:
  selector:
    app: telegram-bot
  ports:
  - port: 80
    targetPort: 3000
  type: ClusterIP
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: telegram-bot-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: telegram-bot
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

---

## Queue-Based Update Processing

Using message queues for reliable processing.

### Why Queues?

```
Without Queue:
┌──────────┐     ┌──────────┐
│ Telegram │────▶│   Bot    │  ← If bot is slow, updates pile up
└──────────┘     └──────────┘    Telegram may stop sending

With Queue:
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│ Telegram │────▶│ Receiver │────▶│  Queue   │────▶│ Workers  │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
                 (fast ack)       (buffer)         (process)
```

### Bull Queue Implementation

```javascript
const Queue = require('bull');
const Redis = require('ioredis');

// Create queue
const updateQueue = new Queue('telegram-updates', {
  redis: process.env.REDIS_URL,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000
    },
    removeOnComplete: 100,
    removeOnFail: 1000
  }
});

// Webhook receiver - just enqueue
app.post('/webhook', async (req, res) => {
  const update = req.body;
  
  // Add to queue immediately
  await updateQueue.add('update', update, {
    priority: getPriority(update),
    jobId: `update_${update.update_id}`
  });
  
  // Respond quickly
  res.sendStatus(200);
});

function getPriority(update) {
  // Lower number = higher priority
  if (update.callback_query) return 1; // Callbacks first
  if (update.message?.text?.startsWith('/')) return 2; // Commands
  return 3; // Regular messages
}

// Worker - process updates
updateQueue.process('update', 5, async (job) => {
  const update = job.data;
  
  try {
    await processUpdate(update);
    return { success: true };
  } catch (error) {
    logger.error('Processing failed', { updateId: update.update_id, error });
    throw error; // Will retry
  }
});

// Monitor queue
updateQueue.on('completed', (job) => {
  logger.debug('Job completed', { jobId: job.id });
});

updateQueue.on('failed', (job, error) => {
  logger.error('Job failed', { jobId: job.id, error: error.message });
});
```

### RabbitMQ Implementation

```javascript
const amqp = require('amqplib');

class MessageQueue {
  async connect() {
    this.connection = await amqp.connect(process.env.RABBITMQ_URL);
    this.channel = await this.connection.createChannel();
    
    await this.channel.assertQueue('telegram_updates', {
      durable: true,
      arguments: {
        'x-message-ttl': 300000 // 5 minutes
      }
    });
  }
  
  async publish(update) {
    this.channel.sendToQueue(
      'telegram_updates',
      Buffer.from(JSON.stringify(update)),
      { persistent: true }
    );
  }
  
  async consume(handler) {
    this.channel.prefetch(10);
    
    this.channel.consume('telegram_updates', async (msg) => {
      const update = JSON.parse(msg.content.toString());
      
      try {
        await handler(update);
        this.channel.ack(msg);
      } catch (error) {
        // Requeue on failure
        this.channel.nack(msg, false, true);
      }
    });
  }
}

// Receiver
const queue = new MessageQueue();
await queue.connect();

app.post('/webhook', async (req, res) => {
  await queue.publish(req.body);
  res.sendStatus(200);
});

// Worker
await queue.consume(async (update) => {
  await processUpdate(update);
});
```

### AWS SQS Implementation

```javascript
const { SQSClient, SendMessageCommand, ReceiveMessageCommand, DeleteMessageCommand } = require('@aws-sdk/client-sqs');

const sqs = new SQSClient({ region: 'us-east-1' });
const QUEUE_URL = process.env.SQS_QUEUE_URL;

// Enqueue
async function enqueue(update) {
  await sqs.send(new SendMessageCommand({
    QueueUrl: QUEUE_URL,
    MessageBody: JSON.stringify(update),
    MessageDeduplicationId: `update_${update.update_id}`,
    MessageGroupId: 'telegram'
  }));
}

// Worker
async function worker() {
  while (true) {
    const response = await sqs.send(new ReceiveMessageCommand({
      QueueUrl: QUEUE_URL,
      MaxNumberOfMessages: 10,
      WaitTimeSeconds: 20
    }));
    
    for (const message of response.Messages || []) {
      try {
        const update = JSON.parse(message.Body);
        await processUpdate(update);
        
        await sqs.send(new DeleteMessageCommand({
          QueueUrl: QUEUE_URL,
          ReceiptHandle: message.ReceiptHandle
        }));
      } catch (error) {
        logger.error('Processing failed', { error });
      }
    }
  }
}
```

---

## Background Jobs

Running tasks outside the request cycle.

### Job Types

```javascript
// Immediate jobs (after webhook response)
setImmediate(() => {
  trackAnalytics(update);
});

// Delayed jobs
setTimeout(() => {
  sendReminder(userId);
}, 3600000); // 1 hour

// Scheduled jobs (cron)
schedule.scheduleJob('0 9 * * *', () => {
  sendDailyDigest();
});

// Queue jobs
await jobQueue.add('send-email', { userId, template: 'welcome' });
```

### Bull Queue for Background Jobs

```javascript
const Queue = require('bull');

// Different queues for different job types
const emailQueue = new Queue('emails');
const analyticsQueue = new Queue('analytics');
const notificationQueue = new Queue('notifications');

// Add jobs
async function scheduleWelcomeEmail(userId) {
  await emailQueue.add('welcome', { userId }, {
    delay: 60000 // 1 minute delay
  });
}

async function scheduleReminder(userId, reminderTime) {
  await notificationQueue.add('reminder', { userId }, {
    delay: reminderTime - Date.now()
  });
}

// Recurring jobs
await analyticsQueue.add('daily-report', {}, {
  repeat: { cron: '0 9 * * *' }
});

// Process jobs
emailQueue.process('welcome', async (job) => {
  const { userId } = job.data;
  await sendWelcomeEmail(userId);
});

notificationQueue.process('reminder', async (job) => {
  const { userId } = job.data;
  await bot.sendMessage(userId, '⏰ Reminder!');
});

analyticsQueue.process('daily-report', async () => {
  const report = await generateReport();
  await sendToAdmins(report);
});
```

### Agenda for MongoDB-Based Jobs

```javascript
const Agenda = require('agenda');

const agenda = new Agenda({
  db: { address: process.env.MONGODB_URL },
  processEvery: '30 seconds'
});

// Define jobs
agenda.define('send notification', async (job) => {
  const { userId, message } = job.attrs.data;
  await bot.sendMessage(userId, message);
});

agenda.define('cleanup old sessions', async () => {
  await db.sessions.deleteMany({
    lastActivity: { $lt: new Date(Date.now() - 86400000) }
  });
});

// Schedule jobs
await agenda.start();

// One-time job
await agenda.schedule('in 1 hour', 'send notification', {
  userId: 123,
  message: 'Reminder!'
});

// Recurring job
await agenda.every('1 day', 'cleanup old sessions');

// Cancel job
await agenda.cancel({ name: 'send notification', 'data.userId': 123 });
```

### Broadcast System

```javascript
class BroadcastManager {
  constructor(queue) {
    this.queue = queue;
  }
  
  async startBroadcast(message, userIds) {
    const broadcastId = uuid();
    
    // Create broadcast record
    await db.broadcasts.insert({
      id: broadcastId,
      message,
      totalUsers: userIds.length,
      sent: 0,
      failed: 0,
      status: 'running',
      startedAt: new Date()
    });
    
    // Queue all messages
    for (const userId of userIds) {
      await this.queue.add('broadcast-message', {
        broadcastId,
        userId,
        message
      }, {
        attempts: 2,
        backoff: 5000
      });
    }
    
    return broadcastId;
  }
}

// Process broadcast messages
broadcastQueue.process('broadcast-message', 10, async (job) => {
  const { broadcastId, userId, message } = job.data;
  
  try {
    await bot.sendMessage(userId, message);
    await db.broadcasts.updateOne(
      { id: broadcastId },
      { $inc: { sent: 1 } }
    );
  } catch (error) {
    if (error.response?.statusCode === 403) {
      // User blocked bot
      await markUserBlocked(userId);
    }
    await db.broadcasts.updateOne(
      { id: broadcastId },
      { $inc: { failed: 1 } }
    );
    throw error;
  }
});
```

---

## Flood Wait Handling

Dealing with Telegram's rate limits.

### Rate Limit Response

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

### Automatic Flood Wait Handler

```javascript
class FloodWaitHandler {
  constructor() {
    this.waitUntil = new Map();
  }
  
  async execute(chatId, fn) {
    // Check if we're in a wait period
    const waitUntil = this.waitUntil.get(chatId);
    if (waitUntil && Date.now() < waitUntil) {
      const waitTime = waitUntil - Date.now();
      await sleep(waitTime);
    }
    
    try {
      return await fn();
    } catch (error) {
      if (error.response?.statusCode === 429) {
        const retryAfter = error.response.body?.parameters?.retry_after || 30;
        
        // Set wait period
        this.waitUntil.set(chatId, Date.now() + (retryAfter * 1000));
        
        logger.warn('Flood wait', { chatId, retryAfter });
        
        // Wait and retry
        await sleep(retryAfter * 1000);
        return await fn();
      }
      throw error;
    }
  }
}

const floodHandler = new FloodWaitHandler();

// Usage
await floodHandler.execute(chatId, () => 
  bot.sendMessage(chatId, 'Hello!')
);
```

### Rate Limiter with Token Bucket

```javascript
class TokenBucket {
  constructor(capacity, refillRate) {
    this.capacity = capacity;
    this.tokens = capacity;
    this.refillRate = refillRate; // tokens per second
    this.lastRefill = Date.now();
  }
  
  refill() {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    this.tokens = Math.min(this.capacity, this.tokens + elapsed * this.refillRate);
    this.lastRefill = now;
  }
  
  async take(count = 1) {
    this.refill();
    
    if (this.tokens >= count) {
      this.tokens -= count;
      return true;
    }
    
    // Wait for tokens
    const waitTime = (count - this.tokens) / this.refillRate * 1000;
    await sleep(waitTime);
    this.refill();
    this.tokens -= count;
    return true;
  }
}

// Global rate limiter (30 messages per second)
const globalLimiter = new TokenBucket(30, 30);

// Per-chat rate limiter (1 message per second)
const chatLimiters = new Map();

function getChatLimiter(chatId) {
  if (!chatLimiters.has(chatId)) {
    chatLimiters.set(chatId, new TokenBucket(1, 1));
  }
  return chatLimiters.get(chatId);
}

async function rateLimitedSend(chatId, text) {
  await globalLimiter.take();
  await getChatLimiter(chatId).take();
  return bot.sendMessage(chatId, text);
}
```

### Bottleneck Library

```javascript
const Bottleneck = require('bottleneck');

// Global limiter
const globalLimiter = new Bottleneck({
  maxConcurrent: 30,
  minTime: 33 // ~30 per second
});

// Per-chat limiter
const chatLimiters = new Bottleneck.Group({
  maxConcurrent: 1,
  minTime: 1000 // 1 per second per chat
});

async function sendMessage(chatId, text, options = {}) {
  return chatLimiters.key(chatId).schedule(() =>
    globalLimiter.schedule(() =>
      bot.sendMessage(chatId, text, options)
    )
  );
}

// Handle 429 errors
globalLimiter.on('failed', async (error, jobInfo) => {
  if (error.response?.statusCode === 429) {
    const retryAfter = error.response.body?.parameters?.retry_after || 30;
    return retryAfter * 1000; // Return wait time in ms
  }
  return null; // Don't retry other errors
});
```

---

## Retry Strategies

Handling transient failures.

### Exponential Backoff

```javascript
async function withExponentialBackoff(fn, options = {}) {
  const {
    maxRetries = 5,
    baseDelay = 1000,
    maxDelay = 60000,
    factor = 2
  } = options;
  
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries) break;
      if (!isRetryable(error)) break;
      
      const delay = Math.min(
        baseDelay * Math.pow(factor, attempt),
        maxDelay
      );
      
      // Add jitter
      const jitter = delay * 0.2 * Math.random();
      
      logger.debug('Retrying', { attempt: attempt + 1, delay: delay + jitter });
      await sleep(delay + jitter);
    }
  }
  
  throw lastError;
}

function isRetryable(error) {
  const code = error.response?.statusCode;
  
  // Retry server errors and rate limits
  if (code >= 500 || code === 429) return true;
  
  // Retry network errors
  if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') return true;
  
  return false;
}
```

### Circuit Breaker

```javascript
class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 30000;
    this.state = 'CLOSED';
    this.failures = 0;
    this.lastFailure = null;
  }
  
  async execute(fn) {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailure > this.resetTimeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }
    
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  onSuccess() {
    this.failures = 0;
    this.state = 'CLOSED';
  }
  
  onFailure() {
    this.failures++;
    this.lastFailure = Date.now();
    
    if (this.failures >= this.failureThreshold) {
      this.state = 'OPEN';
      logger.warn('Circuit breaker opened');
    }
  }
}

const telegramCircuit = new CircuitBreaker({
  failureThreshold: 5,
  resetTimeout: 30000
});

async function sendMessageSafe(chatId, text) {
  return telegramCircuit.execute(() =>
    bot.sendMessage(chatId, text)
  );
}
```

### Retry Queue

```javascript
class RetryQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
  }
  
  add(fn, options = {}) {
    this.queue.push({
      fn,
      attempts: 0,
      maxAttempts: options.maxAttempts || 3,
      delay: options.delay || 1000
    });
    
    this.process();
  }
  
  async process() {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    
    while (this.queue.length > 0) {
      const item = this.queue.shift();
      
      try {
        await item.fn();
      } catch (error) {
        item.attempts++;
        
        if (item.attempts < item.maxAttempts) {
          // Re-add with delay
          setTimeout(() => {
            this.queue.push(item);
            this.process();
          }, item.delay * item.attempts);
        } else {
          logger.error('Max retries reached', { error });
        }
      }
    }
    
    this.processing = false;
  }
}

const retryQueue = new RetryQueue();

// Usage
retryQueue.add(() => bot.sendMessage(chatId, text), {
  maxAttempts: 3,
  delay: 2000
});
```

---

## High Availability Bot

Building a bot that never goes down.

### Multi-Region Deployment

```
┌─────────────────────────────────────────────────────────────┐
│                     GLOBAL LOAD BALANCER                     │
│                    (AWS Route 53 / Cloudflare)               │
└───────────────────────────┬─────────────────────────────────┘
                            │
            ┌───────────────┼───────────────┐
            │               │               │
    ┌───────▼───────┐ ┌─────▼─────┐ ┌───────▼───────┐
    │   US-EAST     │ │  EU-WEST  │ │  ASIA-PACIFIC │
    │   Region      │ │  Region   │ │    Region     │
    └───────┬───────┘ └─────┬─────┘ └───────┬───────┘
            │               │               │
            └───────────────┼───────────────┘
                            │
                    ┌───────▼───────┐
                    │  Global Redis │
                    │   (Cluster)   │
                    └───────────────┘
```

### Health Check System

```javascript
class HealthChecker {
  constructor() {
    this.checks = new Map();
  }
  
  register(name, checkFn) {
    this.checks.set(name, checkFn);
  }
  
  async runAll() {
    const results = {};
    let healthy = true;
    
    for (const [name, checkFn] of this.checks) {
      try {
        const start = Date.now();
        await checkFn();
        results[name] = {
          status: 'healthy',
          latency: Date.now() - start
        };
      } catch (error) {
        healthy = false;
        results[name] = {
          status: 'unhealthy',
          error: error.message
        };
      }
    }
    
    return { healthy, checks: results };
  }
}

const health = new HealthChecker();

// Register checks
health.register('telegram', async () => {
  await bot.getMe();
});

health.register('redis', async () => {
  await redis.ping();
});

health.register('database', async () => {
  await db.ping();
});

// Health endpoint
app.get('/health', async (req, res) => {
  const result = await health.runAll();
  res.status(result.healthy ? 200 : 503).json(result);
});

// Liveness probe (is the process alive?)
app.get('/live', (req, res) => {
  res.sendStatus(200);
});

// Readiness probe (can it handle traffic?)
app.get('/ready', async (req, res) => {
  const result = await health.runAll();
  res.status(result.healthy ? 200 : 503).send();
});
```

### Failover System

```javascript
class FailoverManager {
  constructor() {
    this.primary = null;
    this.fallback = null;
    this.useFallback = false;
    this.checkInterval = 30000;
  }
  
  setPrimary(instance) {
    this.primary = instance;
  }
  
  setFallback(instance) {
    this.fallback = instance;
  }
  
  async execute(fn) {
    const instance = this.useFallback ? this.fallback : this.primary;
    
    try {
      return await fn(instance);
    } catch (error) {
      if (!this.useFallback && this.fallback) {
        logger.warn('Switching to fallback');
        this.useFallback = true;
        return await fn(this.fallback);
      }
      throw error;
    }
  }
  
  startHealthCheck() {
    setInterval(async () => {
      if (this.useFallback) {
        try {
          await this.primary.ping();
          logger.info('Primary recovered, switching back');
          this.useFallback = false;
        } catch {
          // Primary still down
        }
      }
    }, this.checkInterval);
  }
}
```

### Complete HA Setup

```javascript
// config/production.js
module.exports = {
  // Multiple Redis nodes
  redis: {
    cluster: [
      { host: 'redis-1.example.com', port: 6379 },
      { host: 'redis-2.example.com', port: 6379 },
      { host: 'redis-3.example.com', port: 6379 }
    ]
  },
  
  // Database replicas
  database: {
    primary: process.env.DB_PRIMARY_URL,
    replicas: [
      process.env.DB_REPLICA_1_URL,
      process.env.DB_REPLICA_2_URL
    ]
  },
  
  // Graceful shutdown
  shutdownTimeout: 30000,
  
  // Health check
  healthCheck: {
    interval: 10000,
    timeout: 5000
  }
};

// index.js
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;

if (cluster.isMaster) {
  logger.info(`Master ${process.pid} starting`);
  
  // Fork workers
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
  
  // Replace dead workers
  cluster.on('exit', (worker, code, signal) => {
    logger.warn(`Worker ${worker.process.pid} died`);
    cluster.fork();
  });
  
} else {
  // Worker process
  startBot();
}

async function startBot() {
  // Initialize with retries
  await withExponentialBackoff(async () => {
    await connectRedis();
    await connectDatabase();
    await validateBotToken();
  });
  
  // Start server
  const server = app.listen(PORT, () => {
    logger.info(`Worker ${process.pid} listening on port ${PORT}`);
  });
  
  // Graceful shutdown
  process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, shutting down gracefully');
    
    server.close(async () => {
      await closeConnections();
      process.exit(0);
    });
    
    // Force close after timeout
    setTimeout(() => {
      process.exit(1);
    }, config.shutdownTimeout);
  });
}
```

---

## Quick Reference

```javascript
// Stateless session
const session = await redis.get(`session:${userId}`);

// Queue update
await queue.add('update', update);

// Rate limiting
await limiter.schedule(() => bot.sendMessage(chatId, text));

// Retry with backoff
await withExponentialBackoff(() => apiCall());

// Circuit breaker
await circuit.execute(() => riskyOperation());

// Health check
app.get('/health', healthHandler);

// Graceful shutdown
process.on('SIGTERM', gracefulShutdown);
```
