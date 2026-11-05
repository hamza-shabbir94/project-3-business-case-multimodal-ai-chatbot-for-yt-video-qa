import Markdown from 'react-markdown'
import { groupSources, linkCitations } from '../citations'

function CitationLink({ href, title, children }) {
  const isVideo = href?.startsWith('https://www.youtube.com/')
  return (
    <a href={href} title={title} target="_blank" rel="noreferrer" className={isVideo ? 'cite' : undefined}>
      {children}
    </a>
  )
}

function Sources({ sources }) {
  const groups = groupSources(sources)
  if (!groups.length) return null
  return (
    <details className="sources">
      <summary>
        Sources: {groups.length} video{groups.length > 1 ? 's' : ''}
      </summary>
      <ul>
        {groups.map((g) => (
          <li key={g.title}>
            <span className="source-title">{g.title}</span>
            <span className="source-channel"> · {g.channel}</span>
            <span className="source-times">
              {g.times.map((t) => (
                <a key={t.url} href={t.url} target="_blank" rel="noreferrer" className="cite">
                  ▶ {t.timestamp}
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
    return <div className="msg msg-user">{text}</div>
  }
  return (
    <div className={`msg msg-bot${error ? ' msg-error' : ''}`}>
      <Markdown components={{ a: CitationLink }}>{linkCitations(text, sources, videos)}</Markdown>
      <Sources sources={sources} />
    </div>
  )
}
