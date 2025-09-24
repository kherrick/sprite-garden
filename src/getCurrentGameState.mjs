// Create game state object for passing to functional methods
export const getCurrentGameState = (stateSignals, configSignals) => {
  return {
    state: {
      seedInventory: stateSignals.seedInventory.get(),
      selectedSeedType: stateSignals.selectedSeedType.get(),
      gameTime: stateSignals.gameTime.get(),
      growthTimers: stateSignals.growthTimers.get(),
      plantStructures: stateSignals.plantStructures.get(),
      seeds: stateSignals.seeds.get(),
      viewMode: stateSignals.viewMode.get(),
    },
    BIOMES: configSignals.BIOMES,
    camera: stateSignals.camera.get(),
    FRICTION: configSignals.FRICTION.get(),
    GRAVITY: configSignals.GRAVITY.get(),
    MAX_FALL_SPEED: configSignals.MAX_FALL_SPEED.get(),
    player: stateSignals.player.get(),
    SURFACE_LEVEL: configSignals.SURFACE_LEVEL.get(),
    TILE_SIZE: configSignals.TILE_SIZE.get(),
    TILES: configSignals.TILES,
    WORLD_HEIGHT: configSignals.WORLD_HEIGHT.get(),
    WORLD_WIDTH: configSignals.WORLD_WIDTH.get(),
    world: stateSignals.world.get(),
    worldSeed: configSignals.worldSeed.get(),
  };
};
