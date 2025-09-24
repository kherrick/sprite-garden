import { configSignals, stateSignals } from "./state.mjs";
import { generateCaves } from "./generateCaves.mjs";
import { generateHeightMap } from "./generateHeightMap.mjs";
import { getBiome } from "./getBiome.mjs";
import { getCurrentGameState } from "./getCurrentGameState.mjs";
import { noise } from "./noise.mjs";
import { updateInventoryDisplay } from "./updateInventoryDisplay.mjs";
import { updateUI } from "./updateUI.mjs";

// Generate world
export function generateWorld(doc) {
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

  updateInventoryDisplay(doc, stateSignals);
  updateUI(doc, getCurrentGameState(stateSignals, configSignals));
}

// Utility functions
export function generateNewWorld(doc) {
  generateWorld(doc);

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
          updateInventoryDisplay(doc, stateSignals);
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
  updateInventoryDisplay(doc, stateSignals);
}
