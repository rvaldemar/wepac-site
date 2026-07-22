import {
  DebriefEngineError,
  type DebriefInput,
  type DebriefResult,
} from "@/lib/wepacker/debrief/types";
import { AnthropicDebriefEngine } from "@/lib/wepacker/debrief/anthropic";
import { HubDebriefEngine } from "@/lib/wepacker/debrief/hub";

// Two-impl seam behind generateSessionDebrief: AnthropicDirect calls the
// Anthropic API directly; HubClient calls the Agents Hub playbook
// "wepac-session-debrief" (code W01 — see OPS_LOG.md, tenant WEPAC,
// GDPR-restricted Anthropic-only, HITL). Selected via env DEBRIEF_ENGINE.
export interface DebriefEngine {
  readonly name: "anthropic-direct" | "hub";
  generateDebrief(input: DebriefInput): Promise<DebriefResult>;
}

// env DEBRIEF_ENGINE ("anthropic" | "hub"), default "hub". The WEPAC
// production path is subscription-backed through Agents Hub; direct
// Anthropic billing remains available only when selected explicitly.
// Missing Hub configuration and unknown values fail loud, never falling
// back to AnthropicDirect.
export function getDebriefEngine(): DebriefEngine {
  const impl = process.env.DEBRIEF_ENGINE;
  if (!impl || impl === "hub") return new HubDebriefEngine();
  if (impl === "anthropic") return new AnthropicDebriefEngine();
  throw new DebriefEngineError(
    "Configuração do motor de debrief inválida. Contacta o administrador."
  );
}
