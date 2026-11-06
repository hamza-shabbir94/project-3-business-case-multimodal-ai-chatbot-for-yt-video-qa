import { GithubLogo } from '@phosphor-icons/react'
import { Brand } from './Nav'

const REPO = 'https://github.com/hamza-shabbir94/project-3-business-case-multimodal-ai-chatbot-for-yt-video-qa'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-about">
          <Brand />
          <p className="caption-2 muted">
            An Ironhack AI Engineering final project. Video content belongs to its creators.
            Answers are general information, not medical advice.
          </p>
        </div>
        <ul className="footer-links body-6">
          <li><a href="/privacy/">Privacy</a></li>
          <li><a href="/terms/">Terms</a></li>
          <li>
            <a href={REPO} target="_blank" rel="noreferrer">
              <GithubLogo size={16} aria-hidden /> Source code
            </a>
          </li>
        </ul>
      </div>
    </footer>
  )
}
