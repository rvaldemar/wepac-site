import { readdirSync, readFileSync } from "node:fs";
import { extname, join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const sourceRoot = join(root, "src");

function runtimeSourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "__tests__") return [];
      return runtimeSourceFiles(path);
    }
    return [".ts", ".tsx"].includes(extname(entry.name)) ? [path] : [];
  });
}

const runtime = runtimeSourceFiles(sourceRoot)
  .map((path) => ({
    path: relative(root, path),
    source: readFileSync(path, "utf8"),
  }));

function matches(pattern: RegExp) {
  return runtime
    .filter(({ source }) => pattern.test(source))
    .map(({ path }) => path);
}

describe("retired delivery contract stays out of the runtime", () => {
  it("has no retired Prisma delegates, fields or source markers", () => {
    const forbidden = [
      /prisma\.(?:cohort|cohortMembership|task|monthlyAction|evaluation|evaluationScore|strategicMapScore|comment)\b/,
      /\b(?:cohortId|membershipId|packSlug|sessionType|reviewRequired|legacy_inference)\b/,
    ];

    for (const pattern of forbidden) {
      expect(matches(pattern), pattern.source).toEqual([]);
    }
  });

  it("has no retired action imports or product routes", () => {
    const forbidden = [
      /@\/lib\/wepacker\/actions\/(?:task|evaluation|session-prep)/,
      /["'`]\/wepacker\/(?:tasks|ppv|plan|assessment|diagnosis|admin\/cohorts)(?:[\/"'`?]|$)/,
      /["'`]\/wepacker\/[[]pack[]]\/(?:intake|candidatura)/,
      /Pack Artista/i,
      /\b(?:Tasks|Assessments|Cohorts)\b/,
    ];

    for (const pattern of forbidden) {
      expect(matches(pattern), pattern.source).toEqual([]);
    }
  });
});
