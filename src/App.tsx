import { useEffect, useRef, useState } from 'react'
import { load, save } from './storage.ts'
import { judge } from './jev.ts'
import type { Note, Species } from './types.ts'

const EMOJI: Record<Species, string> = { flower: '🌷', fern: '🌿', cactus: '🌵', mushroom: '🍄' }
// Size comes from note length; species (from Jev) only shows on mid-size plants.
const plant = (n: Note) => {
  const len = n.text.length
  if (len < 60) return { icon: '🌱', size: 28 }
  if (len < 240) return { icon: EMOJI[n.kind] ?? '🌷', size: 44 }
  return { icon: '🌳', size: 72 }
}

export default function App() {
  const [notes, setNotes] = useState<Note[]>(load)
  const [draft, setDraft] = useState<{ x: number; y: number; text: string } | null>(null)
  const [watering, setWatering] = useState<Set<string>>(() => new Set())
  const [error, setError] = useState('')
  const notesRef = useRef(notes)
  notesRef.current = notes

  useEffect(() => save(notes), [notes])
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setDraft(null)
    addEventListener('keydown', esc)
    return () => removeEventListener('keydown', esc)
  }, [])

  const update = (id: string, patch: Partial<Note>) => setNotes((ns) => ns.map((n) => (n.id === id ? { ...n, ...patch } : n)))

  async function plantNote() {
    if (!draft) return
    const text = draft.text.trim()
    if (!text) return setDraft(null)
    const note: Note = { id: 'n' + Date.now().toString(36), text, x: draft.x, y: draft.y, kind: 'flower', roots: [] }
    const others = notesRef.current
    setNotes([...others, note])
    setDraft(null)
    setError('')
    setWatering((w) => new Set(w).add(note.id))
    try {
      update(note.id, await judge(note, others))
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setWatering((w) => (w.delete(note.id), new Set(w)))
    }
  }

  const byId = Object.fromEntries(notes.map((n) => [n.id, n]))

  return (
    <div className="garden" onClick={(e) => setDraft({ x: e.clientX, y: e.clientY, text: '' })}>
      <svg>
        {notes.flatMap((n) =>
          n.roots.filter((r) => byId[r.to]).map((r) => {
            const t = byId[r.to]
            const mx = (n.x + t.x) / 2, my = Math.max(n.y, t.y) + 50 + Math.abs(n.x - t.x) * 0.15
            return (
              <path
                key={n.id + r.to}
                className="root"
                d={`M${n.x},${n.y} Q${mx},${my} ${t.x},${t.y}`}
                strokeWidth={1 + r.w * 6}
                opacity={0.25 + r.w * 0.6}
              />
            )
          }),
        )}
      </svg>
      {notes.map((n) => {
        const p = plant(n)
        return (
          <div
            key={n.id}
            className={'plant' + (watering.has(n.id) ? ' watering' : '')}
            style={{ left: n.x, top: n.y, fontSize: p.size }}
            title={n.text}
            onClick={(e) => e.stopPropagation()}
          >
            {p.icon}
            <span className="label">{n.text.slice(0, 24)}</span>
          </div>
        )
      })}
      {draft && (
        <div className="popup" style={{ left: Math.min(draft.x, innerWidth - 300), top: Math.min(draft.y, innerHeight - 220) }} onClick={(e) => e.stopPropagation()}>
          <textarea
            autoFocus
            placeholder="Plant a thought…"
            value={draft.text}
            onChange={(e) => setDraft({ ...draft, text: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && (e.metaKey || e.ctrlKey) && plantNote()}
          />
          <button onClick={plantNote}>Plant ⌘↵</button>
        </div>
      )}
      <div className="hint">{notes.length ? 'Click the ground to plant another note' : 'Click anywhere to plant your first note'}</div>
      {error && <div className="error">{error}</div>}
    </div>
  )
}
