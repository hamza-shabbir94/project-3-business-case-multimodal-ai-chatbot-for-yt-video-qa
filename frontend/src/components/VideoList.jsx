function formatDuration(seconds) {
  const m = Math.floor(seconds / 60)
  const s = String(seconds % 60).padStart(2, '0')
  return `${m}:${s}`
}

export default function VideoList({ videos, onSummarize, disabled }) {
  return (
    <ul className="video-list">
      {videos.map((v) => (
        <li key={v.video_id} className="video">
          <a href={v.url} target="_blank" rel="noreferrer" className="thumb">
            <img src={v.thumbnail_url} alt="" loading="lazy" />
            <span className="duration">{formatDuration(v.duration_seconds)}</span>
          </a>
          <div className="video-text">
            <a href={v.url} target="_blank" rel="noreferrer" className="video-title">{v.title}</a>
            <span className="video-channel">{v.channel}</span>
            <button type="button" className="link-btn" onClick={() => onSummarize(v)} disabled={disabled}>
              Summarize
            </button>
          </div>
        </li>
      ))}
    </ul>
  )
}
