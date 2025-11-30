/**
 * @jest-environment jsdom
 */
import { jest } from "@jest/globals";

import { getCustomProperties } from "./getCustomProperties.mjs";
import { colors } from "../../state/config/colors.mjs";

describe("getCustomProperties", () => {
  let mockHost;
  let mockShadow;
  let mockComputedStyle;
  let mockWindow;

  beforeEach(() => {
    mockHost = document.createElement("div");
    mockShadow = {
      host: mockHost,
    };

    mockComputedStyle = {
      getPropertyValue: jest.fn(),
    };

    mockWindow = {
      getComputedStyle: jest.fn(() => mockComputedStyle),
    };
  });

  describe("basic functionality", () => {
    test("calls getComputedStyle with shadow host", () => {
      mockComputedStyle.getPropertyValue.mockReturnValue("#FF0000");

      getCustomProperties(mockWindow, mockShadow);

      expect(mockWindow.getComputedStyle).toHaveBeenCalledWith(mockShadow.host);
    });

    test("returns an object", () => {
      mockComputedStyle.getPropertyValue.mockReturnValue("#FF0000");

      const result = getCustomProperties(mockWindow, mockShadow);

      expect(typeof result).toBe("object");
      expect(result !== null).toBe(true);
    });

    test("returns a combined map with all color categories", () => {
      mockComputedStyle.getPropertyValue.mockReturnValue("#FF0000");

      const result = getCustomProperties(mockWindow, mockShadow);

      // Should have properties from all three categories
      expect(Object.keys(result).length).toBeGreaterThan(0);
    });
  });

  describe("color category handling", () => {
    test("retrieves color category properties", () => {
      mockComputedStyle.getPropertyValue.mockImplementation((prop) => {
        if (prop === "--sg-color-amber-500") {
          return "#f39c12";
        }

        if (prop === "--sg-color-black") {
          return "#000000";
        }

        return "";
      });

      const result = getCustomProperties(mockWindow, mockShadow);

      // Should have called getPropertyValue for color properties
      expect(mockComputedStyle.getPropertyValue).toHaveBeenCalledWith(
        "--sg-color-amber-500",
      );
    });

    test("includes all color keys from colors.color", () => {
      const colorKeys = Object.keys(colors.color);
      mockComputedStyle.getPropertyValue.mockImplementation(() => {
        // Return a dummy value for all properties
        return "#FF0000";
      });

      const result = getCustomProperties(mockWindow, mockShadow);

      // Verify getPropertyValue was called for each color key
      colorKeys.forEach((key) => {
        expect(mockComputedStyle.getPropertyValue).toHaveBeenCalledWith(
          `--sg-color-${key}`,
        );
      });
    });
  });

  describe("tile category handling", () => {
    test("retrieves tile category properties", () => {
      mockComputedStyle.getPropertyValue.mockImplementation((prop) => {
        if (prop === "--sg-tile-grass-color") {
          return "#228B22";
        }

        return "";
      });

      getCustomProperties(mockWindow, mockShadow);

      // Should have called getPropertyValue for tile properties (with -color suffix added)
      expect(mockComputedStyle.getPropertyValue).toHaveBeenCalledWith(
        "--sg-tile-grass-color",
      );
    });

    test("includes all tile keys from colors.tile", () => {
      const tileKeys = Object.keys(colors.tile);
      mockComputedStyle.getPropertyValue.mockImplementation(() => {
        return "#228B22";
      });

      getCustomProperties(mockWindow, mockShadow);

      // Verify getPropertyValue was called for each tile key (with -color suffix added)
      tileKeys.forEach((key) => {
        expect(mockComputedStyle.getPropertyValue).toHaveBeenCalledWith(
          `--sg-tile-${key}-color`,
        );
      });
    });
  });

  describe("ui category handling", () => {
    test("retrieves ui category properties", () => {
      mockComputedStyle.getPropertyValue.mockImplementation((prop) => {
        if (prop === "--sg-ui-touch-btn-background-color") {
          return "var(--sg-color-black-alpha-60)";
        }

        return "";
      });

      getCustomProperties(mockWindow, mockShadow);

      // Should have called getPropertyValue for ui properties (with -color suffix added)
      expect(mockComputedStyle.getPropertyValue).toHaveBeenCalledWith(
        "--sg-ui-touch-btn-background-color",
      );
    });

    test("includes all ui keys from colors.ui", () => {
      const uiKeys = Object.keys(colors.ui);
      mockComputedStyle.getPropertyValue.mockImplementation(() => {
        return "white";
      });

      getCustomProperties(mockWindow, mockShadow);

      // Verify getPropertyValue was called for each ui key (with -color suffix added)
      uiKeys.forEach((key) => {
        expect(mockComputedStyle.getPropertyValue).toHaveBeenCalledWith(
          `--sg-ui-${key}-color`,
        );
      });
    });
  });

  describe("property value retrieval", () => {
    test("correctly maps color property names to values", () => {
      mockComputedStyle.getPropertyValue.mockImplementation((prop) => {
        const values = {
          "--sg-color-amber-500": "#f39c12",
          "--sg-color-black": "#000000",
          "--sg-color-white": "#ffffff",
        };

        return values[prop] || "";
      });

      const result = getCustomProperties(mockWindow, mockShadow);

      expect(result["--sg-color-amber-500"]).toBe("#f39c12");
      expect(result["--sg-color-black"]).toBe("#000000");
      expect(result["--sg-color-white"]).toBe("#ffffff");
    });

    test("correctly maps tile property names to values", () => {
      mockComputedStyle.getPropertyValue.mockImplementation((prop) => {
        const values = {
          "--sg-tile-grass-color": "var(--sg-color-forest-green)",
          "--sg-tile-water-color": "var(--sg-color-blue-500)",
        };

        return values[prop] || "";
      });

      const result = getCustomProperties(mockWindow, mockShadow);

      expect(result["--sg-tile-grass-color"]).toBe(
        "var(--sg-color-forest-green)",
      );
      expect(result["--sg-tile-water-color"]).toBe("var(--sg-color-blue-500)");
    });

    test("correctly maps ui property names to values", () => {
      mockComputedStyle.getPropertyValue.mockImplementation((prop) => {
        const values = {
          "--sg-ui-touch-btn-color": "var(--sg-color-white)",
          "--sg-ui-touch-btn-background-color":
            "var(--sg-color-black-alpha-60)",
        };

        return values[prop] || "";
      });

      const result = getCustomProperties(mockWindow, mockShadow);

      expect(result["--sg-ui-touch-btn-color"]).toBe("var(--sg-color-white)");
      expect(result["--sg-ui-touch-btn-background-color"]).toBe(
        "var(--sg-color-black-alpha-60)",
      );
    });
  });

  describe("combined result", () => {
    test("merges all three color categories into single object", () => {
      mockComputedStyle.getPropertyValue.mockImplementation((prop) => {
        if (prop.includes("--sg-color-")) {
          return "#FF0000";
        }

        if (prop.includes("--sg-tile-")) {
          return "#00FF00";
        }

        if (prop.includes("--sg-ui-")) {
          return "#0000FF";
        }

        return "";
      });

      const result = getCustomProperties(mockWindow, mockShadow);

      // Result should contain properties from all categories
      const hasColorProps = Object.keys(result).some((key) =>
        key.startsWith("--sg-color-"),
      );
      const hasTileProps = Object.keys(result).some((key) =>
        key.startsWith("--sg-tile-"),
      );
      const hasUiProps = Object.keys(result).some((key) =>
        key.startsWith("--sg-ui-"),
      );

      expect(hasColorProps).toBe(true);
      expect(hasTileProps).toBe(true);
      expect(hasUiProps).toBe(true);
    });

    test("result object contains expected number of properties", () => {
      mockComputedStyle.getPropertyValue.mockReturnValue("#FF0000");

      const result = getCustomProperties(mockWindow, mockShadow);

      const totalKeys =
        Object.keys(colors.color).length +
        Object.keys(colors.tile).length +
        Object.keys(colors.ui).length;

      expect(Object.keys(result).length).toBe(totalKeys);
    });

    test("all properties in result are retrievable", () => {
      mockComputedStyle.getPropertyValue.mockReturnValue("#FF0000");

      const result = getCustomProperties(mockWindow, mockShadow);

      Object.keys(result).forEach((key) => {
        expect(result[key]).toBeDefined();
        expect(typeof result[key]).toBe("string");
      });
    });
  });

  describe("edge cases", () => {
    test("handles empty property values", () => {
      mockComputedStyle.getPropertyValue.mockReturnValue("");

      const result = getCustomProperties(mockWindow, mockShadow);

      // Should not throw and return object
      expect(typeof result).toBe("object");
      expect(result !== null).toBe(true);
    });

    test("handles whitespace in property values", () => {
      mockComputedStyle.getPropertyValue.mockReturnValue("  #FF0000  ");

      const result = getCustomProperties(mockWindow, mockShadow);

      // Should preserve whitespace
      const firstColorValue = Object.values(result)[0];
      expect(firstColorValue).toBe("  #FF0000  ");
    });

    test("handles various CSS value formats", () => {
      mockComputedStyle.getPropertyValue.mockImplementation((prop) => {
        if (prop.includes("color")) {
          return "#FF0000";
        }

        if (prop.includes("tile")) return "rgb(255, 0, 0)";
        if (prop.includes("ui")) return "var(--some-variable)";
        return "";
      });

      const result = getCustomProperties(mockWindow, mockShadow);

      // Should handle all formats
      expect(Object.keys(result).length).toBeGreaterThan(0);
    });
  });

  describe("function properties", () => {
    test("function is defined and callable", () => {
      expect(typeof getCustomProperties).toBe("function");
    });

    test("function accepts two parameters", () => {
      mockComputedStyle.getPropertyValue.mockReturnValue("#FF0000");

      // Should not throw
      expect(() => getCustomProperties(mockWindow, mockShadow)).not.toThrow();
    });

    test("function returns CombinedColorMap object", () => {
      mockComputedStyle.getPropertyValue.mockReturnValue("#FF0000");

      const result = getCustomProperties(mockWindow, mockShadow);

      expect(result).toBeDefined();
      expect(typeof result).toBe("object");
      expect(!Array.isArray(result)).toBe(true);
    });
  });

  describe("integration scenarios", () => {
    test("retrieves all color properties and returns combined map", () => {
      const colorMap = {
        "--sg-color-amber-500": "#f39c12",
        "--sg-color-black": "#000000",
      };
      const tileMap = {
        "--sg-tile-grass-color": "#228B22",
        "--sg-tile-water-color": "#0047AB",
      };
      const uiMap = {
        "--sg-ui-touch-btn-color": "white",
      };

      mockComputedStyle.getPropertyValue.mockImplementation((prop) => {
        return colorMap[prop] || tileMap[prop] || uiMap[prop] || "";
      });

      const result = getCustomProperties(mockWindow, mockShadow);

      expect(result["--sg-color-amber-500"]).toBe("#f39c12");
      expect(result["--sg-tile-grass-color"]).toBe("#228B22");
      expect(result["--sg-ui-touch-btn-color"]).toBe("white");
    });

    test("handles real getComputedStyle from window object", () => {
      const realWindow = {
        getComputedStyle: (element) => {
          return {
            getPropertyValue: jest.fn((prop) => {
              if (prop === "--sg-color-amber-500") return "#f39c12";
              return "";
            }),
          };
        },
      };

      const result = getCustomProperties(realWindow, mockShadow);

      expect(result).toBeDefined();
      expect(typeof result).toBe("object");
    });

    test("processes full color configuration", () => {
      const getPropertyValueSpy = jest.fn((prop) => {
        // Return consistent values based on property category
        if (prop.startsWith("--sg-color-")) {
          return "#FF0000";
        }

        if (prop.startsWith("--sg-tile-")) {
          return "#00FF00";
        }

        if (prop.startsWith("--sg-ui-")) {
          return "#0000FF";
        }

        return "";
      });

      mockComputedStyle.getPropertyValue = getPropertyValueSpy;

      const result = getCustomProperties(mockWindow, mockShadow);

      // Verify all categories are represented
      const callsByCategory = {
        color: getPropertyValueSpy.mock.calls.filter((call) =>
          call[0].startsWith("--sg-color-"),
        ).length,
        tile: getPropertyValueSpy.mock.calls.filter((call) =>
          call[0].startsWith("--sg-tile-"),
        ).length,
        ui: getPropertyValueSpy.mock.calls.filter((call) =>
          call[0].startsWith("--sg-ui-"),
        ).length,
      };

      expect(callsByCategory.color).toBeGreaterThan(0);
      expect(callsByCategory.tile).toBeGreaterThan(0);
      expect(callsByCategory.ui).toBeGreaterThan(0);
    });
  });

  describe("shadow DOM interaction", () => {
    test("accesses shadow root host element", () => {
      mockComputedStyle.getPropertyValue.mockReturnValue("#FF0000");

      getCustomProperties(mockWindow, mockShadow);

      expect(mockWindow.getComputedStyle).toHaveBeenCalledWith(mockShadow.host);
    });

    test("works with different shadow root hosts", () => {
      mockComputedStyle.getPropertyValue.mockReturnValue("#FF0000");

      const host1 = document.createElement("div");
      const shadow1 = { host: host1 };

      const host2 = document.createElement("section");
      const shadow2 = { host: host2 };

      getCustomProperties(mockWindow, shadow1);
      getCustomProperties(mockWindow, shadow2);

      expect(mockWindow.getComputedStyle).toHaveBeenCalledWith(host1);
      expect(mockWindow.getComputedStyle).toHaveBeenCalledWith(host2);
    });
  });
});
