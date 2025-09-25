import { updateInventoryDisplay } from "./updateInventoryDisplay.mjs";

// Material selection function
export function selectMaterial(doc, state, event) {
  const [materialType] = Object.keys(event.currentTarget.dataset);

  console.log(`Selecting material: ${materialType}`);

  const currentSelected = state.selectedMaterialType.get();
  console.log(`Current selected material: ${currentSelected}`);

  const newSelected =
    currentSelected === materialType.toUpperCase()
      ? null
      : materialType.toUpperCase();

  state.selectedMaterialType.set(newSelected);

  console.log(`New selected material: ${newSelected}`);

  updateInventoryDisplay(doc, state);
}
