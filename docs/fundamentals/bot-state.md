# Bot State & Conversations

A complete guide to managing user sessions, conversations, and multi-step flows.

---

## 📖 Table of Contents

1. [User Sessions](#user-sessions)
2. [Finite-State Machines (FSM)](#finite-state-machines-fsm)
3. [Multi-Step Flows](#multi-step-flows)
4. [Timeouts & Resets](#timeouts--resets)
5. [Context Persistence](#context-persistence)
6. [Handling Unexpected Input](#handling-unexpected-input)

---

## User Sessions

Managing user-specific data and conversation state.

### In-Memory Sessions (Simple)

```javascript
const sessions = new Map();

function getSession(userId) {
  if (!sessions.has(userId)) {
    sessions.set(userId, {
      state: 'idle',
      data: {},
      lastActivity: Date.now()
    });
  }
  return sessions.get(userId);
}

function updateSession(userId, updates) {
  const session = getSession(userId);
  Object.assign(session, updates, { lastActivity: Date.now() });
}

function clearSession(userId) {
  sessions.delete(userId);
}

// Usage
bot.on('message', (msg) => {
  const session = getSession(msg.from.id);
  console.log('Current state:', session.state);
});
```

### Session Structure

```javascript
const sessionSchema = {
  // User identification
  userId: 12345678,
  chatId: 12345678,
  
  // Current state
  state: 'awaiting_name',
  
  // Collected data
  data: {
    name: null,
    email: null,
    phone: null
  },
  
  // Metadata
  createdAt: Date.now(),
  lastActivity: Date.now(),
  messageCount: 0,
  
  // Temporary storage
  temp: {
    lastMessageId: null,
    pendingAction: null
  }
};
```

### Session with Redis (Production)

```javascript
const Redis = require('ioredis');
const redis = new Redis(process.env.REDIS_URL);

const SESSION_TTL = 3600; // 1 hour

async function getSession(userId) {
  const key = `session:${userId}`;
  const data = await redis.get(key);
  
  if (data) {
    return JSON.parse(data);
  }
  
  return {
    state: 'idle',
    data: {},
    lastActivity: Date.now()
  };
}

async function saveSession(userId, session) {
  const key = `session:${userId}`;
  session.lastActivity = Date.now();
  await redis.setex(key, SESSION_TTL, JSON.stringify(session));
}

async function clearSession(userId) {
  await redis.del(`session:${userId}`);
}
```

### Session with Database (PostgreSQL)

```javascript
const { Pool } = require('pg');
const pool = new Pool();

async function getSession(userId) {
  const result = await pool.query(
    'SELECT * FROM sessions WHERE user_id = $1',
    [userId]
  );
  
  if (result.rows.length > 0) {
    return result.rows[0];
  }
  
  // Create new session
  await pool.query(
    'INSERT INTO sessions (user_id, state, data) VALUES ($1, $2, $3)',
    [userId, 'idle', {}]
  );
  
  return { user_id: userId, state: 'idle', data: {} };
}

async function updateSession(userId, state, data) {
  await pool.query(
    `UPDATE sessions 
     SET state = $2, data = $3, updated_at = NOW() 
     WHERE user_id = $1`,
    [userId, state, data]
  );
}
```

---

## Finite-State Machines (FSM)

Structured approach to managing conversation states.

### Basic FSM Implementation

```javascript
const states = {
  IDLE: 'idle',
  AWAITING_NAME: 'awaiting_name',
  AWAITING_EMAIL: 'awaiting_email',
  AWAITING_CONFIRM: 'awaiting_confirm'
};

const transitions = {
  [states.IDLE]: {
    '/register': states.AWAITING_NAME
  },
  [states.AWAITING_NAME]: {
    'text': states.AWAITING_EMAIL,
    '/cancel': states.IDLE
  },
  [states.AWAITING_EMAIL]: {
    'email': states.AWAITING_CONFIRM,
    '/back': states.AWAITING_NAME,
    '/cancel': states.IDLE
  },
  [states.AWAITING_CONFIRM]: {
    'yes': states.IDLE,
    'no': states.AWAITING_NAME,
    '/cancel': states.IDLE
  }
};

function canTransition(currentState, input) {
  return transitions[currentState]?.[input] !== undefined;
}

function getNextState(currentState, input) {
  return transitions[currentState]?.[input];
}
```

### FSM with Handlers

```javascript
class ConversationFSM {
  constructor() {
    this.handlers = new Map();
  }
  
  on(state, handler) {
    this.handlers.set(state, handler);
    return this;
  }
  
  async process(session, msg) {
    const handler = this.handlers.get(session.state);
    
    if (!handler) {
      console.error(`No handler for state: ${session.state}`);
      return;
    }
    
    const result = await handler(session, msg);
    
    if (result.nextState) {
      session.state = result.nextState;
    }
    
    if (result.data) {
      Object.assign(session.data, result.data);
    }
    
    return result;
  }
}

// Define FSM
const registrationFSM = new ConversationFSM()
  .on('idle', async (session, msg) => {
    if (msg.text === '/register') {
      await bot.sendMessage(msg.chat.id, 'What is your name?');
      return { nextState: 'awaiting_name' };
    }
  })
  .on('awaiting_name', async (session, msg) => {
    if (msg.text === '/cancel') {
      await bot.sendMessage(msg.chat.id, 'Cancelled');
      return { nextState: 'idle', data: {} };
    }
    
    await bot.sendMessage(msg.chat.id, `Nice, ${msg.text}! What is your email?`);
    return { nextState: 'awaiting_email', data: { name: msg.text } };
  })
  .on('awaiting_email', async (session, msg) => {
    if (!isValidEmail(msg.text)) {
      await bot.sendMessage(msg.chat.id, 'Invalid email. Try again:');
      return {};
    }
    
    await bot.sendMessage(msg.chat.id, 
      `Confirm:\nName: ${session.data.name}\nEmail: ${msg.text}`,
      { reply_markup: { inline_keyboard: [
        [{ text: '✅ Confirm', callback_data: 'confirm' }],
        [{ text: '❌ Cancel', callback_data: 'cancel' }]
      ]}}
    );
    return { nextState: 'awaiting_confirm', data: { email: msg.text } };
  });

// Use FSM
bot.on('message', async (msg) => {
  const session = getSession(msg.from.id);
  await registrationFSM.process(session, msg);
  saveSession(msg.from.id, session);
});
```

### State Diagram

```
                    /register
    ┌─────────────────────────────────────┐
    │                                     │
    ▼                                     │
┌────────┐    text    ┌───────────────┐   │
│  IDLE  │ ─────────▶ │ AWAITING_NAME │   │
└────────┘            └───────────────┘   │
    ▲                        │            │
    │                        │ text       │
    │ /cancel                ▼            │
    │                ┌────────────────┐   │
    ├────────────────│ AWAITING_EMAIL │   │
    │                └────────────────┘   │
    │                        │            │
    │                        │ valid email│
    │ /cancel                ▼            │
    │                ┌─────────────────┐  │
    ├────────────────│ AWAITING_CONFIRM│──┘
    │                └─────────────────┘  confirm
    │                        │
    └────────────────────────┘
                   no/edit
```

---

## Multi-Step Flows

Building complex conversation flows.

### Wizard Pattern

```javascript
class Wizard {
  constructor(name) {
    this.name = name;
    this.steps = [];
  }
  
  addStep(config) {
    this.steps.push({
      name: config.name,
      prompt: config.prompt,
      validate: config.validate || (() => true),
      transform: config.transform || (v => v),
      field: config.field
    });
    return this;
  }
  
  async start(chatId, userId) {
    const session = getSession(userId);
    session.wizard = {
      name: this.name,
      step: 0,
      data: {}
    };
    saveSession(userId, session);
    
    await this.promptCurrentStep(chatId, userId);
  }
  
  async promptCurrentStep(chatId, userId) {
    const session = getSession(userId);
    const step = this.steps[session.wizard.step];
    
    const prompt = typeof step.prompt === 'function' 
      ? step.prompt(session.wizard.data)
      : step.prompt;
    
    await bot.sendMessage(chatId, prompt);
  }
  
  async handleInput(msg) {
    const session = getSession(msg.from.id);
    
    if (!session.wizard || session.wizard.name !== this.name) {
      return false;
    }
    
    const step = this.steps[session.wizard.step];
    const input = msg.text;
    
    // Validate
    const validation = await step.validate(input, session.wizard.data);
    if (validation !== true) {
      await bot.sendMessage(msg.chat.id, validation); // Error message
      return true;
    }
    
    // Transform and store
    session.wizard.data[step.field] = step.transform(input);
    
    // Next step or complete
    session.wizard.step++;
    
    if (session.wizard.step >= this.steps.length) {
      // Wizard complete
      const result = session.wizard.data;
      delete session.wizard;
      saveSession(msg.from.id, session);
      
      await this.onComplete(msg.chat.id, msg.from.id, result);
    } else {
      saveSession(msg.from.id, session);
      await this.promptCurrentStep(msg.chat.id, msg.from.id);
    }
    
    return true;
  }
  
  onComplete(chatId, userId, data) {
    // Override in instance
  }
}

// Create wizard
const orderWizard = new Wizard('order')
  .addStep({
    name: 'product',
    prompt: 'What product do you want to order?',
    field: 'product'
  })
  .addStep({
    name: 'quantity',
    prompt: (data) => `How many ${data.product} do you want?`,
    validate: (input) => {
      const num = parseInt(input);
      if (isNaN(num) || num < 1) return 'Please enter a valid number';
      if (num > 100) return 'Maximum 100 items';
      return true;
    },
    transform: (input) => parseInt(input),
    field: 'quantity'
  })
  .addStep({
    name: 'address',
    prompt: 'What is your delivery address?',
    validate: (input) => input.length > 10 || 'Address too short',
    field: 'address'
  });

orderWizard.onComplete = async (chatId, userId, data) => {
  await bot.sendMessage(chatId, 
    `✅ Order placed!\n` +
    `Product: ${data.product}\n` +
    `Quantity: ${data.quantity}\n` +
    `Address: ${data.address}`
  );
};

// Usage
bot.onText(/\/order/, (msg) => orderWizard.start(msg.chat.id, msg.from.id));
bot.on('message', (msg) => orderWizard.handleInput(msg));
```

### Branching Flows

```javascript
const flow = {
  start: {
    prompt: 'Are you a new or existing customer?',
    buttons: [
      { text: 'New Customer', next: 'new_customer' },
      { text: 'Existing Customer', next: 'existing_customer' }
    ]
  },
  new_customer: {
    prompt: 'Welcome! Let\'s create your account. What is your name?',
    input: 'name',
    next: 'new_email'
  },
  new_email: {
    prompt: 'What is your email?',
    input: 'email',
    validate: isValidEmail,
    next: 'complete_registration'
  },
  existing_customer: {
    prompt: 'Please enter your account ID:',
    input: 'accountId',
    next: 'verify_account'
  },
  verify_account: {
    action: async (data) => {
      const account = await findAccount(data.accountId);
      return account ? 'account_menu' : 'account_not_found';
    }
  },
  account_menu: {
    prompt: 'What would you like to do?',
    buttons: [
      { text: 'View Orders', next: 'view_orders' },
      { text: 'Update Profile', next: 'update_profile' },
      { text: 'Support', next: 'support' }
    ]
  }
};

async function processFlow(session, msg) {
  const currentNode = flow[session.flowState];
  
  if (currentNode.buttons) {
    // Handle button selection
    const selected = currentNode.buttons.find(b => b.text === msg.text);
    if (selected) {
      session.flowState = selected.next;
    }
  } else if (currentNode.input) {
    // Handle text input
    if (currentNode.validate && !currentNode.validate(msg.text)) {
      await bot.sendMessage(msg.chat.id, 'Invalid input. Try again.');
      return;
    }
    session.flowData[currentNode.input] = msg.text;
    session.flowState = currentNode.next;
  } else if (currentNode.action) {
    // Handle action
    session.flowState = await currentNode.action(session.flowData);
  }
  
  // Show next prompt
  const nextNode = flow[session.flowState];
  if (nextNode.prompt) {
    const options = nextNode.buttons ? {
      reply_markup: {
        keyboard: nextNode.buttons.map(b => [b.text]),
        resize_keyboard: true
      }
    } : {};
    
    await bot.sendMessage(msg.chat.id, nextNode.prompt, options);
  }
}
```

---

## Timeouts & Resets

Managing session expiration and conversation resets.

### Session Timeout

```javascript
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

function isSessionExpired(session) {
  return Date.now() - session.lastActivity > SESSION_TIMEOUT;
}

bot.on('message', async (msg) => {
  const session = getSession(msg.from.id);
  
  if (isSessionExpired(session)) {
    // Reset expired session
    clearSession(msg.from.id);
    await bot.sendMessage(msg.chat.id, 
      'Your session expired. Please start again with /start'
    );
    return;
  }
  
  // Update activity
  session.lastActivity = Date.now();
  
  // Process message...
});
```

### Automatic Cleanup

```javascript
// Clean up old sessions periodically
setInterval(() => {
  const now = Date.now();
  
  for (const [userId, session] of sessions) {
    if (now - session.lastActivity > SESSION_TIMEOUT) {
      sessions.delete(userId);
      console.log(`Cleaned up session for user ${userId}`);
    }
  }
}, 60000); // Every minute
```

### Conversation Reset Commands

```javascript
bot.onText(/\/cancel/, async (msg) => {
  const session = getSession(msg.from.id);
  
  if (session.state !== 'idle') {
    clearSession(msg.from.id);
    await bot.sendMessage(msg.chat.id, 
      '❌ Operation cancelled. Use /start to begin again.',
      { reply_markup: { remove_keyboard: true } }
    );
  }
});

bot.onText(/\/reset/, async (msg) => {
  clearSession(msg.from.id);
  await bot.sendMessage(msg.chat.id, 
    '🔄 Session reset. All data cleared.',
    { reply_markup: { remove_keyboard: true } }
  );
});
```

### Timeout Warnings

```javascript
const WARNING_TIMEOUT = 25 * 60 * 1000; // 25 minutes

async function checkSessionWarning(userId, chatId) {
  const session = getSession(userId);
  
  if (!session.warningShown && 
      Date.now() - session.lastActivity > WARNING_TIMEOUT) {
    
    session.warningShown = true;
    saveSession(userId, session);
    
    await bot.sendMessage(chatId,
      '⚠️ Your session will expire in 5 minutes due to inactivity.\n' +
      'Send any message to keep it active.'
    );
  }
}

// Check periodically for active conversations
setInterval(async () => {
  for (const [userId, session] of sessions) {
    if (session.state !== 'idle' && session.chatId) {
      await checkSessionWarning(userId, session.chatId);
    }
  }
}, 60000);
```

---

## Context Persistence

Storing and restoring conversation context.

### What to Persist

```javascript
const persistentData = {
  // Always persist
  userId: 12345678,
  preferences: {
    language: 'en',
    notifications: true
  },
  
  // Persist for continuity
  lastCommand: '/order',
  conversationState: 'awaiting_address',
  conversationData: {
    product: 'Widget',
    quantity: 5
  },
  
  // Don't persist (recreate on restart)
  tempMessageId: null,
  pendingTimeout: null
};
```

### Database Schema

```sql
CREATE TABLE user_sessions (
  user_id BIGINT PRIMARY KEY,
  chat_id BIGINT,
  state VARCHAR(50) DEFAULT 'idle',
  data JSONB DEFAULT '{}',
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sessions_updated ON user_sessions(updated_at);
```

### Restore on Bot Restart

```javascript
async function restoreActiveSessions() {
  const result = await pool.query(
    `SELECT * FROM user_sessions 
     WHERE state != 'idle' 
     AND updated_at > NOW() - INTERVAL '1 hour'`
  );
  
  for (const row of result.rows) {
    // Notify user about restart
    try {
      await bot.sendMessage(row.chat_id,
        '🔄 Bot was restarted. Your session has been restored.\n' +
        'You can continue where you left off or use /cancel to start over.'
      );
    } catch (e) {
      // User may have blocked bot
    }
  }
  
  console.log(`Restored ${result.rows.length} active sessions`);
}

// Call on startup
restoreActiveSessions();
```

### Context Middleware

```javascript
async function contextMiddleware(msg, next) {
  const userId = msg.from.id;
  
  // Load context
  const context = {
    user: await getUser(userId),
    session: await getSession(userId),
    preferences: await getPreferences(userId)
  };
  
  // Attach to message
  msg.context = context;
  
  // Process
  await next();
  
  // Save changes
  await saveSession(userId, context.session);
}

// Usage with middleware pattern
bot.on('message', async (msg) => {
  await contextMiddleware(msg, async () => {
    const { session, preferences } = msg.context;
    
    // Use context
    if (preferences.language === 'es') {
      // Spanish response
    }
  });
});
```

---

## Handling Unexpected Input

Gracefully handling invalid or unexpected user input.

### Input Validation

```javascript
const validators = {
  email: (input) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(input) || 'Please enter a valid email address';
  },
  
  phone: (input) => {
    const phoneRegex = /^\+?[\d\s-]{10,}$/;
    return phoneRegex.test(input) || 'Please enter a valid phone number';
  },
  
  number: (min, max) => (input) => {
    const num = parseFloat(input);
    if (isNaN(num)) return 'Please enter a number';
    if (num < min) return `Minimum value is ${min}`;
    if (num > max) return `Maximum value is ${max}`;
    return true;
  },
  
  choice: (options) => (input) => {
    return options.includes(input) || `Please choose: ${options.join(', ')}`;
  }
};

// Usage
const step = {
  prompt: 'Enter your email:',
  validate: validators.email
};
```

### Fallback Handlers

```javascript
bot.on('message', async (msg) => {
  const session = getSession(msg.from.id);
  
  // Handle commands first
  if (msg.text?.startsWith('/')) {
    return handleCommand(msg);
  }
  
  // Handle based on state
  if (session.state !== 'idle') {
    return handleConversation(session, msg);
  }
  
  // Fallback for unexpected input
  await bot.sendMessage(msg.chat.id,
    "I didn't understand that. Here's what I can do:\n\n" +
    "/start - Start the bot\n" +
    "/help - Get help\n" +
    "/order - Place an order"
  );
});
```

### Retry Logic

```javascript
async function handleWithRetry(session, msg, handler, maxRetries = 3) {
  if (!session.retryCount) session.retryCount = 0;
  
  const result = await handler(session, msg);
  
  if (result.error) {
    session.retryCount++;
    
    if (session.retryCount >= maxRetries) {
      // Too many retries
      await bot.sendMessage(msg.chat.id,
        "❌ Too many invalid attempts. Operation cancelled.\n" +
        "Use /start to try again."
      );
      clearSession(msg.from.id);
      return;
    }
    
    await bot.sendMessage(msg.chat.id,
      `${result.error}\n\n` +
      `Attempt ${session.retryCount}/${maxRetries}. Try again:`
    );
    return;
  }
  
  // Success - reset retry count
  session.retryCount = 0;
  return result;
}
```

### Context-Aware Suggestions

```javascript
function getSuggestions(session, input) {
  const suggestions = [];
  
  switch (session.state) {
    case 'awaiting_product':
      // Suggest similar products
      const products = ['Apple', 'Banana', 'Orange'];
      const similar = products.filter(p => 
        p.toLowerCase().includes(input.toLowerCase())
      );
      if (similar.length > 0) {
        suggestions.push(`Did you mean: ${similar.join(', ')}?`);
      }
      break;
      
    case 'awaiting_date':
      suggestions.push('Try formats: YYYY-MM-DD, DD/MM/YYYY, or "tomorrow"');
      break;
  }
  
  return suggestions;
}

bot.on('message', async (msg) => {
  const session = getSession(msg.from.id);
  const validation = validateInput(session, msg.text);
  
  if (!validation.valid) {
    const suggestions = getSuggestions(session, msg.text);
    
    let response = `❌ ${validation.error}`;
    if (suggestions.length > 0) {
      response += `\n\n💡 ${suggestions.join('\n')}`;
    }
    
    await bot.sendMessage(msg.chat.id, response);
  }
});
```

### Escape Hatches

```javascript
const ESCAPE_COMMANDS = ['/cancel', '/back', '/help', '/start'];

bot.on('message', async (msg) => {
  // Always allow escape commands
  if (ESCAPE_COMMANDS.includes(msg.text)) {
    return handleEscapeCommand(msg);
  }
  
  // Normal processing...
});

async function handleEscapeCommand(msg) {
  const session = getSession(msg.from.id);
  
  switch (msg.text) {
    case '/cancel':
      clearSession(msg.from.id);
      await bot.sendMessage(msg.chat.id, '❌ Cancelled');
      break;
      
    case '/back':
      if (session.previousState) {
        session.state = session.previousState;
        await promptForState(session, msg.chat.id);
      }
      break;
      
    case '/help':
      await showContextualHelp(session, msg.chat.id);
      break;
      
    case '/start':
      clearSession(msg.from.id);
      await showMainMenu(msg.chat.id);
      break;
  }
}
```

---

## Quick Reference

```javascript
// Get/set session
const session = getSession(userId);
session.state = 'new_state';
session.data.field = 'value';
saveSession(userId, session);

// Clear session
clearSession(userId);

// Check timeout
if (Date.now() - session.lastActivity > TIMEOUT) {
  // Session expired
}

// Validate input
const isValid = validator(input);
if (isValid !== true) {
  // Show error: isValid contains error message
}

// State transition
session.previousState = session.state;
session.state = nextState;
```

