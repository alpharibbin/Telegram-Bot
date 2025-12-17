# Inline Mode

A complete guide to building inline bots that work in any chat.

---

## 📖 Table of Contents

1. [Inline Queries](#inline-queries)
2. [Inline Results](#inline-results)
3. [Caching Inline Results](#caching-inline-results)
4. [Performance Considerations](#performance-considerations)
5. [Inline UX Patterns](#inline-ux-patterns)

---

## Inline Queries

Inline mode allows users to use your bot in any chat by typing `@yourbot query`.

### Enabling Inline Mode

```
1. Open @BotFather
2. Send /mybots
3. Select your bot
4. Bot Settings → Inline Mode → Turn on
5. Optionally set inline placeholder text
```

### How Inline Mode Works

```
┌─────────────────────────────────────────────────────────────┐
│  User types: @yourbot search query                          │
│                    │                                         │
│                    ▼                                         │
│  Telegram sends InlineQuery to your bot                     │
│                    │                                         │
│                    ▼                                         │
│  Bot processes query and returns InlineQueryResults         │
│                    │                                         │
│                    ▼                                         │
│  User sees results in popup above keyboard                  │
│                    │                                         │
│                    ▼                                         │
│  User taps result → Message sent to current chat            │
└─────────────────────────────────────────────────────────────┘
```

### Basic Inline Query Handler

```javascript
bot.on('inline_query', async (query) => {
  const queryId = query.id;
  const queryText = query.query;
  const userId = query.from.id;
  
  console.log(`Inline query: "${queryText}" from user ${userId}`);
  
  // Return results
  const results = [
    {
      type: 'article',
      id: '1',
      title: 'Result 1',
      description: 'Description for result 1',
      input_message_content: {
        message_text: 'You selected Result 1!'
      }
    }
  ];
  
  await bot.answerInlineQuery(queryId, results);
});
```

### Inline Query Object

```javascript
{
  id: "unique_query_id",
  from: {
    id: 12345678,
    first_name: "John",
    username: "johndoe"
  },
  query: "search text",           // What user typed after @bot
  offset: "",                      // For pagination
  chat_type: "sender",            // private, group, supergroup, channel
  location: {                      // If bot requests location
    latitude: 40.7128,
    longitude: -74.0060
  }
}
```

### Query with Location

Enable location-based inline queries via BotFather:

```
/mybots → Select bot → Bot Settings → Inline Mode → Inline Location
```

```javascript
bot.on('inline_query', async (query) => {
  if (query.location) {
    const { latitude, longitude } = query.location;
    const nearbyResults = await findNearby(latitude, longitude, query.query);
    // Return location-based results
  }
});
```

---

## Inline Results

Different types of results you can return.

### Result Types Overview

| Type | Description | Sends |
|------|-------------|-------|
| `article` | Generic result | Text message |
| `photo` | Photo result | Photo |
| `gif` | GIF animation | GIF |
| `mpeg4_gif` | MP4 animation | Video |
| `video` | Video | Video |
| `audio` | Audio file | Audio |
| `voice` | Voice message | Voice |
| `document` | Document | Document |
| `location` | Location | Location |
| `venue` | Venue | Venue |
| `contact` | Contact | Contact |
| `sticker` | Sticker | Sticker |
| `game` | Game | Game |

### Article Result (Most Common)

```javascript
{
  type: 'article',
  id: 'unique_id_1',
  title: 'Article Title',
  description: 'Short description shown below title',
  thumb_url: 'https://example.com/thumb.jpg',
  thumb_width: 48,
  thumb_height: 48,
  input_message_content: {
    message_text: 'This is the message that will be sent',
    parse_mode: 'HTML'
  },
  reply_markup: {
    inline_keyboard: [
      [{ text: 'Open Link', url: 'https://example.com' }]
    ]
  }
}
```

### Photo Result

```javascript
// From URL
{
  type: 'photo',
  id: 'photo_1',
  photo_url: 'https://example.com/photo.jpg',
  thumb_url: 'https://example.com/thumb.jpg',
  photo_width: 800,
  photo_height: 600,
  title: 'Photo Title',
  description: 'Photo description',
  caption: 'Caption for the photo',
  parse_mode: 'HTML'
}

// From cached file_id
{
  type: 'photo',
  id: 'photo_2',
  photo_file_id: 'AgACAgIAAxk...',
  title: 'Cached Photo',
  caption: 'From cache'
}
```

### GIF Result

```javascript
{
  type: 'gif',
  id: 'gif_1',
  gif_url: 'https://example.com/animation.gif',
  thumb_url: 'https://example.com/thumb.jpg',
  gif_width: 320,
  gif_height: 240,
  title: 'Funny GIF',
  caption: 'Check this out!'
}
```

### Video Result

```javascript
{
  type: 'video',
  id: 'video_1',
  video_url: 'https://example.com/video.mp4',
  mime_type: 'video/mp4',
  thumb_url: 'https://example.com/thumb.jpg',
  title: 'Video Title',
  description: 'Video description',
  video_width: 1920,
  video_height: 1080,
  video_duration: 120,
  caption: 'Video caption'
}
```

### Audio Result

```javascript
{
  type: 'audio',
  id: 'audio_1',
  audio_url: 'https://example.com/song.mp3',
  title: 'Song Title',
  performer: 'Artist Name',
  audio_duration: 240,
  caption: 'Great song!'
}
```

### Document Result

```javascript
{
  type: 'document',
  id: 'doc_1',
  document_url: 'https://example.com/file.pdf',
  mime_type: 'application/pdf',
  title: 'Document Title',
  description: 'PDF document',
  thumb_url: 'https://example.com/thumb.jpg',
  caption: 'Here is the document'
}
```

### Location Result

```javascript
{
  type: 'location',
  id: 'loc_1',
  latitude: 40.7128,
  longitude: -74.0060,
  title: 'New York City',
  thumb_url: 'https://example.com/map_thumb.jpg'
}
```

### Venue Result

```javascript
{
  type: 'venue',
  id: 'venue_1',
  latitude: 40.7580,
  longitude: -73.9855,
  title: 'Times Square',
  address: 'Manhattan, NY 10036',
  foursquare_id: '4b8...',
  foursquare_type: 'arts_entertainment/default'
}
```

### Contact Result

```javascript
{
  type: 'contact',
  id: 'contact_1',
  phone_number: '+1234567890',
  first_name: 'John',
  last_name: 'Doe',
  vcard: 'BEGIN:VCARD...'
}
```

### Sticker Result

```javascript
{
  type: 'sticker',
  id: 'sticker_1',
  sticker_file_id: 'CAACAgIAAxk...'
}
```

### Complete Example with Multiple Types

```javascript
bot.on('inline_query', async (query) => {
  const searchTerm = query.query.toLowerCase();
  
  const results = [];
  
  // Search articles
  const articles = await searchArticles(searchTerm);
  articles.forEach((article, i) => {
    results.push({
      type: 'article',
      id: `article_${i}`,
      title: article.title,
      description: article.excerpt,
      thumb_url: article.thumbnail,
      input_message_content: {
        message_text: `<b>${article.title}</b>\n\n${article.content}`,
        parse_mode: 'HTML'
      },
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Read Full Article', url: article.url }]
        ]
      }
    });
  });
  
  // Search images
  const images = await searchImages(searchTerm);
  images.forEach((img, i) => {
    results.push({
      type: 'photo',
      id: `photo_${i}`,
      photo_url: img.url,
      thumb_url: img.thumbnail,
      title: img.title,
      caption: img.caption
    });
  });
  
  await bot.answerInlineQuery(query.id, results.slice(0, 50)); // Max 50 results
});
```

---

## Caching Inline Results

Optimize performance with result caching.

### Server-Side Caching (Telegram)

```javascript
bot.on('inline_query', async (query) => {
  const results = await getResults(query.query);
  
  await bot.answerInlineQuery(query.id, results, {
    cache_time: 300,        // Cache for 5 minutes (default: 300)
    is_personal: false      // Same results for all users
  });
});
```

### Cache Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `cache_time` | Integer | Seconds to cache (0-86400, default 300) |
| `is_personal` | Boolean | Different results per user |
| `next_offset` | String | Offset for pagination |
| `switch_pm_text` | String | Button to switch to PM |
| `switch_pm_parameter` | String | Deep link parameter |

### Personal vs Global Cache

```javascript
// Global cache - same results for everyone
await bot.answerInlineQuery(query.id, results, {
  cache_time: 3600,  // 1 hour
  is_personal: false
});

// Personal cache - different per user
await bot.answerInlineQuery(query.id, results, {
  cache_time: 60,    // 1 minute
  is_personal: true
});
```

### When to Use Personal Cache

```javascript
bot.on('inline_query', async (query) => {
  const userId = query.from.id;
  
  // Personal: User-specific data
  if (query.query.startsWith('my ')) {
    const userItems = await getUserItems(userId);
    return bot.answerInlineQuery(query.id, userItems, {
      is_personal: true,
      cache_time: 60
    });
  }
  
  // Global: Same for everyone
  const publicResults = await searchPublic(query.query);
  return bot.answerInlineQuery(query.id, publicResults, {
    is_personal: false,
    cache_time: 300
  });
});
```

### Application-Level Caching

```javascript
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 300 });

bot.on('inline_query', async (query) => {
  const cacheKey = `inline:${query.query.toLowerCase()}`;
  
  // Check cache
  let results = cache.get(cacheKey);
  
  if (!results) {
    // Fetch fresh results
    results = await fetchResults(query.query);
    cache.set(cacheKey, results);
  }
  
  await bot.answerInlineQuery(query.id, results, {
    cache_time: 300
  });
});
```

### Redis Caching for Scale

```javascript
const Redis = require('ioredis');
const redis = new Redis();

async function getCachedResults(query) {
  const key = `inline:${query.toLowerCase()}`;
  const cached = await redis.get(key);
  
  if (cached) {
    return JSON.parse(cached);
  }
  
  const results = await fetchResults(query);
  await redis.setex(key, 300, JSON.stringify(results));
  
  return results;
}

bot.on('inline_query', async (query) => {
  const results = await getCachedResults(query.query);
  await bot.answerInlineQuery(query.id, results);
});
```

---

## Performance Considerations

Optimizing inline bot performance.

### Response Time Requirements

```
┌─────────────────────────────────────────────────────────────┐
│  Telegram expects response within ~10 seconds               │
│                                                              │
│  User Experience:                                            │
│  • < 500ms  → Excellent (feels instant)                     │
│  • < 1s     → Good                                          │
│  • < 2s     → Acceptable                                    │
│  • > 3s     → Poor (user may give up)                       │
└─────────────────────────────────────────────────────────────┘
```

### Debouncing Queries

Users type continuously - don't process every keystroke:

```javascript
const pendingQueries = new Map();

bot.on('inline_query', async (query) => {
  const userId = query.from.id;
  
  // Cancel previous pending query
  if (pendingQueries.has(userId)) {
    clearTimeout(pendingQueries.get(userId));
  }
  
  // Debounce: wait 300ms before processing
  pendingQueries.set(userId, setTimeout(async () => {
    pendingQueries.delete(userId);
    
    const results = await fetchResults(query.query);
    await bot.answerInlineQuery(query.id, results);
  }, 300));
});
```

### Pagination with Offset

```javascript
const RESULTS_PER_PAGE = 20;

bot.on('inline_query', async (query) => {
  const offset = parseInt(query.offset) || 0;
  
  const allResults = await fetchResults(query.query);
  const pageResults = allResults.slice(offset, offset + RESULTS_PER_PAGE);
  
  const nextOffset = offset + RESULTS_PER_PAGE < allResults.length
    ? String(offset + RESULTS_PER_PAGE)
    : '';
  
  await bot.answerInlineQuery(query.id, pageResults, {
    next_offset: nextOffset
  });
});
```

### Lazy Loading Thumbnails

```javascript
// Generate results without waiting for thumbnails
bot.on('inline_query', async (query) => {
  const items = await searchDatabase(query.query);
  
  const results = items.map((item, i) => ({
    type: 'article',
    id: `item_${i}`,
    title: item.title,
    description: item.description,
    // Use placeholder or cached thumbnail
    thumb_url: item.cached_thumb || 'https://example.com/placeholder.jpg',
    input_message_content: {
      message_text: item.content
    }
  }));
  
  // Respond immediately
  await bot.answerInlineQuery(query.id, results);
  
  // Update thumbnails in background (for next query)
  items.forEach(item => {
    if (!item.cached_thumb) {
      generateThumbnail(item.id);
    }
  });
});
```

### Parallel Processing

```javascript
bot.on('inline_query', async (query) => {
  const searchTerm = query.query;
  
  // Fetch from multiple sources in parallel
  const [articles, images, videos] = await Promise.all([
    searchArticles(searchTerm),
    searchImages(searchTerm),
    searchVideos(searchTerm)
  ]);
  
  const results = [
    ...articles.map(formatArticle),
    ...images.map(formatImage),
    ...videos.map(formatVideo)
  ];
  
  await bot.answerInlineQuery(query.id, results.slice(0, 50));
});
```

### Rate Limiting

```javascript
const Bottleneck = require('bottleneck');

const limiter = new Bottleneck({
  maxConcurrent: 10,
  minTime: 100  // 10 requests per second
});

bot.on('inline_query', async (query) => {
  await limiter.schedule(async () => {
    const results = await fetchResults(query.query);
    await bot.answerInlineQuery(query.id, results);
  });
});
```

---

## Inline UX Patterns

Best practices for inline bot user experience.

### Empty Query Handling

```javascript
bot.on('inline_query', async (query) => {
  if (!query.query.trim()) {
    // Show suggestions when query is empty
    const suggestions = [
      {
        type: 'article',
        id: 'help',
        title: '💡 How to use this bot',
        description: 'Type your search query after @botname',
        input_message_content: {
          message_text: 'Use @botname <query> to search!'
        }
      },
      {
        type: 'article',
        id: 'recent_1',
        title: '🕐 Recent: Last search term',
        description: 'Tap to search again',
        input_message_content: {
          message_text: 'Result for: Last search term'
        }
      }
    ];
    
    return bot.answerInlineQuery(query.id, suggestions);
  }
  
  // Normal search
  const results = await search(query.query);
  await bot.answerInlineQuery(query.id, results);
});
```

### No Results Feedback

```javascript
bot.on('inline_query', async (query) => {
  const results = await search(query.query);
  
  if (results.length === 0) {
    return bot.answerInlineQuery(query.id, [{
      type: 'article',
      id: 'no_results',
      title: '😕 No results found',
      description: `No matches for "${query.query}"`,
      input_message_content: {
        message_text: `No results found for: ${query.query}`
      }
    }]);
  }
  
  await bot.answerInlineQuery(query.id, results);
});
```

### Switch to Private Message

```javascript
bot.on('inline_query', async (query) => {
  // Check if user needs to authenticate
  const isAuthenticated = await checkAuth(query.from.id);
  
  if (!isAuthenticated) {
    return bot.answerInlineQuery(query.id, [], {
      switch_pm_text: '🔐 Login to use this bot',
      switch_pm_parameter: 'login'
    });
  }
  
  // Normal flow for authenticated users
  const results = await search(query.query);
  await bot.answerInlineQuery(query.id, results);
});

// Handle the deep link
bot.onText(/\/start login/, async (msg) => {
  await bot.sendMessage(msg.chat.id, 
    'Welcome! Please authenticate:',
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Login with Google', url: 'https://example.com/auth' }]
        ]
      }
    }
  );
});
```

### Category Suggestions

```javascript
const CATEGORIES = ['movies', 'music', 'books', 'games'];

bot.on('inline_query', async (query) => {
  const text = query.query.toLowerCase();
  
  // Show categories if no specific query
  if (!text || text.length < 2) {
    const categoryResults = CATEGORIES.map(cat => ({
      type: 'article',
      id: `cat_${cat}`,
      title: `📁 ${cat.charAt(0).toUpperCase() + cat.slice(1)}`,
      description: `Browse ${cat}`,
      input_message_content: {
        message_text: `Browsing ${cat}...`
      }
    }));
    
    return bot.answerInlineQuery(query.id, categoryResults);
  }
  
  // Search within category or general
  const results = await search(text);
  await bot.answerInlineQuery(query.id, results);
});
```

### Preview with Buttons

```javascript
bot.on('inline_query', async (query) => {
  const products = await searchProducts(query.query);
  
  const results = products.map(product => ({
    type: 'article',
    id: product.id,
    title: product.name,
    description: `$${product.price} - ${product.description}`,
    thumb_url: product.image,
    input_message_content: {
      message_text: `<b>${product.name}</b>\n` +
        `💰 Price: $${product.price}\n` +
        `📝 ${product.description}`,
      parse_mode: 'HTML'
    },
    reply_markup: {
      inline_keyboard: [
        [
          { text: '🛒 Buy Now', url: product.buyUrl },
          { text: '❤️ Save', callback_data: `save_${product.id}` }
        ],
        [
          { text: '📤 Share', switch_inline_query: product.name }
        ]
      ]
    }
  }));
  
  await bot.answerInlineQuery(query.id, results);
});
```

### Chosen Inline Result Tracking

```javascript
// Enable via BotFather: /setinlinefeedback

bot.on('chosen_inline_result', async (result) => {
  console.log('User chose result:', {
    resultId: result.result_id,
    userId: result.from.id,
    query: result.query
  });
  
  // Track for analytics
  await trackInlineUsage(result.from.id, result.result_id, result.query);
});
```

---

## Quick Reference

```javascript
// Basic inline handler
bot.on('inline_query', async (query) => {
  const results = [
    {
      type: 'article',
      id: '1',
      title: 'Title',
      input_message_content: { message_text: 'Content' }
    }
  ];
  
  await bot.answerInlineQuery(query.id, results, {
    cache_time: 300,
    is_personal: false
  });
});

// With pagination
await bot.answerInlineQuery(query.id, results, {
  next_offset: '20'
});

// Switch to PM
await bot.answerInlineQuery(query.id, [], {
  switch_pm_text: 'Click to setup',
  switch_pm_parameter: 'setup'
});

// Track chosen result
bot.on('chosen_inline_result', (result) => {
  console.log(result.result_id);
});
```

