import { configSignals, stateSignals } from "./state.mjs";

// Mouse/touch handling for tile inspection
export function setupTileInspection(canvasEl) {
  const getPointerPosition = (e) => {
    const rect = canvasEl.getBoundingClientRect();
    let clientX, clientY;

    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const scale = configSignals.canvasScale.get();
    const scaleX = (canvasEl.width / rect.width) * scale;
    const scaleY = (canvasEl.height / rect.height) * scale;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const inspectTile = (e) => {
    const TILE_SIZE = configSignals.TILE_SIZE.get();
    const WORLD_WIDTH = configSignals.WORLD_WIDTH.get();
    const WORLD_HEIGHT = configSignals.WORLD_HEIGHT.get();
    const TILES = configSignals.TILES;
    const world = stateSignals.world.get() || [];
    const camera = stateSignals.camera.get();

    const pos = getPointerPosition(e);
    const worldX = Math.floor((pos.x + camera.x) / TILE_SIZE);
    const worldY = Math.floor((pos.y + camera.y) / TILE_SIZE);

    if (
      worldX >= 0 &&
      worldX < WORLD_WIDTH &&
      worldY >= 0 &&
      worldY < WORLD_HEIGHT
    ) {
      const column = world[worldX];
      if (!column) {
        canvasEl.title = `Tile: Unknown (${worldX}, ${worldY})`;
        return;
      }
      const tile = column[worldY];
      if (!tile) {
        canvasEl.title = `Tile: AIR (${worldX}, ${worldY})`;
        return;
      }
      const tileName =
        Object.keys(TILES).find((key) => TILES[key] === tile) || "Custom";
      canvasEl.title = `Tile: ${tileName} (${worldX}, ${worldY})`;
    }
  };

  canvasEl.addEventListener("mousemove", inspectTile);
  canvasEl.addEventListener("touchstart", inspectTile);
  canvasEl.addEventListener("touchmove", inspectTile);
}
