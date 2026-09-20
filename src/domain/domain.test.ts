import test from 'node:test'
import assert from 'node:assert/strict'
import { hash32, mulberry32 } from './prng.ts'
import { tierOf } from './rules.ts'

test('same seed gives the same sequence, different seed does not', () => {
  const seq = (s: number) => { const r = mulberry32(s); return Array.from({ length: 5 }, r) }
  assert.deepEqual(seq(42), seq(42))
  assert.notDeepEqual(seq(42), seq(43))
  assert.ok(seq(1).every((x) => x >= 0 && x < 1))
})

test('hash32 is stable and a uint32', () => {
  assert.equal(hash32('abc'), hash32('abc'))
  assert.notEqual(hash32('abc'), hash32('abd'))
  assert.ok(Number.isInteger(hash32('x')) && hash32('x') >= 0 && hash32('x') < 2 ** 32)
})

test('tier boundaries at 59/60/239/240', () => {
  const t = (n: number) => tierOf('a'.repeat(n))
  assert.deepEqual([t(59), t(60), t(239), t(240)], ['sprout', 'mid', 'mid', 'tree'])
})
