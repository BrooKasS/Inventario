import { useState } from "react";
import type { CertificadoSslApp } from "../../types";
import { C, labelStyle, inputStyle } from "./constants";
import { DiasRestantesBadge } from "./DetailComponents";

interface AppDraft {
  nombreAplicacion: string;
  url: string;
  fechaInicio: string;
  fechaFin: string;
}

function soloFecha(v: string | null | undefined): string {
  return (v ?? "").split("T")[0];
}

function toDraft(app: CertificadoSslApp): AppDraft {
  return {
    nombreAplicacion: app.nombreAplicacion ?? "",
    url: app.url ?? "",
    fechaInicio: soloFecha(app.fechaInicio),
    fechaFin: soloFecha(app.fechaFin),
  };
}

function formatDisplay(raw: string | null | undefined): string {
  const soloDia = soloFecha(raw);
  if (!soloDia) return "?";
  const [y, m, d] = soloDia.split("-");
  if (!y || !m || !d) return soloDia;
  return `${d}/${m}/${y}`;
}

function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

const cardStyle: React.CSSProperties = {
  background: "#fefcfa",
  border: "1px solid #e5ddd8",
  borderRadius: 10,
  padding: "14px 16px",
};

const editInputStyle: React.CSSProperties = {
  ...inputStyle,
  padding: "8px 11px",
  fontSize: 12.5,
  borderRadius: 8,
};

/* ═══════════════════════════════════════════
   APLICACIONES DEL PROVEEDOR — vista + editor
   Lectura: tarjetas con URL clicable y dias
   restantes. Edicion: filas editables in-place
   con agregar / eliminar. Las apps nuevas heredan
   la fecha del proveedor si no traen la suya.
═══════════════════════════════════════════ */
export function CertificadoAplicaciones({
  apps,
  editing,
  fechaInicioProveedor,
  fechaFinProveedor,
  onChange,
}: {
  apps: CertificadoSslApp[];
  editing: boolean;
  fechaInicioProveedor: string | null;
  fechaFinProveedor: string | null;
  onChange: (apps: AppDraft[]) => void;
}) {
  const [draft, setDraft] = useState<AppDraft[]>(() => apps.map(toDraft));

  function update(next: AppDraft[]) {
    setDraft(next);
    onChange(next);
  }

  function updateField(idx: number, field: keyof AppDraft, value: string) {
    update(draft.map((a, i) => (i === idx ? { ...a, [field]: value } : a)));
  }

  function addRow() {
    update([
      ...draft,
      {
        nombreAplicacion: "",
        url: "",
        fechaInicio: soloFecha(fechaInicioProveedor),
        fechaFin: soloFecha(fechaFinProveedor),
      },
    ]);
  }

  function removeRow(idx: number) {
    update(draft.filter((_, i) => i !== idx));
  }

  if (!editing) {
    if (apps.length === 0) {
      return (
        <div style={{ fontSize: 12.5, color: "#999", fontFamily: "Calibri, sans-serif", padding: "4px 2px" }}>
          Sin aplicaciones registradas.
        </div>
      );
    }
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {apps.map((app, idx) => (
          <div key={app.id ?? idx} style={cardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, flexWrap: "wrap" }}>
              <div style={{ fontWeight: 700, color: "#1A1A1A", fontSize: 13 }}>
                {app.nombreAplicacion || "Sin nombre"}
              </div>
              <div style={{ fontSize: 12, color: "#666", whiteSpace: "nowrap" }}>
                {formatDisplay(app.fechaInicio)} → {formatDisplay(app.fechaFin)}
                <DiasRestantesBadge fecha={app.fechaFin} />
              </div>
            </div>
            <div style={{ marginTop: 6 }}>
              {app.url ? (
                <a
                  href={normalizeUrl(app.url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: C.primary, fontSize: 12, textDecoration: "none", fontWeight: 600 }}
                  onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
                  onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
                >
                  🔗 {app.url}
                </a>
              ) : (
                <span style={{ color: "#999", fontSize: 12 }}>Sin URL</span>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {draft.map((app, idx) => (
        <div key={idx} style={cardStyle}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
              gap: "10px 12px",
            }}
          >
            <div>
              <label style={{ ...labelStyle, fontSize: 10, marginBottom: 4 }}>Nombre App</label>
              <input
                style={editInputStyle}
                value={app.nombreAplicacion}
                placeholder="Ej: SAP ERP"
                onChange={(e) => updateField(idx, "nombreAplicacion", e.target.value)}
              />
            </div>
            <div>
              <label style={{ ...labelStyle, fontSize: 10, marginBottom: 4 }}>URL</label>
              <input
                style={editInputStyle}
                value={app.url}
                placeholder="https://app.ejemplo.com"
                onChange={(e) => updateField(idx, "url", e.target.value)}
              />
            </div>
            <div>
              <label style={{ ...labelStyle, fontSize: 10, marginBottom: 4 }}>Fecha Inicio</label>
              <input
                type="date"
                style={editInputStyle}
                value={app.fechaInicio}
                onChange={(e) => updateField(idx, "fechaInicio", e.target.value)}
              />
            </div>
            <div>
              <label style={{ ...labelStyle, fontSize: 10, marginBottom: 4 }}>Fecha Fin</label>
              <input
                type="date"
                style={editInputStyle}
                value={app.fechaFin}
                onChange={(e) => updateField(idx, "fechaFin", e.target.value)}
              />
            </div>
          </div>
          <button
            type="button"
            onClick={() => removeRow(idx)}
            style={{
              marginTop: 10,
              padding: "6px 12px",
              background: "#ffebeb",
              border: "1px solid #f08080",
              color: "#c0392b",
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "Calibri, sans-serif",
              textTransform: "uppercase",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#ff9999"; e.currentTarget.style.color = "#fff"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#ffebeb"; e.currentTarget.style.color = "#c0392b"; }}
          >
            🗑 Eliminar
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addRow}
        style={{
          padding: "10px 14px",
          background: C.grad,
          border: "none",
          color: "#fff",
          borderRadius: 8,
          fontSize: 12.5,
          fontWeight: 700,
          cursor: "pointer",
          fontFamily: "Calibri, sans-serif",
        }}
      >
        + Agregar aplicación
      </button>
    </div>
  );
}
