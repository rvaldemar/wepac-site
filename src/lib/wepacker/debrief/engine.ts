import type { DebriefInput, DebriefResult } from "@/lib/wepacker/debrief/types";
import { AnthropicDebriefEngine } from "@/lib/wepacker/debrief/anthropic";
import { HubDebriefEngine } from "@/lib/wepacker/debrief/hub";

// Two-impl seam behind generateSessionDebrief: AnthropicDirect calls the
// Anthropic API directly (built now); HubClient is a stub for the future
// Agents Hub playbook "wepac-session-debrief" (see OPS_LOG.md — a Hub
// service request already exists for this, tenant WEPAC, GDPR-restricted
// Anthropic-only, HITL).
export interface DebriefEngine {
  readonly name: "anthropic-direct" | "hub";
  generateDebrief(input: DebriefInput): Promise<DebriefResult>;
}

// env WEPACKER_DEBRIEF_ENGINE, default "anthropic".
export function getDebriefEngine(): DebriefEngine {
  const impl = process.env.WEPACKER_DEBRIEF_ENGINE;
  if (impl === "hub") return new HubDebriefEngine();
  return new AnthropicDebriefEngine();
}
