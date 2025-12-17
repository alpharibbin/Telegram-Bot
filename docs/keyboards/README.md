# Keyboards & Interactions

A complete guide to creating interactive keyboards and handling user interactions.

---

## 📖 Table of Contents

1. [Reply Keyboards](#reply-keyboards)
2. [Inline Keyboards](#inline-keyboards)
3. [Callback Queries](#callback-queries)
4. [Button Payload Design](#button-payload-design)
5. [Stateless vs Stateful Buttons](#stateless-vs-stateful-buttons)
6. [UX Best Practices](#ux-best-practices)

---

## Reply Keyboards

Reply keyboards appear below the message input field and replace the default keyboard.

### Basic Reply Keyboard

```javascript
bot.sendMessage(chatId, 'Choose an option:', {
  reply_markup: {
    keyboard: [
      ['Option 1', 'Option 2'],
      ['Option 3', 'Option 4'],
      ['Cancel']
    ],
    resize_keyboard: true,
    one_time_keyboard: true
  }
});
```

### Keyboard Layout

```
┌─────────────────────────────────────┐
│  Option 1  │  Option 2              │  ← Row 1
├─────────────────────────────────────┤
│  Option 3  │  Option 4              │  ← Row 2
├─────────────────────────────────────┤
│           Cancel                    │  ← Row 3 (full width)
└─────────────────────────────────────┘
```

### Keyboard Options

| Option | Type | Description |
|--------|------|-------------|
| `keyboard` | Array | Array of button rows |
| `resize_keyboard` | Boolean | Fit keyboard to buttons (default: false) |
| `one_time_keyboard` | Boolean | Hide after use (default: false) |
| `input_field_placeholder` | String | Placeholder in input field |
| `selective` | Boolean | Show only to specific users |
| `is_persistent` | Boolean | Always show keyboard |

### Special Button Types

```javascript
bot.sendMessage(chatId, 'Share your info:', {
  reply_markup: {
    keyboard: [
      [{ text: '📍 Share Location', request_location: true }],
      [{ text: '📞 Share Contact', request_contact: true }],
      [{ text: '📊 Create Poll', request_poll: { type: 'regular' } }],
      [{ text: '👥 Select Users', request_users: { request_id: 1 } }],
      [{ text: '💬 Select Chat', request_chat: { request_id: 2, chat_is_channel: false } }]
    ],
    resize_keyboard: true
  }
});
```

### Handling Reply Keyboard Input

```javascript
bot.on('message', (msg) => {
  const text = msg.text;
  
  switch (text) {
    case 'Option 1':
      bot.sendMessage(msg.chat.id, 'You selected Option 1');
      break;
    case 'Option 2':
      bot.sendMessage(msg.chat.id, 'You selected Option 2');
      break;
    case 'Cancel':
      // Remove keyboard
      bot.sendMessage(msg.chat.id, 'Cancelled', {
        reply_markup: { remove_keyboard: true }
      });
      break;
  }
});

// Handle shared location
bot.on('location', (msg) => {
  const { latitude, longitude } = msg.location;
  bot.sendMessage(msg.chat.id, `Your location: ${latitude}, ${longitude}`);
});

// Handle shared contact
bot.on('contact', (msg) => {
  const { phone_number, first_name } = msg.contact;
  bot.sendMessage(msg.chat.id, `Phone: ${phone_number}, Name: ${first_name}`);
});
```

### Remove Reply Keyboard

```javascript
bot.sendMessage(chatId, 'Keyboard removed', {
  reply_markup: { remove_keyboard: true }
});

// Remove only for specific users (in groups)
bot.sendMessage(chatId, 'Keyboard removed for you', {
  reply_markup: { remove_keyboard: true, selective: true }
});
```

### Dynamic Reply Keyboard

```javascript
function createMenuKeyboard(items, columns = 2) {
  const keyboard = [];
  
  for (let i = 0; i < items.length; i += columns) {
    keyboard.push(items.slice(i, i + columns));
  }
  
  keyboard.push(['🔙 Back', '❌ Cancel']);
  
  return {
    keyboard,
    resize_keyboard: true
  };
}

// Usage
const products = ['🍎 Apple', '🍌 Banana', '🍊 Orange', '🍇 Grapes'];
bot.sendMessage(chatId, 'Select a product:', {
  reply_markup: createMenuKeyboard(products)
});
```

---

## Inline Keyboards

Inline keyboards appear directly below the message they belong to.

### Basic Inline Keyboard

```javascript
bot.sendMessage(chatId, 'Choose an action:', {
  reply_markup: {
    inline_keyboard: [
      [
        { text: '✅ Yes', callback_data: 'answer_yes' },
        { text: '❌ No', callback_data: 'answer_no' }
      ],
      [
        { text: '🌐 Visit Website', url: 'https://example.com' }
      ]
    ]
  }
});
```

### Button Types

```javascript
const inlineKeyboard = {
  inline_keyboard: [
    // Callback button
    [{ text: 'Click me', callback_data: 'button_clicked' }],
    
    // URL button
    [{ text: 'Open Link', url: 'https://telegram.org' }],
    
    // Switch to inline query
    [{ text: 'Share', switch_inline_query: 'search query' }],
    
    // Switch inline in current chat
    [{ text: 'Search here', switch_inline_query_current_chat: '' }],
    
    // Login button (for websites with Telegram Login)
    [{ text: 'Login', login_url: { url: 'https://example.com/auth' } }],
    
    // Web App button
    [{ text: 'Open App', web_app: { url: 'https://example.com/webapp' } }],
    
    // Pay button (for payments)
    [{ text: 'Pay $10', pay: true }],
    
    // Callback game button
    [{ text: 'Play Game', callback_game: {} }]
  ]
};
```

### Multi-Row Layout

```javascript
// Grid layout
bot.sendMessage(chatId, 'Calculator:', {
  reply_markup: {
    inline_keyboard: [
      [
        { text: '7', callback_data: 'num_7' },
        { text: '8', callback_data: 'num_8' },
        { text: '9', callback_data: 'num_9' },
        { text: '÷', callback_data: 'op_div' }
      ],
      [
        { text: '4', callback_data: 'num_4' },
        { text: '5', callback_data: 'num_5' },
        { text: '6', callback_data: 'num_6' },
        { text: '×', callback_data: 'op_mul' }
      ],
      [
        { text: '1', callback_data: 'num_1' },
        { text: '2', callback_data: 'num_2' },
        { text: '3', callback_data: 'num_3' },
        { text: '-', callback_data: 'op_sub' }
      ],
      [
        { text: 'C', callback_data: 'clear' },
        { text: '0', callback_data: 'num_0' },
        { text: '=', callback_data: 'equals' },
        { text: '+', callback_data: 'op_add' }
      ]
    ]
  }
});
```

### Dynamic Inline Keyboard Builder

```javascript
class InlineKeyboardBuilder {
  constructor() {
    this.keyboard = [];
    this.currentRow = [];
  }
  
  addButton(text, callbackData) {
    this.currentRow.push({ text, callback_data: callbackData });
    return this;
  }
  
  addUrlButton(text, url) {
    this.currentRow.push({ text, url });
    return this;
  }
  
  row() {
    if (this.currentRow.length > 0) {
      this.keyboard.push(this.currentRow);
      this.currentRow = [];
    }
    return this;
  }
  
  build() {
    this.row(); // Add any remaining buttons
    return { inline_keyboard: this.keyboard };
  }
}

// Usage
const keyboard = new InlineKeyboardBuilder()
  .addButton('Option 1', 'opt_1')
  .addButton('Option 2', 'opt_2')
  .row()
  .addButton('Option 3', 'opt_3')
  .row()
  .addUrlButton('Help', 'https://example.com/help')
  .build();

bot.sendMessage(chatId, 'Choose:', { reply_markup: keyboard });
```

---

## Callback Queries

Callback queries are triggered when users click inline keyboard buttons.

### Handling Callback Queries

```javascript
bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const messageId = query.message.message_id;
  const data = query.data;
  const userId = query.from.id;
  
  // Always answer the callback query
  await bot.answerCallbackQuery(query.id);
  
  // Handle different actions
  switch (data) {
    case 'answer_yes':
      await bot.sendMessage(chatId, 'You clicked Yes!');
      break;
    case 'answer_no':
      await bot.sendMessage(chatId, 'You clicked No!');
      break;
  }
});
```

### Answer Callback Query Options

```javascript
// Simple acknowledgment (removes loading indicator)
bot.answerCallbackQuery(query.id);

// Show toast notification
bot.answerCallbackQuery(query.id, {
  text: 'Button clicked!'
});

// Show alert popup
bot.answerCallbackQuery(query.id, {
  text: 'This is an alert!',
  show_alert: true
});

// Open URL
bot.answerCallbackQuery(query.id, {
  url: 'https://example.com'
});

// Cache duration (for identical queries)
bot.answerCallbackQuery(query.id, {
  text: 'Cached response',
  cache_time: 60 // seconds
});
```

### Update Message After Callback

```javascript
bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const messageId = query.message.message_id;
  
  // Update message text
  await bot.editMessageText('You selected: ' + query.data, {
    chat_id: chatId,
    message_id: messageId
  });
  
  // Or update keyboard only
  await bot.editMessageReplyMarkup({
    inline_keyboard: [
      [{ text: '✅ Selected', callback_data: 'already_selected' }]
    ]
  }, {
    chat_id: chatId,
    message_id: messageId
  });
  
  await bot.answerCallbackQuery(query.id);
});
```

### Pagination Example

```javascript
const ITEMS_PER_PAGE = 5;
const items = ['Item 1', 'Item 2', /* ... */ 'Item 50'];

function getPageKeyboard(page) {
  const start = page * ITEMS_PER_PAGE;
  const end = start + ITEMS_PER_PAGE;
  const pageItems = items.slice(start, end);
  const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);
  
  const keyboard = pageItems.map(item => (
    [{ text: item, callback_data: `select_${item}` }]
  ));
  
  // Navigation row
  const navRow = [];
  if (page > 0) {
    navRow.push({ text: '⬅️ Prev', callback_data: `page_${page - 1}` });
  }
  navRow.push({ text: `${page + 1}/${totalPages}`, callback_data: 'noop' });
  if (page < totalPages - 1) {
    navRow.push({ text: 'Next ➡️', callback_data: `page_${page + 1}` });
  }
  keyboard.push(navRow);
  
  return { inline_keyboard: keyboard };
}

bot.on('callback_query', async (query) => {
  if (query.data.startsWith('page_')) {
    const page = parseInt(query.data.split('_')[1]);
    
    await bot.editMessageReplyMarkup(getPageKeyboard(page), {
      chat_id: query.message.chat.id,
      message_id: query.message.message_id
    });
  }
  
  await bot.answerCallbackQuery(query.id);
});
```

---

## Button Payload Design

Designing effective callback_data payloads.

### Callback Data Limits

- **Maximum length**: 64 bytes
- **Characters**: Any UTF-8 characters
- **Must be unique**: For different actions

### Simple Approach: Prefixes

```javascript
// Format: action_id
const callbacks = {
  'like_123': 'Like post 123',
  'delete_456': 'Delete item 456',
  'page_2': 'Go to page 2',
  'menu_settings': 'Open settings menu'
};

bot.on('callback_query', (query) => {
  const [action, id] = query.data.split('_');
  
  switch (action) {
    case 'like':
      handleLike(id);
      break;
    case 'delete':
      handleDelete(id);
      break;
    case 'page':
      handlePage(parseInt(id));
      break;
    case 'menu':
      handleMenu(id);
      break;
  }
});
```

### Structured Approach: JSON

```javascript
// For complex data (watch the 64-byte limit!)
function encodeCallback(data) {
  return JSON.stringify(data);
}

function decodeCallback(str) {
  return JSON.parse(str);
}

// Create button
const button = {
  text: 'Buy',
  callback_data: encodeCallback({ a: 'buy', p: 123, q: 2 })
  // { action: 'buy', productId: 123, quantity: 2 }
};

// Handle callback
bot.on('callback_query', (query) => {
  const data = decodeCallback(query.data);
  // data = { a: 'buy', p: 123, q: 2 }
});
```

### Short Codes for Long Data

```javascript
// Store full data server-side, use short ID in callback
const callbackStore = new Map();

function createCallback(data) {
  const id = generateShortId(); // e.g., 'a1b2c3'
  callbackStore.set(id, data);
  return id;
}

function getCallbackData(id) {
  return callbackStore.get(id);
}

// Create button
const callbackId = createCallback({
  action: 'purchase',
  productId: 12345,
  userId: 67890,
  options: { color: 'red', size: 'XL' }
});

const button = { text: 'Buy', callback_data: callbackId };

// Handle callback
bot.on('callback_query', (query) => {
  const data = getCallbackData(query.data);
  // Full data object
});
```

### Versioned Callbacks

```javascript
// Include version for backwards compatibility
// Format: v1:action:param1:param2

function createCallbackV1(action, ...params) {
  return `v1:${action}:${params.join(':')}`;
}

function parseCallback(data) {
  const [version, action, ...params] = data.split(':');
  return { version, action, params };
}

// Usage
const callback = createCallbackV1('buy', '123', '2');
// Result: 'v1:buy:123:2'

const parsed = parseCallback('v1:buy:123:2');
// Result: { version: 'v1', action: 'buy', params: ['123', '2'] }
```

---

## Stateless vs Stateful Buttons

Understanding when to use each approach.

### Stateless Buttons

All information is in the callback_data. No server-side state needed.

```javascript
// ✅ Stateless: Everything in callback
bot.sendMessage(chatId, 'Rate this:', {
  reply_markup: {
    inline_keyboard: [
      [
        { text: '⭐', callback_data: 'rate_1_post123' },
        { text: '⭐⭐', callback_data: 'rate_2_post123' },
        { text: '⭐⭐⭐', callback_data: 'rate_3_post123' }
      ]
    ]
  }
});

bot.on('callback_query', (query) => {
  const [action, rating, postId] = query.data.split('_');
  // No database lookup needed to know what to rate
  saveRating(postId, parseInt(rating), query.from.id);
});
```

**Pros:**
- Simple implementation
- No database dependency
- Works even after bot restart
- Scales easily

**Cons:**
- Limited data (64 bytes)
- Data visible to users (in API)
- Can't update button behavior

### Stateful Buttons

Server stores state, callback_data is just a reference.

```javascript
// ❌ Stateful: Requires server lookup
const pendingActions = new Map();

bot.onText(/\/order/, async (msg) => {
  const orderId = await createOrder(msg.from.id);
  
  // Store state
  pendingActions.set(`order_${orderId}`, {
    userId: msg.from.id,
    items: [],
    step: 'select_product'
  });
  
  bot.sendMessage(msg.chat.id, 'Select product:', {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Product A', callback_data: `add_${orderId}` }]
      ]
    }
  });
});

bot.on('callback_query', (query) => {
  const [action, orderId] = query.data.split('_');
  const state = pendingActions.get(`order_${orderId}`);
  
  if (!state) {
    return bot.answerCallbackQuery(query.id, {
      text: 'Session expired!',
      show_alert: true
    });
  }
  
  // Process based on state
});
```

**Pros:**
- Unlimited data
- Complex workflows
- Secure (data not exposed)
- Can modify behavior dynamically

**Cons:**
- Requires database/cache
- State can expire
- More complex
- Scaling challenges

### Hybrid Approach

```javascript
// Best of both worlds
bot.sendMessage(chatId, 'Manage item:', {
  reply_markup: {
    inline_keyboard: [
      // Stateless: action + ID in callback
      [{ text: '👍 Like', callback_data: 'like_123' }],
      [{ text: '💬 Comment', callback_data: 'comment_123' }],
      // Stateful: opens multi-step flow
      [{ text: '✏️ Edit', callback_data: 'edit_123' }]
    ]
  }
});

bot.on('callback_query', async (query) => {
  const [action, itemId] = query.data.split('_');
  
  switch (action) {
    case 'like':
      // Stateless: immediate action
      await toggleLike(itemId, query.from.id);
      break;
      
    case 'edit':
      // Stateful: start conversation
      startEditFlow(query.from.id, itemId);
      break;
  }
});
```

---

## UX Best Practices

Creating user-friendly bot interactions.

### 1. Button Design

```javascript
// ✅ Good: Clear, concise labels with emoji
[
  { text: '✅ Confirm', callback_data: 'confirm' },
  { text: '❌ Cancel', callback_data: 'cancel' }
]

// ❌ Bad: Vague or too long
[
  { text: 'Click here to confirm your action', callback_data: 'confirm' },
  { text: 'No', callback_data: 'cancel' }
]
```

### 2. Logical Button Grouping

```javascript
// ✅ Good: Related actions together
{
  inline_keyboard: [
    // Primary actions
    [{ text: '📝 Edit', callback_data: 'edit' }, { text: '🗑 Delete', callback_data: 'delete' }],
    // Navigation
    [{ text: '⬅️ Back', callback_data: 'back' }, { text: '🏠 Home', callback_data: 'home' }]
  ]
}

// ❌ Bad: Random arrangement
{
  inline_keyboard: [
    [{ text: 'Delete', callback_data: 'delete' }, { text: 'Back', callback_data: 'back' }],
    [{ text: 'Edit', callback_data: 'edit' }, { text: 'Home', callback_data: 'home' }]
  ]
}
```

### 3. Loading States

```javascript
bot.on('callback_query', async (query) => {
  // Show loading immediately
  await bot.answerCallbackQuery(query.id, { text: '⏳ Loading...' });
  
  // Update button to show loading
  await bot.editMessageReplyMarkup({
    inline_keyboard: [
      [{ text: '⏳ Processing...', callback_data: 'noop' }]
    ]
  }, {
    chat_id: query.message.chat.id,
    message_id: query.message.message_id
  });
  
  // Do the work
  await heavyOperation();
  
  // Show result
  await bot.editMessageText('✅ Done!', {
    chat_id: query.message.chat.id,
    message_id: query.message.message_id
  });
});
```

### 4. Confirmation for Destructive Actions

```javascript
// First click: Show confirmation
bot.on('callback_query', async (query) => {
  if (query.data === 'delete_item') {
    await bot.editMessageReplyMarkup({
      inline_keyboard: [
        [{ text: '⚠️ Are you sure?', callback_data: 'noop' }],
        [
          { text: '✅ Yes, delete', callback_data: 'confirm_delete' },
          { text: '❌ No, cancel', callback_data: 'cancel_delete' }
        ]
      ]
    }, {
      chat_id: query.message.chat.id,
      message_id: query.message.message_id
    });
  }
  
  if (query.data === 'confirm_delete') {
    await deleteItem();
    await bot.editMessageText('🗑 Item deleted', {
      chat_id: query.message.chat.id,
      message_id: query.message.message_id
    });
  }
});
```

### 5. Breadcrumb Navigation

```javascript
function createMenuWithBreadcrumb(path, options) {
  const keyboard = options.map(opt => (
    [{ text: opt.text, callback_data: opt.callback }]
  ));
  
  // Add breadcrumb
  if (path.length > 0) {
    keyboard.push([{ text: `🔙 Back to ${path[path.length - 1]}`, callback_data: 'back' }]);
  }
  keyboard.push([{ text: '🏠 Main Menu', callback_data: 'home' }]);
  
  return { inline_keyboard: keyboard };
}
```

### 6. Disable Used Buttons

```javascript
bot.on('callback_query', async (query) => {
  if (query.data.startsWith('vote_')) {
    const option = query.data.split('_')[1];
    
    // Update to show selection
    await bot.editMessageReplyMarkup({
      inline_keyboard: [
        [{ text: option === 'a' ? '✅ Option A' : 'Option A', callback_data: 'voted' }],
        [{ text: option === 'b' ? '✅ Option B' : 'Option B', callback_data: 'voted' }]
      ]
    }, {
      chat_id: query.message.chat.id,
      message_id: query.message.message_id
    });
    
    await bot.answerCallbackQuery(query.id, { text: 'Vote recorded!' });
  }
  
  if (query.data === 'voted') {
    await bot.answerCallbackQuery(query.id, { text: 'You already voted!' });
  }
});
```

### 7. Responsive Feedback

```javascript
// Always provide immediate feedback
bot.on('callback_query', async (query) => {
  // Immediate acknowledgment
  await bot.answerCallbackQuery(query.id);
  
  // Visual feedback in message
  const originalText = query.message.text;
  await bot.editMessageText(originalText + '\n\n⏳ Processing...', {
    chat_id: query.message.chat.id,
    message_id: query.message.message_id
  });
  
  // Process
  const result = await processAction(query.data);
  
  // Final state
  await bot.editMessageText(originalText + `\n\n✅ ${result}`, {
    chat_id: query.message.chat.id,
    message_id: query.message.message_id
  });
});
```

### 8. Mobile-Friendly Layouts

```javascript
// ✅ Good: Large tap targets, few buttons per row
{
  inline_keyboard: [
    [{ text: '📱 Option 1', callback_data: 'opt1' }],
    [{ text: '📱 Option 2', callback_data: 'opt2' }],
    [{ text: '📱 Option 3', callback_data: 'opt3' }]
  ]
}

// ⚠️ Careful: Many small buttons (hard to tap on mobile)
{
  inline_keyboard: [
    [
      { text: '1', callback_data: '1' },
      { text: '2', callback_data: '2' },
      { text: '3', callback_data: '3' },
      { text: '4', callback_data: '4' },
      { text: '5', callback_data: '5' }
    ]
  ]
}
```

---

## Quick Reference

```javascript
// Reply keyboard
bot.sendMessage(chatId, 'Choose:', {
  reply_markup: {
    keyboard: [['A', 'B'], ['C']],
    resize_keyboard: true,
    one_time_keyboard: true
  }
});

// Remove reply keyboard
bot.sendMessage(chatId, 'Done', {
  reply_markup: { remove_keyboard: true }
});

// Inline keyboard
bot.sendMessage(chatId, 'Choose:', {
  reply_markup: {
    inline_keyboard: [
      [{ text: 'Click', callback_data: 'clicked' }],
      [{ text: 'Link', url: 'https://example.com' }]
    ]
  }
});

// Handle callback
bot.on('callback_query', async (query) => {
  await bot.answerCallbackQuery(query.id, { text: 'Clicked!' });
});

// Update keyboard
bot.editMessageReplyMarkup({ inline_keyboard: [...] }, {
  chat_id: chatId,
  message_id: messageId
});
```
