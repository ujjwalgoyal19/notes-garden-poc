// The only place that knows where notes live. Swap these two for a real DB later.
const KEY = 'notes-garden'

export const load = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY)) ?? []
  } catch {
    return []
  }
}

export const save = (notes) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(notes))
  } catch {}
}
