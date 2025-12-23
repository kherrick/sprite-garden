/**
 * @jest-environment jsdom
 */
import { jest } from "@jest/globals";
import { Signal } from "signal-polyfill";

jest.unstable_mockModule("../update/ui/biome.mjs", () => ({
  updateBiomeUI: jest.fn(),
}));

jest.unstable_mockModule("../update/crops.mjs", () => ({
  updateCrops: jest.fn(),
}));

jest.unstable_mockModule("../update/ui/depth.mjs", () => ({
  updateDepthUI: jest.fn(),
}));

jest.unstable_mockModule("../update/player.mjs", () => ({
  updatePlayer: jest.fn(),
}));

jest.unstable_mockModule("../water/updateWaterPhysics.mjs", () => ({
  updateWaterPhysics: jest.fn(),
}));

jest.unstable_mockModule("./render.mjs", () => ({
  render: jest.fn(),
}));

jest.unstable_mockModule("localforage", () => ({
  default: {
    getItem: jest.fn().mockResolvedValue(1),
  },
}));

// Mocked modules
const { updatePlayer } = await import("../update/player.mjs");
const { render } = await import("./render.mjs");

// Import gameLoop after all mocks set up
const { gameLoop } = await import("./gameLoop.mjs");

describe("gameLoop function", () => {
  let biomeEl;
  let camera;
  let canvas;
  let depthEl;
  let exploredMap;
  let fogMode;
  let fogScale;
  let gameTime;
  let growthTimers;
  let isFogScaled;
  let plantStructures;
  let player;
  let shadowRoot;
  let shouldReset;
  let viewMode;
  let waterPhysicsQueue;
  let world;
  let worldSeed;

  const config = {
    biomes: [],
    friction: 0.8,
    gravity: 0.5,
    maxFallSpeed: 10,
    surfaceLevel: 32,
    tileColorMap: { air: "#fff", dirt: "#8b4513" },
    tileNameByIdMap: { 0: "air", 1: "dirt" },
    tiles: { AIR: { id: 0 }, DIRT: { id: 1 } },
    tileSize: 16,
    waterPhysicsConfig: {},
    worldHeight: 100,
    worldWidth: 100,
  };

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup canvas
    canvas = document.createElement("canvas");
    canvas.width = 320;
    canvas.height = 240;

    // Setup shadow DOM
    const div = document.createElement("div");
    shadowRoot = div.attachShadow({ mode: "open" });

    // Setup UI elements
    biomeEl = document.createElement("div");
    depthEl = document.createElement("div");

    // Setup signals
    player = new Signal.State({
      x: 50,
      y: 50,
      width: 8,
      height: 8,
      velocityX: 0,
      velocityY: 0,
    });

    camera = new Signal.State({ x: 0, y: 0 });
    world = new Signal.State({
      getTile: jest.fn(() => config.tiles.AIR),
    });

    exploredMap = new Signal.State({
      updateFromPlayer: jest.fn(),
      render: jest.fn(),
    });

    gameTime = new Signal.State(0);
    growthTimers = new Signal.State({});
    plantStructures = new Signal.State({});
    shouldReset = new Signal.State(false);
    viewMode = new Signal.State("normal");
    waterPhysicsQueue = new Signal.State([]);
    fogMode = new Signal.State("none");
    isFogScaled = new Signal.State(false);
    fogScale = new Signal.State(1);
    worldSeed = new Signal.State(12345);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("exits immediately if shouldReset is true", async () => {
    shouldReset.set(true);

    await gameLoop(
      canvas,
      globalThis,
      shadowRoot,
      biomeEl,
      depthEl,
      config.tileNameByIdMap,
      config.tileColorMap,
      config.biomes,
      fogMode,
      fogScale,
      config.friction,
      config.gravity,
      isFogScaled,
      config.maxFallSpeed,
      config.surfaceLevel,
      config.tileSize,
      config.tiles,
      config.waterPhysicsConfig,
      config.worldHeight,
      config.worldWidth,
      worldSeed,
      camera,
      exploredMap,
      gameTime,
      growthTimers,
      plantStructures,
      player,
      shouldReset,
      viewMode,
      waterPhysicsQueue,
      world,
    );

    expect(shouldReset.get()).toBe(false);
    expect(updatePlayer).not.toHaveBeenCalled();
  });

  test("calls requestAnimationFrame to schedule next frame", async () => {
    const rafSpy = jest.spyOn(globalThis, "requestAnimationFrame");
    rafSpy.mockImplementation(() => {
      shouldReset.set(true);

      return 0;
    });

    await gameLoop(
      canvas,
      globalThis,
      shadowRoot,
      biomeEl,
      depthEl,
      config.tileNameByIdMap,
      config.tileColorMap,
      config.biomes,
      fogMode,
      fogScale,
      config.friction,
      config.gravity,
      isFogScaled,
      config.maxFallSpeed,
      config.surfaceLevel,
      config.tileSize,
      config.tiles,
      config.waterPhysicsConfig,
      config.worldHeight,
      config.worldWidth,
      worldSeed,
      camera,
      exploredMap,
      gameTime,
      growthTimers,
      plantStructures,
      player,
      shouldReset,
      viewMode,
      waterPhysicsQueue,
      world,
    );

    expect(rafSpy).toHaveBeenCalled();

    rafSpy.mockRestore();
  });

  test("calls render function each frame", async () => {
    jest.spyOn(globalThis, "requestAnimationFrame").mockImplementation(() => {
      shouldReset.set(true);

      return 0;
    });

    await gameLoop(
      canvas,
      globalThis,
      shadowRoot,
      biomeEl,
      depthEl,
      config.tileNameByIdMap,
      config.tileColorMap,
      config.biomes,
      fogMode,
      fogScale,
      config.friction,
      config.gravity,
      isFogScaled,
      config.maxFallSpeed,
      config.surfaceLevel,
      config.tileSize,
      config.tiles,
      config.waterPhysicsConfig,
      config.worldHeight,
      config.worldWidth,
      worldSeed,
      camera,
      exploredMap,
      gameTime,
      growthTimers,
      plantStructures,
      player,
      shouldReset,
      viewMode,
      waterPhysicsQueue,
      world,
    );

    expect(render).toHaveBeenCalled();
  });

  test("passes camera state to render", async () => {
    const testCamera = { x: 100, y: 200 };
    camera.set(testCamera);

    jest.spyOn(globalThis, "requestAnimationFrame").mockImplementation(() => {
      shouldReset.set(true);

      return 0;
    });

    await gameLoop(
      canvas,
      globalThis,
      shadowRoot,
      biomeEl,
      depthEl,
      config.tileNameByIdMap,
      config.tileColorMap,
      config.biomes,
      fogMode,
      fogScale,
      config.friction,
      config.gravity,
      isFogScaled,
      config.maxFallSpeed,
      config.surfaceLevel,
      config.tileSize,
      config.tiles,
      config.waterPhysicsConfig,
      config.worldHeight,
      config.worldWidth,
      worldSeed,
      camera,
      exploredMap,
      gameTime,
      growthTimers,
      plantStructures,
      player,
      shouldReset,
      viewMode,
      waterPhysicsQueue,
      world,
    );

    expect(render).toHaveBeenCalledWith(
      canvas,
      player,
      camera,
      config.tiles,
      config.tileSize,
      viewMode,
      world,
      config.worldHeight,
      config.worldWidth,
      fogMode,
      isFogScaled,
      fogScale,
      exploredMap,
      expect.any(Object), // previousState
      expect.any(Number), // interpolation
      config.tileColorMap,
      config.tileNameByIdMap,
    );
  });

  test("passes world state to render", async () => {
    jest.spyOn(globalThis, "requestAnimationFrame").mockImplementation(() => {
      shouldReset.set(true);

      return 0;
    });

    await gameLoop(
      canvas,
      globalThis,
      shadowRoot,
      biomeEl,
      depthEl,
      config.tileNameByIdMap,
      config.tileColorMap,
      config.biomes,
      fogMode,
      fogScale,
      config.friction,
      config.gravity,
      isFogScaled,
      config.maxFallSpeed,
      config.surfaceLevel,
      config.tileSize,
      config.tiles,
      config.waterPhysicsConfig,
      config.worldHeight,
      config.worldWidth,
      worldSeed,
      camera,
      exploredMap,
      gameTime,
      growthTimers,
      plantStructures,
      player,
      shouldReset,
      viewMode,
      waterPhysicsQueue,
      world,
    );

    expect(render).toHaveBeenCalledWith(
      canvas,
      player,
      camera,
      config.tiles,
      config.tileSize,
      viewMode,
      world,
      config.worldHeight,
      config.worldWidth,
      fogMode,
      isFogScaled,
      fogScale,
      exploredMap,
      expect.any(Object), // previousState
      expect.any(Number), // interpolation
      config.tileColorMap,
      config.tileNameByIdMap,
    );
  });

  test("passes interpolation factor to render", async () => {
    jest.spyOn(globalThis, "requestAnimationFrame").mockImplementation(() => {
      shouldReset.set(true);

      return 0;
    });

    await gameLoop(
      canvas,
      globalThis,
      shadowRoot,
      biomeEl,
      depthEl,
      config.tileNameByIdMap,
      config.tileColorMap,
      config.biomes,
      fogMode,
      fogScale,
      config.friction,
      config.gravity,
      isFogScaled,
      config.maxFallSpeed,
      config.surfaceLevel,
      config.tileSize,
      config.tiles,
      config.waterPhysicsConfig,
      config.worldHeight,
      config.worldWidth,
      worldSeed,
      camera,
      exploredMap,
      gameTime,
      growthTimers,
      plantStructures,
      player,
      shouldReset,
      viewMode,
      waterPhysicsQueue,
      world,
    );

    expect(render).toHaveBeenCalled();
    const renderCall = render.mock.calls[0];
    const interpolationFactor = renderCall[14]; // 15th argument is interpolation

    expect(typeof interpolationFactor).toBe("number");
    expect(interpolationFactor).toBeGreaterThanOrEqual(0);
    expect(interpolationFactor).toBeLessThanOrEqual(1);
  });
});
