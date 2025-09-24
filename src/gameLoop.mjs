import { configSignals, stateSignals } from "./state.mjs";
import { getCurrentGameState } from "./getCurrentGameState.mjs";
import { render } from "./render.mjs";
import { updateCrops } from "./updateCrops.mjs";
import { updatePlayer } from "./updatePlayer.mjs";
import { updateUI } from "./updateUI.mjs";

// Game loop
export function gameLoop(gThis) {
  updatePlayer(gThis);

  updateCrops(
    getCurrentGameState(stateSignals, configSignals),
    gThis.spriteGarden,
  );

  const canvas = gThis.document?.getElementById("canvas");

  render(canvas);

  updateUI(gThis.document, getCurrentGameState(stateSignals, configSignals));

  // Increment game time every frame (we store seconds as fractional)
  stateSignals.gameTime.set(stateSignals.gameTime.get() + 1 / 60);

  requestAnimationFrame(() => gameLoop(gThis));
}
