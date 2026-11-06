import { Barbell, CalendarBlank, Clock, Info, Play } from '@phosphor-icons/react'
import { useState } from 'react'
import ExerciseDiagram from './ExerciseDiagram'
import VideoDemo from './VideoDemo'
import './plan.css'

function SourceLink({ source }) {
  return (
    <a href={source.url} target="_blank" rel="noreferrer" className="cite mono" title={source.title}>
      <Play size={10} weight="fill" aria-hidden /> {source.timestamp}
    </a>
  )
}

function restLabel(seconds) {
  return seconds >= 120 ? `${seconds / 60} min` : `${seconds} s`
}

function Exercise({ exercise, index }) {
  return (
    <li>
      <details className="plan-exercise">
        <summary>
          <span className="plan-index caption-3 mono">{index + 1}</span>
          <span className="plan-name title-4">{exercise.name}</span>
          <span className="plan-dose body-6 mono">{exercise.sets} × {exercise.reps}</span>
          <span className="plan-rest caption-5 muted">rest {restLabel(exercise.rest_seconds)}</span>
          <span className="plan-toggle caption-4">How to</span>
        </summary>
        <div className="plan-howto">
          <div className="plan-media">
            <ExerciseDiagram id={exercise.id} name={exercise.name} />
            <VideoDemo demo={exercise.demo} />
          </div>
          <ul className="plan-cues body-6">
            {exercise.cues.map((c) => (
              <li key={c.text}>{c.text} <SourceLink source={c.source} /></li>
            ))}
          </ul>
        </div>
      </details>
    </li>
  )
}

// The weekly plan from create_weekly_plan: one tab per training day
export default function PlanCard({ plan }) {
  const [day, setDay] = useState(0)
  const current = plan.days[day]
  const chips = [plan.inputs.goal, `${plan.inputs.days} days a week`, plan.inputs.experience,
    plan.inputs.equipment, `${plan.inputs.minutes} min`, ...plan.inputs.avoid.map((a) => `Spare ${a}`)]

  return (
    <section className="plan" aria-label="Your weekly plan">
      <header className="plan-head">
        <p className="eyebrow caption-3"><CalendarBlank size={12} aria-hidden /> Your weekly plan</p>
        <h3 className="heading-6">{plan.split}</h3>
        <ul className="plan-chips">
          {chips.map((c) => <li key={c} className="caption-4">{c}</li>)}
        </ul>
      </header>

      <div className="plan-tabs" role="tablist" aria-label="Training days">
        {plan.days.map((d, i) => (
          <button key={d.day} type="button" role="tab" aria-selected={i === day}
            className="plan-tab button-xsm" onClick={() => setDay(i)}>
            Day {d.day}
          </button>
        ))}
      </div>

      <div className="plan-day" role="tabpanel">
        <div className="plan-day-head">
          <h4 className="title-3">{current.name}</h4>
          <span className="caption-5 muted"><Clock size={12} aria-hidden /> about {current.minutes} min with warm up</span>
        </div>
        <ol className="plan-list">
          {current.exercises.map((e, i) => <Exercise key={`${current.day}-${e.id}`} exercise={e} index={i} />)}
        </ol>
      </div>

      <details className="plan-why">
        <summary className="caption-1"><Info size={14} aria-hidden /> Why this plan: {plan.rules.length} rules from the videos</summary>
        <ul className="body-6">
          {plan.rules.map((r) => <li key={r.text}>{r.text} <SourceLink source={r.source} /></li>)}
          {plan.notes.map((n) => <li key={n} className="plan-note"><Barbell size={14} aria-hidden /> {n}</li>)}
        </ul>
      </details>
    </section>
  )
}
