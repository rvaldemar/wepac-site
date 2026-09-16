import type { DebriefEngine } from "@/lib/wepacker/debrief/engine";
import {
  DebriefEngineError,
  type DebriefInput,
  type DebriefResult,
} from "@/lib/wepacker/debrief/types";

// W01 is owned and published by WEPAC through the generic Hub authoring
// surface. The obsolete v1/v2 adapters are intentionally removed: they contain
// retired Task/Pack semantics. Implementing the v3 transport is a later,
// separately certified cutover after the Hub team returns release-bound
// credentials and production synthetic evidence.
export class HubDebriefEngine implements DebriefEngine {
  readonly name = "hub" as const;

  async generateDebrief(input: DebriefInput): Promise<DebriefResult> {
    void input;
    throw new DebriefEngineError(
      "Session Debrief aguarda publicação e certificação do W01 v3.",
    );
  }
}
