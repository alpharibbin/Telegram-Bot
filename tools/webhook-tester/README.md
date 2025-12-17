# Webhook Tester

Helpers to test your webhook endpoint locally.

---

## 🧪 Options

- **ngrok** – Expose local server to the internet  
- **localtunnel** – Free alternative to ngrok  
- **curl** – Manually POST a fake update to your endpoint  

---

## 🌐 Using ngrok

1. Start your local bot server (e.g. on `http://localhost:3000`).
2. Run:

ngrok http 3000
```

3. You’ll get a public HTTPS URL like:
