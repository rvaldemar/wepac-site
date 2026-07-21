import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// GDPR / no-content-in-logs constraint: transcripts are sensitive
// personal data (mentees may be minors). No console.* call in any of
// these files may log the transcript, the assembled prompt, or a raw
// SDK response/error object — only e.message, status, sessionId, and
// character counts. This test fails the build if a future edit adds a
// console.* call whose argument list contains a variable literally
// named transcript/prompt/system (the usual way this regresses), or
// that passes an entire `response`/`err`/`error` object instead of its
// safe fields.

const FILES = [
  "src/lib/wepacker/debrief/anthropic.ts",
  "src/lib/wepacker/debrief/hub.ts",
  "src/lib/wepacker/actions/debrief.ts",
  "src/lib/wepacker/actions/session-transcript.ts",
];

const FORBIDDEN_TOKENS = ["transcript", "prompt", "system"];

// Captures each full console.* call (not just its opening line) so a
// forbidden field on a continuation line of a multi-line call is still
// caught — most of these calls are written across several lines.
function consoleCallLines(source: string): string[] {
  const re = /console\.(?:log|error|warn|info|debug)\s*\([\s\S]*?\);/g;
  return source.match(re) ?? [];
}

describe("debrief pipeline never logs transcript/prompt/payload content", () => {
  for (const relativePath of FILES) {
    it(`${relativePath} has no console.* call referencing forbidden content`, () => {
      const absolute = join(process.cwd(), relativePath);
      const source = readFileSync(absolute, "utf-8");
      const calls = consoleCallLines(source);

      for (const line of calls) {
        // A console.* call may reference the *name* of a safe field
        // (e.g. "message: safeErrorMessage(err)"), but must never pass a
        // variable literally called transcript/prompt/system, nor the
        // bare SDK response/error object.
        for (const token of FORBIDDEN_TOKENS) {
          const identifierUsage = new RegExp(`\\b${token}\\b\\s*[,:)]`).test(line);
          expect(
            identifierUsage,
            `Forbidden token "${token}" passed directly to a console.* call in ${relativePath}:\n${line}`
          ).toBe(false);
        }
        // Never log a bare response/err/error object as a direct
        // argument to console.* (e.g. `console.error("msg", err)`) —
        // this only flags the identifier as the call's own top-level
        // argument, not when it's passed into a scrubbing helper like
        // `safeErrorMessage(err)`, which is how this file is required
        // to extract the safe fields.
        expect(
          /console\.(?:error|warn)\(\s*[^,]+,\s*(?:response|err|error)\s*\)/.test(line),
          `Raw response/error object passed directly to a console.* call in ${relativePath}:\n${line}`
        ).toBe(false);
      }
    });
  }

  it("every console.error call in these files stays within the safe-field allowlist", () => {
    const allowedKeys = new Set([
      "sessionId",
      "status",
      "message",
      "transcriptChars",
      "outputChars",
    ]);
    for (const relativePath of FILES) {
      const absolute = join(process.cwd(), relativePath);
      const source = readFileSync(absolute, "utf-8");
      // Match `{ key: ... }` object literals passed as the 2nd arg to a
      // console.error/warn call, and check every key against the
      // allowlist.
      const objectLiteralKeyRe = /console\.(?:error|warn)\([^,]+,\s*\{([^}]*)\}/g;
      let match: RegExpExecArray | null;
      while ((match = objectLiteralKeyRe.exec(source))) {
        const body = match[1];
        // Handles both `{ key: value }` and shorthand `{ key }` props.
        const keys = body
          .split(",")
          .map((part) => part.trim())
          .filter(Boolean)
          .map((part) => part.split(":")[0].trim());
        for (const key of keys) {
          expect(
            allowedKeys.has(key),
            `console call in ${relativePath} logs an unlisted field "${key}" — only ${[
              ...allowedKeys,
            ].join(", ")} are allowed`
          ).toBe(true);
        }
      }
    }
  });
});
