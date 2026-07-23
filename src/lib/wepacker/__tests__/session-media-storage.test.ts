import { createHash } from "node:crypto";
import { mkdtemp, mkdir, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { openVerifiedRecording } from "@/lib/wepacker/session-media/storage";

const roots: string[] = [];

afterEach(() => {
  delete process.env.SESSION_RECORDING_STORAGE_ROOT;
});

describe("private recording storage", () => {
  it("hashes and returns the exact same open file descriptor", async () => {
    const root = await mkdtemp(join(tmpdir(), "wepac-media-"));
    roots.push(root);
    await mkdir(join(root, "recordings", "rec_test_0001"), {
      recursive: true,
    });
    const content = Buffer.from("private recording");
    await writeFile(
      join(root, "recordings", "rec_test_0001", "audio.m4a"),
      content,
    );
    process.env.SESSION_RECORDING_STORAGE_ROOT = root;
    const handle = await openVerifiedRecording({
      objectKey: "recordings/rec_test_0001/audio.m4a",
      sha256: createHash("sha256").update(content).digest("hex"),
      bytes: BigInt(content.length),
    });
    await expect(handle.readFile({ encoding: "utf8" })).resolves.toBe(
      "private recording",
    );
    await handle.close();
  });

  it("rejects a symlinked parent outside the configured root", async () => {
    const root = await mkdtemp(join(tmpdir(), "wepac-media-"));
    const outside = await mkdtemp(join(tmpdir(), "wepac-outside-"));
    roots.push(root, outside);
    await mkdir(join(root, "recordings"), { recursive: true });
    await writeFile(join(outside, "audio.m4a"), "outside");
    await symlink(outside, join(root, "recordings", "rec_test_0001"));
    process.env.SESSION_RECORDING_STORAGE_ROOT = root;
    await expect(
      openVerifiedRecording({
        objectKey: "recordings/rec_test_0001/audio.m4a",
        sha256: createHash("sha256").update("outside").digest("hex"),
        bytes: BigInt(7),
      }),
    ).rejects.toThrow(/escaped/);
  });
});
