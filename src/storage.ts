import type { Note } from './types.ts'

// The only place that knows where notes live. Swap these two for a real DB later.
const KEY = 'notes-garden'

export const load = (): Note[] => {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? 'null') ?? []
  } catch {
    return []
  }
}

export const save = (notes: Note[]) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(notes))
  } catch {}
}
