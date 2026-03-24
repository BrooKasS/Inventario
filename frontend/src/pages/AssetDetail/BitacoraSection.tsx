import type { BitacoraEntry, TipoEvento } from "../../types";
import { C, EVENTO_LABEL, EVENTO_COLOR, labelStyle } from "./constants";
import { ExportBtn } from "./DetailComponents";

interface BitacoraSectionProps {
  bitacora: BitacoraEntry[] | undefined;
  bitacoraFiltrada: BitacoraEntry[];
  hayFiltros: boolean;
  showObs: boolean;
  setShowObs: (v: boolean) => void;
  obsAutor: string;
  setObsAutor: (v: string) => void;
  obsTipo: TipoEvento;
  setObsTipo: (v: TipoEvento) => void;
  obsDesc: string;
  setObsDesc: (v: string) => void;
  obsLoading: boolean;
  fTipo: string;
  setFTipo: (v: string) => void;
  fAutor: string;
  setFAutor: (v: string) => void;
  fDesde: string;
  setFDesde: (v: string) => void;
  fHasta: string;
  setFHasta: (v: string) => void;
  exporting: "excel" | "pdf" | null;
  autoresUnicos: string[];
  handleAddObs: () => Promise<void>;
  handleExportExcel: () => Promise<void>;
  handleExportPDF: () => Promise<void>;
  limpiarFiltros: () => void;
  inputStyle: React.CSSProperties;
  labelStyle: React.CSSProperties;
}

export function BitacoraSection({
  bitacora,
  bitacoraFiltrada,
  hayFiltros,
  showObs,
  setShowObs,
  obsAutor,
  setObsAutor,
  obsTipo,
  setObsTipo,
  obsDesc,
  setObsDesc,
  obsLoading,
  fTipo,
  setFTipo,
  fAutor,
  setFAutor,
  fDesde,
  setFDesde,
  fHasta,
  setFHasta,
  exporting,
  autoresUnicos,
  handleAddObs,
  handleExportExcel,
  handleExportPDF,
  limpiarFiltros,
  inputStyle,
  labelStyle,
}: BitacoraSectionProps) {
  return (
    <div
      style={{
        borderRadius: 14,
        overflow: "hidden",
        border: "1px solid #f0e8e8",
        boxShadow: "0 2px 12px rgba(183,49,44,.08)",
      }}
    >
      {/* ── Header principal ── */}
      <div
        style={{
          background: C.grad,
          padding: "12px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 14 }}>📋</span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "#fff",
            }}
          >
            Bitácora / Observaciones
          </span>
          {/* contador */}
          <span
            style={{
              background: "rgba(255,255,255,.2)",
              color: "#fff",
              fontSize: 10,
              fontWeight: 700,
              padding: "2px 8px",
              borderRadius: 20,
              letterSpacing: "0.05em",
            }}
          >
            {hayFiltros
              ? `${bitacoraFiltrada.length} de ${bitacora?.length ?? 0}`
              : `${bitacora?.length ?? 0} registros`}
          </span>
        </div>

        {/* botones: exports + agregar */}
        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <ExportBtn
            emoji="📊"
            label={exporting === "excel" ? "Generando..." : "Excel"}
            disabled={bitacoraFiltrada.length === 0 || exporting !== null}
            onClick={handleExportExcel}
          />
          <ExportBtn
            emoji="📄"
            label={exporting === "pdf" ? "Generando..." : "PDF"}
            disabled={bitacoraFiltrada.length === 0 || exporting !== null}
            onClick={handleExportPDF}
          />
          <div style={{ width: 1, height: 24, background: "rgba(255,255,255,.25)" }} />
          <button
            onClick={() => setShowObs(!showObs)}
            style={{
              padding: "7px 16px",
              borderRadius: 20,
              border: "2px solid rgba(255,255,255,.5)",
              background: showObs
                ? "rgba(255,255,255,.25)"
                : "rgba(255,255,255,.12)",
              color: "#fff",
              fontWeight: 700,
              cursor: "pointer",
              fontSize: 12,
              transition: "all .2s",
              letterSpacing: "0.05em",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "rgba(255,255,255,.25)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = showObs
                ? "rgba(255,255,255,.25)"
                : "rgba(255,255,255,.12)")
            }
          >
            + Agregar Observación
          </button>
        </div>
      </div>

      {/* ── Barra de filtros ── */}
      <div
        style={{
          background: "#fdf5f5",
          borderBottom: "1px solid #f0e0e0",
          padding: "14px 20px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 140px 140px auto",
            gap: "10px 12px",
            alignItems: "end",
          }}
        >
          {/* Tipo de evento */}
          <div>
            <label style={labelStyle}>Tipo de evento</label>
            <select
              value={fTipo}
              onChange={(e) => setFTipo(e.target.value)}
              style={{
                width: "100%",
                padding: "7px 10px",
                border: "1.5px solid #e8d8d8",
                borderRadius: 8,
                fontSize: 13,
                fontFamily: "Calibri, sans-serif",
                background: "#fff",
                color: fTipo ? "#333" : "#999",
                outline: "none",
                cursor: "pointer",
              }}
            >
              <option value="">Todos los tipos</option>
              <option value="NOTA">Nota</option>
              <option value="MANTENIMIENTO">Mantenimiento</option>
              <option value="INCIDENTE">Incidente</option>
              <option value="CAMBIO_CAMPO">Cambio de campo</option>
              <option value="IMPORTACION">Importación</option>
            </select>
          </div>

          {/* Autor */}
          <div>
            <label style={labelStyle}>Autor</label>
            <datalist id="autores-list">
              {autoresUnicos.map((a) => (
                <option key={a} value={a} />
              ))}
            </datalist>
            <input
              list="autores-list"
              value={fAutor}
              onChange={(e) => setFAutor(e.target.value)}
              placeholder="Todos los autores..."
              style={{
                width: "100%",
                padding: "7px 12px",
                border: "1.5px solid #e8d8d8",
                borderRadius: 8,
                fontSize: 13,
                fontFamily: "Calibri, sans-serif",
                background: "#fff",
                color: "#333",
                outline: "none",
                boxSizing: "border-box",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = C.primary)}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#e8d8d8")}
            />
          </div>

          {/* Desde */}
          <div>
            <label style={labelStyle}>Desde</label>
            <input
              type="date"
              value={fDesde}
              onChange={(e) => setFDesde(e.target.value)}
              style={{
                width: "100%",
                padding: "7px 10px",
                border: "1.5px solid #e8d8d8",
                borderRadius: 8,
                fontSize: 13,
                fontFamily: "Calibri, sans-serif",
                background: "#fff",
                color: "#333",
                outline: "none",
                boxSizing: "border-box",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = C.primary)}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#e8d8d8")}
            />
          </div>

          {/* Hasta */}
          <div>
            <label style={labelStyle}>Hasta</label>
            <input
              type="date"
              value={fHasta}
              onChange={(e) => setFHasta(e.target.value)}
              style={{
                width: "100%",
                padding: "7px 10px",
                border: "1.5px solid #e8d8d8",
                borderRadius: 8,
                fontSize: 13,
                fontFamily: "Calibri, sans-serif",
                background: "#fff",
                color: "#333",
                outline: "none",
                boxSizing: "border-box",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = C.primary)}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#e8d8d8")}
            />
          </div>

          {/* Limpiar */}
          <div>
            {hayFiltros && (
              <button
                onClick={limpiarFiltros}
                style={{
                  padding: "7px 14px",
                  borderRadius: 8,
                  border: "1.5px solid #e0c8c8",
                  background: "#fff",
                  color: C.primary,
                  fontWeight: 700,
                  fontSize: 12,
                  cursor: "pointer",
                  fontFamily: "Calibri, sans-serif",
                  transition: "all .18s",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#fff0ee")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "#fff")
                }
              >
                ✕ Limpiar
              </button>
            )}
          </div>
        </div>

        {/* Indicador de filtros activos */}
        {hayFiltros && (
          <div
            style={{
              marginTop: 10,
              fontSize: 11,
              color: "#888",
              fontFamily: "Calibri, sans-serif",
            }}
          >
            Mostrando <strong style={{ color: C.primary }}>{bitacoraFiltrada.length}</strong> de{" "}
            <strong>{bitacora?.length ?? 0}</strong> registros
            {fTipo && (
              <>
                {" "}
                · Tipo: <strong>{EVENTO_LABEL[fTipo]}</strong>
              </>
            )}
            {fAutor && (
              <>
                {" "}
                · Autor: <strong>{fAutor}</strong>
              </>
            )}
            {fDesde && (
              <>
                {" "}
                · Desde: <strong>{fDesde}</strong>
              </>
            )}
            {fHasta && (
              <>
                {" "}
                · Hasta: <strong>{fHasta}</strong>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Formulario nueva observación ── */}
      {showObs && (
        <div
          style={{
            padding: 24,
            borderBottom: "1px solid #f0e8e8",
            background: "#fff",
            animation: "fadeSlide .2s ease",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 16,
              marginBottom: 14,
            }}
          >
            <div>
              <label style={labelStyle}>Tu nombre</label>
              <input
                style={inputStyle}
                value={obsAutor}
                onChange={(e) => setObsAutor(e.target.value)}
                placeholder="Ej: Juan Pérez"
                onFocus={(e) =>
                  (e.currentTarget.style.borderColor = C.primary)
                }
                onBlur={(e) =>
                  (e.currentTarget.style.borderColor = "#e0e0e0")
                }
              />
            </div>
            <div>
              <label style={labelStyle}>Tipo de evento</label>
              <select
                style={inputStyle}
                value={obsTipo}
                onChange={(e) => setObsTipo(e.target.value as TipoEvento)}
                onFocus={(e) =>
                  (e.currentTarget.style.borderColor = C.primary)
                }
                onBlur={(e) =>
                  (e.currentTarget.style.borderColor = "#e0e0e0")
                }
              >
                <option value="NOTA">Nota</option>
                <option value="MANTENIMIENTO">Mantenimiento</option>
                <option value="INCIDENTE">Incidente</option>
              </select>
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Descripción</label>
            <textarea
              style={{ ...inputStyle, resize: "vertical", minHeight: 80 }}
              value={obsDesc}
              onChange={(e) => setObsDesc(e.target.value)}
              placeholder="Describe el evento o novedad..."
              onFocus={(e) =>
                (e.currentTarget.style.borderColor = C.primary)
              }
              onBlur={(e) =>
                (e.currentTarget.style.borderColor = "#e0e0e0")
              }
            />
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button
              onClick={() => setShowObs(false)}
              style={{
                padding: "9px 20px",
                borderRadius: 8,
                border: "2px solid #e0e0e0",
                background: "#fff",
                color: "#555",
                fontWeight: 600,
                cursor: "pointer",
                fontSize: 13,
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#f0f0f0")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "#fff")
              }
            >
              Cancelar
            </button>
            <button
              onClick={handleAddObs}
              disabled={obsLoading || !obsAutor || !obsDesc}
              style={{
                padding: "9px 20px",
                borderRadius: 8,
                border: "none",
                background: C.grad,
                color: "#fff",
                fontWeight: 700,
                cursor:
                  obsLoading || !obsAutor || !obsDesc
                    ? "not-allowed"
                    : "pointer",
                fontSize: 13,
                opacity: obsLoading || !obsAutor || !obsDesc ? 0.6 : 1,
              }}
            >
              {obsLoading ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </div>
      )}

      {/* ── Lista de entradas ── */}
      <div style={{ padding: "20px 24px", background: "#fff" }}>
        {bitacoraFiltrada.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "40px 20px",
              color: "#ccc",
              fontSize: 14,
            }}
          >
            <div style={{ fontSize: 36, marginBottom: 8, opacity: 0.4 }}>
              {hayFiltros ? "🔍" : "📋"}
            </div>
            {hayFiltros
              ? "Ningún registro coincide con los filtros aplicados"
              : "Sin registros aún"}
            {hayFiltros && (
              <div style={{ marginTop: 12 }}>
                <button
                  onClick={limpiarFiltros}
                  style={{
                    padding: "7px 16px",
                    borderRadius: 8,
                    border: `1.5px solid ${C.primary}`,
                    background: "#fff",
                    color: C.primary,
                    fontWeight: 700,
                    fontSize: 12,
                    cursor: "pointer",
                    fontFamily: "Calibri, sans-serif",
                  }}
                >
                  Limpiar filtros
                </button>
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {bitacoraFiltrada.map((entry: BitacoraEntry) => {
              const ec =
                EVENTO_COLOR[entry.tipoEvento] ?? {
                  bg: "#e2e3e5",
                  color: "#383d41",
                };
              return (
                <div
                  key={entry.id}
                  style={{
                    display: "flex",
                    gap: 14,
                    alignItems: "flex-start",
                    padding: "14px 16px",
                    borderRadius: 10,
                    background: "#fafafa",
                    border: "1px solid #f0eded",
                    transition: "box-shadow .2s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.boxShadow =
                      "0 2px 10px rgba(183,49,44,.08)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.boxShadow = "none")
                  }
                >
                  {/* acento lateral */}
                  <div
                    style={{
                      width: 3,
                      minHeight: 40,
                      borderRadius: 2,
                      flexShrink: 0,
                      background: C.grad,
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 8,
                        alignItems: "center",
                        marginBottom: 6,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: "#333",
                        }}
                      >
                        {entry.autor}
                      </span>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          padding: "2px 10px",
                          borderRadius: 12,
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                          background: ec.bg,
                          color: ec.color,
                        }}
                      >
                        {EVENTO_LABEL[entry.tipoEvento]}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          color: "#bbb",
                          marginLeft: "auto",
                        }}
                      >
                        {new Date(entry.creadoEn).toLocaleString("es-CO")}
                      </span>
                    </div>
                    <p
                      style={{
                        fontSize: 13,
                        color: "#555",
                        margin: 0,
                        lineHeight: 1.55,
                      }}
                    >
                      {entry.descripcion}
                    </p>
                    {entry.campoModificado && (
                      <div
                        style={{
                          marginTop: 8,
                          fontSize: 11,
                          fontFamily: "monospace",
                          background: "#fff",
                          border: "1px solid #eee",
                          borderRadius: 6,
                          padding: "4px 10px",
                          display: "inline-flex",
                          gap: 6,
                          alignItems: "center",
                        }}
                      >
                        <span style={{ color: "#888" }}>
                          {entry.campoModificado}:
                        </span>
                        <span style={{ color: "#c0392b" }}>
                          {entry.valorAnterior || "vacío"}
                        </span>
                        <span style={{ color: "#aaa" }}>→</span>
                        <span style={{ color: "#27ae60" }}>
                          {entry.valorNuevo || "vacío"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
