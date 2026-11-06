// Turns the agent's citations "[Video title, m:ss]" into markdown links that open
// the YouTube video at that second. The greedy title part backtracks to the LAST
// comma, so titles that contain commas still work.
const CITATION = /\[([^[\]]+),\s*(\d{1,2}:\d{2}(?::\d{2})?)\]/g

export function toSeconds(timestamp) {
  return timestamp.split(':').reduce((total, part) => total * 60 + Number(part), 0)
}

function findVideoUrl(title, videos, sources) {
  const wanted = title.trim().toLowerCase()
  const video = videos.find((v) => v.title.toLowerCase() === wanted)
  if (video) return video.url
  const source = sources.find((s) => s.title.toLowerCase() === wanted)
  return source ? source.url.replace(/&t=\d+s$/, '') : null
}

// The model sometimes joins two citations in one bracket: [Title A, 1:00; Title B, 2:00]
const JOINED = /\[([^[\]]+?,\s*\d{1,2}:\d{2}(?::\d{2})?(?:;\s*[^[\]]+?,\s*\d{1,2}:\d{2}(?::\d{2})?)+)\]/g

function splitJoined(answer) {
  return answer.replace(JOINED, (match, inner) => inner.split(';').map((part) => `[${part.trim()}]`).join(''))
}

// Returns markdown where each citation is a link: [▶ 3:25](url&t=205s "Video title")
export function linkCitations(answer, sources = [], videos = []) {
  return splitJoined(answer).replace(CITATION, (match, title, timestamp) => {
    const url = findVideoUrl(title, videos, sources)
    if (!url) return match // unknown title: keep the text as it is
    const safeTitle = title.trim().replace(/"/g, "'")
    return `[▶ ${timestamp}](${url}&t=${toSeconds(timestamp)}s "${safeTitle}")`
  })
}

// Sources grouped by video, in the order they were retrieved
export function groupSources(sources) {
  const groups = new Map()
  for (const s of sources) {
    if (!groups.has(s.title)) groups.set(s.title, { title: s.title, channel: s.channel, times: [] })
    groups.get(s.title).times.push({ timestamp: s.timestamp, url: s.url })
  }
  for (const g of groups.values()) g.times.sort((a, b) => toSeconds(a.timestamp) - toSeconds(b.timestamp))
  return [...groups.values()]
}
