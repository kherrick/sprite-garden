import { harvestCrop } from "./harvestCrop.mjs";
import { plantSeed } from "./plantSeed.mjs";

export function handleFarmAction(currentState, game, doc) {
  const { player, state, TILE_SIZE, TILES, WORLD_HEIGHT, WORLD_WIDTH, world } =
    currentState;

  const playerTileX = Math.floor((player.x + player.width / 2) / TILE_SIZE);
  const playerTileY = Math.floor((player.y + player.height) / TILE_SIZE);

  // Check tile in front of player (where they're facing)
  const targetX = playerTileX;
  const targetY = playerTileY;

  if (
    targetX < 0 ||
    targetX >= WORLD_WIDTH ||
    targetY < 0 ||
    targetY >= WORLD_HEIGHT
  ) {
    return;
  }

  const currentTile = world[targetX][targetY];

  // Harvest crops
  if (currentTile && currentTile.crop) {
    harvestCrop(currentState, targetX, targetY, currentTile, game, doc);
  }
  // Plant seeds
  else if (
    currentTile === TILES.AIR &&
    state.selectedSeedType &&
    state.seedInventory[state.selectedSeedType] > 0
  ) {
    plantSeed(
      currentState,
      targetX,
      targetY,
      state.selectedSeedType,
      game,
      doc,
    );
  }
}
