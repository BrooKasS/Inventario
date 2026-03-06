// src/pages/Dashboard.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getStats, getAssets, getAssetById } from "../api/client";
import type { StatsResponse, Asset } from "../types";
import {
  exportarActivosExcel,
  exportarActivosPDF,
  exportarObservacionesExcel,
  exportarObservacionesPDF,
  type ObservacionRow
} from "../utils/exporters";
import Modal from "../components/Modal"

const GRAD = "linear-gradient(135deg, #fa8100 0%, #861F41 35%, #B7312C 70%, #D86018 100%)";

const TIPO_LABEL: Record<string, string> = {
  SERVIDOR:   "Servidores",
  BASE_DATOS: "Bases de Datos",
  RED:        "Red",
  UPS:        "UPS",
};

const TIPO_LABEL_SINGULAR: Record<string, string> = {
  SERVIDOR:   "Servidor",
  BASE_DATOS: "Base de Datos",
  RED:        "Red",
  UPS:        "UPS",
};

const TIPO_ICON: Record<string, string> = {
  SERVIDOR:   "🖥️",
  BASE_DATOS: "🗄️",
  RED:        "🌐",
  UPS:        "⚡",
};

const TIPO_GRAD: Record<string, string> = {
  SERVIDOR:   "linear-gradient(135deg, #FA8200, #D86018)",
  BASE_DATOS: "linear-gradient(135deg, #861F41, #B7312C)",
  RED:        "linear-gradient(135deg, #B7312C, #D86018)",
  UPS:        "linear-gradient(135deg, #FA8200, #861F41)",
};

const EVENTO_LABEL_MAP: Record<string, string> = {
  IMPORTACION: "Importación",
  CAMBIO_CAMPO: "Cambio de campo",
  MANTENIMIENTO: "Mantenimiento",
  INCIDENTE: "Incidente",
  NOTA: "Nota",
};
const EVENTOS = ["NOTA", "MANTENIMIENTO", "INCIDENTE", "CAMBIO_CAMPO", "IMPORTACION"] as const;

/* ── Stat card ── */
function StatCard({
  icon, label, value, grad, onClick,
}: {
  icon?: string; label: string; value: number | string | undefined;
  grad: string; onClick?: () => void;
}) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: grad, borderRadius: 14, padding: "22px 20px",
        boxShadow: hov ? "0 12px 32px rgb(104, 104, 104)" : "0 4px 16px rgba(78, 78, 78, 0.82)",
        cursor: onClick ? "pointer" : "default",
        transition: "all .2s",
        transform: hov ? "translateY(-4px) scale(1.02)" : "none",
        fontFamily: "Calibri, 'Segoe UI', sans-serif",
        position: "relative", overflow: "hidden",
      }}
    >
      <div style={{
        position: "absolute", right: -20, top: -20, width: 80, height: 80,
        borderRadius: "50%", background: "rgba(255,255,255,.10)",
      }} />
      <div style={{
        position: "absolute", right: 12, bottom: -26, width: 60, height: 60,
        borderRadius: "50%", background: "rgba(22, 21, 21, 0.07)",
      }} />
      {icon && (
        <div style={{
          fontSize: 28, marginBottom: 12, lineHeight: 1, display: "inline-block",
          transition: "transform .2s", transform: hov ? "scale(1.2)" : "scale(1)",
          filter: "drop-shadow(0 2px 6px rgba(255, 1, 1, 0.25))",
        }}>
          {icon}
        </div>
      )}
      <div style={{
        fontSize: 38, fontWeight: 700, color: "#fff", lineHeight: 1,
        marginBottom: 6, textShadow: "0 2px 8px rgba(0,0,0,.2)",
      }}>
        {value ?? "—"}
      </div>
      <div style={{
        fontSize: 10, fontWeight: 700, letterSpacing: "0.12em",
        textTransform: "uppercase", color: "rgba(255,255,255,.75)",
      }}>
        {label}
      </div>
    </div>
  );
}

/* ── Row reciente ── */
function RecentRow({ a, onClick }: { a: Asset; onClick: () => void }) {
  const [hov, setHov] = useState(false);
  return (
    <tr
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        cursor: "pointer",
        background: hov ? "rgba(250, 129, 0, 0.27)" : "transparent",
        transition: "background .15s",
        borderBottom: "1px solid rgba(255,255,255,.06)",
      }}
    >
      <td style={{
        padding: "13px 18px", fontSize: 15, fontWeight: 600,
        color: hov ? "#ff8800" : "#000000",
        fontFamily: "Calibri, sans-serif",
        borderLeft: hov ? "3px solid #ff7e22" : "3px solid transparent",
        transition: "all .40s",
      }}>
        {a.nombre ?? "—"}
      </td>
      <td style={{ padding: "13px 18px" }}>
        <span style={{
          display: "inline-block", padding: "3px 12px", borderRadius: 20,
          fontSize: 12, fontWeight: 700, textTransform: "uppercase",
          letterSpacing: "0.06em",
          background: "rgba(250,130,0,.18)", color: "#FA8200",
          border: "1px solid rgba(250,130,0,.3)",
          fontFamily: "Calibri, sans-serif",
        }}>
          {TIPO_LABEL[a.tipo]}
        </span>
      </td>
      <td style={{
        padding: "13px 18px", fontSize: 15,
        color: "rgb(0, 0, 0)", fontFamily: "Calibri, sans-serif",
      }}>
        {a.codigoServicio ?? "—"}
      </td>
      <td style={{
        padding: "13px 18px", fontSize: 15,
        color: "rgb(0, 0, 0)", fontFamily: "Calibri, sans-serif",
      }}>
        {new Date(a.actualizadoEn).toLocaleString("es-CO", {
          dateStyle: "medium", timeStyle: "short",
        })}
      </td>
    </tr>
  );
}

/* ── Main ── */
export default function Dashboard() {
  const [stats,   setStats]   = useState<StatsResponse | null>(null);
  const [recent,  setRecent]  = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // --- Modal ---
  const [modalOpen, setModalOpen] = useState(false);

  // --- Panel de exportación ---
  const [exportMode, setExportMode] = useState<"activos" | "observaciones">("activos");

  const [tiposSel, setTiposSel] = useState<string[]>([]); // vacío = todos
  const [buscar, setBuscar] = useState("");

  const [pageSize] = useState(200); // preview
  const [preview, setPreview] = useState<Asset[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [seleccion, setSeleccion] = useState<Set<string>>(new Set());
  const [exporting, setExporting] = useState<"excel" | "pdf" | null>(null);

  // Filtros de Observaciones
  const [eventosSel, setEventosSel] = useState<string[]>([]); // vacío = todos
  const [obsAutor, setObsAutor] = useState("");
  const [obsDesde, setObsDesde] = useState("");
  const [obsHasta, setObsHasta] = useState("");
  const [incluirSistema, setIncluirSistema] = useState(false); // EXCLUIR 'sistema' por defecto

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [statsData, recentData] = await Promise.all([
          getStats(),
          getAssets({ limit: 10, page: 1 }),
        ]);
        setStats(statsData);
        setRecent(recentData.assets || []);
      } catch (err) {
        console.error("Error cargando dashboard:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // cargar vista previa (primeras N coincidencias)
  const cargarPreview = async () => {
    try {
      setPreviewLoading(true);
      setSeleccion(new Set());

      const resp = await getAssets({ limit: pageSize, page: 1, tipos: tiposSel, search: buscar });
      const items = resp.assets || [];

      // Filtro client-side defensivo
      const filtrados = items.filter((a: Asset) => {
        const okTipo = tiposSel.length === 0 ? true : tiposSel.includes(a.tipo);
        const q = buscar.trim().toLowerCase();
        const okSearch = !q
          ? true
          : (a.nombre?.toLowerCase().includes(q) ||
             a.codigoServicio?.toLowerCase().includes(q) ||
             a.ubicacion?.toLowerCase().includes(q));
        return okTipo && okSearch;
      });

      // 🔁 CAMBIO: si el modo es "observaciones", traemos detalle (bitácora) de cada activo de la vista previa
      if (exportMode === "observaciones") {
        const detallados = await Promise.all(
          filtrados.map(a =>
            getAssetById(a.id).catch(() => a) // si falla, dejamos el asset tal cual
          )
        );
        setPreview(detallados);
      } else {
        setPreview(filtrados);
      }
    } catch (err) {
      console.error("Error cargando vista previa:", err);
      setPreview([]);
    } finally {
      setPreviewLoading(false);
    }
  };

  // helper UX
  const allSelected = useMemo(() => {
    return preview.length > 0 && preview.every(a => seleccion.has(a.id));
  }, [preview, seleccion]);

  const toggleTipo = (tipo: string) => {
    setTiposSel(prev => (
      prev.includes(tipo) ? prev.filter(t => t !== tipo) : [...prev, tipo]
    ));
  };

  const toggleSeleccion = (id: string) => {
    setSeleccion(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  const seleccionarTodos = () => {
    if (allSelected) {
      setSeleccion(new Set());
    } else {
      setSeleccion(new Set(preview.map(a => a.id)));
    }
  };

  async function fetchAllActivos(tipos: string[], search: string) {
    const limit = 500; // ajústalo si el backend lo permite
    let page = 1;
    let out: Asset[] = [];
    for (let i = 0; i < 20; i++) { // paginación defensiva
      const resp = await getAssets({ limit, page, tipos, search });
      const items = resp.assets || [];
      out = out.concat(items);
      const total = resp.total || out.length;
      if (out.length >= total || items.length === 0) break;
      page++;
    }

    // Filtro client-side defensivo
    const q = search.trim().toLowerCase();
    return out.filter(a => {
      const okTipo = tipos.length === 0 ? true : tipos.includes(a.tipo);
      const okSearch = !q
        ? true
        : (a.nombre?.toLowerCase().includes(q) ||
           a.codigoServicio?.toLowerCase().includes(q) ||
           a.ubicacion?.toLowerCase().includes(q));
      return okTipo && okSearch;
    });
  }

  async function activosParaExportar(): Promise<Asset[]> {
    if (seleccion.size === 0) {
      return await fetchAllActivos(tiposSel, buscar);
    }
    const todos = await fetchAllActivos(tiposSel, buscar);
    const ids = new Set(seleccion);
    return todos.filter(a => ids.has(a.id));
  }

  function esSistema(autor?: string) {
    return (autor ?? "").trim().toLowerCase() === "sistema";
  }
  function tieneCampoModificado(e: any) {
    const campo = (e?.campoModificado ?? "").toString().trim();
    return campo.length > 0;
  }

  function pasaFiltroObservacion(
    e: any, // BitacoraEntry
    autor: string,
    desde: string,
    hasta: string,
    eventos: string[],
    incluirSis: boolean
  ) {
    // Tratamiento especial para "sistema"
    if (esSistema(e.autor)) {
      // Si NO se incluye sistema → descartar todo lo de sistema
      if (!incluirSis) return false;
      // Si SÍ se incluye sistema → solo aceptar con campoModificado
      if (!tieneCampoModificado(e)) return false;
    }

    // Tipo(s) de evento
    if (eventos.length > 0 && !eventos.includes(e.tipoEvento)) return false;

    // Autor (contiene, case-insensitive)
    if (autor && !e.autor?.toLowerCase().includes(autor.toLowerCase())) return false;

    // Rango de fechas
    const f = new Date(e.creadoEn);
    if (desde) {
      const d = new Date(desde);
      d.setHours(0, 0, 0, 0);
      if (f < d) return false;
    }
    if (hasta) {
      const h = new Date(hasta);
      h.setHours(23, 59, 59, 999);
      if (f > h) return false;
    }

    return true;
  }

  async function prepararObservacionesRows(): Promise<ObservacionRow[]> {
    const base = await activosParaExportar();

    // Cargar detalle con bitácora (paralelo con manejo de errores)
    const detalles = await Promise.all(
      base.map(a => getAssetById(a.id).catch(() => null))
    );
    const activosDetallados = detalles.filter((d): d is Asset => !!d);

    const rows: ObservacionRow[] = [];
    for (const a of activosDetallados) {
      const bit = (a as any).bitacora ?? [];
      for (const e of bit) {
        if (!pasaFiltroObservacion(e, obsAutor, obsDesde, obsHasta, eventosSel, incluirSistema)) continue;
        rows.push({
          Activo: a.nombre ?? "—",
          Tipo: TIPO_LABEL_SINGULAR[a.tipo] ?? a.tipo,
          Código: a.codigoServicio ?? "—",
          Ubicación: a.ubicacion ?? "—",
          Fecha: new Date(e.creadoEn).toLocaleString("es-CO"),
          Autor: e.autor,
          "Tipo de evento": EVENTO_LABEL_MAP[e.tipoEvento] ?? e.tipoEvento,
          Descripción: e.descripcion,
          "Campo modificado": e.campoModificado ?? "",
          "Valor anterior": e.valorAnterior ?? "",
          "Valor nuevo": e.valorNuevo ?? "",
        });
      }
    }
    // Si no hay filas, implica que solo activos con observaciones pasan al exporte.
    return rows;
  }

  const handleExportExcel = async () => {
    try {
      setExporting("excel");
      const nombre = tiposSel.length === 0 ? "Todos" : tiposSel.join("_");

      if (exportMode === "activos") {
        const data = await activosParaExportar();
        if (data.length === 0) {
          alert("No hay activos para exportar con los filtros/selección actuales.");
          return;
        }
        await exportarActivosExcel(data, nombre);
      } else {
        const rows = await prepararObservacionesRows();
        if (rows.length === 0) {
          alert("No hay observaciones con los filtros/selección actuales.");
          return;
        }
        await exportarObservacionesExcel(rows, nombre);
      }
    } catch (e) {
      console.error("Error exportando Excel:", e);
      alert("Error exportando a Excel");
    } finally {
      setExporting(null);
    }
  };

  const handleExportPDF = async () => {
    try {
      setExporting("pdf");
      const nombre = tiposSel.length === 0 ? "Todos" : tiposSel.join("_");

      if (exportMode === "activos") {
        const data = await activosParaExportar();
        if (data.length === 0) {
          alert("No hay activos para exportar con los filtros/selección actuales.");
          return;
        }
        await exportarActivosPDF(data, nombre);
      } else {
        const rows = await prepararObservacionesRows();
        if (rows.length === 0) {
          alert("No hay observaciones con los filtros/selección actuales.");
          return;
        }
        await exportarObservacionesPDF(rows, nombre);
      }
    } catch (e) {
      console.error("Error exportando PDF:", e);
      alert("Error exportando a PDF");
    } finally {
      setExporting(null);
    }
  };

  return (
    <div style={{
      minHeight: "100%", padding: "32px 28px",
      fontFamily: "Calibri, 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      background: "linear-gradient(160deg, #FA8200 0%, #843952 60%, #b6433f 100%, #D86018)",
    }}>
      <style>{`@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}`}</style>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 16 }}>
          <h1 style={{
            fontSize: 28, fontWeight: 700, margin: 0,
            background: "#fff", WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent", backgroundClip: "text",
          }}>
            Dashboard
          </h1>
          <p style={{ fontSize: 20, color: "rgb(255, 255, 255)", margin: "6px 0 12px" }}>
            Estado general del inventario de infraestructura
          </p>

          {/* Botón que abre el modal */}
          <button
            onClick={() => setModalOpen(true)}
            style={{
              padding: "10px 20px",
              borderRadius: 8,
              border: "none",
              background: GRAD,
              color: "#fff",
              fontWeight: 700,
              cursor: "pointer",
              fontSize: 14,
              boxShadow: "0 4px 12px rgba(0,0,0,.25)",
            }}
          >
            📤 Exportar
          </button>
        </div>

        {/* Loading principal */}
        {loading && (
          <div style={{
            background: "rgba(255,255,255,.04)", borderRadius: 14,
            padding: "64px 40px", textAlign: "center",
            border: "1px solid rgba(255,255,255,.08)",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 14,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: "50%",
              border: "4px solid rgba(255,255,255,.1)",
              borderTop: "4px solid #FA8200",
              animation: "spin 1s linear infinite",
            }} />
            <span style={{ color: "rgba(255,255,255,.35)", fontSize: 14 }}>Cargando datos...</span>
          </div>
        )}

        {!loading && (
          <>
            {/* ── Stats grid ── */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))",
              gap: 16, marginBottom: 24,
            }}>
              <StatCard label="Total Activos" value={stats?.total} grad={GRAD} />
              {stats?.porTipo.map(t => (
                <StatCard
                  key={t.tipo}
                  icon={TIPO_ICON[t.tipo]}
                  label={TIPO_LABEL[t.tipo]}
                  value={t.count}
                  grad={TIPO_GRAD[t.tipo] ?? GRAD}
                  onClick={() => navigate(`/inventario/${t.tipo}`)}
                />
              ))}
            </div>

            {/* ── Actividad Reciente ── */}
            <div style={{
              borderRadius: 14, overflow: "hidden",
              border: "1px solid rgba(255,255,255,.08)",
              boxShadow: "0 8px 32px rgba(0,0,0,.35)",
            }}>
              <div style={{
                background: GRAD, padding: "14px 20px",
                display: "flex", alignItems: "center", gap: 10,
              }}>
                <span style={{
                  fontSize: 16, width: 30, height: 30, borderRadius: 8,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: "rgba(255,255,255,.18)",
                }}>🕐</span>
                <span style={{
                  fontSize: 14, fontWeight: 700, letterSpacing: "0.10em",
                  textTransform: "uppercase", color: "#fff",
                }}>
                  Actividad Reciente
                </span>
              </div>

              <div style={{ background: "rgb(255, 255, 255)" }}>
                {recent.length === 0 ? (
                  <div style={{ padding: "64px 40px", textAlign: "center" }}>
                    <div style={{ fontSize: 52, marginBottom: 12, opacity: 0.2 }}>📭</div>
                    <p style={{ color: "rgba(0, 0, 0, 0.3)", fontSize: 15, margin: 0 }}>
                      No hay actividad reciente
                    </p>
                  </div>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}>
                      <thead>
                        <tr style={{ background: "rgb(90, 56, 112)" }}>
                          {["Activo", "Tipo", "Código", "Última actualización"].map((h, i, arr) => (
                            <th key={h} style={{
                              padding: "11px 15px", textAlign: "left",
                              fontSize: 12, fontWeight: 700, textTransform: "uppercase",
                              letterSpacing: "0.2em", color: "rgb(255, 255, 255)",
                              whiteSpace: "nowrap",
                              borderRight: i < arr.length - 1 ? "1px solid rgba(255, 255, 255, 0.06)" : "none",
                            }}>
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {recent.map(a => (
                          <RecentRow key={a.id} a={a} onClick={() => navigate(`/activo/${a.id}`)} />
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* ────────────────────────── MODAL DE EXPORTACIÓN ────────────────────────── */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={exportMode === "activos" ? "Exportar Activos" : "Exportar Observaciones"}
        width={1100}
      >
        {/* Contenedor (mismo panel dentro del modal) */}
        <div style={{
          borderRadius: 14, overflow: "hidden",
          border: "1px solid rgba(0,0,0,.06)",
          boxShadow: "0 6px 28px rgba(0,0,0,.12)",
        }}>
          {/* Header del panel */}
          <div style={{
            background: GRAD, padding: "12px 20px",
            display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10,
            borderTopLeftRadius: 14, borderTopRightRadius: 14,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{
                fontSize: 16, width: 30, height: 30, borderRadius: 8,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: "rgba(255,255,255,.18)",
              }}>📤</span>
              <span style={{
                fontSize: 11, fontWeight: 700, letterSpacing: "0.14em",
                textTransform: "uppercase", color: "#fff",
              }}>
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
                    color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer",
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
                    color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer",
                  }}
                >
                  Observaciones
                </button>
              </div>

              <button
                onClick={handleExportExcel}
                disabled={exporting !== null}
                style={{
                  padding: "7px 14px", borderRadius: 8, border: "1.5px solid rgba(255,255,255,.4)",
                  background: exporting === "excel" ? "rgba(255,255,255,.25)" : "rgba(255,255,255,.12)",
                  color: "#fff", fontWeight: 700, fontSize: 12, cursor: exporting ? "not-allowed" : "pointer",
                }}
              >
                {exporting === "excel" ? "Generando..." : "📊 Excel"}
              </button>
              <button
                onClick={handleExportPDF}
                disabled={exporting !== null}
                style={{
                  padding: "7px 14px", borderRadius: 8, border: "1.5px solid rgba(255,255,255,.4)",
                  background: exporting === "pdf" ? "rgba(255,255,255,.25)" : "rgba(255,255,255,.12)",
                  color: "#fff", fontWeight: 700, fontSize: 12, cursor: exporting ? "not-allowed" : "pointer",
                }}
              >
                {exporting === "pdf" ? "Generando..." : "📄 PDF"}
              </button>
            </div>
          </div>

          {/* Controles */}
          <div style={{ background: "rgba(255,255,255,.04)", padding: 16 }}>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 12, alignItems: "end",
            }}>
              {/* Tipos */}
              <div>
                <div style={{ color: "#333", fontSize: 12, marginBottom: 6, opacity: 0.9, fontWeight: 700, letterSpacing: ".06em" }}>
                  Tipos de Activo
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {["SERVIDOR","BASE_DATOS","RED","UPS"].map(tipo => {
                    const active = tiposSel.includes(tipo);
                    return (
                      <button
                        key={tipo}
                        onClick={() => toggleTipo(tipo)}
                        style={{
                          padding: "6px 10px", borderRadius: 14, fontSize: 12, fontWeight: 700,
                          border: active ? "1.5px solid #B7312C" : "1.5px solid rgba(0,0,0,.2)",
                          background: active ? "rgba(183,49,44,.10)" : "rgba(0,0,0,.04)",
                          color: "#333", cursor: "pointer",
                          letterSpacing: ".03em",
                        }}
                      >
                        {TIPO_ICON[tipo]} {TIPO_LABEL[tipo]}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setTiposSel([])}
                    style={{
                      padding: "6px 10px", borderRadius: 14, fontSize: 12, fontWeight: 700,
                      border: "1.5px solid rgba(0,0,0,.2)",
                      background: "rgba(0,0,0,.04)", color: "#333",
                    }}
                  >
                    Todos
                  </button>
                </div>
              </div>

              {/* Búsqueda */}
              <div>
                <div style={{ color: "#333", fontSize: 12, marginBottom: 6, opacity: 0.9, fontWeight: 700, letterSpacing: ".06em" }}>
                  Buscar (Nombre / Código / Ubicación)
                </div>
                <input
                  value={buscar}
                  onChange={(e) => setBuscar(e.target.value)}
                  placeholder="Ej. 'Oracle' o 'SRV-001'"
                  style={{
                    width: "100%", padding: "8px 12px", borderRadius: 8,
                    border: "1.5px solid rgba(0,0,0,.2)", background: "#fff",
                    color: "#333", outline: "none",
                  }}
                />
              </div>

              {/* Acciones vista previa */}
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={cargarPreview}
                  disabled={previewLoading}
                  style={{
                    padding: "8px 14px", borderRadius: 8, border: "none",
                    background: "linear-gradient(135deg, #FA8200, #B7312C)", color: "#fff",
                    fontWeight: 700, cursor: previewLoading ? "not-allowed" : "pointer",
                  }}
                >
                  {previewLoading ? "Cargando..." : "Cargar vista previa"}
                </button>
                <button
                  onClick={seleccionarTodos}
                  disabled={preview.length === 0}
                  style={{
                    padding: "8px 14px", borderRadius: 8, border: "1.5px solid rgba(0,0,0,.2)",
                    background: "rgba(0,0,0,.04)", color: "#333",
                    fontWeight: 700, cursor: preview.length === 0 ? "not-allowed" : "pointer",
                  }}
                >
                  {allSelected ? "Quitar selección" : "Seleccionar todos (vista)"}
                </button>
              </div>
            </div>

            {/* Filtros de Observaciones (solo en modo observaciones) */}
            {exportMode === "observaciones" && (
              <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", gap: 12 }}>
                {/* Tipos de evento */}
                <div>
                  <div style={{ color: "#333", fontSize: 12, marginBottom: 6, opacity: 0.9, fontWeight: 700, letterSpacing: ".06em" }}>
                    Tipos de evento
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {EVENTOS.map(te => {
                      const active = eventosSel.includes(te);
                      return (
                        <button
                          key={te}
                          onClick={() => setEventosSel(prev => prev.includes(te) ? prev.filter(x => x !== te) : [...prev, te])}
                          style={{
                            padding: "6px 10px", borderRadius: 14, fontSize: 12, fontWeight: 700,
                            border: active ? "1.5px solid #B7312C" : "1.5px solid rgba(0,0,0,.2)",
                            background: active ? "rgba(183,49,44,.10)" : "rgba(0,0,0,.04)",
                            color: "#333", cursor: "pointer",
                          }}
                        >
                          {EVENTO_LABEL_MAP[te]}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setEventosSel([])}
                      style={{
                        padding: "6px 10px", borderRadius: 14, fontSize: 12, fontWeight: 700,
                        border: "1.5px solid rgba(0,0,0,.2)",
                        background: "rgba(0,0,0,.04)", color: "#333",
                      }}
                    >
                      Todos
                    </button>
                  </div>
                </div>

                {/* Autor */}
                <div>
                  <div style={{ color: "#333", fontSize: 12, marginBottom: 6, opacity: 0.9, fontWeight: 700, letterSpacing: ".06em" }}>
                    Autor
                  </div>
                  <input
                    value={obsAutor}
                    onChange={e => setObsAutor(e.target.value)}
                    placeholder="Ej. 'Juan' (contiene)"
                    style={{
                      width: "100%", padding: "8px 12px", borderRadius: 8,
                      border: "1.5px solid rgba(0,0,0,.2)", background: "#fff",
                      color: "#333", outline: "none",
                    }}
                  />
                </div>

                {/* Desde */}
                <div>
                  <div style={{ color: "#333", fontSize: 12, marginBottom: 6, opacity: 0.9, fontWeight: 700, letterSpacing: ".06em" }}>
                    Desde
                  </div>
                  <input
                    type="date"
                    value={obsDesde}
                    onChange={e => setObsDesde(e.target.value)}
                    style={{
                      width: "100%", padding: "8px 12px", borderRadius: 8,
                      border: "1.5px solid rgba(0,0,0,.2)", background: "#fff",
                      color: "#333", outline: "none",
                    }}
                  />
                </div>

                {/* Hasta */}
                <div>
                  <div style={{ color: "#333", fontSize: 12, marginBottom: 6, opacity: 0.9, fontWeight: 700, letterSpacing: ".06em" }}>
                    Hasta
                  </div>
                  <input
                    type="date"
                    value={obsHasta}
                    onChange={e => setObsHasta(e.target.value)}
                    style={{
                      width: "100%", padding: "8px 12px", borderRadius: 8,
                      border: "1.5px solid rgba(0,0,0,.2)", background: "#fff",
                      color: "#333", outline: "none",
                    }}
                  />
                </div>

                {/* Incluir Sistema */}
                <div>
                  <div style={{ color: "#333", fontSize: 12, marginBottom: 6, opacity: 0.9, fontWeight: 700, letterSpacing: ".06em" }}>
                    Autor "sistema"
                  </div>
                  <label style={{ display: "flex", gap: 8, alignItems: "center", color: "#333" }}>
                    <input
                      type="checkbox"
                      checked={incluirSistema}
                      onChange={(e) => setIncluirSistema(e.target.checked)}
                    />
                    <span style={{ fontSize: 13 }}>
                      {incluirSistema ? "Incluir registros de sistema (solo con campo modificado)" : "Excluir registros de sistema"}
                    </span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Tabla vista previa + selección */}
          <div style={{
            background: "#e2e2e2",
            borderTop: "1px solid rgba(0,0,0,.06)",
            borderBottomLeftRadius: 14,
            borderBottomRightRadius: 14,
          }}>
            {previewLoading ? (
              <div style={{ padding: "28px 20px" }}>Cargando vista previa…</div>
            ) : preview.length === 0 ? (
              <div style={{ padding: "28px 20px", color: "#777" }}>
                No hay resultados con los filtros actuales. Carga la vista previa para ver y seleccionar.
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                {/* ------- TABLA PARA ACTIVOS ------- */}
                {exportMode === "activos" && (
                  <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 720 }}>
                    <thead>
                      <tr style={{ background: "rgba(0,0,0,.05)" }}>
                        {["", "Activo", "Tipo", "Código", "Ubicación", "Actualizado"].map((h) => (
                          <th key={h} style={{
                            padding: "10px 14px", textAlign: "left",
                            fontSize: 11, fontWeight: 700, textTransform: "uppercase",
                            letterSpacing: ".08em", color: "#444",
                            borderBottom: "1px solid rgba(0,0,0,.06)",
                          }}>
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
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleSeleccion(a.id)}
                              />
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
                )}

                {/* ------- TABLA PARA OBSERVACIONES ------- */}
                {exportMode === "observaciones" && (
                  <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 980 }}>
                    <thead>
                      <tr style={{ background: "rgba(0,0,0,.05)" }}>
                        {["", "Activo", "Tipo", "Código", "Fecha", "Autor", "Evento", "Descripción", "Campo modificado", "Valor anterior", "Valor nuevo"].map(h => (
                          <th key={h} style={{
                            padding: "10px 14px", textAlign: "left",
                            fontSize: 11, fontWeight: 700, textTransform: "uppercase",
                            letterSpacing: ".08em", color: "#444",
                            borderBottom: "1px solid rgba(0,0,0,.06)",
                          }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.map((a) => {
                        // bitácora puede venir solo si cargamos detalle en cargarPreview
                        const rows = (a as any).bitacora || [];
                        const visibles = rows.filter((e: any) =>
                          pasaFiltroObservacion(e, obsAutor, obsDesde, obsHasta, eventosSel, incluirSistema)
                        );

                        // Si no hay observaciones visibles, no renderizamos filas para ese activo
                        if (visibles.length === 0) return null;

                        const checked = seleccion.has(a.id);

                        return visibles.map((e: any, idx: number) => {
                          const esPrimera = idx === 0; // mostramos el checkbox solo en la primera fila del activo
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
                )}
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}