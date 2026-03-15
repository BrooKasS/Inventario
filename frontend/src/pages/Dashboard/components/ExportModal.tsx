import { useState } from "react";
import type { Asset } from "../../../types";
import {
  MAIN_GRADIENT,
  TIPO_LABEL,
  TIPO_ICON,
  TIPO_LABEL_SINGULAR,
  EVENTO_LABEL_MAP,
  EVENTOS,
} from "../constants";
import type { ExportMode } from "../types";
import Modal from "../../../components/Modal";

/* ─── Paleta de colores ─── */
const C = {
  primary:   "#B7312C",
  accent:    "#FA8200",
  dark:      "#861F41",
  warm:      "#D86018",
  grad:      MAIN_GRADIENT,
  surface:   "#FAFAFA",
  border:    "#F0E8E8",
  muted:     "#888",
  text:      "#1A1A1A",
  textLight: "#666",
};

/* ─── Estilos base reutilizables ─── */
const inputBase: React.CSSProperties = {
  width: "100%",
  padding: "9px 12px",
  borderRadius: 8,
  border: `1.5px solid ${C.border}`,
  background: "#fff",
  color: C.text,
  fontSize: 13,
  fontFamily: "Calibri, sans-serif",
  outline: "none",
  transition: "border-color .18s",
  boxSizing: "border-box",
};

const labelBase: React.CSSProperties = {
  display: "block",
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: C.primary,
  marginBottom: 6,
  fontFamily: "Calibri, sans-serif",
};

/* ─── Sub-componentes ─── */
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 700, letterSpacing: "0.12em",
      textTransform: "uppercase", color: C.muted,
      marginBottom: 12, paddingBottom: 8,
      borderBottom: `1px solid ${C.border}`,
      fontFamily: "Calibri, sans-serif",
    }}>
      {children}
    </div>
  );
}

function TipoChip({
  tipo, active, onClick,
}: { tipo: string; active: boolean; onClick: () => void }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex", alignItems: "center", gap: 5,
        padding: "6px 12px", borderRadius: 20, cursor: "pointer",
        border: active ? `1.5px solid ${C.primary}` : `1.5px solid #ddd`,
        background: active
          ? `rgba(183,49,44,.10)`
          : hov ? "#f5f0f0" : "#fff",
        color: active ? C.primary : C.textLight,
        fontWeight: active ? 700 : 500,
        fontSize: 12, fontFamily: "Calibri, sans-serif",
        transition: "all .15s",
        boxShadow: active ? `0 0 0 3px rgba(183,49,44,.08)` : "none",
      }}
    >
      <span>{TIPO_ICON[tipo] ?? "📦"}</span>
      <span>{TIPO_LABEL[tipo] ?? tipo}</span>
    </button>
  );
}

function EventoChip({
  evento, active, onClick,
}: { evento: string; active: boolean; onClick: () => void }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: "5px 11px", borderRadius: 20, cursor: "pointer",
        border: active ? `1.5px solid ${C.accent}` : `1.5px solid #ddd`,
        background: active ? `rgba(250,130,0,.10)` : hov ? "#fff8f0" : "#fff",
        color: active ? C.warm : C.textLight,
        fontWeight: active ? 700 : 500,
        fontSize: 12, fontFamily: "Calibri, sans-serif",
        transition: "all .15s",
        boxShadow: active ? `0 0 0 3px rgba(250,130,0,.08)` : "none",
      }}
    >
      {EVENTO_LABEL_MAP[evento] ?? evento}
    </button>
  );
}

function ActionBtn({
  label, icon, onClick, disabled, variant = "secondary",
}: {
  label: string; icon?: string; onClick: () => void;
  disabled?: boolean; variant?: "primary" | "secondary" | "ghost";
}) {
  const [hov, setHov] = useState(false);
  const styles: Record<string, React.CSSProperties> = {
    primary: {
      background: hov && !disabled ? "linear-gradient(135deg,#FA8200,#B7312C)" : C.grad,
      color: "#fff", border: "none",
      boxShadow: disabled ? "none" : "0 3px 10px rgba(183,49,44,.25)",
    },
    secondary: {
      background: hov && !disabled ? "#f0e8e8" : "#fff",
      color: C.primary, border: `1.5px solid ${C.border}`,
    },
    ghost: {
      background: hov && !disabled ? "rgba(255,255,255,.15)" : "rgba(255,255,255,.08)",
      color: "#fff", border: "1.5px solid rgba(255,255,255,.3)",
    },
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "8px 16px", borderRadius: 8,
        fontWeight: 700, fontSize: 13,
        fontFamily: "Calibri, sans-serif",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        transition: "all .15s",
        whiteSpace: "nowrap",
        ...styles[variant],
      }}
    >
      {icon && <span>{icon}</span>}
      <span>{label}</span>
    </button>
  );
}

/* ═══════════════════════════════════════════════
   TABLAS DE PREVIEW
═══════════════════════════════════════════════ */
function PreviewTableActivos({
  preview, seleccion, toggleSeleccion,
}: {
  preview: Asset[];
  seleccion: Set<string>;
  toggleSeleccion: (id: string) => void;
}) {
  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr style={{ background: "rgb(90,56,112)" }}>
          {["", "Activo", "Tipo", "Código", "Ubicación", "Actualizado"].map((h, i) => (
            <th key={i} style={{
              padding: "10px 14px", textAlign: "left",
              fontSize: 10, fontWeight: 700, textTransform: "uppercase",
              letterSpacing: ".08em", color: "#fff",
              borderRight: i < 5 ? "1px solid rgba(255,255,255,.08)" : "none",
            }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {preview.map((a, idx) => {
          const checked = seleccion.has(a.id);
          return (
            <tr
              key={a.id}
              style={{
                borderBottom: `1px solid ${C.border}`,
                background: checked ? "rgba(183,49,44,.04)" : idx % 2 === 0 ? "#fff" : C.surface,
                cursor: "pointer",
              }}
              onClick={() => toggleSeleccion(a.id)}
            >
              <td style={{ padding: "10px 14px", width: 36 }}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleSeleccion(a.id)}
                  style={{ accentColor: C.primary, width: 14, height: 14, cursor: "pointer" }}
                  onClick={e => e.stopPropagation()}
                />
              </td>
              <td style={{ padding: "10px 14px", fontWeight: checked ? 700 : 400, color: checked ? C.primary : C.text, fontSize: 13 }}>
                {a.nombre ?? "—"}
              </td>
              <td style={{ padding: "10px 14px" }}>
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  fontSize: 11, fontWeight: 700, padding: "3px 8px",
                  borderRadius: 12, background: "rgba(183,49,44,.08)", color: C.primary,
                }}>
                  {TIPO_ICON[a.tipo]} {TIPO_LABEL_SINGULAR[a.tipo] ?? a.tipo}
                </span>
              </td>
              <td style={{ padding: "10px 14px", fontSize: 13, color: C.textLight }}>{a.codigoServicio ?? "—"}</td>
              <td style={{ padding: "10px 14px", fontSize: 13, color: C.textLight }}>{a.ubicacion ?? "—"}</td>
              <td style={{ padding: "10px 14px", fontSize: 12, color: C.muted }}>
                {a.actualizadoEn
                  ? new Date(a.actualizadoEn).toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" })
                  : "—"}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function PreviewTableObservaciones({
  preview, seleccion, toggleSeleccion,
  pasaFiltroObservacion, obsAutor, obsDesde, obsHasta, eventosSel, incluirSistema,
}: {
  preview: Asset[];
  seleccion: Set<string>;
  toggleSeleccion: (id: string) => void;
  pasaFiltroObservacion: (e: any, autor: string, desde: string, hasta: string, eventos: string[], incluirSis: boolean) => boolean;
  obsAutor: string; obsDesde: string; obsHasta: string;
  eventosSel: string[]; incluirSistema: boolean;
}) {
  const EVENTO_BADGE: Record<string, { bg: string; color: string }> = {
    IMPORTACION:  { bg: "#e0f0ff", color: "#0c5460" },
    CAMBIO_CAMPO: { bg: "#fff3cd", color: "#856404" },
    MANTENIMIENTO:{ bg: "#d4edda", color: "#155724" },
    INCIDENTE:    { bg: "#f8d7da", color: "#721c24" },
    NOTA:         { bg: "#e2e3e5", color: "#383d41" },
  };

  return (
    <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 980 }}>
      <thead>
        <tr style={{ background: "rgb(90,56,112)" }}>
          {["", "Activo", "Tipo", "Fecha", "Autor", "Evento", "Descripción", "Campo", "Anterior", "Nuevo"].map((h, i) => (
            <th key={i} style={{
              padding: "10px 14px", textAlign: "left",
              fontSize: 10, fontWeight: 700, textTransform: "uppercase",
              letterSpacing: ".08em", color: "#fff",
              borderRight: i < 9 ? "1px solid rgba(255,255,255,.08)" : "none",
            }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {preview.map((a) => {
          const rows = (a as any).bitacora || [];
          const visibles = rows.filter((e: any) =>
            pasaFiltroObservacion(e, obsAutor, obsDesde, obsHasta, eventosSel, incluirSistema)
          );
          if (visibles.length === 0) return null;
          const checked = seleccion.has(a.id);

          return visibles.map((e: any, idx: number) => {
            const badge = EVENTO_BADGE[e.tipoEvento] ?? { bg: "#e2e3e5", color: "#383d41" };
            return (
              <tr
                key={`${a.id}-${idx}`}
                style={{
                  borderBottom: `1px solid ${C.border}`,
                  background: checked ? "rgba(183,49,44,.04)" : idx % 2 === 0 ? "#fff" : C.surface,
                  cursor: "pointer",
                }}
                onClick={() => idx === 0 && toggleSeleccion(a.id)}
              >
                <td style={{ padding: "10px 14px", width: 36 }}>
                  {idx === 0 && (
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleSeleccion(a.id)}
                      style={{ accentColor: C.primary, width: 14, height: 14, cursor: "pointer" }}
                      onClick={e => e.stopPropagation()}
                    />
                  )}
                </td>
                <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: idx === 0 ? 700 : 400, color: C.text }}>
                  {idx === 0 ? a.nombre ?? "—" : ""}
                </td>
                <td style={{ padding: "10px 14px", fontSize: 11, color: C.muted }}>
                  {idx === 0 ? (TIPO_LABEL_SINGULAR[a.tipo] ?? a.tipo) : ""}
                </td>
                <td style={{ padding: "10px 14px", fontSize: 12, color: C.muted, whiteSpace: "nowrap" }}>
                  {e.creadoEn ? new Date(e.creadoEn).toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" }) : "—"}
                </td>
                <td style={{ padding: "10px 14px", fontSize: 13, color: C.text }}>{e.autor ?? "—"}</td>
                <td style={{ padding: "10px 14px" }}>
                  <span style={{
                    display: "inline-block", padding: "2px 8px", borderRadius: 10,
                    fontSize: 10, fontWeight: 700, textTransform: "uppercase",
                    letterSpacing: ".06em", background: badge.bg, color: badge.color,
                  }}>
                    {EVENTO_LABEL_MAP[e.tipoEvento] ?? e.tipoEvento}
                  </span>
                </td>
                <td style={{ padding: "10px 14px", fontSize: 12, color: C.text, maxWidth: 200 }}>{e.descripcion ?? ""}</td>
                <td style={{ padding: "10px 14px", fontSize: 12, color: C.muted, fontFamily: "monospace" }}>{e.campoModificado ?? ""}</td>
                <td style={{ padding: "10px 14px", fontSize: 12, color: "#c0392b" }}>{e.valorAnterior ?? ""}</td>
                <td style={{ padding: "10px 14px", fontSize: 12, color: "#27ae60" }}>{e.valorNuevo ?? ""}</td>
              </tr>
            );
          });
        })}
      </tbody>
    </table>
  );
}

/* ═══════════════════════════════════════════════
   EXPORT MODAL PRINCIPAL
═══════════════════════════════════════════════ */
interface ExportModalProps {
  open: boolean;
  onClose: () => void;
  exportMode: ExportMode;
  setExportMode: (mode: ExportMode) => void;
  tiposSel: string[];
  toggleTipo: (tipo: string) => void;
  buscar: string;
  setBuscar: (search: string) => void;
  preview: Asset[];
  previewLoading: boolean;
  cargarPreview: () => Promise<void>;
  seleccion: Set<string>;
  toggleSeleccion: (id: string) => void;
  seleccionarTodos: () => void;
  allSelected: boolean;
  exporting: "excel" | "pdf" | null;
  handleExportExcel: () => Promise<void>;
  handleExportPDF: () => Promise<void>;
  eventosSel: string[];
  setEventosSel: (events: string[] | ((prev: string[]) => string[])) => void;
  obsAutor: string;
  setObsAutor: (author: string) => void;
  obsDesde: string;
  setObsDesde: (date: string) => void;
  obsHasta: string;
  setObsHasta: (date: string) => void;
  incluirSistema: boolean;
  setIncluirSistema: (include: boolean) => void;
  pasaFiltroObservacion: (e: any, autor: string, desde: string, hasta: string, eventos: string[], incluirSis: boolean) => boolean;
}

export default function ExportModal({
  open, onClose, exportMode, setExportMode,
  tiposSel, toggleTipo, buscar, setBuscar,
  preview, previewLoading, cargarPreview,
  seleccion, toggleSeleccion, seleccionarTodos, allSelected,
  exporting, handleExportExcel, handleExportPDF,
  eventosSel, setEventosSel, obsAutor, setObsAutor,
  obsDesde, setObsDesde, obsHasta, setObsHasta,
  incluirSistema, setIncluirSistema, pasaFiltroObservacion,
}: ExportModalProps) {

  const totalSeleccionados = seleccion.size;
  const totalPreview = preview.length;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title=""
      width={1140}
    >
      <div style={{ fontFamily: "Calibri, 'Segoe UI', sans-serif", display: "flex", flexDirection: "column", maxHeight: "85vh" }}>

        {/* ══ HEADER ══ */}
        <div style={{
          background: C.grad,
          padding: "18px 24px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: "rgba(255,255,255,.18)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18,
            }}>📤</div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#fff", letterSpacing: ".02em" }}>
                Exportar datos
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,.7)", marginTop: 2 }}>
                Selecciona activos y descarga en Excel o PDF
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {/* Toggle modo */}
            <div style={{
              display: "flex", background: "rgba(0,0,0,.2)",
              borderRadius: 10, overflow: "hidden", padding: 3, gap: 3,
            }}>
              {(["activos", "observaciones"] as ExportMode[]).map(mode => (
                <button
                  key={mode}
                  onClick={() => setExportMode(mode)}
                  style={{
                    padding: "6px 14px", borderRadius: 8, border: "none",
                    background: exportMode === mode ? "rgba(255,255,255,.95)" : "transparent",
                    color: exportMode === mode ? C.primary : "rgba(255,255,255,.8)",
                    fontWeight: 700, fontSize: 12, cursor: "pointer",
                    transition: "all .15s", fontFamily: "Calibri, sans-serif",
                    textTransform: "capitalize",
                  }}
                >
                  {mode === "activos" ? "🗂 Activos" : "📋 Observaciones"}
                </button>
              ))}
            </div>

            {/* Botones export */}
            <ActionBtn
              label={exporting === "excel" ? "Generando..." : "Excel"}
              icon="📊"
              onClick={handleExportExcel}
              disabled={exporting !== null || totalSeleccionados === 0}
              variant="ghost"
            />
            <ActionBtn
              label={exporting === "pdf" ? "Generando..." : "PDF"}
              icon="📄"
              onClick={handleExportPDF}
              disabled={exporting !== null || totalSeleccionados === 0}
              variant="ghost"
            />

            <button
              onClick={onClose}
              style={{
                background: "rgba(255,255,255,.12)", border: "1.5px solid rgba(255,255,255,.25)",
                color: "#fff", borderRadius: 8, width: 34, height: 34,
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", fontSize: 18, lineHeight: 1,
              }}
            >×</button>
          </div>
        </div>

        {/* ══ BODY (scroll) ══ */}
        <div style={{ display: "flex", flex: 1, overflow: "hidden", minHeight: 0 }}>

          {/* ── PANEL IZQUIERDO: Filtros ── */}
          <div style={{
            width: 300, flexShrink: 0,
            background: C.surface,
            borderRight: `1px solid ${C.border}`,
            overflowY: "auto", padding: "20px 18px",
            display: "flex", flexDirection: "column", gap: 20,
          }}>

            {/* Tipos de activo */}
            <div>
              <SectionTitle>Tipo de Activo</SectionTitle>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {["SERVIDOR", "BASE_DATOS", "RED", "UPS", "VPN"].map(tipo => (
                  <TipoChip
                    key={tipo}
                    tipo={tipo}
                    active={tiposSel.includes(tipo)}
                    onClick={() => toggleTipo(tipo)}
                  />
                ))}
                <button
                  onClick={() => toggleTipo("")}
                  style={{
                    padding: "6px 12px", borderRadius: 20, cursor: "pointer",
                    border: "1.5px dashed #ddd", background: "transparent",
                    color: C.muted, fontSize: 12, fontFamily: "Calibri, sans-serif",
                    fontWeight: 500,
                  }}
                >
                  Todos
                </button>
              </div>
            </div>

            {/* Búsqueda */}
            <div>
              <SectionTitle>Búsqueda</SectionTitle>
              <div style={{ position: "relative" }}>
                <span style={{
                  position: "absolute", left: 10, top: "50%",
                  transform: "translateY(-50%)", fontSize: 14, pointerEvents: "none",
                }}>🔍</span>
                <input
                  value={buscar}
                  onChange={e => setBuscar(e.target.value)}
                  placeholder="Nombre, código, ubicación..."
                  style={{ ...inputBase, paddingLeft: 32 }}
                  onFocus={e => (e.currentTarget.style.borderColor = C.primary)}
                  onBlur={e => (e.currentTarget.style.borderColor = C.border)}
                />
              </div>
            </div>

            {/* Filtros de observaciones */}
            {exportMode === "observaciones" && (
              <>
                <div>
                  <SectionTitle>Tipo de Evento</SectionTitle>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                    {EVENTOS.map(te => (
                      <EventoChip
                        key={te}
                        evento={te}
                        active={eventosSel.includes(te)}
                        onClick={() => setEventosSel(prev =>
                          prev.includes(te) ? prev.filter(x => x !== te) : [...prev, te]
                        )}
                      />
                    ))}
                    <button
                      onClick={() => setEventosSel([])}
                      style={{
                        padding: "5px 11px", borderRadius: 20, cursor: "pointer",
                        border: "1.5px dashed #ddd", background: "transparent",
                        color: C.muted, fontSize: 12, fontFamily: "Calibri, sans-serif",
                      }}
                    >Todos</button>
                  </div>
                </div>

                <div>
                  <SectionTitle>Filtros de Fecha</SectionTitle>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <div>
                      <label style={labelBase}>Desde</label>
                      <input
                        type="date" value={obsDesde}
                        onChange={e => setObsDesde(e.target.value)}
                        style={inputBase}
                        onFocus={e => (e.currentTarget.style.borderColor = C.primary)}
                        onBlur={e => (e.currentTarget.style.borderColor = C.border)}
                      />
                    </div>
                    <div>
                      <label style={labelBase}>Hasta</label>
                      <input
                        type="date" value={obsHasta}
                        onChange={e => setObsHasta(e.target.value)}
                        style={inputBase}
                        onFocus={e => (e.currentTarget.style.borderColor = C.primary)}
                        onBlur={e => (e.currentTarget.style.borderColor = C.border)}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <SectionTitle>Autor</SectionTitle>
                  <input
                    value={obsAutor}
                    onChange={e => setObsAutor(e.target.value)}
                    placeholder="Ej: Juan (contiene)..."
                    style={inputBase}
                    onFocus={e => (e.currentTarget.style.borderColor = C.primary)}
                    onBlur={e => (e.currentTarget.style.borderColor = C.border)}
                  />
                </div>

                <div>
                  <SectionTitle>Autor Sistema</SectionTitle>
                  <label style={{
                    display: "flex", alignItems: "center", gap: 8,
                    cursor: "pointer", userSelect: "none",
                  }}>
                    <input
                      type="checkbox"
                      checked={incluirSistema}
                      onChange={e => setIncluirSistema(e.target.checked)}
                      style={{ accentColor: C.primary, width: 14, height: 14 }}
                    />
                    <span style={{ fontSize: 12, color: C.textLight, fontFamily: "Calibri, sans-serif" }}>
                      {incluirSistema ? "Incluir registros de sistema" : "Excluir registros de sistema"}
                    </span>
                  </label>
                </div>
              </>
            )}

            {/* Acciones */}
            <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
              <ActionBtn
                label={previewLoading ? "Cargando..." : "Cargar vista previa"}
                icon={previewLoading ? undefined : "👁"}
                onClick={cargarPreview}
                disabled={previewLoading}
                variant="primary"
              />
              {preview.length > 0 && (
                <ActionBtn
                  label={allSelected ? "Quitar selección" : `Seleccionar todos (${totalPreview})`}
                  onClick={seleccionarTodos}
                  variant="secondary"
                />
              )}
            </div>
          </div>

          {/* ── PANEL DERECHO: Vista previa ── */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>

            {/* Barra info */}
            <div style={{
              padding: "12px 20px",
              borderBottom: `1px solid ${C.border}`,
              display: "flex", justifyContent: "space-between", alignItems: "center",
              background: "#fff", flexShrink: 0,
            }}>
              <div style={{ display: "flex", align: "center", gap: 12 }}>
                <span style={{ fontSize: 13, color: C.textLight, fontFamily: "Calibri, sans-serif" }}>
                  Vista previa
                  {totalPreview > 0 && (
                    <span style={{ marginLeft: 6, fontWeight: 700, color: C.text }}>
                      {totalPreview} registro{totalPreview !== 1 ? "s" : ""}
                    </span>
                  )}
                </span>
              </div>

              {totalSeleccionados > 0 && (
                <div style={{
                  display: "flex", alignItems: "center", gap: 8,
                  background: "rgba(183,49,44,.08)",
                  border: `1px solid rgba(183,49,44,.2)`,
                  borderRadius: 20, padding: "4px 12px",
                }}>
                  <span style={{
                    width: 20, height: 20, borderRadius: "50%",
                    background: C.grad, color: "#fff",
                    fontSize: 10, fontWeight: 700,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {totalSeleccionados}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: C.primary, fontFamily: "Calibri, sans-serif" }}>
                    seleccionado{totalSeleccionados !== 1 ? "s" : ""} para exportar
                  </span>
                </div>
              )}
            </div>

            {/* Tabla */}
            <div style={{ flex: 1, overflowY: "auto", overflowX: "auto" }}>
              {previewLoading ? (
                <div style={{
                  padding: "60px 40px", textAlign: "center",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: "50%",
                    border: "3px solid #f0e8e8",
                    borderTop: `3px solid ${C.accent}`,
                    animation: "spin 1s linear infinite",
                  }} />
                  <span style={{ color: C.muted, fontSize: 13, fontFamily: "Calibri, sans-serif" }}>
                    Cargando datos...
                  </span>
                </div>
              ) : preview.length === 0 ? (
                <div style={{
                  padding: "60px 40px", textAlign: "center",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
                }}>
                  <div style={{ fontSize: 40, opacity: 0.25 }}>📭</div>
                  <p style={{ color: C.muted, fontSize: 14, margin: 0, fontFamily: "Calibri, sans-serif" }}>
                    No hay datos para mostrar
                  </p>
                  <p style={{ color: "#bbb", fontSize: 12, margin: 0, fontFamily: "Calibri, sans-serif" }}>
                    Configura los filtros y haz clic en "Cargar vista previa"
                  </p>
                </div>
              ) : exportMode === "activos" ? (
                <PreviewTableActivos
                  preview={preview}
                  seleccion={seleccion}
                  toggleSeleccion={toggleSeleccion}
                />
              ) : (
                <PreviewTableObservaciones
                  preview={preview}
                  seleccion={seleccion}
                  toggleSeleccion={toggleSeleccion}
                  pasaFiltroObservacion={pasaFiltroObservacion}
                  obsAutor={obsAutor}
                  obsDesde={obsDesde}
                  obsHasta={obsHasta}
                  eventosSel={eventosSel}
                  incluirSistema={incluirSistema}
                />
              )}
            </div>

            {/* Footer con acciones de exportación */}
            {totalSeleccionados > 0 && (
              <div style={{
                padding: "14px 20px",
                borderTop: `1px solid ${C.border}`,
                background: "#fff",
                display: "flex", justifyContent: "space-between", alignItems: "center",
                flexShrink: 0,
              }}>
                <span style={{ fontSize: 13, color: C.textLight, fontFamily: "Calibri, sans-serif" }}>
                  Exportando <strong style={{ color: C.primary }}>{totalSeleccionados}</strong> activo{totalSeleccionados !== 1 ? "s" : ""}
                  {exportMode === "observaciones" && " con sus observaciones"}
                </span>
                <div style={{ display: "flex", gap: 10 }}>
                  <ActionBtn
                    label={exporting === "excel" ? "Generando..." : "Descargar Excel"}
                    icon="📊"
                    onClick={handleExportExcel}
                    disabled={exporting !== null}
                    variant="secondary"
                  />
                  <ActionBtn
                    label={exporting === "pdf" ? "Generando..." : "Descargar PDF"}
                    icon="📄"
                    onClick={handleExportPDF}
                    disabled={exporting !== null}
                    variant="primary"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}