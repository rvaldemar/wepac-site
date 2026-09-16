import type { DebriefInput, DebriefResult } from "@/lib/wepacker/debrief/types";
import { DebriefEngineError } from "@/lib/wepacker/debrief/types";
import { HubDebriefEngine } from "@/lib/wepacker/debrief/hub";

export interface DebriefEngine {
  readonly name: "hub";
  generateDebrief(input: DebriefInput): Promise<DebriefResult>;
}

// Content processing stays fail-closed until W01 v3 has been published and the
// Hub team has returned its service-principal and synthetic certification.
// There is deliberately no direct Anthropic production or fallback path.
export function getDebriefEngine(): DebriefEngine {
  const engine = process.env.DEBRIEF_ENGINE?.trim() || "disabled";
  if (engine === "hub") return new HubDebriefEngine();
  if (engine === "disabled") {
    throw new DebriefEngineError(
      "Session Debrief está temporariamente indisponível.",
    );
  }
  throw new DebriefEngineError("Configuração de Session Debrief inválida.");
}
