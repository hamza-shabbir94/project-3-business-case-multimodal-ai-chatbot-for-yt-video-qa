import { useEffect, useRef } from 'react'

// Large tagline (B11). Each word goes from muted to full color, one at a time,
// as it crosses a line at 60% of the screen height. Words stay lit once reached.
export default function TaglineReveal({ lines }) {
  const ref = useRef(null)

  useEffect(() => {
    const words = ref.current.querySelectorAll('.tagline-word')
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced || !('IntersectionObserver' in window)) {
      words.forEach((w) => w.classList.add('is-lit'))
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          // above the trigger line = lit (also when the page loads already scrolled past it)
          if (entry.isIntersecting || entry.boundingClientRect.top < 0) {
            entry.target.classList.add('is-lit')
            observer.unobserve(entry.target)
          }
        }
      },
      { rootMargin: '0px 0px -40% 0px', threshold: 1 },
    )
    words.forEach((w) => observer.observe(w))
    return () => observer.disconnect()
  }, [])

  return (
    <p ref={ref} className="tagline heading-3 md-heading-2">
      <span className="sr-only">{lines.join(' ')}</span>
      {lines.map((line, i) => (
        <span key={i} className="tagline-line" aria-hidden>
          {line.split(' ').map((word, j) => (
            <span key={j} className="tagline-word">{word} </span>
          ))}
        </span>
      ))}
    </p>
  )
}
