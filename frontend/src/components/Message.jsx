import { Play, WarningCircle } from '@phosphor-icons/react'
import { Children } from 'react'
import Markdown from 'react-markdown'
import { groupSources, linkCitations } from '../citations'

// linkCitations() writes links as "▶ 3:25"; here the ▶ becomes a Phosphor icon
function CitationLink({ href, title, children }) {
  const isVideo = href?.startsWith('https://www.youtube.com/')
  if (!isVideo) {
    return <a href={href} title={title} target="_blank" rel="noreferrer">{children}</a>
  }
  const label = Children.toArray(children).join('').replace(/^▶\s*/, '')
  return (
    <a href={href} title={title} target="_blank" rel="noreferrer" className="cite mono">
      <Play size={10} weight="fill" aria-hidden /> {label}
    </a>
  )
}

function Sources({ sources }) {
  const groups = groupSources(sources)
  if (!groups.length) return null
  return (
    <details className="sources">
      <summary className="caption-1">
        Sources: {groups.length} video{groups.length > 1 ? 's' : ''}
      </summary>
      <ul>
        {groups.map((g) => (
          <li key={g.title} className="caption-2">
            <span className="source-title">{g.title}</span>
            <span className="muted"> · {g.channel}</span>
            <span className="source-times">
              {g.times.map((t) => (
                <a key={t.url} href={t.url} target="_blank" rel="noreferrer" className="cite mono" title={g.title}>
                  <Play size={10} weight="fill" aria-hidden /> {t.timestamp}
                </a>
              ))}
            </span>
          </li>
        ))}
      </ul>
    </details>
  )
}

export default function Message({ role, text, sources = [], videos, error }) {
  if (role === 'user') {
    return <div className="msg msg-user body-6">{text}</div>
  }
  if (error) {
    return (
      <div className="msg msg-bot msg-error body-6" role="alert">
        <WarningCircle size={20} aria-hidden />
        <p>{text}</p>
      </div>
    )
  }
  return (
    <div className="msg msg-bot body-6">
      <Markdown components={{ a: CitationLink }}>{linkCitations(text, sources, videos)}</Markdown>
      <Sources sources={sources} />
    </div>
  )
}
