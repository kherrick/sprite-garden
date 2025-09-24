import { configSignals, stateSignals } from "./state.mjs";
import { generateNewWorld } from "./generateWorld.mjs";
import { getCurrentGameState } from "./getCurrentGameState.mjs";
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
  if (genBtn) genBtn.addEventListener("click", () => generateNewWorld());

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
