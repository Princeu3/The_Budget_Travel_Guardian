# 🛡️ The Travel Guardian

**Your guardian hunts while you sleep** - An autonomous AI-powered travel price monitoring system that tracks flights, hotels, and car rentals 24/7 and alerts you when prices match your budget.

[**🚀 Live Demo**](https://budgettravelguardian.netlify.app/) | [Raindrop Documentation](https://docs.liquidmetal.ai)

![Travel Guardian Platform](https://img.shields.io/badge/Status-Live-success)
![Powered by Raindrop](https://img.shields.io/badge/Powered%20by-Raindrop-blue)
![Netlify](https://img.shields.io/badge/Deployed%20on-Netlify-00C7B7)

## 🌟 What is Travel Guardian?

Travel Guardian is an intelligent travel deal monitoring system that:

- 🔍 **Continuously monitors** flight, hotel, and car rental prices every 30 seconds
- 🎯 **Smart targeting** - Only alerts when deals match your specific budget thresholds
- 📊 **Price history tracking** - See how prices change over time
- 🤖 **AI-powered** - Uses advanced AI to analyze and compare travel deals
- ⚡ **Real-time alerts** - Get notified immediately when prices drop to your budget

## ✨ Features

### 💰 Budget-Based Monitoring
Set custom budget thresholds for:
- Total trip budget
- Flight budget
- Hotel per night budget
- Car rental per day budget

### 📈 Price History Dashboard
- Visual price tracking over time
- Historical data for all your monitored trips
- Trend analysis and insights

### 🤖 Autonomous Agent
- Runs automatically in the background
- Checks prices every 30 seconds
- Smart filtering to only show relevant deals
- Persistent memory of your preferences

### 🛡️ Guardian Status
- Real-time status monitoring
- See when your guardian last checked prices
- Track active monitoring sessions

## 🚀 Quick Start

### Option 1: Deploy Your Own (Recommended)

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/LiquidMetal-AI/lm-raindrop-demos)

1. Click the "Deploy to Netlify" button above
2. Connect your GitHub account and create a new repository
3. Once deployed, go to your site's **Integrations** page
4. Install the **LiquidMetal** extension:
   - Sign up at [liquidmetal.ai](https://liquidmetal.ai) if you don't have an account
   - Get your API key from the Raindrop dashboard
   - Add the API key to the integration settings
   - Click **Provision Resources** to auto-create SmartBucket, SmartMemory, and SmartSQL instances
5. Trigger a new deploy to pick up the environment variables
6. Your Travel Guardian is ready to hunt! 🎯

### Option 2: Try the Live Demo

Visit [**budgettravelguardian.netlify.app**](https://budgettravelguardian.netlify.app/) to see it in action!

## 💻 Local Development

### Prerequisites

- [Node.js](https://nodejs.org/) v18.14+
- [Netlify CLI](https://docs.netlify.com/cli/get-started/) installed globally
- A [Raindrop account](https://liquidmetal.ai) with API key

### Setup

1. **Clone the repository:**

```bash
git clone https://github.com/LiquidMetal-AI/lm-raindrop-demos.git
cd lm-raindrop-demos/netlify-raindrop-demo
```

2. **Install dependencies:**

```bash
npm install
```

3. **Link to Netlify:**

```bash
netlify link
```

4. **Install the LiquidMetal integration:**
   - Go to your site's **Integrations** page in the Netlify dashboard
   - Search for **LiquidMetal** and add it
   - Provision resources with your Raindrop API key
   - This automatically configures all required environment variables

5. **Pull environment variables:**

```bash
netlify env:pull
```

6. **Start the development server:**

```bash
netlify dev
```

Visit [localhost:8888](http://localhost:8888) to see the app running locally.

## 🏗️ How It Works

### Architecture

```
┌─────────────────────────────────────┐
│   Astro Frontend                    │
│   (React components + API routes)  │
└──────────┬──────────────────────────┘
           │
           ├──> Netlify Serverless Functions
           │    ├─> /api/create-session (Creates guardian sessions)
           │    ├─> /api/check-prices (Price monitoring agent)
           │    ├─> /api/get-price-history (Historical data)
           │    └─> /api/agent (AI chat interface)
           │
           └──> Raindrop AI Infrastructure
                ├──> SmartMemory (Agent state & preferences)
                ├──> SmartSQL (Price history storage)
                └──> SmartBucket (Document search)
```

### Key Components

#### Frontend Pages
- **`/src/pages/index.astro`** - Landing page with guardian activation form
- **`/src/pages/dashboard.astro`** - Price monitoring dashboard and history

#### API Endpoints
- **`/src/pages/api/create-session.ts`** - Creates new monitoring sessions
- **`/src/pages/api/check-prices.ts`** - Core price checking agent (runs every 30s)
- **`/src/pages/api/get-price-history.ts`** - Retrieves historical price data
- **`/src/pages/api/agent.ts`** - AI chat agent with memory

#### Raindrop Integration
- **`/src/lib/raindrop.js`** - Raindrop SDK client wrapper

## 🔧 Environment Variables

The LiquidMetal integration automatically provisions these variables:

```bash
RAINDROP_API_KEY              # Your Raindrop API key
RAINDROP_SMARTBUCKET_NAME     # Document storage bucket
RAINDROP_SMARTMEMORY_NAME     # Agent memory storage
RAINDROP_SMARTSQL_NAME        # Price history database
RAINDROP_APPLICATION_NAME     # Application identifier
RAINDROP_APPLICATION_VERSION  # Version identifier
```

## 🛠️ Built With

- **[Astro](https://astro.build)** - Static site generation & server-side rendering
- **[React](https://react.dev)** - Interactive UI components
- **[Tailwind CSS](https://tailwindcss.com)** - Utility-first styling
- **[Netlify](https://netlify.com)** - Hosting, serverless functions, edge functions
- **[Raindrop](https://liquidmetal.ai)** - AI infrastructure platform
  - SmartMemory - Agent state and preference management
  - SmartSQL - Structured price data storage
  - SmartBucket - Document search and RAG
- **[Claude](https://anthropic.com/claude)** - AI model via Netlify Model Hub

## 📊 Project Structure

```
netlify-raindrop-demo/
├── src/
│   ├── pages/
│   │   ├── index.astro           # Landing page
│   │   ├── dashboard.astro       # Price monitoring dashboard
│   │   └── api/
│   │       ├── create-session.ts # Session creation
│   │       ├── check-prices.ts   # Price monitoring agent
│   │       ├── get-price-history.ts
│   │       └── agent.ts          # AI chat agent
│   ├── components/               # Reusable Astro components
│   ├── lib/
│   │   └── raindrop.js          # Raindrop client
│   ├── types/
│   │   └── travel.ts            # TypeScript types
│   └── styles/
│       └── globals.css          # Global styles
├── public/                       # Static assets
├── netlify/
│   └── edge-functions/          # Edge function handlers
├── astro.config.mjs             # Astro configuration
├── netlify.toml                 # Netlify deployment config
└── package.json                 # Dependencies
```

## 🎯 Use Cases

- **Budget Travelers** - Get alerts only when prices fit your budget
- **Flexible Planners** - Monitor multiple destinations simultaneously
- **Deal Hunters** - Track price trends and spot the best deals
- **Trip Planning** - Historical data helps you plan the best time to book

## 🤝 Contributing

Contributions are welcome! This is a demo project showcasing Raindrop + Netlify integration for AI-powered travel monitoring.

## 📚 Learn More

- [Raindrop Documentation](https://docs.liquidmetal.ai)
- [Netlify Documentation](https://docs.netlify.com)
- [Astro Documentation](https://docs.astro.build)
- [Netlify AI Gateway](https://docs.netlify.com/build/ai-gateway/overview/)

## 📝 License

This project is open source and available under the MIT License.

---

Built with 💙 by the LiquidMetal team | **[Try it now →](https://budgettravelguardian.netlify.app/)**
