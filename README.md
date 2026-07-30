# 🎮 Game Backlog Tracker

A full-stack app for tracking your game backlog, rating what you've completed, and getting AI-powered recommendations for what to play next; built to solve my own real problem of a backlog with way too many unplayed games.

---

## Features

- 🔍 **Search & add games** via the IGDB API — real cover art, descriptions, and ratings
- 📥 **Steam library import** — pull in your existing Steam games automatically, with a review screen to confirm matches before importing
- ⏱️ **HowLongToBeat integration** — see estimated completion time for every game
- ⭐ **Personal ratings & notes** — rate games you've completed and compare your score against IGDB's blended critic/user rating
- 🤖 **AI-powered recommendations** — Claude analyzes your rating history and suggests what to play next from your backlog, with reasoning tied to your actual taste
- 🔐 **Full authentication** — email/password auth with protected routes and row-level security

## Tech Stack

- **Framework:** Next.js 15 (App Router) + TypeScript
- **Styling:** Tailwind CSS
- **Database:** PostgreSQL via Supabase
- **ORM:** Drizzle
- **Auth:** Supabase Auth
- **AI:** Anthropic Claude API
- **External APIs:** IGDB (game metadata, time-to-beat), Steam Web API (library import)
- **Hosting:** Vercel


### Prerequisites
- Node.js 20+
- A [Supabase](https://supabase.com) project
- API keys: [IGDB/Twitch](https://dev.twitch.tv/console), [Steam Web API](https://steamcommunity.com/dev/apikey), [Anthropic](https://console.anthropic.com)
