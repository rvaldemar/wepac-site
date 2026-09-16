import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const appDirectory = fileURLToPath(new URL("..", import.meta.url));
const errorPages = [
  "global-error.tsx",
  "[locale]/error.tsx",
  "[locale]/not-found.tsx",
  "[locale]/bilhete/[token]/not-found.tsx",
];

describe("public error page boundary", () => {
  it.each(errorPages)("does not render runtime errors or bearer tokens in %s", async (path) => {
    const source = await readFile(`${appDirectory}/${path}`, "utf8");

    expect(source).not.toMatch(/\{\s*error\.(?:message|stack|cause)\s*\}/);
    expect(source).not.toMatch(/(?:params|searchParams)\.(?:token|code)/);
    expect(source).not.toContain("dangerouslySetInnerHTML");
  });
});
