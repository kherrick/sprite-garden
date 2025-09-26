export function loadSaveState(gThis, saveState) {
  // Restore config
  for (const key in saveState.config) {
    if (gThis.spriteGarden.config[key]?.set) {
      gThis.spriteGarden.setConfig(key, saveState.config[key]);
    }
  }

  // Restore state
  for (const key in saveState.state) {
    if (gThis.spriteGarden.state[key]?.set) {
      gThis.spriteGarden.setState(key, saveState.state[key]);
    }
  }
}
