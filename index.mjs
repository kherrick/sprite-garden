import { initGame } from "./src/initGame.mjs";

const doc = globalThis.document;

// Start the game
doc.addEventListener("DOMContentLoaded", function () {
  initGame(doc, doc.getElementById("canvas"));
});
