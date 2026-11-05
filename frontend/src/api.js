// Calls to the FastAPI backend (see backend/openapi.json).
// In development Vite forwards /api to http://127.0.0.1:8000 (vite.config.js);
// on Vercel the frontend and /api share one domain.

async function request(path, options) {
  let response
  try {
    response = await fetch(path, options)
  } catch {
    throw new Error('Cannot reach the server. Is the backend running?')
  }
  const body = await response.json().catch(() => ({}))
  if (!response.ok) {
    // FastAPI sends {detail: "text"}, or {detail: [{msg}]} for validation errors
    const detail = Array.isArray(body.detail) ? body.detail[0]?.msg : body.detail
    throw new Error(detail || `Request failed (${response.status})`)
  }
  return body
}

export const getVideos = () => request('/api/videos')

export const getHistory = (threadId) => request(`/api/history/${encodeURIComponent(threadId)}`)

export const sendMessage = (message, threadId) =>
  request('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, thread_id: threadId || null }),
  })

export function transcribe(blob) {
  const extension = blob.type.includes('mp4') ? 'm4a' : 'webm' // Safari records mp4, Chrome webm
  const form = new FormData()
  form.append('audio', blob, `question.${extension}`)
  return request('/api/transcribe', { method: 'POST', body: form })
}
