import { createNoise2D } from "../deps/simplex-noise.mjs";
import alea from "../deps/alea.mjs";

// Global noise function with seeded generator
let noise2D = null;
let currentSeed = null;

export function initializeNoise(seed) {
  if (seed !== currentSeed) {
    currentSeed = seed;
    noise2D = createNoise2D(alea(seed));
  }
}

// Enhanced noise function that combines multiple octaves for more natural terrain
export function noise(
  x,
  y,
  seed = 0,
  octaves = 3,
  persistence = 0.5,
  scale = 0.02,
) {
  // Initialize noise if not already done or seed changed
  const seedString = seed.toString();
  if (!noise2D || currentSeed !== seedString) {
    initializeNoise(seedString);
  }

  let value = 0;
  let amplitude = 1;
  let frequency = scale;
  let maxValue = 0;

  // Combine multiple octaves for more interesting terrain
  for (let i = 0; i < octaves; i++) {
    value += noise2D(x * frequency, y * frequency) * amplitude;
    maxValue += amplitude;
    amplitude *= persistence;
    frequency *= 2;
  }

  // Normalize to [-1, 1] range
  return value / maxValue;
}

// Specialized terrain noise for height maps
export function terrainNoise(x, seed = 0) {
  return noise(x, 0, seed, 4, 0.6, 0.015);
}

// Biome noise for determining biome types
export function biomeNoise(x, seed = 500) {
  return noise(x, 0, seed, 2, 0.8, 0.008);
}

// Cave noise for underground generation
export function caveNoise(x, y, seed = 1000) {
  return noise(x, y, seed, 3, 0.7, 0.05);
}

// Water source noise for placing water bodies
export function waterNoise(x, seed = 2000) {
  return noise(x, 0, seed, 2, 0.5, 0.012);
}

// Ore distribution noise
export function oreNoise(x, y, seed = 3000) {
  return noise(x, y, seed, 2, 0.4, 0.08);
}
