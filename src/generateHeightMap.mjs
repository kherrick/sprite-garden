import { noise } from "./noise.mjs";

export function generateHeightMap(WORLD_WIDTH, SURFACE_LEVEL) {
  const heights = [];
  const seed = Math.random() * 1000;

  for (let x = 0; x < WORLD_WIDTH; x++) {
    let height = SURFACE_LEVEL;

    height += noise(x, 0, seed) * 10;
    height += noise(x, 0, seed + 100) * 5;

    heights[x] = Math.floor(height);
  }

  return heights;
}
