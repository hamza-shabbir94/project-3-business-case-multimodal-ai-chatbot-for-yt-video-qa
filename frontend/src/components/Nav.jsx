import { Barbell } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { BRAND } from '../content/brand'
import './site.css'

const NAV_LINKS = [
  { key: 'home', label: 'Home', href: '/' },
  { key: 'how', label: 'How it works', href: '/#how' },
  { key: 'faq', label: 'FAQ', href: '/#faq' },
  { key: 'chat', label: 'Chat', href: '/chat/' },
]

export function Brand() {
  return (
    <a href="/" className="brand title-3">
      <span className="brand-mark" aria-hidden><Barbell size={16} weight="bold" /></span>
      {BRAND}
    </a>
  )
}

// Floating, blurred nav bar (B7). On phones the links open in a full height panel.
export default function Nav({ current, floating = true }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <header className={`nav-wrap${floating ? ' is-floating' : ''}`}>
      <nav className="nav" aria-label="Main">
        <Brand />
        <ul className="nav-links">
          {NAV_LINKS.map((l) => (
            <li key={l.key}>
              <a href={l.href} className="nav-link body-5" aria-current={l.key === current ? 'page' : undefined}>
                {l.label}
              </a>
            </li>
          ))}
        </ul>
        <button
          type="button"
          className={`menu-toggle${open ? ' is-open' : ''}`}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((o) => !o)}
        >
          <span /><span />
        </button>
      </nav>

      <div id="mobile-menu" className={`mobile-menu${open ? ' is-open' : ''}`} inert={!open}>
        <ul>
          {NAV_LINKS.map((l, i) => (
            <li key={l.key} style={{ transitionDelay: open ? `${Math.min(i * 60, 400)}ms` : '0ms' }}>
              <a
                href={l.href}
                className="heading-5"
                aria-current={l.key === current ? 'page' : undefined}
                onClick={() => setOpen(false)}
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </header>
  )
}
