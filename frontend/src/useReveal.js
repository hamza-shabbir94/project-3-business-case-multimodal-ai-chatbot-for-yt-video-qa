import { useEffect } from 'react'

// Sections with class "reveal" rise and fade in once when they enter the screen (B7).
// IntersectionObserver instead of a scroll listener, so nothing runs on every frame.
export function useReveal() {
  useEffect(() => {
    const items = document.querySelectorAll('.reveal:not(.is-visible)')
    if (!('IntersectionObserver' in window)) {
      items.forEach((el) => el.classList.add('is-visible'))
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          entry.target.classList.add('is-visible')
          observer.unobserve(entry.target) // reveal once, never replay
        }
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.1 },
    )
    items.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])
}
