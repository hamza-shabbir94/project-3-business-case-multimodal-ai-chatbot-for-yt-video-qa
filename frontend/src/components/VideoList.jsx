import { Sparkle } from '@phosphor-icons/react'

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60)
  const s = String(seconds % 60).padStart(2, '0')
  return `${m}:${s}`
}

// videos === null while loading: skeleton rows shaped like the real list
export default function VideoList({ videos, onSummarize, disabled }) {
  if (videos === null) {
    return (
      <ul className="video-list" aria-busy="true" aria-label="Loading videos">
        {Array.from({ length: 6 }, (_, i) => (
          <li key={i} className="video" aria-hidden>
            <div className="thumb skeleton" />
            <div className="video-text">
              <div className="skeleton line" />
              <div className="skeleton line short" />
            </div>
          </li>
        ))}
      </ul>
    )
  }
  return (
    <ul className="video-list">
      {videos.map((v) => (
        <li key={v.video_id} className="video">
          <a href={v.url} target="_blank" rel="noreferrer" className="thumb">
            <img src={v.thumbnail_url} alt={`Thumbnail of ${v.title}`} loading="lazy" />
            <span className="duration caption-4 mono">{formatDuration(v.duration_seconds)}</span>
          </a>
          <div className="video-text">
            <a href={v.url} target="_blank" rel="noreferrer" className="video-title title-5">{v.title}</a>
            <span className="caption-5 muted">{v.channel}</span>
            <button type="button" className="link-btn button-xsm" onClick={() => onSummarize(v)} disabled={disabled}>
              <Sparkle size={12} aria-hidden /> Summarize
            </button>
          </div>
        </li>
      ))}
    </ul>
  )
}
