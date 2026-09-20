// Today's note shape. Schema v2 replaces this in PR 2.
export type Species = 'flower' | 'fern' | 'cactus' | 'mushroom'
export type Root = { to: string; w: number }
export type Note = { id: string; text: string; x: number; y: number; kind: Species; roots: Root[] }
