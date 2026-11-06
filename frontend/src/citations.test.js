import { describe, expect, it } from 'vitest'
import { groupSources, linkCitations, toSeconds } from './citations'

const videos = [
  { title: 'How to PROPERLY Squat for Growth (4 Easy Steps)', url: 'https://www.youtube.com/watch?v=gcNh17Ckjgg' },
  { title: 'Strength, Size and You', url: 'https://www.youtube.com/watch?v=abc' },
]

describe('toSeconds', () => {
  it('reads m:ss and h:mm:ss', () => {
    expect(toSeconds('3:25')).toBe(205)
    expect(toSeconds('0:00')).toBe(0)
    expect(toSeconds('1:02:03')).toBe(3723)
  })
})

describe('linkCitations', () => {
  it('turns a citation into a link at the right second', () => {
    const out = linkCitations('Go to parallel [How to PROPERLY Squat for Growth (4 Easy Steps), 3:25].', [], videos)
    expect(out).toBe(
      'Go to parallel [▶ 3:25](https://www.youtube.com/watch?v=gcNh17Ckjgg&t=205s "How to PROPERLY Squat for Growth (4 Easy Steps)").',
    )
  })

  it('handles two citations next to each other and titles with commas', () => {
    const out = linkCitations('x [Strength, Size and You, 0:10][Strength, Size and You, 1:00]', [], videos)
    expect(out).toContain('(https://www.youtube.com/watch?v=abc&t=10s')
    expect(out).toContain('(https://www.youtube.com/watch?v=abc&t=60s')
  })

  it('falls back to the sources when the video list is not loaded yet', () => {
    const sources = [{ title: 'Other Video', url: 'https://www.youtube.com/watch?v=zzz&t=30s' }]
    expect(linkCitations('[Other Video, 2:00]', sources, [])).toContain('watch?v=zzz&t=120s')
  })

  it('splits two citations joined in one bracket', () => {
    const out = linkCitations('x [Strength, Size and You, 0:10; How to PROPERLY Squat for Growth (4 Easy Steps), 3:25]', [], videos)
    expect(out).toContain('(https://www.youtube.com/watch?v=abc&t=10s')
    expect(out).toContain('(https://www.youtube.com/watch?v=gcNh17Ckjgg&t=205s')
    expect(out).not.toContain(';')
  })

  it('keeps unknown titles and normal brackets unchanged', () => {
    expect(linkCitations('[Unknown, 1:00] and [note]', [], videos)).toBe('[Unknown, 1:00] and [note]')
  })
})

describe('groupSources', () => {
  it('groups by video and sorts the times', () => {
    const groups = groupSources([
      { title: 'A', channel: 'c', timestamp: '5:00', url: 'u5' },
      { title: 'B', channel: 'c', timestamp: '1:00', url: 'u1' },
      { title: 'A', channel: 'c', timestamp: '0:30', url: 'u0' },
    ])
    expect(groups.map((g) => g.title)).toEqual(['A', 'B'])
    expect(groups[0].times.map((t) => t.timestamp)).toEqual(['0:30', '5:00'])
  })
})
