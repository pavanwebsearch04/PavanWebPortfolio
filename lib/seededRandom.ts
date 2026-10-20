// Deterministic PRNG (mulberry32) so the organic web geometry is stable
// across server/client renders instead of using Math.random().
export function mulberry32(seed: number) {
  let a = seed;
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function rangeFrom(rng: () => number, min: number, max: number) {
  return min + rng() * (max - min);
}
