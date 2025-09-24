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
    player: stateSignals.player.get(),
    world: stateSignals.world.get(),
    camera: stateSignals.camera.get(),
    TILES: configSignals.TILES,
    TILE_SIZE: configSignals.TILE_SIZE.get(),
    WORLD_WIDTH: configSignals.WORLD_WIDTH.get(),
    WORLD_HEIGHT: configSignals.WORLD_HEIGHT.get(),
    SURFACE_LEVEL: configSignals.SURFACE_LEVEL.get(),
    BIOMES: configSignals.BIOMES,
    GRAVITY: configSignals.GRAVITY.get(),
    FRICTION: configSignals.FRICTION.get(),
    MAX_FALL_SPEED: configSignals.MAX_FALL_SPEED.get(),
  };
};
