import { Metadata } from "next";
import { FadeIn } from "@/components/FadeIn";

export const metadata: Metadata = {
  title: "Politica de Privacidade",
  description: "Politica de privacidade e protecao de dados da WEPAC.",
};

export default function PrivacidadePage() {
  return (
    <div className="pt-20">
      <section className="bg-wepac-black px-6 py-16 md:py-24 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <FadeIn>
            <h1 className="font-barlow text-3xl font-bold text-wepac-white md:text-5xl">
              Politica de Privacidade
            </h1>
            <p className="mt-4 text-sm text-wepac-white/40">
              Ultima atualizacao: 26 de marco de 2026
            </p>
          </FadeIn>
        </div>
      </section>

      <section className="bg-wepac-dark px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-3xl space-y-10 text-sm leading-relaxed text-wepac-white/70">
          <div>
            <h2 className="font-barlow text-lg font-bold text-wepac-white">
              1. Responsavel pelo tratamento
            </h2>
            <p className="mt-3">
              WEPAC — Companhia de Artes, com sede em Carcavelos, Portugal.
              Contacto para questoes de privacidade:{" "}
              <a href="mailto:info@wepac.pt" className="text-wepac-gray underline">
                info@wepac.pt
              </a>
            </p>
          </div>

          <div>
            <h2 className="font-barlow text-lg font-bold text-wepac-white">
              2. Dados que recolhemos
            </h2>
            <p className="mt-3">
              Recolhemos os seguintes dados pessoais quando utilizas os nossos
              servicos:
            </p>
            <ul className="mt-2 ml-4 space-y-1 list-disc text-wepac-white/60">
              <li>
                <strong className="text-wepac-white/80">Assistente Wessex (chat):</strong>{" "}
                nome, email, telefone, detalhes do evento, historico da
                conversa
              </li>
              <li>
                <strong className="text-wepac-white/80">Formulario de contacto:</strong>{" "}
                nome, email, assunto, mensagem
              </li>
              <li>
                <strong className="text-wepac-white/80">Programa Artistas:</strong>{" "}
                email para lista de espera
              </li>
              <li>
                <strong className="text-wepac-white/80">Cookies:</strong>{" "}
                cookies essenciais para funcionamento do site
              </li>
            </ul>
          </div>

          <div>
            <h2 className="font-barlow text-lg font-bold text-wepac-white">
              3. Finalidade do tratamento
            </h2>
            <p className="mt-3">Os dados sao utilizados para:</p>
            <ul className="mt-2 ml-4 space-y-1 list-disc text-wepac-white/60">
              <li>
                Responder a pedidos de orcamento e informacao comercial
              </li>
              <li>Preparar propostas personalizadas de servicos musicais</li>
              <li>Contactar potenciais clientes para seguimento comercial</li>
              <li>Gerir inscricoes no Programa Artistas</li>
              <li>Melhorar a qualidade dos nossos servicos</li>
            </ul>
          </div>

          <div>
            <h2 className="font-barlow text-lg font-bold text-wepac-white">
              4. Base legal
            </h2>
            <p className="mt-3">
              O tratamento dos dados baseia-se no consentimento explicito do
              titular (artigo 6.o, n.o 1, alinea a) do RGPD), obtido antes da
              recolha de dados no assistente Wessex e nos formularios do site.
            </p>
          </div>

          <div>
            <h2 className="font-barlow text-lg font-bold text-wepac-white">
              5. Periodo de conservacao
            </h2>
            <p className="mt-3">
              Os dados pessoais sao conservados pelo periodo necessario para a
              finalidade para que foram recolhidos, nao excedendo 24 meses apos
              o ultimo contacto. Os dados podem ser eliminados a qualquer
              momento mediante pedido do titular.
            </p>
          </div>

          <div>
            <h2 className="font-barlow text-lg font-bold text-wepac-white">
              6. Direitos do titular
            </h2>
            <p className="mt-3">Tens o direito de:</p>
            <ul className="mt-2 ml-4 space-y-1 list-disc text-wepac-white/60">
              <li>
                <strong className="text-wepac-white/80">Acesso</strong> — saber
                que dados temos sobre ti
              </li>
              <li>
                <strong className="text-wepac-white/80">Retificacao</strong> —
                corrigir dados incorretos
              </li>
              <li>
                <strong className="text-wepac-white/80">Apagamento</strong> —
                pedir a eliminacao dos teus dados
              </li>
              <li>
                <strong className="text-wepac-white/80">Portabilidade</strong> —
                receber os teus dados em formato estruturado
              </li>
              <li>
                <strong className="text-wepac-white/80">Oposicao</strong> —
                opor-te ao tratamento dos teus dados
              </li>
              <li>
                <strong className="text-wepac-white/80">
                  Retirada de consentimento
                </strong>{" "}
                — a qualquer momento
              </li>
            </ul>
            <p className="mt-3">
              Para exercer qualquer destes direitos, contacta-nos em{" "}
              <a href="mailto:info@wepac.pt" className="text-wepac-gray underline">
                info@wepac.pt
              </a>
              .
            </p>
          </div>

          <div>
            <h2 className="font-barlow text-lg font-bold text-wepac-white">
              7. Partilha de dados
            </h2>
            <p className="mt-3">
              Nao partilhamos os teus dados pessoais com terceiros, exceto
              quando necessario para a prestacao dos servicos contratados ou
              quando exigido por lei. Utilizamos a API da Anthropic (Claude)
              para o assistente Wessex — as mensagens sao processadas para
              gerar respostas mas nao sao armazenadas pela Anthropic apos o
              processamento.
            </p>
          </div>

          <div>
            <h2 className="font-barlow text-lg font-bold text-wepac-white">
              8. Cookies
            </h2>
            <p className="mt-3">
              O site utiliza apenas cookies essenciais para o funcionamento
              tecnico (autenticacao, preferencias). Nao utilizamos cookies de
              rastreamento ou publicidade. O consentimento para cookies e
              solicitado na primeira visita.
            </p>
          </div>

          <div>
            <h2 className="font-barlow text-lg font-bold text-wepac-white">
              9. Seguranca
            </h2>
            <p className="mt-3">
              Implementamos medidas tecnicas e organizativas adequadas para
              proteger os dados pessoais contra acesso nao autorizado,
              alteracao, divulgacao ou destruicao. As comunicacoes sao
              encriptadas via HTTPS.
            </p>
          </div>

          <div>
            <h2 className="font-barlow text-lg font-bold text-wepac-white">
              10. Reclamacoes
            </h2>
            <p className="mt-3">
              Se considerares que o tratamento dos teus dados viola o RGPD,
              tens o direito de apresentar uma reclamacao junto da Comissao
              Nacional de Protecao de Dados (CNPD) —{" "}
              <span className="text-wepac-gray">www.cnpd.pt</span>.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
