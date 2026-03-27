import { useState } from "react";
import type { Asset } from "../../../types";
import {
  MAIN_GRADIENT,
  TIPO_LABEL,
  TIPO_ICON,
  EVENTO_LABEL_MAP,
  EVENTOS,
} from "../constants";
import type { ExportMode } from "../types";
import Modal from "../../../components/Modal";

/* ─── Design tokens ─── */
const C = {
  grad:    MAIN_GRADIENT,
  primary: "#B7312C",
  accent:  "#FA8200",
  dark:    "#861F41",
  border:  "#EDE0E0",
  surface: "#FAFAFA",
  muted:   "#888",
};

/* ─── Tipos de activo disponibles para exportar ─── */
const TIPOS_EXPORT = ["SERVIDOR", "BASE_DATOS", "RED", "UPS", "VPN", "MOVIL"];

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
  open, onClose,
  exportMode, setExportMode,
  tiposSel, toggleTipo,
  buscar, setBuscar,
  preview, previewLoading,
  cargarPreview,
  seleccion, toggleSeleccion, seleccionarTodos, allSelected,
  exporting,
  handleExportExcel, handleExportPDF,
  eventosSel, setEventosSel,
  obsAutor, setObsAutor,
  obsDesde, setObsDesde,
  obsHasta, setObsHasta,
  incluirSistema, setIncluirSistema,
  pasaFiltroObservacion,
}: ExportModalProps) {

  const [showPreview, setShowPreview] = useState(false);

  const totalSeleccion = seleccion.size;
  const totalPreview   = preview.length;

  /* ── Contar observaciones visibles en preview ── */
  const totalObs = preview.reduce((acc, a) => {
    const bit = (a as any).bitacora ?? [];
    return acc + bit.filter((e: any) =>
      pasaFiltroObservacion(e, obsAutor, obsDesde, obsHasta, eventosSel, incluirSistema)
    ).length;
  }, 0);

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "9px 12px",
    border: `1.5px solid ${C.border}`,
    borderRadius: 8,
    fontSize: 13,
    fontFamily: "Calibri, sans-serif",
    outline: "none",
    background: "#fff",
    color: "#1A1A1A",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: C.primary,
    marginBottom: 5,
    fontFamily: "Calibri, sans-serif",
  };

  return (
    <Modal open={open} onClose={onClose} title="" width={820}>
      <div style={{ fontFamily: "Calibri, 'Segoe UI', sans-serif" }}>

        {/* ══ HEADER ══ */}
        <div style={{
          background: C.grad,
          borderRadius: "10px 10px 0 0",
          padding: "20px 24px 0",
        }}>
          {/* Título */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{
                fontSize: 18, width: 36, height: 36, borderRadius: 10,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: "rgba(255,255,255,.2)",
              }}>📤</span>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>Exportar Datos</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,.7)" }}>Elige qué exportar y en qué formato</div>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                background: "rgba(255,255,255,.15)", border: "1.5px solid rgba(255,255,255,.3)",
                color: "#fff", borderRadius: 8, width: 32, height: 32,
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", fontSize: 18,
              }}
            >×</button>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 4 }}>
            {(["activos", "observaciones"] as ExportMode[]).map(mode => (
              <button
                key={mode}
                onClick={() => setExportMode(mode)}
                style={{
                  padding: "10px 24px",
                  border: "none",
                  borderRadius: "8px 8px 0 0",
                  background: exportMode === mode ? "#fff" : "rgba(255,255,255,.15)",
                  color: exportMode === mode ? C.primary : "rgba(255,255,255,.85)",
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: "pointer",
                  fontFamily: "Calibri, sans-serif",
                  transition: "all .15s",
                }}
              >
                {mode === "activos" ? "🖥️ Activos" : "📋 Observaciones"}
              </button>
            ))}
          </div>
        </div>

        {/* ══ BODY ══ */}
        <div style={{ background: "#fff", borderRadius: "0 0 10px 10px", padding: "24px" }}>

          {exportMode === "activos" ? (
            /* ─── TAB ACTIVOS ─── */
            <div>
              {/* Tipos de activo */}
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Tipos de Activo</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {TIPOS_EXPORT.map(tipo => {
                    const active = tiposSel.includes(tipo);
                    return (
                      <button
                        key={tipo}
                        onClick={() => toggleTipo(tipo)}
                        style={{
                          padding: "7px 14px",
                          borderRadius: 20,
                          fontSize: 12,
                          fontWeight: 700,
                          border: active ? `2px solid ${C.primary}` : `1.5px solid ${C.border}`,
                          background: active ? "rgba(183,49,44,.08)" : "#fff",
                          color: active ? C.primary : "#555",
                          cursor: "pointer",
                          fontFamily: "Calibri, sans-serif",
                          transition: "all .15s",
                        }}
                      >
                        {TIPO_ICON[tipo]} {TIPO_LABEL[tipo] ?? tipo}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => { TIPOS_EXPORT.forEach(t => { if (!tiposSel.includes(t)) toggleTipo(t); }); }}
                    style={{
                      padding: "7px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700,
                      border: `1.5px solid ${C.border}`, background: "#fff", color: C.muted,
                      cursor: "pointer", fontFamily: "Calibri, sans-serif",
                    }}
                  >
                    Todos
                  </button>
                  {tiposSel.length > 0 && (
                    <button
                      onClick={() => TIPOS_EXPORT.forEach(t => { if (tiposSel.includes(t)) toggleTipo(t); })}
                      style={{
                        padding: "7px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                        border: `1.5px solid ${C.border}`, background: "#fff", color: C.muted,
                        cursor: "pointer", fontFamily: "Calibri, sans-serif",
                      }}
                    >
                      ✕ Limpiar
                    </button>
                  )}
                </div>
                {tiposSel.length === 0 && (
                  <p style={{ fontSize: 11, color: C.muted, marginTop: 6, fontStyle: "italic" }}>
                    Sin selección = exporta todos los tipos
                  </p>
                )}
              </div>

              {/* Búsqueda */}
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Buscar (Nombre / Código / Ubicación)</label>
                <input
                  value={buscar}
                  onChange={e => setBuscar(e.target.value)}
                  placeholder="Ej: Oracle, SRV-001, Datacenter..."
                  style={inputStyle}
                />
              </div>

              {/* Preview opcional */}
              <div style={{
                background: C.surface,
                border: `1.5px solid ${C.border}`,
                borderRadius: 10,
                overflow: "hidden",
                marginBottom: 20,
              }}>
                <div style={{
                  padding: "12px 16px",
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  borderBottom: showPreview ? `1px solid ${C.border}` : "none",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#333" }}>Vista previa</span>
                    {totalPreview > 0 && (
                      <span style={{
                        background: C.grad, color: "#fff",
                        fontSize: 11, fontWeight: 700, padding: "2px 10px",
                        borderRadius: 20,
                      }}>
                        {totalSeleccion > 0 ? `${totalSeleccion} seleccionados` : `${totalPreview} encontrados`}
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={async () => { await cargarPreview(); setShowPreview(true); }}
                      disabled={previewLoading}
                      style={{
                        padding: "7px 14px", borderRadius: 8, border: "none",
                        background: C.grad, color: "#fff", fontWeight: 700,
                        fontSize: 12, cursor: previewLoading ? "not-allowed" : "pointer",
                        fontFamily: "Calibri, sans-serif",
                      }}
                    >
                      {previewLoading ? "Cargando..." : "🔍 Cargar preview"}
                    </button>
                    {totalPreview > 0 && (
                      <button
                        onClick={seleccionarTodos}
                        style={{
                          padding: "7px 14px", borderRadius: 8,
                          border: `1.5px solid ${C.border}`,
                          background: "#fff", color: "#555", fontWeight: 700,
                          fontSize: 12, cursor: "pointer", fontFamily: "Calibri, sans-serif",
                        }}
                      >
                        {allSelected ? "Quitar todo" : "Seleccionar todo"}
                      </button>
                    )}
                  </div>
                </div>

                {showPreview && totalPreview > 0 && (
                  <div style={{ maxHeight: 240, overflowY: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ background: "rgba(90,56,112,.08)" }}>
                          {["", "Activo", "Tipo", "Código", "Ubicación"].map(h => (
                            <th key={h} style={{
                              padding: "8px 12px", textAlign: "left",
                              fontSize: 10, fontWeight: 700, textTransform: "uppercase",
                              color: "#555", letterSpacing: ".08em",
                            }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {preview.map(a => (
                          <tr key={a.id} style={{
                            borderBottom: `1px solid ${C.border}`,
                            background: seleccion.has(a.id) ? "rgba(183,49,44,.04)" : "transparent",
                          }}>
                            <td style={{ padding: "8px 12px" }}>
                              <input
                                type="checkbox"
                                checked={seleccion.has(a.id)}
                                onChange={() => toggleSeleccion(a.id)}
                                style={{ accentColor: C.primary }}
                              />
                            </td>
                            <td style={{ padding: "8px 12px", fontSize: 13, fontWeight: 600 }}>{a.nombre ?? "—"}</td>
                            <td style={{ padding: "8px 12px", fontSize: 12, color: C.muted }}>{TIPO_LABEL[a.tipo] ?? a.tipo}</td>
                            <td style={{ padding: "8px 12px", fontSize: 12 }}>{a.codigoServicio ?? "—"}</td>
                            <td style={{ padding: "8px 12px", fontSize: 12 }}>{a.ubicacion ?? "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {showPreview && totalPreview === 0 && !previewLoading && (
                  <div style={{ padding: "20px", textAlign: "center", color: C.muted, fontSize: 13 }}>
                    No se encontraron activos con esos filtros.
                  </div>
                )}
              </div>

              {/* Botones exportar */}
              <ExportButtons
                exporting={exporting}
                onExcel={handleExportExcel}
                onPDF={handleExportPDF}
                label="activos"
              />
            </div>

          ) : (
            /* ─── TAB OBSERVACIONES ─── */
            <div>
              {/* Info */}
              <div style={{
                background: "rgba(250,130,0,.06)",
                border: `1.5px solid rgba(250,130,0,.25)`,
                borderRadius: 10, padding: "12px 16px", marginBottom: 20,
                display: "flex", alignItems: "center", gap: 10,
              }}>
                <span style={{ fontSize: 18 }}>ℹ️</span>
                <div style={{ fontSize: 12, color: "#555", lineHeight: 1.5 }}>
                  Exporta las observaciones de la bitácora. <strong>Se excluyen automáticamente las entradas del sistema.</strong>
                  {" "}Si no cargas preview, exportará todos los activos con los filtros activos.
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 20px", marginBottom: 20 }}>
                {/* Tipos de activo */}
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={labelStyle}>Tipos de Activo</label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {TIPOS_EXPORT.map(tipo => {
                      const active = tiposSel.includes(tipo);
                      return (
                        <button
                          key={tipo}
                          onClick={() => toggleTipo(tipo)}
                          style={{
                            padding: "6px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700,
                            border: active ? `2px solid ${C.primary}` : `1.5px solid ${C.border}`,
                            background: active ? "rgba(183,49,44,.08)" : "#fff",
                            color: active ? C.primary : "#555",
                            cursor: "pointer", fontFamily: "Calibri, sans-serif",
                          }}
                        >
                          {TIPO_ICON[tipo]} {TIPO_LABEL[tipo] ?? tipo}
                        </button>
                      );
                    })}
                    {tiposSel.length > 0 && (
                      <button
                        onClick={() => TIPOS_EXPORT.forEach(t => { if (tiposSel.includes(t)) toggleTipo(t); })}
                        style={{
                          padding: "6px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                          border: `1.5px solid ${C.border}`, background: "#fff", color: C.muted,
                          cursor: "pointer", fontFamily: "Calibri, sans-serif",
                        }}
                      >
                        ✕ Limpiar
                      </button>
                    )}
                  </div>
                </div>

                {/* Autor */}
                <div>
                  <label style={labelStyle}>Autor (contiene)</label>
                  <input
                    value={obsAutor}
                    onChange={e => setObsAutor(e.target.value)}
                    placeholder="Ej: Juan..."
                    style={inputStyle}
                  />
                </div>

                {/* Búsqueda activo */}
                <div>
                  <label style={labelStyle}>Buscar Activo</label>
                  <input
                    value={buscar}
                    onChange={e => setBuscar(e.target.value)}
                    placeholder="Ej: Oracle, SRV-001..."
                    style={inputStyle}
                  />
                </div>

                {/* Desde */}
                <div>
                  <label style={labelStyle}>Desde</label>
                  <input
                    type="date"
                    value={obsDesde}
                    onChange={e => setObsDesde(e.target.value)}
                    style={inputStyle}
                  />
                </div>

                {/* Hasta */}
                <div>
                  <label style={labelStyle}>Hasta</label>
                  <input
                    type="date"
                    value={obsHasta}
                    onChange={e => setObsHasta(e.target.value)}
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Tipos de evento */}
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Tipos de Evento (vacío = todos)</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {EVENTOS.map(te => {
                    const active = eventosSel.includes(te);
                    return (
                      <button
                        key={te}
                        onClick={() => setEventosSel(prev =>
                          prev.includes(te) ? prev.filter(x => x !== te) : [...prev, te]
                        )}
                        style={{
                          padding: "6px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700,
                          border: active ? `2px solid ${C.primary}` : `1.5px solid ${C.border}`,
                          background: active ? "rgba(183,49,44,.08)" : "#fff",
                          color: active ? C.primary : "#555",
                          cursor: "pointer", fontFamily: "Calibri, sans-serif",
                        }}
                      >
                        {EVENTO_LABEL_MAP[te]}
                      </button>
                    );
                  })}
                  {eventosSel.length > 0 && (
                    <button
                      onClick={() => setEventosSel([])}
                      style={{
                        padding: "6px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                        border: `1.5px solid ${C.border}`, background: "#fff", color: C.muted,
                        cursor: "pointer", fontFamily: "Calibri, sans-serif",
                      }}
                    >
                      ✕ Limpiar
                    </button>
                  )}
                </div>
              </div>

              {/* Incluir sistema (avanzado) */}
              <div style={{ marginBottom: 20 }}>
                <label style={{
                  display: "flex", alignItems: "center", gap: 8,
                  cursor: "pointer", fontSize: 12, color: "#555",
                }}>
                  <input
                    type="checkbox"
                    checked={incluirSistema}
                    onChange={e => setIncluirSistema(e.target.checked)}
                    style={{ accentColor: C.primary, width: 14, height: 14 }}
                  />
                  <span>Incluir cambios automáticos del sistema (CAMBIO_CAMPO con valor)</span>
                </label>
              </div>

              {/* Preview observaciones */}
              <div style={{
                background: C.surface, border: `1.5px solid ${C.border}`,
                borderRadius: 10, overflow: "hidden", marginBottom: 20,
              }}>
                <div style={{
                  padding: "12px 16px",
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  borderBottom: showPreview && totalPreview > 0 ? `1px solid ${C.border}` : "none",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#333" }}>Vista previa</span>
                    {totalObs > 0 && (
                      <span style={{
                        background: C.grad, color: "#fff",
                        fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 20,
                      }}>
                        {totalObs} observación{totalObs !== 1 ? "es" : ""}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={async () => { await cargarPreview(); setShowPreview(true); }}
                    disabled={previewLoading}
                    style={{
                      padding: "7px 14px", borderRadius: 8, border: "none",
                      background: C.grad, color: "#fff", fontWeight: 700,
                      fontSize: 12, cursor: previewLoading ? "not-allowed" : "pointer",
                      fontFamily: "Calibri, sans-serif",
                    }}
                  >
                    {previewLoading ? "Cargando..." : "🔍 Previsualizar"}
                  </button>
                </div>

                {showPreview && totalPreview > 0 && (
                  <div style={{ maxHeight: 200, overflowY: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ background: "rgba(90,56,112,.08)" }}>
                          {["Activo", "Tipo", "Obs. visibles"].map(h => (
                            <th key={h} style={{
                              padding: "8px 12px", textAlign: "left",
                              fontSize: 10, fontWeight: 700, textTransform: "uppercase",
                              color: "#555", letterSpacing: ".08em",
                            }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {preview.map(a => {
                          const bit = (a as any).bitacora ?? [];
                          const cnt = bit.filter((e: any) =>
                            pasaFiltroObservacion(e, obsAutor, obsDesde, obsHasta, eventosSel, incluirSistema)
                          ).length;
                          if (cnt === 0) return null;
                          return (
                            <tr key={a.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                              <td style={{ padding: "8px 12px", fontSize: 13, fontWeight: 600 }}>{a.nombre ?? "—"}</td>
                              <td style={{ padding: "8px 12px", fontSize: 12, color: C.muted }}>{TIPO_LABEL[a.tipo] ?? a.tipo}</td>
                              <td style={{ padding: "8px 12px", fontSize: 12 }}>
                                <span style={{
                                  background: "rgba(183,49,44,.1)", color: C.primary,
                                  padding: "2px 8px", borderRadius: 12, fontWeight: 700, fontSize: 11,
                                }}>
                                  {cnt}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <ExportButtons
                exporting={exporting}
                onExcel={handleExportExcel}
                onPDF={handleExportPDF}
                label="observaciones"
              />
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

/* ─── Botones de exportación reutilizables ─── */
function ExportButtons({
  exporting, onExcel, onPDF, label,
}: {
  exporting: "excel" | "pdf" | null;
  onExcel: () => Promise<void>;
  onPDF: () => Promise<void>;
  label: string;
}) {
  const C_grad = MAIN_GRADIENT;
  return (
    <div style={{
      display: "flex", gap: 12, justifyContent: "flex-end",
      paddingTop: 16, borderTop: "1.5px solid #EDE0E0",
    }}>
      <button
        onClick={onPDF}
        disabled={exporting !== null}
        style={{
          padding: "11px 24px", borderRadius: 9, border: "2px solid #B7312C",
          background: "#fff", color: "#B7312C",
          fontWeight: 700, fontSize: 13, cursor: exporting ? "not-allowed" : "pointer",
          fontFamily: "Calibri, sans-serif", transition: "all .15s",
          display: "flex", alignItems: "center", gap: 7,
          opacity: exporting === "pdf" ? 0.7 : 1,
        }}
        onMouseEnter={e => { if (!exporting) e.currentTarget.style.background = "rgba(183,49,44,.06)"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "#fff"; }}
      >
        {exporting === "pdf" ? (
          <><Spinner /> Generando PDF...</>
        ) : (
          <>📄 Exportar PDF</>
        )}
      </button>
      <button
        onClick={onExcel}
        disabled={exporting !== null}
        style={{
          padding: "11px 24px", borderRadius: 9, border: "none",
          background: exporting ? "#ccc" : C_grad,
          color: "#fff", fontWeight: 700, fontSize: 13,
          cursor: exporting ? "not-allowed" : "pointer",
          fontFamily: "Calibri, sans-serif",
          boxShadow: exporting ? "none" : "0 4px 14px rgba(183,49,44,.3)",
          transition: "all .15s",
          display: "flex", alignItems: "center", gap: 7,
        }}
      >
        {exporting === "excel" ? (
          <><Spinner /> Generando Excel...</>
        ) : (
          <>📊 Exportar Excel</>
        )}
      </button>
    </div>
  );
}

function Spinner() {
  return (
    <div style={{
      width: 14, height: 14,
      border: "2px solid rgba(255,255,255,.3)",
      borderTop: "2px solid #fff",
      borderRadius: "50%",
      animation: "spin 1s linear infinite",
      flexShrink: 0,
    }} />
  );
}