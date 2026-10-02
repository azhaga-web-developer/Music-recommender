# Music Recommender

A React + Vite music recommender deployed as a static site on Netlify, with Netlify Functions for secret-backed API calls.

## Local setup

1. Install Node.js 20 or newer.
2. Copy `.env.example` to `.env` and fill in `GROQ_API_KEY` and `YOUTUBE_API_KEY`.
3. Run `npm install`, then `npm run dev`.

The Vite development server provides local `/api/chat` and `/api/youtube-search` routes. Keep API keys in `.env`; never prefix these secrets with `VITE_`, because Vite embeds `VITE_` variables in public browser code.

## Deploy to Netlify

1. Push the project to GitHub without `.env` or API keys.
2. Import the repository in Netlify. Use `npm run build` as the build command and `dist` as the publish directory; `netlify.toml` already configures both, the functions directory, Node 20, and `/api/*` function routes.
3. In Netlify site environment variables, add `GROQ_API_KEY` and `YOUTUBE_API_KEY` (available to functions and builds). Do not use `VITE_` prefixes.
4. Deploy the site. No Render service, MongoDB connection, or browser CORS configuration is needed for the current app.
5. Check the deployed page's browser Network panel: chat and YouTube search should use same-origin `/api/chat` and `/api/youtube-search` routes, with no localhost or API key in browser requests.

## Environment variables

- `GROQ_API_KEY` — required for the chatbot and AI recommendations; secret, server-side only.
- `YOUTUBE_API_KEY` — required for YouTube search used by playback; secret, server-side only. Restrict this Google key to the YouTube Data API v3 and set an appropriate quota in Google Cloud Console.

For local development these values go in the ignored `.env` file. For production configure them in Netlify's environment variable settings, then redeploy. Never commit `.env` or paste secret values into source files.