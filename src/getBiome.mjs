import { noise } from "./noise.mjs";

export function getBiome(x, BIOMES) {
  const biomeNoise = noise(x, 0, 500);

  if (biomeNoise < -0.5) return BIOMES.DESERT;
  if (biomeNoise < -0.2) return BIOMES.TUNDRA;
  if (biomeNoise < 0.2) return BIOMES.FOREST;
  if (biomeNoise < 0.5) return BIOMES.SWAMP;

  return BIOMES.FOREST;
}
