import { useEffect, useRef, useState } from 'react'
import { getHistory, getVideos, sendMessage } from './api'
import Composer from './components/Composer'
import Message from './components/Message'
import VideoList from './components/VideoList'
import './App.css'

const THREAD_KEY = 'fitness-qa-thread-id'
const EXAMPLES = [
  'How much protein should I eat per day to build muscle?',
  'How many sets per week do I need to grow?',
  'Is cardio or weight lifting better for fat loss?',
  'How should I warm up before lifting?',
]

// localStorage can be blocked (private mode); the app still works, it just forgets the chat on reload
const storage = {
  get: () => { try { return localStorage.getItem(THREAD_KEY) } catch { return null } },
  set: (id) => { try { localStorage.setItem(THREAD_KEY, id) } catch { /* ignore */ } },
  clear: () => { try { localStorage.removeItem(THREAD_KEY) } catch { /* ignore */ } },
}

export default function App() {
  const [videos, setVideos] = useState([])
  const [messages, setMessages] = useState([])
  const [threadId, setThreadId] = useState(storage.get)
  const [loading, setLoading] = useState(false)
  const [showVideos, setShowVideos] = useState(false) // only used on small screens
  const endRef = useRef(null)

  useEffect(() => {
    getVideos().then(setVideos).catch(() => setVideos([]))
  }, [])

  // reload the saved conversation (memory lives in Neon Postgres)
  useEffect(() => {
    const saved = storage.get()
    if (!saved) return
    getHistory(saved)
      .then(({ turns }) =>
        setMessages(turns.flatMap((t) => [
          { role: 'user', text: t.question },
          { role: 'bot', text: t.answer, sources: t.sources },
        ])),
      )
      .catch(() => {})
  }, [])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, loading])

  async function ask(text) {
    setShowVideos(false)
    setMessages((m) => [...m, { role: 'user', text }])
    setLoading(true)
    try {
      const reply = await sendMessage(text, threadId)
      if (reply.thread_id !== threadId) {
        setThreadId(reply.thread_id)
        storage.set(reply.thread_id)
      }
      setMessages((m) => [...m, { role: 'bot', text: reply.answer, sources: reply.sources }])
    } catch (e) {
      setMessages((m) => [...m, { role: 'bot', text: e.message, error: true }])
    } finally {
      setLoading(false)
    }
  }

  function newChat() {
    storage.clear()
    setThreadId(null)
    setMessages([])
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="logo" aria-hidden>🏋️</span>
          <div>
            <h1>Fitness Video QA</h1>
            <p>Answers from {videos.length || 18} YouTube videos, with timestamps</p>
          </div>
        </div>
        <div className="topbar-actions">
          <button type="button" className="ghost-btn videos-toggle" onClick={() => setShowVideos((s) => !s)}>
            {showVideos ? 'Chat' : 'Videos'}
          </button>
          <button type="button" className="ghost-btn" onClick={newChat} disabled={loading}>New chat</button>
        </div>
      </header>

      <div className="layout">
        <aside className={`sidebar${showVideos ? ' open' : ''}`}>
          <h2>Knowledge base</h2>
          <VideoList
            videos={videos}
            disabled={loading}
            onSummarize={(v) => ask(`Summarize the video "${v.title}".`)}
          />
        </aside>

        <main className="chat">
          <div className="messages" aria-live="polite">
            {messages.length === 0 && (
              <div className="empty">
                <h2>Ask anything about training, nutrition or recovery</h2>
                <p>Type or use the microphone. Every answer links to the moment in the video it comes from.</p>
                <div className="examples">
                  {EXAMPLES.map((q) => (
                    <button key={q} type="button" onClick={() => ask(q)}>{q}</button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <Message key={i} {...m} videos={videos} />
            ))}
            {loading && <div className="msg msg-bot typing" aria-label="Thinking"><span /><span /><span /></div>}
            <div ref={endRef} />
          </div>
          <Composer onSend={ask} disabled={loading} />
        </main>
      </div>
    </div>
  )
}
