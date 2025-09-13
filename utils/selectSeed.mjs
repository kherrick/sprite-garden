import { updateInventoryDisplay } from "./updateInventoryDisplay.mjs";

// Farming functions
export function selectSeed(state, event, doc) {
  const [seedType] = Object.keys(event.currentTarget.dataset);

  console.log(`Selecting seed: ${seedType}`);

  const currentSelected = state.selectedSeedType.get();
  console.log(`Current selected: ${currentSelected}`);

  const newSelected =
    currentSelected === seedType.toUpperCase() ? null : seedType.toUpperCase();

  state.selectedSeedType.set(newSelected);

  console.log(`New selected: ${newSelected}`);

  updateInventoryDisplay(state, doc);
}
