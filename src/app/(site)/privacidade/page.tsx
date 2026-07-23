import { Metadata } from "next";
import { FadeIn } from "@/components/FadeIn";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description: "Política de privacidade e proteção de dados da WEPAC.",
};

const contact = (
  <a href="mailto:info@wepac.pt" className="text-wepac-gray underline">
    info@wepac.pt
  </a>
);

export default function PrivacidadePage() {
  return (
    <div className="pt-20">
      <section className="bg-wepac-black px-6 py-16 md:py-24 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <FadeIn>
            <h1 className="font-barlow text-3xl font-bold text-wepac-white md:text-5xl">
              Política de Privacidade
            </h1>
            <p className="mt-4 text-sm text-wepac-white/40">
              Última atualização: 22 de julho de 2026
            </p>
          </FadeIn>
        </div>
      </section>

      <section className="bg-wepac-dark px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-3xl space-y-10 text-sm leading-relaxed text-wepac-white/70">
          <div>
            <h2 className="font-barlow text-lg font-bold text-wepac-white">
              1. Responsável pelo tratamento
            </h2>
            <p className="mt-3">
              WEPAC — Companhia de Artes, com sede em Carcavelos, Portugal.
              Para questões de privacidade ou para exercer direitos, contacta-nos
              através de {contact}.
            </p>
          </div>

          <div>
            <h2 className="font-barlow text-lg font-bold text-wepac-white">
              2. Dados tratados
            </h2>
            <ul className="mt-3 ml-4 list-disc space-y-2 text-wepac-white/60">
              <li>
                <strong className="text-wepac-white/80">Site e contactos:</strong>{" "}
                nome, email, telefone, conteúdo de mensagens, detalhes de eventos,
                candidaturas e histórico do Wessex chat.
              </li>
              <li>
                <strong className="text-wepac-white/80">Conta WEPACKER:</strong>{" "}
                identidade, contactos, credenciais protegidas, perfil, avatar,
                Agreements e registos técnicos de autenticação.
              </li>
              <li>
                <strong className="text-wepac-white/80">My Journey:</strong> Stage,
                Life Map e respetivo histórico, Trails, Goals e Actions.
              </li>
              <li>
                <strong className="text-wepac-white/80">
                  Relações e participação:
                </strong>{" "}
                Connections, Mentorships, Pack Memberships, Cycle Enrollments e
                Facilitation.
              </li>
              <li>
                <strong className="text-wepac-white/80">Sessions:</strong> agenda,
                participantes, links, presença, discussion points, notas privadas
                do mentor, notas partilhadas e outcomes.
              </li>
              <li>
                <strong className="text-wepac-white/80">
                  Session Transcript e Debrief:
                </strong>{" "}
                texto integral da Transcript, autoria e data do attachment e drafts
                estruturados derivados. Estes dados podem conter informação
                especialmente sensível.
              </li>
              <li>
                <strong className="text-wepac-white/80">Dados técnicos:</strong>{" "}
                cookies estritamente necessários, segurança e registos operacionais
                sem conteúdo privado sempre que possível.
              </li>
              <li>
                <strong className="text-wepac-white/80">
                  Support Preview:
                </strong>{" "}
                identificadores do Admin, Person e Session, finalidade
                estruturada, digest keyed da referência externa, timestamps e
                eventos de acesso sem o conteúdo projetado.
              </li>
            </ul>
          </div>

          <div>
            <h2 className="font-barlow text-lg font-bold text-wepac-white">
              3. Finalidades
            </h2>
            <p className="mt-3">
              Tratamos dados para responder a pedidos e candidaturas, prestar os
              serviços WEPAC, gerir a conta e My Journey, permitir relações e
              participação explicitamente aceites, organizar Sessions, comunicar
              informação operacional, proteger a plataforma e cumprir obrigações
              legais. Qualquer Debrief por AI serve apenas para criar um draft
              privado sujeito a revisão humana; não publica notas nem cria Actions
              automaticamente.
            </p>
          </div>

          <div>
            <h2 className="font-barlow text-lg font-bold text-wepac-white">
              4. Fundamentos jurídicos
            </h2>
            <p className="mt-3">
              Conforme a operação, o fundamento pode ser a execução de um contrato
              ou de diligências pedidas pelo titular, o cumprimento de obrigação
              legal, interesses legítimos de operação e segurança, ou consentimento
              específico quando este seja necessário. Um Agreement geral, Pack
              Membership, Connection ou presença numa Session não vale por si só
              como consentimento para uma Transcript ou para tratamento AI.
            </p>
          </div>

          <div>
            <h2 className="font-barlow text-lg font-bold text-wepac-white">
              5. Gravação, Transcript e partilha
            </h2>
            <p className="mt-3">
              Quando estas funções estiverem ativas, a gravação, a transcrição e
              o Debrief por AI exigem consentimentos explícitos e separados de
              ambos os participantes, depois de verificação de capacidade adulta.
              Recusar não impede a chamada. Guardian consent permanece bloqueado
              até existir uma relação verificável própria. A gravação, a
              Transcript e o draft de Debrief são acessíveis apenas ao mentor
              organizador exato; Admin e Support não têm acesso ao conteúdo. O
              mentorando só recebe um documento imutável depois de o mentor o
              rever e publicar explicitamente, podendo a partilha ser revogada.
            </p>
          </div>

          <div>
            <h2 className="font-barlow text-lg font-bold text-wepac-white">
              6. Conservação
            </h2>
            <p className="mt-3">
              Pedidos comerciais e candidaturas são conservados enquanto houver
              seguimento legítimo e, em regra, não mais de 24 meses após o último
              contacto. Dados de conta, My Journey, relações e Sessions permanecem
              enquanto a conta ou relação correspondente estiver ativa e pelo
              período adicional necessário para resolver pedidos, segurança ou
              obrigações legais. Gravações, Transcripts, drafts privados e
              documentos publicados têm prazos próprios configurados e são
              apagados automaticamente no fim desses prazos, podendo a retirada
              do consentimento aplicável antecipar a eliminação. Um pedido de
              apagamento é avaliado sem demora indevida, ressalvadas obrigações de
              conservação e direitos de terceiros.
            </p>
            <p className="mt-3">
              No Support Preview, o digest da referência fica elegível para
              redaction quando o grant de 15 minutos expira; o grant é apagado
              após 30 dias e o audit event sem conteúdo após 365 dias. Num pedido
              de apagamento, grants ativos são removidos e as referências diretas
              à Person são anonymized antes da eliminação possível da conta.
            </p>
          </div>

          <div>
            <h2 className="font-barlow text-lg font-bold text-wepac-white">
              7. Destinatários e prestadores
            </h2>
            <p className="mt-3">
              O acesso dentro da WEPAC é limitado à função e à relação necessárias.
              Podemos usar prestadores de alojamento, email, calendarização,
              autenticação e AI como subcontratantes. O Wessex chat pode enviar a
              mensagem necessária ao fornecedor AI configurado. O Session Debrief
              não envia Transcripts para o Agents Hub enquanto estiver desativado.
              Não vendemos dados pessoais. Transferências internacionais, quando
              existam, ficam sujeitas às salvaguardas aplicáveis e podem ser
              esclarecidas através do contacto acima.
            </p>
          </div>

          <div>
            <h2 className="font-barlow text-lg font-bold text-wepac-white">
              8. Direitos
            </h2>
            <p className="mt-3">
              Nos termos aplicáveis, podes pedir acesso, retificação, apagamento,
              limitação, portabilidade ou oposição e retirar consentimento sem
              afetar o tratamento anterior. Podes também apresentar reclamação à
              Comissão Nacional de Proteção de Dados em{" "}
              <a
                href="https://www.cnpd.pt/"
                className="text-wepac-gray underline"
                rel="noreferrer"
                target="_blank"
              >
                cnpd.pt
              </a>
              . Se o titular for menor, estes direitos podem ser exercidos pelo seu
              representante legal de acordo com a idade e maturidade.
            </p>
          </div>

          <div>
            <h2 className="font-barlow text-lg font-bold text-wepac-white">
              9. Cookies e segurança
            </h2>
            <p className="mt-3">
              Usamos cookies necessários para autenticação e funcionamento. Não
              usamos estes cookies para publicidade comportamental. Aplicamos
              controlos técnicos e organizativos proporcionais, incluindo HTTPS,
              autorização por recurso e limitação do conteúdo incluído em logs.
              Nenhuma medida elimina totalmente o risco; incidentes são tratados de
              acordo com as obrigações aplicáveis.
            </p>
            <p className="mt-3">
              O Support Preview de uma Session é read-only e não troca identidade,
              JWT ou role. O organizer exato só pode projetar um attendee explícito
              da própria Session. Admin support exige password re-authentication,
              reason code, ticket digest e um cookie assinado e limitado àquela
              Session/Person; a projeção Admin não inclui meeting URL, Transcript,
              Debrief, discussion points nem private notes.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
