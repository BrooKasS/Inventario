import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getAssets } from "../api/client";
import type { Asset, Pagination, TipoActivo } from "../types";

const GRAD    = "linear-gradient(135deg, #fa8e00 , #89183e 25%, 35% #861F41 35%, #B7312C 70%, #D86018 100%)";
const PRIMARY = "#ff5500";

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
  SERVIDOR:   "linear-gradient(135deg, #fa7d00, #861F41)",
  BASE_DATOS: "linear-gradient(135deg, #861F41, #B7312C)",
  RED:        "linear-gradient(135deg, #B7312C, #D86018)",
  UPS:        "linear-gradient(135deg, #FA8200, #861F41)",
};

/* ── Badge ── */
function Badge({ text }: { text: string | null }) {
  if (!text) return <span style={{ color: "#bbb" }}>—</span>;
  return (
    <span style={{
      display: "inline-block", padding: "3px 12px", borderRadius: 20,
      fontSize: 11, fontWeight: 700, textTransform: "uppercase",
      letterSpacing: "0.06em",
      background: "rgba(250,130,0,.3)", color: PRIMARY,
      border: `1px solid rgba(183,49,44,.2)`,
    }}>
      {text}
    </span>
  );
}

/* ── Row components ── */
function ServidorRow({ a, onClick }: { a: Asset; onClick: () => void }) {
  const s = a.servidor;
  return <Row onClick={onClick} cells={[
    <strong style={{ color: "#fff" }}>{a.nombre ?? "—"}</strong>,
    a.codigoServicio ?? "—",
    <Badge text={s?.ambiente ?? null} />,
    <code style={{ fontSize: 12 }}>{s?.ipInterna ?? "—"}</code>,
    s?.vcpu ?? "—",
    s?.vramMb ? `${s.vramMb / 1024} GB` : "—",
    s?.sistemaOperativo ?? "—",
    a.ubicacion ?? "—",
  ]} />;
}

function RedRow({ a, onClick }: { a: Asset; onClick: () => void }) {
  const r = a.red;
  return <Row onClick={onClick} cells={[
    <strong style={{ color: "#fff" }}>{a.nombre ?? "—"}</strong>,
    <code style={{ fontSize: 12 }}>{r?.serial ?? "—"}</code>,
    r?.modelo ?? "—",
    <code style={{ fontSize: 12 }}>{r?.ipGestion ?? "—"}</code>,
    <Badge text={r?.estado ?? null} />,
    a.ubicacion ?? "—",
    a.codigoServicio ?? "—",
  ]} />;
}

function UpsRow({ a, onClick }: { a: Asset; onClick: () => void }) {
  const u = a.ups;
  return <Row onClick={onClick} cells={[
    <strong style={{ color: "#fff" }}>{a.nombre ?? "—"}</strong>,
    <code style={{ fontSize: 12 }}>{u?.serial ?? "—"}</code>,
    u?.modelo ?? "—",
    <code style={{ fontSize: 12 }}>{u?.placa ?? "—"}</code>,
    <Badge text={u?.estado ?? null} />,
    a.ubicacion ?? "—",
  ]} />;
}

function BDRow({ a, onClick }: { a: Asset; onClick: () => void }) {
  const b = a.baseDatos;
  return <Row onClick={onClick} cells={[
    <strong style={{ color: "#fff" }}>{a.nombre ?? "—"}</strong>,
    b?.ambiente ?? "—",
    b?.appSoporta ?? "—",
    b?.servidor1 ?? "—",
    b?.versionBd ?? "—",
    b?.racScan ?? "—",
    a.propietario ?? "—",
  ]} />;
}

function Row({ cells, onClick }: { cells: React.ReactNode[]; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <tr
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        cursor: "pointer",
        background: hovered ? "rgba(250,130,0,.08)" : "transparent",
        transition: "background .15s",
        borderBottom: "1px solid rgba(255,255,255,.06)",
      }}
    >
      {cells.map((cell, i) => (
        <td key={i} style={{
          padding: "13px 18px", fontSize: 13,
          color: "#ffffff", verticalAlign: "middle",
          fontFamily: "Calibri, 'Segoe UI', sans-serif",
          borderLeft: i === 0 && hovered ? `3px solid ${PRIMARY}` : i === 0 ? "3px solid transparent" : "none",
        }}>
          {cell}
        </td>
      ))}
    </tr>
  );
}

const HEADERS: Record<string, string[]> = {
  SERVIDOR:   ["Nombre", "Código", "Ambiente", "IP Interna", "vCPU", "vRAM", "Sistema Operativo", "Ubicación"],
  RED:        ["Nombre", "Serial", "Modelo", "IP Gestión", "Estado", "Ubicación", "Código"],
  UPS:        ["Nombre", "Serial", "Modelo", "Placa", "Estado", "Ubicación"],
  BASE_DATOS: ["Nombre", "Ambiente", "Aplicación", "Servidor 1", "Versión", "RAC/Scan", "Propietario"],
};

/* ── Main ── */
export default function AssetList() {
  const { tipo }   = useParams<{ tipo: string }>();
  const navigate   = useNavigate();
  const [assets, setAssets]         = useState<Asset[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [q, setQ]                   = useState("");
  const [page, setPage]             = useState(1);
  const [loading, setLoading]       = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAssets({ tipo, q: q || undefined, page, limit: 50 });
      setAssets(data.assets || []);
      setPagination(data.pagination);
    } catch (err) {
      console.error("Error cargando activos:", err);
    } finally {
      setLoading(false);
    }
  }, [tipo, q, page]);

  useEffect(() => { setPage(1); setQ(""); }, [tipo]);
  useEffect(() => { load(); }, [load]);

  const tipoKey = tipo as TipoActivo;
  const headers = HEADERS[tipoKey] ?? [];

  return (
    <div style={{
      minHeight: "100%", padding: "32px 28px",
      fontFamily: "Calibri, 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      background: "linear-gradient(160deg, #FA8200 , #892f4d , #843952 60%, #b6433f 100%, #D86018)",
    }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>

        {/* ── Page header ── */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <span style={{
              fontSize: 28, width: 40, height: 40, borderRadius: 10,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: TIPO_GRAD[tipoKey] ?? GRAD, boxShadow: "0 4px 12px rgba(183,49,44,.3)",
            }}>
              {TIPO_ICON[tipoKey] ?? "📦"}
            </span>
            <h1 style={{
              fontSize: 28, fontWeight: 700, color: "#fff", margin: 0,
              textShadow: "0 2px 8px rgba(0,0,0,.2)",
            }}>
              {TIPO_LABEL[tipoKey] || "Activos"}
            </h1>
          </div>
          <p style={{ fontSize: 20, color: "rgba(255,255,255,.75)", margin: "6px 0 0", paddingLeft: 50 }}>
            {loading ? "Cargando..." : pagination ? `${pagination.total} registros encontrados` : ""}
          </p>
        </div>

        {/* ── Search bar ── */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ position: "relative", maxWidth: 480 }}>
            <span style={{
              position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
              fontSize: 15, color: "#bbb", pointerEvents: "none",
            }}>🔍</span>
            <input
              type="text" value={q}
              onChange={e => { setQ(e.target.value); setPage(1); }}
              placeholder="Buscar por nombre, código..."
              style={{
                width: "100%", padding: "10px 14px 10px 40px",
                border: "2px solid #e8dede", borderRadius: 10,
                fontSize: 14, color: "#333", outline: "none",
                background: "#fff", fontFamily: "Calibri, sans-serif",
                boxShadow: "0 2px 8px rgba(0,0,0,.05)",
                transition: "border-color .2s",
              }}
              onFocus={e => (e.currentTarget.style.borderColor = PRIMARY)}
              onBlur={e => (e.currentTarget.style.borderColor = "#e8dede")}
            />
          </div>
        </div>

        {/* ── Table card ── */}
        <div style={{
          borderRadius: 14, overflow: "hidden",
          border: "1px solid rgba(255,255,255,.08)",
          boxShadow: "0 8px 32px rgba(0,0,0,.35)",
        }}>
          {/* header */}
          <div style={{
            background: TIPO_GRAD[tipoKey] ?? GRAD, padding: "14px 20px",
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <span style={{
              fontSize: 16, width: 30, height: 30, borderRadius: 8,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "rgba(255,255,255,.18)",
            }}>📋</span>
            <span style={{
              fontSize: 11, fontWeight: 700, letterSpacing: "0.14em",
              textTransform: "uppercase", color: "#fff",
            }}>
              Listado de {TIPO_LABEL[tipoKey] || "Activos"}
            </span>
          </div>

          {/* body */}
          <div style={{ background: "rgba(255,255,255,.04)" }}>
            {loading ? (
              <div style={{
                padding: "64px 40px", textAlign: "center",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 14,
              }}>
                <div style={{
                  width: 44, height: 44,
                  border: "4px solid rgba(255,255,255,.1)",
                  borderTop: "4px solid #FA8200",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                }} />
                <span style={{ color: "rgba(255,255,255,.35)", fontSize: 14 }}>Cargando activos...</span>
              </div>
            ) : assets.length === 0 ? (
              <div style={{ padding: "64px 40px", textAlign: "center" }}>
                <div style={{ fontSize: 52, marginBottom: 12, opacity: 0.2 }}>📭</div>
                <p style={{ color: "rgba(255, 255, 255, 0.3)", fontSize: 15, margin: 0 }}>No se encontraron resultados</p>
                <p style={{ color: "rgba(255, 255, 255, 0.2)", fontSize: 13, marginTop: 6 }}>Intenta con otra búsqueda</p>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
                  <thead>
                    <tr style={{ background: "rgba(0,0,0,.3)" }}>
                      {headers.map((h, i, arr) => (
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
                    {assets.map(a => {
                      const onClick = () => navigate(`/activo/${a.id}`);
                      if (tipoKey === "SERVIDOR") return <ServidorRow key={a.id} a={a} onClick={onClick} />;
                      if (tipoKey === "RED")      return <RedRow      key={a.id} a={a} onClick={onClick} />;
                      if (tipoKey === "UPS")      return <UpsRow      key={a.id} a={a} onClick={onClick} />;
                      return                             <BDRow       key={a.id} a={a} onClick={onClick} />;
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* ── Pagination ── */}
               
        {pagination && pagination.totalPages > 1 && (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            gap: 8, marginTop: 24, flexWrap: "wrap",
          }}>
            <PagBtn
              label="← Anterior" disabled={page === 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
            />
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(p => (
              <button
                key={p} onClick={() => setPage(p)}
                style={{
                  width: 36, height: 36, borderRadius: 8,
                  border: p === page ? "none" : "1px solid rgba(255,255,255,.1)",
                  background: p === page ? "linear-gradient(135deg, #FA8200 0%, #861F41 35%, #B7312C 70%, #D86018 100%)" : "rgba(255,255,255,.04)",
                  color: p === page ? "#fff" : "rgba(255,255,255,.6)",
                  fontWeight: p === page ? 700 : 500,
                  fontSize: 13, cursor: "pointer",
                  boxShadow: p === page ? "0 2px 8px rgba(183,49,44,.25)" : "none",
                  fontFamily: "Calibri, sans-serif",
                  transition: "all .15s",
                }}
              >
                {p}
              </button>
            ))}
            <PagBtn
              label="Siguiente →" disabled={page === pagination.totalPages}
              onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
            />
          </div>
        )}

      </div>
    </div>
  );
}

function PagBtn({ label, disabled, onClick }: {
  label: string; disabled: boolean; onClick: () => void;
}) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick} disabled={disabled}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: "8px 16px", borderRadius: 8,
        border: "1px solid rgba(255,255,255,.1)",
        background: hov && !disabled ? "linear-gradient(135deg, #FA8200 0%, #861F41 35%, #B7312C 70%, #D86018 100%)" : "rgba(255,255,255,.04)",
        color: disabled ? "rgba(255,255,255,.2)" : hov ? "#fff" : "rgba(255,255,255,.6)",
        fontWeight: 600, fontSize: 13,
        cursor: disabled ? "not-allowed" : "pointer",
        fontFamily: "Calibri, sans-serif",
        transition: "all .15s",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {label}
    </button>
  );
}