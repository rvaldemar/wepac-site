"use client";

import { useEffect, useMemo, useState } from "react";
import { styles } from "../../ui";

type Department = { id: string; name: string };
type Brand = { id: string; name: string; departmentId: string };

type Defaults = {
  id: string;
  title: string;
  subtitle: string | null;
  description: string;
  departmentId: string;
  brandId: string | null;
  venue: string;
  address: string | null;
  startsAt: Date;
  doorsAt: Date | null;
  durationMinutes: number | null;
  capacity: number | null;
  coverImage: string | null;
  ticketNote: string | null;
  status: string;
};

type Props = {
  action: (formData: FormData) => void | Promise<void>;
  departments: Department[];
  brands: Brand[];
  defaults: Defaults | null;
  submitLabel: string;
};

type FormState = {
  title: string;
  subtitle: string;
  description: string;
  departmentId: string;
  brandId: string;
  venue: string;
  address: string;
  startsAtDate: string;
  startsAtTime: string;
  doorsAtDate: string;
  doorsAtTime: string;
  durationMinutes: string;
  capacity: string;
  coverImage: string;
  ticketNote: string;
  status: string;
};

type Tier = { name: string; price: string; description: string };

const pad = (n: number) => String(n).padStart(2, "0");

function toInputDate(value: Date | string): string {
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function toInputTime(value: Date | string): string {
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "";
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function emptyState(departments: Department[]): FormState {
  return {
    title: "",
    subtitle: "",
    description: "",
    departmentId: departments[0]?.id ?? "",
    brandId: "",
    venue: "",
    address: "",
    startsAtDate: "",
    startsAtTime: "",
    doorsAtDate: "",
    doorsAtTime: "",
    durationMinutes: "",
    capacity: "",
    coverImage: "",
    ticketNote: "",
    status: "draft",
  };
}

export function EventFormClient({
  action,
  departments,
  brands,
  defaults,
  submitLabel,
}: Props) {
  // Initial state is identical on server and client (empty / first department).
  // Real values are populated client-side via useEffect to avoid hydration
  // mismatches caused by locale-dependent date formatting.
  const [form, setForm] = useState<FormState>(() => emptyState(departments));
  const [hydrated, setHydrated] = useState(false);

  const [tiers, setTiers] = useState<Tier[]>(
    defaults
      ? []
      : [
          { name: "Bilhete", price: "12", description: "" },
          {
            name: "Amigo WEPAC",
            price: "25",
            description: "Patrono — apoio directo ao programa.",
          },
        ]
  );

  useEffect(() => {
    if (!defaults) {
      setHydrated(true);
      return;
    }
    setForm({
      title: defaults.title ?? "",
      subtitle: defaults.subtitle ?? "",
      description: defaults.description ?? "",
      departmentId: defaults.departmentId || departments[0]?.id || "",
      brandId: defaults.brandId ?? "",
      venue: defaults.venue ?? "",
      address: defaults.address ?? "",
      startsAtDate: toInputDate(defaults.startsAt),
      startsAtTime: toInputTime(defaults.startsAt),
      doorsAtDate: defaults.doorsAt ? toInputDate(defaults.doorsAt) : "",
      doorsAtTime: defaults.doorsAt ? toInputTime(defaults.doorsAt) : "",
      durationMinutes:
        defaults.durationMinutes != null ? String(defaults.durationMinutes) : "",
      capacity: defaults.capacity != null ? String(defaults.capacity) : "",
      coverImage: defaults.coverImage ?? "",
      ticketNote: defaults.ticketNote ?? "",
      status: defaults.status || "draft",
    });
    setHydrated(true);
  }, [defaults, departments]);

  const filteredBrands = useMemo(
    () => brands.filter((b) => b.departmentId === form.departmentId),
    [brands, form.departmentId]
  );

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const startsAtCombined =
    form.startsAtDate && form.startsAtTime
      ? `${form.startsAtDate}T${form.startsAtTime}`
      : "";
  const doorsAtCombined =
    form.doorsAtDate && form.doorsAtTime
      ? `${form.doorsAtDate}T${form.doorsAtTime}`
      : "";

  return (
    <form action={action} style={styles.form}>
      {defaults && <input type="hidden" name="id" value={defaults.id} />}
      <input type="hidden" name="startsAt" value={startsAtCombined} />
      <input type="hidden" name="doorsAt" value={doorsAtCombined} />

      <label style={styles.label}>
        <span style={styles.labelText}>Título</span>
        <input
          type="text"
          name="title"
          required
          value={form.title}
          onChange={(e) => update("title", e.target.value)}
          style={styles.input}
        />
      </label>

      <label style={styles.label}>
        <span style={styles.labelText}>Subtítulo (opcional)</span>
        <input
          type="text"
          name="subtitle"
          value={form.subtitle}
          onChange={(e) => update("subtitle", e.target.value)}
          style={styles.input}
          placeholder="ex: Ananda Roda · vihuela"
        />
      </label>

      <label style={styles.label}>
        <span style={styles.labelText}>Descrição</span>
        <textarea
          name="description"
          required
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
          style={styles.textarea}
        />
      </label>

      <div style={styles.grid2}>
        <label style={styles.label}>
          <span style={styles.labelText}>Departamento</span>
          <select
            name="departmentId"
            required
            value={form.departmentId}
            onChange={(e) => {
              update("departmentId", e.target.value);
              update("brandId", "");
            }}
            style={styles.select}
          >
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </label>
        <label style={styles.label}>
          <span style={styles.labelText}>Marca (opcional)</span>
          <select
            name="brandId"
            value={form.brandId}
            onChange={(e) => update("brandId", e.target.value)}
            style={styles.select}
          >
            <option value="">— Sem marca (usa o departamento)</option>
            {filteredBrands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div style={styles.grid2}>
        <label style={styles.label}>
          <span style={styles.labelText}>Local</span>
          <input
            type="text"
            name="venue"
            required
            value={form.venue}
            onChange={(e) => update("venue", e.target.value)}
            style={styles.input}
            placeholder="Capela do Hospital de Jesus"
          />
        </label>
        <label style={styles.label}>
          <span style={styles.labelText}>Morada (opcional)</span>
          <input
            type="text"
            name="address"
            value={form.address}
            onChange={(e) => update("address", e.target.value)}
            style={styles.input}
          />
        </label>
      </div>

      <fieldset style={styles.fieldset}>
        <legend style={styles.legend}>Início</legend>
        <div style={styles.grid2}>
          <label style={styles.label}>
            <span style={styles.labelText}>Data</span>
            <input
              type="date"
              required
              value={form.startsAtDate}
              onChange={(e) => update("startsAtDate", e.target.value)}
              style={styles.input}
            />
          </label>
          <label style={styles.label}>
            <span style={styles.labelText}>Hora</span>
            <input
              type="time"
              required
              step={60}
              value={form.startsAtTime}
              onChange={(e) => update("startsAtTime", e.target.value)}
              style={styles.input}
            />
          </label>
        </div>
      </fieldset>

      <fieldset style={styles.fieldset}>
        <legend style={styles.legend}>Abertura de portas (opcional)</legend>
        <div style={styles.grid2}>
          <label style={styles.label}>
            <span style={styles.labelText}>Data</span>
            <input
              type="date"
              value={form.doorsAtDate}
              onChange={(e) => update("doorsAtDate", e.target.value)}
              style={styles.input}
            />
          </label>
          <label style={styles.label}>
            <span style={styles.labelText}>Hora</span>
            <input
              type="time"
              step={60}
              value={form.doorsAtTime}
              onChange={(e) => update("doorsAtTime", e.target.value)}
              style={styles.input}
            />
          </label>
        </div>
      </fieldset>

      <div style={styles.grid2}>
        <label style={styles.label}>
          <span style={styles.labelText}>Duração (min)</span>
          <input
            type="number"
            name="durationMinutes"
            min={1}
            value={form.durationMinutes}
            onChange={(e) => update("durationMinutes", e.target.value)}
            style={styles.input}
          />
        </label>
        <label style={styles.label}>
          <span style={styles.labelText}>Capacidade (opcional)</span>
          <input
            type="number"
            name="capacity"
            min={1}
            value={form.capacity}
            onChange={(e) => update("capacity", e.target.value)}
            style={styles.input}
          />
        </label>
      </div>

      <label style={styles.label}>
        <span style={styles.labelText}>
          URL da imagem de capa (opcional — usa o upload abaixo para enviar do
          disco)
        </span>
        <input
          type="text"
          name="coverImage"
          value={form.coverImage}
          onChange={(e) => update("coverImage", e.target.value)}
          style={styles.input}
          placeholder="/api/bilheteira/uploads/... ou https://..."
        />
      </label>

      <label style={styles.label}>
        <span style={styles.labelText}>
          Texto do verso do bilhete (opcional — texto editorial específico
          deste evento, aparece no bilhete digital)
        </span>
        <textarea
          name="ticketNote"
          value={form.ticketNote}
          onChange={(e) => update("ticketNote", e.target.value)}
          style={styles.textarea}
          placeholder="Ex: A vihuela antecedeu a guitarra em duzentos anos..."
        />
      </label>

      <label style={styles.label}>
        <span style={styles.labelText}>Estado</span>
        <select
          name="status"
          value={form.status}
          onChange={(e) => update("status", e.target.value)}
          style={styles.select}
        >
          <option value="draft">Rascunho</option>
          <option value="published">Publicado</option>
          <option value="cancelled">Cancelado</option>
          <option value="completed">Concluído</option>
        </select>
      </label>

      {!defaults && (
        <>
          <div style={{ ...styles.labelText, marginTop: 12 }}>
            Tiers de bilhete
          </div>
          {tiers.map((tier, i) => (
            <div
              key={i}
              style={{
                border: "1px solid #ccc",
                padding: 12,
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <div style={styles.grid2}>
                <input
                  type="text"
                  name="tierName"
                  placeholder="Nome (ex: Bilhete)"
                  value={tier.name}
                  onChange={(e) => {
                    const copy = [...tiers];
                    copy[i].name = e.target.value;
                    setTiers(copy);
                  }}
                  style={styles.input}
                />
                <input
                  type="text"
                  name="tierPrice"
                  placeholder="Preço em € (0 = grátis)"
                  inputMode="decimal"
                  value={tier.price}
                  onChange={(e) => {
                    const copy = [...tiers];
                    copy[i].price = e.target.value;
                    setTiers(copy);
                  }}
                  style={styles.input}
                />
              </div>
              <input
                type="text"
                name="tierDescription"
                placeholder="Descrição (opcional)"
                value={tier.description}
                onChange={(e) => {
                  const copy = [...tiers];
                  copy[i].description = e.target.value;
                  setTiers(copy);
                }}
                style={styles.input}
              />
              {tiers.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    setTiers(tiers.filter((_, idx) => idx !== i))
                  }
                  style={{ ...styles.buttonGhost, alignSelf: "flex-start" }}
                >
                  Remover tier
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              setTiers([...tiers, { name: "", price: "0", description: "" }])
            }
            style={{ ...styles.buttonGhost, alignSelf: "flex-start" }}
          >
            + Adicionar tier
          </button>
        </>
      )}

      <button
        type="submit"
        style={styles.button}
        disabled={!hydrated}
        title={!hydrated ? "A carregar valores…" : undefined}
      >
        {submitLabel}
      </button>
    </form>
  );
}
