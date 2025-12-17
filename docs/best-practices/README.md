# Bot Best Practices

## 📖 Table of Contents

1. Bot UX rules  
2. Performance optimization  
3. Idempotent handlers  
4. Stateless design  
5. Clean command design  
6. Versioning bots  

---

## Bot UX Rules
- Respond fast: acknowledge within 1–2s; use chat actions (`typing`, `upload_photo`).  
- Keep replies concise; avoid walls of text.  
- Use keyboards for primary actions; keep buttons few and clear.  
- Provide `/help` and `/start` that always work.  
- Confirm destructive actions; provide cancel/back.  
- Be polite on errors; suggest next steps.

## Performance Optimization
- For webhooks: respond 200 immediately; process heavy work async/queue.  
- Cache expensive calls (Redis); reuse `file_id` for media.  
- Batch when possible; respect rate limits (token bucket).  
- Use HTTP keep-alive for downstream calls.

## Idempotent Handlers
- Ensure each update is safe to reprocess.  
- Upsert by business key (order_id, message_id).  
- Sending messages: handle 400/409/429; retry only when safe.

## Stateless Design
- Store sessions/state in Redis/DB, not memory.  
- Put necessary context in `callback_data` or external store.  
- Make instances interchangeable; support horizontal scaling.

## Clean Command Design
- Lowercase, underscores; clear descriptions.  
- Scope commands by context (private vs group vs admin).  
- Keep command lists short; prioritize top actions.

## Versioning Bots
- Use feature flags for gradual rollout.  
- Version callback_data payloads for compatibility.  
- Communicate breaking changes; track bot version in logs/metrics.

