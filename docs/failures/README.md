# Bot Failures & Edge Cases

## 📖 Table of Contents

1. Telegram downtime handling  
2. Duplicate updates  
3. Partial updates  
4. Webhook delivery failures  
5. Message conflicts  
6. Bot restarts  

---

## Telegram Downtime Handling
- Expect 5xx/timeouts; retry with backoff.  
- Degrade gracefully: queue outbound messages; show friendly “retrying” messages.  
- Health checks: mark degraded when Telegram unreachable.  
- Circuit breaker to avoid cascading failures.

---

## Duplicate Updates
- Track `update_id`; ignore older than last processed.  
- Make handlers idempotent (upsert by business key).  
- Cache media by `file_unique_id`.
```javascript
if (update.update_id <= lastProcessed) return;
lastProcessed = update.update_id;
```

---

## Partial Updates
- Many fields are optional; guard all access.  
- `callback_query.message` may be null for inline-origin callbacks.  
- Service messages may lack text.

---

## Webhook Delivery Failures
- Telegram retries on non-200; keep handler fast (<5s ideally).  
- Respond 200 early; push heavy work to queue.  
- Monitor non-2xx spikes; verify SSL and public reachability.

---

## Message Conflicts
- Edits/deletes can race; catch 400/409 and ignore when safe.  
- Inline keyboard edits: ignore “message is not modified.”  
- Pinned messages: check permissions; retry or skip.

---

## Bot Restarts
- Graceful shutdown: stop polling, drain queues, close DB.  
- Persist sessions/state in Redis/DB.  
- On startup: restore in-flight jobs, validate token, warm caches.  
- Use process manager (PM2/systemd/K8s) for auto-restart.

