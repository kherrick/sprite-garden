import { getBiome } from "./getBiome.mjs";

export function updateUI(doc, gameState) {
  const {
    gameTime,
    player,
    TILE_SIZE,
    WORLD_WIDTH,
    SURFACE_LEVEL,
    BIOMES,
    viewMode,
  } = gameState;

  // @todo - compare with effects
  const gameTimeEl = doc?.getElementById("gameTime");
  if (gameTimeEl) {
    gameTimeEl.textContent = Math.floor(gameTime);
  }

  const playerTileX = Math.floor(player.x / TILE_SIZE);
  const playerTileY = Math.floor(player.y / TILE_SIZE);

  if (playerTileX >= 0 && playerTileX < WORLD_WIDTH) {
    const biome = getBiome(playerTileX, BIOMES);
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
}
