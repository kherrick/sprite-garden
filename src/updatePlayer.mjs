import { checkCollision } from "./checkCollision.mjs";
import { configSignals, stateSignals } from "./state.mjs";
import { isKeyPressed } from "./isKeyPressed.mjs";

// Update player physics
export function updatePlayer(gThis) {
  const GRAVITY = configSignals.GRAVITY.get();
  const FRICTION = configSignals.FRICTION.get();
  const MAX_FALL_SPEED = configSignals.MAX_FALL_SPEED.get();
  const TILE_SIZE = configSignals.TILE_SIZE.get();
  const WORLD_WIDTH = configSignals.WORLD_WIDTH.get();
  const WORLD_HEIGHT = configSignals.WORLD_HEIGHT.get();

  const player = stateSignals.player.get();
  const camera = stateSignals.camera.get();

  const updatedPlayer = { ...player };

  updatedPlayer.velocityY += GRAVITY;
  if (updatedPlayer.velocityY > MAX_FALL_SPEED) {
    updatedPlayer.velocityY = MAX_FALL_SPEED;
  }

  // Handle horizontal movement and track direction
  if (isKeyPressed(gThis, "a") || isKeyPressed(gThis, "arrowleft")) {
    updatedPlayer.velocityX = -updatedPlayer.speed;
    updatedPlayer.lastDirection = -1;
  } else if (isKeyPressed(gThis, "d") || isKeyPressed(gThis, "arrowright")) {
    updatedPlayer.velocityX = updatedPlayer.speed;
    updatedPlayer.lastDirection = 1;
  } else {
    updatedPlayer.velocityX *= FRICTION;
    updatedPlayer.lastDirection = 0;
  }

  // Handle jumping
  if (
    (isKeyPressed(gThis, "w") ||
      isKeyPressed(gThis, "arrowup") ||
      isKeyPressed(gThis, " ")) &&
    updatedPlayer.onGround
  ) {
    updatedPlayer.velocityY = -updatedPlayer.jumpPower;
    updatedPlayer.onGround = false;
  }

  // Move horizontally
  const newX = updatedPlayer.x + updatedPlayer.velocityX;
  if (
    !checkCollision(
      newX,
      updatedPlayer.y,
      updatedPlayer.width,
      updatedPlayer.height,
    )
  ) {
    updatedPlayer.x = newX;
  } else {
    updatedPlayer.velocityX = 0;
  }

  // Move vertically
  const newY = updatedPlayer.y + updatedPlayer.velocityY;
  if (
    !checkCollision(
      updatedPlayer.x,
      newY,
      updatedPlayer.width,
      updatedPlayer.height,
    )
  ) {
    updatedPlayer.y = newY;
    updatedPlayer.onGround = false;
  } else {
    if (updatedPlayer.velocityY > 0) {
      updatedPlayer.onGround = true;
    }
    updatedPlayer.velocityY = 0;
  }

  // Keep player in world bounds
  updatedPlayer.x = Math.max(
    0,
    Math.min(updatedPlayer.x, WORLD_WIDTH * TILE_SIZE - updatedPlayer.width),
  );
  updatedPlayer.y = Math.max(
    0,
    Math.min(updatedPlayer.y, WORLD_HEIGHT * TILE_SIZE - updatedPlayer.height),
  );

  // Update camera to follow player
  const targetCameraX =
    updatedPlayer.x + updatedPlayer.width / 2 - canvas.width / 2;
  const targetCameraY =
    updatedPlayer.y + updatedPlayer.height / 2 - canvas.height / 2;

  const updatedCamera = { ...camera };

  updatedCamera.x += (targetCameraX - updatedCamera.x) * 0.1;
  updatedCamera.y += (targetCameraY - updatedCamera.y) * 0.1;

  // Keep camera in bounds
  updatedCamera.x = Math.max(
    0,
    Math.min(updatedCamera.x, WORLD_WIDTH * TILE_SIZE - canvas.width),
  );
  updatedCamera.y = Math.max(
    0,
    Math.min(updatedCamera.y, WORLD_HEIGHT * TILE_SIZE - canvas.height),
  );

  // Update the signals
  stateSignals.player.set(updatedPlayer);
  stateSignals.camera.set(updatedCamera);
}
