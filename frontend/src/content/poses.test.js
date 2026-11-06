import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { POSES, poseShapes } from './poses'

const exercises = JSON.parse(readFileSync(new URL('../../../backend/exercises.json', import.meta.url), 'utf-8'))

describe('exercise diagrams', () => {
  it('has a diagram for every exercise the plan builder can use', () => {
    const missing = exercises.map((e) => e.id).filter((id) => !POSES[id])
    expect(missing).toEqual([])
  })

  it('draws a head and a body for every pose, inside the picture', () => {
    for (const [id, poses] of Object.entries(POSES)) {
      for (const pose of poses) {
        const shapes = poseShapes(pose)
        expect(shapes.some((s) => s.role === 'head'), id).toBe(true)
        expect(shapes.filter((s) => s.role === 'limb').length, id).toBeGreaterThanOrEqual(6)
        for (const [x, y] of Object.entries(pose).filter(([k]) => k !== 'props').map(([, v]) => v)) {
          expect(x >= 0 && x <= 120 && y >= -12 && y <= 98, `${id} point ${x},${y}`).toBe(true)
        }
      }
    }
  })
})
