import Anthropic from "@anthropic-ai/sdk";
import { getPricingSummaryText } from "@/data/wessex-pricing";

const SYSTEM_PROMPT = `Tu es o assistente de orcamentos da Wessex, o servico de performance musical da WEPAC — Companhia de Artes. Respondes sempre em portugues de Portugal (nunca portugues do Brasil).

${getPricingSummaryText()}

Regras:
- Se simpático, profissional e conciso.
- Quando o utilizador descrever o evento, sugere o ensemble mais adequado e apresenta o preco.
- Para pedidos que saiam da tabela (combinacoes especiais, duracoes diferentes, etc.), da uma estimativa e sugere contactar info@wepac.pt para confirmacao.
- Nao inventes precos que nao estejam na tabela.
- Formata os precos sempre com o simbolo €.
- Se o utilizador perguntar sobre eventos fora de Lisboa, informa que ha taxa de deslocacao adicional (valor a confirmar com a equipa).
- A Equipa de Som pode ser adicionada a qualquer ensemble por 200€ extra.
- Responde apenas a questoes sobre servicos musicais Wessex. Se o utilizador perguntar sobre outros assuntos, redireciona educadamente para os servicos musicais.`;

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === "your_anthropic_api_key_here") {
    return new Response("Anthropic API key not configured", { status: 500 });
  }

  const client = new Anthropic({ apiKey });
  const { messages } = await req.json();

  const stream = await client.messages.stream({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages,
  });

  return new Response(
    new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        controller.close();
      },
    }),
    { headers: { "Content-Type": "text/plain; charset=utf-8" } }
  );
}
