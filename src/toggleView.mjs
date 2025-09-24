import { configSignals, stateSignals } from "./state.mjs";
import { getCurrentGameState } from "./getCurrentGameState.mjs";
import { updateUI } from "./updateUI.mjs";

export function toggleView(doc) {
  const currentMode = stateSignals.viewMode.get();

  stateSignals.viewMode.set(currentMode === "normal" ? "xray" : "normal");

  updateUI(doc, getCurrentGameState(stateSignals, configSignals));
}
