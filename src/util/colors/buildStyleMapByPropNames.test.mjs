/**
 * @jest-environment jsdom
 */
import { jest } from "@jest/globals";

import { buildStyleMapByPropNames } from "./buildStyleMapByPropNames.mjs";

describe("buildStyleMapByPropNames", () => {
  let mockStyle;

  beforeEach(() => {
    mockStyle = {
      getPropertyValue: jest.fn(),
    };
  });

  describe("basic functionality", () => {
    test("returns an object mapping property names to their CSS values", () => {
      mockStyle.getPropertyValue.mockImplementation((prop) => {
        const values = {
          "--sg-color-grass": "#228B22",
          "--sg-color-water": "#0047AB",
        };

        return values[prop] || "";
      });

      const result = buildStyleMapByPropNames(mockStyle, [
        "--sg-color-grass",
        "--sg-color-water",
      ]);

      expect(result).toEqual({
        "--sg-color-grass": "#228B22",
        "--sg-color-water": "#0047AB",
      });
    });

    test("calls getPropertyValue for each property name", () => {
      mockStyle.getPropertyValue.mockReturnValue("#FF0000");

      buildStyleMapByPropNames(mockStyle, [
        "--sg-color-red",
        "--sg-color-green",
      ]);

      expect(mockStyle.getPropertyValue).toHaveBeenCalledTimes(2);
      expect(mockStyle.getPropertyValue).toHaveBeenCalledWith("--sg-color-red");
      expect(mockStyle.getPropertyValue).toHaveBeenCalledWith(
        "--sg-color-green",
      );
    });
  });

  describe("property name handling", () => {
    test("handles property names that already start with --sg-color-", () => {
      mockStyle.getPropertyValue.mockReturnValue("#FF0000");

      buildStyleMapByPropNames(mockStyle, ["--sg-color-grass"]);

      expect(mockStyle.getPropertyValue).toHaveBeenCalledWith(
        "--sg-color-grass",
      );
    });

    test("appends -color suffix to property names that don't start with --sg-color-", () => {
      mockStyle.getPropertyValue.mockReturnValue("#00FF00");

      buildStyleMapByPropNames(mockStyle, ["grass"]);

      expect(mockStyle.getPropertyValue).toHaveBeenCalledWith("grass-color");
    });

    test("handles mixed property name formats", () => {
      mockStyle.getPropertyValue.mockImplementation((prop) => {
        const values = {
          "--sg-color-grass": "#228B22",
          "water-color": "#0047AB",
        };

        return values[prop] || "";
      });

      const result = buildStyleMapByPropNames(mockStyle, [
        "--sg-color-grass",
        "water",
      ]);

      expect(result).toEqual({
        "--sg-color-grass": "#228B22",
        "water-color": "#0047AB",
      });
    });
  });

  describe("empty and edge cases", () => {
    test("returns undefined when given an empty array", () => {
      const result = buildStyleMapByPropNames(mockStyle, []);

      expect(result).toBeUndefined();
      expect(mockStyle.getPropertyValue).not.toHaveBeenCalled();
    });

    test("handles single property in array", () => {
      mockStyle.getPropertyValue.mockReturnValue("#FF0000");

      const result = buildStyleMapByPropNames(mockStyle, ["--sg-color-red"]);

      expect(result).toEqual({
        "--sg-color-red": "#FF0000",
      });
    });

    test("returns object with single property", () => {
      mockStyle.getPropertyValue.mockReturnValue("#ABC123");

      const result = buildStyleMapByPropNames(mockStyle, ["tile"]);

      expect(result).toEqual({
        "tile-color": "#ABC123",
      });

      expect(mockStyle.getPropertyValue).toHaveBeenCalledWith("tile-color");
    });
  });

  describe("property value handling", () => {
    test("preserves empty string values from getPropertyValue", () => {
      mockStyle.getPropertyValue.mockReturnValue("");

      const result = buildStyleMapByPropNames(mockStyle, ["--sg-color-none"]);

      expect(result).toEqual({
        "--sg-color-none": "",
      });
    });

    test("preserves whitespace in property values", () => {
      mockStyle.getPropertyValue.mockReturnValue(" #FF0000 ");

      const result = buildStyleMapByPropNames(mockStyle, ["--sg-color-red"]);

      expect(result).toEqual({
        "--sg-color-red": " #FF0000 ",
      });
    });

    test("handles various color formats", () => {
      mockStyle.getPropertyValue.mockImplementation((prop) => {
        const values = {
          "--sg-color-hex": "#FF0000",
          "--sg-color-rgb": "rgb(255, 0, 0)",
          "--sg-color-hsl": "hsl(0, 100%, 50%)",
          "--sg-color-name": "red",
        };

        return values[prop] || "";
      });

      const result = buildStyleMapByPropNames(mockStyle, [
        "--sg-color-hex",
        "--sg-color-rgb",
        "--sg-color-hsl",
        "--sg-color-name",
      ]);

      expect(result).toEqual({
        "--sg-color-hex": "#FF0000",
        "--sg-color-rgb": "rgb(255, 0, 0)",
        "--sg-color-hsl": "hsl(0, 100%, 50%)",
        "--sg-color-name": "red",
      });
    });
  });

  describe("multiple properties", () => {
    test("correctly processes multiple properties", () => {
      mockStyle.getPropertyValue.mockImplementation((prop) => {
        const values = {
          "--sg-color-grass": "#228B22",
          "--sg-color-water": "#0047AB",
          "--sg-color-sand": "#C2B280",
          "--sg-color-stone": "#808080",
        };

        return values[prop] || "";
      });

      const result = buildStyleMapByPropNames(mockStyle, [
        "--sg-color-grass",
        "--sg-color-water",
        "--sg-color-sand",
        "--sg-color-stone",
      ]);

      expect(result).toEqual({
        "--sg-color-grass": "#228B22",
        "--sg-color-water": "#0047AB",
        "--sg-color-sand": "#C2B280",
        "--sg-color-stone": "#808080",
      });

      expect(mockStyle.getPropertyValue).toHaveBeenCalledTimes(4);
    });

    test("maintains order of properties in result object", () => {
      mockStyle.getPropertyValue.mockReturnValue("#FF0000");

      const result = buildStyleMapByPropNames(mockStyle, [
        "--sg-color-first",
        "--sg-color-second",
        "--sg-color-third",
      ]);

      const keys = Object.keys(result);

      expect(keys).toEqual([
        "--sg-color-first",
        "--sg-color-second",
        "--sg-color-third",
      ]);
    });
  });

  describe("property name edge cases", () => {
    test("handles property names with multiple dashes", () => {
      mockStyle.getPropertyValue.mockReturnValue("#FF0000");

      buildStyleMapByPropNames(mockStyle, ["--multi-part-name"]);

      expect(mockStyle.getPropertyValue).toHaveBeenCalledWith(
        "--multi-part-name-color",
      );
    });

    test("handles property names with numbers", () => {
      mockStyle.getPropertyValue.mockReturnValue("#FF0000");

      const result = buildStyleMapByPropNames(mockStyle, ["color123", "tile2"]);

      expect(mockStyle.getPropertyValue).toHaveBeenCalledWith("color123-color");
      expect(mockStyle.getPropertyValue).toHaveBeenCalledWith("tile2-color");
      expect(Object.keys(result)).toContain("color123-color");
      expect(Object.keys(result)).toContain("tile2-color");
    });

    test("handles very long property names", () => {
      const longName =
        "--sg-color-this-is-a-very-long-property-name-for-testing";

      mockStyle.getPropertyValue.mockReturnValue("#FF0000");

      const result = buildStyleMapByPropNames(mockStyle, [longName]);

      expect(mockStyle.getPropertyValue).toHaveBeenCalledWith(longName);
      expect(result[longName]).toBe("#FF0000");
    });
  });

  describe("function exports and type handling", () => {
    test("function is defined and callable", () => {
      expect(typeof buildStyleMapByPropNames).toBe("function");
    });

    test("returns an object when properties are provided", () => {
      mockStyle.getPropertyValue.mockReturnValue("#FF0000");

      const result = buildStyleMapByPropNames(mockStyle, ["--sg-color-red"]);

      expect(typeof result).toBe("object");
      expect(result !== null).toBe(true);
    });

    test("returned object contains only specified properties", () => {
      mockStyle.getPropertyValue.mockReturnValue("#FF0000");

      const result = buildStyleMapByPropNames(mockStyle, [
        "--sg-color-red",
        "--sg-color-green",
      ]);

      expect(Object.keys(result)).toHaveLength(2);
    });
  });

  describe("CSS variable resolution", () => {
    test("correctly retrieves CSS variable values from CSSStyleDeclaration", () => {
      const mockDeclaration = {
        getPropertyValue(prop) {
          const vars = {
            "--sg-color-primary": "rgb(255, 0, 0)",
            "--sg-color-secondary": "rgb(0, 255, 0)",
          };

          return vars[prop] || "";
        },
      };

      const result = buildStyleMapByPropNames(mockDeclaration, [
        "--sg-color-primary",
        "--sg-color-secondary",
      ]);

      expect(result["--sg-color-primary"]).toBe("rgb(255, 0, 0)");
      expect(result["--sg-color-secondary"]).toBe("rgb(0, 255, 0)");
    });

    test("uses getPropertyValue for CSS custom property lookup", () => {
      const getPropertyValueSpy = jest.fn().mockReturnValue("#FF0000");
      const mockDeclaration = {
        getPropertyValue: getPropertyValueSpy,
      };

      buildStyleMapByPropNames(mockDeclaration, ["--sg-color-red"]);

      expect(getPropertyValueSpy).toHaveBeenCalledWith("--sg-color-red");
    });
  });

  describe("integration scenarios", () => {
    test("handles real-world tile color mapping scenario", () => {
      mockStyle.getPropertyValue.mockImplementation((prop) => {
        const tileColors = {
          "--sg-color-grass": "#228B22",
          "--sg-color-water": "#0047AB",
          "--sg-color-sand": "#C2B280",
          "--sg-color-stone": "#808080",
          "--sg-color-tree": "#8B4513",
          "--sg-color-lava": "#FF4500",
        };

        return tileColors[prop] || "";
      });

      const tileNames = [
        "--sg-color-grass",
        "--sg-color-water",
        "--sg-color-sand",
        "--sg-color-stone",
        "--sg-color-tree",
        "--sg-color-lava",
      ];

      const result = buildStyleMapByPropNames(mockStyle, tileNames);

      expect(Object.keys(result)).toHaveLength(6);
      expect(result["--sg-color-grass"]).toBe("#228B22");
      expect(result["--sg-color-lava"]).toBe("#FF4500");
    });

    test("handles partial CSS property names with suffix transformation", () => {
      mockStyle.getPropertyValue.mockImplementation((prop) => {
        const colors = {
          "grass-color": "#228B22",
          "water-color": "#0047AB",
        };

        return colors[prop] || "";
      });

      const result = buildStyleMapByPropNames(mockStyle, ["grass", "water"]);

      expect(result["grass-color"]).toBe("#228B22");
      expect(result["water-color"]).toBe("#0047AB");
    });

    test("handles mixed tile and color property names", () => {
      mockStyle.getPropertyValue.mockImplementation((prop) => {
        const colors = {
          "--sg-color-primary": "#FF0000",
          "secondary-color": "#00FF00",
          "--sg-color-tertiary": "#0000FF",
        };

        return colors[prop] || "";
      });

      const result = buildStyleMapByPropNames(mockStyle, [
        "--sg-color-primary",
        "secondary",
        "--sg-color-tertiary",
      ]);

      expect(result["--sg-color-primary"]).toBe("#FF0000");
      expect(result["secondary-color"]).toBe("#00FF00");
      expect(result["--sg-color-tertiary"]).toBe("#0000FF");
    });
  });
});
