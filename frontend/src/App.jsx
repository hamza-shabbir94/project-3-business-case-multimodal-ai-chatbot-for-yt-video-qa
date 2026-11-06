import { CalendarPlus, ChatsCircle, FilmStrip, Plus } from '@phosphor-icons/react'
import { useEffect, useRef, useState } from 'react'
import { getHistory, getVideos, sendMessage } from './api'
import Composer from './components/Composer'
import Message from './components/Message'
import Nav from './components/Nav'
import PlanForm from './components/PlanForm'
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

// Placeholder shaped like an answer while the agent works (B9: skeleton, not a spinner)
function AnswerSkeleton() {
  return (
    <div className="msg msg-bot msg-skeleton" role="status" aria-label="Writing the answer">
      <div className="skeleton line" />
      <div className="skeleton line" />
      <div className="skeleton line short" />
    </div>
  )
}

export default function App() {
  const [videos, setVideos] = useState(null) // null = still loading
  const [videosError, setVideosError] = useState('')
  const [messages, setMessages] = useState([])
  const [threadId, setThreadId] = useState(storage.get)
  const [loading, setLoading] = useState(false)
  const [showVideos, setShowVideos] = useState(false) // only used on small screens
  const [planOpen, setPlanOpen] = useState(false)
  const endRef = useRef(null)

  useEffect(() => {
    getVideos()
      .then(setVideos)
      .catch(() => {
        setVideos([])
        setVideosError('The video list did not load. You can still ask questions.')
      })
  }, [])

  // reload the saved conversation (memory lives in Neon Postgres)
  useEffect(() => {
    const saved = storage.get()
    if (!saved) return
    getHistory(saved)
      .then(({ turns }) =>
        setMessages(turns.flatMap((t) => [
          { role: 'user', text: t.question },
          { role: 'bot', text: t.answer, sources: t.sources, plan: t.plan },
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
      setMessages((m) => [...m, { role: 'bot', text: reply.answer, sources: reply.sources, plan: reply.plan }])
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
      <a className="skip-link button-sm" href="#main">Skip to content</a>
      <Nav current="chat" floating={false} />

      <div className="shell">
        <aside className={`sidebar${showVideos ? ' open' : ''}`} aria-label="Videos">
          <div className="sidebar-head">
            <h2 className="title-4">Knowledge base</h2>
            <p className="caption-5 muted">{videos?.length || 18} videos. Summarize any of them.</p>
          </div>
          {videosError && <p className="inline-error caption-2" role="alert">{videosError}</p>}
          <VideoList
            videos={videos}
            disabled={loading}
            onSummarize={(v) => ask(`Summarize the video "${v.title}".`)}
          />
        </aside>

        <main id="main" className="chat">
          <div className="chat-toolbar">
            <div>
              <h1 className="title-3">Chat</h1>
              <p className="caption-5 muted">Answers from the videos, with timestamps</p>
            </div>
            <div className="toolbar-actions">
              <button type="button" className="btn btn-primary button-sm" onClick={() => setPlanOpen(true)} disabled={loading} aria-label="Create my plan">
                <CalendarPlus size={16} aria-hidden /> <span className="plan-btn-label">Create my plan</span>
              </button>
              <button type="button" className="btn btn-secondary button-sm videos-toggle" onClick={() => setShowVideos((s) => !s)}>
                {showVideos ? <ChatsCircle size={16} aria-hidden /> : <FilmStrip size={16} aria-hidden />}
                {showVideos ? 'Chat' : 'Videos'}
              </button>
              <button type="button" className="btn btn-secondary button-sm" onClick={newChat} disabled={loading || messages.length === 0}>
                <Plus size={16} aria-hidden /> New chat
              </button>
            </div>
          </div>

          <div className="messages" aria-live="polite">
            {messages.length === 0 && (
              <div className="empty">
                <span className="empty-icon" aria-hidden><ChatsCircle size={24} /></span>
                <h2 className="heading-6 md-heading-5">Ask anything about training, nutrition or recovery</h2>
                <p className="body-6 muted">
                  Type or use the microphone. Every answer links to the moment in the video it comes from.
                  Start with one of these:
                </p>
                <button type="button" className="plan-cta" onClick={() => setPlanOpen(true)}>
                  <span className="plan-cta-icon" aria-hidden><CalendarPlus size={20} /></span>
                  <span>
                    <span className="title-4">Create my weekly plan</span>
                    <span className="caption-5 muted">Pick your goal, days and equipment. Every exercise comes with a diagram and a video demo.</span>
                  </span>
                </button>
                <div className="examples">
                  {EXAMPLES.map((q) => (
                    <button key={q} type="button" className="example body-6" onClick={() => ask(q)}>{q}</button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <Message key={i} {...m} videos={videos ?? []} />
            ))}
            {loading && <AnswerSkeleton />}
            <div ref={endRef} />
          </div>
          <Composer onSend={ask} disabled={loading} />
        </main>
      </div>
      <PlanForm
        open={planOpen}
        onClose={() => setPlanOpen(false)}
        onSubmit={(text) => { setPlanOpen(false); ask(text) }}
      />
    </div>
  )
}
