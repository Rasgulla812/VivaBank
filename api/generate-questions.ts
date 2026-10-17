type GenerateRequest = { prompt?: unknown }

type ApiResponse = {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return Response.json({ error: 'Method not allowed.' }, { status: 405 })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return Response.json({ error: 'AI generation is not configured on the server.' }, { status: 503 })
  }

  let body: GenerateRequest
  try {
    body = await request.json() as GenerateRequest
  } catch {
    return Response.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  if (typeof body.prompt !== 'string' || body.prompt.trim().length < 20) {
    return Response.json({ error: 'A valid generation prompt is required.' }, { status: 400 })
  }

  const upstream = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: body.prompt }] }] }),
  })

  if (!upstream.ok) {
    return Response.json({ error: `AI provider request failed (${upstream.status}).` }, { status: 502 })
  }

  const payload = await upstream.json() as ApiResponse
  const text = payload.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) {
    return Response.json({ error: 'The AI provider returned an empty response.' }, { status: 502 })
  }

  return Response.json({ text })
}
