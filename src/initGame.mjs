import { configSignals, initState } from "./state.mjs";
import { gameLoop } from "./gameLoop.mjs";
import { generateNewWorld } from "./generateWorld.mjs";
import { resizeCanvas } from "./resizeCanvas.mjs";

import {
  setupDocumentEventListeners,
  setupElementEventListeners,
  setupGlobalEventListeners,
} from "./setupEventListeners.mjs";

import { setupEffects } from "./setupEffects.mjs";
import { setupTileInspection } from "./setupTileInspection.mjs";
import { setupTouchControls } from "./setupTouchControls.mjs";

// Initialize game
export function initGame(doc, cnvs) {
  initState(globalThis);

  setupGlobalEventListeners(globalThis);
  setupDocumentEventListeners(globalThis);
  setupElementEventListeners(doc);
  setupEffects(doc);
  setupTouchControls(globalThis);
  setupTileInspection(cnvs);

  resizeCanvas(doc, configSignals);
  generateNewWorld(doc);

  gameLoop(globalThis);
}
