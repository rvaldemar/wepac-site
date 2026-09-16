import Anthropic from "@anthropic-ai/sdk";
import { getPricingSummaryText } from "@/data/wessex-pricing";
import { getRepertoireSummaryText } from "@/data/wessex-repertoire";
import { saveLead } from "@/lib/leads";
import {
  getChatEngine,
  ChatEngineError,
  type ChatEngine,
} from "@/lib/wessex/chat-engine";
import type {
  ChatErrorCode,
  ChatPublicError,
  ChatStreamEvent,
} from "@/lib/wessex/chat-contract";
import { getVisitorIp, visitorRateLimiter } from "@/lib/wessex/rate-limit";
import {
  isWessexOperationalAlertCode,
  wessexOperationalAlerter,
} from "@/lib/wessex/operational-alert";
import { logSafeError } from "@/lib/wepacker/log-safe-error";

const SAVE_LEAD_TOOL: Anthropic.Tool = {
  name: "save_lead",
  description:
    "Guarda os dados de contacto e detalhes do evento do potencial cliente. Usa quando tiveres pelo menos o nome e email ou telefone do cliente.",
  input_schema: {
    type: "object" as const,
    properties: {
      name: { type: "string", description: "Nome do cliente" },
      email: { type: "string", description: "Email do cliente" },
      phone: { type: "string", description: "Telefone do cliente" },
      eventType: {
        type: "string",
        description: "Tipo de evento (casamento, corporativo, etc.)",
      },
      eventDate: {
        type: "string",
        description: "Data aproximada do evento",
      },
      location: { type: "string", description: "Local do evento" },
      guestCount: {
        type: "number",
        description: "Número estimado de convidados",
      },
      musicalPreferences: {
        type: "string",
        description: "Preferências musicais",
      },
      ensemble: {
        type: "string",
        description: "Ensemble sugerido ou pretendido",
      },
      estimatedBudget: {
        type: "string",
        description: "Orçamento estimado",
      },
      notes: {
        type: "string",
        description: "Notas adicionais sobre o pedido",
      },
    },
    required: ["name"],
  },
};

const SYSTEM_PROMPT = `És o assistente comercial da Wessex, o serviço de performance musical da WEPAC. Também sabes tudo sobre a WEPAC e os seus outros projetos.

## A TUA PERSONALIDADE

És um vendedor de qualidade: caloroso, profissional, entusiasmado mas nunca forçado. Falas como alguém que adora o que faz e quer genuinamente ajudar o cliente a ter o melhor evento possível. Respondes sempre em português de Portugal (nunca português do Brasil). Tuteia o utilizador.

Tom: conversacional, direto, simpático. Imagina que estás a falar com alguém num café e essa pessoa te pergunta sobre música para o casamento dela. És prestável, fazes perguntas inteligentes, sugeres com confiança e nunca pressiones.

Não uses markdown excessivo. Usa **negrito** só para destacar preços, nomes de ensembles ou informação chave. Não uses headers (#), não uses listas com bullets excessivas. Escreve em parágrafos curtos e naturais, como numa conversa.

Nunca digas que és uma IA, um chatbot ou um assistente virtual. És o assistente da Wessex, ponto.

## SOBRE A WEPAC

A WEPAC é uma estrutura cultural multidisciplinar portuguesa dedicada à criação de projetos artísticos, educativos e comunitários. Trabalha na interseção entre arte, educação e impacto social.

Sede: Carcavelos, Portugal.
Contacto: info@wepac.pt | Website: wepac.pt
Redes sociais: Instagram e Facebook (@wepac)

Missão: Unimos arte, formação e impacto social para valorizar o património e transformar vidas com propostas inovadoras, acessíveis e de impacto real.
Visão: Ser referência em inovação artística e educativa, mostrando como a cultura transforma realidades com proximidade e profissionalismo.
Propósito: Ser referência em inovação cultural e educativa com impacto social real.
Valores: Educação, Acessibilidade cultural, Inspiração artística, Comunidade, Sofisticação artística, Proximidade com o território.
Emoções da marca: Confiança & Profissionalismo, Inspiração & Futuro, Pertença & Missão, Sofisticação & Simplicidade.

Impacto: 500+ alunos alcançados, 50+ eventos realizados, 15+ parceiros, 10+ espaços patrimoniais valorizados.

## METODOLOGIA WEPAC

Expressa-se através de três arquétipos de marca (não são os Six Pillars do WEPACKER):
1. O Criador — Inovação artística, formatos culturais novos.
2. O Sábio — Rigor metodológico, visão estratégica.
3. O Cuidador — Empatia, inclusão, impacto social.

Princípios: Proximidade, Acessibilidade, Excelência, Sustentabilidade.

## PROJETOS WEPAC

Easy Peasy — Educação artística. Música e artes performativas em escolas e comunidades (workshops, residências artísticas, programas curriculares).

Arte à Capela — Património e artes. Transforma espaços patrimoniais e espirituais em palcos de experiências artísticas únicas.

Wessex — Serviços musicais. Performances de excelência para eventos privados, corporativos e institucionais.

WEPAC for Artists — A Discipline Arts dentro da My Journey WEPAC. A Person mantém o seu Life Map, Trails, Goals, Actions e Sessions. Packs são Communities; Academy organiza Cycles com duração definida; Mentorship é uma Relationship consentida. Candidaturas em wepac.pt/artist.

## WESSEX — DETALHE

A Wessex oferece:
- Curadoria artística dedicada para cada evento
- Rede de músicos profissionais
- Géneros: Música Clássica, Jazz, Fado, Música Contemporânea, World Music, Música Antiga, Música de Câmara, Pop/Rock Acústico
- Música sob medida: composições e arranjos originais (orçamento sob consulta)
- Ensembles personalizados: combinações à medida (orçamento sob consulta)
- Repertório extenso com mais de 190 temas em 10 categorias

Tipos de serviço:
- Eventos corporativos (conferências, jantares de gala, lançamentos)
- Casamentos e celebrações (cerimónias e festas)
- Eventos institucionais (câmaras, museus, fundações)
- Curadoria artística (consultoria para festivais e programação)

## TABELA DE PREÇOS WESSEX

${getPricingSummaryText()}

## DESLOCAÇÃO

A sede da Wessex é em Carcavelos. Para eventos fora da zona de Carcavelos/Lisboa, é cobrada uma taxa de deslocação calculada com base nos custos Michelin (combustível + portagens) para a distância ao local do evento. Se o evento exigir pernoita dos músicos, os custos de estadia são adicionados ao orçamento. O valor exato é calculado caso a caso e incluído na proposta.

## REPERTÓRIO WESSEX

${getRepertoireSummaryText()}

## PARCERIAS WEPAC

Tipos de parcerias: institucionais, educativas, culturais, empresariais, comunitárias. Para propostas: info@wepac.pt.

## RECOLHA DE CONTACTO E LEAD MANAGEMENT

O teu objetivo é qualificar o lead e conduzi-lo até ao pedido de orçamento formal.

Fluxo ideal:
1. O utilizador chega e descreve o que precisa
2. Após a primeira troca, pede o nome e um contacto de forma natural e comercial. Exemplo: "Para te poder ajudar melhor e preparar uma proposta à medida, podes dizer-me o teu nome e um email ou telefone de contacto?"
3. Quando tiveres o nome e pelo menos email ou telefone, usa a ferramenta save_lead para guardar os dados. Inclui também quaisquer detalhes do evento que já tenhas.
4. Continua a perguntar sobre o evento: tipo, data, local, convidados, preferências musicais (2-3 perguntas de cada vez, natural)
5. Se ao longo da conversa obtiveres mais detalhes, podes usar save_lead novamente para atualizar
6. Sugere ensemble + preço + repertório quando tiveres info suficiente
7. Fecha com CTA: proposta formal via info@wepac.pt ou wepac.pt/contacto

IMPORTANTE:
- Nunca sejas insistente com dados pessoais. Se o utilizador não quiser dar, respeita e continua a ajudar.
- Não menciones a ferramenta save_lead nem que estás a guardar dados. Age naturalmente.
- Pede o contacto de forma conversacional, não como formulário.
- Mostra entusiasmo genuíno quando o cliente descreve o evento.

## PROTEÇÃO — ANTI-DUMPING E USO ABUSIVO

Se detetares que o utilizador está a:
- Fazer perguntas repetitivas só para extrair a tabela de preços completa sem interesse real
- Pedir todos os preços de todos os ensembles de uma vez
- Tentar perceber a estrutura de custos para replicar ou comparar de forma agressiva
- Enviar mensagens sem sentido, spam, ou conteúdo ofensivo
- Usar o chat de forma que claramente não é para contratar serviços

Então:
- Não reveles a tabela completa de uma só vez. Dá preços específicos para o que o cliente pergunta, contextualizados ao evento dele
- Para pedidos genéricos tipo "quanto custa tudo?" ou "mandem-me a tabela completa", responde que os preços dependem do tipo de evento e convida a descrever o que precisa para poderes ajudar melhor
- Se persistir, sugere educadamente que entre em contacto direto com a equipa via info@wepac.pt para uma conversa mais detalhada
- Nunca sejas rude. Redireciona sempre com classe

## REGRAS FINAIS

- Formata preços sempre com EUR (ex: 800 EUR)
- A Equipa de Som pode ser adicionada a qualquer ensemble por 200 EUR
- Para música sob medida e ensembles personalizados, o orçamento é feito sob consulta — sugere sempre contactar info@wepac.pt
- Se perguntarem sobre Easy Peasy, Arte à Capela ou WEPAC for Artists, responde com conhecimento e entusiasmo
- Se perguntarem coisas completamente fora do âmbito da WEPAC, redireciona com simpatia
- Quando relevante, sugere páginas do site: wepac.pt/servicos, wepac.pt/servicos/orcamento, wepac.pt/contacto, wepac.pt/artist, etc.`;

const PUBLIC_ERROR_MESSAGES: Record<ChatErrorCode, string> = {
  rate_limited: "Atingiste temporariamente o limite de mensagens. Espera um pouco antes de tentares novamente.",
  configuration: "O assistente não está disponível devido a uma configuração do serviço.",
  upstream_auth: "O assistente não está disponível devido a uma ligação do serviço.",
  upstream_unavailable: "O assistente está temporariamente indisponível.",
  invalid_response: "O assistente recebeu uma resposta que não conseguiu processar.",
  stream_failed: "A resposta do assistente foi interrompida.",
};

const ERROR_STATUSES: Record<ChatErrorCode, number> = {
  rate_limited: 429,
  configuration: 503,
  upstream_auth: 502,
  upstream_unavailable: 503,
  invalid_response: 502,
  stream_failed: 502,
};

const MAX_MESSAGES = 24;
const MAX_MESSAGE_LENGTH = 4_000;
const MAX_TOTAL_MESSAGE_LENGTH = 24_000;
const MAX_REQUEST_BYTES = 64 * 1024;
const MAX_TOOL_TURNS = 1;

function publicError(code: ChatErrorCode, retryAfter?: number): ChatPublicError {
  return {
    code,
    message: PUBLIC_ERROR_MESSAGES[code],
    ...(code === "rate_limited" ? { retryAfter: retryAfter ?? 60 } : {}),
  };
}

function errorResponse(
  code: ChatErrorCode,
  options?: { retryAfter?: number; status?: number },
): Response {
  const error = publicError(code, options?.retryAfter);
  return Response.json(
    { error },
    {
      status: options?.status ?? ERROR_STATUSES[code],
      headers:
        error.retryAfter === undefined
          ? undefined
          : { "Retry-After": String(error.retryAfter) },
    },
  );
}

function classifyError(error: unknown): ChatEngineError {
  return error instanceof ChatEngineError
    ? error
    : new ChatEngineError("stream_failed", "Unhandled chat failure", undefined, {
        cause: error,
      });
}

function logChatFailure(
  error: unknown,
  phase: "configuration" | "pre_stream" | "stream",
  engine?: ChatEngine,
) {
  const classified = classifyError(error);
  console.error("[wessex chat] request_failed", {
    code: classified.code,
    phase,
    engine: engine?.name ?? "unselected",
    ...logSafeError(error),
  });
  if (isWessexOperationalAlertCode(classified.code)) {
    void wessexOperationalAlerter
      .record(classified.code)
      .catch((alertError) => {
        console.error("[wessex alert] enqueue_failed", {
          code: classified.code,
          ...logSafeError(alertError),
        });
      });
  }
  return classified;
}

function isValidRequestBody(
  body: unknown,
): body is { messages: Anthropic.MessageParam[]; consentGiven?: boolean } {
  if (!body || typeof body !== "object") return false;
  const { messages, consentGiven } = body as Record<string, unknown>;
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > MAX_MESSAGES) {
    return false;
  }
  let totalLength = 0;
  return (
    messages.every(
      (message) => {
        if (message === null || typeof message !== "object") return false;
        const candidate = message as Record<string, unknown>;
        if (!["user", "assistant"].includes(String(candidate.role))) return false;
        if (typeof candidate.content !== "string") return false;
        if (candidate.content.length === 0 || candidate.content.length > MAX_MESSAGE_LENGTH) {
          return false;
        }
        totalLength += candidate.content.length;
        return totalLength <= MAX_TOTAL_MESSAGE_LENGTH;
      },
    ) &&
    (consentGiven === undefined || typeof consentGiven === "boolean")
  );
}

async function* runConversation(
  engine: ChatEngine,
  messages: Anthropic.MessageParam[],
  consentGiven: boolean,
): AsyncGenerator<ChatStreamEvent> {
  let currentMessages = [...messages];
  let continueLoop = true;
  let toolTurns = 0;

  while (continueLoop) {
    let toolUseId = "";
    let toolUseName = "";
    let toolInputJson = "";
    let hasToolUse = false;
    let stopReason: string | null = null;
    let finalContent: Anthropic.MessageParam["content"] = [];

    for await (const event of engine.runTurn({
      system: SYSTEM_PROMPT,
      tools: [SAVE_LEAD_TOOL],
      messages: currentMessages,
    })) {
      if (event.type === "text_delta") {
        yield { type: "delta", text: event.text };
      }
      if (event.type === "tool_use") {
        hasToolUse = true;
        toolUseId = event.id;
        toolUseName = event.name;
        toolInputJson = event.inputJson;
      }
      if (event.type === "stop") {
        stopReason = event.stopReason;
        finalContent = event.content;
      }
    }

    if (stopReason === "tool_use" && hasToolUse && toolUseName === "save_lead") {
      if (toolTurns >= MAX_TOOL_TURNS) {
        throw new ChatEngineError("invalid_response", "Tool turn limit exceeded");
      }
      toolTurns += 1;
      let toolResult = '{"success": true}';
      try {
        const input = JSON.parse(toolInputJson);
        await saveLead({
          ...input,
          conversationHistory: currentMessages,
          consentGiven,
        });
      } catch (error) {
        console.error("[wessex chat] save_lead_failed", logSafeError(error));
        toolResult = '{"success": false, "error": "Failed to save"}';
      }

      currentMessages = [
        ...currentMessages,
        { role: "assistant", content: finalContent },
        {
          role: "user",
          content: [
            {
              type: "tool_result",
              tool_use_id: toolUseId,
              content: toolResult,
            },
          ],
        },
      ];
    } else {
      continueLoop = false;
    }
  }

  yield { type: "done" };
}

function encodeNdjson(event: ChatStreamEvent): Uint8Array {
  return new TextEncoder().encode(`${JSON.stringify(event)}\n`);
}

export async function POST(req: Request) {
  const contentLength = Number(req.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
    return errorResponse("invalid_response", { status: 413 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    console.warn("[wessex chat] request_rejected", {
      code: "invalid_response",
      phase: "request_validation",
    });
    return errorResponse("invalid_response", { status: 400 });
  }
  if (!isValidRequestBody(body)) {
    console.warn("[wessex chat] request_rejected", {
      code: "invalid_response",
      phase: "request_validation",
    });
    return errorResponse("invalid_response", { status: 400 });
  }

  // Invalid requests do not consume a visitor's quota. Valid requests are
  // limited identically regardless of the engine selected below.
  const visitorIp = getVisitorIp(req);
  const rateLimitResult = await visitorRateLimiter.check(visitorIp);
  if (!rateLimitResult.allowed) {
    const unavailable = rateLimitResult.reason === "unavailable";
    console.warn("[wessex chat] request_rejected", {
      code: unavailable ? "upstream_unavailable" : "rate_limited",
      phase: "rate_limit",
    });
    return unavailable
      ? errorResponse("upstream_unavailable", { status: 503 })
      : errorResponse("rate_limited", {
          retryAfter: rateLimitResult.retryAfterSeconds,
        });
  }

  let engine: ChatEngine;
  try {
    engine = getChatEngine();
  } catch (err) {
    const classified = logChatFailure(err, "configuration");
    return errorResponse(classified.code, { retryAfter: classified.retryAfter });
  }

  const events = runConversation(engine, body.messages, body.consentGiven ?? false);
  let first: IteratorResult<ChatStreamEvent>;
  try {
    first = await events.next();
  } catch (error) {
    const classified = logChatFailure(error, "pre_stream", engine);
    return errorResponse(classified.code, { retryAfter: classified.retryAfter });
  }

  return new Response(
    new ReadableStream({
      async start(controller) {
        try {
          if (!first.done) controller.enqueue(encodeNdjson(first.value));
          for await (const event of events) {
            controller.enqueue(encodeNdjson(event));
          }
          controller.close();
        } catch (error) {
          logChatFailure(error, "stream", engine);
          controller.enqueue(
            encodeNdjson({
              type: "error",
              error: publicError("stream_failed"),
            }),
          );
          controller.close();
        }
      },
    }),
    {
      headers: {
        "Content-Type": "application/x-ndjson; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Accel-Buffering": "no",
      },
    },
  );
}
