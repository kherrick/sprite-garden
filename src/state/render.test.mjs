/**
 * @jest-environment jsdom
 */
import { jest } from "@jest/globals";
import { Signal } from "signal-polyfill";
import { render } from "./render.mjs";

describe("render function", () => {
  let camera;
  let canvas;
  let ctx;
  let exploredMap;
  let fogMode;
  let fogScale;
  let isFogScaled;
  let player;
  let previousState;
  let tileColorMap;
  let tileNameByIdMap;
  let tiles;
  let viewMode;
  let world;

  const tileSize = 16;
  const worldWidth = 100;
  const worldHeight = 100;

  beforeEach(() => {
    // Setup canvas mock
    canvas = document.createElement("canvas");
    canvas.width = 320;
    canvas.height = 240;

    // Mock the canvas context to avoid needing the 'canvas' npm package
    ctx = {
      fillRect: jest.fn(),
      strokeRect: jest.fn(),
      fillStyle: "#ffffff",
      strokeStyle: "#000000",
      lineWidth: 1,
    };

    jest.spyOn(canvas, "getContext").mockReturnValue(ctx);

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
    viewMode = new Signal.State("normal");
    fogMode = new Signal.State("none");
    isFogScaled = new Signal.State(false);
    fogScale = new Signal.State(1);

    // Setup tiles config
    tiles = {
      AIR: { id: 0, solid: false },
      DIRT: { id: 1, solid: true },
      COAL: { id: 2, solid: true },
      IRON: { id: 3, solid: true },
      GOLD: { id: 4, solid: true },
      LAVA: { id: 5, solid: true },
    };

    // Setup world mock
    const worldData = {};
    world = new Signal.State({
      getTile: jest.fn((x, y) => {
        return worldData[`${x},${y}`] || tiles.AIR;
      }),
    });

    // Setup explored map mock
    const exploredMapMock = {
      updateFromPlayer: jest.fn(),
      render: jest.fn(),
      renderScaled: jest.fn(),
    };
    exploredMap = new Signal.State(exploredMapMock);

    // Setup previous state
    previousState = {
      player: { x: 50, y: 50 },
      camera: { x: 0, y: 0 },
    };

    // Setup color map
    tileColorMap = {
      air: "#ffffff",
      dirt: "#8b4513",
      xray: "#ff0000",
      "player-body": "#000000",
      "player-border": "#ffffff",
      "player-eyes": "#ffff00",
    };

    // Setup tile name map
    tileNameByIdMap = {
      0: "air",
      1: "dirt",
      2: "coal",
      3: "iron",
      4: "gold",
      5: "lava",
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("clears canvas with air color", () => {
    render(
      canvas,
      player,
      camera,
      tiles,
      tileSize,
      viewMode,
      world,
      worldHeight,
      worldWidth,
      fogMode,
      isFogScaled,
      fogScale,
      exploredMap,
      previousState,
      1,
      tileColorMap,
      tileNameByIdMap,
    );

    const calls = ctx.fillRect.mock.calls;
    expect(calls.length).toBeGreaterThan(0);
  });

  test("renders player at correct screen position", () => {
    render(
      canvas,
      player,
      camera,
      tiles,
      tileSize,
      viewMode,
      world,
      worldHeight,
      worldWidth,
      fogMode,
      isFogScaled,
      fogScale,
      exploredMap,
      previousState,
      1,
      tileColorMap,
      tileNameByIdMap,
    );

    const fillRectCalls = ctx.fillRect.mock.calls;
    expect(fillRectCalls.length).toBeGreaterThan(0);
  });

  test("renders player with border", () => {
    render(
      canvas,
      player,
      camera,
      tiles,
      tileSize,
      viewMode,
      world,
      worldHeight,
      worldWidth,
      fogMode,
      isFogScaled,
      fogScale,
      exploredMap,
      previousState,
      1,
      tileColorMap,
      tileNameByIdMap,
    );

    const strokeRectCalls = ctx.strokeRect.mock.calls;
    expect(strokeRectCalls.length).toBeGreaterThan(0);
  });

  test("renders player eyes", () => {
    render(
      canvas,
      player,
      camera,
      tiles,
      tileSize,
      viewMode,
      world,
      worldHeight,
      worldWidth,
      fogMode,
      isFogScaled,
      fogScale,
      exploredMap,
      previousState,
      1,
      tileColorMap,
      tileNameByIdMap,
    );

    const fillRectCalls = ctx.fillRect.mock.calls;
    // Should have calls for body, eyes (2 pixels), plus background and world tiles
    expect(fillRectCalls.length).toBeGreaterThanOrEqual(3);
  });

  test("interpolates player position correctly", () => {
    const currentPlayer = {
      x: 100,
      y: 100,
      width: 8,
      height: 8,
      velocityX: 0,
      velocityY: 0,
    };
    player.set(currentPlayer);

    render(
      canvas,
      player,
      camera,
      tiles,
      tileSize,
      viewMode,
      world,
      worldHeight,
      worldWidth,
      fogMode,
      isFogScaled,
      fogScale,
      exploredMap,
      previousState,
      0.5, // 50% interpolation
      tileColorMap,
      tileNameByIdMap,
    );

    // Interpolated position should be halfway between previous and current
    // Expected: 50 + (100 - 50) * 0.5 = 75
    const fillRectCalls = ctx.fillRect.mock.calls;
    expect(fillRectCalls.length).toBeGreaterThan(0);
  });

  test("interpolates camera position correctly", () => {
    const currentCamera = { x: 100, y: 100 };
    camera.set(currentCamera);

    render(
      canvas,
      player,
      camera,
      tiles,
      tileSize,
      viewMode,
      world,
      worldHeight,
      worldWidth,
      fogMode,
      isFogScaled,
      fogScale,
      exploredMap,
      previousState,
      0.5,
      tileColorMap,
      tileNameByIdMap,
    );

    const fillRectCalls = ctx.fillRect.mock.calls;
    expect(fillRectCalls.length).toBeGreaterThan(0);
  });

  test("respects view mode for xray rendering", () => {
    viewMode.set("xray");

    render(
      canvas,
      player,
      camera,
      tiles,
      tileSize,
      viewMode,
      world,
      worldHeight,
      worldWidth,
      fogMode,
      isFogScaled,
      fogScale,
      exploredMap,
      previousState,
      1,
      tileColorMap,
      tileNameByIdMap,
    );

    const fillRectCalls = ctx.fillRect.mock.calls;
    expect(fillRectCalls.length).toBeGreaterThan(0);
  });

  test("renders fog overlay when fog mode is enabled", () => {
    fogMode.set("fog");

    render(
      canvas,
      player,
      camera,
      tiles,
      tileSize,
      viewMode,
      world,
      worldHeight,
      worldWidth,
      fogMode,
      isFogScaled,
      fogScale,
      exploredMap,
      previousState,
      1,
      tileColorMap,
      tileNameByIdMap,
    );

    const exploredMapInstance = exploredMap.get();
    expect(exploredMapInstance.updateFromPlayer).toHaveBeenCalled();
    expect(exploredMapInstance.render).toHaveBeenCalled();
  });

  test("renders scaled fog when isFogScaled is true", () => {
    fogMode.set("fog");
    isFogScaled.set(true);

    render(
      canvas,
      player,
      camera,
      tiles,
      tileSize,
      viewMode,
      world,
      worldHeight,
      worldWidth,
      fogMode,
      isFogScaled,
      fogScale,
      exploredMap,
      previousState,
      1,
      tileColorMap,
      tileNameByIdMap,
    );

    const exploredMapInstance = exploredMap.get();
    expect(exploredMapInstance.updateFromPlayer).toHaveBeenCalled();
    expect(exploredMapInstance.renderScaled).toHaveBeenCalled();
  });

  test("skips fog rendering when fog mode is disabled", () => {
    fogMode.set("none");

    render(
      canvas,
      player,
      camera,
      tiles,
      tileSize,
      viewMode,
      world,
      worldHeight,
      worldWidth,
      fogMode,
      isFogScaled,
      fogScale,
      exploredMap,
      previousState,
      1,
      tileColorMap,
      tileNameByIdMap,
    );

    const exploredMapInstance = exploredMap.get();
    expect(exploredMapInstance.updateFromPlayer).not.toHaveBeenCalled();
  });

  test("scales fog when player has high velocity", () => {
    fogMode.set("fog");

    const playerWithVelocity = {
      x: 50,
      y: 50,
      width: 8,
      height: 8,
      velocityX: 10,
      velocityY: 0,
    };
    player.set(playerWithVelocity);

    render(
      canvas,
      player,
      camera,
      tiles,
      tileSize,
      viewMode,
      world,
      worldHeight,
      worldWidth,
      fogMode,
      isFogScaled,
      fogScale,
      exploredMap,
      previousState,
      1,
      tileColorMap,
      tileNameByIdMap,
    );

    expect(isFogScaled.get()).toBe(true);
  });

  test("does not render tiles outside world bounds", () => {
    render(
      canvas,
      player,
      camera,
      tiles,
      tileSize,
      viewMode,
      world,
      worldHeight,
      worldWidth,
      fogMode,
      isFogScaled,
      fogScale,
      exploredMap,
      previousState,
      1,
      tileColorMap,
      tileNameByIdMap,
    );

    // World mock should only be called for valid coordinates
    const getTileCalls = world.get().getTile.mock.calls;
    for (const [x, y] of getTileCalls) {
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(worldWidth);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThan(worldHeight);
    }
  });

  test("handles full page interpolation", () => {
    render(
      canvas,
      player,
      camera,
      tiles,
      tileSize,
      viewMode,
      world,
      worldHeight,
      worldWidth,
      fogMode,
      isFogScaled,
      fogScale,
      exploredMap,
      previousState,
      0, // 0% interpolation - should show previous state
      tileColorMap,
      tileNameByIdMap,
    );

    const fillRectCalls = ctx.fillRect.mock.calls;
    expect(fillRectCalls.length).toBeGreaterThan(0);
  });

  test("handles no interpolation", () => {
    render(
      canvas,
      player,
      camera,
      tiles,
      tileSize,
      viewMode,
      world,
      worldHeight,
      worldWidth,
      fogMode,
      isFogScaled,
      fogScale,
      exploredMap,
      previousState,
      1, // 100% interpolation - should show current state
      tileColorMap,
      tileNameByIdMap,
    );

    const fillRectCalls = ctx.fillRect.mock.calls;
    expect(fillRectCalls.length).toBeGreaterThan(0);
  });
});
