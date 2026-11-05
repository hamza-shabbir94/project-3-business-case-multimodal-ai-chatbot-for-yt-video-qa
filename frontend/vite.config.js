import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// In development, /api requests go to the FastAPI server, so no CORS is needed.
// Start it with: .venv/bin/uvicorn app:app --app-dir backend --reload
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: { '/api': 'http://127.0.0.1:8000' },
  },
})
