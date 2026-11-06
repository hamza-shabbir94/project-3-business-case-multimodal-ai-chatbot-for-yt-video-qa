import { Play } from '@phosphor-icons/react'
import { useState } from 'react'

// Shows the YouTube thumbnail first; the player only loads when clicked, starting at the demo second.
export default function VideoDemo({ demo }) {
  const [playing, setPlaying] = useState(false)
  const url = new URL(demo.url)
  const videoId = url.searchParams.get('v')
  const start = parseInt(url.searchParams.get('t') ?? '0', 10)
  if (playing) {
    return (
      <div className="video-demo">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoId}?start=${start}&autoplay=1&rel=0`}
          title={demo.title}
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
        />
      </div>
    )
  }
  return (
    <button type="button" className="video-demo video-demo-poster" onClick={() => setPlaying(true)}
      aria-label={`Play the demo from ${demo.timestamp} in ${demo.title}`}>
      <img src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`} alt="" loading="lazy" />
      <span className="video-demo-play"><Play size={20} weight="fill" /></span>
      <span className="video-demo-label caption-4">Demo from <span className="mono">{demo.timestamp}</span> · {demo.channel}</span>
    </button>
  )
}
