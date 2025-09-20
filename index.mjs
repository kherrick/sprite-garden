import {
  effect,
  generateHeightMap,
  getBiome,
  handleBreakBlock,
  handleFarmAction,
  noise,
  resizeCanvas,
  selectSeed,
  Signal,
  updateCrops,
  updateInventoryDisplay,
  updateUI,
} from "./utils/utils.mjs";

// Create reactive signals for all configuration and state
const configSignals = {
  currentResolution: new Signal.State("400"),
  canvasScale: new Signal.State(1),
  TILE_SIZE: new Signal.State(8),
  WORLD_WIDTH: new Signal.State(400),
  WORLD_HEIGHT: new Signal.State(200),
  SURFACE_LEVEL: new Signal.State(60),
  // Physics constants
  GRAVITY: new Signal.State(0.7),
  FRICTION: new Signal.State(0.8),
  MAX_FALL_SPEED: new Signal.State(15),
  // Tile types - keeping as static object since they don't change
  TILES: {
    AIR: { id: 0, color: "#87CEEB", solid: false, farmable: false },
    GRASS: { id: 1, color: "#90EE90", solid: true, farmable: true },
    DIRT: { id: 2, color: "#8B4513", solid: true, farmable: true },
    STONE: { id: 3, color: "#696969", solid: true, farmable: false },
    WATER: { id: 4, color: "#4169E1", solid: false, farmable: false },
    SAND: { id: 5, color: "#F4A460", solid: true, farmable: true },
    CLAY: { id: 6, color: "#CD853F", solid: true, farmable: true },
    COAL: { id: 7, color: "#2F4F4F", solid: true, farmable: false },
    IRON: { id: 8, color: "#B87333", solid: true, farmable: false },
    GOLD: { id: 9, color: "#FFD700", solid: true, farmable: false },
    TREE_TRUNK: { id: 10, color: "#8B4513", solid: true, farmable: false },
    TREE_LEAVES: { id: 11, color: "#228B22", solid: true, farmable: false },
    WHEAT: {
      id: 12,
      color: "#DAA520",
      solid: false,
      farmable: false,
      crop: true,
      growthTime: 240, //seconds
    },
    CARROT: {
      id: 13,
      color: "#FF8C00",
      solid: false,
      farmable: false,
      crop: true,
      growthTime: 120, //seconds
    },
    MUSHROOM: {
      id: 14,
      color: "#8B0000",
      solid: false,
      farmable: false,
      crop: true,
      growthTime: 60, //seconds
    },
    CACTUS: {
      id: 15,
      color: "#32CD32",
      solid: true,
      farmable: false,
      crop: true,
      growthTime: 960, //seconds
    },
    SNOW: { id: 16, color: "#FFFAFA", solid: true, farmable: true },
    ICE: { id: 17, color: "#B0E0E6", solid: true, farmable: false },
    LAVA: { id: 18, color: "#FF4500", solid: false, farmable: false },
    BEDROCK: { id: 19, color: "#1C1C1C", solid: true, farmable: false },
    WHEAT_GROWING: {
      id: 20,
      color: "#9ACD32",
      solid: false,
      farmable: false,
      crop: true,
    },
    CARROT_GROWING: {
      id: 21,
      color: "#FF7F50",
      solid: false,
      farmable: false,
      crop: true,
    },
    MUSHROOM_GROWING: {
      id: 22,
      color: "#CD5C5C",
      solid: false,
      farmable: false,
      crop: true,
    },
    CACTUS_GROWING: {
      id: 23,
      color: "#228B22",
      solid: true,
      farmable: false,
      crop: true,
    },
    // Plant parts for grown crops
    WHEAT_STALK: { id: 24, color: "#8B7355", solid: false, farmable: false },
    WHEAT_GRAIN: { id: 25, color: "#FFD700", solid: false, farmable: false },
    CARROT_LEAVES: { id: 26, color: "#228B22", solid: false, farmable: false },
    CARROT_ROOT: { id: 27, color: "#FF6347", solid: false, farmable: false },
    MUSHROOM_STEM: { id: 28, color: "#D2691E", solid: false, farmable: false },
    MUSHROOM_CAP: { id: 29, color: "#8B0000", solid: false, farmable: false },
    CACTUS_BODY: { id: 30, color: "#2E8B57", solid: true, farmable: false },
    CACTUS_FLOWER: { id: 31, color: "#FF69B4", solid: false, farmable: false },
  },
  // Biome definitions - keeping as static since they don't change frequently
  BIOMES: {
    FOREST: {
      surfaceTile: null, // Will be set after TILES is defined
      subTile: null,
      trees: true,
      crops: [],
      name: "Forest",
    },
    DESERT: {
      surfaceTile: null,
      subTile: null,
      trees: false,
      crops: [],
      name: "Desert",
    },
    TUNDRA: {
      surfaceTile: null,
      subTile: null,
      trees: false,
      crops: [],
      name: "Tundra",
    },
    SWAMP: {
      surfaceTile: null,
      subTile: null,
      trees: true,
      crops: [],
      name: "Swamp",
    },
  },
};

const stateSignals = {
  seedInventory: new Signal.State({
    WHEAT: 5,
    CARROT: 3,
    MUSHROOM: 1,
    CACTUS: 2,
  }),
  selectedSeedType: new Signal.State(null),
  gameTime: new Signal.State(0),
  growthTimers: new Signal.State({}),
  plantStructures: new Signal.State({}), // Store plant growth data
  seeds: new Signal.State(0),
  viewMode: new Signal.State("normal"),
  // Player character
  player: new Signal.State({
    x: 200,
    y: 50,
    width: 6,
    height: 8,
    velocityX: 0,
    velocityY: 0,
    speed: 3,
    jumpPower: 12,
    onGround: false,
    color: "#FF69B4",
    lastDirection: 0, // Track last movement direction
  }),
  // World data
  world: new Signal.State([]),
  // Camera system
  camera: new Signal.State({
    x: 0,
    y: 0,
    speed: 5,
  }),
};

// Create computed signals for derived values
const computedSignals = {
  totalSeeds: new Signal.Computed(() => {
    const inventory = stateSignals.seedInventory.get();

    return Object.values(inventory).reduce((sum, count) => sum + count, 0);
  }),

  playerTilePosition: new Signal.Computed(() => {
    const player = stateSignals.player.get();
    const tileSize = configSignals.TILE_SIZE.get();

    return {
      x: Math.floor((player.x + player.width / 2) / tileSize),
      y: Math.floor(player.y / tileSize),
    };
  }),

  currentBiome: new Signal.Computed(() => {
    const playerPos = computedSignals.playerTilePosition.get();
    const biomes = configSignals.BIOMES;

    // getBiome might expect an x coordinate; keep call the same but guard result
    return (
      getBiome(playerPos.x, biomes) || {
        name: "Unknown",
        trees: false,
        crops: [],
      }
    );
  }),

  currentDepth: new Signal.Computed(() => {
    const playerPos = computedSignals.playerTilePosition.get();
    const surfaceLevel = configSignals.SURFACE_LEVEL.get();

    if (playerPos.y > surfaceLevel) {
      const depthLevel = playerPos.y - surfaceLevel;

      if (depthLevel < 15) return "Shallow";
      else if (depthLevel < 30) return "Deep";
      else return "Very Deep";
    } else if (playerPos.y < surfaceLevel - 5) {
      return "Sky";
    }
    return "Surface";
  }),
};

// Expose reactive state through globalThis
globalThis.spriteGarden = {
  config: configSignals,
  state: stateSignals,
  computed: computedSignals,
  // Helper methods to get/set values
  getConfig: (key) => configSignals[key]?.get(),
  setState: (key, value) => stateSignals[key]?.set(value),
  getState: (key) => stateSignals[key]?.get(),
  updateState: (key, updater) => {
    const current = stateSignals[key]?.get();
    if (current !== undefined) {
      stateSignals[key].set(updater(current));
    }
  },
};

// Initialize biomes after TILES is defined
const { TILES, BIOMES } = configSignals;
BIOMES.FOREST.surfaceTile = TILES.GRASS;
BIOMES.FOREST.subTile = TILES.DIRT;
BIOMES.FOREST.crops = [TILES.WHEAT, TILES.CARROT];

BIOMES.DESERT.surfaceTile = TILES.SAND;
BIOMES.DESERT.subTile = TILES.SAND;
BIOMES.DESERT.crops = [TILES.CACTUS];

BIOMES.TUNDRA.surfaceTile = TILES.SNOW;
BIOMES.TUNDRA.subTile = TILES.DIRT;
BIOMES.TUNDRA.crops = [];

BIOMES.SWAMP.surfaceTile = TILES.CLAY;
BIOMES.SWAMP.subTile = TILES.CLAY;
BIOMES.SWAMP.crops = [TILES.MUSHROOM];

const canvas = globalThis.document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// Device detection
const isMobile =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent,
  ) ||
  "ontouchstart" in window ||
  window.screen.width <= 768;

// Input handling
const keys = {};
const touchKeys = {};

// Create game state object for passing to functional methods
const getCurrentGameState = () => {
  return {
    state: {
      seedInventory: stateSignals.seedInventory.get(),
      selectedSeedType: stateSignals.selectedSeedType.get(),
      gameTime: stateSignals.gameTime.get(),
      growthTimers: stateSignals.growthTimers.get(),
      plantStructures: stateSignals.plantStructures.get(),
      seeds: stateSignals.seeds.get(),
      viewMode: stateSignals.viewMode.get(),
    },
    player: stateSignals.player.get(),
    world: stateSignals.world.get(),
    camera: stateSignals.camera.get(),
    TILES: configSignals.TILES,
    TILE_SIZE: configSignals.TILE_SIZE.get(),
    WORLD_WIDTH: configSignals.WORLD_WIDTH.get(),
    WORLD_HEIGHT: configSignals.WORLD_HEIGHT.get(),
    SURFACE_LEVEL: configSignals.SURFACE_LEVEL.get(),
    BIOMES: configSignals.BIOMES,
    GRAVITY: configSignals.GRAVITY.get(),
    FRICTION: configSignals.FRICTION.get(),
    MAX_FALL_SPEED: configSignals.MAX_FALL_SPEED.get(),
  };
};

// Keyboard events
globalThis.document.addEventListener("keydown", (e) => {
  keys[e.key.toLowerCase()] = true;

  // Handle farming actions
  if (e.key.toLowerCase() === "e") {
    handleFarmAction(
      getCurrentGameState(),
      globalThis.spriteGarden,
      globalThis.document,
    );
  } else if (e.key.toLowerCase() === "q") {
    handleBreakBlock(
      getCurrentGameState(),
      globalThis.spriteGarden,
      globalThis.document,
    );
  }

  e.preventDefault();
});

globalThis.document.addEventListener("keyup", (e) => {
  keys[e.key.toLowerCase()] = false;

  e.preventDefault();
});

// Touch controls
function setupTouchControls() {
  const touchButtons = globalThis.document.querySelectorAll(".touch-btn");

  touchButtons.forEach((btn) => {
    const key = btn.getAttribute("data-key");

    // Touch start
    btn.addEventListener("touchstart", (e) => {
      e.stopPropagation();
      e.preventDefault();
      touchKeys[key] = true;
      btn.style.background = "rgba(255, 255, 255, 0.3)";

      // Handle special actions
      if (key === "e") {
        handleFarmAction(
          getCurrentGameState(),
          globalThis.spriteGarden,
          globalThis.document,
        );
      } else if (key === "q") {
        handleBreakBlock(
          getCurrentGameState(),
          globalThis.spriteGarden,
          globalThis.document,
        );
      }
    });

    // Touch end
    btn.addEventListener("touchend", (e) => {
      e.stopPropagation();
      e.preventDefault();
      touchKeys[key] = false;
      btn.style.background = "rgba(0, 0, 0, 0.6)";
    });

    // Touch cancel
    btn.addEventListener("touchcancel", (e) => {
      e.stopPropagation();
      e.preventDefault();
      touchKeys[key] = false;
      btn.style.background = "rgba(0, 0, 0, 0.6)";
    });

    // Mouse events for desktop testing
    btn.addEventListener("mousedown", (e) => {
      e.stopPropagation();
      e.preventDefault();
      touchKeys[key] = true;
      btn.style.background = "rgba(255, 255, 255, 0.3)";

      if (key === "e") {
        handleFarmAction(
          getCurrentGameState(),
          globalThis.spriteGarden,
          globalThis.document,
        );
      } else if (key === "q") {
        handleBreakBlock(
          getCurrentGameState(),
          globalThis.spriteGarden,
          globalThis.document,
        );
      }
    });

    btn.addEventListener("mouseup", (e) => {
      e.stopPropagation();
      e.preventDefault();
      touchKeys[key] = false;
      btn.style.background = "rgba(0, 0, 0, 0.6)";
    });

    btn.addEventListener("mouseleave", (e) => {
      e.stopPropagation();
      touchKeys[key] = false;
      btn.style.background = "rgba(0, 0, 0, 0.6)";
    });
  });
}

// Combined input check
function isKeyPressed(key) {
  return keys[key] || touchKeys[key];
}

// Check if a position is solid
function isSolid(x, y) {
  const TILE_SIZE = configSignals.TILE_SIZE.get();
  const WORLD_WIDTH = configSignals.WORLD_WIDTH.get();
  const WORLD_HEIGHT = configSignals.WORLD_HEIGHT.get();
  const world = stateSignals.world.get();

  const tileX = Math.floor(x / TILE_SIZE);
  const tileY = Math.floor(y / TILE_SIZE);

  if (tileX < 0 || tileX >= WORLD_WIDTH || tileY < 0 || tileY >= WORLD_HEIGHT) {
    return true;
  }

  const column = world[tileX];

  if (!column) return true;

  const tile = column[tileY];

  return tile && tile.solid;
}

// Check collision with world
function checkCollision(x, y, width, height) {
  const points = [
    [x, y],
    [x + width, y],
    [x, y + height],
    [x + width, y + height],
    [x + width / 2, y],
    [x + width / 2, y + height],
    [x, y + height / 2],
    [x + width, y + height / 2],
  ];

  return points.some((point) => isSolid(point[0], point[1]));
}

// Update player physics
function updatePlayer() {
  const GRAVITY = configSignals.GRAVITY.get();
  const FRICTION = configSignals.FRICTION.get();
  const MAX_FALL_SPEED = configSignals.MAX_FALL_SPEED.get();
  const TILE_SIZE = configSignals.TILE_SIZE.get();
  const WORLD_WIDTH = configSignals.WORLD_WIDTH.get();
  const WORLD_HEIGHT = configSignals.WORLD_HEIGHT.get();

  const player = stateSignals.player.get();
  const camera = stateSignals.camera.get();

  const updatedPlayer = { ...player };

  updatedPlayer.velocityY += GRAVITY;
  if (updatedPlayer.velocityY > MAX_FALL_SPEED) {
    updatedPlayer.velocityY = MAX_FALL_SPEED;
  }

  // Handle horizontal movement and track direction
  if (isKeyPressed("a") || isKeyPressed("arrowleft")) {
    updatedPlayer.velocityX = -updatedPlayer.speed;
    updatedPlayer.lastDirection = -1;
  } else if (isKeyPressed("d") || isKeyPressed("arrowright")) {
    updatedPlayer.velocityX = updatedPlayer.speed;
    updatedPlayer.lastDirection = 1;
  } else {
    updatedPlayer.velocityX *= FRICTION;
    updatedPlayer.lastDirection = 0;
  }

  // Handle jumping
  if (
    (isKeyPressed("w") || isKeyPressed("arrowup") || isKeyPressed(" ")) &&
    updatedPlayer.onGround
  ) {
    updatedPlayer.velocityY = -updatedPlayer.jumpPower;
    updatedPlayer.onGround = false;
  }

  // Move horizontally
  const newX = updatedPlayer.x + updatedPlayer.velocityX;
  if (
    !checkCollision(
      newX,
      updatedPlayer.y,
      updatedPlayer.width,
      updatedPlayer.height,
    )
  ) {
    updatedPlayer.x = newX;
  } else {
    updatedPlayer.velocityX = 0;
  }

  // Move vertically
  const newY = updatedPlayer.y + updatedPlayer.velocityY;
  if (
    !checkCollision(
      updatedPlayer.x,
      newY,
      updatedPlayer.width,
      updatedPlayer.height,
    )
  ) {
    updatedPlayer.y = newY;
    updatedPlayer.onGround = false;
  } else {
    if (updatedPlayer.velocityY > 0) {
      updatedPlayer.onGround = true;
    }
    updatedPlayer.velocityY = 0;
  }

  // Keep player in world bounds
  updatedPlayer.x = Math.max(
    0,
    Math.min(updatedPlayer.x, WORLD_WIDTH * TILE_SIZE - updatedPlayer.width),
  );
  updatedPlayer.y = Math.max(
    0,
    Math.min(updatedPlayer.y, WORLD_HEIGHT * TILE_SIZE - updatedPlayer.height),
  );

  // Update camera to follow player
  const targetCameraX =
    updatedPlayer.x + updatedPlayer.width / 2 - canvas.width / 2;
  const targetCameraY =
    updatedPlayer.y + updatedPlayer.height / 2 - canvas.height / 2;

  const updatedCamera = { ...camera };

  updatedCamera.x += (targetCameraX - updatedCamera.x) * 0.1;
  updatedCamera.y += (targetCameraY - updatedCamera.y) * 0.1;

  // Keep camera in bounds
  updatedCamera.x = Math.max(
    0,
    Math.min(updatedCamera.x, WORLD_WIDTH * TILE_SIZE - canvas.width),
  );
  updatedCamera.y = Math.max(
    0,
    Math.min(updatedCamera.y, WORLD_HEIGHT * TILE_SIZE - canvas.height),
  );

  // Update the signals
  stateSignals.player.set(updatedPlayer);
  stateSignals.camera.set(updatedCamera);
}

// Render player
function renderPlayer() {
  const player = stateSignals.player.get();
  const camera = stateSignals.camera.get();

  const screenX = player.x - camera.x;
  const screenY = player.y - camera.y;

  ctx.fillStyle = player.color;
  ctx.fillRect(screenX, screenY, player.width, player.height);

  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 1;
  ctx.strokeRect(screenX, screenY, player.width, player.height);

  // Eyes
  ctx.fillStyle = "#000000";
  ctx.fillRect(screenX + 1, screenY + 1, 1, 1);
  ctx.fillRect(screenX + 4, screenY + 1, 1, 1);
}

// Cave generation functions
function generateCaves() {
  const WORLD_WIDTH = configSignals.WORLD_WIDTH.get();
  const WORLD_HEIGHT = configSignals.WORLD_HEIGHT.get();
  const SURFACE_LEVEL = configSignals.SURFACE_LEVEL.get();
  const TILES = configSignals.TILES;
  const world = stateSignals.world.get();
  const caveSeeds = [];

  for (let i = 0; i < 25; i++) {
    caveSeeds.push({
      x: Math.floor(Math.random() * WORLD_WIDTH),
      y:
        SURFACE_LEVEL +
        5 +
        Math.floor(Math.random() * (WORLD_HEIGHT - SURFACE_LEVEL - 15)),
      size: 3 + Math.floor(Math.random() * 8),
      branches: 1 + Math.floor(Math.random() * 3),
    });
  }

  caveSeeds.forEach((seed) => {
    createCaveRoom(seed.x, seed.y, seed.size);

    for (let b = 0; b < seed.branches; b++) {
      const angle =
        (Math.PI * 2 * b) / seed.branches + (Math.random() - 0.5) * 0.5;

      const length = 10 + Math.floor(Math.random() * 20);

      createCaveTunnel(
        seed.x,
        seed.y,
        angle,
        length,
        1 + Math.floor(Math.random() * 2),
      );
    }
  });

  for (let i = 0; i < 50; i++) {
    const x = Math.floor(Math.random() * WORLD_WIDTH);
    const y =
      SURFACE_LEVEL +
      3 +
      Math.floor(Math.random() * (WORLD_HEIGHT - SURFACE_LEVEL - 10));

    const size = 1 + Math.floor(Math.random() * 3);

    if (Math.random() < 0.3) {
      createCaveRoom(x, y, size);
    }
  }
}

function createCaveRoom(centerX, centerY, radius) {
  const WORLD_WIDTH = configSignals.WORLD_WIDTH.get();
  const WORLD_HEIGHT = configSignals.WORLD_HEIGHT.get();
  const TILES = configSignals.TILES;
  const world = stateSignals.world.get();

  for (let x = centerX - radius; x <= centerX + radius; x++) {
    for (let y = centerY - radius; y <= centerY + radius; y++) {
      if (x >= 0 && x < WORLD_WIDTH && y >= 0 && y < WORLD_HEIGHT) {
        const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
        if (distance <= radius && world[x][y] !== TILES.BEDROCK) {
          world[x][y] = TILES.AIR;
        }
      }
    }
  }
}

function createCaveTunnel(startX, startY, angle, length, width) {
  const WORLD_WIDTH = configSignals.WORLD_WIDTH.get();
  const WORLD_HEIGHT = configSignals.WORLD_HEIGHT.get();
  const TILES = configSignals.TILES;
  const world = stateSignals.world.get();

  let currentX = startX;
  let currentY = startY;

  for (let i = 0; i < length; i++) {
    angle += (Math.random() - 0.5) * 0.3;
    currentX += Math.cos(angle);
    currentY += Math.sin(angle);

    for (let dx = -width; dx <= width; dx++) {
      for (let dy = -width; dy <= width; dy++) {
        const x = Math.floor(currentX + dx);
        const y = Math.floor(currentY + dy);

        if (x >= 0 && x < WORLD_WIDTH && y >= 0 && y < WORLD_HEIGHT) {
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance <= width && world[x][y] !== TILES.BEDROCK) {
            world[x][y] = TILES.AIR;
          }
        }
      }
    }

    if (Math.random() < 0.1) {
      createCaveRoom(
        Math.floor(currentX),
        Math.floor(currentY),
        2 + Math.floor(Math.random() * 2),
      );
    }
  }
}

// Generate world
function generateWorld() {
  const WORLD_WIDTH = configSignals.WORLD_WIDTH.get();
  const WORLD_HEIGHT = configSignals.WORLD_HEIGHT.get();
  const SURFACE_LEVEL = configSignals.SURFACE_LEVEL.get();
  const TILES = configSignals.TILES;
  const BIOMES = configSignals.BIOMES;

  // Initialize world array
  const world = [];
  for (let x = 0; x < WORLD_WIDTH; x++) {
    world[x] = [];
    for (let y = 0; y < WORLD_HEIGHT; y++) {
      world[x][y] = TILES.AIR;
    }
  }

  const heights = generateHeightMap(WORLD_WIDTH, SURFACE_LEVEL);

  for (let x = 0; x < WORLD_WIDTH; x++) {
    const biome = getBiome(x, BIOMES) || BIOMES.FOREST;
    const surfaceHeight = heights[x];

    for (let y = 0; y < WORLD_HEIGHT; y++) {
      if (y > surfaceHeight) {
        const depth = y - surfaceHeight;

        if (depth < 3) {
          world[x][y] = biome.subTile;
        } else if (depth < 15) {
          if (Math.random() < 0.1) {
            world[x][y] = TILES.COAL;
          } else {
            world[x][y] = TILES.STONE;
          }
        } else if (depth < 30) {
          if (Math.random() < 0.05) {
            world[x][y] = TILES.IRON;
          } else if (Math.random() < 0.02) {
            world[x][y] = TILES.GOLD;
          } else {
            world[x][y] = TILES.STONE;
          }
        } else if (y > WORLD_HEIGHT - 5) {
          world[x][y] = TILES.BEDROCK;
        } else {
          if (Math.random() < 0.01) {
            world[x][y] = TILES.LAVA;
          } else {
            world[x][y] = TILES.STONE;
          }
        }
      } else if (y === surfaceHeight) {
        world[x][y] = biome.surfaceTile;
      }
    }

    if (biome.trees && Math.random() < 0.1) {
      const treeHeight = 3 + Math.floor(Math.random() * 2);

      for (let i = 0; i < treeHeight; i++) {
        const y = surfaceHeight - i - 1;

        if (y >= 0) {
          if (i < treeHeight - 1) {
            world[x][y] = TILES.TREE_TRUNK;
          } else {
            for (let dx = -1; dx <= 1; dx++) {
              for (let dy = -1; dy <= 1; dy++) {
                const nx = x + dx;
                const ny = y + dy;
                if (
                  nx >= 0 &&
                  nx < WORLD_WIDTH &&
                  ny >= 0 &&
                  ny < WORLD_HEIGHT
                ) {
                  if (world[nx][ny] === TILES.AIR) {
                    world[nx][ny] = TILES.TREE_LEAVES;
                  }
                }
              }
            }
          }
        }
      }
    }

    if (biome.crops.length > 0 && Math.random() < 0.05) {
      const crop = biome.crops[Math.floor(Math.random() * biome.crops.length)];
      const y = surfaceHeight - 1;

      if (y >= 0 && world[x][y] === TILES.AIR) {
        world[x][y] = crop;

        // Add to inventory when found — guard against undefined and missing keys
        const cropToSeed = {
          [TILES.WHEAT.id]: "WHEAT",
          [TILES.CARROT.id]: "CARROT",
          [TILES.MUSHROOM.id]: "MUSHROOM",
          [TILES.CACTUS.id]: "CACTUS",
        };
        const seedType = cropToSeed[crop.id];
        if (seedType) {
          globalThis.spriteGarden.updateState("seedInventory", (inv) => ({
            ...inv,
            [seedType]: (inv && inv[seedType] ? inv[seedType] : 0) + 2,
          }));
        }
      }
    }
  }

  // Set the world in state
  stateSignals.world.set(world);
  generateCaves();

  // Handle water generation (create small shallow water pockets)
  const currentWorld = stateSignals.world.get();

  for (let x = 0; x < WORLD_WIDTH; x++) {
    const waterNoise = noise(x, 0, 1000);

    if (waterNoise > 0.6) {
      // create a slightly larger water pool (1..3 tiles deep)
      const waterDepth = 1 + Math.floor((waterNoise - 0.6) * 5); // 1..3-ish
      const waterLevelTop = Math.min(WORLD_HEIGHT - 1, heights[x] + waterDepth);

      // fill from surface+1 up to waterLevelTop (inclusive)
      for (let y = heights[x] + 1; y <= waterLevelTop; y++) {
        if (y >= 0 && y < WORLD_HEIGHT) {
          currentWorld[x][y] = TILES.WATER;
        }
      }
    }
  }
  stateSignals.world.set([...currentWorld]);

  updateInventoryDisplay(stateSignals, globalThis.document);
  updateUI(getCurrentGameState());
}

// Render world
function render() {
  const TILE_SIZE = configSignals.TILE_SIZE.get();
  const WORLD_WIDTH = configSignals.WORLD_WIDTH.get();
  const WORLD_HEIGHT = configSignals.WORLD_HEIGHT.get();
  const TILES = configSignals.TILES;
  const camera = stateSignals.camera.get();
  const world = stateSignals.world.get() || [];
  const viewMode = stateSignals.viewMode.get();

  ctx.fillStyle = "#87CEEB";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const tilesX = Math.ceil(canvas.width / TILE_SIZE) + 1;
  const tilesY = Math.ceil(canvas.height / TILE_SIZE) + 1;

  const startX = Math.floor(camera.x / TILE_SIZE);
  const startY = Math.floor(camera.y / TILE_SIZE);

  for (let x = 0; x < tilesX; x++) {
    for (let y = 0; y < tilesY; y++) {
      const worldX = startX + x;
      const worldY = startY + y;

      if (
        worldX >= 0 &&
        worldX < WORLD_WIDTH &&
        worldY >= 0 &&
        worldY < WORLD_HEIGHT
      ) {
        const column = world[worldX];

        if (!column) continue;

        const tile = column[worldY];

        // skip empty tiles
        if (!tile || tile === TILES.AIR) continue;

        let color = tile.color;

        if (viewMode === "xray") {
          if (tile === TILES.COAL) color = "#FFFF00";
          else if (tile === TILES.IRON) color = "#FF6600";
          else if (tile === TILES.GOLD) color = "#FFD700";
          else if (tile === TILES.LAVA) color = "#FF0000";
          else if (!tile.solid) color = tile.color;
          else color = "rgba(100,100,100,0.3)";
        }

        ctx.fillStyle = color;
        ctx.fillRect(
          x * TILE_SIZE - (camera.x % TILE_SIZE),
          y * TILE_SIZE - (camera.y % TILE_SIZE),
          TILE_SIZE,
          TILE_SIZE,
        );
      }
    }
  }

  renderPlayer();
}

// Mouse/touch handling for tile inspection
function setupTileInspection() {
  const getPointerPosition = (e) => {
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const scale = configSignals.canvasScale.get();
    const scaleX = (canvas.width / rect.width) * scale;
    const scaleY = (canvas.height / rect.height) * scale;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const inspectTile = (e) => {
    const TILE_SIZE = configSignals.TILE_SIZE.get();
    const WORLD_WIDTH = configSignals.WORLD_WIDTH.get();
    const WORLD_HEIGHT = configSignals.WORLD_HEIGHT.get();
    const TILES = configSignals.TILES;
    const world = stateSignals.world.get() || [];
    const camera = stateSignals.camera.get();

    const pos = getPointerPosition(e);
    const worldX = Math.floor((pos.x + camera.x) / TILE_SIZE);
    const worldY = Math.floor((pos.y + camera.y) / TILE_SIZE);

    if (
      worldX >= 0 &&
      worldX < WORLD_WIDTH &&
      worldY >= 0 &&
      worldY < WORLD_HEIGHT
    ) {
      const column = world[worldX];
      if (!column) {
        canvas.title = `Tile: Unknown (${worldX}, ${worldY})`;
        return;
      }
      const tile = column[worldY];
      if (!tile) {
        canvas.title = `Tile: AIR (${worldX}, ${worldY})`;
        return;
      }
      const tileName =
        Object.keys(TILES).find((key) => TILES[key] === tile) || "Custom";
      canvas.title = `Tile: ${tileName} (${worldX}, ${worldY})`;
    }
  };

  canvas.addEventListener("mousemove", inspectTile);
  canvas.addEventListener("touchstart", inspectTile);
  canvas.addEventListener("touchmove", inspectTile);
}

// Game loop
function gameLoop() {
  updatePlayer();
  updateCrops(getCurrentGameState(), globalThis.spriteGarden);

  render();

  updateUI(getCurrentGameState());

  // Increment game time every frame (we store seconds as fractional)
  stateSignals.gameTime.set(stateSignals.gameTime.get() + 1 / 60);

  requestAnimationFrame(gameLoop);
}

// Utility functions
function generateNewWorld() {
  generateWorld();

  // Reset game state
  stateSignals.growthTimers.set({});
  stateSignals.plantStructures.set({});
  stateSignals.gameTime.set(0);

  // Give player starting seeds
  stateSignals.seedInventory.set({
    WHEAT: 5,
    CARROT: 3,
    MUSHROOM: 1,
    CACTUS: 2,
  });

  const WORLD_WIDTH = configSignals.WORLD_WIDTH.get();
  const SURFACE_LEVEL = configSignals.SURFACE_LEVEL.get();
  const TILE_SIZE = configSignals.TILE_SIZE.get();
  const TILES = configSignals.TILES;
  const WORLD_HEIGHT = configSignals.WORLD_HEIGHT.get();
  const player = stateSignals.player.get();
  const world = stateSignals.world.get();

  // use ints for spawn coords
  let spawnX = Math.floor(WORLD_WIDTH / 2);
  let spawnY = Math.floor(SURFACE_LEVEL - 5);

  for (let x = spawnX - 25; x < spawnX + 25; x++) {
    for (let y = spawnY - 5; y < spawnY + 5; y++) {
      if (x >= 0 && x < WORLD_WIDTH && y >= 0 && y < WORLD_HEIGHT) {
        const tileX = Math.floor(x);
        const tileY = Math.floor(y);

        if (
          world[tileX][tileY] === TILES.AIR &&
          world[tileX][tileY + 1] &&
          world[tileX][tileY + 1].solid
        ) {
          const updatedPlayer = {
            ...player,
            x: x * TILE_SIZE,
            y: y * TILE_SIZE,
            velocityX: 0,
            velocityY: 0,
            lastDirection: 0,
          };
          stateSignals.player.set(updatedPlayer);
          updateInventoryDisplay(stateSignals, globalThis.document);
          return;
        }
      }
    }
  }

  const updatedPlayer = {
    ...player,
    x: spawnX * TILE_SIZE,
    y: spawnY * TILE_SIZE,
    velocityX: 0,
    velocityY: 0,
    lastDirection: 0,
  };
  stateSignals.player.set(updatedPlayer);
  updateInventoryDisplay(stateSignals, globalThis.document);
}

function toggleView() {
  const currentMode = stateSignals.viewMode.get();
  stateSignals.viewMode.set(currentMode === "normal" ? "xray" : "normal");
  updateUI(getCurrentGameState());
}

globalThis.document.getElementById("stats").addEventListener("click", (e) => {
  e.stopPropagation();

  globalThis.document.getElementById("ui-grid").toggleAttribute("hidden");
});

globalThis.document
  .getElementById("gameContainer")
  .addEventListener("click", (e) => {
    e.stopPropagation();

    const uiGrid = globalThis.document.getElementById("ui-grid");

    if (uiGrid.getAttribute("hidden") !== null) {
      uiGrid.removeAttribute("hidden");
    }
  });

globalThis.document
  .getElementById("gameContainer")
  .addEventListener("touchend", (e) => {
    const uiGrid = globalThis.document.getElementById("ui-grid");

    if (uiGrid.getAttribute("hidden") !== null) {
      uiGrid.removeAttribute("hidden");
    }
  });

globalThis.document
  .getElementById("controls")
  .addEventListener("click", (e) => {
    e.stopPropagation();
    globalThis.document
      .getElementById("touchControls")
      .toggleAttribute("hidden");
  });

// Prevent default touch behaviors
globalThis.document.addEventListener(
  "touchstart",
  (e) => {
    if (e.target.closest("#touchControls") || e.target === canvas) {
      e.preventDefault();
    }
  },
  { passive: false },
);

globalThis.document.addEventListener(
  "touchmove",
  (e) => {
    if (e.target.closest("#touchControls") || e.target === canvas) {
      e.preventDefault();
    }
  },
  { passive: false },
);

globalThis.document.addEventListener(
  "touchend",
  (e) => {
    if (e.target.closest("#touchControls") || e.target === canvas) {
      e.preventDefault();
    }
  },
  { passive: false },
);

// Prevent context menu on long press
globalThis.document.addEventListener("contextmenu", (e) => {
  if (e.target.closest("#touchControls") || e.target === canvas) {
    e.preventDefault();
  }
});

// Prevent zoom on double tap
globalThis.document.addEventListener("dblclick", (e) => {
  if (e.target.closest("#touchControls") || e.target === canvas) {
    e.preventDefault();
  }
});

// Set up reactive effects for UI updates
effect(() => {
  // Auto-update inventory display when seed inventory changes
  const inventory = stateSignals.seedInventory.get();
  updateInventoryDisplay(stateSignals, globalThis.document);
});

effect(() => {
  // Auto-update UI when computed values change
  const biome = computedSignals.currentBiome.get() || { name: "Unknown" };
  const depth = computedSignals.currentDepth.get();
  const gameTime = stateSignals.gameTime.get();
  const viewMode = stateSignals.viewMode.get();

  const currentBiomeEl = globalThis.document.getElementById("currentBiome");
  if (currentBiomeEl) currentBiomeEl.textContent = biome.name;

  const currentDepthEl = globalThis.document.getElementById("currentDepth");
  if (currentDepthEl) currentDepthEl.textContent = depth;

  const gameTimeEl = globalThis.document.getElementById("gameTime");
  if (gameTimeEl) gameTimeEl.textContent = Math.floor(gameTime);

  // Fixed mapping: "normal" -> "Normal", "xray" -> "X-Ray"
  const viewModeTextEl = globalThis.document.getElementById("viewModeText");
  if (viewModeTextEl) {
    viewModeTextEl.textContent = viewMode === "normal" ? "Normal" : "X-Ray";
  }
});

effect(() => {
  // Auto-update total seeds display
  const totalSeeds = computedSignals.totalSeeds.get();

  const seedCountEl = globalThis.document.getElementById("seedCount");
  if (seedCountEl) {
    seedCountEl.textContent = totalSeeds;
  }
});

effect(() => {
  // Auto-update selected seed display
  const selectedSeed = stateSignals.selectedSeedType.get();

  const selectedSeedEl = globalThis.document.getElementById("selectedSeed");
  if (selectedSeedEl) {
    selectedSeedEl.textContent = selectedSeed || "None";
  }
});

// Initialize game
function initGame() {
  // Set default to 400x400 and update the select element
  const sel = globalThis.document.getElementById("resolutionSelect");
  if (sel) sel.value = "400";

  // Setup event listeners
  globalThis.addEventListener("resize", () =>
    resizeCanvas(configSignals, globalThis.document),
  );

  const resolutionSelectEl = document.getElementById("resolutionSelect");
  if (resolutionSelectEl) {
    resolutionSelectEl.addEventListener("change", (e) => {
      configSignals.currentResolution.set(e.currentTarget.value);
      resizeCanvas(configSignals, globalThis.document);
    });
  }

  const genBtn = globalThis.document.getElementById("generateNewWorld");
  if (genBtn) genBtn.addEventListener("click", generateNewWorld);

  globalThis.document.querySelectorAll(".seed-btn").forEach((seedBtn) => {
    seedBtn.addEventListener("click", (e) =>
      selectSeed(stateSignals, e, globalThis.document),
    );
  });

  const toggleBtn = globalThis.document.getElementById("toggleView");
  if (toggleBtn) toggleBtn.addEventListener("click", toggleView);

  setupTouchControls();
  setupTileInspection();

  // Initialize canvas and world
  resizeCanvas(configSignals, globalThis.document);
  generateNewWorld();
  gameLoop();
}

// Start the game
globalThis.globalThis.document.addEventListener(
  "DOMContentLoaded",
  function () {
    initGame();
  },
);
