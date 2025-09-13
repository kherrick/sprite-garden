// Update inventory display
export function updateInventoryDisplay(state, doc) {
  const seedTypes = ["wheat", "carrot", "mushroom", "cactus"];
  const inventory = state.seedInventory?.get();
  const selectedSeed = state.selectedSeedType?.get();

  seedTypes.forEach((seedType) => {
    const el = doc.getElementById(`${seedType}Count`);
    try {
      if (el) {
        el.textContent = inventory[seedType.toUpperCase()];
      }
    } catch (e) {}
  });

  const selectedSeedEl = doc.getElementById("selectedSeed");
  if (selectedSeedEl) {
    selectedSeedEl.textContent = selectedSeed || "None";
  }

  // Update button styles
  const seedButtons = doc.querySelectorAll(".seed-btn");
  seedButtons.forEach((btn) => {
    btn.classList.remove("selected");
  });

  if (selectedSeed) {
    const seedTypeMap = {
      WHEAT: 0,
      CARROT: 1,
      MUSHROOM: 2,
      CACTUS: 3,
    };
    const buttonIndex = seedTypeMap[selectedSeed];
    if (buttonIndex !== undefined) {
      seedButtons[buttonIndex].classList.add("selected");
    }
  }

  if (inventory) {
    // Update total seed count - calculate from inventory
    const totalSeeds = Object.values(inventory).reduce(
      (sum, count) => sum + count,
      0,
    );

    const seedCountEl = doc.getElementById("seedCount");
    if (seedCountEl) {
      seedCountEl.textContent = totalSeeds;
    }
  }
}
