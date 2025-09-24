import { configSignals } from "./state.mjs";

export function toggleBreakMode() {
  const currentMode = configSignals.breakMode.get();

  configSignals.breakMode.set(currentMode === "regular" ? "extra" : "regular");
}
