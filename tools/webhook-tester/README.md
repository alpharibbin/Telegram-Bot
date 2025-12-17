# Webhook Tester

Tools to test your webhook endpoint locally.

## Options

- **ngrok** - Expose local server to internet
- **localtunnel** - Free alternative to ngrok
- **Telegram Test Server** - Official test environment

## Usage

```bash
# Using ngrok
ngrok http 3000

# Set webhook to ngrok URL
curl "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://abc123.ngrok.io/api/webhook"
```

