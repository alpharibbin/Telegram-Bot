# Bot Monetization

## 📖 Table of Contents

1. Telegram Payments API  
2. Subscriptions via bots  
3. Premium commands  
4. Access-controlled bots  
5. Usage-based limits  
6. Compliance & fees  

---

## Telegram Payments API
- Supports multiple providers (varies by region).  
- Flow: `sendInvoice` → user pays in-app → Telegram sends `pre_checkout_query` → you confirm with `answerPreCheckoutQuery` → you receive `successful_payment`.  
- Use test vs live `provider_token` from BotFather.  
- Prices use minor units (cents). Up to 99 items.  
- Shipping: handle `shipping_query` if `is_flexible` is set.

**Minimal invoice (node-telegram-bot-api):**
```javascript
bot.sendInvoice(chatId, {
  title: 'Premium Plan',
  description: '1-month premium access',
  payload: 'order_123',
  provider_token: process.env.PROVIDER_TOKEN,
  currency: 'USD',
  prices: [{ label: 'Premium', amount: 499 }],
  start_parameter: 'premium'
});

bot.on('pre_checkout_query', (q) => {
  bot.answerPreCheckoutQuery(q.id, true);
});

bot.on('message', (msg) => {
  if (msg.successful_payment) {
    // grant access here
  }
});
```

Tips:
- Store receipts: `payload`, `provider_payment_charge_id`, `telegram_payment_charge_id`.
- Idempotency: upsert subscription by `telegram_payment_charge_id`.
- Digital goods only; implement shipping if delivering physical goods.

---

## Subscriptions via Bots
- Persist plan, start, end, status in DB.  
- On payment success: set expiry; grant role/flag.  
- Renewal: send reminder before expiry with invoice link.  
- Free trials: track `trial_used`; set trial end.  
- Grace period: optionally keep access for N hours after expiry.

Schema idea:
```
users: { id, is_premium, plan, expires_at }
payments: { id, user_id, amount, currency, payload, telegram_charge_id, provider_charge_id, status }
```

---

## Premium Commands
- Gate handlers by plan:
```javascript
function requirePremium(handler) {
  return async (msg, ...args) => {
    const user = await db.users.findOne({ id: msg.from.id });
    const active = user?.is_premium && user.expires_at > Date.now();
    if (!active) {
      return bot.sendMessage(msg.chat.id, '🔒 Premium only. Upgrade?');
    }
    return handler(msg, ...args);
  };
}
```
- Offer upsell inline buttons linking to /buy (deep link).  
- Rate limits by tier (e.g., free 5/day, pro 100/day).

---

## Access-Controlled Bots
- Allow/deny lists.  
- Lock to specific groups/channels: validate `chat.id`.  
- Org bots: map Telegram user → internal account; require login token.  
- Ephemeral access links: deep link `?start=signed_token` and verify server-side.

---

## Usage-Based Limits
- Track usage per user/command/day.  
- Redis counters with TTL:
```javascript
const key = `usage:${userId}:ask:${date}`;
const count = await redis.incr(key);
if (count === 1) await redis.expire(key, 86400);
if (count > 20) return bot.sendMessage(chatId, 'Limit reached');
```
- Soft vs hard limits; warn at 80/90/100%.

---

## Compliance & Fees
- Follow Telegram ToS; avoid prohibited goods/content.  
- Handle taxes (VAT/GST) in pricing.  
- Refunds/chargebacks: revoke access when provider notifies.  
- Regional availability varies by provider.  
- Be transparent about pricing, renewals, and support contact.

