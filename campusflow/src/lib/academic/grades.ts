/**
 * Grade calculations on the Moroccan /20 scale.
 *
 * - A course average is the weighted mean of its assessments, each normalised
 *   to /20 first (a 14/40 counts as 7/20).
 * - The overall average is the mean of course averages weighted by each
 *   course coefficient. Courses without grades are ignored.
 */

export const GRADE_SCALE = 20;
export const PASSING_AVERAGE = 10;

export type GradeInput = {
  score: number;
  maxScore: number;
  weight: number;
};

export type CourseAverageInput = {
  coefficient: number;
  average: number | null;
};

export type Mention = "excellent" | "very_good" | "good" | "fair" | "passable" | "insufficient";

function isPositiveFinite(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

export function roundTo(value: number, decimals = 2): number {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

export function normaliseToScale(score: number, maxScore: number, scale = GRADE_SCALE): number {
  if (!isPositiveFinite(maxScore) || !Number.isFinite(score) || score < 0) {
    throw new RangeError("Invalid score or maximum score.");
  }
  return (Math.min(score, maxScore) / maxScore) * scale;
}

export function computeCourseAverage(grades: readonly GradeInput[]): number | null {
  let weighted = 0;
  let totalWeight = 0;
  for (const grade of grades) {
    if (!isPositiveFinite(grade.weight)) continue;
    weighted += normaliseToScale(grade.score, grade.maxScore) * grade.weight;
    totalWeight += grade.weight;
  }
  return totalWeight === 0 ? null : roundTo(weighted / totalWeight);
}

export function computeOverallAverage(courses: readonly CourseAverageInput[]): number | null {
  let weighted = 0;
  let totalCoefficient = 0;
  for (const course of courses) {
    if (course.average === null || !isPositiveFinite(course.coefficient)) continue;
    weighted += course.average * course.coefficient;
    totalCoefficient += course.coefficient;
  }
  return totalCoefficient === 0 ? null : roundTo(weighted / totalCoefficient);
}

export function isValidated(average: number): boolean {
  return average >= PASSING_AVERAGE;
}

/** Mentions used by Moroccan universities. */
export function getMention(average: number): Mention {
  if (average >= 18) return "excellent";
  if (average >= 16) return "very_good";
  if (average >= 14) return "good";
  if (average >= 12) return "fair";
  if (average >= PASSING_AVERAGE) return "passable";
  return "insufficient";
}
