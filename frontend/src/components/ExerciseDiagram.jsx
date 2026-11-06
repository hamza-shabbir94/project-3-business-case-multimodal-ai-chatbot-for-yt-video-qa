import { POSES, poseShapes } from '../content/poses'

function Pose({ pose }) {
  return (
    <svg viewBox="0 -12 120 110" className="pose" aria-hidden>
      <line x1="0" y1="94" x2="120" y2="94" className="pose-floor" />
      {poseShapes(pose).map((s, i) =>
        s.kind === 'line' ? <line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} className={`pose-${s.role}`} />
          : s.kind === 'rect' ? <rect key={i} x={s.x} y={s.y} width={s.w} height={s.h} rx="1" className="pose-prop-fill" />
            : <circle key={i} cx={s.cx} cy={s.cy} r={s.r} className={`pose-${s.role}`} />,
      )}
    </svg>
  )
}

// Start and end position of an exercise, drawn as a simple figure (content/poses.js)
export default function ExerciseDiagram({ id, name }) {
  const poses = POSES[id]
  if (!poses) return null
  return (
    <figure className="diagram" aria-label={`Simplified diagram of the ${name}`}>
      <div className="diagram-poses">
        {poses.map((pose, i) => (
          <div key={i} className="diagram-step">
            <Pose pose={pose} />
            <span className="caption-5 muted">{poses.length === 1 ? 'Hold' : i === 0 ? 'Start' : 'End'}</span>
          </div>
        ))}
      </div>
      <figcaption className="caption-5 muted">Simplified diagram. Watch the video for exact form.</figcaption>
    </figure>
  )
}
