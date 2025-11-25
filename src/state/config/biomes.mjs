import { TILES } from "./tiles.mjs";

const biomeFields = {
  crops: [],
  surfaceTile: null,
  subTile: null,
};

// Biome definitions Will be set after TILES is defined
const BIOMES = {
  FOREST: { trees: true, name: "Forest", ...biomeFields },
  DESERT: { trees: false, name: "Desert", ...biomeFields },
  TUNDRA: { trees: false, name: "Tundra", ...biomeFields },
  SWAMP: { trees: true, name: "Swamp", ...biomeFields },
};

// Initialize BIOMES after TILES IS defined
BIOMES.FOREST.surfaceTile = TILES.GRASS;
BIOMES.FOREST.subTile = TILES.DIRT;
BIOMES.FOREST.crops = [
  TILES.BERRY_BUSH,
  TILES.BIRCH,
  TILES.CARROT,
  TILES.FERN,
  TILES.LAVENDER,
  TILES.PINE_TREE,
  TILES.PUMPKIN,
  TILES.ROSE,
  TILES.TULIP,
  TILES.WHEAT,
];

BIOMES.DESERT.surfaceTile = TILES.SAND;
BIOMES.DESERT.subTile = TILES.SAND;
BIOMES.DESERT.crops = [TILES.AGAVE, TILES.CACTUS, TILES.SUNFLOWER];

BIOMES.TUNDRA.surfaceTile = TILES.SNOW;
BIOMES.TUNDRA.subTile = TILES.ICE;
BIOMES.TUNDRA.crops = [TILES.BIRCH, TILES.FERN, TILES.PINE_TREE];

BIOMES.SWAMP.surfaceTile = TILES.CLAY;
BIOMES.SWAMP.subTile = TILES.CLAY;
BIOMES.SWAMP.crops = [
  TILES.BAMBOO,
  TILES.CORN,
  TILES.KELP,
  TILES.LOTUS,
  TILES.MUSHROOM,
  TILES.WILLOW_TREE,
];

export { BIOMES };
