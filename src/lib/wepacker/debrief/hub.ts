import type { DebriefEngine } from "@/lib/wepacker/debrief/engine";
import {
  DebriefEngineError,
  type AreaObservation,
  type AttendeeTaskSuggestion,
  type DebriefInput,
  type DebriefResult,
  type InternalEvaluation,
  type PerAttendeeDebrief,
} from "@/lib/wepacker/debrief/types";
import { AREA_KEYS, AREA_LABELS, type AreaKey } from "@/lib/wepacker/types";

// Real client for the Agents Hub playbook "wepac-session-debrief" (code
// W01 — see /Users/ruisantos/Documents/code/agents/db/seeds/playbook_templates/w01_wepac_session_debrief.rb,
// read-only, for the canonical step/inputs contract). Confirmed against
// the Hub's own source (app/controllers/api/v1/{base,playbooks,playbook_runs}_controller.rb):
//   - Auth: `Authorization: Bearer <api_key>` (org-scoped ApiKey).
//   - Submit: POST /api/v1/playbooks/:id/run — inputs.transcript accepts
//     plain text directly (attachment_id upload objects, HUB-2.1, are a
//     separate path we deliberately do not use in this phase per the story).
//   - Poll: GET /api/v1/playbook_runs/:id — detailed payload includes
//     `status`, `step_results` (array of {step_id, status, output, ...}),
//     and `error_message`.
// W01's steps: internal_assessment (ai_call, JSON) -> generate_result_html
// (ai_call, HTML text) -> mentor_approval (HITL, up to 48h timeout per the
// template) -> deliver_result (notify). We only need the outputs of the
// first two steps, which are already recorded in step_results well before
// the run reaches a terminal run.status ("done" only happens after the
// out-of-band mentor approval + delivery) — so polling watches step_results
// directly instead of the overall run status, and never waits on
// mentor_approval/deliver_result.
export class HubDebriefEngine implements DebriefEngine {
  readonly name = "hub" as const;

  private readonly apiUrl: string;
  private readonly apiKey: string;
  private readonly playbookId: string;

  constructor() {
    const apiUrl = process.env.HUB_API_URL;
    const apiKey = process.env.HUB_API_KEY;
    const playbookId = process.env.HUB_DEBRIEF_PLAYBOOK_ID;

    // Fail-loud at construction, never a silent fallback: a misconfigured
    // "hub" engine must never be indistinguishable from a working one.
    if (!apiUrl || !apiKey || !playbookId) {
      throw new DebriefEngineError(
        "Configuração do Agents Hub em falta (HUB_API_URL, HUB_API_KEY, HUB_DEBRIEF_PLAYBOOK_ID). Contacta o administrador."
      );
    }

    this.apiUrl = apiUrl.replace(/\/+$/, "");
    this.apiKey = apiKey;
    this.playbookId = playbookId;
  }

  async generateDebrief(input: DebriefInput): Promise<DebriefResult> {
    const runId = await this.submitRun(input);
    const detail = await this.pollUntilStepsReady(runId, input.sessionId);
    return this.mapToDebriefResult(detail, input);
  }

  private authHeaders(): Record<string, string> {
    return { Authorization: `Bearer ${this.apiKey}` };
  }

  // W01's inputs_schema requires several identity/delivery fields our
  // DebriefInput doesn't carry yet (member_ref, mentor_approver_id,
  // delivery_channel, member_contact) — those are Package B concerns (real
  // WEPAC tenant + mentor approver identity) that haven't landed on this
  // call site. TODO(coordination channel — see OPS_LOG.md "Canal Hub"
  // entries, 2026-07-21 session): align these once the Hub side confirms
  // final ownership/field names for mentor-approval identity and delivery
  // target. Until then we submit sessionId as a stand-in pseudonymous
  // member_ref and leave the rest as reasonable placeholders — the Hub run
  // endpoint does not enforce inputs_schema server-side, so this does not
  // block the run; it only means mentor_approval/deliver_result (which we
  // never wait on here) may render those fields empty downstream.
  private buildHubInputs(input: DebriefInput): Record<string, unknown> {
    return {
      transcript: input.transcript,
      template_version: "wepacker-v1",
      member_ref: input.sessionId,
      approval_channel: "web",
      mentor_approver_id: "",
      delivery_channel: "web",
      member_contact: "",
    };
  }

  private async submitRun(input: DebriefInput): Promise<string> {
    const url = `${this.apiUrl}/api/v1/playbooks/${this.playbookId}/run`;

    let response: Response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: {
          ...this.authHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputs: this.buildHubInputs(input) }),
      });
    } catch (err) {
      console.error("[wepacker:debrief] hub run submission failed", {
        sessionId: input.sessionId,
        message: safeErrorMessage(err),
      });
      throw new DebriefEngineError(
        "Não foi possível contactar o Agents Hub. Tenta novamente."
      );
    }

    if (response.status === 401 || response.status === 403) {
      console.error("[wepacker:debrief] hub run submission rejected (auth)", {
        sessionId: input.sessionId,
        status: response.status,
      });
      throw new DebriefEngineError(
        "Autenticação com o Agents Hub falhou. Contacta o administrador."
      );
    }
    if (!response.ok) {
      console.error("[wepacker:debrief] hub run submission rejected", {
        sessionId: input.sessionId,
        status: response.status,
      });
      throw new DebriefEngineError(
        "O Agents Hub recusou o pedido de debrief. Tenta novamente."
      );
    }

    let body: unknown;
    try {
      body = await response.json();
    } catch (err) {
      console.error("[wepacker:debrief] hub run response not JSON", {
        sessionId: input.sessionId,
        message: safeErrorMessage(err),
      });
      throw new DebriefEngineError("Resposta inesperada do Agents Hub.");
    }

    const runId = extractRunId(body);
    if (!runId) {
      console.error("[wepacker:debrief] hub run response missing id", {
        sessionId: input.sessionId,
      });
      throw new DebriefEngineError("Resposta inesperada do Agents Hub.");
    }
    return runId;
  }

  private async fetchRunDetail(
    runId: string,
    sessionId: string
  ): Promise<HubRunDetail> {
    const url = `${this.apiUrl}/api/v1/playbook_runs/${runId}`;

    let response: Response;
    try {
      response = await fetch(url, { headers: this.authHeaders() });
    } catch (err) {
      console.error("[wepacker:debrief] hub run status check failed", {
        sessionId,
        message: safeErrorMessage(err),
      });
      throw new DebriefEngineError(
        "Não foi possível consultar o estado do debrief no Agents Hub."
      );
    }

    if (response.status === 401 || response.status === 403) {
      console.error("[wepacker:debrief] hub run status check rejected (auth)", {
        sessionId,
        status: response.status,
      });
      throw new DebriefEngineError(
        "Autenticação com o Agents Hub falhou. Contacta o administrador."
      );
    }
    if (!response.ok) {
      console.error("[wepacker:debrief] hub run status check rejected", {
        sessionId,
        status: response.status,
      });
      throw new DebriefEngineError(
        "Não foi possível consultar o estado do debrief no Agents Hub."
      );
    }

    let body: unknown;
    try {
      body = await response.json();
    } catch (err) {
      console.error("[wepacker:debrief] hub run status response not JSON", {
        sessionId,
        message: safeErrorMessage(err),
      });
      throw new DebriefEngineError("Resposta inesperada do Agents Hub.");
    }

    return parseRunDetail((body as { data?: unknown } | null)?.data);
  }

  // Polls until both required ai_call steps are recorded as done in
  // step_results, fails loud on a terminal run failure/cancellation, and
  // fails loud on timeout (~5min) rather than waiting indefinitely — this
  // never waits on mentor_approval (up to 48h HITL timeout) or
  // deliver_result, which are irrelevant to the DebriefResult we map.
  private async pollUntilStepsReady(
    runId: string,
    sessionId: string
  ): Promise<HubRunDetail> {
    const deadline = Date.now() + POLL_TIMEOUT_MS;

    for (;;) {
      const detail = await this.fetchRunDetail(runId, sessionId);

      if (TERMINAL_FAILURE_STATUSES.has(detail.status)) {
        console.error("[wepacker:debrief] hub run terminated in failure", {
          sessionId,
          status: detail.status,
          message: detail.errorMessage ?? undefined,
        });
        throw new DebriefEngineError(
          "O Agents Hub não conseguiu concluir o debrief desta sessão."
        );
      }

      if (
        findStepOutput(detail, "internal_assessment") !== undefined &&
        findStepOutput(detail, "generate_result_html") !== undefined
      ) {
        return detail;
      }

      if (Date.now() >= deadline) {
        console.error("[wepacker:debrief] hub run polling timed out", {
          sessionId,
          status: detail.status,
        });
        throw new DebriefEngineError(
          "O motor de debrief do Agents Hub demorou demasiado tempo a responder. Tenta novamente mais tarde."
        );
      }

      await sleep(POLL_INTERVAL_MS);
    }
  }

  private mapToDebriefResult(
    detail: HubRunDetail,
    input: DebriefInput
  ): DebriefResult {
    const rawAssessment = findStepOutput(detail, "internal_assessment");
    const rawHtml = findStepOutput(detail, "generate_result_html");

    if (!rawAssessment || typeof rawAssessment !== "object") {
      console.error("[wepacker:debrief] hub run missing internal_assessment output", {
        sessionId: input.sessionId,
        status: detail.status,
      });
      throw new DebriefEngineError(
        "O Agents Hub não devolveu a avaliação interna do debrief."
      );
    }

    // Tolerant mapping — W01's assessment schema (sections/overall_summary/
    // risk_flags/recommended_focus) does not yet speak our 6 fixed
    // AreaKey areas; the board's plan is for the Hub side to align its
    // schema to those 6 areas directly (see criteria note in the story).
    // TODO(coordination channel — see OPS_LOG.md "Canal Hub" entries,
    // 2026-07-21 session): replace this heuristic title-matching with a
    // direct field-to-field mapping once W01's output_schema is updated to
    // key its sections by AreaKey instead of free-text titles.
    const assessment = rawAssessment as HubAssessmentOutput;
    const internalEvaluation: InternalEvaluation = {
      sessionSummary:
        typeof assessment.overall_summary === "string"
          ? assessment.overall_summary
          : "",
      areaObservations: buildAreaObservations(
        Array.isArray(assessment.sections) ? assessment.sections : []
      ),
      practiceObservations: null,
      risks: Array.isArray(assessment.risk_flags) ? assessment.risk_flags : [],
      recommendedFollowUps: Array.isArray(assessment.recommended_focus)
        ? assessment.recommended_focus
        : [],
    };

    // Same v1 rule as AnthropicDirect: a result document only makes sense
    // for individual (single-attendee) sessions.
    const isIndividualSession = input.attendees.length === 1;
    const resultDocumentHtml =
      isIndividualSession && typeof rawHtml === "string" && rawHtml.trim().length > 0
        ? rawHtml
        : null;

    // W01 has no per-attendee breakdown today (it targets one pseudonymised
    // member_ref per run, not the group) — TODO(coordination channel):
    // once W01 supports multiple attendees, replace this duplication with a
    // real per-attendee split. Until then every attendee of a session gets
    // the same synthesized suggestion.
    const tasks: AttendeeTaskSuggestion[] = internalEvaluation.recommendedFollowUps.map(
      (title) => ({ title })
    );
    const perAttendee: PerAttendeeDebrief[] = input.attendees.map((attendee) => ({
      userId: attendee.userId,
      outcomeSuggestion: internalEvaluation.sessionSummary,
      sharedNoteSuggestion: internalEvaluation.sessionSummary,
      confidence: "medium",
      tasks,
    }));

    return { perAttendee, internalEvaluation, resultDocumentHtml };
  }
}

// ===== module-internal helpers (exported only for readability of this file) =====

const POLL_INTERVAL_MS = 3_000;
const POLL_TIMEOUT_MS = 5 * 60 * 1000;

const TERMINAL_FAILURE_STATUSES = new Set(["failed", "cancelled"]);

interface HubStepResult {
  stepId: string;
  status: string;
  output: unknown;
}

interface HubRunDetail {
  status: string;
  stepResults: HubStepResult[];
  errorMessage: string | null;
}

interface HubAssessmentSection {
  title?: string;
  observations?: string;
  mentor_notes?: string;
  flags?: string[];
}

interface HubAssessmentOutput {
  sections?: HubAssessmentSection[];
  overall_summary?: string;
  risk_flags?: string[];
  recommended_focus?: string[];
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function safeErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : "unknown error";
}

function extractRunId(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const data = (body as Record<string, unknown>).data;
  if (!data || typeof data !== "object") return null;
  const id = (data as Record<string, unknown>).id;
  return typeof id === "string" ? id : null;
}

function parseRunDetail(data: unknown): HubRunDetail {
  const record = (data && typeof data === "object" ? data : {}) as Record<
    string,
    unknown
  >;

  const rawStepResults = Array.isArray(record.step_results)
    ? record.step_results
    : [];
  const stepResults: HubStepResult[] = rawStepResults
    .filter((s): s is Record<string, unknown> => !!s && typeof s === "object")
    .map((s) => ({
      stepId: typeof s.step_id === "string" ? s.step_id : "",
      status: typeof s.status === "string" ? s.status : "",
      output: s.output,
    }));

  return {
    status: typeof record.status === "string" ? record.status : "",
    stepResults,
    errorMessage:
      typeof record.error_message === "string" ? record.error_message : null,
  };
}

// Returns the output of a named step only once it is recorded with status
// "done" — undefined otherwise (step missing, still running, or failed),
// which the caller treats as "not ready yet".
function findStepOutput(detail: HubRunDetail, stepId: string): unknown {
  const match = detail.stepResults.find(
    (s) => s.stepId === stepId && s.status === "done"
  );
  return match?.output;
}

function buildAreaObservations(
  sections: HubAssessmentSection[]
): Record<AreaKey, AreaObservation> {
  const result = {} as Record<AreaKey, AreaObservation>;
  for (const area of AREA_KEYS) {
    const label = AREA_LABELS[area].toLowerCase();
    const match = sections.find((s) =>
      typeof s.title === "string" ? s.title.toLowerCase().includes(label) : false
    );
    result[area] = match
      ? {
          area,
          signal: "watch",
          evidence:
            typeof match.observations === "string" && match.observations
              ? match.observations
              : match.title ?? "",
        }
      : { area, signal: "not_discussed", evidence: "" };
  }
  return result;
}
