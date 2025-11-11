import { isSolid } from "./isSolid.mjs";

// Check collision with world
export function checkCollision({
  height,
  tileSize,
  width,
  world,
  worldHeight,
  worldWidth,
  x,
  y,
}) {
  const points = [
    [x, y],
    [x + width, y],
    [x, y + height],
    [x + width, y + height],
    [x + width / 2, y],
    [x + width / 2, y + height],
    [x, y + height / 2],
    [x + width, y + height / 2],
  ];

  return points.some((point) =>
    isSolid({
      tileSize,
      world,
      worldHeight,
      worldWidth,
      x: point[0],
      y: point[1],
    }),
  );
}
