# Telegram Bot Development Guide

A comprehensive guide to building Telegram bots using different technologies and frameworks.

## 📚 Overview

This repository contains step-by-step tutorials and examples for creating Telegram bots using various programming languages and frameworks. Each folder contains detailed instructions, code examples, and best practices for building bots with that specific technology.

## 🚀 Available Guides

| Technology | Demo Link | Hosting |
|------------|-----------|---------|
| **[PHP](./php/)** | [telegram-bot-cne4.onrender.com](https://telegram-bot-cne4.onrender.com/) | Render (Docker) |
| **[Next.js](./nextjs/)** | [telegram-bot-nextjs-omega.vercel.app](https://telegram-bot-nextjs-omega.vercel.app/) | Vercel |
| **[Node.js](./nodejs/)** | Coming soon | Vercel |

📖 **[Webhook Setup Guide](./WEBHOOK_SETUP.md)** - All methods to register your webhook (URL, curl, etc.)

## 📖 What is a Telegram Bot?

A Telegram bot is a special account that does not require an additional phone number. Users can interact with bots by sending them messages, commands, and inline requests. Bots can be used for various purposes such as:

- Customer support
- Content delivery
- Interactive games
- Automation and notifications
- Integration with other services

## 🔑 Getting Started

Before you begin, you'll need:

1. **Telegram Account** - Make sure you have a Telegram account
2. **Bot Token** - Create a bot by talking to [@BotFather](https://t.me/botfather) on Telegram
3. **Development Environment** - Set up your preferred technology stack

### Creating Your First Bot

1. Open Telegram and search for [@BotFather](https://t.me/botfather)
2. Send `/newbot` command
3. Follow the instructions to name your bot
4. BotFather will provide you with a **Bot Token** (keep this secret!)
5. Choose a technology from the folders above and follow the guide

## 📁 Project Structure

```
.
├── README.md
├── WEBHOOK_SETUP.md
├── php/
│   ├── README.md
│   ├── Dockerfile
│   ├── webhook.php
│   └── DEPLOY.md
├── nextjs/
│   ├── README.md
│   ├── app/
│   └── DEPLOY.md
├── nodejs/
│   ├── README.md
│   ├── api/
│   ├── scripts/
│   └── vercel.json
├── tools/
│   ├── cli/
│   └── webhook-tester/
└── docs/
    ├── README.md
    ├── fundamentals/
    ├── messages/
    ├── keyboards/
    ├── security/
    ├── scaling/
    ├── monetization/
    ├── failures/
    ├── frameworks/
    ├── projects/
    └── best-practices/
```

## 📚 Documentation

- **[Docs Index](./docs/README.md)** – All concept guides and deep dives  
- **Fundamentals**: `docs/fundamentals/` – core concepts, setup, state, inline, files, testing  
- **Messaging & Keyboards**: `docs/messages/README.md`, `docs/keyboards/README.md`  
- **Security & Scaling**: `docs/security/README.md`, `docs/scaling/README.md`, `docs/failures/README.md`, `docs/best-practices/README.md`  
- **Monetization**: `docs/monetization/README.md`  
- **Frameworks**: `docs/frameworks/README.md`  
- **Project Patterns**: `docs/projects/README.md`

## 🔧 Tools

- `tools/cli/` – CLI helpers (e.g., set webhook, check webhook info)  
- `tools/webhook-tester/` – utilities for testing webhooks locally (ngrok, curl examples)

## 🛠️ Technologies Covered

- **PHP** - Server-side scripting language
- **Next.js** - React framework for production (recommended for Vercel)
- **Node.js** - JavaScript runtime for serverless deployment

## 📝 Contributing

Feel free to add more technology guides or improve existing ones!

## 📄 License

This project is open source and available for educational purposes.
