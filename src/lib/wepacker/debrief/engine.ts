import type { DebriefInput, DebriefResult } from "@/lib/wepacker/debrief/types";
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

// env DEBRIEF_ENGINE ("anthropic" | "hub"), default "anthropic". "hub"
// fails loud at construction (not here) when its own env vars are missing
// — see HubDebriefEngine's constructor — never a silent fallback to
// AnthropicDirect.
export function getDebriefEngine(): DebriefEngine {
  const impl = process.env.DEBRIEF_ENGINE;
  if (impl === "hub") return new HubDebriefEngine();
  return new AnthropicDebriefEngine();
}
