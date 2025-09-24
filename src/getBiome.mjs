import { biomeNoise, initializeNoise } from "./noise.mjs";

export function getBiome(x, BIOMES, seed) {
  // Initialize noise with seed
  initializeNoise(seed);

  const biomeNoiseValue = biomeNoise(x, parseInt(seed) + 500);
  const temperatureNoise = biomeNoise(x, parseInt(seed) + 600);
  const humidityNoise = biomeNoise(x, parseInt(seed) + 700);

  // Create more interesting biome distribution
  // Temperature: -1 (cold) to 1 (hot)
  const temperature = temperatureNoise;
  // Humidity: -1 (dry) to 1 (wet)
  const humidity = humidityNoise;

  // Biome selection based on temperature and humidity
  if (temperature < -0.4) {
    // Cold regions
    return BIOMES.TUNDRA;
  } else if (temperature > 0.4 && humidity < -0.2) {
    // Hot and dry
    return BIOMES.DESERT;
  } else if (humidity > 0.3) {
    // Wet regions
    return BIOMES.SWAMP;
  } else {
    // Temperate regions
    return BIOMES.FOREST;
  }
}
