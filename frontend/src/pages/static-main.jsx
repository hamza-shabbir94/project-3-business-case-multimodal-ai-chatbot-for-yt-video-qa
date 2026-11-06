import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../styles/tokens.css'
import StaticPage from './StaticPage.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <StaticPage name={document.body.dataset.page} />
  </StrictMode>,
)
