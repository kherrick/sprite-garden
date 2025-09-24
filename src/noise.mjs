// World generation functions
export function noise(x, y, seed = 0) {
  let n = Math.sin(x * 0.02 + seed) * Math.sin(y * 0.02 + seed);

  n += Math.sin(x * 0.04 + seed) * Math.sin(y * 0.04 + seed) * 0.5;
  n += Math.sin(x * 0.08 + seed) * Math.sin(y * 0.08 + seed) * 0.25;

  return n;
}
