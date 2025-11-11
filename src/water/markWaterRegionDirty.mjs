// Track water changes during gameplay
export function markWaterRegionDirty({
  x,
  y,
  radius = 5,
  queue,
  worldWidth,
  worldHeight,
}) {
  const currentQueue = queue.get();
  // Add all tiles in radius to the dirty queue
  for (let dx = -radius; dx <= radius; dx++) {
    for (let dy = -radius; dy <= radius; dy++) {
      const checkX = x + dx;
      const checkY = y + dy;

      if (
        checkX >= 0 &&
        checkX < worldWidth &&
        checkY >= 0 &&
        checkY < worldHeight
      ) {
        currentQueue.add(`${checkX},${checkY}`);
      }
    }
  }
}
