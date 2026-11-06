import { Microphone, PaperPlaneRight, Stop } from '@phosphor-icons/react'
import { useState } from 'react'
import { transcribe } from '../api'
import { useRecorder } from '../useRecorder'

// Text box + send button + microphone button.
// A voice question is transcribed into the text box first, so the user can
// check (and fix) the text before sending it.
export default function Composer({ onSend, disabled }) {
  const [text, setText] = useState('')
  const [transcribing, setTranscribing] = useState(false)
  const [micError, setMicError] = useState('')

  const { recording, start, stop } = useRecorder(async (blob) => {
    setTranscribing(true)
    try {
      const { text: spoken } = await transcribe(blob)
      setText((current) => (current ? `${current} ${spoken}` : spoken))
    } catch (e) {
      setMicError(e.message)
    } finally {
      setTranscribing(false)
    }
  })

  async function toggleMic() {
    setMicError('')
    if (recording) return stop()
    try {
      await start()
    } catch (e) {
      setMicError(e.name === 'NotAllowedError' ? 'Microphone access was blocked.' : e.message)
    }
  }

  function submit(e) {
    e.preventDefault()
    const message = text.trim()
    if (!message || disabled) return
    onSend(message)
    setText('')
  }

  function onKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) submit(e) // Shift+Enter = new line
  }

  const busy = disabled || transcribing
  return (
    <form className="composer" onSubmit={submit}>
      {micError && <p className="mic-error caption-2" role="alert">{micError}</p>}
      <div className="composer-row">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={recording ? 'Listening. Press stop when you are done.' : transcribing ? 'Turning your voice into text…' : 'Ask about the videos…'}
          rows={1}
          maxLength={2000}
          disabled={transcribing}
          aria-label="Your question"
          className="body-3"
        />
        <button
          type="button"
          className={`icon-btn${recording ? ' recording' : ''}`}
          onClick={toggleMic}
          disabled={busy && !recording}
          aria-label={recording ? 'Stop recording' : 'Ask with your voice'}
          title={recording ? 'Stop recording' : 'Ask with your voice'}
        >
          {recording ? <Stop size={20} weight="fill" /> : <Microphone size={20} />}
        </button>
        <button type="submit" className="btn btn-primary button-md send-btn" aria-label="Send" disabled={busy || recording || !text.trim()}>
          <PaperPlaneRight size={16} weight="fill" aria-hidden /> <span className="send-label">Send</span>
        </button>
      </div>
    </form>
  )
}
