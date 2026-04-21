"use client";

import { useMemo, useState } from "react";
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
  status: string;
};

type Props = {
  action: (formData: FormData) => void | Promise<void>;
  departments: Department[];
  brands: Brand[];
  defaults: Defaults | null;
  submitLabel: string;
};

function toLocalDateTimeInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function EventFormClient({
  action,
  departments,
  brands,
  defaults,
  submitLabel,
}: Props) {
  const [departmentId, setDepartmentId] = useState<string>(
    defaults?.departmentId || departments[0]?.id || ""
  );

  const filteredBrands = useMemo(
    () => brands.filter((b) => b.departmentId === departmentId),
    [brands, departmentId]
  );

  const [tiers, setTiers] = useState<
    { name: string; price: string; description: string }[]
  >(
    defaults
      ? []
      : [
          { name: "Bilhete", price: "12", description: "" },
          { name: "Amigo WEPAC", price: "25", description: "Patrono — apoio directo ao programa." },
        ]
  );

  return (
    <form action={action} style={styles.form}>
      {defaults && <input type="hidden" name="id" value={defaults.id} />}
      <label style={styles.label}>
        <span style={styles.labelText}>Título</span>
        <input
          type="text"
          name="title"
          required
          defaultValue={defaults?.title || ""}
          style={styles.input}
        />
      </label>
      <label style={styles.label}>
        <span style={styles.labelText}>Subtítulo (opcional)</span>
        <input
          type="text"
          name="subtitle"
          defaultValue={defaults?.subtitle || ""}
          style={styles.input}
          placeholder="ex: Ananda Roda · vihuela"
        />
      </label>
      <label style={styles.label}>
        <span style={styles.labelText}>Descrição</span>
        <textarea
          name="description"
          required
          defaultValue={defaults?.description || ""}
          style={styles.textarea}
        />
      </label>

      <div style={styles.grid2}>
        <label style={styles.label}>
          <span style={styles.labelText}>Departamento</span>
          <select
            name="departmentId"
            required
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
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
            defaultValue={defaults?.brandId || ""}
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
            defaultValue={defaults?.venue || ""}
            style={styles.input}
            placeholder="Capela do Hospital de Jesus"
          />
        </label>
        <label style={styles.label}>
          <span style={styles.labelText}>Morada (opcional)</span>
          <input
            type="text"
            name="address"
            defaultValue={defaults?.address || ""}
            style={styles.input}
          />
        </label>
      </div>

      <div style={styles.grid2}>
        <label style={styles.label}>
          <span style={styles.labelText}>Data e hora</span>
          <input
            type="datetime-local"
            name="startsAt"
            required
            defaultValue={
              defaults ? toLocalDateTimeInput(defaults.startsAt) : ""
            }
            style={styles.input}
          />
        </label>
        <label style={styles.label}>
          <span style={styles.labelText}>Abertura de portas (opcional)</span>
          <input
            type="datetime-local"
            name="doorsAt"
            defaultValue={
              defaults?.doorsAt ? toLocalDateTimeInput(defaults.doorsAt) : ""
            }
            style={styles.input}
          />
        </label>
      </div>

      <div style={styles.grid2}>
        <label style={styles.label}>
          <span style={styles.labelText}>Duração (min)</span>
          <input
            type="number"
            name="durationMinutes"
            min={1}
            defaultValue={defaults?.durationMinutes ?? ""}
            style={styles.input}
          />
        </label>
        <label style={styles.label}>
          <span style={styles.labelText}>Capacidade (opcional)</span>
          <input
            type="number"
            name="capacity"
            min={1}
            defaultValue={defaults?.capacity ?? ""}
            style={styles.input}
          />
        </label>
      </div>

      <label style={styles.label}>
        <span style={styles.labelText}>
          URL da imagem de capa (opcional — usa o upload abaixo para enviar do disco)
        </span>
        <input
          type="text"
          name="coverImage"
          defaultValue={defaults?.coverImage || ""}
          style={styles.input}
          placeholder="/api/bilheteira/uploads/... ou https://..."
        />
      </label>

      <label style={styles.label}>
        <span style={styles.labelText}>Estado</span>
        <select
          name="status"
          defaultValue={defaults?.status || "draft"}
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

      <button type="submit" style={styles.button}>
        {submitLabel}
      </button>
    </form>
  );
}
