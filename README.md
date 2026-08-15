# Playloggd

A full stack app for tracking your game backlog, rating what you've completed, organizing custom lists, and getting AI powered recommendations for what to play next. I built this to solve a real problem I had: an ever growing backlog of games I owned but never actually got around to playing.

**Live demo:** https://playloggd.adammokdad.com (click "Try the demo" on the landing page to explore without signing up)

## What it does

<p align="center">
  <img width="440" alt="dashboard" src="https://github.com/user-attachments/assets/a692ff89-b940-4477-bac9-38c875f3fea1" />
  <img width="440" alt="stats" src="https://github.com/user-attachments/assets/28bca031-985a-4780-b2d2-758d507cdaf7" />
  <img width="440" alt="lists" src="https://github.com/user-attachments/assets/75fa025f-a33d-412c-b01a-0067351a9d90" />
  <img width="440" alt="game view" src="https://github.com/user-attachments/assets/cde4a4a0-ecd0-4549-8d3f-0d964ac6e003" />
</p>


**Tracking your library**
- Search for games and add them to your backlog, with cover art, descriptions, and ratings pulled from IGDB
- Track status across backlog, playing, completed, and dropped
- Rate games you've completed with a star rating, and leave your own notes
- Compare your rating against IGDB's blended critic and user score
- See how long a game takes to beat, main story or full completion

**Importing your library**
- Import your entire Steam library in one request, with live progress as it matches each game
- A review screen lets you confirm or fix matches, set a status per game, or auto sort by playtime before anything actually gets added
- A built in guide walks through finding your Steam profile URL and making your game details public, since that trips people up

**AI recommendations**
- Claude looks at what you've rated and enjoyed and recommends what to play next from your backlog, with reasoning tied to your actual taste
- Recommendations are cached per user for 24 hours, with arrows to browse between the picks it already generated and a manual refresh once the cooldown passes

**Lists**
- Build custom lists, anything from a genre collection to a wishlist of games you don't own yet
- Add games either from your existing library or by searching fresh
- Drag and drop to reorder, click into any game for the full detail view

**Stats**
- A dashboard of your library at a glance: total games, completion count, your average rating versus the critic average, genre breakdown, and a status breakdown chart

**Other**
- Search, filter by genre, and sort your whole library from the dashboard
- Light and dark mode with a custom color theme
- Email and password auth with email confirmation, a proper forgot password flow, and Google sign in
- A shared demo account so people can look around without creating an account

## Tech stack

- Next.js 15 (App Router) with TypeScript
- Tailwind CSS
- PostgreSQL, hosted on Supabase
- Drizzle ORM
- Supabase Auth (email and password, Google OAuth), with row level security enforced at the database level
- Anthropic's Claude API for recommendations
- IGDB for game metadata and completion times
- Steam Web API for library import
- Resend for transactional email, since Supabase's default sender has a very low rate limit
- Upstash Redis for rate limiting across serverless instances
- dnd kit for drag and drop list reordering
- Recharts for the stats page
- Hosted on Vercel

## Some of the harder problems I ran into

Matching a Steam library to IGDB entries turned out to be a genuinely tricky problem. Steam and IGDB don't always agree on how a game is named: especially with differing symbols, suffixes, and spacing." I ended up building a layered matching system: try an exact match first, fall back to a cleaned up version of the name, then fall back to a fuzzy search ranked by popularity. Even with all of that, automated matching isn't perfect, so I built a review screen where you confirm or fix matches before anything actually gets imported, rather than trusting the algorithm blindly. 

I also learned the hard way that third party APIs can just stop working. I originally pulled completion time data from an unofficial HowLongToBeat scraper package, which turned out to be broken because of an unpatched change on HowLongToBeat's end. I switched to IGDB's own time to beat endpoint instead, and made sure every external call in the app degrades gracefully rather than crashing if a service is slow or unavailable.

I had a serverless specific bug that only showed up after deploying: my first pass at rate limiting the AI recommendations endpoint used a plain in memory object to track request timestamps, which worked fine locally but was inconsistent in production, since Vercel runs API routes as separate serverless instances that don't share memory. I moved it to Upstash Redis instead, so the limit is enforced against one shared source of truth no matter which instance handles a given request.


## Getting started

You'll need Node 20 or later, a Supabase project, and API keys for IGDB (via Twitch's developer console), the Steam Web API, Anthropic, and Upstash Redis. Resend is optional locally, since you can disable email confirmation in Supabase while developing.

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
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
DEMO_EMAIL=
DEMO_PASSWORD=
\`\`\`

Generate and apply the database schema:

\`\`\`bash
npx drizzle-kit generate
\`\`\`

Then copy the generated SQL from the `drizzle` folder into your Supabase project's SQL Editor and run it there. Row level security policies are also documented in `drizzle/0002_rls_policies.sql` for reference.

Start the dev server:

\`\`\`bash
npm run dev
\`\`\`

## What I'd add next

- The ability to make your list public for all users to see
- Public reviews like letterboxd

## License

MIT
