import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getStats, getAssets } from "../api/client";
import type { StatsResponse, Asset } from "../types";

const GRAD    = "linear-gradient(135deg, #FA8200 0%, #861F41 35%, #B7312C 70%, #D86018 100%)";


const TIPO_LABEL: Record<string, string> = {
  SERVIDOR:   "Servidores",
  BASE_DATOS: "Bases de Datos",
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
        boxShadow: hov ? "0 12px 32px rgba(0,0,0,.3)" : "0 4px 16px rgba(0,0,0,.2)",
        cursor: onClick ? "pointer" : "default",
        transition: "all .2s",
        transform: hov ? "translateY(-4px) scale(1.02)" : "none",
        fontFamily: "Calibri, 'Segoe UI', sans-serif",
        position: "relative", overflow: "hidden",
      }}
    >
      {/* decorative circles */}
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
          filter: "drop-shadow(0 2px 6px rgba(0,0,0,.25))",
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

/* ── Recent row ── */
function RecentRow({ a, onClick }: { a: Asset; onClick: () => void }) {
  const [hov, setHov] = useState(false);
  return (
    <tr
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        cursor: "pointer",
        background: hov ? "rgba(250,130,0,.08)" : "transparent",
        transition: "background .15s",
        borderBottom: "1px solid rgba(255,255,255,.06)",
      }}
    >
      <td style={{
        padding: "13px 18px", fontSize: 13, fontWeight: 600,
        color: hov ? "#fff" : "#ffffff",
        fontFamily: "Calibri, sans-serif",
        borderLeft: hov ? "3px solid #ff7e22" : "3px solid transparent",
        transition: "all .15s",
      }}>
        {a.nombre ?? "—"}
      </td>
      <td style={{ padding: "13px 18px" }}>
        <span style={{
          display: "inline-block", padding: "3px 12px", borderRadius: 20,
          fontSize: 11, fontWeight: 700, textTransform: "uppercase",
          letterSpacing: "0.06em",
          background: "rgba(250,130,0,.18)", color: "#FA8200",
          border: "1px solid rgba(250,130,0,.3)",
          fontFamily: "Calibri, sans-serif",
        }}>
          {TIPO_LABEL[a.tipo]}
        </span>
      </td>
      <td style={{
        padding: "13px 18px", fontSize: 13,
        color: "rgb(255, 255, 255)", fontFamily: "Calibri, sans-serif",
      }}>
        {a.codigoServicio ?? "—"}
      </td>
      <td style={{
        padding: "13px 18px", fontSize: 12,
        color: "rgb(255, 255, 255)", fontFamily: "Calibri, sans-serif",
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

  return (
    <div style={{
      minHeight: "100%", padding: "32px 28px",
      fontFamily: "Calibri, 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      background: "linear-gradient(160deg, #FA8200 0%, #843952 60%, #b6433f 100%, #D86018)",
    }}>
      <style>{`@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}`}</style>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>

        {/* ── Page header ── */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{
            fontSize: 28, fontWeight: 700, margin: 0,
            background: "#fff", WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent", backgroundClip: "text",
          }}>
            Dashboard
          </h1>
          <p style={{ fontSize: 20, color: "rgb(255, 255, 255)", margin: "6px 0 0" }}>
            Estado general del inventario de infraestructura
          </p>
        </div>

        {/* ── Loading ── */}
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
              gap: 16, marginBottom: 32,
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

            {/* ── Recent activity ── */}
            <div style={{
              borderRadius: 14, overflow: "hidden",
              border: "1px solid rgba(255,255,255,.08)",
              boxShadow: "0 8px 32px rgba(0,0,0,.35)",
            }}>
              {/* header */}
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
                  fontSize: 11, fontWeight: 700, letterSpacing: "0.14em",
                  textTransform: "uppercase", color: "#fff",
                }}>
                  Actividad Reciente
                </span>
              </div>

              {/* body */}
              <div style={{ background: "rgba(255,255,255,.04)" }}>
                {recent.length === 0 ? (
                  <div style={{ padding: "64px 40px", textAlign: "center" }}>
                    <div style={{ fontSize: 52, marginBottom: 12, opacity: 0.2 }}>📭</div>
                    <p style={{ color: "rgba(255, 255, 255, 0.3)", fontSize: 15, margin: 0 }}>No hay actividad reciente</p>
                  </div>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}>
                      <thead>
                        <tr style={{ background: "rgba(0,0,0,.3)" }}>
                          {["Activo", "Tipo", "Código", "Última actualización"].map((h, i, arr) => (
                            <th key={h} style={{
                              padding: "11px 18px", textAlign: "left",
                              fontSize: 10, fontWeight: 700, textTransform: "uppercase",
                              letterSpacing: "0.1em", color: "rgb(255, 255, 255)",
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
    </div>
  );
}