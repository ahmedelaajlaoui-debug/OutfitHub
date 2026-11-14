import { describe, expect, it } from "vitest";
import ar from "./dictionaries/ar";
import fr from "./dictionaries/fr";

type Tree = { [key: string]: string | Tree };

function flatten(tree: Tree, prefix = ""): Record<string, string> {
  return Object.entries(tree).reduce<Record<string, string>>((acc, [key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof value === "string" ? { ...acc, [path]: value } : { ...acc, ...flatten(value, path) };
  }, {});
}

const placeholders = (value: string) => (value.match(/\{\w+\}/g) ?? []).sort();

describe("dictionaries", () => {
  const frFlat = flatten(fr as Tree);
  const arFlat = flatten(ar as Tree);

  it("have exactly the same keys", () => {
    expect(Object.keys(arFlat).sort()).toEqual(Object.keys(frFlat).sort());
  });

  it("have no empty translations", () => {
    for (const [key, value] of Object.entries({ ...frFlat, ...arFlat })) {
      expect(value.trim(), key).not.toBe("");
    }
  });

  it("keep the same interpolation placeholders", () => {
    for (const key of Object.keys(frFlat)) {
      expect(placeholders(arFlat[key]), key).toEqual(placeholders(frFlat[key]));
    }
  });
});
