# Playloggd

A full stack app for tracking your game backlog, rating what you've completed, organizing custom lists, and getting AI powered recommendations for what to play next. I built this to solve a real problem I had: an ever growing backlog of games I owned but never actually got around to playing.

[**Live demo:**](https://game-backlog-tracker-seven.vercel.app/)

## What it does

- Search for games and add them to your backlog, with real cover art, descriptions, and ratings pulled from IGDB
- Import your entire Steam library in one go, with a review screen so you can confirm matches before anything gets added
- See how long a game takes to beat, and compare your own rating against IGDB's blended critic and user score
- Rate games you've completed, leave notes, and track status across backlog, playing, completed, and dropped
- Get an AI recommendation for what to play next, based on what you've actually rated and enjoyed, with reasoning tied to your specific taste
- Build custom lists (wishlists, genre collections, whatever you want), with drag and drop reordering and the ability to add games you don't even own yet
- A stats page showing your library at a glance: genre breakdown, completion status, and how your ratings compare to critic averages
- Light and dark mode, with a custom color theme

## Tech stack

- Next.js 15 (App Router) with TypeScript
- Tailwind CSS
- PostgreSQL, hosted on Supabase
- Drizzle ORM
- Supabase Auth, with row level security enforced at the database level
- Anthropic's Claude API for recommendations
- IGDB for game metadata and completion times
- Steam Web API for library import
- dnd kit for drag and drop list reordering
- Recharts for the stats page
- Hosted on Vercel

## Some of the harder problems I ran into

Matching a Steam library to IGDB entries turned out to be a genuinely tricky problem. Steam and IGDB don't always agree on how a game is named: especially with differing symbols, suffixes, and spacing." I ended up building a layered matching system: try an exact match first, fall back to a cleaned up version of the name, then fall back to a fuzzy search ranked by popularity. Even with all of that, automated matching isn't perfect, so I built a review screen where you confirm or fix matches before anything actually gets imported, rather than trusting the algorithm blindly.

I also learned the hard way that third party APIs can just stop working. I originally pulled completion time data from an unofficial HowLongToBeat scraper package, which turned out to be broken because of an unpatched change on HowLongToBeat's end. I switched to IGDB's own time to beat endpoint instead, and made sure every external call in the app degrades gracefully rather than crashing if a service is slow or unavailable.

## Getting started

You'll need Node 20 or later, a Supabase project, and API keys for IGDB (via Twitch's developer console), the Steam Web API, and Anthropic.

\`\`\`bash
git clone https://github.com/adam5192/game-backlog-tracker.git
cd game-backlog-tracker
npm install
\`\`\`

Create a `.env.local` file with the following:

\`\`\`
DATABASE_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
IGDB_CLIENT_ID=
IGDB_CLIENT_SECRET=
STEAM_API_KEY=
ANTHROPIC_API_KEY=
\`\`\`

Generate and apply the database schema:

\`\`\`bash
npx drizzle-kit generate
\`\`\`

Then copy the generated SQL from the `drizzle` folder into your Supabase project's SQL Editor and run it there.

Start the dev server:

\`\`\`bash
npm run dev
\`\`\`

## License

MIT
