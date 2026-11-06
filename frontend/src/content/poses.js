// Simple side view diagrams of each exercise: a start and an end position.
// Joints: h head, s shoulder, e elbow, w wrist, p hip, k knee, a ankle, t toe.
// k2/a2/t2 = second leg, e2/w2 = second arm (only when they differ).
// Props: plate (barbell seen from the side), dumbbell, rect (bench, box), line (bar, pole).
// viewBox: 0 -12 120 110, floor at y = 94. Diagrams are a reminder; the video shows the real form.

const LEGS = { p: [60, 54], k: [60, 74], a: [60, 93], t: [68, 93] }
const STAND = { h: [60, 15], s: [60, 26], ...LEGS }

export const POSES = {
  back_squat: [
    { ...STAND, e: [52, 32], w: [58, 24], props: [{ type: 'plate', at: [57, 24] }] },
    { h: [72, 34], s: [65, 42], e: [57, 47], w: [63, 40], p: [43, 70], k: [65, 72], a: [59, 93], t: [67, 93], props: [{ type: 'plate', at: [62, 40] }] },
  ],
  goblet_squat: [
    { ...STAND, e: [64, 38], w: [66, 30], props: [{ type: 'dumbbell', at: [67, 30] }] },
    { h: [68, 36], s: [63, 45], e: [69, 55], w: [71, 47], p: [44, 70], k: [66, 72], a: [60, 93], t: [68, 93], props: [{ type: 'dumbbell', at: [72, 47] }] },
  ],
  box_squat: [
    { ...STAND, e: [73, 28], w: [86, 29], props: [{ type: 'rect', x: 28, y: 70, w: 20, h: 24 }] },
    { h: [69, 37], s: [62, 46], e: [75, 48], w: [88, 47], p: [44, 68], k: [66, 70], a: [60, 93], t: [68, 93], props: [{ type: 'rect', x: 28, y: 70, w: 20, h: 24 }] },
  ],
  deadlift: [
    { h: [80, 40], s: [72, 48], e: [72, 62], w: [72, 76], p: [48, 62], k: [64, 70], a: [56, 93], t: [64, 93], props: [{ type: 'plate', at: [72, 84] }] },
    { ...STAND, e: [61, 40], w: [62, 53], props: [{ type: 'plate', at: [63, 55] }] },
  ],
  rdl: [
    { ...STAND, e: [61, 40], w: [62, 53], props: [{ type: 'plate', at: [63, 55] }] },
    { h: [82, 46], s: [73, 50], e: [73, 63], w: [73, 76], p: [46, 54], k: [50, 74], a: [48, 93], t: [56, 93], props: [{ type: 'plate', at: [73, 78] }] },
  ],
  single_leg_rdl: [
    { ...STAND, e: [61, 40], w: [62, 53], props: [{ type: 'dumbbell', at: [62, 55] }] },
    { h: [83, 51], s: [74, 54], e: [74, 67], w: [74, 80], p: [48, 56], k: [50, 75], a: [50, 93], t: [58, 93], k2: [28, 58], a2: [9, 60], t2: [8, 68], props: [{ type: 'dumbbell', at: [74, 82] }] },
  ],
  hip_thrust: [
    { h: [25, 66], s: [33, 73], e: [41, 83], w: [50, 87], p: [50, 90], k: [68, 80], a: [72, 93], t: [80, 93], props: [{ type: 'rect', x: 6, y: 74, w: 26, h: 20 }, { type: 'plate', at: [50, 84] }] },
    { h: [23, 72], s: [33, 73], e: [45, 77], w: [57, 72], p: [58, 72], k: [76, 74], a: [74, 93], t: [82, 93], props: [{ type: 'rect', x: 6, y: 74, w: 26, h: 20 }, { type: 'plate', at: [57, 67] }] },
  ],
  split_squat: [
    { h: [58, 14], s: [58, 25], e: [59, 39], w: [60, 52], p: [58, 53], k: [68, 72], a: [70, 93], t: [78, 93], k2: [46, 70], a2: [28, 75], t2: [20, 74], props: [{ type: 'rect', x: 4, y: 76, w: 22, h: 18 }, { type: 'dumbbell', at: [60, 54] }] },
    { h: [58, 26], s: [58, 37], e: [59, 51], w: [60, 64], p: [56, 65], k: [75, 67], a: [72, 93], t: [80, 93], k2: [46, 88], a2: [27, 77], t2: [19, 75], props: [{ type: 'rect', x: 4, y: 76, w: 22, h: 18 }, { type: 'dumbbell', at: [60, 66] }] },
  ],
  bench_press: [
    { h: [84, 59], s: [74, 60], e: [74, 46], w: [74, 33], p: [46, 60], k: [30, 66], a: [24, 93], t: [32, 93], props: [{ type: 'rect', x: 34, y: 63, w: 58, h: 5 }, { type: 'plate', at: [74, 32] }] },
    { h: [84, 59], s: [74, 60], e: [66, 67], w: [73, 53], p: [46, 60], k: [30, 66], a: [24, 93], t: [32, 93], props: [{ type: 'rect', x: 34, y: 63, w: 58, h: 5 }, { type: 'plate', at: [73, 51] }] },
  ],
  push_up: [
    { h: [94, 63], s: [84, 67], e: [84, 80], w: [84, 93], p: [56, 77], k: [38, 83], a: [20, 89], t: [17, 93], props: [] },
    { h: [95, 82], s: [85, 85], e: [76, 82], w: [84, 93], p: [57, 88], k: [39, 90], a: [20, 91], t: [17, 93], props: [] },
  ],
  overhead_press: [
    { ...STAND, e: [67, 36], w: [65, 25], props: [{ type: 'plate', at: [65, 24] }] },
    { ...STAND, e: [62, 12], w: [61, -1], props: [{ type: 'plate', at: [61, -2] }] },
  ],
  pike_push_up: [
    { h: [82, 74], s: [76, 68], e: [78, 80], w: [80, 93], p: [58, 50], k: [47, 71], a: [36, 92], t: [30, 93], props: [] },
    { h: [80, 87], s: [74, 79], e: [67, 87], w: [80, 93], p: [58, 54], k: [47, 73], a: [36, 92], t: [30, 93], props: [] },
  ],
  pull_up: [
    { h: [58, 12], s: [60, 22], e: [62, 8], w: [62, -4], p: [60, 50], k: [62, 70], a: [62, 88], t: [68, 90], props: [{ type: 'line', x1: 40, y1: -4, x2: 90, y2: -4 }] },
    { h: [60, -2], s: [60, 10], e: [50, 6], w: [62, -4], p: [60, 38], k: [62, 58], a: [62, 76], t: [68, 78], props: [{ type: 'line', x1: 40, y1: -4, x2: 90, y2: -4 }] },
  ],
  lat_pulldown: [
    { h: [48, 32], s: [50, 42], e: [52, 26], w: [54, 12], p: [54, 70], k: [74, 70], a: [74, 93], t: [82, 93], props: [{ type: 'rect', x: 40, y: 72, w: 26, h: 4 }, { type: 'line', x1: 44, y1: 12, x2: 64, y2: 12 }, { type: 'line', x1: 54, y1: 12, x2: 54, y2: -10 }] },
    { h: [48, 32], s: [50, 42], e: [42, 52], w: [56, 40], p: [54, 70], k: [74, 70], a: [74, 93], t: [82, 93], props: [{ type: 'rect', x: 40, y: 72, w: 26, h: 4 }, { type: 'line', x1: 46, y1: 40, x2: 66, y2: 40 }, { type: 'line', x1: 56, y1: 40, x2: 56, y2: -10 }] },
  ],
  floor_pulldown: [
    { h: [96, 86], s: [86, 88], e: [100, 89], w: [112, 89], p: [58, 89], k: [40, 89], a: [22, 89], t: [21, 81], props: [] },
    { h: [104, 86], s: [94, 88], e: [84, 92], w: [98, 92], p: [66, 89], k: [48, 89], a: [30, 89], t: [29, 81], props: [] },
  ],
  barbell_row: [
    { h: [80, 32], s: [72, 38], e: [72, 51], w: [72, 64], p: [48, 52], k: [54, 72], a: [52, 93], t: [60, 93], props: [{ type: 'plate', at: [72, 66] }] },
    { h: [80, 32], s: [72, 38], e: [60, 46], w: [66, 56], p: [48, 52], k: [54, 72], a: [52, 93], t: [60, 93], props: [{ type: 'plate', at: [66, 58] }] },
  ],
  dumbbell_row: [
    { h: [84, 46], s: [74, 48], e: [70, 62], w: [70, 75], e2: [80, 54], w2: [82, 59], p: [46, 50], k: [42, 72], a: [40, 93], t: [48, 93], props: [{ type: 'rect', x: 66, y: 60, w: 40, h: 5 }, { type: 'dumbbell', at: [70, 77] }] },
    { h: [84, 46], s: [74, 48], e: [58, 42], w: [62, 54], e2: [80, 54], w2: [82, 59], p: [46, 50], k: [42, 72], a: [40, 93], t: [48, 93], props: [{ type: 'rect', x: 66, y: 60, w: 40, h: 5 }, { type: 'dumbbell', at: [62, 56] }] },
  ],
  inverted_row: [
    { h: [96, 73], s: [86, 74], e: [86, 62], w: [86, 50], p: [58, 82], k: [40, 87], a: [24, 92], t: [20, 86], props: [{ type: 'line', x1: 74, y1: 50, x2: 104, y2: 50 }] },
    { h: [94, 54], s: [84, 57], e: [72, 60], w: [86, 50], p: [56, 71], k: [40, 81], a: [24, 92], t: [20, 86], props: [{ type: 'line', x1: 74, y1: 50, x2: 104, y2: 50 }] },
  ],
  incline_curl: [
    { h: [58, 40], s: [54, 50], e: [50, 64], w: [48, 77], p: [42, 78], k: [62, 78], a: [64, 93], t: [72, 93], props: [{ type: 'line', x1: 36, y1: 84, x2: 52, y2: 42 }, { type: 'dumbbell', at: [48, 79] }] },
    { h: [58, 40], s: [54, 50], e: [50, 64], w: [60, 56], p: [42, 78], k: [62, 78], a: [64, 93], t: [72, 93], props: [{ type: 'line', x1: 36, y1: 84, x2: 52, y2: 42 }, { type: 'dumbbell', at: [61, 55] }] },
  ],
  home_curl: [
    { h: [38, 28], s: [42, 38], e: [58, 40], w: [74, 42], p: [52, 62], k: [58, 78], a: [64, 93], t: [72, 93], props: [{ type: 'line', x1: 76, y1: -10, x2: 76, y2: 94 }] },
    { h: [50, 25], s: [52, 36], e: [62, 46], w: [72, 34], p: [58, 62], k: [61, 78], a: [64, 93], t: [72, 93], props: [{ type: 'line', x1: 76, y1: -10, x2: 76, y2: 94 }] },
  ],
  overhead_triceps: [
    { ...STAND, e: [62, 4], w: [52, 14], props: [{ type: 'dumbbell', at: [51, 15] }] },
    { ...STAND, e: [62, 4], w: [62, -9], props: [{ type: 'dumbbell', at: [62, -10] }] },
  ],
  home_triceps: [
    { h: [82, 36], s: [72, 40], e: [80, 54], w: [90, 46], p: [56, 64], k: [48, 79], a: [40, 93], t: [48, 93], props: [{ type: 'rect', x: 86, y: 47, w: 26, h: 4 }] },
    { h: [72, 34], s: [66, 44], e: [78, 46], w: [90, 46], p: [52, 66], k: [46, 80], a: [40, 93], t: [48, 93], props: [{ type: 'rect', x: 86, y: 47, w: 26, h: 4 }] },
  ],
  plank: [
    { h: [95, 77], s: [85, 81], e: [85, 93], w: [97, 93], p: [56, 84], k: [38, 88], a: [20, 91], t: [17, 93], props: [] },
  ],
}

// Shapes to draw for one pose (used by the React component and by the review script)
export function poseShapes(pose) {
  const bones = [['s', 'e2'], ['e2', 'w2'], ['p', 'k2'], ['k2', 'a2'], ['a2', 't2'],
    ['s', 'p'], ['s', 'e'], ['e', 'w'], ['p', 'k'], ['k', 'a'], ['a', 't']]
  const props = pose.props ?? []
  const shapes = []
  // drawing order: equipment, weights, far limbs, near limbs, neck, head
  for (const prop of props) {
    if (prop.type === 'rect') shapes.push({ kind: 'rect', role: 'prop', x: prop.x, y: prop.y, w: prop.w, h: prop.h })
    if (prop.type === 'line') shapes.push({ kind: 'line', role: 'prop', x1: prop.x1, y1: prop.y1, x2: prop.x2, y2: prop.y2 })
  }
  for (const prop of props) {
    if (prop.type === 'plate') shapes.push({ kind: 'circle', role: 'plate', cx: prop.at[0], cy: prop.at[1], r: 9 })
    if (prop.type === 'dumbbell') shapes.push({ kind: 'circle', role: 'weight', cx: prop.at[0], cy: prop.at[1], r: 4 })
  }
  for (const [from, to] of bones) {
    if (pose[from] && pose[to]) {
      const [x1, y1] = pose[from]
      const [x2, y2] = pose[to]
      shapes.push({ kind: 'line', role: to.endsWith('2') ? 'limb-back' : 'limb', x1, y1, x2, y2 })
    }
  }
  shapes.push({ kind: 'line', role: 'limb', x1: pose.s[0], y1: pose.s[1], x2: pose.h[0], y2: pose.h[1] })
  shapes.push({ kind: 'circle', role: 'head', cx: pose.h[0], cy: pose.h[1], r: 6 })
  return shapes
}
