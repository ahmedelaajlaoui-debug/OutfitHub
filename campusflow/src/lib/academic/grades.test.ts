import { describe, expect, it } from "vitest";
import {
  computeCourseAverage,
  computeOverallAverage,
  getMention,
  isValidated,
  normaliseToScale,
} from "./grades";

describe("grade calculations", () => {
  it("normalises scores to /20", () => {
    expect(normaliseToScale(14, 40)).toBe(7);
    expect(normaliseToScale(15, 20)).toBe(15);
    expect(() => normaliseToScale(5, 0)).toThrow(RangeError);
    expect(() => normaliseToScale(-1, 20)).toThrow(RangeError);
  });

  it("computes a weighted course average", () => {
    // Exam 12/20 (weight 2) + TP 32/40 (=16/20, weight 1) => (24 + 16) / 3 = 13.33
    expect(
      computeCourseAverage([
        { score: 12, maxScore: 20, weight: 2 },
        { score: 32, maxScore: 40, weight: 1 },
      ]),
    ).toBe(13.33);
  });

  it("returns null without usable grades", () => {
    expect(computeCourseAverage([])).toBeNull();
    expect(computeCourseAverage([{ score: 10, maxScore: 20, weight: 0 }])).toBeNull();
  });

  it("computes the overall average with coefficients and ignores ungraded courses", () => {
    expect(
      computeOverallAverage([
        { coefficient: 3, average: 14 },
        { coefficient: 1, average: 8 },
        { coefficient: 2, average: null },
      ]),
    ).toBe(12.5);
    expect(computeOverallAverage([{ coefficient: 2, average: null }])).toBeNull();
  });

  it("applies the Moroccan validation threshold and mentions", () => {
    expect(isValidated(10)).toBe(true);
    expect(isValidated(9.99)).toBe(false);
    expect(getMention(9.5)).toBe("insufficient");
    expect(getMention(10)).toBe("passable");
    expect(getMention(12)).toBe("fair");
    expect(getMention(14.2)).toBe("good");
    expect(getMention(16)).toBe("very_good");
    expect(getMention(18.5)).toBe("excellent");
  });
});
