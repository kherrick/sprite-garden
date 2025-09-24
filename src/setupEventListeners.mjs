import { configSignals, stateSignals } from "./state.mjs";
import { copyToClipboard } from "./copyToClipboard.mjs";
import { generateNewWorld } from "./generateWorld.mjs";
import { getCurrentGameState } from "./getCurrentGameState.mjs";
import { getRandomSeed } from "./getRandomSeed.mjs";
import { handleBreakBlock } from "./handleBreakBlock.mjs";
import { handleFarmAction } from "./handleFarmAction.mjs";
import { resizeCanvas } from "./resizeCanvas.mjs";
import { selectSeed } from "./selectSeed.mjs";
import { toggleBreakMode } from "./toggleBreakMode.mjs";
import { toggleView } from "./toggleView.mjs";

export function setupGlobalEventListeners(gThis) {
  // Setup event listeners
  gThis.addEventListener("resize", () =>
    resizeCanvas(gThis.document, configSignals),
  );

  // Input handling
  gThis.spriteGarden.keys = {};
  gThis.spriteGarden.touchKeys = {};
}

export function setupDocumentEventListeners(gThis) {
  const doc = gThis.document;

  // Keyboard events
  doc.addEventListener("keydown", (e) => {
    gThis.spriteGarden.keys[e.key.toLowerCase()] = true;

    // Allow digits 0-9, enter, and delete
    if (e.key.toLowerCase() === "enter") {
      if (e.target.getAttribute("id") === "worldSeedInput") {
        handleGenerateButton();
      }
    }
    if (
      (e.key.toLowerCase() >= "0" && e.key.toLowerCase() <= "9") ||
      e.key.toLowerCase() === "backspace" ||
      e.key.toLowerCase() === "delete"
    ) {
      return;
    }

    // Add 'R' key to regenerate world with random seed
    if (e.key.toLowerCase() === "r" && e.ctrlKey) {
      e.preventDefault();

      handleRandomSeedButton();
    }

    // Add 'S' key to show / hide the world generation panel
    if (e.key.toLowerCase() === "s" && e.ctrlKey) {
      e.preventDefault();
      document
        .querySelector('[class="seed-controls"]')
        .toggleAttribute("hidden");
    }

    // Add 'G' key to regenerate world with current seed (to see changes)
    if (e.key.toLowerCase() === "g" && e.ctrlKey) {
      e.preventDefault();

      handleGenerateButton();
    }

    // Handle farming actions
    if (e.key.toLowerCase() === "e") {
      handleFarmAction(
        getCurrentGameState(stateSignals, configSignals),
        gThis.spriteGarden,
        doc,
      );
    } else if (e.key.toLowerCase() === "q") {
      handleBreakBlock(
        getCurrentGameState(stateSignals, configSignals),
        gThis.spriteGarden,
        doc,
        configSignals.breakMode.get(),
      );
    }

    e.preventDefault();
  });

  doc.addEventListener("keyup", (e) => {
    gThis.spriteGarden.keys[e.key.toLowerCase()] = false;

    e.preventDefault();
  });

  // Prevent default touch behaviors
  doc.addEventListener(
    "touchstart",
    (e) => {
      if (e.target.closest("#touchControls") || e.target === canvas) {
        e.preventDefault();
      }
    },
    { passive: false },
  );

  doc.addEventListener(
    "touchmove",
    (e) => {
      if (e.target.closest("#touchControls") || e.target === canvas) {
        e.preventDefault();
      }
    },
    { passive: false },
  );

  doc.addEventListener(
    "touchend",
    (e) => {
      if (e.target.closest("#touchControls") || e.target === canvas) {
        e.preventDefault();
      }
    },
    { passive: false },
  );

  // Prevent context menu on long press
  doc.addEventListener("contextmenu", (e) => {
    if (e.target.closest("#touchControls") || e.target === canvas) {
      e.preventDefault();
    }
  });

  // Prevent zoom on double tap
  doc.addEventListener("dblclick", (e) => {
    if (e.target.closest("#touchControls") || e.target === canvas) {
      e.preventDefault();
    }
  });

  function handleGenerateButton() {
    const seedInput = doc.getElementById("worldSeedInput");
    const currentSeedDisplay = doc.getElementById("currentSeed");

    generateNewWorld(doc, seedInput.value);

    console.log(`Generated new world with seed: ${seedInput.value}`);

    currentSeedDisplay.textContent = seedInput.value;
  }

  function handleRandomSeedButton() {
    const currentSeedDisplay = doc.getElementById("currentSeed");
    const seedInput = doc.getElementById("worldSeedInput");
    const randomSeed = getRandomSeed();

    generateNewWorld(doc, randomSeed);

    console.log(`Generated new world with random seed: ${randomSeed}`);

    seedInput.value = randomSeed;
    currentSeedDisplay.textContent = randomSeed;
  }

  const generateBtn = doc.getElementById("generateWithSeed");
  generateBtn.addEventListener("click", handleGenerateButton);

  const randomBtn = doc.getElementById("randomSeed");
  randomBtn.addEventListener("click", handleRandomSeedButton);

  const copySeedBtn = doc.getElementById("copySeed");
  copySeedBtn.addEventListener("click", async function () {
    const seedInput = doc.getElementById("worldSeedInput");

    await copyToClipboard(gThis, seedInput.value);
  });
}

export function setupElementEventListeners(doc) {
  doc.getElementById("stats").addEventListener("click", (e) => {
    e.stopPropagation();

    doc.getElementById("ui-grid").toggleAttribute("hidden");
  });

  doc.getElementById("gameContainer").addEventListener("click", (e) => {
    e.stopPropagation();

    const uiGrid = doc.getElementById("ui-grid");

    if (uiGrid.getAttribute("hidden") !== null) {
      uiGrid.removeAttribute("hidden");
    }
  });

  doc.getElementById("gameContainer").addEventListener("touchend", (e) => {
    const uiGrid = doc.getElementById("ui-grid");

    if (uiGrid.getAttribute("hidden") !== null) {
      uiGrid.removeAttribute("hidden");
    }
  });

  doc.getElementById("controls").addEventListener("click", (e) => {
    e.stopPropagation();

    doc.getElementById("touchControls").toggleAttribute("hidden");
  });

  const resolutionSelectEl = doc.getElementById("resolutionSelect");
  if (resolutionSelectEl) {
    resolutionSelectEl.addEventListener("change", (e) => {
      configSignals.currentResolution.set(e.currentTarget.value);

      resizeCanvas(doc, configSignals);
    });
  }

  const genBtn = doc.getElementById("generateNewWorld");
  if (genBtn)
    genBtn.addEventListener("click", () => {
      const seedInput = doc.getElementById("worldSeedInput");
      const currentSeedDisplay = doc.getElementById("currentSeed");
      currentSeedDisplay.textContent = seedInput.value;

      generateNewWorld(doc, seedInput.value);
    });

  doc.querySelectorAll(".seed-btn").forEach((seedBtn) => {
    seedBtn.addEventListener("click", (e) => selectSeed(doc, stateSignals, e));
  });

  const toggleBtn = doc.getElementById("toggleView");
  if (toggleBtn) toggleBtn.addEventListener("click", () => toggleView(doc));

  const toggleBreakBtn = doc.getElementById("toggleBreakMode");
  if (toggleBreakBtn)
    toggleBreakBtn.addEventListener("click", () => toggleBreakMode());

  // Set default to 400x400 and update the select element
  const sel = doc.getElementById("resolutionSelect");
  if (sel) sel.value = "400";
}
