import { terrainNoise, initializeNoise } from "./noise.mjs";

export function generateHeightMap(WORLD_WIDTH, SURFACE_LEVEL, seed) {
  // Initialize the seeded noise generator
  initializeNoise(seed);

  const heights = [];

  for (let x = 0; x < WORLD_WIDTH; x++) {
    let height = SURFACE_LEVEL;

    // Main terrain shape - large rolling hills
    height += terrainNoise(x, parseInt(seed)) * 15;

    // Add medium frequency variation for more interesting terrain
    height += terrainNoise(x, parseInt(seed) + 100) * 8;

    // Add small details
    height += terrainNoise(x, parseInt(seed) + 200) * 4;

    // Add some sharper features occasionally
    const sharpNoise = terrainNoise(x, parseInt(seed) + 300);
    if (sharpNoise > 0.6) {
      height += (sharpNoise - 0.6) * 20; // Create occasional peaks
    }

    // Ensure height is within reasonable bounds
    height = Math.max(10, Math.min(SURFACE_LEVEL * 1.5, height));

    heights[x] = Math.floor(height);
  }

  // Smooth out any extreme variations to make terrain more pleasant
  return smoothHeights(heights, 2);
}

// Smooth the height map to prevent overly jagged terrain
function smoothHeights(heights, passes = 1) {
  const smoothed = [...heights];

  for (let pass = 0; pass < passes; pass++) {
    for (let x = 1; x < heights.length - 1; x++) {
      // Simple 3-point smoothing
      smoothed[x] = Math.floor(
        (heights[x - 1] + heights[x] * 2 + heights[x + 1]) / 4,
      );
    }

    heights.splice(0, heights.length, ...smoothed);
  }

  return heights;
}
