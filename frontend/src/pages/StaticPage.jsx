import { ArrowLeft, ArrowRight } from '@phosphor-icons/react'
import Footer from '../components/Footer'
import Nav from '../components/Nav'
import './landing.css'

// Privacy, terms and 404 share this layout. The page is picked by <body data-page="...">.
const PAGES = {
  privacy: {
    title: 'Privacy',
    updated: 'November 2026',
    sections: [
      ['What is stored', 'Your questions and the answers are saved in a Postgres database (Neon) under a random chat ID, so the conversation can continue and reload. The ID is kept in your browser’s local storage. There are no accounts, so nothing links a chat to your name or email.'],
      ['Voice questions', 'When you use the microphone, the recording is sent to the OpenAI speech to text API and turned into text. This site does not store the audio.'],
      ['Who processes your questions', 'Questions are sent to OpenAI to write the answer and to Pinecone to search the video transcripts. LangSmith records each request so the developer can find errors. These services handle data under their own privacy policies.'],
      ['Cookies', 'The site sets no cookies and uses no analytics or advertising trackers. Local storage holds only the chat ID.'],
      ['Removing your chat', 'Click New chat to forget the chat ID in your browser. To delete a saved conversation from the database, open an issue in the project’s GitHub repository with the chat ID.'],
      ['Please do not share', 'Do not type health records, passwords or other personal details into the chat.'],
    ],
  },
  terms: {
    title: 'Terms',
    updated: 'November 2026',
    sections: [
      ['What this is', 'Liftline is a student project built for the Ironhack AI Engineering bootcamp. It is free and provided as it is, without any guarantee that it is available or correct.'],
      ['Not medical advice', 'Answers repeat what 18 public YouTube videos say about training, nutrition and recovery. They are general information. For injuries, health conditions, medication or diets, ask a doctor or a registered dietitian.'],
      ['Answers can be wrong', 'The bot uses an AI model and automatic captions, and both can make mistakes. Check important facts with the timestamp links before you act on them.'],
      ['Video content', 'The videos and their content belong to their creators. This site links to them on YouTube and quotes short parts of their transcripts to answer questions.'],
      ['Fair use of the service', 'Every question costs the developer API credits. Please do not send automated or bulk requests.'],
    ],
  },
}

function LegalPage({ page }) {
  return (
    <main id="main" className="container legal">
      <a href="/" className="back body-5"><ArrowLeft size={16} aria-hidden /> Back to home</a>
      <h1 className="heading-4 md-heading-3">{page.title}</h1>
      <p className="caption-2 muted">Last updated {page.updated}</p>
      {page.sections.map(([heading, text]) => (
        <section key={heading} className="legal-section">
          <h2 className="heading-6">{heading}</h2>
          <p className="body-3 muted">{text}</p>
        </section>
      ))}
    </main>
  )
}

function NotFound() {
  return (
    <main id="main" className="container not-found">
      <p className="caption-3 eyebrow mono">404</p>
      <h1 className="hero-title heading-3 md-heading-1">This page skipped leg day.<br /> It is not here.</h1>
      <p className="body-3 muted">The link may be old or mistyped. The chat and the home page are still where you left them.</p>
      <div className="not-found-actions">
        <a href="/chat/" className="btn btn-primary button-md">
          Open the chat <ArrowRight size={16} weight="bold" className="arrow" aria-hidden />
        </a>
        <a href="/" className="btn btn-secondary button-md">Back to home</a>
      </div>
    </main>
  )
}

export default function StaticPage({ name }) {
  return (
    <>
      <a className="skip-link button-sm" href="#main">Skip to content</a>
      <Nav current={name === 'notfound' ? undefined : name} />
      {name === 'notfound' ? <NotFound /> : <LegalPage page={PAGES[name]} />}
      <Footer />
    </>
  )
}
