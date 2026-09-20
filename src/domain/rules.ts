export type Tier = 'sprout' | 'mid' | 'tree'

// Size tier from note length: 'sprout' < 60 <= 'mid' < 240 <= 'tree'.
export const tierOf = (text: string): Tier => (text.length < 60 ? 'sprout' : text.length < 240 ? 'mid' : 'tree')
