import { configSignals, stateSignals } from "./state.mjs";
import {
  handleMapEditorClick,
  handleMapEditorDrag,
  handleMapEditorDragEnd,
  mapEditorState,
} from "./mapEditor.mjs";

function getPointerPosition(e, el) {
  const rect = el.getBoundingClientRect();
  let clientX, clientY;

  if (e.touches && e.touches.length > 0) {
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  } else {
    clientX = e.clientX;
    clientY = e.clientY;
  }

  const scale = configSignals.canvasScale.get();
  const scaleX = (el.width / rect.width) * scale;
  const scaleY = (el.height / rect.height) * scale;

  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY,
  };
}

function inspectTile(e, el) {
  const TILE_SIZE = configSignals.TILE_SIZE.get();
  const WORLD_WIDTH = configSignals.WORLD_WIDTH.get();
  const WORLD_HEIGHT = configSignals.WORLD_HEIGHT.get();
  const TILES = configSignals.TILES;
  const world = stateSignals.world.get() || [];
  const camera = stateSignals.camera.get();

  const pos = getPointerPosition(e, el);
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
      el.title = `Tile: Unknown (${worldX}, ${worldY})`;
      return;
    }

    const tile = column[worldY];
    if (!tile) {
      el.title = `Tile: AIR (${worldX}, ${worldY})`;
      return;
    }

    const tileName =
      Object.keys(TILES).find((key) => TILES[key] === tile) || "Custom";
    el.title = `Tile: ${tileName} (${worldX}, ${worldY})`;
  }
}

function handleMouseDown(e) {
  const el = e.target;
  const rect = el.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  // Check if map editor should handle this click
  if (handleMapEditorClick(x, y)) {
    // Start drag for continuous painting
    handleMapEditorDrag(x, y, true);

    e.preventDefault();

    // Don't process tile inspection
    return;
  }
}

function handleMouseUp(e) {
  const el = e.target;

  // Always call this to clean up map editor state
  handleMapEditorDragEnd();
}

function handleMouseMove(e) {
  const el = e.target;

  const rect = el.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  // Handle map editor dragging
  if (e.buttons === 1 && mapEditorState.isEnabled) {
    // Left mouse button down
    if (handleMapEditorDrag(x, y)) {
      e.preventDefault();

      // Don't process tile inspection
      return;
    }
  }

  inspectTile(e, el);
}

function handleTouchStart(e) {
  const el = e.target;

  if (e.touches.length === 1) {
    const rect = el.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    if (handleMapEditorClick(x, y)) {
      handleMapEditorDrag(x, y, true);

      e.preventDefault();

      return;
    }
  }

  inspectTile(e, el);
}

function handleTouchMove(e) {
  const el = e.target;

  if (e.touches.length === 1) {
    const rect = el.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    if (handleMapEditorDrag(x, y)) {
      e.preventDefault();
      return;
    }
  }

  inspectTile(e, el);
}

// Mouse/touch handling for tile inspection
export function setupTileInspection(canvasEl) {
  canvasEl.addEventListener("mousedown", handleMouseDown);
  canvasEl.addEventListener("mousemove", handleMouseMove);
  canvasEl.addEventListener("mouseup", handleMouseUp);
  canvasEl.addEventListener("touchmove", handleTouchMove);
  canvasEl.addEventListener("touchstart", handleTouchStart);
}
