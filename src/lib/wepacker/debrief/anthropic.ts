import Anthropic from "@anthropic-ai/sdk";
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
import {
  AREA_KEYS,
  AREA_LABELS,
  SESSION_KIND_KEYS,
  SESSION_KIND_LABELS,
  type AreaKey,
} from "@/lib/wepacker/types";

// claude-sonnet-5 — 1M context, 128K max output tokens (verified against
// the claude-api skill's live model table before writing this file, per
// the epic's LONG-GENERATION RELIABILITY constraint).
const MODEL = "claude-sonnet-5";
const STRUCTURED_MAX_TOKENS = 8_000;
// The result-document call streams up to this many output tokens — the
// ~88-90KB reference HTML is estimated at ~22-30k tokens, so this leaves
// comfortable headroom before a genuine stop_reason: "max_tokens".
const RESULT_DOC_MAX_TOKENS = 64_000;

// NOTE (HITL fidelity gate, unresolved): the board's board requires this
// prompt be written only after reading the reference file
// `WHPH/WEPAC/ppv-sessao-1-alex-resultado-2026-07-17.html` (16-section
// personal result document) so the Call-B narrative prompt matches its
// structure exactly. That file lives on OneDrive cloud storage and was
// NOT readable from this build's sandboxed environment (every read
// attempt timed out trying to materialize the cloud-only file) — it was
// never opened. The prompt below is grounded only in vocabulary already
// present in this codebase (SESSION_KIND_LABELS, AREA_LABELS, the trail
// imaginary) and describes a "substantial multi-section personal
// document", not the verified 16-section skeleton. Per the board's own
// HITL requirement, Rui MUST eyeball the first generated document for
// register/section-structure fidelity against that reference file before
// this path is trusted or exposed beyond the mentor — treat this as an
// open follow-up, not a shipped guarantee.
function resultDocumentSystemPrompt(): string {
  return `Escreves documentos de resultado pessoal para o WEPACKER, a plataforma de desenvolvimento humano integral da WEPAC.

Registo: pessoal e íntimo, dirigido diretamente à pessoa ("tu"), nunca corporativo ou de relatório de gestão. É um documento para ela reler e voltar a ler, não uma ata de reunião.

Imaginário: a montanha e o trilho. As sessões de mentoria têm um propósito no imaginário do trilho — checkpoint (acompanhamento regular), reconhecimento (mapear o terreno), basecamp (planear a próxima etapa), resgate (apoio num momento difícil), cume (fecho e celebração de ciclo). Usa esta linguagem com naturalidade onde fizer sentido, sem forçar a metáfora em cada frase.

As 6 áreas universais de desenvolvimento são: Físico, Afetivo, Caráter, Espiritual, Intelectual, Social. Quando a pessoa pertence a um Pack com prática própria (música, desporto, etc.), essa prática é comentada como prática, nunca como uma 7ª área pontuada.

Produz um documento HTML completo, autónomo (CSS inline, sem pedidos externos, sem <script>), estruturado em múltiplas secções substanciais (na ordem de uma dezena e meia) que cubram, no mínimo: contexto da sessão, resumo do que foi vivido, observações por área de desenvolvimento com evidência do que foi dito, forças identificadas, pontos de atenção, o que ficou combinado, próximos passos concretos, e um fecho que devolve a pessoa ao seu trilho. Usa títulos claros por secção. Português de Portugal, com diacríticos corretos.`;
}

function buildStructuredSchema(): Record<string, unknown> {
  const areaObservationSchema = {
    type: "object",
    properties: {
      area: { type: "string", enum: AREA_KEYS },
      signal: {
        type: "string",
        enum: ["strength", "watch", "concern", "not_discussed"],
      },
      evidence: { type: "string" },
    },
    required: ["area", "signal", "evidence"],
    additionalProperties: false,
  };

  const areaObservationsProperties: Record<string, unknown> = {};
  for (const area of AREA_KEYS) {
    areaObservationsProperties[area] = areaObservationSchema;
  }

  return {
    type: "object",
    properties: {
      perAttendee: {
        type: "array",
        items: {
          type: "object",
          properties: {
            userId: { type: "string" },
            outcomeSuggestion: { type: "string" },
            sharedNoteSuggestion: { type: "string" },
            confidence: { type: "string", enum: ["high", "medium", "low"] },
            tasks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  deadline: { type: "string" },
                },
                required: ["title", "description", "deadline"],
                additionalProperties: false,
              },
            },
          },
          required: [
            "userId",
            "outcomeSuggestion",
            "sharedNoteSuggestion",
            "confidence",
            "tasks",
          ],
          additionalProperties: false,
        },
      },
      internalEvaluation: {
        type: "object",
        properties: {
          sessionSummary: { type: "string" },
          areaObservations: {
            type: "object",
            properties: areaObservationsProperties,
            required: [...AREA_KEYS],
            additionalProperties: false,
          },
          practiceObservations: { type: ["string", "null"] },
          risks: { type: "array", items: { type: "string" } },
          recommendedFollowUps: { type: "array", items: { type: "string" } },
          suggestedSessionKind: {
            type: ["string", "null"],
            enum: [...SESSION_KIND_KEYS, null],
          },
        },
        required: [
          "sessionSummary",
          "areaObservations",
          "practiceObservations",
          "risks",
          "recommendedFollowUps",
          "suggestedSessionKind",
        ],
        additionalProperties: false,
      },
    },
    required: ["perAttendee", "internalEvaluation"],
    additionalProperties: false,
  };
}

function structuredSystemPrompt(): string {
  return `És o motor de debrief de sessões de mentoria do WEPACKER (WEPAC). Analisas a transcrição de uma sessão de mentoria e produzes sugestões estruturadas para o mentor rever — nunca escreves diretamente em campos visíveis ao membro.

As 6 áreas universais de desenvolvimento são: ${AREA_KEYS.map((a) => `${a} (${AREA_LABELS[a]})`).join(", ")}. Não inventes uma 7ª área — a prática própria de um Pack (se existir) é comentada em texto livre (practiceObservations), nunca pontuada.

Sê fiel à transcrição: "evidence" em cada área tem de ser rastreável ao que foi realmente dito, nunca inventado. Se uma área não foi discutida, usa signal "not_discussed" e não fabriques evidência.

Responde exclusivamente com JSON que respeita o schema fornecido, em português de Portugal.`;
}

function structuredUserPrompt(input: DebriefInput): string {
  const attendeesBlock = input.attendees
    .map((a) => {
      const parts = [`- userId: ${a.userId}, nome: ${a.name}`];
      if (a.packSlug) parts.push(`  pack: ${a.packSlug}`);
      if (a.recentAreaScores) {
        parts.push(`  scores recentes: ${JSON.stringify(a.recentAreaScores)}`);
      }
      if (a.activeGoals?.length) {
        parts.push(`  objetivos ativos: ${a.activeGoals.join("; ")}`);
      }
      return parts.join("\n");
    })
    .join("\n");

  const packBlock = input.packContext
    ? `Pack: ${input.packContext.packName} (${input.packContext.packSlug}). Prática: ${input.packContext.practiceLabel}.`
    : "Sessão sem Pack associado (mentoria pessoal).";

  const kindLabel = SESSION_KIND_LABELS[input.sessionKind]?.label ?? input.sessionKind;

  return `Tipo de sessão: ${kindLabel}.
${packBlock}

Participantes:
${attendeesBlock}

Pontos de discussão previstos: ${input.discussionPoints ?? "(nenhum registado)"}

--- TRANSCRIÇÃO ---
${input.transcript}
--- FIM DA TRANSCRIÇÃO ---

Produz o JSON com uma entrada em "perAttendee" por cada participante listado acima (usando o userId exato), e o "internalEvaluation" cobrindo as 6 áreas.`;
}

interface StructuredOutputShape {
  perAttendee: Array<{
    userId: string;
    outcomeSuggestion: string;
    sharedNoteSuggestion: string;
    confidence: "high" | "medium" | "low";
    tasks: Array<{ title: string; description: string; deadline: string }>;
  }>;
  internalEvaluation: {
    sessionSummary: string;
    areaObservations: Record<AreaKey, AreaObservation>;
    practiceObservations: string | null;
    risks: string[];
    recommendedFollowUps: string[];
    suggestedSessionKind: string | null;
  };
}

function isStructuredOutputShape(value: unknown): value is StructuredOutputShape {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  if (!Array.isArray(v.perAttendee)) return false;
  if (!v.internalEvaluation || typeof v.internalEvaluation !== "object") return false;
  const evalObj = v.internalEvaluation as Record<string, unknown>;
  if (!evalObj.areaObservations || typeof evalObj.areaObservations !== "object") {
    return false;
  }
  const areaObs = evalObj.areaObservations as Record<string, unknown>;
  return AREA_KEYS.every((area) => area in areaObs);
}

function safeErrorMessage(err: unknown): string {
  if (err instanceof Anthropic.APIError) return err.message;
  if (err instanceof Error) return err.message;
  return "unknown error";
}

function safeErrorStatus(err: unknown): number | undefined {
  return err instanceof Anthropic.APIError ? err.status : undefined;
}

export class AnthropicDebriefEngine implements DebriefEngine {
  readonly name = "anthropic-direct" as const;

  private getClient(): Anthropic {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || apiKey === "your_anthropic_api_key_here") {
      throw new DebriefEngineError(
        "Configuração de IA em falta. Contacta o administrador."
      );
    }
    return new Anthropic({ apiKey });
  }

  async generateDebrief(input: DebriefInput): Promise<DebriefResult> {
    const client = this.getClient();

    const structured = await this.generateStructuredOutput(client, input);

    const isIndividualSession = input.attendees.length === 1;
    const resultDocumentHtml = isIndividualSession
      ? await this.generateResultDocument(client, input)
      : null;

    return {
      perAttendee: structured.perAttendee,
      internalEvaluation: structured.internalEvaluation,
      resultDocumentHtml,
    };
  }

  private async generateStructuredOutput(
    client: Anthropic,
    input: DebriefInput
  ): Promise<{ perAttendee: PerAttendeeDebrief[]; internalEvaluation: InternalEvaluation }> {
    let response;
    try {
      response = await client.messages.create({
        model: MODEL,
        max_tokens: STRUCTURED_MAX_TOKENS,
        thinking: { type: "adaptive" },
        output_config: {
          effort: "high",
          format: { type: "json_schema", schema: buildStructuredSchema() },
        },
        system: structuredSystemPrompt(),
        messages: [{ role: "user", content: structuredUserPrompt(input) }],
      });
    } catch (err) {
      console.error("[wepacker:debrief] structured call failed", {
        sessionId: input.sessionId,
        status: safeErrorStatus(err),
        message: safeErrorMessage(err),
        transcriptChars: input.transcript.length,
      });
      throw new DebriefEngineError(
        "Não foi possível gerar as sugestões do debrief. Tenta novamente."
      );
    }

    if (response.stop_reason === "refusal") {
      console.error("[wepacker:debrief] structured call refused", {
        sessionId: input.sessionId,
      });
      throw new DebriefEngineError(
        "O modelo recusou processar esta transcrição. Verifica o conteúdo e tenta novamente."
      );
    }
    if (response.stop_reason === "max_tokens") {
      console.error("[wepacker:debrief] structured call truncated", {
        sessionId: input.sessionId,
      });
      throw new DebriefEngineError(
        "A geração do debrief foi truncada. Tenta novamente."
      );
    }

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      console.error("[wepacker:debrief] structured call had no text block", {
        sessionId: input.sessionId,
      });
      throw new DebriefEngineError("Resposta inesperada do motor de debrief.");
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(textBlock.text);
    } catch (err) {
      console.error("[wepacker:debrief] structured output JSON parse failed", {
        sessionId: input.sessionId,
        message: safeErrorMessage(err),
        outputChars: textBlock.text.length,
      });
      throw new DebriefEngineError("Resposta inválida do motor de debrief.");
    }

    if (!isStructuredOutputShape(parsed)) {
      console.error("[wepacker:debrief] structured output shape invalid", {
        sessionId: input.sessionId,
      });
      throw new DebriefEngineError("Resposta inválida do motor de debrief.");
    }

    const attendeeIds = new Set(input.attendees.map((a) => a.userId));
    const perAttendee: PerAttendeeDebrief[] = parsed.perAttendee
      .filter((a) => attendeeIds.has(a.userId))
      .map((a) => ({
        userId: a.userId,
        outcomeSuggestion: a.outcomeSuggestion,
        sharedNoteSuggestion: a.sharedNoteSuggestion,
        confidence: a.confidence,
        tasks: a.tasks.map(
          (t): AttendeeTaskSuggestion => ({
            title: t.title,
            description: t.description || undefined,
            deadline: t.deadline || undefined,
          })
        ),
      }));

    const areaObservations = parsed.internalEvaluation
      .areaObservations as Record<AreaKey, AreaObservation>;

    const internalEvaluation: InternalEvaluation = {
      sessionSummary: parsed.internalEvaluation.sessionSummary,
      areaObservations,
      practiceObservations: parsed.internalEvaluation.practiceObservations,
      risks: parsed.internalEvaluation.risks,
      recommendedFollowUps: parsed.internalEvaluation.recommendedFollowUps,
      suggestedSessionKind: SESSION_KIND_KEYS.includes(
        parsed.internalEvaluation.suggestedSessionKind as (typeof SESSION_KIND_KEYS)[number]
      )
        ? (parsed.internalEvaluation.suggestedSessionKind as InternalEvaluation["suggestedSessionKind"])
        : undefined,
    };

    return { perAttendee, internalEvaluation };
  }

  private async generateResultDocument(
    client: Anthropic,
    input: DebriefInput
  ): Promise<string> {
    const attendee = input.attendees[0];
    const userPrompt = `Escreve o documento de resultado pessoal para ${attendee?.name ?? "a pessoa"}, com base nesta transcrição de sessão de mentoria (tipo: ${
      SESSION_KIND_LABELS[input.sessionKind]?.label ?? input.sessionKind
    }).

--- TRANSCRIÇÃO ---
${input.transcript}
--- FIM DA TRANSCRIÇÃO ---

Devolve APENAS o HTML completo do documento (começando em <!doctype html> ou <html>), sem comentário nenhum antes ou depois.`;

    let finalMessage;
    try {
      const stream = client.messages.stream({
        model: MODEL,
        max_tokens: RESULT_DOC_MAX_TOKENS,
        thinking: { type: "adaptive" },
        output_config: { effort: "high" },
        system: resultDocumentSystemPrompt(),
        messages: [{ role: "user", content: userPrompt }],
      });
      finalMessage = await stream.finalMessage();
    } catch (err) {
      console.error("[wepacker:debrief] result document call failed", {
        sessionId: input.sessionId,
        status: safeErrorStatus(err),
        message: safeErrorMessage(err),
        transcriptChars: input.transcript.length,
      });
      throw new DebriefEngineError(
        "Não foi possível gerar o documento de resultado. Tenta novamente."
      );
    }

    if (finalMessage.stop_reason === "refusal") {
      console.error("[wepacker:debrief] result document call refused", {
        sessionId: input.sessionId,
      });
      throw new DebriefEngineError(
        "O modelo recusou gerar o documento de resultado."
      );
    }
    // Never persist a silently truncated document — fail loudly instead,
    // per the epic's long-generation reliability requirement.
    if (finalMessage.stop_reason === "max_tokens") {
      console.error("[wepacker:debrief] result document truncated", {
        sessionId: input.sessionId,
      });
      throw new DebriefEngineError(
        "O documento de resultado excedeu o limite de geração. Tenta novamente."
      );
    }

    const textBlock = finalMessage.content.find((b) => b.type === "text");
    const html = textBlock && textBlock.type === "text" ? textBlock.text.trim() : "";

    if (!html || !/<\/html>\s*$/i.test(html)) {
      console.error("[wepacker:debrief] result document looks incomplete", {
        sessionId: input.sessionId,
        outputChars: html.length,
      });
      throw new DebriefEngineError(
        "O documento de resultado gerado parece incompleto. Tenta novamente."
      );
    }

    return html;
  }
}
