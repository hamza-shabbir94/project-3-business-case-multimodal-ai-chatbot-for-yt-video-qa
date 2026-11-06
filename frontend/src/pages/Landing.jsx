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

// Real lengths (seconds) of the 18 videos, from backend/data, grouped by topic (README table)
const TRAINING = [1315, 260, 1069, 323, 661, 620, 734, 435, 483, 484, 458]
const NUTRITION_RECOVERY = [620, 932, 357, 402, 506, 434, 654]
const LONGEST = Math.max(...TRAINING, ...NUTRITION_RECOVERY)

// Retrieval test (README, Phase 3): right video first for 11 of 12 questions
const HIT_AT_1 = 11 / 12

function Cta({ className = '' }) {
  return (
    <a href={CHAT_URL} className={`btn btn-primary button-md ${className}`}>
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

/* ---------- hero: full screen photo with two data cards ---------- */

function LibraryCard() {
  const bars = [
    ...TRAINING.map((s) => ({ s, kind: 'training' })),
    ...NUTRITION_RECOVERY.map((s) => ({ s, kind: 'nutrition' })),
  ]
  return (
    <div className="glass-card">
      <div className="glass-head">
        <h2 className="title-4 glass-title">3 hours, indexed</h2>
        <span className="glass-badge caption-3 mono">179 min</span>
      </div>
      <div className="bars" role="img" aria-label="Lengths of the 18 videos: 11 on training, 7 on nutrition and recovery">
        {bars.map((b, i) => (
          <span
            key={i}
            className={`bar bar-${b.kind}`}
            style={{ '--h': (b.s / LONGEST).toFixed(3), '--d': `${i * 30}ms` }}
          />
        ))}
      </div>
      <div className="glass-foot caption-4">
        <span><span className="dot dot-training" aria-hidden /> Training</span>
        <span><span className="dot dot-nutrition" aria-hidden /> Nutrition and recovery</span>
      </div>
    </div>
  )
}

function AccuracyCard() {
  const r = 30
  const c = 2 * Math.PI * r
  return (
    <div className="glass-card">
      <div className="glass-head">
        <h2 className="title-4 glass-title">Right video, first try</h2>
      </div>
      <div className="ring" role="img" aria-label="92 percent of test questions found the right video first">
        <svg viewBox="0 0 72 72" width="88" height="88" aria-hidden>
          <circle cx="36" cy="36" r={r} className="ring-track" />
          <circle cx="36" cy="36" r={r} className="ring-value" strokeDasharray={`${c * HIT_AT_1} ${c}`} />
        </svg>
        <span className="ring-label heading-6 mono">{Math.round(HIT_AT_1 * 100)}<small className="caption-4">%</small></span>
      </div>
      <div className="glass-foot caption-4">
        <span>Retrieval test</span>
        <span className="glass-badge caption-3 mono">11 of 12</span>
      </div>
    </div>
  )
}

function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <picture className="hero-photo">
        <source media="(max-width: 767px)" srcSet="/hero-1200.jpg" />
        <img src="/hero.jpg" alt="An athlete holding a loaded barbell at the bottom of a squat in a dark gym" fetchPriority="high" />
      </picture>
      <div className="hero-shade" aria-hidden />

      <div className="hero-inner container">
        <div className="hero-copy">
          <p className="badge caption-4">
            <Lightning size={12} weight="fill" aria-hidden /> Free · no account needed
          </p>
          <h1 id="hero-title" className="hero-title heading-3 md-heading-1">
            Get the answer<br /> without watching<br /> the whole video
          </h1>
          <p className="hero-sub body-3 md-title-1">
            Ask about 18 fitness videos on YouTube, about 3 hours of training, nutrition and recovery
            advice. Every answer cites the video and the minute it comes from.
          </p>
          <Cta />
          <p className="hero-proof caption-2">
            Built on videos from Jeff Nippard, Jeremy Ethier, Institute of Human Anatomy,
            Precision Nutrition and 4 more channels.
          </p>
        </div>

        <div className="hero-cards">
          <LibraryCard />
          <AccuracyCard />
        </div>
      </div>
    </section>
  )
}

/* ---------- sections, each a full width band ---------- */

function Band({ id, tone = 'base', label, children, className = '' }) {
  return (
    <section id={id} className={`band band-${tone} ${className}`} aria-labelledby={label}>
      <div className="container reveal">{children}</div>
    </section>
  )
}

function SectionHead({ eyebrow, id, title, text }) {
  return (
    <div className="section-head">
      <p className="eyebrow caption-3">{eyebrow}</p>
      <h2 id={id} className="heading-4 md-heading-3">{title}</h2>
      {text && <p className="body-3 muted">{text}</p>}
    </div>
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
    <Band label="problem-title">
      <SectionHead eyebrow="The problem" id="problem-title" title="The answer is in the video. Somewhere around minute 12." />
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
    </Band>
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
    <Band tone="surface" label="benefits-title">
      <SectionHead eyebrow="What you get" id="benefits-title" title="Straight answers from coaches and scientists, with receipts" />
      <ul className="benefits">
        {BENEFITS.map(({ icon: Icon, title, text }) => (
          <li key={title} className="card benefit">
            <span className="icon-tile" aria-hidden><Icon size={20} /></span>
            <h3 className="title-2">{title}</h3>
            <p className="body-6 muted">{text}</p>
          </li>
        ))}
      </ul>
    </Band>
  )
}

function Tagline() {
  return (
    <section className="band band-ink tagline-band" aria-label="Why it matters">
      <div className="container">
        <TaglineReveal
          lines={[
            'Every answer shows where it came from.',
            'One click, and you hear it in the video yourself.',
          ]}
        />
      </div>
    </section>
  )
}

const STEPS = [
  { icon: ChatsCircle, title: 'Ask', text: 'Type or speak a question about training, nutrition or recovery.' },
  { icon: MagnifyingGlass, title: 'It searches', text: 'An AI agent finds the most relevant minutes across 295 passages from the 18 transcripts.' },
  { icon: Play, title: 'Read and check', text: 'You get a short answer with timestamp buttons that open YouTube at that second.' },
]

function ExampleAnswer() {
  return (
    <figure className="demo" aria-label="Example of a chat answer">
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
            <p className="caption-5 muted">Source: Jeff Nippard · The Smartest Way To Use Protein To Build Muscle</p>
          </div>
        </div>
      </div>
      <figcaption className="caption-5 muted">Example answer, checked against the transcript. Click a time to open the video at that second.</figcaption>
    </figure>
  )
}

function HowItWorks() {
  return (
    <Band id="how" label="how-title">
      <SectionHead eyebrow="How it works" id="how-title" title="Three steps from question to source" />
      <div className="how">
        <ol className="steps">
          {STEPS.map(({ icon: Icon, title, text }, i) => (
            <li key={title} className="step">
              <span className="icon-tile" aria-hidden><Icon size={20} /></span>
              <div>
                <h3 className="title-2"><span className="step-number mono">0{i + 1}</span> {title}</h3>
                <p className="body-6 muted">{text}</p>
              </div>
            </li>
          ))}
        </ol>
        <ExampleAnswer />
      </div>
    </Band>
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
    <Band tone="surface" label="proof-title">
      <SectionHead
        eyebrow="Tested, not guessed" id="proof-title" title="Checked against questions with known answers"
        text="Before launch, it answered a test set written from the transcripts. Every number in the answers was checked against what the video actually says."
      />
      <dl className="stats">
        {STATS.map((s) => (
          <div key={s.value + s.label} className="card stat">
            <dt className="heading-4 mono stat-value">{s.value}</dt>
            <dd className="body-6 muted">{s.label}</dd>
          </div>
        ))}
      </dl>
    </Band>
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
    <Band id="videos" label="videos-title">
      <SectionHead
        eyebrow="The library" id="videos-title" title="What it has watched for you"
        text="18 videos from 8 channels. Ask about any of them, or about all of them at once."
      />
      {error && <p className="inline-error body-6" role="alert">{error}</p>}
      <ul className="video-grid" aria-busy={!videos && !error}>
        {!videos && !error && Array.from({ length: 8 }, (_, i) => (
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
    </Band>
  )
}

function Faq() {
  return (
    <Band id="faq" tone="surface" label="faq-title">
      <div className="faq-layout">
        <SectionHead
          eyebrow="FAQ" id="faq-title" title="Questions before your first question"
          text="Something missing? Ask it in the chat. If the videos do not cover it, the bot will tell you."
        />
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
      </div>
    </Band>
  )
}

function FinalCta() {
  return (
    <section className="band final-band" aria-labelledby="final-title">
      <picture className="hero-photo" aria-hidden>
        <img src="/hero-1200.jpg" alt="" loading="lazy" />
      </picture>
      <div className="hero-shade final-shade" aria-hidden />
      <div className="container final reveal">
        <h2 id="final-title" className="hero-title heading-4 md-heading-2">Your next question,<br /> answered with a timestamp</h2>
        <p className="body-3 md-title-1 hero-sub">Free to use. No account. Nothing to install.</p>
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
