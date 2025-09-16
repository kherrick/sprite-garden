import { updateInventoryDisplay } from "./updateInventoryDisplay.mjs";

// Helper function to check if a tile position is part of a mature plant structure
function isMaturePlantPart(x, y, plantStructures) {
  for (const [key, structure] of Object.entries(plantStructures)) {
    if (structure.mature && structure.blocks) {
      const matchingBlock = structure.blocks.find(
        (block) => block.x === x && block.y === y,
      );

      if (matchingBlock) {
        return true;
      }
    }
  }

  return false;
}

export function handleBreakBlock(currentState, game, doc) {
  const {
    state,
    player,
    world,
    TILES,
    TILE_SIZE,
    WORLD_WIDTH,
    WORLD_HEIGHT,
    growthTimers,
    plantStructures,
  } = currentState;

  const playerTileX = Math.floor((player.x + player.width / 2) / TILE_SIZE);
  const playerTileY = Math.floor((player.y + player.height / 2) / TILE_SIZE);

  // Break in an area around the player - adjust pattern based on movement direction
  const breakRadius = 2;
  let blocksToBreak = [];

  // If player is moving horizontally, break in a horizontal line
  if (player.lastDirection !== 0) {
    // Horizontal breaking pattern
    for (let dx = -breakRadius; dx <= breakRadius; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const targetX = playerTileX + dx * (player.lastDirection > 0 ? 1 : 1);
        const targetY = playerTileY + dy;

        if (
          targetX < 0 ||
          targetX >= WORLD_WIDTH ||
          targetY < 0 ||
          targetY >= WORLD_HEIGHT
        ) {
          continue;
        }

        const tile = world[targetX][targetY];

        // Can break most blocks except bedrock, air, and lava
        // Also exclude mature plant parts (they should be harvested, not broken)
        if (
          tile &&
          tile !== TILES.AIR &&
          tile !== TILES.BEDROCK &&
          tile !== TILES.LAVA &&
          !isMaturePlantPart(targetX, targetY, game.state.plantStructures.get())
        ) {
          // Prioritize blocks in the direction player is facing
          const priority =
            Math.abs(dx) === 0 ? 1 : 2 - Math.abs(dx) / breakRadius;
          blocksToBreak.push({ x: targetX, y: targetY, tile: tile, priority });
        }
      }
    }
  } else {
    // Default circular breaking pattern when not moving
    for (let dx = -breakRadius; dx <= breakRadius; dx++) {
      for (let dy = -breakRadius; dy <= breakRadius; dy++) {
        const targetX = playerTileX + dx;
        const targetY = playerTileY + dy;

        if (
          targetX < 0 ||
          targetX >= WORLD_WIDTH ||
          targetY < 0 ||
          targetY >= WORLD_HEIGHT
        ) {
          continue;
        }

        const tile = world[targetX][targetY];

        // Can break most blocks except bedrock, air, and lava
        // Also exclude mature plant parts (they should be harvested, not broken)
        if (
          tile &&
          tile !== TILES.AIR &&
          tile !== TILES.BEDROCK &&
          tile !== TILES.LAVA &&
          !isMaturePlantPart(targetX, targetY, game.state.plantStructures.get())
        ) {
          blocksToBreak.push({
            x: targetX,
            y: targetY,
            tile: tile,
            priority: 1,
          });
        }
      }
    }
  }

  // Sort by priority if moving horizontally
  if (player.lastDirection !== 0) {
    blocksToBreak.sort((a, b) => a.priority - b.priority);
  }

  if (blocksToBreak.length > 0) {
    // Break multiple blocks at once
    const currentWorld = game.state.world.get();
    const currentTimers = game.state.growthTimers.get();
    const currentStructures = game.state.plantStructures.get();
    const updatedTimers = { ...currentTimers };
    const updatedStructures = { ...currentStructures };
    let inventoryUpdates = {};

    blocksToBreak.forEach((block) => {
      // Check if this is part of an immature plant structure (these can be broken)
      let isImmaturePlantPart = false;
      let plantKey = null;

      // Find if this block is part of any immature plant structure
      for (const [key, structure] of Object.entries(currentStructures)) {
        if (!structure.mature && structure.blocks) {
          for (const plantBlock of structure.blocks) {
            if (plantBlock.x === block.x && plantBlock.y === block.y) {
              isImmaturePlantPart = true;
              plantKey = key;
              break;
            }
          }
        }
        if (isImmaturePlantPart) break;
      }

      // If it's part of an immature plant, remove the entire plant
      if (isImmaturePlantPart && plantKey) {
        const structure = currentStructures[plantKey];
        if (structure.blocks) {
          structure.blocks.forEach((plantBlock) => {
            if (
              plantBlock.x >= 0 &&
              plantBlock.x < WORLD_WIDTH &&
              plantBlock.y >= 0 &&
              plantBlock.y < WORLD_HEIGHT
            ) {
              currentWorld[plantBlock.x][plantBlock.y] = TILES.AIR;
            }
          });
        }

        // Give small chance to get a seed back when breaking immature plants
        if (structure.seedType && Math.random() < 0.5) {
          inventoryUpdates[structure.seedType] =
            (inventoryUpdates[structure.seedType] || 0) + 1;
        }

        delete updatedStructures[plantKey];
        delete updatedTimers[plantKey];
      } else {
        // Regular block breaking
        currentWorld[block.x][block.y] = TILES.AIR;

        // Remove from growth timers if it was a crop
        delete updatedTimers[`${block.x},${block.y}`];

        // Give small chance to drop seeds from broken natural crops
        if (block.tile.crop && Math.random() < 0.3) {
          const cropToSeed = {
            [TILES.WHEAT.id]: "WHEAT",
            [TILES.CARROT.id]: "CARROT",
            [TILES.MUSHROOM.id]: "MUSHROOM",
            [TILES.CACTUS.id]: "CACTUS",
          };

          const seedType = cropToSeed[block.tile.id];
          if (seedType) {
            inventoryUpdates[seedType] = (inventoryUpdates[seedType] || 0) + 1;
          }
        }
      }
    });

    // Update world, timers, and structures
    game.state.world.set([...currentWorld]);
    game.state.growthTimers.set(updatedTimers);
    game.state.plantStructures.set(updatedStructures);

    // Update inventory if we gained any seeds
    if (Object.keys(inventoryUpdates).length > 0) {
      game.updateState("seedInventory", (inv) => {
        const updated = { ...inv };
        Object.entries(inventoryUpdates).forEach(([seedType, amount]) => {
          updated[seedType] += amount;
        });
        return updated;
      });
    }

    updateInventoryDisplay(game.state, doc);
  }
}
