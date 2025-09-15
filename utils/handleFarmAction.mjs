import { harvestCrop } from "./harvestCrop.mjs";
import { plantSeed } from "./plantSeed.mjs";

function harvestMaturePlant(currentState, structure, structureKey, game, doc) {
  const { world, TILES, WORLD_WIDTH, WORLD_HEIGHT } = currentState;

  // Clear all blocks in the plant structure
  const currentWorld = game.state.world.get();

  if (structure.blocks) {
    structure.blocks.forEach((block) => {
      if (
        block.x >= 0 &&
        block.x < WORLD_WIDTH &&
        block.y >= 0 &&
        block.y < WORLD_HEIGHT
      ) {
        currentWorld[block.x][block.y] = TILES.AIR;
      }
    });
  }

  // Give seeds when harvesting mature plant
  if (structure.seedType) {
    const seedsGained = 3 + Math.floor(Math.random() * 4); // 3-6 seeds
    game.updateState("seedInventory", (inv) => ({
      ...inv,
      [structure.seedType]: inv[structure.seedType] + seedsGained,
    }));

    console.log(
      `Harvested mature ${structure.seedType}, gained ${seedsGained} seeds`,
    );
  }

  // Update world state
  game.state.world.set([...currentWorld]);

  // Remove the plant structure and any associated timers
  const currentStructures = game.state.plantStructures.get();
  const currentTimers = game.state.growthTimers.get();

  const updatedStructures = { ...currentStructures };
  const updatedTimers = { ...currentTimers };

  delete updatedStructures[structureKey];
  delete updatedTimers[structureKey];

  game.state.plantStructures.set(updatedStructures);
  game.state.growthTimers.set(updatedTimers);

  // Update inventory display
  import("./updateInventoryDisplay.mjs").then(({ updateInventoryDisplay }) => {
    updateInventoryDisplay(game.state, doc);
  });
}

export function handleFarmAction(currentState, game, doc) {
  const { player, state, TILE_SIZE, TILES, WORLD_HEIGHT, WORLD_WIDTH, world } =
    currentState;

  const playerTileX = Math.floor((player.x + player.width / 2) / TILE_SIZE);
  const playerTileY = Math.floor((player.y + player.height) / TILE_SIZE);

  // Check tile in front of player (where they're facing)
  const targetX = playerTileX;
  const targetY = playerTileY;

  if (
    targetX < 0 ||
    targetX >= WORLD_WIDTH ||
    targetY < 0 ||
    targetY >= WORLD_HEIGHT
  ) {
    return;
  }

  const currentTile = world[targetX][targetY];

  // Check if this position is part of a mature plant structure
  const plantStructures = game.state.plantStructures.get();
  let harvestableStructure = null;
  let structureKey = null;

  // Look for mature plant structures that contain this tile
  for (const [key, structure] of Object.entries(plantStructures)) {
    if (structure.mature && structure.blocks) {
      // Check if any block in the structure matches our target position
      const matchingBlock = structure.blocks.find(
        (block) => block.x === targetX && block.y === targetY,
      );

      if (matchingBlock) {
        harvestableStructure = structure;
        structureKey = key;
        break;
      }
    }
  }

  // If we found a mature plant structure, harvest it
  if (harvestableStructure && structureKey) {
    harvestMaturePlant(
      currentState,
      harvestableStructure,
      structureKey,
      game,
      doc,
    );
  }
  // Check for simple crops (fallback for any remaining simple crop tiles)
  else if (currentTile && currentTile.crop) {
    harvestCrop(currentState, targetX, targetY, currentTile, game, doc);
  }
  // Plant seeds if the tile is empty and we have seeds selected
  else if (
    currentTile === TILES.AIR &&
    state.selectedSeedType &&
    state.seedInventory[state.selectedSeedType] > 0
  ) {
    plantSeed(
      currentState,
      targetX,
      targetY,
      state.selectedSeedType,
      game,
      doc,
    );
  }
}
