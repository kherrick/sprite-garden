export function createSaveState(gThis) {
  const saveState = {
    config: {},
    state: {},
  };

  // Extract config
  for (const key in gThis.spriteGarden.config) {
    const entry = gThis.spriteGarden.config[key];
    // If it's a reactive signal
    if (entry && typeof entry.get === "function") {
      saveState.config[key] = gThis.spriteGarden.getConfig(key);
    } else {
      // static object (like TILES or BIOMES)
      saveState.config[key] = entry;
    }
  }

  // Extract state
  for (const key in gThis.spriteGarden.state) {
    const entry = gThis.spriteGarden.state[key];
    if (entry && typeof entry.get === "function") {
      saveState.state[key] = gThis.spriteGarden.getState(key);
    } else {
      saveState.state[key] = entry;
    }
  }

  return saveState;
}
