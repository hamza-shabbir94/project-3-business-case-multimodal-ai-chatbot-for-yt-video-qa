import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import { FAQ } from './src/content/faq.js'

// Adds the FAQ as schema.org JSON-LD to the landing page, from the same text the page shows.
function faqSchema() {
  return {
    name: 'faq-schema',
    transformIndexHtml(html, ctx) {
      if (ctx.path !== '/index.html') return html // landing page only
      const schema = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: FAQ.map(({ q, a }) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
      }
      return html.replace('</head>', `  <script type="application/ld+json">${JSON.stringify(schema)}</script>\n  </head>`)
    },
  }
}

// One HTML file per page, so Vercel serves each path as a static file:
//   /  landing   /chat/  chat app   /privacy/  /terms/   404.html for unknown paths
// In development, /api requests go to the FastAPI server, so no CORS is needed.
// Start it with: .venv/bin/uvicorn app:app --app-dir backend --reload
export default defineConfig({
  plugins: [react(), faqSchema()],
  server: {
    proxy: { '/api': 'http://127.0.0.1:8000' },
  },
  build: {
    rolldownOptions: {
      input: {
        landing: resolve(import.meta.dirname, 'index.html'),
        chat: resolve(import.meta.dirname, 'chat/index.html'),
        privacy: resolve(import.meta.dirname, 'privacy/index.html'),
        terms: resolve(import.meta.dirname, 'terms/index.html'),
        notFound: resolve(import.meta.dirname, '404.html'),
      },
    },
  },
})
