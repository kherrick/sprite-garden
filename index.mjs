import { initGame } from "./src/initGame.mjs";

const doc = globalThis.document;

// Start the game
doc.addEventListener("DOMContentLoaded", async function () {
  await initGame(doc, doc.getElementById("canvas"));
});
