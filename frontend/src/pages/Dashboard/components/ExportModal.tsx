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
  // Observaciones
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
  open,
  onClose,
  exportMode,
  setExportMode,
  tiposSel,
  toggleTipo,
  buscar,
  setBuscar,
  preview,
  previewLoading,
  cargarPreview,
  seleccion,
  toggleSeleccion,
  seleccionarTodos,
  allSelected,
  exporting,
  handleExportExcel,
  handleExportPDF,
  eventosSel,
  setEventosSel,
  obsAutor,
  setObsAutor,
  obsDesde,
  setObsDesde,
  obsHasta,
  setObsHasta,
  incluirSistema,
  setIncluirSistema,
  pasaFiltroObservacion,
}: ExportModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={exportMode === "activos" ? "Exportar Activos" : "Exportar Observaciones"}
      width={1100}
    >
      <div
        style={{
          borderRadius: 14,
          overflow: "hidden",
          border: "1px solid rgba(0,0,0,.06)",
          boxShadow: "0 6px 28px rgba(0,0,0,.12)",
        }}
      >
        {/* Header */}
        <div
          style={{
            background: MAIN_GRADIENT,
            padding: "12px 20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 10,
            borderTopLeftRadius: 14,
            borderTopRightRadius: 14,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              style={{
                fontSize: 16,
                width: 30,
                height: 30,
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(255,255,255,.18)",
              }}
            >
              📤
            </span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "#fff",
              }}
            >
              {exportMode === "activos"
                ? "Exportar Activos (Excel / PDF)"
                : "Exportar Observaciones (Excel / PDF)"}
            </span>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {/* Toggle de modo */}
            <div style={{ display: "flex", background: "rgba(255,255,255,.18)", borderRadius: 10, overflow: "hidden" }}>
              <button
                onClick={() => setExportMode("activos")}
                style={{
                  padding: "6px 10px",
                  border: "none",
                  background: exportMode === "activos" ? "rgba(255,255,255,.4)" : "transparent",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                Activos
              </button>
              <button
                onClick={() => setExportMode("observaciones")}
                style={{
                  padding: "6px 10px",
                  border: "none",
                  background: exportMode === "observaciones" ? "rgba(255,255,255,.4)" : "transparent",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                Observaciones
              </button>
            </div>

            <button
              onClick={handleExportExcel}
              disabled={exporting !== null}
              style={{
                padding: "7px 14px",
                borderRadius: 8,
                border: "1.5px solid rgba(255,255,255,.4)",
                background: exporting === "excel" ? "rgba(255,255,255,.25)" : "rgba(255,255,255,.12)",
                color: "#fff",
                fontWeight: 700,
                fontSize: 12,
                cursor: exporting ? "not-allowed" : "pointer",
              }}
            >
              {exporting === "excel" ? "Generando..." : "📊 Excel"}
            </button>
            <button
              onClick={handleExportPDF}
              disabled={exporting !== null}
              style={{
                padding: "7px 14px",
                borderRadius: 8,
                border: "1.5px solid rgba(255,255,255,.4)",
                background: exporting === "pdf" ? "rgba(255,255,255,.25)" : "rgba(255,255,255,.12)",
                color: "#fff",
                fontWeight: 700,
                fontSize: 12,
                cursor: exporting ? "not-allowed" : "pointer",
              }}
            >
              {exporting === "pdf" ? "Generando..." : "📄 PDF"}
            </button>
          </div>
        </div>

        {/* Controles */}
        <div style={{ background: "rgba(255,255,255,.04)", padding: 16 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 12,
              alignItems: "end",
            }}
          >
            {/* Tipos */}
            <div>
              <div
                style={{
                  color: "#333",
                  fontSize: 12,
                  marginBottom: 6,
                  opacity: 0.9,
                  fontWeight: 700,
                  letterSpacing: ".06em",
                }}
              >
                Tipos de Activo
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {["SERVIDOR", "BASE_DATOS", "RED", "UPS","VPN"].map((tipo) => {
                  const active = tiposSel.includes(tipo);
                  return (
                    <button
                      key={tipo}
                      onClick={() => toggleTipo(tipo)}
                      style={{
                        padding: "6px 10px",
                        borderRadius: 14,
                        fontSize: 12,
                        fontWeight: 700,
                        border: active ? "1.5px solid #B7312C" : "1.5px solid rgba(0,0,0,.2)",
                        background: active ? "rgba(183,49,44,.10)" : "rgba(0,0,0,.04)",
                        color: "#333",
                        cursor: "pointer",
                        letterSpacing: ".03em",
                      }}
                    >
                      {TIPO_ICON[tipo]} {TIPO_LABEL[tipo]}
                    </button>
                  );
                })}
                <button
                  onClick={() => toggleTipo("")}
                  style={{
                    padding: "6px 10px",
                    borderRadius: 14,
                    fontSize: 12,
                    fontWeight: 700,
                    border: "1.5px solid rgba(0,0,0,.2)",
                    background: "rgba(0,0,0,.04)",
                    color: "#333",
                  }}
                >
                  Todos
                </button>
              </div>
            </div>

            {/* Búsqueda */}
            <div>
              <div
                style={{
                  color: "#333",
                  fontSize: 12,
                  marginBottom: 6,
                  opacity: 0.9,
                  fontWeight: 700,
                  letterSpacing: ".06em",
                }}
              >
                Buscar (Nombre / Código / Ubicación)
              </div>
              <input
                value={buscar}
                onChange={(e) => setBuscar(e.target.value)}
                placeholder="Ej. 'Oracle' o 'SRV-001'"
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: "1.5px solid rgba(0,0,0,.2)",
                  background: "#fff",
                  color: "#333",
                  outline: "none",
                }}
              />
            </div>

            {/* Acciones vista previa */}
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={cargarPreview}
                disabled={previewLoading}
                style={{
                  padding: "8px 14px",
                  borderRadius: 8,
                  border: "none",
                  background: "linear-gradient(135deg, #FA8200, #B7312C)",
                  color: "#fff",
                  fontWeight: 700,
                  cursor: previewLoading ? "not-allowed" : "pointer",
                }}
              >
                {previewLoading ? "Cargando..." : "Cargar vista previa"}
              </button>
              <button
                onClick={seleccionarTodos}
                disabled={preview.length === 0}
                style={{
                  padding: "8px 14px",
                  borderRadius: 8,
                  border: "1.5px solid rgba(0,0,0,.2)",
                  background: "rgba(0,0,0,.04)",
                  color: "#333",
                  fontWeight: 700,
                  cursor: preview.length === 0 ? "not-allowed" : "pointer",
                }}
              >
                {allSelected ? "Quitar selección" : "Seleccionar todos (vista)"}
              </button>
            </div>
          </div>

          {/* Filtros de Observaciones */}
          {exportMode === "observaciones" && (
            <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", gap: 12 }}>
              {/* Tipos de evento */}
              <div>
                <div
                  style={{
                    color: "#333",
                    fontSize: 12,
                    marginBottom: 6,
                    opacity: 0.9,
                    fontWeight: 700,
                    letterSpacing: ".06em",
                  }}
                >
                  Tipos de evento
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {EVENTOS.map((te) => {
                    const active = eventosSel.includes(te);
                    return (
                      <button
                        key={te}
                        onClick={() =>
                          setEventosSel(
                            (prev) =>
                              prev.includes(te) ? prev.filter((x) => x !== te) : [...prev, te]
                          )
                        }
                        style={{
                          padding: "6px 10px",
                          borderRadius: 14,
                          fontSize: 12,
                          fontWeight: 700,
                          border: active ? "1.5px solid #B7312C" : "1.5px solid rgba(0,0,0,.2)",
                          background: active ? "rgba(183,49,44,.10)" : "rgba(0,0,0,.04)",
                          color: "#333",
                          cursor: "pointer",
                        }}
                      >
                        {EVENTO_LABEL_MAP[te]}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setEventosSel([])}
                    style={{
                      padding: "6px 10px",
                      borderRadius: 14,
                      fontSize: 12,
                      fontWeight: 700,
                      border: "1.5px solid rgba(0,0,0,.2)",
                      background: "rgba(0,0,0,.04)",
                      color: "#333",
                    }}
                  >
                    Todos
                  </button>
                </div>
              </div>

              {/* Autor */}
              <div>
                <div
                  style={{
                    color: "#333",
                    fontSize: 12,
                    marginBottom: 6,
                    opacity: 0.9,
                    fontWeight: 700,
                    letterSpacing: ".06em",
                  }}
                >
                  Autor
                </div>
                <input
                  value={obsAutor}
                  onChange={(e) => setObsAutor(e.target.value)}
                  placeholder="Ej. 'Juan' (contiene)"
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1.5px solid rgba(0,0,0,.2)",
                    background: "#fff",
                    color: "#333",
                    outline: "none",
                  }}
                />
              </div>

              {/* Desde */}
              <div>
                <div
                  style={{
                    color: "#333",
                    fontSize: 12,
                    marginBottom: 6,
                    opacity: 0.9,
                    fontWeight: 700,
                    letterSpacing: ".06em",
                  }}
                >
                  Desde
                </div>
                <input
                  type="date"
                  value={obsDesde}
                  onChange={(e) => setObsDesde(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1.5px solid rgba(0,0,0,.2)",
                    background: "#fff",
                    color: "#333",
                    outline: "none",
                  }}
                />
              </div>

              {/* Hasta */}
              <div>
                <div
                  style={{
                    color: "#333",
                    fontSize: 12,
                    marginBottom: 6,
                    opacity: 0.9,
                    fontWeight: 700,
                    letterSpacing: ".06em",
                  }}
                >
                  Hasta
                </div>
                <input
                  type="date"
                  value={obsHasta}
                  onChange={(e) => setObsHasta(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1.5px solid rgba(0,0,0,.2)",
                    background: "#fff",
                    color: "#333",
                    outline: "none",
                  }}
                />
              </div>

              {/* Incluir Sistema */}
              <div>
                <div
                  style={{
                    color: "#333",
                    fontSize: 12,
                    marginBottom: 6,
                    opacity: 0.9,
                    fontWeight: 700,
                    letterSpacing: ".06em",
                  }}
                >
                  Autor "sistema"
                </div>
                <label style={{ display: "flex", gap: 8, alignItems: "center", color: "#333" }}>
                  <input
                    type="checkbox"
                    checked={incluirSistema}
                    onChange={(e) => setIncluirSistema(e.target.checked)}
                  />
                  <span style={{ fontSize: 13 }}>
                    {incluirSistema
                      ? "Incluir registros de sistema (solo con campo modificado)"
                      : "Excluir registros de sistema"}
                  </span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Tabla vista previa */}
        <div
          style={{
            background: "#e2e2e2",
            borderTop: "1px solid rgba(0,0,0,.06)",
            borderBottomLeftRadius: 14,
            borderBottomRightRadius: 14,
          }}
        >
          {previewLoading ? (
            <div style={{ padding: "28px 20px" }}>Cargando vista previa…</div>
          ) : preview.length === 0 ? (
            <div style={{ padding: "28px 20px", color: "#777" }}>
              No hay resultados con los filtros actuales. Carga la vista previa para ver y seleccionar.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              {exportMode === "activos" ? (
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
          )}
        </div>
      </div>
    </Modal>
  );
}

function PreviewTableActivos({
  preview,
  seleccion,
  toggleSeleccion,
}: {
  preview: Asset[];
  seleccion: Set<string>;
  toggleSeleccion: (id: string) => void;
}) {
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 720 }}>
      <thead>
        <tr style={{ background: "rgba(0,0,0,.05)" }}>
          {["", "Activo", "Tipo", "Código", "Ubicación", "Actualizado"].map((h) => (
            <th
              key={h}
              style={{
                padding: "10px 14px",
                textAlign: "left",
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: ".08em",
                color: "#444",
                borderBottom: "1px solid rgba(0,0,0,.06)",
              }}
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {preview.map((a) => {
          const checked = seleccion.has(a.id);
          return (
            <tr key={a.id} style={{ borderBottom: "1px solid rgba(0,0,0,.04)" }}>
              <td style={{ padding: "10px 14px" }}>
                <input type="checkbox" checked={checked} onChange={() => toggleSeleccion(a.id)} />
              </td>
              <td style={{ padding: "10px 14px" }}>{a.nombre ?? "—"}</td>
              <td style={{ padding: "10px 14px" }}>{TIPO_LABEL[a.tipo]}</td>
              <td style={{ padding: "10px 14px" }}>{a.codigoServicio ?? "—"}</td>
              <td style={{ padding: "10px 14px" }}>{a.ubicacion ?? "—"}</td>
              <td style={{ padding: "10px 14px" }}>
                {a.actualizadoEn
                  ? new Date(a.actualizadoEn).toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" })
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
  preview,
  seleccion,
  toggleSeleccion,
  pasaFiltroObservacion,
  obsAutor,
  obsDesde,
  obsHasta,
  eventosSel,
  incluirSistema,
}: {
  preview: Asset[];
  seleccion: Set<string>;
  toggleSeleccion: (id: string) => void;
  pasaFiltroObservacion: (e: any, autor: string, desde: string, hasta: string, eventos: string[], incluirSis: boolean) => boolean;
  obsAutor: string;
  obsDesde: string;
  obsHasta: string;
  eventosSel: string[];
  incluirSistema: boolean;
}) {
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 980 }}>
      <thead>
        <tr style={{ background: "rgba(0,0,0,.05)" }}>
          {["", "Activo", "Tipo", "Código", "Fecha", "Autor", "Evento", "Descripción", "Campo modificado", "Valor anterior", "Valor nuevo"].map(
            (h) => (
              <th
                key={h}
                style={{
                  padding: "10px 14px",
                  textAlign: "left",
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: ".08em",
                  color: "#444",
                  borderBottom: "1px solid rgba(0,0,0,.06)",
                }}
              >
                {h}
              </th>
            )
          )}
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
            const esPrimera = idx === 0;
            return (
              <tr key={a.id + "-" + idx} style={{ borderBottom: "1px solid rgba(0,0,0,.04)" }}>
                <td style={{ padding: "10px 14px" }}>
                  {esPrimera && (
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleSeleccion(a.id)}
                    />
                  )}
                </td>
                <td style={{ padding: "10px 14px" }}>{a.nombre ?? "—"}</td>
                <td style={{ padding: "10px 14px" }}>{TIPO_LABEL_SINGULAR[a.tipo] ?? a.tipo}</td>
                <td style={{ padding: "10px 14px" }}>{a.codigoServicio ?? "—"}</td>
                <td style={{ padding: "10px 14px" }}>
                  {e.creadoEn ? new Date(e.creadoEn).toLocaleString("es-CO") : "—"}
                </td>
                <td style={{ padding: "10px 14px" }}>{e.autor ?? "—"}</td>
                <td style={{ padding: "10px 14px" }}>{EVENTO_LABEL_MAP[e.tipoEvento] ?? e.tipoEvento ?? "—"}</td>
                <td style={{ padding: "10px 14px" }}>{e.descripcion ?? ""}</td>
                <td style={{ padding: "10px 14px" }}>{e.campoModificado ?? ""}</td>
                <td style={{ padding: "10px 14px" }}>{e.valorAnterior ?? ""}</td>
                <td style={{ padding: "10px 14px" }}>{e.valorNuevo ?? ""}</td>
              </tr>
            );
          });
        })}
      </tbody>
    </table>
  );
}
