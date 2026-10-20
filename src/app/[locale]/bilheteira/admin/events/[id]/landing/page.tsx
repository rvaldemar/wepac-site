import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/db";
import { faqToText, parseFaq, parseProgram, programToText } from "@/lib/bilheteira/offers";
import { deleteGuestAction, saveEventLandingAction, saveGuestAction } from "@/lib/bilheteira/landing-admin-actions";
import { toLisbonInput } from "@/lib/bilheteira/lisbon-time";
import { EMAIL_MERGE_FIELDS } from "@/lib/bilheteira/email-merge";
import { parseEventTheme, scheduleToText } from "@/lib/bilheteira/event-theme";
import { styles, formatEventDate, formatEventTime } from "../../../../ui";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
};

const hint = { fontSize: 12, color: "#666", marginTop: 4 } as const;

export default async function LandingEditorPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { error, saved } = await searchParams;
  const event = await prisma.event.findUnique({
    where: { id },
    include: { guests: { orderBy: { sortOrder: "asc" } } },
  });
  if (!event) notFound();
  const now = new Date();
  const theme = parseEventTheme(event.theme);

  return (
    <main style={styles.container}>
      <div style={styles.eyebrow}>
        <Link href={`/bilheteira/admin/events/${id}`} style={{ color: "#666" }}>
          ← {event.title}
        </Link>
      </div>
      <h1 style={styles.h1}>Página do evento</h1>
      <p style={{ color: "#666", marginTop: 0 }}>
        Título, subtítulo, descrição (markdown), imagem, data e local editam-se nos detalhes do evento. Aqui fica o
        resto da landing.{" "}
        <Link href={`/bilheteira/${event.slug}`} style={styles.link}>
          Ver página pública
        </Link>
      </p>
      {error && <div style={{ ...styles.error, marginTop: 16 }}>{error}</div>}
      {saved && (
        <div style={{ marginTop: 16, padding: 12, background: "#e8f5e9", border: "1px solid #1b5e20", color: "#1b5e20", fontSize: 13 }}>
          Guardado.
        </div>
      )}

      <div style={{ ...styles.card, marginTop: 24 }}>
        <form action={saveEventLandingAction} style={styles.form}>
          <input type="hidden" name="eventId" value={id} />
          <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 14 }}>
            <input type="checkbox" name="featured" defaultChecked={event.featured} /> Destacar no topo da bilheteira
          </label>
          <fieldset style={styles.fieldset}>
            <legend style={styles.legend}>Identidade da campanha</legend>
            <div style={styles.grid2}>
              <label style={styles.label}>
                <span style={styles.labelText}>Tema</span>
                <select name="themeMode" defaultValue={theme.mode} style={styles.select}>
                  <option value="light">Claro (bilheteira WEPAC)</option>
                  <option value="dark">Escuro</option>
                </select>
              </label>
              <label style={styles.label}>
                <span style={styles.labelText}>Cor de destaque</span>
                <input name="themeAccent" defaultValue={theme.accent ?? ""} placeholder="#E04E2F" style={styles.input} />
                <span style={hint}>Botões, «?» final do título e destaques.</span>
              </label>
            </div>
            <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 14 }}>
              <input type="checkbox" name="themeCondensed" defaultChecked={theme.titleStyle === "condensed"} /> Título
              em Barlow Condensed maiúsculas (estilo campanha)
            </label>
            <div style={styles.grid2}>
              <label style={styles.label}>
                <span style={styles.labelText}>Título no topo</span>
                <input name="themeHeroTitle" defaultValue={theme.heroTitle ?? ""} placeholder="Quem é|o teu|mestre?" style={styles.input} />
                <span style={hint}>Vazio = título do evento. «|» parte a linha.</span>
              </label>
              <label style={styles.label}>
                <span style={styles.labelText}>Sobretítulo</span>
                <input name="themeEyebrow" defaultValue={theme.eyebrow ?? ""} placeholder="FESTIVAL · WEPAC" style={styles.input} />
              </label>
            </div>
            <label style={styles.label}>
              <span style={styles.labelText}>Frase</span>
              <input name="themeTagline" defaultValue={theme.tagline ?? ""} style={styles.input} />
            </label>
            <label style={styles.label}>
              <span style={styles.labelText}>Imagem do topo</span>
              <input name="themeHeroImage" defaultValue={theme.heroImage ?? ""} placeholder="/images/… ou https://…" style={styles.input} />
            </label>
            <label style={styles.label}>
              <span style={styles.labelText}>Horário em destaque</span>
              <textarea
                name="themeSchedule"
                rows={4}
                defaultValue={scheduleToText(theme.schedule)}
                style={{ ...styles.textarea, minHeight: 90, fontFamily: "ui-monospace, Menlo, monospace", fontSize: 13 }}
              />
              <span style={hint}>Uma linha por bloco: «10h–18h30 | Festival | detalhe | destaque a cor». Até 6 linhas.</span>
            </label>
          </fieldset>
          <label style={styles.label}>
            <span style={styles.labelText}>Descrição para Google e partilhas</span>
            <input name="seoDescription" defaultValue={event.seoDescription ?? ""} maxLength={300} style={styles.input} />
            <span style={hint}>Até ~160 caracteres. Vazio = início da descrição.</span>
          </label>
          <label style={styles.label}>
            <span style={styles.labelText}>Imagem de partilha (opcional)</span>
            <input name="ogImage" defaultValue={event.ogImage ?? ""} placeholder="https:// ou /uploads/…" style={styles.input} />
            <span style={hint}>Vazio = imagem de capa. Ideal 1200×630.</span>
          </label>
          <label style={styles.label}>
            <span style={styles.labelText}>Programa</span>
            <textarea
              name="program"
              rows={10}
              defaultValue={programToText(parseProgram(event.program))}
              style={{ ...styles.textarea, fontFamily: "ui-monospace, Menlo, monospace", fontSize: 13 }}
            />
            <span style={hint}>Uma linha por momento: «10h00 | Abertura · Quem é o teu mestre? | descrição opcional».</span>
          </label>
          <label style={styles.label}>
            <span style={styles.labelText}>Perguntas frequentes</span>
            <textarea name="faq" rows={10} defaultValue={faqToText(parseFaq(event.faq))} style={styles.textarea} />
            <span style={hint}>Primeira linha = pergunta, linhas seguintes = resposta; uma linha em branco entre perguntas.</span>
          </label>
          <label style={styles.label}>
            <span style={styles.labelText}>Como chegar</span>
            <textarea name="directions" rows={4} defaultValue={event.directions ?? ""} style={styles.textarea} />
          </label>
          <label style={styles.label}>
            <span style={styles.labelText}>Link do mapa</span>
            <input name="mapUrl" defaultValue={event.mapUrl ?? ""} placeholder="https://maps.google.com/…" style={styles.input} />
          </label>
          <label style={styles.label}>
            <span style={styles.labelText}>Nota em todos os emails de confirmação deste evento</span>
            <textarea name="emailNote" rows={4} defaultValue={event.emailNote ?? ""} style={styles.textarea} />
            <span style={hint}>
              Campos:{" "}
              {Object.keys(EMAIL_MERGE_FIELDS).map((k) => (
                <code key={k} style={{ marginRight: 8 }}>{`{{${k}}}`}</code>
              ))}
            </span>
          </label>
          <button type="submit" style={styles.button}>
            Guardar página
          </button>
        </form>
      </div>

      <h2 id="convidados" style={styles.h2}>
        Mestres e convidados
      </h2>
      <p style={{ fontSize: 13, color: "#666", marginTop: -8 }}>
        Cada nome só aparece na página pública a partir da data de revelação (hora de Lisboa). Vazio = visível já.
      </p>
      <div style={styles.card}>
        {event.guests.length > 0 && (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Nome</th>
                <th style={styles.th}>Função</th>
                <th style={styles.th}>Revelação</th>
                <th style={styles.th}></th>
              </tr>
            </thead>
            <tbody>
              {event.guests.map((g) => (
                <tr key={g.id}>
                  <td style={styles.td}>
                    <strong>{g.name}</strong>
                  </td>
                  <td style={{ ...styles.td, color: "#666" }}>{g.role || "—"}</td>
                  <td style={styles.td}>
                    {g.revealAt
                      ? `${formatEventDate(g.revealAt)} · ${formatEventTime(g.revealAt)}${g.revealAt > now ? " (por revelar)" : ""}`
                      : "visível"}
                  </td>
                  <td style={{ ...styles.td, textAlign: "right" }}>
                    <details>
                      <summary style={{ cursor: "pointer", fontSize: 12 }}>Editar</summary>
                      <GuestForm eventId={id} guest={g} />
                      <form action={deleteGuestAction} style={{ marginTop: 8 }}>
                        <input type="hidden" name="eventId" value={id} />
                        <input type="hidden" name="guestId" value={g.id} />
                        <button type="submit" style={styles.buttonDanger}>
                          Remover
                        </button>
                      </form>
                    </details>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div style={{ marginTop: 16 }}>
          <div style={styles.labelText}>Adicionar convidado</div>
          <GuestForm eventId={id} />
        </div>
      </div>
    </main>
  );
}

function GuestForm({
  eventId,
  guest,
}: {
  eventId: string;
  guest?: { id: string; name: string; role: string | null; bio: string | null; photo: string | null; revealAt: Date | null; sortOrder: number };
}) {
  return (
    <form action={saveGuestAction} style={{ ...styles.form, gap: 10, marginTop: 10, textAlign: "left" }}>
      <input type="hidden" name="eventId" value={eventId} />
      {guest && <input type="hidden" name="guestId" value={guest.id} />}
      <div style={styles.grid2}>
        <input name="name" defaultValue={guest?.name ?? ""} placeholder="Nome" required style={styles.input} />
        <input name="role" defaultValue={guest?.role ?? ""} placeholder="Função (ex.: Mestre · Teatro)" style={styles.input} />
      </div>
      <div style={styles.grid2}>
        <input name="photo" defaultValue={guest?.photo ?? ""} placeholder="Fotografia: https:// ou /uploads/…" style={styles.input} />
        <input type="datetime-local" name="revealAt" defaultValue={toLisbonInput(guest?.revealAt)} style={styles.input} />
      </div>
      <textarea name="bio" defaultValue={guest?.bio ?? ""} placeholder="Nota curta (opcional)" rows={2} style={{ ...styles.textarea, minHeight: 60 }} />
      <input type="number" name="sortOrder" defaultValue={guest?.sortOrder ?? 0} placeholder="Ordem" style={{ ...styles.input, maxWidth: 120 }} />
      <button type="submit" style={styles.buttonSecondary}>
        {guest ? "Guardar" : "Adicionar"}
      </button>
    </form>
  );
}
