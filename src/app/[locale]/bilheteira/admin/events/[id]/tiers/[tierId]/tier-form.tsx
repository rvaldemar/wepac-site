"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import { saveTierAction } from "@/lib/bilheteira/landing-admin-actions";
import { EMAIL_MERGE_FIELDS } from "@/lib/bilheteira/email-merge";
import { styles } from "../../../../../ui";

export type TierFormValues = {
  id: string | null;
  name: string;
  description: string;
  kind: "single" | "bundle" | "group" | "phase" | "request";
  price: string;
  quantity: string;
  seatsPerUnit: string;
  minSeats: string;
  maxPerOrder: string;
  phaseGroup: string;
  phaseOrder: string;
  salesStartAt: string;
  salesEndAt: string;
  stateOverride: "auto" | "sold_out" | "closed";
  lockedNote: string;
  referencePrice: string;
  ctaLabel: string;
  ctaUrl: string;
  waitlistEnabled: boolean;
  section: string;
  featured: boolean;
  hideUnitPrice: boolean;
  emailNote: string;
  emailCtaLabel: string;
  emailCtaUrl: string;
  stripePriceId: string;
  en: { name: string; description: string; lockedNote: string; ctaLabel: string };
};

const KIND_HELP: Record<TierFormValues["kind"], string> = {
  single: "Preço por lugar; o comprador escolhe quantos lugares quer.",
  bundle: "Preço fixo por pacote com um número fixo de lugares (ex.: A Dois, Família).",
  group: "Preço por lugar escondido; mínimo de lugares obrigatório; mostra «a partir de».",
  phase:
    "Fase de uma sequência: abre quando a anterior esgota ou quando a fechas à mão (Estado → «Vendas encerradas» ou «Esgotado»). Sem quantidade, é sempre manual.",
  request: "Sem pagamento: o botão leva à página de pedido; a equipa aprova e emite.",
};

const hint: CSSProperties = { fontSize: 12, color: "#666", marginTop: 4 };

function Field({ label, help, children }: { label: string; help?: string; children: ReactNode }) {
  return (
    <label style={styles.label}>
      <span style={styles.labelText}>{label}</span>
      {children}
      {help && <span style={hint}>{help}</span>}
    </label>
  );
}

export function TierForm({ eventId, values }: { eventId: string; values: TierFormValues }) {
  const [kind, setKind] = useState(values.kind);

  return (
    <form action={saveTierAction} style={styles.form}>
      <input type="hidden" name="eventId" value={eventId} />
      {values.id && <input type="hidden" name="tierId" value={values.id} />}

      <fieldset style={styles.fieldset}>
        <legend style={styles.legend}>Bilhete</legend>
        <Field label="Nome" help="Ex.: Festival – Bilhete Artista (Early Bird)">
          <input name="name" defaultValue={values.name} required style={styles.input} />
        </Field>
        <Field label="Tipo" help={KIND_HELP[kind]}>
          <select
            name="kind"
            value={kind}
            onChange={(e) => setKind(e.target.value as TierFormValues["kind"])}
            style={styles.select}
          >
            <option value="single">Individual</option>
            <option value="bundle">Pacote</option>
            <option value="group">Grupo</option>
            <option value="phase">Fase</option>
            <option value="request">Pedido</option>
          </select>
        </Field>
        <Field label="Descrição" help="Markdown: **negrito**, listas com «- », parágrafos com linha em branco.">
          <textarea name="description" defaultValue={values.description} rows={10} style={styles.textarea} />
        </Field>
        <div style={styles.grid2}>
          <Field label="Secção na página" help="Agrupa bilhetes na landing (ex.: Festival, Concerto, Grupos).">
            <input name="section" defaultValue={values.section} style={styles.input} />
          </Field>
          <label style={{ ...styles.label, justifyContent: "flex-end" }}>
            <span style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 14 }}>
              <input type="checkbox" name="featured" defaultChecked={values.featured} /> Em destaque (hero e barra
              fixa no telemóvel)
            </span>
          </label>
        </div>
      </fieldset>

      <fieldset style={styles.fieldset}>
        <legend style={styles.legend}>Preço e quantidade</legend>
        {kind !== "request" && (
          <div style={styles.grid2}>
            <Field
              label={kind === "bundle" ? "Preço do pacote (€)" : "Preço por lugar (€)"}
              help={kind === "group" ? "O público vê «a partir de» mínimo × preço." : undefined}
            >
              <input name="price" defaultValue={values.price} inputMode="decimal" style={styles.input} />
            </Field>
            <Field label="Preço de referência (€)" help="Opcional. Mostra o desconto (ex.: 75 → «−53 % face a 75 €»).">
              <input name="referencePrice" defaultValue={values.referencePrice} inputMode="decimal" style={styles.input} />
            </Field>
          </div>
        )}
        <div style={styles.grid2}>
          <Field
            label={kind === "request" ? "Lugares para aprovar" : "Quantidade (lugares)"}
            help="Vazio = sem limite próprio (conta sempre a lotação do evento)."
          >
            <input name="quantity" type="number" min={0} defaultValue={values.quantity} style={styles.input} />
          </Field>
          {kind !== "request" && (
            <Field label="Máximo por compra" help={kind === "bundle" ? "Em pacotes. Vazio = 10." : "Em lugares. Vazio = 10 (grupos: 100)."}>
              <input name="maxPerOrder" type="number" min={1} defaultValue={values.maxPerOrder} style={styles.input} />
            </Field>
          )}
        </div>
        {kind === "bundle" && (
          <Field label="Lugares por pacote">
            <input name="seatsPerUnit" type="number" min={2} defaultValue={values.seatsPerUnit || "2"} style={styles.input} />
          </Field>
        )}
        {kind === "group" && (
          <Field label="Mínimo de lugares">
            <input name="minSeats" type="number" min={2} defaultValue={values.minSeats || "10"} style={styles.input} />
          </Field>
        )}
        {kind === "phase" && (
          <div style={styles.grid2}>
            <Field label="Sequência" help="Igual em todas as fases da mesma sequência (ex.: artista).">
              <input name="phaseGroup" defaultValue={values.phaseGroup} style={styles.input} />
            </Field>
            <Field label="Ordem da fase" help="1, 2, 3…">
              <input name="phaseOrder" type="number" min={1} defaultValue={values.phaseOrder} style={styles.input} />
            </Field>
          </div>
        )}
        {kind === "single" && (
          <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 14 }}>
            <input type="checkbox" name="hideUnitPrice" defaultChecked={values.hideUnitPrice} /> Mostrar «a partir
            de» em vez do preço
          </label>
        )}
        {kind !== "request" && (
          <Field label="Stripe Price ID (opcional)" help="Só se o preço vier de um produto Stripe; senão é criado na hora.">
            <input
              name="stripePriceId"
              defaultValue={values.stripePriceId}
              placeholder="price_..."
              style={{ ...styles.input, fontFamily: "ui-monospace, Menlo, monospace", fontSize: 13 }}
            />
          </Field>
        )}
      </fieldset>

      <fieldset style={styles.fieldset}>
        <legend style={styles.legend}>Estado e datas</legend>
        <div style={styles.grid2}>
          <Field label="Abertura das vendas" help="Hora de Lisboa. Antes disto aparece «Em breve».">
            <input name="salesStartAt" type="datetime-local" defaultValue={values.salesStartAt} style={styles.input} />
          </Field>
          <Field label="Fecho das vendas" help="Hora de Lisboa. Depois disto aparece «Vendas encerradas».">
            <input name="salesEndAt" type="datetime-local" defaultValue={values.salesEndAt} style={styles.input} />
          </Field>
        </div>
        <Field
          label="Estado"
          help="Automático calcula-o a partir das vendas e das datas. «Esgotado» forçado só quando esgotou de facto (ex.: venda à porta)."
        >
          <select name="stateOverride" defaultValue={values.stateOverride} style={styles.select}>
            <option value="auto">Automático</option>
            <option value="sold_out">Forçar «Esgotado»</option>
            <option value="closed">Forçar «Vendas encerradas»</option>
          </select>
        </Field>
        <Field label="Frase por baixo de «Em breve»" help="Ex.: Abre quando a fase anterior esgotar.">
          <input name="lockedNote" defaultValue={values.lockedNote} style={styles.input} />
        </Field>
        <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 14 }}>
          <input type="checkbox" name="waitlistEnabled" defaultChecked={values.waitlistEnabled} /> Lista de espera
          («Avisa-me») quando estiver «Em breve» ou «Esgotado»
        </label>
      </fieldset>

      {kind === "request" && (
        <fieldset style={styles.fieldset}>
          <legend style={styles.legend}>Pedido (fora do pagamento)</legend>
          <Field label="Texto do botão" help="Ex.: Pedir acreditação">
            <input name="ctaLabel" defaultValue={values.ctaLabel} style={styles.input} />
          </Field>
          <Field
            label="Link externo (opcional)"
            help="Vazio = página de pedido própria da bilheteira, com aprovação no admin. Preenchido = o botão leva a este link."
          >
            <input name="ctaUrl" defaultValue={values.ctaUrl} placeholder="https://" style={styles.input} />
          </Field>
        </fieldset>
      )}

      <fieldset style={styles.fieldset}>
        <legend style={styles.legend}>Email de confirmação</legend>
        <Field label="Nota no email" help="Aparece no email do bilhete. Pode usar campos (ver abaixo).">
          <textarea name="emailNote" defaultValue={values.emailNote} rows={5} style={styles.textarea} />
        </Field>
        <div style={styles.grid2}>
          <Field label="Botão no email: texto" help="Ex.: Fazer candidatura">
            <input name="emailCtaLabel" defaultValue={values.emailCtaLabel} style={styles.input} />
          </Field>
          <Field label="Botão no email: link" help="https://… pode levar campos para pré-preencher formulários.">
            <input
              name="emailCtaUrl"
              defaultValue={values.emailCtaUrl}
              placeholder="https://forms…/?bilhete={{bilhete}}&email={{email}}"
              style={styles.input}
            />
          </Field>
        </div>
        <div style={{ ...hint, lineHeight: 1.7 }}>
          Campos:{" "}
          {Object.entries(EMAIL_MERGE_FIELDS).map(([key, label]) => (
            <span key={key} style={{ marginRight: 12 }}>
              <code>{`{{${key}}}`}</code> {label.toLowerCase()}
            </span>
          ))}
        </div>
      </fieldset>

      <fieldset style={styles.fieldset}>
        <legend style={styles.legend}>Versão em inglês (página /en)</legend>
        <span style={hint}>Vazio = mostra o texto em português.</span>
        <Field label="Nome (EN)">
          <input name="en_name" defaultValue={values.en.name} style={styles.input} />
        </Field>
        <Field label="Descrição (EN)">
          <textarea name="en_description" defaultValue={values.en.description} rows={8} style={styles.textarea} />
        </Field>
        <div style={styles.grid2}>
          <Field label="Frase por baixo de «Em breve» (EN)">
            <input name="en_lockedNote" defaultValue={values.en.lockedNote} style={styles.input} />
          </Field>
          <Field label="Texto do botão de pedido (EN)">
            <input name="en_ctaLabel" defaultValue={values.en.ctaLabel} style={styles.input} />
          </Field>
        </div>
      </fieldset>

      <button type="submit" style={styles.button}>
        Guardar bilhete
      </button>
    </form>
  );
}
