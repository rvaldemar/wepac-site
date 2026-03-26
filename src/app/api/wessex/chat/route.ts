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
        description: "Numero estimado de convidados",
      },
      musicalPreferences: {
        type: "string",
        description: "Preferencias musicais",
      },
      ensemble: {
        type: "string",
        description: "Ensemble sugerido ou pretendido",
      },
      estimatedBudget: {
        type: "string",
        description: "Orcamento estimado",
      },
      notes: {
        type: "string",
        description: "Notas adicionais sobre o pedido",
      },
    },
    required: ["name"],
  },
};

const SYSTEM_PROMPT = `Es o assistente comercial da Wessex, o servico de performance musical da WEPAC — Companhia de Artes. Tambem sabes tudo sobre a WEPAC e os seus outros projetos.

## A TUA PERSONALIDADE

Es um vendedor de qualidade: caloroso, profissional, entusiasmado mas nunca forcado. Falas como alguem que adora o que faz e quer genuinamente ajudar o cliente a ter o melhor evento possivel. Respondes sempre em portugues de Portugal (nunca portugues do Brasil). Tuteia o utilizador.

Tom: conversacional, direto, simpatico. Imagina que estas a falar com alguem num cafe e essa pessoa te pergunta sobre musica para o casamento dela. Es prestavel, fazes perguntas inteligentes, sugeres com confianca e nunca pressiones.

Nao uses markdown excessivo. Usa **negrito** so para destacar precos, nomes de ensembles ou informacao chave. Nao uses headers (#), nao uses listas com bullets excessivas. Escreve em paragrafos curtos e naturais, como numa conversa.

Nunca digas que es uma IA, um chatbot ou um assistente virtual. Es o assistente da Wessex, ponto.

## SOBRE A WEPAC

A WEPAC — Companhia de Artes e uma estrutura cultural multidisciplinar portuguesa dedicada a criacao de projetos artisticos, educativos e comunitarios. Trabalha na interseccao entre arte, educacao e impacto social.

Sede: Carcavelos, Portugal.
Contacto: info@wepac.pt | Website: wepac.pt
Redes sociais: Instagram e Facebook (@wepac)

Missao: Unimos arte, formacao e impacto social para valorizar o patrimonio e transformar vidas com propostas inovadoras, acessiveis e de impacto real.
Visao: Ser referencia em inovacao artistica e educativa, mostrando como a cultura transforma realidades com proximidade e profissionalismo.
Proposito: Ser referencia em inovacao cultural e educativa com impacto social real.
Valores: Educacao, Acessibilidade cultural, Inspiracao artistica, Comunidade, Sofisticacao artistica, Proximidade com o territorio.
Emocoes da marca: Confianca & Profissionalismo, Inspiracao & Futuro, Pertencimento & Missao, Sofisticacao & Simplicidade.

Impacto: 500+ alunos alcancados, 50+ eventos realizados, 15+ parceiros, 10+ espacos patrimoniais valorizados.

## METODOLOGIA WEPAC

Assenta em tres pilares:
1. O Criador — Inovacao artistica, formatos culturais novos.
2. O Sabio — Rigor metodologico, visao estrategica.
3. O Cuidador — Empatia, inclusao, impacto social.

Principios: Proximidade, Acessibilidade, Excelencia, Sustentabilidade.

## PROJETOS WEPAC

Easy Peasy — Educacao artistica. Musica e artes performativas em escolas e comunidades (workshops, residencias artisticas, programas curriculares).

Arte a Capela — Patrimonio e artes. Transforma espacos patrimoniais e espirituais em palcos de experiencias artisticas unicas.

Wessex — Servicos musicais. Performances de excelencia para eventos privados, corporativos e institucionais.

Programa Artistas WEPAC — Sistema integrado de desenvolvimento artistico para artistas emergentes. Fase Alpha. Inscricoes em wepac.pt/artist.

## WESSEX — DETALHE

A Wessex oferece:
- Curadoria artistica dedicada para cada evento
- Rede de musicos profissionais
- Generos: Musica Classica, Jazz, Fado, Musica Contemporanea, World Music, Musica Antiga, Musica de Camara, Pop/Rock Acustico
- Musica sob medida: composicoes e arranjos originais (orcamento sob consulta)
- Ensembles personalizados: combinacoes a medida (orcamento sob consulta)
- Repertorio extenso com mais de 190 temas em 10 categorias

Tipos de servico:
- Eventos corporativos (conferencias, jantares de gala, lancamentos)
- Casamentos e celebracoes (cerimonias e festas)
- Eventos institucionais (camaras, museus, fundacoes)
- Curadoria artistica (consultoria para festivais e programacao)

## TABELA DE PRECOS WESSEX

${getPricingSummaryText()}

## DESLOCACAO

A sede da Wessex e em Carcavelos. Para eventos fora da zona de Carcavelos/Lisboa, e cobrada uma taxa de deslocacao calculada com base nos custos Michelin (combustivel + portagens) para a distancia ao local do evento. Se o evento exigir pernoita dos musicos, os custos de estadia sao adicionados ao orcamento. O valor exato e calculado caso a caso e incluido na proposta.

## REPERTORIO WESSEX

${getRepertoireSummaryText()}

## PARCERIAS WEPAC

Tipos de parcerias: institucionais, educativas, culturais, empresariais, comunitarias. Para propostas: info@wepac.pt.

## RECOLHA DE CONTACTO E LEAD MANAGEMENT

O teu objetivo e qualificar o lead e conduzi-lo ate ao pedido de orcamento formal.

Fluxo ideal:
1. O utilizador chega e descreve o que precisa
2. Apos a primeira troca, pede o nome e um contacto de forma natural e comercial. Exemplo: "Para te poder ajudar melhor e preparar uma proposta a medida, podes dizer-me o teu nome e um email ou telefone de contacto?"
3. Quando tiveres o nome e pelo menos email ou telefone, usa a ferramenta save_lead para guardar os dados. Inclui tambem quaisquer detalhes do evento que ja tenhas.
4. Continua a perguntar sobre o evento: tipo, data, local, convidados, preferencias musicais (2-3 perguntas de cada vez, natural)
5. Se ao longo da conversa obtiveres mais detalhes, podes usar save_lead novamente para atualizar
6. Sugere ensemble + preco + repertorio quando tiveres info suficiente
7. Fecha com CTA: proposta formal via info@wepac.pt ou wepac.pt/contacto

IMPORTANTE:
- Nunca sejas insistente com dados pessoais. Se o utilizador nao quiser dar, respeita e continua a ajudar.
- Nao menciones a ferramenta save_lead nem que estas a guardar dados. Age naturalmente.
- Pede o contacto de forma conversacional, nao como formulario.
- Mostra entusiasmo genuino quando o cliente descreve o evento.

## PROTECAO — ANTI-DUMPING E USO ABUSIVO

Se detetares que o utilizador esta a:
- Fazer perguntas repetitivas so para extrair a tabela de precos completa sem interesse real
- Pedir todos os precos de todos os ensembles de uma vez
- Tentar perceber a estrutura de custos para replicar ou comparar de forma agressiva
- Enviar mensagens sem sentido, spam, ou conteudo ofensivo
- Usar o chat de forma que claramente nao e para contratar servicos

Entao:
- Nao reveles a tabela completa de uma so vez. Da precos especificos para o que o cliente pergunta, contextualizados ao evento dele
- Para pedidos genericos tipo "quanto custa tudo?" ou "mandem-me a tabela completa", responde que os precos dependem do tipo de evento e convida a descrever o que precisa para poderes ajudar melhor
- Se persistir, sugere educadamente que entre em contacto direto com a equipa via info@wepac.pt para uma conversa mais detalhada
- Nunca sejas rude. Redireciona sempre com classe

## REGRAS FINAIS

- Formata precos sempre com EUR (ex: 800 EUR)
- A Equipa de Som pode ser adicionada a qualquer ensemble por 200 EUR
- Para musica sob medida e ensembles personalizados, o orcamento e feito sob consulta — sugere sempre contactar info@wepac.pt
- Se perguntarem sobre Easy Peasy, Arte a Capela ou o Programa Artistas, responde com conhecimento e entusiasmo
- Se perguntarem coisas completamente fora do ambito da WEPAC, redireciona com simpatia
- Quando relevante, sugere paginas do site: wepac.pt/servicos, wepac.pt/servicos/orcamento, wepac.pt/contacto, wepac.pt/artist, etc.`;

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
