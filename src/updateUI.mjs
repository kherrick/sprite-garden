import { getBiome } from "./getBiome.mjs";
import { getRandomSeed } from "./getRandomSeed.mjs";

export function updateUI(doc, gameState) {
  const {
    BIOMES,
    gameTime,
    player,
    SURFACE_LEVEL,
    TILE_SIZE,
    viewMode,
    WORLD_WIDTH,
    worldSeed,
  } = gameState;

  // @todo - compare with effects
  const gameTimeEl = doc?.getElementById("gameTime");
  if (gameTimeEl) {
    gameTimeEl.textContent = Math.floor(gameTime);
  }

  const playerTileX = Math.floor(player.x / TILE_SIZE);
  const playerTileY = Math.floor(player.y / TILE_SIZE);

  if (playerTileX >= 0 && playerTileX < WORLD_WIDTH) {
    const biome = getBiome(playerTileX, BIOMES, worldSeed);
    const biomeEl = doc?.getElementById("currentBiome");
    if (biomeEl) {
      biomeEl.textContent = biome.name;
    }
  }

  let depth = "Surface";
  if (playerTileY > SURFACE_LEVEL) {
    const depthLevel = playerTileY - SURFACE_LEVEL;
    if (depthLevel < 15) depth = "Shallow";
    else if (depthLevel < 30) depth = "Deep";
    else depth = "Very Deep";
  } else if (playerTileY < SURFACE_LEVEL - 5) {
    depth = "Sky";
  }

  const depthEl = doc?.getElementById("currentDepth");
  if (depthEl) {
    depthEl.textContent = depth;
  }

  // Update view mode button text
  const viewModeEl = doc?.getElementById("viewModeText");
  if (viewModeEl) {
    viewModeEl.textContent = viewMode === "normal" ? "X-Ray" : "Normal";
  }

  const seedInput = doc?.getElementById("worldSeedInput");
  if (!seedInput.value) {
    const currentSeedDisplay = doc?.getElementById("currentSeed");

    if (worldSeed) {
      seedInput.value = worldSeed;
      currentSeedDisplay.textContent = worldSeed;

      return;
    }

    const randomSeed = getRandomSeed();

    seedInput.value = randomSeed;
    currentSeedDisplay.textContent = randomSeed;
  }
}
