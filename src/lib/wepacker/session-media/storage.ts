import { constants } from "node:fs";
import { open, realpath } from "node:fs/promises";
import { basename, dirname, join, sep } from "node:path";
import { createHash, timingSafeEqual } from "node:crypto";
import type { FileHandle } from "node:fs/promises";
import { recordingStorageRoot } from "@/lib/wepacker/session-media/config";
import { safeRelativeObjectKey } from "@/lib/wepacker/session-media/security";

export async function openVerifiedRecording(input: {
  objectKey: string;
  sha256: string;
  bytes: bigint;
}): Promise<FileHandle> {
  const key = safeRelativeObjectKey(input.objectKey);
  const root = await realpath(recordingStorageRoot());
  const candidate = join(root, key);
  const parent = await realpath(dirname(candidate));
  if (parent !== root && !parent.startsWith(`${root}${sep}`)) {
    throw new Error("Recording path escaped its storage root.");
  }
  const handle = await open(
    join(parent, basename(candidate)),
    constants.O_RDONLY | constants.O_NOFOLLOW,
  );
  try {
    if (process.platform === "linux") {
      const openedPath = await realpath(`/proc/self/fd/${handle.fd}`);
      if (openedPath !== root && !openedPath.startsWith(`${root}${sep}`)) {
        throw new Error("Opened recording escaped its storage root.");
      }
    }
    const stat = await handle.stat();
    if (!stat.isFile() || BigInt(stat.size) !== input.bytes) {
      throw new Error("Recording integrity mismatch.");
    }
    const hash = createHash("sha256");
    const buffer = Buffer.allocUnsafe(128 * 1024);
    let position = 0;
    while (position < stat.size) {
      const { bytesRead } = await handle.read(
        buffer,
        0,
        Math.min(buffer.length, stat.size - position),
        position,
      );
      if (bytesRead < 1) throw new Error("Recording truncated while reading.");
      hash.update(buffer.subarray(0, bytesRead));
      position += bytesRead;
    }
    const expected = Buffer.from(input.sha256, "hex");
    const actual = hash.digest();
    if (
      expected.length !== actual.length ||
      !timingSafeEqual(expected, actual)
    ) {
      throw new Error("Recording integrity mismatch.");
    }
    return handle;
  } catch (error) {
    await handle.close();
    throw error;
  }
}

export function safeSecretEqual(actual: string, expected: string): boolean {
  const actualDigest = createHash("sha256").update(actual).digest();
  const expectedDigest = createHash("sha256").update(expected).digest();
  return timingSafeEqual(actualDigest, expectedDigest);
}
