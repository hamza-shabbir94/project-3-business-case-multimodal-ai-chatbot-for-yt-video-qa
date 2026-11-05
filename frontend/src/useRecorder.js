import { useRef, useState } from 'react'

const MAX_SECONDS = 60 // keeps the upload far below the 4 MB API limit

// Records from the microphone. When recording stops (button or 60 s limit),
// onAudio(blob) is called once with the recorded audio.
export function useRecorder(onAudio) {
  const [recording, setRecording] = useState(false)
  const recorderRef = useRef(null)
  const timerRef = useRef(null)

  async function start() {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      throw new Error('This browser cannot record audio.')
    }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const recorder = new MediaRecorder(stream)
    const chunks = []
    recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data)
    recorder.onstop = () => {
      stream.getTracks().forEach((t) => t.stop()) // turn the microphone off
      clearTimeout(timerRef.current)
      setRecording(false)
      onAudio(new Blob(chunks, { type: recorder.mimeType || 'audio/webm' }))
    }
    recorderRef.current = recorder
    recorder.start()
    setRecording(true)
    timerRef.current = setTimeout(stop, MAX_SECONDS * 1000)
  }

  function stop() {
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop()
  }

  return { recording, start, stop }
}
