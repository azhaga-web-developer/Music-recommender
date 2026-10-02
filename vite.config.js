import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { handleGroqChat } from './server/groq-chat.js'
import { handleYoutubeSearch } from './server/youtube-search.js'

function localApi(apiKey, path, handleRequest) {
  return {
    name: `local-${path.replaceAll('/', '-')}-api`,
    configureServer(server) {
      server.middlewares.use(path, async (req, res) => {
        if (req.method !== 'POST' && req.method !== 'GET') {
          res.writeHead(405, { 'Content-Type': 'application/json', Allow: 'GET, POST' })
          res.end(JSON.stringify({ error: 'Method not allowed.' }))
          return
        }

        try {
          const result = await handleRequest(req, apiKey)
          res.writeHead(result.status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' })
          res.end(JSON.stringify(result.body))
        } catch {
          res.writeHead(400, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'Invalid request. Please try again.' }))
        }
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [
      react(),
      localApi(env.GROQ_API_KEY, '/api/chat', async (req, apiKey) => {
        if (req.method !== 'POST') return { status: 405, body: { error: 'Method not allowed.' } }
        const chunks = []
        for await (const chunk of req) chunks.push(chunk)
        const body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')
        return handleGroqChat(body, apiKey)
      }),
      localApi(env.YOUTUBE_API_KEY, '/api/youtube-search', async (req, apiKey) => {
        if (req.method !== 'GET') return { status: 405, body: { error: 'Method not allowed.' } }
        const params = new URLSearchParams(req.url.split('?')[1] || '')
        return handleYoutubeSearch(params.get('q'), apiKey)
      }),
    ],
  }
})