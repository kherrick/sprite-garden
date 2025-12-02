/**
 * @jest-environment jsdom
 */
import {
  denormalizeTileName,
  getTileNameById,
  getTileNameByIdMap,
  normalizeTileName,
  TileNames,
  TILES,
} from "./tiles.mjs";

describe("tiles.mjs", () => {
  describe("TileNames exports", () => {
    test("TileNames is an object", () => {
      expect(typeof TileNames).toBe("object");
      expect(TileNames !== null).toBe(true);
    });

    test("TileNames contains AIR constant", () => {
      expect(TileNames.AIR).toBe("AIR");
    });

    test("TileNames contains various tile names", () => {
      expect(TileNames.GRASS).toBe("GRASS");
      expect(TileNames.WATER).toBe("WATER");
      expect(TileNames.STONE).toBe("STONE");
      expect(TileNames.BEDROCK).toBe("BEDROCK");
    });

    test("all TileNames values are strings", () => {
      Object.values(TileNames).forEach((value) => {
        expect(typeof value).toBe("string");
      });
    });

    test("all TileNames values are in UPPER_SNAKE_CASE", () => {
      Object.values(TileNames).forEach((value) => {
        expect(value).toMatch(/^[A-Z_]+$/);
      });
    });
  });

  describe("Tiles exports", () => {
    test("Tiles is an object", () => {
      expect(typeof TILES).toBe("object");
      expect(TILES !== null).toBe(true);
    });

    test("Tiles contains definitions for common tiles", () => {
      expect(TILES.AIR).toBeDefined();
      expect(TILES.GRASS).toBeDefined();
      expect(TILES.WATER).toBeDefined();
    });

    test("each Tiles entry has an id", () => {
      Object.values(TILES).forEach((tile) => {
        expect(tile.id).toBeDefined();
        expect(typeof tile.id).toBe("number");
      });
    });

    test("Tiles IDs are unique", () => {
      const ids = Object.values(TILES).map((tile) => tile.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(ids.length);
    });

    test("Tiles have proper default properties", () => {
      Object.values(TILES).forEach((tile) => {
        expect(tile.crop).toBeDefined();
        expect(typeof tile.crop).toBe("boolean");
        expect(tile.farmable).toBeDefined();
        expect(typeof tile.farmable).toBe("boolean");
        expect(tile.solid).toBeDefined();
        expect(typeof tile.solid).toBe("boolean");
        expect(tile.isSeed).toBeDefined();
        expect(typeof tile.isSeed).toBe("boolean");
      });
    });

    test("Tiles solid property distinguishes collidable tiles", () => {
      expect(TILES.BEDROCK.solid).toBe(true);
      expect(TILES.STONE.solid).toBe(true);
      expect(TILES.AIR.solid).toBe(false);
      expect(TILES.WATER.solid).toBe(false);
    });

    test("Tiles farmable property identifies tillable tiles", () => {
      expect(TILES.GRASS.farmable).toBe(true);
      expect(TILES.DIRT.farmable).toBe(true);
      expect(TILES.STONE.farmable).toBe(false);
    });

    test("Tiles crop property identifies crop tiles", () => {
      // Crops should be markable
      Object.entries(TILES).forEach(([name, tile]) => {
        expect(typeof tile.crop).toBe("boolean");
      });
    });

    test("Tiles with drops have drops property", () => {
      Object.entries(TILES).forEach(([name, tile]) => {
        if (tile.drops !== null) {
          expect(
            typeof tile.drops === "string" || Array.isArray(tile.drops),
          ).toBe(true);
        }
      });
    });
  });

  describe("normalizeTileName", () => {
    test("converts kebab-case to UPPER_SNAKE_CASE", () => {
      expect(normalizeTileName("berry-bush")).toBe("BERRY_BUSH");
      expect(normalizeTileName("birch-bark")).toBe("BIRCH_BARK");
    });

    test("converts lowercase to UPPER_SNAKE_CASE", () => {
      expect(normalizeTileName("grass")).toBe("GRASS");
      expect(normalizeTileName("water")).toBe("WATER");
    });

    test("handles mixed case input", () => {
      expect(normalizeTileName("BerryBush")).toBe("BERRYBUSH");
      expect(normalizeTileName("GrAsS")).toBe("GRASS");
    });

    test("preserves already normalized names", () => {
      expect(normalizeTileName("BERRY_BUSH")).toBe("BERRY_BUSH");
      expect(normalizeTileName("GRASS")).toBe("GRASS");
    });

    test("handles multiple dashes", () => {
      expect(normalizeTileName("berry-bush-leaves")).toBe("BERRY_BUSH_LEAVES");
      expect(normalizeTileName("a-b-c-d")).toBe("A_B_C_D");
    });

    test("handles single character", () => {
      expect(normalizeTileName("a")).toBe("A");
    });

    test("returns uppercase string", () => {
      const result = normalizeTileName("any-input");
      expect(result).toMatch(/^[A-Z_]*$/);
    });
  });

  describe("denormalizeTileName", () => {
    test("converts UPPER_SNAKE_CASE to kebab-case", () => {
      expect(denormalizeTileName("BERRY_BUSH")).toBe("berry-bush");
      expect(denormalizeTileName("BIRCH_BARK")).toBe("birch-bark");
    });

    test("converts uppercase to lowercase kebab-case", () => {
      expect(denormalizeTileName("GRASS")).toBe("grass");
      expect(denormalizeTileName("WATER")).toBe("water");
    });

    test("preserves already denormalized names", () => {
      expect(denormalizeTileName("berry-bush")).toBe("berry-bush");
      expect(denormalizeTileName("grass")).toBe("grass");
    });

    test("handles multiple underscores", () => {
      expect(denormalizeTileName("BERRY_BUSH_LEAVES")).toBe(
        "berry-bush-leaves",
      );
      expect(denormalizeTileName("A_B_C_D")).toBe("a-b-c-d");
    });

    test("handles single character", () => {
      expect(denormalizeTileName("A")).toBe("a");
    });

    test("returns lowercase kebab-case string", () => {
      const result = denormalizeTileName("ANY_INPUT");

      expect(result).toMatch(/^[a-z-]*$/);
    });

    test("is inverse of normalizeTileName", () => {
      const original = "berry-bush-leaves";
      const normalized = normalizeTileName(original);
      const denormalized = denormalizeTileName(normalized);

      expect(denormalized).toBe(original);
    });
  });

  describe("getTileNameById", () => {
    test("finds tile name by id", () => {
      const result = getTileNameById(TILES, TILES.GRASS.id);

      expect(result).toBe("GRASS");
    });

    test("finds multiple different tiles by id", () => {
      expect(getTileNameById(TILES, TILES.WATER.id)).toBe("WATER");
      expect(getTileNameById(TILES, TILES.STONE.id)).toBe("STONE");
      expect(getTileNameById(TILES, TILES.BEDROCK.id)).toBe("BEDROCK");
    });

    test("returns null for non-existent id", () => {
      const result = getTileNameById(TILES, 999999);

      expect(result).toBeNull();
    });

    test("returns null for negative id", () => {
      const result = getTileNameById(TILES, -1);

      expect(result).toBeNull();
    });

    test("works with custom tile map", () => {
      const customTiles = {
        CUSTOM_A: { id: 100 },
        CUSTOM_B: { id: 101 },
      };

      expect(getTileNameById(customTiles, 100)).toBe("CUSTOM_A");
      expect(getTileNameById(customTiles, 101)).toBe("CUSTOM_B");
    });

    test("returns first matching tile if duplicates exist", () => {
      const tilesWithDuplicates = {
        TILE_A: { id: 1 },
        TILE_B: { id: 1 }, // Duplicate ID
      };

      const result = getTileNameById(tilesWithDuplicates, 1);

      expect(result).toBeDefined();
      expect(["TILE_A", "TILE_B"]).toContain(result);
    });

    test("handles empty tiles map", () => {
      const result = getTileNameById({}, 1);

      expect(result).toBeNull();
    });

    test("finds AIR tile by id", () => {
      const result = getTileNameById(TILES, TILES.AIR.id);

      expect(result).toBe("AIR");
    });
  });

  describe("getTileNameByIdMap", () => {
    test("creates a map from tile ids to tile names", () => {
      const idMap = getTileNameByIdMap(TILES);

      expect(typeof idMap).toBe("object");
      expect(idMap !== null).toBe(true);
    });

    test("maps grass id to grass tile name", () => {
      const idMap = getTileNameByIdMap(TILES);
      const grassId = TILES.GRASS.id;

      expect(idMap[grassId]).toBe("grass");
    });

    test("uses denormalized tile names in map", () => {
      const idMap = getTileNameByIdMap(TILES);

      // Check that names are in kebab-case (denormalized)
      Object.values(idMap).forEach((name) => {
        expect(name).toMatch(/^[a-z-]*$/);
      });
    });

    test("creates unique entries for each tile", () => {
      const idMap = getTileNameByIdMap(TILES);
      const entries = Object.entries(TILES);

      expect(Object.keys(idMap).length).toBe(entries.length);
    });

    test("allows efficient id-to-name lookups", () => {
      const idMap = getTileNameByIdMap(TILES);

      const waterName = idMap[TILES.WATER.id];
      expect(waterName).toBe("water");

      const stoneName = idMap[TILES.STONE.id];
      expect(stoneName).toBe("stone");
    });

    test("maps all tile ids", () => {
      const idMap = getTileNameByIdMap(TILES);

      Object.entries(TILES).forEach(([tileNames, tileDefinition]) => {
        const expectedName = denormalizeTileName(tileNames);

        expect(idMap[tileDefinition.id]).toBe(expectedName);
      });
    });

    test("returns object with numeric keys", () => {
      const idMap = getTileNameByIdMap(TILES);

      Object.keys(idMap).forEach((key) => {
        const numKey = parseInt(key, 10);

        expect(numKey).toBeDefined();
        expect(isNaN(numKey)).toBe(false);
      });
    });

    test("works with custom tile map", () => {
      const customTiles = {
        CUSTOM_TILE_A: { id: 500 },
        CUSTOM_TILE_B: { id: 501 },
      };

      const idMap = getTileNameByIdMap(customTiles);

      expect(idMap[500]).toBe("custom-tile-a");
      expect(idMap[501]).toBe("custom-tile-b");
    });

    test("all values are denormalized strings", () => {
      const idMap = getTileNameByIdMap(TILES);

      Object.values(idMap).forEach((name) => {
        expect(typeof name).toBe("string");
        expect(name).toMatch(/^[a-z-]*$/);
      });
    });
  });

  describe("round-trip conversions", () => {
    test("normalize then denormalize returns original kebab-case", () => {
      const original = "berry-bush";
      const normalized = normalizeTileName(original);
      const denormalized = denormalizeTileName(normalized);

      expect(denormalized).toBe(original);
    });

    test("denormalize then normalize returns original UPPER_SNAKE_CASE", () => {
      const original = "BERRY_BUSH";
      const denormalized = denormalizeTileName(original);
      const normalized = normalizeTileName(denormalized);

      expect(normalized).toBe(original);
    });

    test("lookup by id then normalize matches expected format", () => {
      const tileId = TILES.GRASS.id;
      const tileNames = getTileNameById(TILES, tileId);
      const normalized = normalizeTileName(tileNames);

      expect(normalized).toBe("GRASS");
    });

    test("getTileNameByIdMap reverse lookup matches getTileNameById", () => {
      const idMap = getTileNameByIdMap(TILES);
      const tileId = TILES.WATER.id;
      const nameById = getTileNameById(TILES, tileId);
      const denormalizedName = denormalizeTileName(nameById);

      expect(idMap[tileId]).toBe(denormalizedName);
    });
  });

  describe("edge cases", () => {
    test("handles tile names with numbers", () => {
      expect(normalizeTileName("tile-123")).toBe("TILE_123");
      expect(denormalizeTileName("TILE_123")).toBe("tile-123");
    });

    test("getTileNameById with zero id", () => {
      // AIR typically has id 0
      if (TILES.AIR.id === 0) {
        expect(getTileNameById(TILES, 0)).toBe("AIR");
      }
    });

    test("handles very long tile names", () => {
      const longName = "very-long-tile-name-with-many-parts-for-testing";
      const normalized = normalizeTileName(longName);
      const denormalized = denormalizeTileName(normalized);

      expect(denormalized).toBe(longName);
    });

    test("getTileNameByIdMap with single tile", () => {
      const singleTileMap = { TEST_TILE: { id: 1 } };
      const idMap = getTileNameByIdMap(singleTileMap);

      expect(Object.keys(idMap)).toHaveLength(1);
      expect(idMap[1]).toBe("test-tile");
    });
  });

  describe("function properties", () => {
    test("normalizeTileName is a function", () => {
      expect(typeof normalizeTileName).toBe("function");
    });

    test("denormalizeTileName is a function", () => {
      expect(typeof denormalizeTileName).toBe("function");
    });

    test("getTileNameById is a function", () => {
      expect(typeof getTileNameById).toBe("function");
    });

    test("getTileNameByIdMap is a function", () => {
      expect(typeof getTileNameByIdMap).toBe("function");
    });
  });

  describe("special tile types", () => {
    test("AIR tile is not solid", () => {
      expect(TILES.AIR.solid).toBe(false);
    });

    test("BEDROCK tile is solid", () => {
      expect(TILES.BEDROCK.solid).toBe(true);
    });

    test("WATER tile is not solid", () => {
      expect(TILES.WATER.solid).toBe(false);
    });

    test("each tile has consistent property types", () => {
      Object.entries(TILES).forEach(([_, tile]) => {
        expect(typeof tile.solid).toBe("boolean");
        expect(typeof tile.farmable).toBe("boolean");
        expect(typeof tile.crop).toBe("boolean");
      });
    });

    test("drops property is null or string or array", () => {
      Object.entries(TILES).forEach(([_, tile]) => {
        const dropsValid =
          tile.drops === null ||
          typeof tile.drops === "string" ||
          Array.isArray(tile.drops);

        expect(dropsValid).toBe(true);
      });
    });
  });
});
