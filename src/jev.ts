import type { Note, Root, Species } from './types.ts'

// Asks Jev, in ONE call: which existing notes feel connected to the new one, and what plant it is.
// Returns { kind, roots: [{ to, w }] } with w in 0..1 (0 = barely connected, 1 = certain).
export const SPECIES: Record<Species, string> = {
  flower: 'Light, personal, feelings, everyday life',
  fern: 'Learning, research, reading, calm reflection',
  cactus: 'Work, tasks, hard problems, resilience',
  mushroom: 'Odd, dreamy, creative or half-formed ideas',
}
export const THRESHOLD = 0.5
const MAX_OTHERS = 150 // ponytail: 32k context; add an embedding pre-filter past ~150 notes
const clip = (s: string) => s.slice(0, 300)
const MOCK = import.meta.env.VITE_MOCK === '1'

type Answer = { choice?: string; noul?: number }
type Answers = Record<string, Answer | undefined>
type Questions = Record<string, { type: string; instructions: string; criteria?: Record<string, string> }>
const isSpecies = (s: unknown): s is Species => typeof s === 'string' && s in SPECIES

export async function judge(note: Note, all: Note[]): Promise<{ kind: Species; roots: Root[] }> {
  const others = all.slice(-MAX_OTHERS)
  const questions: Questions = {
    kind: { type: 'choice', instructions: 'Which plant suits the new note?', criteria: SPECIES },
  }
  for (const o of others) {
    questions[o.id] = {
      type: 'noul',
      instructions: `Would a person looking at the new note and note ${o.id} together feel they are connected?`,
    }
  }
  const state = { new_note: clip(note.text), notes: Object.fromEntries(others.map((o) => [o.id, clip(o.text)])) }

  const { answers } = MOCK ? mock(note, others) : await call(state, questions)
  console.log('[jev] raw answers', answers)
  return {
    kind: isSpecies(answers.kind?.choice) ? answers.kind.choice : 'flower',
    // w: 0 at the threshold (thin root) .. 1 at certainty (thick root)
    roots: others
      .map((o) => ({ to: o.id, p: strength(answers[o.id]) }))
      .filter((r) => r.p >= THRESHOLD)
      .map((r) => ({ to: r.to, w: (r.p - THRESHOLD) / (1 - THRESHOLD) })),
  }
}

// Verified against the real API: noul is a 0-1 probability, e.g. { type: 'noul', noul: 0.88 }.
const strength = (a?: Answer) => a?.noul ?? 0

async function call(state: unknown, questions: Questions): Promise<{ answers: Answers }> {
  const res = await fetch('/api/decisions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: import.meta.env.VITE_JEV_MODEL, state, questions }),
  })
  if (!res.ok) throw new Error(`Jev ${res.status}: ${await res.text()}`)
  return res.json()
}

// Fake judge: word overlap. Same response shape as the real thing.
function mock(note: Note, others: Note[]): { answers: Answers } {
  const words = (s: string) => new Set(s.toLowerCase().match(/[a-z]{4,}/g) ?? [])
  const a = words(note.text)
  const answers: Answers = { kind: { choice: Object.keys(SPECIES)[note.text.length % 4] } }
  for (const o of others) {
    const b = words(o.text)
    const shared = [...a].filter((w) => b.has(w)).length
    answers[o.id] = { noul: Math.min(1, shared / 2 || 0) }
  }
  return { answers }
}
