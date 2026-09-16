import { describe, expect, it } from "vitest";
import {
  MAX_TRANSCRIPT_FILE_BYTES,
  readTranscriptFile,
  type ReadableTranscriptFile,
} from "@/lib/wepacker/transcript-file";
import { MAX_TRANSCRIPT_CHARS } from "@/lib/wepacker/debrief/types";

function transcriptFile(
  name: string,
  type: string,
  bytes: Uint8Array,
): ReadableTranscriptFile {
  return {
    name,
    type,
    size: bytes.byteLength,
    arrayBuffer: async () =>
      bytes.buffer.slice(
        bytes.byteOffset,
        bytes.byteOffset + bytes.byteLength,
      ) as ArrayBuffer,
  };
}

function textFile(name: string, type: string, content: string) {
  return transcriptFile(name, type, new TextEncoder().encode(content));
}

describe("readTranscriptFile", () => {
  it.each([
    ["session.txt", "text/plain"],
    ["session.md", "text/markdown"],
    ["session.vtt", "text/vtt"],
    ["session.srt", "application/x-subrip"],
  ])("reads supported UTF-8 text input: %s", async (name, type) => {
    await expect(
      readTranscriptFile(textFile(name, type, "Alex: hello")),
    ).resolves.toBe("Alex: hello");
  });

  it("requires an allowed extension even when the MIME claims plain text", async () => {
    await expect(
      readTranscriptFile(textFile("session.html", "text/plain", "<script>")),
    ).rejects.toThrow("Formato não suportado");
  });

  it("rejects an unexpected MIME type", async () => {
    await expect(
      readTranscriptFile(
        textFile("session.txt", "application/pdf", "not a pdf"),
      ),
    ).rejects.toThrow("Formato não suportado");
  });

  it("rejects invalid UTF-8 and binary NUL content", async () => {
    await expect(
      readTranscriptFile(
        transcriptFile("session.vtt", "text/vtt", new Uint8Array([0xc3, 0x28])),
      ),
    ).rejects.toThrow("UTF-8 válido");
    await expect(
      readTranscriptFile(textFile("session.txt", "text/plain", "hello\0world")),
    ).rejects.toThrow("texto válido");
  });

  it("rejects empty, oversized-byte and oversized-character input", async () => {
    await expect(
      readTranscriptFile(textFile("session.txt", "text/plain", "  \n")),
    ).rejects.toThrow("vazia");
    await expect(
      readTranscriptFile(
        transcriptFile(
          "session.txt",
          "text/plain",
          new Uint8Array(MAX_TRANSCRIPT_FILE_BYTES + 1),
        ),
      ),
    ).rejects.toThrow("2 MB");
    await expect(
      readTranscriptFile(
        textFile(
          "session.txt",
          "text/plain",
          "a".repeat(MAX_TRANSCRIPT_CHARS + 1),
        ),
      ),
    ).rejects.toThrow("demasiado longa");
  });
});
