import {
  ArrowRight, ChatsCircle, CheckCircle, ClockCounterClockwise, Lightning, ListChecks,
  MagnifyingGlass, Microphone, Play, ShieldCheck, XCircle,
} from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { getVideos } from '../api'
import Footer from '../components/Footer'
import Nav from '../components/Nav'
import TaglineReveal from '../components/TaglineReveal'
import { FAQ } from '../content/faq'
import { useReveal } from '../useReveal'
import './landing.css'

const CTA_LABEL = 'Ask your first question'
const CHAT_URL = '/chat/'

// A real answer pattern, with times and numbers checked against the transcript of
// "The Smartest Way To Use Protein To Build Muscle" (Jeff Nippard), Pok0Jg2JAkE.
const PROTEIN_VIDEO = 'https://www.youtube.com/watch?v=Pok0Jg2JAkE'

function Cta() {
  return (
    <a href={CHAT_URL} className="btn btn-primary button-md">
      {CTA_LABEL} <ArrowRight size={16} weight="bold" className="arrow" aria-hidden />
    </a>
  )
}

function Cite({ seconds, label }) {
  return (
    <a className="cite mono" href={`${PROTEIN_VIDEO}&t=${seconds}s`} target="_blank" rel="noreferrer"
      title="The Smartest Way To Use Protein To Build Muscle">
      <Play size={10} weight="fill" aria-hidden /> {label}
    </a>
  )
}

function HeroVisual() {
  return (
    <figure className="hero-visual" aria-label="Example of a chat answer">
      <div className="demo-window">
        <div className="demo-bar caption-4 muted">
          <ChatsCircle size={16} aria-hidden /> Chat
        </div>
        <div className="demo-body">
          <p className="demo-user body-6">How much protein should I eat per day to build muscle?</p>
          <div className="demo-bot body-6">
            <p>
              When bulking, aim for <strong>1.6 to 2.2 g per kg</strong> of body weight a day{' '}
              <Cite seconds={110} label="1:50" />. For an 80 kg person that is about 125 to 180 g{' '}
              <Cite seconds={123} label="2:03" />.
            </p>
            <p>
              When cutting, go higher: <strong>1.8 to 2.7 g per kg</strong>, because the body is more
              likely to break down muscle for energy <Cite seconds={143} label="2:23" />.
            </p>
            <p className="demo-source caption-5 muted">
              Source: Jeff Nippard · The Smartest Way To Use Protein To Build Muscle
            </p>
          </div>
        </div>
      </div>
      <figcaption className="caption-5 muted">Example answer. Click a time to open the video at that second.</figcaption>
    </figure>
  )
}

function Hero() {
  return (
    <section className="hero container" aria-labelledby="hero-title">
      <div className="hero-copy">
        <p className="badge caption-4">
          <Lightning size={12} weight="fill" aria-hidden /> Free · no account needed
        </p>
        <h1 id="hero-title" className="hero-title heading-3 md-heading-1">
          Get the answer<br /> without watching<br /> the whole video
        </h1>
        <p className="hero-sub body-3 md-title-1">
          Ask about 18 fitness videos on YouTube, about 3 hours of training, nutrition and recovery
          advice. Every answer cites the video and the minute it comes from, so you can check it yourself.
        </p>
        <div className="hero-actions">
          <Cta />
        </div>
        <p className="hero-proof caption-2 muted">
          Built on videos from Jeff Nippard, Jeremy Ethier, Institute of Human Anatomy,
          Precision Nutrition and 4 more channels.
        </p>
      </div>
      <HeroVisual />
    </section>
  )
}

function Problem() {
  const before = [
    'Scrub through a 20 minute video to find one number',
    'Rewatch three videos because you forgot which one said it',
    'Trust a number from automatic captions without a way to check',
  ]
  const after = [
    'Type or say the question in plain words',
    'Read a short answer with the numbers in context',
    'Click a timestamp and hear the creator say it',
  ]
  return (
    <section className="section container reveal" aria-labelledby="problem-title">
      <div className="section-head">
        <p className="eyebrow caption-3">The problem</p>
        <h2 id="problem-title" className="heading-4 md-heading-3">The answer is in the video. Somewhere around minute 12.</h2>
      </div>
      <div className="compare">
        <div className="card">
          <h3 className="title-2">Watching to find it</h3>
          <ul className="check-list body-6">
            {before.map((t) => (
              <li key={t}><XCircle size={20} className="muted" aria-hidden /> {t}</li>
            ))}
          </ul>
        </div>
        <div className="card card-strong">
          <h3 className="title-2">Asking for it</h3>
          <ul className="check-list body-6">
            {after.map((t) => (
              <li key={t}><CheckCircle size={20} weight="fill" className="ok" aria-hidden /> {t}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

const BENEFITS = [
  { icon: Play, title: 'Answers you can check', text: 'Every fact links to the second in the video it comes from. One click and YouTube plays it.' },
  { icon: Microphone, title: 'Ask by typing or talking', text: 'Press the microphone, speak, check the text, send. Useful between sets.' },
  { icon: ClockCounterClockwise, title: 'Follow up like a conversation', text: 'It remembers the chat, so “and how much of that per meal?” just works. A reload keeps it.' },
  { icon: ListChecks, title: 'Full routines, not fragments', text: 'Ask for a summary and it reads the whole video, so a warm up comes back with every set and rest time.' },
  { icon: ShieldCheck, title: 'Honest about the gaps', text: 'If the videos do not cover a topic, it says so instead of guessing.' },
]

function Benefits() {
  return (
    <section className="section container reveal" aria-labelledby="benefits-title">
      <div className="section-head">
        <p className="eyebrow caption-3">What you get</p>
        <h2 id="benefits-title" className="heading-4 md-heading-3">Straight answers from coaches and scientists, with receipts</h2>
      </div>
      <ul className="benefits">
        {BENEFITS.map(({ icon: Icon, title, text }) => (
          <li key={title} className="card benefit">
            <span className="icon-tile" aria-hidden><Icon size={20} /></span>
            <h3 className="title-2">{title}</h3>
            <p className="body-6 muted">{text}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}

function Tagline() {
  return (
    <section className="section tagline-section container" aria-label="Why it matters">
      <TaglineReveal
        lines={[
          'Every answer shows where it came from.',
          'One click, and you hear it in the video yourself.',
        ]}
      />
    </section>
  )
}

const STEPS = [
  { icon: ChatsCircle, title: 'Ask', text: 'Type or speak a question about training, nutrition or recovery.' },
  { icon: MagnifyingGlass, title: 'It searches', text: 'An AI agent finds the most relevant minutes across 295 passages from the 18 transcripts.' },
  { icon: Play, title: 'Read and check', text: 'You get a short answer with timestamp buttons that open YouTube at that second.' },
]

function HowItWorks() {
  return (
    <section id="how" className="section container reveal" aria-labelledby="how-title">
      <div className="section-head">
        <p className="eyebrow caption-3">How it works</p>
        <h2 id="how-title" className="heading-4 md-heading-3">Three steps from question to source</h2>
      </div>
      <ol className="steps">
        {STEPS.map(({ icon: Icon, title, text }, i) => (
          <li key={title} className="card step">
            <span className="step-number caption-3 mono">0{i + 1}</span>
            <span className="icon-tile" aria-hidden><Icon size={20} /></span>
            <h3 className="title-2">{title}</h3>
            <p className="body-6 muted">{text}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}

// Results from the project's own tests (README, Phases 3 and 5)
const STATS = [
  { value: '11 of 12', label: 'test questions found the right video as the first result' },
  { value: '12 of 12', label: 'found it in the top two results' },
  { value: '16 of 16', label: 'automated API tests pass' },
  { value: '295', label: 'searchable passages from 179 minutes of video' },
]

function Proof() {
  return (
    <section className="section container reveal" aria-labelledby="proof-title">
      <div className="section-head">
        <p className="eyebrow caption-3">Tested, not guessed</p>
        <h2 id="proof-title" className="heading-4 md-heading-3">Checked against questions with known answers</h2>
        <p className="body-3 muted">
          Before launch, it answered a test set written from the transcripts. Every number in the
          answers was checked against what the video actually says.
        </p>
      </div>
      <dl className="stats">
        {STATS.map((s) => (
          <div key={s.value + s.label} className="card stat">
            <dt className="heading-5 mono">{s.value}</dt>
            <dd className="body-6 muted">{s.label}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

function formatDuration(seconds) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

function Videos() {
  const [videos, setVideos] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    getVideos().then(setVideos).catch(() => setError('The video list did not load. Refresh the page to try again.'))
  }, [])

  return (
    <section id="videos" className="section container reveal" aria-labelledby="videos-title">
      <div className="section-head">
        <p className="eyebrow caption-3">The library</p>
        <h2 id="videos-title" className="heading-4 md-heading-3">What it has watched for you</h2>
        <p className="body-3 muted">18 videos from 8 channels. Ask about any of them, or about all of them at once.</p>
      </div>
      {error && <p className="inline-error body-6" role="alert">{error}</p>}
      <ul className="video-grid" aria-busy={!videos && !error}>
        {!videos && !error && Array.from({ length: 6 }, (_, i) => (
          <li key={i} className="video-card" aria-hidden>
            <div className="video-thumb skeleton" />
            <div className="skeleton skeleton-line" />
            <div className="skeleton skeleton-line short" />
          </li>
        ))}
        {videos?.map((v) => (
          <li key={v.video_id} className="video-card">
            <a href={v.url} target="_blank" rel="noreferrer" className="video-link">
              <div className="video-thumb">
                <img src={v.thumbnail_url} alt={`Thumbnail of ${v.title}`} loading="lazy" />
                <span className="duration caption-4 mono">{formatDuration(v.duration_seconds)}</span>
              </div>
              <p className="title-4 video-title">{v.title}</p>
              <p className="caption-5 muted">{v.channel}</p>
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}

function Faq() {
  return (
    <section id="faq" className="section container reveal" aria-labelledby="faq-title">
      <div className="section-head">
        <p className="eyebrow caption-3">FAQ</p>
        <h2 id="faq-title" className="heading-4 md-heading-3">Questions before your first question</h2>
      </div>
      <div className="faq">
        {FAQ.map(({ q, a }) => (
          <details key={q} className="faq-item">
            <summary className="title-3">
              {q}
              <span className="faq-icon" aria-hidden />
            </summary>
            <p className="body-6 muted">{a}</p>
          </details>
        ))}
      </div>
    </section>
  )
}

function FinalCta() {
  return (
    <section className="section container reveal" aria-labelledby="final-title">
      <div className="final card">
        <h2 id="final-title" className="heading-4 md-heading-3">Your next question, answered with a timestamp</h2>
        <p className="body-3 muted">Free to use. No account. Nothing to install.</p>
        <Cta />
      </div>
    </section>
  )
}

export default function Landing() {
  useReveal()
  return (
    <>
      <a className="skip-link button-sm" href="#main">Skip to content</a>
      <Nav current="home" />
      <main id="main">
        <Hero />
        <Problem />
        <Benefits />
        <Tagline />
        <HowItWorks />
        <Proof />
        <Videos />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </>
  )
}
