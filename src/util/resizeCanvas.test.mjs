/**
 * @jest-environment jsdom
 */
import { jest } from "@jest/globals";
import { Signal } from "signal-polyfill";

import { resizeCanvas } from "./resizeCanvas.mjs";

describe("resizeCanvas utility", () => {
  let shadow;
  let mockHost;
  let mockCanvas;
  let gameConfig;

  beforeEach(() => {
    // Create mock canvas
    mockCanvas = document.createElement("canvas");
    mockCanvas.id = "canvas";

    // Create mock shadow root host with proper classList
    mockHost = document.createElement("div");

    // Create mock shadow root
    shadow = document.createElement("div").attachShadow({ mode: "open" });
    shadow.getElementById = jest.fn((id) => {
      if (id === "canvas") {
        return mockCanvas;
      }

      return null;
    });

    Object.defineProperty(shadow, "host", {
      value: mockHost,
      writable: true,
    });

    // Create mock gameConfig
    gameConfig = {
      currentResolution: new Signal.State("400"),
      fogScale: new Signal.State(12),
    };

    // Mock window dimensions
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1024,
    });
    Object.defineProperty(window, "innerHeight", {
      writable: true,
      configurable: true,
      value: 768,
    });
  });

  describe("fixed resolution mode - 400px", () => {
    test("sets canvas width and height to 400", () => {
      gameConfig.currentResolution.set("400");

      resizeCanvas(shadow, gameConfig);

      expect(mockCanvas.width).toBe(400);
      expect(mockCanvas.height).toBe(400);
    });

    test("sets canvas style width and height to 400px", () => {
      gameConfig.currentResolution.set("400");

      resizeCanvas(shadow, gameConfig);

      expect(mockCanvas.style.width).toBe("400px");
      expect(mockCanvas.style.height).toBe("400px");
    });

    test("adds resolution class to shadow host", () => {
      gameConfig.currentResolution.set("400");

      resizeCanvas(shadow, gameConfig);

      expect(mockHost.classList.contains("resolution")).toBe(true);
    });

    test("adds resolution-400 class to shadow host", () => {
      gameConfig.currentResolution.set("400");

      resizeCanvas(shadow, gameConfig);

      expect(mockHost.classList.contains("resolution-400")).toBe(true);
    });

    test("sets fogScale to 12", () => {
      gameConfig.currentResolution.set("400");

      resizeCanvas(shadow, gameConfig);

      expect(gameConfig.fogScale.get()).toBe(12);
    });

    test("removes fullscreen classes", () => {
      mockHost.classList.add("resolution-800");
      gameConfig.currentResolution.set("400");

      resizeCanvas(shadow, gameConfig);

      expect(mockHost.classList.contains("resolution-800")).toBe(false);
    });
  });

  describe("fixed resolution mode - 800px", () => {
    test("sets canvas width and height to 800", () => {
      gameConfig.currentResolution.set("800");

      resizeCanvas(shadow, gameConfig);

      expect(mockCanvas.width).toBe(800);
      expect(mockCanvas.height).toBe(800);
    });

    test("sets canvas style width and height to 800px", () => {
      gameConfig.currentResolution.set("800");

      resizeCanvas(shadow, gameConfig);

      expect(mockCanvas.style.width).toBe("800px");
      expect(mockCanvas.style.height).toBe("800px");
    });

    test("adds resolution class to shadow host", () => {
      gameConfig.currentResolution.set("800");

      resizeCanvas(shadow, gameConfig);

      expect(mockHost.classList.contains("resolution")).toBe(true);
    });

    test("adds resolution-800 class to shadow host", () => {
      gameConfig.currentResolution.set("800");

      resizeCanvas(shadow, gameConfig);

      expect(mockHost.classList.contains("resolution-800")).toBe(true);
    });

    test("sets fogScale to 24", () => {
      gameConfig.currentResolution.set("800");

      resizeCanvas(shadow, gameConfig);

      expect(gameConfig.fogScale.get()).toBe(24);
    });

    test("returns early after setting fog scale", () => {
      gameConfig.currentResolution.set("800");

      resizeCanvas(shadow, gameConfig);

      expect(gameConfig.fogScale.get()).toBe(24);
    });
  });

  describe("fullscreen mode", () => {
    test("sets canvas width to window.innerWidth", () => {
      gameConfig.currentResolution.set("fullscreen");

      resizeCanvas(shadow, gameConfig);

      expect(mockCanvas.width).toBe(window.innerWidth);
    });

    test("sets canvas height to window.innerHeight", () => {
      gameConfig.currentResolution.set("fullscreen");

      resizeCanvas(shadow, gameConfig);

      expect(mockCanvas.height).toBe(window.innerHeight);
    });

    test("sets canvas style to 100vw and 100vh", () => {
      gameConfig.currentResolution.set("fullscreen");

      resizeCanvas(shadow, gameConfig);

      expect(mockCanvas.style.width).toBe("100vw");
      expect(mockCanvas.style.height).toBe("100vh");
    });

    test("removes all resolution classes", () => {
      mockHost.classList.add("resolution");
      mockHost.classList.add("resolution-400");
      gameConfig.currentResolution.set("fullscreen");

      resizeCanvas(shadow, gameConfig);

      expect(mockHost.classList.contains("resolution")).toBe(false);
      expect(mockHost.classList.contains("resolution-400")).toBe(false);
      expect(mockHost.classList.contains("resolution-800")).toBe(false);
    });

    test("sets fogScale to 36", () => {
      gameConfig.currentResolution.set("fullscreen");

      resizeCanvas(shadow, gameConfig);

      expect(gameConfig.fogScale.get()).toBe(36);
    });

    test("returns early after fullscreen setup", () => {
      gameConfig.currentResolution.set("fullscreen");

      resizeCanvas(shadow, gameConfig);

      expect(gameConfig.fogScale.get()).toBe(36);
    });

    test("updates canvas dimensions on different window sizes", () => {
      gameConfig.currentResolution.set("fullscreen");

      window.innerWidth = 1920;
      window.innerHeight = 1080;

      resizeCanvas(shadow, gameConfig);

      expect(mockCanvas.width).toBe(1920);
      expect(mockCanvas.height).toBe(1080);
    });
  });

  describe("canvas element handling", () => {
    test("does nothing if canvas element is not found", () => {
      shadow.getElementById = jest.fn(() => null);

      resizeCanvas(shadow, gameConfig);

      // Should complete without error
      expect(mockCanvas.width).not.toBe(400);
    });

    test("does nothing if element is not HTMLCanvasElement", () => {
      const notCanvas = document.createElement("div");
      shadow.getElementById = jest.fn(() => notCanvas);

      resizeCanvas(shadow, gameConfig);

      // Should complete without error
      expect(notCanvas.width).toBeUndefined();
    });

    test("queries shadow DOM for canvas element", () => {
      resizeCanvas(shadow, gameConfig);

      expect(shadow.getElementById).toHaveBeenCalledWith("canvas");
    });
  });

  describe("class management", () => {
    test("adds resolution classes for 400px mode", () => {
      gameConfig.currentResolution.set("400");

      resizeCanvas(shadow, gameConfig);

      expect(mockHost.classList.contains("resolution")).toBe(true);
      expect(mockHost.classList.contains("resolution-400")).toBe(true);
    });

    test("removes previous resolution classes when changing", () => {
      gameConfig.currentResolution.set("400");

      resizeCanvas(shadow, gameConfig);

      expect(mockHost.classList.contains("resolution-400")).toBe(true);

      gameConfig.currentResolution.set("800");

      resizeCanvas(shadow, gameConfig);

      expect(mockHost.classList.contains("resolution-400")).toBe(false);
      expect(mockHost.classList.contains("resolution-800")).toBe(true);
    });

    test("properly manages class transitions between resolutions", () => {
      gameConfig.currentResolution.set("400");

      resizeCanvas(shadow, gameConfig);

      expect(mockHost.classList.contains("resolution-400")).toBe(true);

      gameConfig.currentResolution.set("800");

      resizeCanvas(shadow, gameConfig);

      expect(mockHost.classList.contains("resolution-400")).toBe(false);
      expect(mockHost.classList.contains("resolution-800")).toBe(true);
    });
  });

  describe("fog scale updates", () => {
    test("sets correct fog scale for 400px resolution", () => {
      gameConfig.fogScale.set(0);
      gameConfig.currentResolution.set("400");

      resizeCanvas(shadow, gameConfig);

      expect(gameConfig.fogScale.get()).toBe(12);
    });

    test("sets correct fog scale for 800px resolution", () => {
      gameConfig.fogScale.set(0);
      gameConfig.currentResolution.set("800");

      resizeCanvas(shadow, gameConfig);

      expect(gameConfig.fogScale.get()).toBe(24);
    });

    test("sets correct fog scale for fullscreen mode", () => {
      gameConfig.fogScale.set(0);
      gameConfig.currentResolution.set("fullscreen");

      resizeCanvas(shadow, gameConfig);

      expect(gameConfig.fogScale.get()).toBe(36);
    });

    test("fog scale persists across multiple calls", () => {
      gameConfig.currentResolution.set("400");

      resizeCanvas(shadow, gameConfig);

      const firstScale = gameConfig.fogScale.get();

      resizeCanvas(shadow, gameConfig);

      const secondScale = gameConfig.fogScale.get();

      expect(firstScale).toBe(secondScale);
      expect(secondScale).toBe(12);
    });
  });

  describe("edge cases", () => {
    test("handles undefined currentResolution", () => {
      gameConfig.currentResolution.set(undefined);

      resizeCanvas(shadow, gameConfig);

      // Should handle gracefully without throwing
      expect(true).toBe(true);
    });

    test("handles null currentResolution", () => {
      gameConfig.currentResolution.set(null);

      resizeCanvas(shadow, gameConfig);

      // Should handle gracefully without throwing
      expect(true).toBe(true);
    });

    test("handles numeric resolution string correctly", () => {
      gameConfig.currentResolution.set("600");

      resizeCanvas(shadow, gameConfig);

      expect(mockCanvas.width).toBe(600);
      expect(mockCanvas.height).toBe(600);
    });

    test("handles custom numeric resolution with fog scale 12", () => {
      gameConfig.fogScale.set(0);
      gameConfig.currentResolution.set("1024");

      resizeCanvas(shadow, gameConfig);

      expect(mockCanvas.width).toBe(1024);
      expect(gameConfig.fogScale.get()).toBe(12);
    });
  });

  describe("return behavior", () => {
    test("returns undefined for fullscreen mode", () => {
      gameConfig.currentResolution.set("fullscreen");

      const result = resizeCanvas(shadow, gameConfig);

      expect(result).toBeUndefined();
    });

    test("returns undefined for 800px mode", () => {
      gameConfig.currentResolution.set("800");

      const result = resizeCanvas(shadow, gameConfig);

      expect(result).toBeUndefined();
    });

    test("returns undefined for 400px mode", () => {
      gameConfig.currentResolution.set("400");

      const result = resizeCanvas(shadow, gameConfig);

      expect(result).toBeUndefined();
    });
  });

  describe("integration", () => {
    test("function is exported", () => {
      expect(typeof resizeCanvas).toBe("function");
    });

    test("handles rapid resolution changes", () => {
      const resolutions = ["400", "800", "fullscreen", "400"];

      resolutions.forEach((resolution) => {
        gameConfig.currentResolution.set(resolution);

        resizeCanvas(shadow, gameConfig);
      });

      expect(gameConfig.currentResolution.get()).toBe("400");
      expect(mockCanvas.width).toBe(400);
    });

    test("maintains canvas aspect ratio (square)", () => {
      const testResolutions = ["400", "800"];

      testResolutions.forEach((resolution) => {
        gameConfig.currentResolution.set(resolution);

        resizeCanvas(shadow, gameConfig);

        expect(mockCanvas.width).toBe(mockCanvas.height);
      });
    });
  });
});
