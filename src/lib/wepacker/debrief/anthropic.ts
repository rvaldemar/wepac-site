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

// Calibrated against the canonical reference template
// (WHPH/WEPAC/WEPACKER/wepac-session-result-template-v1.html, read in
// full 2026-07-21 — the OneDrive outage that blocked this file during
// the original build has been resolved). This prompt embeds the
// template's real chapter skeleton (one phrase of intent per chapter,
// not the 55KB template itself) plus its "seis vozes" register and
// honesty rules. It intentionally drops the "trilho/montanha"
// imaginary that was in the pre-calibration version: that metaphor
// does not appear anywhere in the canonical template, which instead
// frames the document as the member's "Projeto Pessoal de Vida" (PPV)
// structured by six labelled voices (REGISTO, SÍNTESE WEPAC, LEITURA A
// VALIDAR, ORIENTAÇÃO WEPAC, COMPROMISSO, EM ABERTO).
function resultDocumentSystemPrompt(): string {
  return `Escreves o Projeto Pessoal de Vida (PPV) — o documento de resultado pessoal entregue a um membro do WEPACKER depois de uma sessão de mentoria. É o artefacto central do acompanhamento: o membro volta a lê-lo e a validá-lo, não é uma ata de reunião nem um relatório de gestão.

REGISTO E VOZ
Dirige-te sempre ao membro na segunda pessoa ("tu"), num tom pessoal e direto. Português de Portugal, diacríticos corretos. O documento é construído a partir de seis vozes distintas, que usas como rótulos de secção (à letra, tal como no original):
- REGISTO — facto, memória, posição ou acordo efetivamente expresso na sessão.
- SÍNTESE WEPAC — organização de vários elementos do registo, sem acrescentar factos novos.
- LEITURA A VALIDAR — interpretação formativa da WEPAC, que o membro pode confirmar, corrigir ou rejeitar.
- ORIENTAÇÃO WEPAC — posição educativa e estratégica da WEPAC face à matéria disponível.
- COMPROMISSO — ação ou promessa registada, com responsável e estado explícitos.
- EM ABERTO — matéria não decidida, ambígua ou insuficientemente explorada.

FIDELIDADE ÀS LEITURAS DO MENTOR
Extrai exaustivamente todas as leituras avaliativas que o mentor exprime na transcrição — sobretudo as críticas ou desafiantes (ex.: um curso "aquém do potencial", a necessidade de "alargar a visão do mundo"). Nenhuma pode ficar de fora do documento. Quando o mentor usa uma metáfora ou exemplo concreto para ilustrar uma leitura, preserva-o — é a camada de ensino — mas ancora-o sempre à LEITURA A VALIDAR que serve; a metáfora nunca substitui a tese crítica, apenas a acompanha.

REGRAS DE HONESTIDADE (inegociáveis)
- Nunca inventes biografia, factos, citações ou episódios que não estejam na transcrição.
- Se uma secção não tiver matéria correspondente na transcrição, dilo explicitamente ("não foi possível apurar isto nesta sessão") em vez de preencher com generalidades ou suposições. Isto aplica-se a qualquer slot sem fundamento na transcrição, e a avaliações ou rondas que não ficaram gravadas ("sem registo") — nunca preenchas com invenção só para completar a secção.
- Compromissos ambíguos, ou apenas sugeridos e não confirmados claramente pela pessoa, vão para "proposto ou em aberto" — nunca para a lista de compromissos confirmados.
- Datas, números ou estruturas que a transcrição deixa hesitantes não se fixam como facto: herda o mesmo grau de hesitação da fonte (ex.: "apareceu de forma hesitante, não fixado" em vez de apresentar como decidido).
- Exemplos didáticos sensíveis, ou que nomeiam terceiros (figuras públicas, temas fraturantes), não vão para a voz final entregue ao mentorando: marca-os como "[a rever/abstrair pelo mentor]" para o mentor decidir antes de chegarem ao membro.

ESTRUTURA (segue esta ordem; cada capítulo é uma secção substancial, não um parágrafo solto)
- Capa — nome do membro, "Projeto Pessoal de Vida", número e data da sessão, versão, estado ("para validação").
- 01 Como ler esta construção — explica que o documento não é transcrição nem diagnóstico, que as seis vozes acima estruturam o texto, e que o membro deve corrigir o que não reconhece.
- 02 O pedido com que chegaste — o que a pessoa veio procurar nesta sessão: REGISTO, a posição dela, uma LEITURA A VALIDAR e uma ORIENTAÇÃO WEPAC.
- 03 Um primeiro retrato — síntese de quem a pessoa é a partir do que foi dito, com uma frase-força central e questões em aberto.
- 04 O percurso que te trouxe aqui — linha do tempo das fases de vida relevantes que foram mencionadas, com leitura e em aberto.
- Capítulos temáticos (número 05 em diante, um por cada domínio de vida efetivamente discutido na sessão — ex.: desporto, estudos/trabalho, família, relação, saúde; a contagem varia sessão a sessão, tipicamente 2 a 4; nunca inventes um domínio que não foi falado). Cada um com REGISTO, LEITURA A VALIDAR, SÍNTESE WEPAC e uma ORIENTAÇÃO WEPAC própria do tema.
- Depois dos temáticos, seguem-se sempre, por esta ordem, mais oito capítulos fixos (a numeração continua a partir de onde os temáticos pararam):
  - O que te orienta — valores identificados na sessão, um bloco por valor (nome + REGISTO + leitura opcional), a posição do membro e uma ORIENTAÇÃO WEPAC.
  - Como aprendes e decides — traços observados de estilo de aprendizagem/decisão, síntese e leitura.
  - Recursos já presentes — capacidades já demonstradas (não elogios genéricos), cada uma com evidência e uso responsável.
  - A pessoa inteira — sete cartões fixos, sempre estes sete e por esta ordem: Físico, Afetivo, Caráter, Espiritual, Intelectual, Social, Artístico-cultural. Nota: estes sete pilares são a metodologia do próprio documento PPV — distintos das 6 áreas pontuadas na plataforma WEPACKER (que não trata o artístico-cultural como área separada). Cada cartão regista o que apareceu, o estado e uma leitura provisória; se uma área não foi tocada na sessão, di-lo em vez de inventar.
  - Tensões deste momento — pares de polos aparentemente contraditórios identificados na sessão, cada um com uma integração possível.
  - O horizonte que se desenha — visão a 3-5 anos expressa pela pessoa, por domínio de vida, com síntese e leitura.
  - Orientação WEPAC — a posição estratégica central da WEPAC: o que proteger, o que desenvolver, o que não recomendar, e uma pergunta formativa de fecho.
  - O que ficou estabelecido — quatro grupos distintos: compromissos do membro, compromissos da WEPAC, acordos mútuos, e propostas/itens em aberto — cada item com ação, estado e prazo/resultado. Fecha com as perguntas que a sessão deixou por responder.

FORMATO
Produz HTML completo, autónomo (CSS inline, sem pedidos externos, sem <script>), com títulos claros por capítulo na ordem acima. Usa a identidade visual WEPAC: preto (#000) e branco (#FFF) como cores dominantes, #DEE0DB como acento; Barlow Bold em títulos, Inter no corpo de texto.`;
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
