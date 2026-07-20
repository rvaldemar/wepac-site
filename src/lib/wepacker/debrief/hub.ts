import type { DebriefEngine } from "@/lib/wepacker/debrief/engine";
import type { DebriefInput, DebriefResult } from "@/lib/wepacker/debrief/types";
import { DebriefEngineError } from "@/lib/wepacker/debrief/types";

// Stub only. TODO: Agents Hub playbook "wepac-session-debrief" — a Hub
// service request already exists for this (tenant WEPAC, GDPR-restricted
// Anthropic-only, HITL — see OPS_LOG.md). Wire this up once that
// playbook ships; until then WEPACKER_DEBRIEF_ENGINE=hub always rejects.
export class HubDebriefEngine implements DebriefEngine {
  readonly name = "hub" as const;

  async generateDebrief(_input: DebriefInput): Promise<DebriefResult> {
    void _input;
    throw new DebriefEngineError(
      "O motor de debrief via Agents Hub ainda não está disponível."
    );
  }
}
