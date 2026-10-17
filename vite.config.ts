import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type Plugin } from 'vite'

function geminiDevProxy(apiKey: string): Plugin {
  return {
    name: 'gemini-dev-proxy',
    configureServer(server) {
      server.middlewares.use('/api/generate-questions', async (request, response) => {
        if (request.method !== 'POST') {
          response.statusCode = 405
          response.end(JSON.stringify({ error: 'Method not allowed.' }))
          return
        }

        const chunks: Buffer[] = []
        for await (const chunk of request) chunks.push(Buffer.from(chunk))
        let prompt: unknown
        try {
          prompt = (JSON.parse(Buffer.concat(chunks).toString('utf8')) as { prompt?: unknown }).prompt
        } catch {
          response.statusCode = 400
          response.end(JSON.stringify({ error: 'Invalid request body.' }))
          return
        }

        if (typeof prompt !== 'string' || prompt.trim().length < 20) {
          response.statusCode = 400
          response.end(JSON.stringify({ error: 'A valid generation prompt is required.' }))
          return
        }

        try {
          const upstream = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
          })
          const payload = await upstream.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> }
          const text = payload.candidates?.[0]?.content?.parts?.[0]?.text
          response.statusCode = upstream.ok && text ? 200 : 502
          response.setHeader('Content-Type', 'application/json')
          response.end(JSON.stringify({ ...(text ? { text } : { error: `AI provider request failed (${upstream.status}).` }) }))
        } catch {
          response.statusCode = 502
          response.end(JSON.stringify({ error: 'Unable to reach the AI provider.' }))
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), ...(env.GEMINI_API_KEY ? [geminiDevProxy(env.GEMINI_API_KEY)] : [])],
  }
})
