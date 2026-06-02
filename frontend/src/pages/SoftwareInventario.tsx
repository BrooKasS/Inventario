// frontend/src/pages/SoftwareInventario.tsx
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";

interface SoftwareRow {
  assetId:           string | null;
  softwareName:      string;
  softwareVersion:   string | null;
  softwarePublisher: string | null;
  servidorNombre:    string | null;
  servidorIp:        string | null;
}

interface SoftwareStats {
  totalApps:          number;
  totalServidores:    number;
  totalInstalaciones: number;
}

const GRAD    = "linear-gradient(135deg, #FA8200 0%, #861F41 35%, #B7312C 70%, #D86018 100%)";
const PRIMARY = "#B7312C";
const ACCENT  = "#FA8200";
const LIMIT   = 100;

export default function SoftwareInventario() {
  const navigate = useNavigate();

  const [rows,    setRows]    = useState<SoftwareRow[]>([]);
  const [stats,   setStats]   = useState<SoftwareStats | null>(null);
  const [q,       setQ]       = useState("");
  const [loading, setLoading] = useState(true);
  const [page,    setPage]    = useState(1);
  const [total,   setTotal]   = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/ocs/software/all", {
        params: { q: q || undefined, page, limit: LIMIT },
      });
      setRows(res.data.data.rows);
      setTotal(res.data.data.total);
      setStats(res.data.data.stats);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [q, page]);

  useEffect(() => { setPage(1); }, [q]);
  useEffect(() => { load(); },    [load]);

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div style={{
      minHeight: "100%",
      background: GRAD,
      padding: "32px 28px",
      fontFamily: "Calibri, 'Segoe UI', sans-serif",
    }}>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          0%   { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .sw-row { transition: background .15s; }
        .sw-row:hover { background: rgba(255,255,255,.13) !important; }
        .srv-link {
          cursor: pointer;
          color: #FFD580;
          font-weight: 700;
          transition: color .15s;
          display: inline-flex;
          align-items: center;
          gap: 5px;
        }
        .srv-link:hover { color: #fff; text-decoration: underline; }
        .pg-btn {
          padding: 8px 18px; border-radius: 8px;
          border: 1.5px solid rgba(255,255,255,.25);
          background: rgba(255,255,255,.1);
          color: #fff; font-weight: 700; cursor: pointer;
          font-family: Calibri, sans-serif; font-size: 13px;
          transition: all .18s;
        }
        .pg-btn:hover:not(:disabled) {
          background: rgba(255,255,255,.22);
          border-color: rgba(255,255,255,.5);
          transform: translateY(-1px);
        }
        .pg-btn:disabled { opacity: 0.3; cursor: not-allowed; }
        .sw-search::placeholder { color: rgba(255,255,255,.4); }
      `}</style>

      {/* ══ HEADER ══ */}
      <div style={{
        marginBottom: 28,
        display: "flex", alignItems: "flex-start",
        justifyContent: "space-between", flexWrap: "wrap", gap: 12,
        animation: "fadeUp .35s ease",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 50, height: 50, borderRadius: 14,
            background: "rgba(255,255,255,.18)",
            backdropFilter: "blur(8px)",
            display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: 26,
            boxShadow: "0 4px 16px rgba(0,0,0,.2)",
          }}>📦</div>
          <div>
            <h1 style={{
              color: "#fff", fontSize: 26, fontWeight: 800,
              margin: 0, textShadow: "0 2px 8px rgba(0,0,0,.2)",
            }}>
              Software Instalado
            </h1>
            <p style={{
              color: "rgba(255,255,255,.7)", fontSize: 13,
              margin: "4px 0 0", fontWeight: 400,
            }}>
              Inventario global OCS · sincronizado automáticamente a las 3:00 AM
            </p>
          </div>
        </div>
      </div>

      {/* ══ STATS CARDS ══ */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: 16, marginBottom: 28,
        animation: "fadeUp .45s ease",
      }}>
        {[
          { label: "Apps únicas",          value: stats?.totalApps,           icon: "🧩" },
          { label: "Servidores",            value: stats?.totalServidores,      icon: "🖥️" },
          { label: "Total instalaciones",   value: stats?.totalInstalaciones,   icon: "📊" },
        ].map(c => (
          <div key={c.label} style={{
            background: "rgba(255,255,255,.13)",
            backdropFilter: "blur(10px)",
            borderRadius: 14, padding: "20px 24px",
            border: "1px solid rgba(255,255,255,.2)",
            boxShadow: "0 4px 20px rgba(22, 21, 21, 0.15)",
          }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>{c.icon}</div>
            <div style={{
              fontSize: 32, fontWeight: 800, color: "#fff",
              letterSpacing: "-.02em", lineHeight: 1,
            }}>
              {c.value?.toLocaleString("es-CO") ?? "—"}
            </div>
            <div style={{
              fontSize: 10, fontWeight: 700, letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,.65)", marginTop: 6,
            }}>
              {c.label}
            </div>
          </div>
        ))}
      </div>

      {/* ══ BUSCADOR ══ */}
      <div style={{
        display: "flex", alignItems: "center",
        gap: 14, marginBottom: 18,
        animation: "fadeUp .5s ease",
      }}>
        <div style={{ position: "relative", flex: 1, maxWidth: 500 }}>
          <span style={{
            position: "absolute", left: 13, top: "50%",
            transform: "translateY(-50%)",
            fontSize: 15, pointerEvents: "none",
          }}>🔍</span>
          <input
            className="sw-search"
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Buscar por nombre, publisher o servidor..."
            style={{
              width: "100%", padding: "11px 16px 11px 40px",
              borderRadius: 10,
              border: "1.5px solid rgba(255,255,255,.2)",
              background: "rgba(255,255,255,.12)",
              color: "#fff", fontSize: 14,
              fontFamily: "Calibri, sans-serif",
              outline: "none", boxSizing: "border-box",
              transition: "border-color .2s, background .2s",
            }}
            onFocus={e => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,.6)";
              e.currentTarget.style.background  = "rgba(255,255,255,.18)";
            }}
            onBlur={e => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,.2)";
              e.currentTarget.style.background  = "rgba(255,255,255,.12)";
            }}
          />
        </div>
        <span style={{
          fontSize: 13, color: "rgba(255,255,255,.65)",
          fontWeight: 600, whiteSpace: "nowrap",
        }}>
          {loading
            ? "Cargando..."
            : `${total.toLocaleString("es-CO")} resultado${total !== 1 ? "s" : ""}`
          }
        </span>
        {q && (
          <button
            onClick={() => setQ("")}
            style={{
              padding: "9px 14px", borderRadius: 8,
              border: "1.5px solid rgba(255,255,255,.3)",
              background: "rgba(255,255,255,.1)",
              color: "#fff", fontWeight: 700,
              cursor: "pointer", fontSize: 12,
              fontFamily: "Calibri, sans-serif",
            }}
          >✕ Limpiar</button>
        )}
      </div>

      {/* ══ TABLA ══ */}
      <div style={{
        borderRadius: 16, overflow: "hidden",
        border: "1.5px solid rgba(255,255,255,.15)",
        boxShadow: "0 12px 48px rgba(0,0,0,.3)",
        animation: "fadeUp .55s ease",
      }}>
        {/* Header tabla */}
        <div style={{
          background: "rgba(0,0,0,.3)",
          padding: "15px 22px",
          display: "flex", alignItems: "center",
          justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 16 }}>📦</span>
            <span style={{
              fontSize: 11, fontWeight: 800,
              letterSpacing: "0.16em",
              textTransform: "uppercase", color: "#fff",
            }}>
              Inventario de Software
            </span>
          </div>
          {!loading && total > 0 && (
            <span style={{
              fontSize: 11, fontWeight: 700,
              background: "rgba(255,255,255,.15)",
              color: "#fff", padding: "4px 14px",
              borderRadius: 20, letterSpacing: "0.05em",
            }}>
              {total.toLocaleString("es-CO")} registros
            </span>
          )}
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{
            width: "100%", borderCollapse: "collapse",
            fontSize: 13, fontFamily: "Calibri, sans-serif",
          }}>
            <thead>
              <tr style={{ background: "rgba(0,0,0,.25)" }}>
                {["Aplicación", "Versión", "Publisher", "Servidor", "IP Interna"].map(h => (
                  <th key={h} style={{
                    padding: "10px 16px", textAlign: "left",
                    fontSize: 10, fontWeight: 800,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,.6)",
                    whiteSpace: "nowrap",
                    borderBottom: "1px solid rgba(255,255,255,.1)",
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{
                    padding: "64px", textAlign: "center",
                    background: "rgba(0,0,0,.15)",
                  }}>
                    <div style={{
                      width: 30, height: 30, borderRadius: "50%",
                      border: "3px solid rgba(255,255,255,.12)",
                      borderTop: "3px solid #FA8200",
                      animation: "spin 1s linear infinite",
                      margin: "0 auto 12px",
                    }} />
                    <div style={{ color: "rgba(255,255,255,.4)", fontSize: 14 }}>
                      Cargando software...
                    </div>
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{
                    padding: "64px", textAlign: "center",
                    background: "rgba(0,0,0,.15)",
                    color: "rgba(255,255,255,.35)", fontSize: 15,
                  }}>
                    {q ? `Sin resultados para "${q}"` : "Sin datos disponibles"}
                  </td>
                </tr>
              ) : rows.map((row, i) => (
                <tr
                  key={i}
                  className="sw-row"
                  style={{
                    background: i % 2 === 0
                      ? "rgba(255,255,255,.06)"
                      : "rgba(255,255,255,.03)",
                    borderBottom: "1px solid rgba(255,255,255,.06)",
                  }}
                >
                  {/* Aplicación */}
                  <td style={{
                    padding: "10px 16px",
                    color: "#fff", fontWeight: 600,
                    maxWidth: 280,
                  }}>
                    {row.softwareName}
                  </td>

                  {/* Versión */}
                  <td style={{
                    padding: "10px 16px",
                    color: "rgba(255,255,255,.55)",
                    fontFamily: "monospace", fontSize: 12,
                    whiteSpace: "nowrap",
                  }}>
                    {row.softwareVersion ?? "—"}
                  </td>

                  {/* Publisher */}
                  <td style={{
                    padding: "10px 16px",
                    color: "rgba(255,255,255,.6)",
                    maxWidth: 200,
                  }}>
                    {row.softwarePublisher ?? "—"}
                  </td>

                  {/* Servidor clickeable */}
                  <td style={{ padding: "10px 16px" }}>
                    {row.assetId && row.servidorNombre ? (
                      <span
                        className="srv-link"
                        onClick={() => navigate(`/activo/${row.assetId}`)}
                        title={`Ver detalle de ${row.servidorNombre}`}
                      >
                        🖥️ {row.servidorNombre}
                      </span>
                    ) : (
                      <span style={{ color: "rgba(255,255,255,.3)" }}>
                        {row.servidorNombre ?? "—"}
                      </span>
                    )}
                  </td>

                  {/* IP */}
                  <td style={{
                    padding: "10px 16px",
                    color: "rgba(255,255,255,.45)",
                    fontFamily: "monospace", fontSize: 12,
                    whiteSpace: "nowrap",
                  }}>
                    {row.servidorIp ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ══ PAGINACIÓN ══ */}
      {totalPages > 1 && (
        <div style={{
          display: "flex", justifyContent: "center",
          alignItems: "center", gap: 8, marginTop: 24,
        }}>
          <button className="pg-btn" onClick={() => setPage(1)}
            disabled={page === 1}>«</button>
          <button className="pg-btn" onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}>← Anterior</button>
          <span style={{
            padding: "8px 18px", borderRadius: 8,
            background: "rgba(255,255,255,.15)",
            border: "1.5px solid rgba(255,255,255,.25)",
            color: "#fff", fontSize: 13, fontWeight: 700,
          }}>
            {page} / {totalPages}
          </span>
          <button className="pg-btn"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}>Siguiente →</button>
          <button className="pg-btn" onClick={() => setPage(totalPages)}
            disabled={page === totalPages}>»</button>
        </div>
      )}

      <p style={{
        textAlign: "center", marginTop: 20,
        fontSize: 11, color: "rgba(255,255,255,.3)",
        fontFamily: "Calibri, sans-serif",
      }}>
        OCS Inventory · sincronización automática 3:00 AM · {stats?.totalInstalaciones?.toLocaleString("es-CO") ?? "—"} instalaciones en {stats?.totalServidores ?? "—"} servidores
      </p>
    </div>
  );
}