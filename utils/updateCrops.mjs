export function updateCrops(currentState, game) {
  const {
    world,
    TILES,
    growthTimers,
    plantStructures,
    WORLD_WIDTH,
    WORLD_HEIGHT,
  } = currentState;
  const currentTimers = game.state.growthTimers.get();
  const currentWorld = game.state.world.get();
  const currentStructures = game.state.plantStructures.get();

  let timersChanged = false;
  let worldChanged = false;
  let structuresChanged = false;

  const updatedTimers = { ...currentTimers };
  const updatedStructures = { ...currentStructures };

  // Update crop growth
  for (const [key, timer] of Object.entries(updatedTimers)) {
    timer.timeLeft -= 1 / 60; // Decrement by frame time

    // Update plant structure growth if structure exists
    if (updatedStructures[key]) {
      const structure = updatedStructures[key];
      const growthProgress =
        1 - timer.timeLeft / TILES[timer.seedType].growthTime;

      // Clear old plant blocks from the world
      if (structure.blocks) {
        structure.blocks.forEach((block) => {
          if (
            block.x >= 0 &&
            block.x < WORLD_WIDTH &&
            block.y >= 0 &&
            block.y < WORLD_HEIGHT &&
            currentWorld[block.x][block.y] !== TILES.AIR
          ) {
            currentWorld[block.x][block.y] = TILES.AIR;
          }
        });
      }

      // Generate plant structure based on type and growth
      const [x, y] = key.split(",").map(Number);
      structure.blocks = generatePlantStructure(
        x,
        y,
        timer.seedType,
        growthProgress,
        TILES,
        WORLD_WIDTH,
        WORLD_HEIGHT,
      );

      // Place the plant blocks in the world
      structure.blocks.forEach((block) => {
        if (
          block.x >= 0 &&
          block.x < WORLD_WIDTH &&
          block.y >= 0 &&
          block.y < WORLD_HEIGHT
        ) {
          currentWorld[block.x][block.y] = block.tile;
        }
      });

      worldChanged = true;
      structuresChanged = true;
    }

    // Complete growth if timer has expired
    if (timer.timeLeft <= 0) {
      if (updatedStructures[key]) {
        updatedStructures[key].mature = true;
        updatedStructures[key].seedType = timer.seedType;
      }

      // For simple crops not using structure (optional fallback)
      const matureTileMap = {
        WHEAT: TILES.WHEAT,
        CARROT: TILES.CARROT,
        MUSHROOM: TILES.MUSHROOM,
        CACTUS: TILES.CACTUS,
      };

      const [x, y] = key.split(",").map(Number);
      if (
        matureTileMap[timer.seedType] &&
        currentWorld[x][y] !== matureTileMap[timer.seedType]
      ) {
        currentWorld[x][y] = matureTileMap[timer.seedType];
        worldChanged = true;
      }

      delete updatedTimers[key];
      timersChanged = true;
    }
  }

  // Update state if anything changed
  if (timersChanged) {
    game.state.growthTimers.set(updatedTimers);
  }
  if (structuresChanged) {
    game.state.plantStructures.set(updatedStructures);
  }
  if (worldChanged) {
    game.state.world.set([...currentWorld]);
  }
}

function generatePlantStructure(
  x,
  y,
  seedType,
  progress,
  TILES,
  WORLD_WIDTH,
  WORLD_HEIGHT,
) {
  const blocks = [];

  // Ensure progress is between 0 and 1
  progress = Math.max(0, Math.min(1, progress));

  // Different growth patterns for each plant type
  switch (seedType) {
    case "WHEAT":
      return generateWheatStructure(x, y, progress, TILES);
    case "CARROT":
      return generateCarrotStructure(x, y, progress, TILES);
    case "MUSHROOM":
      return generateMushroomStructure(x, y, progress, TILES);
    case "CACTUS":
      return generateCactusStructure(x, y, progress, TILES);
    default:
      return blocks;
  }
}

function generateWheatStructure(x, y, progress, TILES) {
  const blocks = [];
  const maxHeight = 5;
  const currentHeight = Math.ceil(maxHeight * progress);

  for (let i = 0; i < currentHeight; i++) {
    const tileY = y - i;

    if (i < currentHeight - 1 || progress < 0.8) {
      // Stalk
      blocks.push({ x, y: tileY, tile: TILES.WHEAT_STALK });

      // Variation with side stalks
      if (progress > 0.5 && i > 0 && Math.random() < 0.3) {
        if (Math.random() < 0.5) {
          blocks.push({ x: x - 1, y: tileY, tile: TILES.WHEAT_STALK });
        } else {
          blocks.push({ x: x + 1, y: tileY, tile: TILES.WHEAT_STALK });
        }
      }
    } else {
      // Top grains when mature
      blocks.push({ x, y: tileY, tile: TILES.WHEAT_GRAIN });

      // Add grain clusters
      if (progress > 0.9) {
        blocks.push({ x: x - 1, y: tileY, tile: TILES.WHEAT_GRAIN });
        blocks.push({ x: x + 1, y: tileY, tile: TILES.WHEAT_GRAIN });
        blocks.push({ x, y: tileY - 1, tile: TILES.WHEAT_GRAIN });
      }
    }
  }

  return blocks;
}

function generateCarrotStructure(x, y, progress, TILES) {
  const blocks = [];
  // Underground root
  if (progress > 0.2) {
    const rootDepth = Math.ceil(3 * progress);
    for (let i = 1; i <= rootDepth; i++) {
      blocks.push({ x, y: y + i, tile: TILES.CARROT_ROOT });

      // Thicker root as it grows
      if (progress > 0.6 && i < rootDepth) {
        if (Math.random() < 0.4) {
          blocks.push({ x: x - 1, y: y + i, tile: TILES.CARROT_ROOT });
        }
        if (Math.random() < 0.4) {
          blocks.push({ x: x + 1, y: y + i, tile: TILES.CARROT_ROOT });
        }
      }
    }
  }

  // Leaves on top
  const leafHeight = Math.ceil(2 * progress);
  for (let i = 0; i < leafHeight; i++) {
    blocks.push({ x, y: y - i, tile: TILES.CARROT_LEAVES });

    // Spread leaves
    if (progress > 0.5 && i === leafHeight - 1) {
      blocks.push({ x: x - 1, y: y - i, tile: TILES.CARROT_LEAVES });
      blocks.push({ x: x + 1, y: y - i, tile: TILES.CARROT_LEAVES });

      if (progress > 0.8) {
        blocks.push({ x: x - 1, y: y - i - 1, tile: TILES.CARROT_LEAVES });
        blocks.push({ x: x + 1, y: y - i - 1, tile: TILES.CARROT_LEAVES });
      }
    }
  }

  return blocks;
}

function generateMushroomStructure(x, y, progress, TILES) {
  const blocks = [];
  const maxHeight = 4;
  const currentHeight = Math.ceil(maxHeight * progress);

  // Stem
  for (let i = 0; i < currentHeight; i++) {
    blocks.push({ x, y: y - i, tile: TILES.MUSHROOM_STEM });
  }

  // Cap grows as progress advances
  if (progress > 0.4) {
    const capY = y - currentHeight;
    blocks.push({ x, y: capY, tile: TILES.MUSHROOM_CAP });

    // Expand cap
    if (progress > 0.6) {
      blocks.push({ x: x - 1, y: capY, tile: TILES.MUSHROOM_CAP });
      blocks.push({ x: x + 1, y: capY, tile: TILES.MUSHROOM_CAP });
    }

    if (progress > 0.8) {
      blocks.push({ x: x - 2, y: capY, tile: TILES.MUSHROOM_CAP });
      blocks.push({ x: x + 2, y: capY, tile: TILES.MUSHROOM_CAP });
      blocks.push({ x: x - 1, y: capY - 1, tile: TILES.MUSHROOM_CAP });
      blocks.push({ x, y: capY - 1, tile: TILES.MUSHROOM_CAP });
      blocks.push({ x: x + 1, y: capY - 1, tile: TILES.MUSHROOM_CAP });
    }

    // Full cap when mature
    if (progress > 0.95) {
      blocks.push({ x: x - 2, y: capY - 1, tile: TILES.MUSHROOM_CAP });
      blocks.push({ x: x + 2, y: capY - 1, tile: TILES.MUSHROOM_CAP });
      blocks.push({ x, y: capY - 2, tile: TILES.MUSHROOM_CAP });
    }
  }

  return blocks;
}

function generateCactusStructure(x, y, progress, TILES) {
  const blocks = [];
  const maxHeight = 6;
  const currentHeight = Math.ceil(maxHeight * progress);

  // Main body (vertical column)
  for (let i = 0; i < currentHeight; i++) {
    blocks.push({ x, y: y - i, tile: TILES.CACTUS_BODY });
  }

  // Add left arm
  if (progress > 0.4 && currentHeight > 2) {
    const leftArmY = y - Math.floor(currentHeight * 0.5);
    blocks.push({ x: x - 1, y: leftArmY, tile: TILES.CACTUS_BODY });

    if (progress > 0.6) {
      blocks.push({ x: x - 1, y: leftArmY - 1, tile: TILES.CACTUS_BODY });
      blocks.push({ x: x - 1, y: leftArmY - 2, tile: TILES.CACTUS_BODY });
    }
  }

  // Add right arm
  if (progress > 0.5 && currentHeight > 3) {
    const rightArmY = y - Math.ceil(currentHeight * 0.6);
    blocks.push({ x: x + 1, y: rightArmY, tile: TILES.CACTUS_BODY });

    if (progress > 0.7) {
      blocks.push({ x: x + 1, y: rightArmY - 1, tile: TILES.CACTUS_BODY });
      blocks.push({ x: x + 1, y: rightArmY - 2, tile: TILES.CACTUS_BODY });
    }
  }

  // Flowers on top if fully mature
  if (progress > 0.95) {
    blocks.push({ x, y: y - currentHeight, tile: TILES.CACTUS_FLOWER });
    blocks.push({ x: x - 1, y: y - currentHeight, tile: TILES.CACTUS_FLOWER });
    blocks.push({ x: x + 1, y: y - currentHeight, tile: TILES.CACTUS_FLOWER });
  }

  return blocks;
}
