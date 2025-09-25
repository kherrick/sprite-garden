// mapFog.mjs
import { configSignals, stateSignals } from "./state.mjs";

// Update explored map based on player position
export function updateMapFog() {
  const TILE_SIZE = configSignals.TILE_SIZE.get();
  const player = stateSignals.player.get();
  const exploredMap = stateSignals.exploredMap?.get() || {};

  const FOG_REVEAL_RADIUS = 15;

  // Calculate player's tile position
  const playerTileX = Math.floor((player.x + player.width / 2) / TILE_SIZE);
  const playerTileY = Math.floor((player.y + player.height / 2) / TILE_SIZE);

  let mapUpdated = false;
  const newExploredMap = { ...exploredMap };

  // Reveal tiles in a circle around the player
  for (let dx = -FOG_REVEAL_RADIUS; dx <= FOG_REVEAL_RADIUS; dx++) {
    for (let dy = -FOG_REVEAL_RADIUS; dy <= FOG_REVEAL_RADIUS; dy++) {
      const tileX = playerTileX + dx;
      const tileY = playerTileY + dy;

      // Check if within circular radius
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance <= FOG_REVEAL_RADIUS) {
        const key = `${tileX},${tileY}`;

        if (!newExploredMap[key]) {
          newExploredMap[key] = true;
          mapUpdated = true;
        }
      }
    }
  }

  // Only update state if something changed
  if (mapUpdated) {
    stateSignals.exploredMap.set(newExploredMap);
  }
}

// Check if a tile is explored
export function isTileExplored(tileX, tileY) {
  const exploredMap = stateSignals.exploredMap?.get() || {};

  return exploredMap[`${tileX},${tileY}`] === true;
}

// Render map fog overlay
export function renderMapFog(ctx, canvas) {
  if (!ctx || !canvas) return;

  const TILE_SIZE = configSignals.TILE_SIZE.get();
  const WORLD_WIDTH = configSignals.WORLD_WIDTH.get();
  const WORLD_HEIGHT = configSignals.WORLD_HEIGHT.get();
  const camera = stateSignals.camera.get();
  const FOG_COLOR = "rgba(0, 0, 0, 1)";

  // Calculate visible area
  const tilesX = Math.ceil(canvas.width / TILE_SIZE) + 1;
  const tilesY = Math.ceil(canvas.height / TILE_SIZE) + 1;
  const startX = Math.floor(camera.x / TILE_SIZE);
  const startY = Math.floor(camera.y / TILE_SIZE);

  // Draw fog over unexplored tiles
  ctx.fillStyle = FOG_COLOR;

  for (let x = 0; x < tilesX; x++) {
    for (let y = 0; y < tilesY; y++) {
      const worldX = startX + x;
      const worldY = startY + y;

      // Check bounds
      if (
        worldX >= 0 &&
        worldX < WORLD_WIDTH &&
        worldY >= 0 &&
        worldY < WORLD_HEIGHT
      ) {
        // If tile is not explored, draw fog
        if (!isTileExplored(worldX, worldY)) {
          const screenX = Math.round(x * TILE_SIZE - (camera.x % TILE_SIZE));
          const screenY = Math.round(y * TILE_SIZE - (camera.y % TILE_SIZE));

          ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
        }
      }
    }
  }
}

// Reset map fog (useful for new worlds)
export function resetMapFog() {
  stateSignals.exploredMap?.set({});
}
