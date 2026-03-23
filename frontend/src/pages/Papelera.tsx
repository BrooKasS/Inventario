import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getDeleted, restoreAsset } from "../api/client";
import type { Asset } from "../types";

/* ─── Design tokens ─── */
const C = {
  grad:    "linear-gradient(135deg, #FA8200 0%, #861F41 35%, #B7312C 70%, #D86018 100%)",
  primary: "#B7312C",
  accent:  "#FA8200",
  border:  "#F0E8E8",
  surface: "#FAFAFA",
  text:    "#1A1A1A",
  muted:   "#888",
};

const TIPO_LABEL: Record<string, string> = {
  SERVIDOR:   "Servidor",
  BASE_DATOS: "Base de Datos",
  RED:        "Red",
  UPS:        "UPS",
  VPN:        "VPN S2S",
};

const TIPO_ICON: Record<string, string> = {
  SERVIDOR:   "🖥️",
  BASE_DATOS: "🗄️",
  RED:        "🌐",
  UPS:        "⚡",
  VPN:        "🔒",
};

const TIPO_COLOR: Record<string, string> = {
  SERVIDOR:   "#FA8200",
  BASE_DATOS: "#861F41",
  RED:        "#B7312C",
  UPS:        "#D86018",
  VPN:        "#555",
};

function normalize(text: string) {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

function formatFecha(fecha: string | null | undefined) {
  if (!fecha) return "—";
  return new Date(fecha).toLocaleString("es-CO", {
    dateStyle: "medium", timeStyle: "short",
  });
}

/* ─── Badge de tipo ─── */
function TipoBadge({ tipo }: { tipo: string }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      fontSize: 11, fontWeight: 700, padding: "3px 10px",
      borderRadius: 12, textTransform: "uppercase", letterSpacing: ".06em",
      background: `${TIPO_COLOR[tipo]}18`,
      color: TIPO_COLOR[tipo] ?? C.primary,
      border: `1px solid ${TIPO_COLOR[tipo]}33`,
    }}>
      {TIPO_ICON[tipo]} {TIPO_LABEL[tipo] ?? tipo}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
═══════════════════════════════════════════════════════ */
export default function Papelera() {
  const navigate = useNavigate();

  const [assets,    setAssets]    = useState<Asset[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [buscar,    setBuscar]    = useState("");
  const [tipoFiltro, setTipoFiltro] = useState<string>("");
  const [restoring, setRestoring] = useState<string | null>(null);

  const cargar = async () => {
    setLoading(true);
    try {
      const data = await getDeleted();
      setAssets(data ?? []);
    } catch (e) {
      console.error("Error cargando papelera:", e);
      setAssets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  /* ── Filtrado ── */
  const filtrados = useMemo(() => {
    return assets.filter(a => {
      const matchTipo   = !tipoFiltro || a.tipo === tipoFiltro;
      const matchBuscar = !buscar
        || normalize(a.nombre ?? "").includes(normalize(buscar))
        || normalize(a.codigoServicio ?? "").includes(normalize(buscar));
      return matchTipo && matchBuscar;
    });
  }, [assets, buscar, tipoFiltro]);

  /* ── Restaurar ── */
  const handleRestore = async (asset: Asset) => {
    if (!window.confirm(`¿Restaurar "${asset.nombre}" del inventario?`)) return;
    setRestoring(asset.id);
    try {
      await restoreAsset(asset.id, "Sistema");
      await cargar();
    } catch (e) {
      console.error("Error restaurando:", e);
      alert("Error al restaurar el activo.");
    } finally {
      setRestoring(null);
    }
  };

  const tiposDisponibles = [...new Set(assets.map(a => a.tipo))];
  const hayFiltros = !!(buscar || tipoFiltro);

  return (
    <div style={{
      minHeight: "100%",
      padding: "32px 28px",
      fontFamily: "Calibri, 'Segoe UI', sans-serif",
      background: "linear-gradient(160deg, #FA8200 0%, #843952 60%, #b6433f 100%, #D86018)",
    }}>
      <style>{`
        @keyframes spin { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .papelera-row:hover { background: rgba(183,49,44,.04) !important; }
      `}</style>

      <div style={{ maxWidth: 1100, margin: "0 auto" }}>

        {/* ── Header ── */}
        <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 10, fontSize: 22,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: "rgba(255,255,255,.2)",
                boxShadow: "0 4px 12px rgba(0,0,0,.2)",
              }}>🗑</div>
              <h1 style={{
                fontSize: 28, fontWeight: 700, margin: 0, color: "#fff",
                textShadow: "0 2px 8px rgba(0,0,0,.2)",
              }}>
                Papelera
              </h1>
            </div>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,.75)", margin: "4px 0 0 56px" }}>
              {loading ? "Cargando..." : `${assets.length} activo${assets.length !== 1 ? "s" : ""} eliminado${assets.length !== 1 ? "s" : ""}`}
              {hayFiltros && ` · mostrando ${filtrados.length}`}
            </p>
          </div>

          <button
            onClick={() => navigate(-1)}
            style={{
              padding: "10px 18px", borderRadius: 8,
              border: "1.5px solid rgba(255,255,255,.3)",
              background: "rgba(255,255,255,.12)", color: "#fff",
              fontWeight: 600, fontSize: 13, cursor: "pointer",
              fontFamily: "Calibri, sans-serif",
            }}
          >
            ← Volver
          </button>
        </div>

        {/* ── Filtros ── */}
        <div style={{
          background: "#fff",
          borderRadius: 12,
          padding: "16px 20px",
          marginBottom: 16,
          display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap",
          boxShadow: "0 2px 12px rgba(0,0,0,.12)",
        }}>
          {/* Búsqueda */}
          <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
            <span style={{
              position: "absolute", left: 10, top: "50%",
              transform: "translateY(-50%)", fontSize: 14, pointerEvents: "none",
            }}>🔍</span>
            <input
              value={buscar}
              onChange={e => setBuscar(e.target.value)}
              placeholder="Buscar por nombre o código..."
              style={{
                width: "100%", padding: "8px 12px 8px 32px",
                border: `1.5px solid ${C.border}`, borderRadius: 8,
                fontSize: 13, fontFamily: "Calibri, sans-serif",
                outline: "none", background: "#fff", color: C.text,
                boxSizing: "border-box",
              }}
              onFocus={e => (e.currentTarget.style.borderColor = C.primary)}
              onBlur={e => (e.currentTarget.style.borderColor = C.border)}
            />
          </div>

          {/* Filtro por tipo */}
          <select
            value={tipoFiltro}
            onChange={e => setTipoFiltro(e.target.value)}
            style={{
              padding: "8px 12px", border: `1.5px solid ${C.border}`,
              borderRadius: 8, fontSize: 13, fontFamily: "Calibri, sans-serif",
              background: "#fff", color: tipoFiltro ? C.text : C.muted,
              outline: "none", cursor: "pointer", minWidth: 160,
            }}
            onFocus={e => (e.currentTarget.style.borderColor = C.primary)}
            onBlur={e => (e.currentTarget.style.borderColor = C.border)}
          >
            <option value="">Todos los tipos</option>
            {tiposDisponibles.map(t => (
              <option key={t} value={t}>{TIPO_ICON[t]} {TIPO_LABEL[t] ?? t}</option>
            ))}
          </select>

          {/* Limpiar */}
          {hayFiltros && (
            <button
              onClick={() => { setBuscar(""); setTipoFiltro(""); }}
              style={{
                padding: "8px 14px", borderRadius: 8,
                border: `1.5px solid ${C.border}`,
                background: "#fff", color: C.primary,
                fontWeight: 700, fontSize: 12, cursor: "pointer",
                fontFamily: "Calibri, sans-serif",
              }}
            >
              ✕ Limpiar
            </button>
          )}
        </div>

        {/* ── Tabla ── */}
        <div style={{
          borderRadius: 14, overflow: "hidden",
          border: "1px solid rgba(255,255,255,.08)",
          boxShadow: "0 8px 32px rgba(0,0,0,.35)",
          animation: "fadeIn .3s ease",
        }}>
          {/* Header tabla */}
          <div style={{
            background: C.grad, padding: "14px 20px",
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <span style={{
              fontSize: 14, width: 28, height: 28, borderRadius: 8,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "rgba(255,255,255,.18)",
            }}>🗑</span>
            <span style={{
              fontSize: 11, fontWeight: 700, letterSpacing: "0.14em",
              textTransform: "uppercase", color: "#fff",
            }}>
              Activos en papelera
            </span>
            {filtrados.length > 0 && (
              <span style={{
                marginLeft: "auto", fontSize: 11, fontWeight: 700,
                background: "rgba(255,255,255,.2)", color: "#fff",
                padding: "2px 10px", borderRadius: 20,
              }}>
                {filtrados.length} registro{filtrados.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          <div style={{ background: "#fff" }}>
            {loading ? (
              <div style={{
                padding: "64px 40px", textAlign: "center",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 14,
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: "50%",
                  border: "4px solid #f0e8e8",
                  borderTop: `4px solid ${C.accent}`,
                  animation: "spin 1s linear infinite",
                }} />
                <span style={{ color: C.muted, fontSize: 14 }}>Cargando papelera...</span>
              </div>
            ) : filtrados.length === 0 ? (
              <div style={{ padding: "64px 40px", textAlign: "center" }}>
                <div style={{ fontSize: 52, marginBottom: 12, opacity: 0.2 }}>🗑</div>
                <p style={{ color: C.muted, fontSize: 15, margin: 0 }}>
                  {hayFiltros ? "No hay resultados con los filtros aplicados" : "La papelera está vacía"}
                </p>
                {hayFiltros && (
                  <button
                    onClick={() => { setBuscar(""); setTipoFiltro(""); }}
                    style={{
                      marginTop: 14, padding: "8px 18px", borderRadius: 8,
                      border: `1.5px solid ${C.primary}`,
                      background: "#fff", color: C.primary,
                      fontWeight: 700, fontSize: 13, cursor: "pointer",
                    }}
                  >
                    Limpiar filtros
                  </button>
                )}
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
                  <thead>
                    <tr style={{ background: "rgb(90,56,112)" }}>
                      {["Nombre", "Tipo", "Código", "Ubicación", "Eliminado el", "Acción"].map((h, i, arr) => (
                        <th key={h} style={{
                          padding: "11px 18px", textAlign: "left",
                          fontSize: 10, fontWeight: 700,
                          textTransform: "uppercase", letterSpacing: "0.1em",
                          color: "#fff", whiteSpace: "nowrap",
                          borderRight: i < arr.length - 1 ? "1px solid rgba(255,255,255,.06)" : "none",
                        }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtrados.map((a, idx) => (
                      <tr
                        key={a.id}
                        className="papelera-row"
                        style={{
                          borderBottom: `1px solid ${C.border}`,
                          background: idx % 2 === 0 ? "#fff" : C.surface,
                          transition: "background .15s",
                        }}
                      >
                        <td style={{ padding: "13px 18px", fontSize: 14, color: C.text, fontFamily: "Calibri, sans-serif" }}>
                          <strong style={{ opacity: 0.7 }}>{a.nombre ?? "—"}</strong>
                        </td>
                        <td style={{ padding: "13px 18px" }}>
                          <TipoBadge tipo={a.tipo} />
                        </td>
                        <td style={{ padding: "13px 18px", fontSize: 13, color: C.muted, fontFamily: "Calibri, sans-serif" }}>
                          {a.codigoServicio ?? "—"}
                        </td>
                        <td style={{ padding: "13px 18px", fontSize: 13, color: C.muted, fontFamily: "Calibri, sans-serif" }}>
                          {a.ubicacion ?? "—"}
                        </td>
                        <td style={{ padding: "13px 18px", fontSize: 12, color: C.muted, fontFamily: "Calibri, sans-serif", whiteSpace: "nowrap" }}>
                          {formatFecha((a as any).deletedAt)}
                        </td>
                        <td style={{ padding: "13px 18px" }}>
                          <button
                            onClick={() => handleRestore(a)}
                            disabled={restoring === a.id}
                            style={{
                              padding: "7px 16px", borderRadius: 8, border: "none",
                              background: restoring === a.id ? "#ccc" : C.grad,
                              color: "#fff", fontWeight: 700, fontSize: 12,
                              cursor: restoring === a.id ? "not-allowed" : "pointer",
                              fontFamily: "Calibri, sans-serif",
                              display: "flex", alignItems: "center", gap: 6,
                              boxShadow: restoring === a.id ? "none" : "0 2px 8px rgba(183,49,44,.2)",
                              transition: "all .15s",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {restoring === a.id ? (
                              <>
                                <div style={{
                                  width: 12, height: 12,
                                  border: "2px solid rgba(255,255,255,.3)",
                                  borderTop: "2px solid #fff",
                                  borderRadius: "50%",
                                  animation: "spin 1s linear infinite",
                                }} />
                                Restaurando...
                              </>
                            ) : (
                              <>♻️ Restaurar</>
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* ── Nota informativa ── */}
        {!loading && assets.length > 0 && (
          <p style={{
            marginTop: 16, fontSize: 12,
            color: "rgba(255,255,255,.6)",
            fontFamily: "Calibri, sans-serif",
            textAlign: "center",
          }}>
            Los activos en papelera no aparecen en el inventario ni en las estadísticas.
            Restaurarlos los devuelve al inventario activo.
          </p>
        )}
      </div>
    </div>
  );
}