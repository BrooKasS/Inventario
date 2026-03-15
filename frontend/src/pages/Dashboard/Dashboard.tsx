import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Cell, ResponsiveContainer } from "recharts";

import type { Asset } from "../../types";
import StatCard from "./components/StatCard";
import RecentRow from "./components/RecentRow";
import ExportModal from "./components/ExportModal";
import ObservationsModal from "./components/ObservationsModal";

import { useDashboardData } from "./hooks/useDashboardData";
import { useDashboardFilters } from "./hooks/useDashboardFilters";
import { useDashboardExport } from "./hooks/useDashboardExport";

import { buildObservationsChartData, filterAssets, getObservacionesPorTipoEvento } from "./utils/dashboardHelpers";
import {
  MAIN_GRADIENT,
  TIPO_LABEL,
  TIPO_ICON,
  TIPO_GRAD,
  COLOR_TIPO,
  DEFAULT_PAGE_SIZE,
} from "./constants";
import type { ChartDataPoint, ExportMode, ObsModalRow } from "./types";
import { getAssets, getAssetById } from "../../api/client";

export default function Dashboard() {
  const navigate = useNavigate();
  const { stats, recent, loading } = useDashboardData();
  const { pasaFiltroObservacion } = useDashboardFilters();

  // ────── ESTADO: Modales ──────
  const [modalOpen, setModalOpen] = useState(false);

  // ────── ESTADO: Exportación ──────
  const [exportMode, setExportMode] = useState<ExportMode>("activos");
  const [tiposSel, setTiposSel] = useState<string[]>([]);
  const [buscar, setBuscar] = useState("");
  const [preview, setPreview] = useState<Asset[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [seleccion, setSeleccion] = useState<Set<string>>(new Set());

  // ────── ESTADO: Filtros de observaciones ──────
  const [eventosSel, setEventosSel] = useState<string[]>([]);
  const [obsAutor, setObsAutor] = useState("");
  const [obsDesde, setObsDesde] = useState("");
  const [obsHasta, setObsHasta] = useState("");
  const [incluirSistema, setIncluirSistema] = useState(false);

  // ────── ESTADO: Gráfica de observaciones ──────
  const [obsChart, setObsChart] = useState<ChartDataPoint[]>([]);
  const [obsLoading, setObsLoading] = useState(false);

  // ────── ESTADO: Modal de observaciones ──────
  const [obsModalOpen, setObsModalOpen] = useState(false);
  const [obsModalTipo, setObsModalTipo] = useState<string | null>(null);
  const [obsModalLoading, setObsModalLoading] = useState(false);
  const [obsModalRows, setObsModalRows] = useState<ObsModalRow[]>([]);

  // ────── HOOKS: Exportación ──────
  const { exporting, handleExportActvosExcel, handleExportActivosPDF, handleExportObservacionesExcel, handleExportObservacionesPDF } =
    useDashboardExport({ pasaFiltroObservacion });

  // ────── CARGAR DATOS DE OBSERVACIONES ──────
  useEffect(() => {
    (async () => {
      try {
        setObsLoading(true);
        const chartData = await buildObservationsChartData();
        setObsChart(chartData);
      } catch (err) {
        console.error("Error cargando datos de observaciones:", err);
        setObsChart([]);
      } finally {
        setObsLoading(false);
      }
    })();
  }, []);

  // ────── FUNCIONES: Manejo de UI ──────
  const cargarPreview = async () => {
    try {
      setPreviewLoading(true);
      setSeleccion(new Set());

      const resp = await getAssets({ limit: DEFAULT_PAGE_SIZE, page: 1, tipos: tiposSel, search: buscar });
      const items = resp.assets || [];
      const filtrados = filterAssets(items, tiposSel, buscar);

      // Si el modo es observaciones, traemos detalle (bitácora)
      if (exportMode === "observaciones") {
        const detallados = await Promise.all(filtrados.map((a) => getAssetById(a.id).catch(() => a)));
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

  const allSelected = useMemo(() => {
    return preview.length > 0 && preview.every((a) => seleccion.has(a.id));
  }, [preview, seleccion]);

 

  const toggleTipo = (tipo: string) => {
    setTiposSel((prev) => (prev.includes(tipo) ? prev.filter((t) => t !== tipo) : [...prev, tipo]));
  };

  const toggleSeleccion = (id: string) => {
    setSeleccion((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const seleccionarTodos = () => {
    if (allSelected) {
      setSeleccion(new Set());
    } else {
      setSeleccion(new Set(preview.map((a) => a.id)));
    }
  };

  // ────── OBSERVACIONES MODAL ──────
  const cargarObservacionesPorTipoEvento = async (tipoEvento: string) => {
    try {
      setObsModalLoading(true);
      const rows = await getObservacionesPorTipoEvento(
        tipoEvento,
        pasaFiltroObservacion,
        obsAutor,
        obsDesde,
        obsHasta,
        incluirSistema
      );
      setObsModalRows(rows);
    } catch (err) {
      console.error("Error cargando observaciones por tipo:", err);
      setObsModalRows([]);
    } finally {
      setObsModalLoading(false);
    }
  };

  // ────── HANDLER: Exportación Excel ──────
  const handleExportExcel = async () => {
    if (exportMode === "activos") {
      await handleExportActvosExcel(tiposSel, buscar, seleccion);
    } else {
      await handleExportObservacionesExcel(tiposSel, buscar, seleccion, obsAutor, obsDesde, obsHasta, eventosSel, incluirSistema);
    }
  };

  // ────── HANDLER: Exportación PDF ──────
  const handleExportPDF = async () => {
    if (exportMode === "activos") {
      await handleExportActivosPDF(tiposSel, buscar, seleccion);
    } else {
      await handleExportObservacionesPDF(tiposSel, buscar, seleccion, obsAutor, obsDesde, obsHasta, eventosSel, incluirSistema);
    }
  };

  // ────── DATOS PARA GRÁFICAS ──────
  const dataPorTipo = useMemo(() => {
    const lista = stats?.porTipo ?? [];
    return lista.map((t) => ({
      key: t.tipo,
      tipo: TIPO_LABEL[t.tipo] ?? t.tipo,
      count: t.count,
      color: COLOR_TIPO[t.tipo] ?? "#999999",
    }));
  }, [stats]);

  const tooltipFormatter = (value: any): [string, string] => [`${value}`, "Cantidad"];

  return (
    <div
      style={{
        minHeight: "100%",
        padding: "32px 28px",
        fontFamily: "Calibri, 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        background: "linear-gradient(160deg, #FA8200 0%, #843952 60%, #b6433f 100%, #D86018)",
      }}
    >
      <style>{`@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}`}</style>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        {/* ────── HEADER ────── */}
        <div style={{ marginBottom: 16 }}>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 700,
              margin: 0,
              background: "#fff",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Dashboard
          </h1>
          <p style={{ fontSize: 20, color: "rgb(255, 255, 255)", margin: "6px 0 12px" }}>
            Estado general del inventario de infraestructura
          </p>

          <button
            onClick={() => setModalOpen(true)}
            style={{
              padding: "10px 20px",
              borderRadius: 8,
              border: "none",
              background: MAIN_GRADIENT,
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

        {/* ────── LOADING STATE ────── */}
        {loading ? (
          <div
            style={{
              background: "rgba(255,255,255,.04)",
              borderRadius: 14,
              padding: "64px 40px",
              textAlign: "center",
              border: "1px solid rgba(255,255,255,.08)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 14,
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                border: "4px solid rgba(255,255,255,.1)",
                borderTop: "4px solid #FA8200",
                animation: "spin 1s linear infinite",
              }}
            />
            <span style={{ color: "rgba(255,255,255,.35)", fontSize: 14 }}>Cargando datos...</span>
          </div>
        ) : (
          <>
            {/* ────── STATS GRID ────── */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))",
                gap: 16,
                marginBottom: 24,
              }}
            >
              <StatCard label="Total Activos" value={stats?.total} grad={MAIN_GRADIENT} />
              {stats?.porTipo.map((t: any) => (
                <StatCard
                  key={t.tipo}
                  icon={TIPO_ICON[t.tipo]}
                  label={TIPO_LABEL[t.tipo]}
                  value={t.count}
                  grad={TIPO_GRAD[t.tipo] ?? MAIN_GRADIENT}
                  onClick={() => navigate(`/inventario/${t.tipo}`)}
                />
              ))}
            </div>

            {/* ────── CHARTS SECTION ────── */}
            <ChartsSection
              dataPorTipo={dataPorTipo}
              obsChart={obsChart}
              obsLoading={obsLoading}
              tooltipFormatter={tooltipFormatter}
              onObsChartClick={async (tipoEvento: string) => {
                setObsModalTipo(tipoEvento);
                setObsModalOpen(true);
                await cargarObservacionesPorTipoEvento(tipoEvento);
              }}
            />

            {/* ────── RECENT ACTIVITY ────── */}
            <RecentActivitySection recent={recent} onRowClick={(id) => navigate(`/activo/${id}`)} />
          </>
        )}
      </div>

      {/* ────── MODALS ────── */}
      <ExportModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        exportMode={exportMode}
        setExportMode={setExportMode}
        tiposSel={tiposSel}
        toggleTipo={toggleTipo}
        buscar={buscar}
        setBuscar={setBuscar}
        preview={preview}
        previewLoading={previewLoading}
        cargarPreview={cargarPreview}
        seleccion={seleccion}
        toggleSeleccion={toggleSeleccion}
        seleccionarTodos={seleccionarTodos}
        allSelected={allSelected}
        exporting={exporting}
        handleExportExcel={handleExportExcel}
        handleExportPDF={handleExportPDF}
        eventosSel={eventosSel}
        setEventosSel={setEventosSel}
        obsAutor={obsAutor}
        setObsAutor={setObsAutor}
        obsDesde={obsDesde}
        setObsDesde={setObsDesde}
        obsHasta={obsHasta}
        setObsHasta={setObsHasta}
        incluirSistema={incluirSistema}
        setIncluirSistema={setIncluirSistema}
        pasaFiltroObservacion={pasaFiltroObservacion}
      />

      <ObservationsModal
        open={obsModalOpen}
        onClose={() => setObsModalOpen(false)}
        obsModalTipo={obsModalTipo}
        obsModalLoading={obsModalLoading}
        obsModalRows={obsModalRows}
        incluirSistema={incluirSistema}
      />
    </div>
  );
}

// ────── SUB-COMPONENTS ──────

function ChartsSection({
  dataPorTipo,
  obsChart,
  obsLoading,
  tooltipFormatter,
  onObsChartClick,
}: {
  dataPorTipo: ChartDataPoint[];
  obsChart: ChartDataPoint[];
  obsLoading: boolean;
  tooltipFormatter: (value: any) => [string, string];
  onObsChartClick: (tipoEvento: string) => Promise<void>;
}) {
  return (
    <div
      style={{
        borderRadius: 14,
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,.08)",
        boxShadow: "0 8px 32px rgba(0,0,0,.35)",
        marginBottom: 24,
      }}
    >
      <div style={{ background: MAIN_GRADIENT, padding: "14px 20px", display: "flex", alignItems: "center", gap: 10 }}>
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
          📊
        </span>
        <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", color: "#fff" }}>
          Visualizaciones (Barras)
        </span>
      </div>

      <div style={{ background: "#fff", padding: 16 }}>
        {dataPorTipo.length === 0 && obsChart.length === 0 ? (
          <div style={{ padding: "32px 8px", color: "#777" }}>No hay datos suficientes para graficar.</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
            {/* Barras: Activos por tipo */}
            <ChartCard title="Activos por tipo">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={dataPorTipo} margin={{ top: 8, right: 8, left: -16, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e6e6e6" />
                  <XAxis dataKey="tipo" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={tooltipFormatter as any} />
                  <Legend />
                  <Bar dataKey="count" name="Cantidad">
                    {dataPorTipo.map((d, i) => (
                      <Cell key={i} fill={d.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Barras: Observaciones por tipo de evento */}
            <ChartCard title="Observaciones por tipo de evento" loading={obsLoading}>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={obsChart} margin={{ top: 8, right: 8, left: -16, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e6e6e6" />
                  <XAxis dataKey="tipo" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={tooltipFormatter as any} />
                  <Legend />
                  <Bar
                    dataKey="count"
                    name="Cantidad"
                    onClick={async (entry: any) => {
                      const tipoEvento = entry?.payload?.key as string | undefined;
                      if (tipoEvento) await onObsChartClick(tipoEvento);
                    }}
                    cursor="pointer"
                  >
                    {obsChart.map((d, i) => (
                      <Cell key={i} fill={d.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div style={{ fontSize: 11, color: "#666", marginTop: 6 }}>
                *Se agregan observaciones de hasta 50 activos recientes.
              </div>
            </ChartCard>
          </div>
        )}
      </div>
    </div>
  );
}

function ChartCard({
  title,
  loading,
  children,
}: {
  title: string;
  loading?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div style={{ border: "1px solid rgba(0,0,0,.06)", borderRadius: 12, padding: 12, background: "#fafafa" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: "#333" }}>{title}</div>
        {loading && <span style={{ fontSize: 12, color: "#777" }}>Cargando…</span>}
      </div>
      {children}
    </div>
  );
}

function RecentActivitySection({
  recent,
  onRowClick,
}: {
  recent: Asset[];
  onRowClick: (id: string) => void;
}) {
  return (
    <div
      style={{
        borderRadius: 14,
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,.08)",
        boxShadow: "0 8px 32px rgba(0,0,0,.35)",
      }}
    >
      <div style={{ background: MAIN_GRADIENT, padding: "14px 20px", display: "flex", alignItems: "center", gap: 10 }}>
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
          🕐
        </span>
        <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", color: "#fff" }}>
          Actividad Reciente
        </span>
      </div>

      <div style={{ background: "rgb(255, 255, 255)" }}>
        {recent.length === 0 ? (
          <div style={{ padding: "64px 40px", textAlign: "center" }}>
            <div style={{ fontSize: 52, marginBottom: 12, opacity: 0.2 }}>📭</div>
            <p style={{ color: "rgba(0, 0, 0, 0.3)", fontSize: 15, margin: 0 }}>No hay actividad reciente</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}>
              <thead>
                <tr style={{ background: "rgb(90, 56, 112)" }}>
                  {["Activo", "Tipo", "Código", "Última actualización"].map((h, i, arr) => (
                    <th
                      key={h}
                      style={{
                        padding: "11px 15px",
                        textAlign: "left",
                        fontSize: 12,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.2em",
                        color: "rgb(255, 255, 255)",
                        whiteSpace: "nowrap",
                        borderRight: i < arr.length - 1 ? "1px solid rgba(255, 255, 255, 0.06)" : "none",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recent.map((a) => (
                  <RecentRow key={a.id} a={a} onClick={() => onRowClick(a.id)} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
