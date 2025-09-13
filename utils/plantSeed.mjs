import { updateInventoryDisplay } from "./updateInventoryDisplay.mjs";

export function plantSeed(currentState, x, y, seedType, game, doc) {
  const { state, world, TILES, growthTimers } = currentState;

  // Check if there's farmable ground below
  const belowTile = world[x][y + 1];
  if (!belowTile || !belowTile.farmable) {
    console.log(`Cannot plant at (${x}, ${y}) - no farmable ground below`);
    return; // Can't plant without farmable ground
  }

  const seedTileMap = {
    WHEAT: TILES.WHEAT_GROWING,
    CARROT: TILES.CARROT_GROWING,
    MUSHROOM: TILES.MUSHROOM_GROWING,
    CACTUS: TILES.CACTUS_GROWING,
  };

  if (seedTileMap[seedType] && state.seedInventory[seedType] > 0) {
    // Update world
    const currentWorld = game.state.world.get();
    currentWorld[x][y] = seedTileMap[seedType];
    game.state.world.set([...currentWorld]);

    // Update seed inventory
    game.updateState("seedInventory", (inv) => ({
      ...inv,
      [seedType]: inv[seedType] - 1,
    }));

    // Set growth timer
    const growthKey = `${x},${y}`;
    const currentTimers = game.state.growthTimers.get();
    game.state.growthTimers.set({
      ...currentTimers,
      [growthKey]: {
        timeLeft: TILES[seedType].growthTime,
        seedType: seedType,
      },
    });

    updateInventoryDisplay(game.state, doc);

    console.log(
      `Planted ${seedType} at (${x}, ${y}), ${
        game.state.seedInventory.get()[seedType]
      } seeds remaining`,
    );
  } else {
    console.log(
      `Cannot plant ${seedType} - no seeds available or invalid seed type`,
    );
  }
}
