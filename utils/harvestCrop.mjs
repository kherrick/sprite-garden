import { updateInventoryDisplay } from "./updateInventoryDisplay.mjs";

export function harvestCrop(currentState, x, y, cropTile, game, doc) {
  const { state, world, TILES, growthTimers } = currentState;

  const harvestMap = {
    [TILES.WHEAT.id]: "WHEAT",
    [TILES.CARROT.id]: "CARROT",
    [TILES.MUSHROOM.id]: "MUSHROOM",
    [TILES.CACTUS.id]: "CACTUS",
  };

  const seedType = harvestMap[cropTile.id];
  if (seedType) {
    // Give player 2-4 seeds when harvesting
    const seedsGained = 2 + Math.floor(Math.random() * 3);
    game.updateState("seedInventory", (inv) => ({
      ...inv,
      [seedType]: inv[seedType] + seedsGained,
    }));

    // Remove crop from world
    const currentWorld = game.state.world.get();
    currentWorld[x][y] = TILES.AIR;

    game.state.world.set([...currentWorld]);

    // Remove from growth timers
    const currentTimers = game.state.growthTimers.get();
    const updatedTimers = { ...currentTimers };
    delete updatedTimers[`${x},${y}`];

    game.state.growthTimers.set(updatedTimers);

    updateInventoryDisplay(game, doc);
  }
}
