import { MAX_TRANSCRIPT_CHARS } from "@/lib/wepacker/debrief/types";

export const MAX_TRANSCRIPT_FILE_BYTES = 2 * 1024 * 1024;
export const TRANSCRIPT_FILE_ACCEPT =
  ".txt,.md,.vtt,.srt,text/plain,text/markdown,text/vtt,text/srt,application/x-subrip";
export const TRANSCRIPT_FILE_FORMATS = ".txt, .md, .vtt or .srt";

const ALLOWED_EXTENSIONS = new Set(["txt", "md", "vtt", "srt"]);
const ALLOWED_MIME_TYPES = new Set([
  "",
  "text/plain",
  "text/markdown",
  "text/vtt",
  "text/srt",
  "application/x-subrip",
]);

export interface ReadableTranscriptFile {
  name: string;
  size: number;
  type: string;
  arrayBuffer(): Promise<ArrayBuffer>;
}

export async function readTranscriptFile(
  file: ReadableTranscriptFile,
): Promise<string> {
  if (file.size > MAX_TRANSCRIPT_FILE_BYTES) {
    throw new Error("Ficheiro demasiado grande (máx. 2 MB).");
  }

  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  const mimeType = file.type.toLowerCase().split(";", 1)[0] ?? "";
  if (!ALLOWED_EXTENSIONS.has(extension) || !ALLOWED_MIME_TYPES.has(mimeType)) {
    throw new Error(
      `Formato não suportado — usa ${TRANSCRIPT_FILE_FORMATS} ou cola o texto diretamente.`,
    );
  }

  const bytes = await file.arrayBuffer();
  if (bytes.byteLength > MAX_TRANSCRIPT_FILE_BYTES) {
    throw new Error("Ficheiro demasiado grande (máx. 2 MB).");
  }

  let content: string;
  try {
    content = new TextDecoder("utf-8", { fatal: true })
      .decode(bytes)
      .replace(/^\uFEFF/, "");
  } catch {
    throw new Error("O ficheiro não está em UTF-8 válido.");
  }
  if (!content.trim()) {
    throw new Error("A transcript está vazia.");
  }
  if (content.includes("\0")) {
    throw new Error("O ficheiro não contém texto válido.");
  }
  if (content.length > MAX_TRANSCRIPT_CHARS) {
    throw new Error(
      `Transcript demasiado longa (máx. ${MAX_TRANSCRIPT_CHARS.toLocaleString("pt-PT")} caracteres).`,
    );
  }

  return content;
}
