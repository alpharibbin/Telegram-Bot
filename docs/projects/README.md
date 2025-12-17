# Real Bot Projects (No WebApps)

## 📖 Table of Contents

1. Moderation bot  
2. Subscription bot  
3. Notification bot  
4. File converter bot  
5. AI assistant bot  
6. Analytics bot  

---

## Moderation Bot
- Features: anti-spam, bad-word filter, link filter, flood control, admin commands.  
- Events: `message`, `new_chat_members`, `left_chat_member`, `chat_member`.  
- Data: warn counts, bans, allowlisted domains/users.

## Subscription Bot
- Payments: invoices → `pre_checkout_query` → `successful_payment`.  
- State: plan, expiry, renewals, grace period.  
- Commands: `/subscribe`, `/status`, `/cancel`.

## Notification Bot
- Triggers: webhooks from external systems; enqueue and fan-out.  
- Respect rate limits; per-user prefs (quiet hours, channels).  
- Reliability: store pending notifications; retry 429/5xx.

## File Converter Bot
- Flow: receive document → validate type/size → process (convert/resize/OCR) → send back.  
- Use temp storage; clean up; show progress (`chat_action`).  
- Enforce size (<=20MB Bot API download) and allowlist types.

## AI Assistant Bot
- Commands: `/ask`, `/summarize`, `/translate`, `/explain`.  
- Context: short-term history; safety filters; per-user quotas.  
- Cost control: quotas, fallbacks if AI API fails.

## Analytics Bot
- Collect events: command usage, DAU/WAU, retention, conversion.  
- Dashboards: Prometheus/Grafana or external BI.  
- Privacy: minimize PII; anonymize where possible.

---

## Project Templates
- Start with minimal router + handlers + config.  
- Add logging/metrics early.  
- Use `.env` for secrets + `.env.example`.  
- Add health checks and graceful shutdown for production.

