import Anthropic from "@anthropic-ai/sdk";
import { getPricingSummaryText } from "@/data/wessex-pricing";
import { getRepertoireSummaryText } from "@/data/wessex-repertoire";
import { saveLead } from "@/lib/leads";

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

const SYSTEM_PROMPT = `És o assistente comercial da Wessex, o serviço de performance musical da WEPAC — Companhia de Artes. Também sabes tudo sobre a WEPAC e os seus outros projetos.

## A TUA PERSONALIDADE

És um vendedor de qualidade: caloroso, profissional, entusiasmado mas nunca forçado. Falas como alguém que adora o que faz e quer genuinamente ajudar o cliente a ter o melhor evento possível. Respondes sempre em português de Portugal (nunca português do Brasil). Tuteia o utilizador.

Tom: conversacional, direto, simpático. Imagina que estás a falar com alguém num café e essa pessoa te pergunta sobre música para o casamento dela. És prestável, fazes perguntas inteligentes, sugeres com confiança e nunca pressiones.

Não uses markdown excessivo. Usa **negrito** só para destacar preços, nomes de ensembles ou informação chave. Não uses headers (#), não uses listas com bullets excessivas. Escreve em parágrafos curtos e naturais, como numa conversa.

Nunca digas que és uma IA, um chatbot ou um assistente virtual. És o assistente da Wessex, ponto.

## SOBRE A WEPAC

A WEPAC — Companhia de Artes é uma estrutura cultural multidisciplinar portuguesa dedicada à criação de projetos artísticos, educativos e comunitários. Trabalha na interseção entre arte, educação e impacto social.

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

Assenta em três pilares:
1. O Criador — Inovação artística, formatos culturais novos.
2. O Sábio — Rigor metodológico, visão estratégica.
3. O Cuidador — Empatia, inclusão, impacto social.

Princípios: Proximidade, Acessibilidade, Excelência, Sustentabilidade.

## PROJETOS WEPAC

Easy Peasy — Educação artística. Música e artes performativas em escolas e comunidades (workshops, residências artísticas, programas curriculares).

Arte à Capela — Património e artes. Transforma espaços patrimoniais e espirituais em palcos de experiências artísticas únicas.

Wessex — Serviços musicais. Performances de excelência para eventos privados, corporativos e institucionais.

Programa Artistas WEPAC — Sistema integrado de desenvolvimento artístico para artistas emergentes. Fase Alpha. Inscrições em wepac.pt/artist.

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
- Se perguntarem sobre Easy Peasy, Arte à Capela ou o Programa Artistas, responde com conhecimento e entusiasmo
- Se perguntarem coisas completamente fora do âmbito da WEPAC, redireciona com simpatia
- Quando relevante, sugere páginas do site: wepac.pt/servicos, wepac.pt/servicos/orcamento, wepac.pt/contacto, wepac.pt/artist, etc.`;

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === "your_anthropic_api_key_here") {
    return new Response("Anthropic API key not configured", { status: 500 });
  }

  const client = new Anthropic({ apiKey });
  const { messages, consentGiven } = await req.json();

  const encoder = new TextEncoder();

  return new Response(
    new ReadableStream({
      async start(controller) {
        try {
          let currentMessages = [...messages];
          let continueLoop = true;

          while (continueLoop) {
            const stream = await client.messages.stream({
              model: "claude-haiku-4-5-20251001",
              max_tokens: 1024,
              system: SYSTEM_PROMPT,
              tools: [SAVE_LEAD_TOOL],
              messages: currentMessages,
            });

            let toolUseId = "";
            let toolUseName = "";
            let toolInputJson = "";
            let hasToolUse = false;

            for await (const event of stream) {
              if (
                event.type === "content_block_delta" &&
                event.delta.type === "text_delta"
              ) {
                controller.enqueue(encoder.encode(event.delta.text));
              }
              if (
                event.type === "content_block_start" &&
                event.content_block.type === "tool_use"
              ) {
                hasToolUse = true;
                toolUseId = event.content_block.id;
                toolUseName = event.content_block.name;
                toolInputJson = "";
              }
              if (
                event.type === "content_block_delta" &&
                event.delta.type === "input_json_delta"
              ) {
                toolInputJson += event.delta.partial_json;
              }
            }

            const finalMessage = await stream.finalMessage();

            if (
              finalMessage.stop_reason === "tool_use" &&
              hasToolUse &&
              toolUseName === "save_lead"
            ) {
              // Execute save_lead tool server-side
              let toolResult = '{"success": true}';
              try {
                const input = JSON.parse(toolInputJson);
                await saveLead({
                  ...input,
                  conversationHistory: currentMessages,
                  consentGiven: consentGiven ?? false,
                });
              } catch (e) {
                console.error("save_lead tool error:", e);
                toolResult = '{"success": false, "error": "Failed to save"}';
              }

              // Add assistant response + tool result for continuation
              currentMessages = [
                ...currentMessages,
                { role: "assistant" as const, content: finalMessage.content },
                {
                  role: "user" as const,
                  content: [
                    {
                      type: "tool_result" as const,
                      tool_use_id: toolUseId,
                      content: toolResult,
                    },
                  ],
                },
              ];
              // Loop continues -- Claude will generate text after tool result
            } else {
              continueLoop = false;
            }
          }

          controller.close();
        } catch (error: unknown) {
          console.error("Chat API error:", error);
          controller.enqueue(
            encoder.encode(
              "\n\nDesculpa, ocorreu um erro. Tenta novamente ou contacta-nos em info@wepac.pt."
            )
          );
          controller.close();
        }
      },
    }),
    { headers: { "Content-Type": "text/plain; charset=utf-8" } }
  );
}
