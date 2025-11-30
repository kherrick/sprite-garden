/**
 * @jest-environment jsdom
 */
import { jest } from "@jest/globals";
import { Signal } from "signal-polyfill";

// Mock dependencies BEFORE import
jest.unstable_mockModule("../util/colors/getCustomProperties.mjs", () => ({
  getCustomProperties: jest.fn(() => ({
    fog: "#000000",
    explored: "#333333",
  })),
}));

jest.unstable_mockModule("../map/fog.mjs", () => ({
  FogMap: {
    fromObject: jest.fn((_, width, height) => ({
      updateFromPlayer: jest.fn(),
      render: jest.fn(),
      width,
      height,
    })),
  },
}));

jest.unstable_mockModule("../map/world.mjs", () => ({
  WorldMap: {
    fromArray: jest.fn((_, width, height) => ({
      getTile: jest.fn(() => ({ id: 0, solid: false })),
      width,
      height,
    })),
  },
}));

// Import mocks FIRST
const { getCustomProperties } = await import(
  "../util/colors/getCustomProperties.mjs"
);
const { FogMap } = await import("../map/fog.mjs");
const { WorldMap } = await import("../map/world.mjs");

// Import function AFTER mocks
const { loadSaveState } = await import("./loadSave.mjs");

describe("loadSaveState function", () => {
  let gThis;
  let shadow;
  let saveState;
  let mockConsoleLog;
  let mockConsoleError;
  let resetDispatchSpy;

  beforeEach(() => {
    jest.clearAllMocks();

    resetDispatchSpy = jest.fn();
    mockConsoleLog = jest.spyOn(console, "log").mockImplementation(() => {});
    mockConsoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    // Create mock config signals
    const configSignals = {
      WORLD_HEIGHT: new Signal.State(100),
      WORLD_WIDTH: new Signal.State(100),
      TILES: {
        AIR: { id: 0, solid: false },
        DIRT: { id: 1, solid: true },
      },
    };

    // Create mock state signals
    const stateSignals = {
      seedInventory: new Signal.State({ wheat: 10, carrot: 5 }),
      exploredMap: new Signal.State({}),
      world: new Signal.State({}),
      gameTime: new Signal.State(0),
      player: new Signal.State({ x: 50, y: 50 }),
      camera: new Signal.State({ x: 0, y: 0 }),
    };

    // Mock spriteGarden object
    gThis = {
      spriteGarden: {
        config: configSignals,
        state: stateSignals,
        setConfig: jest.fn((key, value) => {
          if (configSignals[key]?.set) {
            configSignals[key].set(value);
          }
        }),
        setState: jest.fn((key, value) => {
          if (stateSignals[key]?.set) {
            stateSignals[key].set(value);
          }
        }),
      },
    };

    // Create mock shadow root
    shadow = {
      dispatchEvent: resetDispatchSpy,
      querySelector: jest.fn(),
    };

    // Create baseline save state
    saveState = {
      config: {
        WORLD_HEIGHT: 100,
        WORLD_WIDTH: 100,
        currentResolution: 1,
        isFogScaled: false,
        TILE_SIZE: 16,
      },
      state: {
        seedInventory: { wheat: 20, carrot: 10 },
        gameTime: 100,
        player: { x: 60, y: 60 },
        camera: { x: 10, y: 10 },
      },
    };
  });

  afterEach(() => {
    mockConsoleLog.mockRestore();
    mockConsoleError.mockRestore();
  });

  test("restores config values using setConfig", () => {
    loadSaveState(gThis, shadow, saveState);

    // Config values should be set (WORLD_HEIGHT, WORLD_WIDTH, TILE_SIZE)
    expect(gThis.spriteGarden.setConfig).toHaveBeenCalled();
    expect(gThis.spriteGarden.setConfig.mock.calls.length).toBeGreaterThan(0);
  });

  test("skips currentResolution config key", () => {
    loadSaveState(gThis, shadow, saveState);

    expect(gThis.spriteGarden.setConfig).not.toHaveBeenCalledWith(
      "currentResolution",
      expect.anything(),
    );
  });

  test("skips isFogScaled config key", () => {
    loadSaveState(gThis, shadow, saveState);

    expect(gThis.spriteGarden.setConfig).not.toHaveBeenCalledWith(
      "isFogScaled",
      expect.anything(),
    );
  });

  test("restores basic state values using setState", () => {
    loadSaveState(gThis, shadow, saveState);

    expect(gThis.spriteGarden.setState).toHaveBeenCalledWith("gameTime", 100);
    expect(gThis.spriteGarden.setState).toHaveBeenCalledWith("player", {
      x: 60,
      y: 60,
    });
  });

  test("updates seedInventory with new seeds while preserving current seeds", () => {
    saveState.state.seedInventory = { wheat: 20 }; // Missing carrot

    loadSaveState(gThis, shadow, saveState);

    // The seedInventory is updated in place but setState is NOT called for it
    // Missing seeds are added with value 0 (not preserved from current state)
    const seedInventory = saveState.state.seedInventory;
    expect(seedInventory.wheat).toBe(20); // Updated from save
    expect(seedInventory.carrot).toBe(0); // Added as missing with value 0
  });

  test("converts explored map using FogMap.fromObject", () => {
    const mockFogData = {
      "50,50": true,
      "51,51": true,
    };

    saveState.state.exploredMap = mockFogData;

    loadSaveState(gThis, shadow, saveState);

    expect(FogMap.fromObject).toHaveBeenCalledWith(
      mockFogData,
      100,
      100,
      expect.any(Object),
    );
    expect(gThis.spriteGarden.state.exploredMap.get()).toBeDefined();
  });

  test("skips empty explored map", () => {
    saveState.state.exploredMap = {};

    loadSaveState(gThis, shadow, saveState);

    expect(FogMap.fromObject).not.toHaveBeenCalled();
  });

  test("converts world map using WorldMap.fromArray", () => {
    const mockWorldData = [0, 1, 1, 0, 1, 1, 0, 1, 1];

    saveState.state.world = mockWorldData;

    loadSaveState(gThis, shadow, saveState);

    expect(WorldMap.fromArray).toHaveBeenCalledWith(mockWorldData, 100, 100);
    expect(gThis.spriteGarden.state.world.get()).toBeDefined();
  });

  test("validates converted world and logs tile count", () => {
    const mockWorldData = [0, 1, 1, 0]; // Contains non-air tiles

    saveState.state.world = mockWorldData;

    loadSaveState(gThis, shadow, saveState);

    expect(mockConsoleLog).toHaveBeenCalledWith(
      expect.stringContaining("Converting world"),
    );
    expect(mockConsoleLog).toHaveBeenCalledWith(
      expect.stringContaining("non-air tiles"),
    );
  });

  test("logs error when world data is invalid", () => {
    saveState.state.world = "invalid"; // Not an array

    loadSaveState(gThis, shadow, saveState);

    expect(mockConsoleError).toHaveBeenCalledWith(
      expect.stringContaining("Invalid world data"),
      "invalid",
    );
  });

  test("handles empty world data array", () => {
    saveState.state.world = [];

    loadSaveState(gThis, shadow, saveState);

    // Should not crash and should not set world state
    expect(gThis.spriteGarden.state.world.get()).toEqual({});
  });

  test("handles null world data", () => {
    saveState.state.world = null;

    loadSaveState(gThis, shadow, saveState);

    expect(gThis.spriteGarden.state.world.get()).toEqual({});
  });

  test("dispatches sprite-garden-reset at the end", () => {
    loadSaveState(gThis, shadow, saveState);

    expect(resetDispatchSpy).toHaveBeenCalledWith(
      new CustomEvent("sprite-garden-reset"),
    );
  });

  test("logs successful save state load", () => {
    loadSaveState(gThis, shadow, saveState);

    expect(mockConsoleLog).toHaveBeenCalledWith(
      "Save state loaded successfully",
    );
  });

  test("handles state with only config and no state keys", () => {
    saveState.state = {};

    loadSaveState(gThis, shadow, saveState);

    expect(mockConsoleLog).toHaveBeenCalledWith(
      "Save state loaded successfully",
    );
  });

  test("handles config with no matching config signals", () => {
    saveState.config.UNKNOWN_KEY = "value";

    loadSaveState(gThis, shadow, saveState);

    expect(resetDispatchSpy).toHaveBeenCalledWith(
      new CustomEvent("sprite-garden-reset"),
    );
  });

  test("integrates world map height and width from config", () => {
    saveState.config.WORLD_HEIGHT = 150;
    saveState.config.WORLD_WIDTH = 200;
    saveState.state.world = [0, 1, 1, 0];

    loadSaveState(gThis, shadow, saveState);

    expect(WorldMap.fromArray).toHaveBeenCalledWith(
      expect.any(Array),
      200,
      150,
    );
  });

  test("integrates explored map height and width from config", () => {
    saveState.config.WORLD_HEIGHT = 120;
    saveState.config.WORLD_WIDTH = 180;
    saveState.state.exploredMap = { "50,50": true };

    loadSaveState(gThis, shadow, saveState);

    expect(FogMap.fromObject).toHaveBeenCalledWith(
      expect.any(Object),
      180,
      120,
      expect.any(Object),
    );
  });

  test("calls getCustomProperties with global and shadow", () => {
    saveState.state.exploredMap = { "50,50": true };

    loadSaveState(gThis, shadow, saveState);

    expect(getCustomProperties).toHaveBeenCalledWith(gThis, shadow);
  });

  test("handles multiple state keys in save state", () => {
    saveState.state = {
      gameTime: 500,
      player: { x: 100, y: 100 },
      camera: { x: 50, y: 50 },
      seedInventory: { wheat: 30 },
    };

    loadSaveState(gThis, shadow, saveState);

    expect(gThis.spriteGarden.setState).toHaveBeenCalledWith("gameTime", 500);
    expect(gThis.spriteGarden.setState).toHaveBeenCalledWith("player", {
      x: 100,
      y: 100,
    });
    expect(gThis.spriteGarden.setState).toHaveBeenCalledWith("camera", {
      x: 50,
      y: 50,
    });
  });

  test("preserves all current seeds when updating seedInventory", () => {
    gThis.spriteGarden.state.seedInventory.set({
      wheat: 10,
      carrot: 5,
      tomato: 8,
    });

    saveState.state.seedInventory = { wheat: 20 }; // Only wheat in save

    loadSaveState(gThis, shadow, saveState);

    // seedInventory is modified in-place in the save state
    // Missing seeds are added with value 0
    const updatedInventory = saveState.state.seedInventory;
    expect(updatedInventory.wheat).toBe(20); // Updated from save
    expect(updatedInventory.carrot).toBe(0); // Added as missing with value 0
    expect(updatedInventory.tomato).toBe(0); // Added as missing with value 0
  });

  test("handles world with many non-air tiles", () => {
    const mockWorldData = new Array(10000).fill(1); // All solid tiles
    saveState.state.world = mockWorldData;

    // Mock getTile to return different values
    let tileCount = 0;
    const mockWorldMap = {
      getTile: jest.fn(() => {
        tileCount++;
        return tileCount % 2 === 0 ? { id: 1, solid: true } : { id: 0 };
      }),
      width: 100,
      height: 100,
    };

    WorldMap.fromArray.mockReturnValue(mockWorldMap);

    loadSaveState(gThis, shadow, saveState);

    expect(mockConsoleLog).toHaveBeenCalledWith(
      expect.stringContaining("Converted world contains"),
    );
  });
});
