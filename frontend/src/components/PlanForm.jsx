import { X } from '@phosphor-icons/react'
import { useEffect, useRef, useState } from 'react'

const GOALS = [['build muscle', 'Build muscle'], ['get stronger', 'Get stronger'], ['lose fat', 'Lose fat'], ['general fitness', 'General fitness']]
const DAYS = [2, 3, 4, 5, 6]
const LEVELS = [['beginner', 'Beginner'], ['intermediate', 'Intermediate']]
const EQUIPMENT = [['full gym', 'Full gym'], ['dumbbells at home', 'Dumbbells'], ['bodyweight only', 'Bodyweight']]
const MINUTES = [30, 45, 60, 75]
const AVOID = [['knees', 'Knees'], ['lower back', 'Lower back'], ['shoulders', 'Shoulders']]

function Choice({ legend, name, options, value, onChange }) {
  return (
    <fieldset className="choice">
      <legend className="title-4">{legend}</legend>
      <div className="choice-options">
        {options.map(([v, label]) => (
          <label key={v} className="choice-option body-5">
            <input type="radio" name={name} value={v} checked={value === v} onChange={() => onChange(v)} />
            <span>{label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}

// "Create my plan" dialog. The answers become one chat message, so the agent
// (and its memory) handles the plan and any later changes.
export default function PlanForm({ open, onClose, onSubmit }) {
  const ref = useRef(null)
  const [goal, setGoal] = useState('build muscle')
  const [days, setDays] = useState(3)
  const [level, setLevel] = useState('beginner')
  const [equipment, setEquipment] = useState('full gym')
  const [minutes, setMinutes] = useState(60)
  const [avoid, setAvoid] = useState([])

  useEffect(() => {
    const dialog = ref.current
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  function submit(e) {
    e.preventDefault()
    const parts = [`Create my weekly plan. Goal: ${goal}. Days per week: ${days}. Experience: ${level}.`,
      `Equipment: ${equipment}. Session length: ${minutes} minutes.`]
    if (avoid.length) parts.push(`I have pain in my ${avoid.join(' and ')}, so avoid loading them.`)
    onSubmit(parts.join(' '))
  }

  const toggleAvoid = (v) => setAvoid((a) => (a.includes(v) ? a.filter((x) => x !== v) : [...a, v]))

  return (
    <dialog ref={ref} className="plan-dialog" onClose={onClose} aria-labelledby="plan-form-title">
      <form method="dialog" onSubmit={submit}>
        <header className="plan-dialog-head">
          <div>
            <h2 id="plan-form-title" className="heading-6">Create my weekly plan</h2>
            <p className="caption-2 muted">Built from the training rules and exercise demos in the videos.</p>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </header>

        <div className="plan-dialog-body">
          <Choice legend="Goal" name="goal" options={GOALS} value={goal} onChange={setGoal} />
          <Choice legend="Days per week" name="days" options={DAYS.map((d) => [d, String(d)])} value={days} onChange={setDays} />
          <Choice legend="Experience" name="level" options={LEVELS} value={level} onChange={setLevel} />
          <Choice legend="Equipment" name="equipment" options={EQUIPMENT} value={equipment} onChange={setEquipment} />
          <Choice legend="Time per workout" name="minutes" options={MINUTES.map((m) => [m, `${m} min`])} value={minutes} onChange={setMinutes} />
          <fieldset className="choice">
            <legend className="title-4">Anything that hurts? <span className="caption-5 muted">Optional</span></legend>
            <div className="choice-options">
              {AVOID.map(([v, label]) => (
                <label key={v} className="choice-option body-5">
                  <input type="checkbox" checked={avoid.includes(v)} onChange={() => toggleAvoid(v)} />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <p className="caption-5 muted">General information from the videos, not medical advice. With pain or an injury, see a physiotherapist or doctor.</p>
        </div>

        <footer className="plan-dialog-foot">
          <button type="button" className="btn btn-secondary button-sm" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary button-sm">Create plan</button>
        </footer>
      </form>
    </dialog>
  )
}
