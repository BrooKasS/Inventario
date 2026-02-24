import { useEffect, useState, useCallback, useRef } from "react";
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

const FILTER_FIELDS: Record<string, { key: string; label: string }[]> = {
  SERVIDOR: [
    { key: "ambiente",         label: "Ambiente" },
    { key: "tipoServidor",     label: "Tipo de servidor" },
    { key: "sistemaOperativo", label: "Sistema operativo" },
    { key: "monitoreo",        label: "Monitoreo" },
    { key: "backup",           label: "Backup" },
  ],
  RED:        [{ key: "estado", label: "Estado" }, { key: "modelo", label: "Modelo" }],
  UPS:        [{ key: "estado", label: "Estado" }, { key: "modelo", label: "Modelo" }],
  BASE_DATOS: [{ key: "ambiente", label: "Ambiente" }, { key: "versionBd", label: "Versión BD" }],
};

function normalize(text: string) {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

/* ─────────────────────────────────────────
   AutoInput — input con dropdown filtrado
───────────────────────────────────────── */
function AutoInput({
  value, onChange, options, placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const filtered = value
    ? options.filter(o => normalize(o).includes(normalize(value)) && normalize(o) !== normalize(value))
    : options;

  // cerrar al click fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <input
        className="fi"
        style={{
          width: "100%", padding: "10px 14px",
          border: "2px solid #e0e0e0", borderRadius: open && filtered.length > 0 ? "8px 8px 0 0" : 8,
          fontSize: 14, fontFamily: "Calibri, sans-serif",
          outline: "none", transition: "border-color .2s",
          boxSizing: "border-box" as const, background: "#fff",
        }}
        value={value}
        placeholder={placeholder}
        onChange={e => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        autoComplete="off"
      />
      {open && filtered.length > 0 && (
        <div style={{
          position: "absolute", top: "100%", left: 0, right: 0,
          background: "#fff", border: "2px solid #B7312C",
          borderTop: "none", borderRadius: "0 0 8px 8px",
          maxHeight: 180, overflowY: "auto", zIndex: 100,
          boxShadow: "0 8px 20px rgba(0,0,0,.12)",
        }}>
          {filtered.map(opt => (
            <div
              key={opt}
              onMouseDown={e => { e.preventDefault(); onChange(opt); setOpen(false); }}
              style={{
                padding: "9px 14px", fontSize: 13,
                fontFamily: "Calibri, sans-serif", cursor: "pointer",
                borderBottom: "1px solid #f5f0f0",
                color: "#333", transition: "background .1s",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "#fff5f0")}
              onMouseLeave={e => (e.currentTarget.style.background = "#fff")}
            >
              {/* resalta la parte que coincide */}
              {(() => {
                const idx = normalize(opt).indexOf(normalize(value));
                if (!value || idx === -1) return opt;
                return (
                  <>
                    {opt.slice(0, idx)}
                    <strong style={{ color: "#B7312C" }}>{opt.slice(idx, idx + value.length)}</strong>
                    {opt.slice(idx + value.length)}
                  </>
                );
              })()}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Badge ── */
function Badge({ text }: { text: string | null }) {
  if (!text) return <span style={{ color: "#bbb" }}>—</span>;
  return (
    <span style={{
      display: "inline-block", padding: "3px 12px", borderRadius: 20,
      fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em",
      background: "rgba(250,130,0,.3)", color: PRIMARY,
      border: "1px solid rgba(183,49,44,.2)",
    }}>
      {text}
    </span>
  );
}

/* ── Row ── */
function Row({ cells, onClick }: { cells: React.ReactNode[]; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <tr onClick={onClick} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ cursor: "pointer", background: hovered ? "rgba(250,130,0,.08)" : "transparent", transition: "background .15s", borderBottom: "1px solid rgba(255,255,255,.06)" }}
    >
      {cells.map((cell, i) => (
        <td key={i} style={{
          padding: "13px 18px", fontSize: 13, color: "#fff", verticalAlign: "middle",
          fontFamily: "Calibri, 'Segoe UI', sans-serif",
          borderLeft: i === 0 && hovered ? `3px solid ${PRIMARY}` : i === 0 ? "3px solid transparent" : "none",
        }}>
          {cell}
        </td>
      ))}
    </tr>
  );
}

function ServidorRow({ a, onClick }: { a: Asset; onClick: () => void }) {
  const s = a.servidor;
  return <Row onClick={onClick} cells={[
    <strong style={{ color: "#fff" }}>{a.nombre ?? "—"}</strong>,
    a.codigoServicio ?? "—", <Badge text={s?.ambiente ?? null} />,
    <code style={{ fontSize: 12 }}>{s?.ipInterna ?? "—"}</code>,
    s?.vcpu ?? "—", s?.vramMb ? `${s.vramMb / 1024} GB` : "—",
    s?.sistemaOperativo ?? "—", a.ubicacion ?? "—",
  ]} />;
}
function RedRow({ a, onClick }: { a: Asset; onClick: () => void }) {
  const r = a.red;
  return <Row onClick={onClick} cells={[
    <strong style={{ color: "#fff" }}>{a.nombre ?? "—"}</strong>,
    <code style={{ fontSize: 12 }}>{r?.serial ?? "—"}</code>, r?.modelo ?? "—",
    <code style={{ fontSize: 12 }}>{r?.ipGestion ?? "—"}</code>,
    <Badge text={r?.estado ?? null} />, a.ubicacion ?? "—", a.codigoServicio ?? "—",
  ]} />;
}
function UpsRow({ a, onClick }: { a: Asset; onClick: () => void }) {
  const u = a.ups;
  return <Row onClick={onClick} cells={[
    <strong style={{ color: "#fff" }}>{a.nombre ?? "—"}</strong>,
    <code style={{ fontSize: 12 }}>{u?.serial ?? "—"}</code>, u?.modelo ?? "—",
    <code style={{ fontSize: 12 }}>{u?.placa ?? "—"}</code>,
    <Badge text={u?.estado ?? null} />, a.ubicacion ?? "—",
  ]} />;
}
function BDRow({ a, onClick }: { a: Asset; onClick: () => void }) {
  const b = a.baseDatos;
  return <Row onClick={onClick} cells={[
    <strong style={{ color: "#fff" }}>{a.nombre ?? "—"}</strong>,
    b?.ambiente ?? "—", b?.appSoporta ?? "—", b?.servidor1 ?? "—",
    b?.versionBd ?? "—", b?.racScan ?? "—", a.propietario ?? "—",
  ]} />;
}

const HEADERS: Record<string, string[]> = {
  SERVIDOR:   ["Nombre", "Código", "Ambiente", "IP Interna", "vCPU", "vRAM", "Sistema Operativo", "Ubicación"],
  RED:        ["Nombre", "Serial", "Modelo", "IP Gestión", "Estado", "Ubicación", "Código"],
  UPS:        ["Nombre", "Serial", "Modelo", "Placa", "Estado", "Ubicación"],
  BASE_DATOS: ["Nombre", "Ambiente", "Aplicación", "Servidor 1", "Versión", "RAC/Scan", "Propietario"],
};

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 11, fontWeight: 700,
  color: "#B7312C", letterSpacing: "0.1em",
  textTransform: "uppercase", marginBottom: 7,
};

function PagBtn({ label, disabled, onClick }: { label: string; disabled: boolean; onClick: () => void }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} disabled={disabled} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        padding: "8px 16px", borderRadius: 8, border: "1px solid rgba(255,255,255,.1)",
        background: hov && !disabled ? "linear-gradient(135deg,#FA8200,#861F41 35%,#B7312C 70%,#D86018)" : "rgba(255,255,255,.04)",
        color: disabled ? "rgba(255,255,255,.2)" : hov ? "#fff" : "rgba(255,255,255,.6)",
        fontWeight: 600, fontSize: 13, cursor: disabled ? "not-allowed" : "pointer",
        fontFamily: "Calibri, sans-serif", transition: "all .15s", opacity: disabled ? 0.5 : 1,
      }}
    >{label}</button>
  );
}

/* ─── helpers para extraer valores únicos ─── */
function uniqueVals(assets: Asset[], getter: (a: Asset) => string | null | undefined): string[] {
  return Array.from(new Set(assets.map(getter).filter(Boolean) as string[])).sort();
}
function uniqueSubVals(assets: Asset[], key: string): string[] {
  return Array.from(new Set(assets.map(a => {
    const sub: any = a.servidor ?? a.red ?? a.ups ?? a.baseDatos ?? {};
    return sub[key] as string | undefined;
  }).filter(Boolean) as string[])).sort();
}

/* ═══════════════════════════════════════════ */
export default function AssetList() {
  const { tipo } = useParams<{ tipo: string }>();
  const navigate = useNavigate();

  const [assets,     setAssets]     = useState<Asset[]>([]);
  const [allAssets,  setAllAssets]  = useState<Asset[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [q,          setQ]          = useState("");
  const [page,       setPage]       = useState(1);
  const [loading,    setLoading]    = useState(true);

  const [showFilters,     setShowFilters]     = useState(false);
  const [filtroNombre,    setFiltroNombre]    = useState("");
  const [filtroCodigo,    setFiltroCodigo]    = useState("");
  const [filtroUbicacion, setFiltroUbicacion] = useState("");
  const [filtroExtra,     setFiltroExtra]     = useState<Record<string, string>>({});

  const tipoKey    = tipo as TipoActivo;
  const headers    = HEADERS[tipoKey] ?? [];
  const extraFields = FILTER_FIELDS[tipoKey] ?? [];

  const hayFiltros = !!(filtroNombre || filtroCodigo || filtroUbicacion
    || Object.values(filtroExtra).some(v => v));

  /* ── opciones de autocompletado derivadas de allAssets ── */
  const optsNombre    = uniqueVals(allAssets, a => a.nombre);
  const optsCodigo    = uniqueVals(allAssets, a => a.codigoServicio);
  const optsUbicacion = uniqueVals(allAssets, a => a.ubicacion);
  const optsExtra: Record<string, string[]> = Object.fromEntries(
    extraFields.map(({ key }) => [key, uniqueSubVals(allAssets, key)])
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAssets({ tipo, q: q || undefined, page, limit: 50 });
      const list = data.assets || [];
      setAllAssets(list);
      setAssets(list);
      setPagination(data.pagination);
    } catch (err) {
      console.error("Error cargando activos:", err);
    } finally {
      setLoading(false);
    }
  }, [tipo, q, page]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setPage(1); setQ(""); limpiarFiltros(); }, [tipo]);
  useEffect(() => { load(); }, [load]);

  const aplicarFiltros = () => {
    const filtered = allAssets.filter(a => {
      const matchNombre    = !filtroNombre    || normalize(a.nombre ?? "").includes(normalize(filtroNombre));
      const matchCodigo    = !filtroCodigo    || normalize(a.codigoServicio ?? "").includes(normalize(filtroCodigo));
      const matchUbicacion = !filtroUbicacion || normalize(a.ubicacion ?? "").includes(normalize(filtroUbicacion));
      const matchExtra = extraFields.every(({ key }) => {
        const val = filtroExtra[key];
        if (!val) return true;
        const sub: any = a.servidor ?? a.red ?? a.ups ?? a.baseDatos ?? {};
        return normalize(String(sub[key] ?? "")).includes(normalize(val));
      });
      return matchNombre && matchCodigo && matchUbicacion && matchExtra;
    });
    setAssets(filtered);
    setShowFilters(false);
  };

  function limpiarFiltros() {
    setFiltroNombre(""); setFiltroCodigo(""); setFiltroUbicacion(""); setFiltroExtra({});
    setAssets(allAssets); setShowFilters(false);
  }

  return (
    <div style={{
      minHeight: "100%", padding: "32px 28px",
      fontFamily: "Calibri, 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      background: "linear-gradient(160deg, #FA8200, #892f4d, #843952 60%, #b6433f 100%, #D86018)",
    }}>
      <style>{`
        @keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}
        @keyframes fadeIn{from{opacity:0;transform:scale(.97)}to{opacity:1;transform:scale(1)}}
        .fi:focus{border-color:#B7312C !important; border-radius:8px 8px 0 0}
        /* scrollbar modal */
        .modal-scroll::-webkit-scrollbar{width:5px}
        .modal-scroll::-webkit-scrollbar-track{background:#fdf8f8}
        .modal-scroll::-webkit-scrollbar-thumb{background:#e0c8c8;border-radius:4px}
      `}</style>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>

        {/* ── Header ── */}
        <div style={{ marginBottom: 28, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <span style={{
                fontSize: 28, width: 44, height: 44, borderRadius: 10,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: TIPO_GRAD[tipoKey] ?? GRAD, boxShadow: "0 4px 12px rgba(0,0,0,.25)",
              }}>
                {TIPO_ICON[tipoKey] ?? "📦"}
              </span>
              <h1 style={{ fontSize: 28, fontWeight: 700, color: "#fff", margin: 0, textShadow: "0 2px 8px rgba(0,0,0,.2)" }}>
                {TIPO_LABEL[tipoKey] || "Activos"}
              </h1>
            </div>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,.75)", margin: "4px 0 0 54px" }}>
              {loading ? "Cargando..."
                : hayFiltros ? `${assets.length} de ${allAssets.length} registros (filtrado)`
                : pagination ? `${pagination.total} registros encontrados` : ""}
            </p>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {hayFiltros && (
              <button onClick={limpiarFiltros} style={{
                padding: "10px 16px", borderRadius: 8,
                border: "1px solid rgba(255,255,255,.25)",
                background: "rgba(255,255,255,.12)", color: "#fff",
                fontWeight: 600, cursor: "pointer", fontSize: 13, fontFamily: "Calibri, sans-serif",
              }}>✕ Limpiar filtros</button>
            )}
            <button onClick={() => setShowFilters(true)} style={{
              padding: "10px 20px", borderRadius: 8, border: "none",
              background: "#fff", color: "#B7312C", fontWeight: 700,
              cursor: "pointer", fontSize: 14, fontFamily: "Calibri, sans-serif",
              boxShadow: "0 4px 12px rgba(0,0,0,.15)",
            }}>🔍 Filtros</button>
          </div>
        </div>

        {/* ── Tabla ── */}
        <div style={{ borderRadius: 14, overflow: "hidden", border: "1px solid rgba(255,255,255,.08)", boxShadow: "0 8px 32px rgba(0,0,0,.35)" }}>
          <div style={{ background: TIPO_GRAD[tipoKey] ?? GRAD, padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 16, width: 30, height: 30, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,.18)" }}>📋</span>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#fff" }}>
                Listado de {TIPO_LABEL[tipoKey] || "Activos"}
              </span>
            </div>
            {hayFiltros && (
              <span style={{ fontSize: 11, color: "rgba(255,255,255,.8)", background: "rgba(255,255,255,.15)", padding: "3px 10px", borderRadius: 20, fontWeight: 600 }}>
                {assets.length} resultado{assets.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          <div style={{ background: "rgba(255,255,255,.04)" }}>
            {loading ? (
              <div style={{ padding: "64px 40px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
                <div style={{ width: 44, height: 44, border: "4px solid rgba(255,255,255,.1)", borderTop: "4px solid #FA8200", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                <span style={{ color: "rgba(255,255,255,.35)", fontSize: 14 }}>Cargando activos...</span>
              </div>
            ) : assets.length === 0 ? (
              <div style={{ padding: "64px 40px", textAlign: "center" }}>
                <div style={{ fontSize: 52, marginBottom: 12, opacity: 0.2 }}>📭</div>
                <p style={{ color: "rgba(255,255,255,.3)", fontSize: 15, margin: 0 }}>No se encontraron resultados</p>
                {hayFiltros && (
                  <button onClick={limpiarFiltros} style={{ marginTop: 16, padding: "8px 18px", borderRadius: 8, border: "1px solid rgba(255,255,255,.2)", background: "rgba(255,255,255,.1)", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "Calibri, sans-serif" }}>
                    Limpiar filtros
                  </button>
                )}
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
                  <thead>
                    <tr style={{ background: "rgba(0,0,0,.3)" }}>
                      {headers.map((h, i, arr) => (
                        <th key={h} style={{ padding: "11px 18px", textAlign: "left", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#fff", whiteSpace: "nowrap", borderRight: i < arr.length - 1 ? "1px solid rgba(255,255,255,.06)" : "none" }}>
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

        {/* ── Paginación ── */}
        {pagination && pagination.totalPages > 1 && !hayFiltros && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 24, flexWrap: "wrap" }}>
            <PagBtn label="← Anterior" disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))} />
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)} style={{
                width: 36, height: 36, borderRadius: 8,
                border: p === page ? "none" : "1px solid rgba(255,255,255,.1)",
                background: p === page ? "linear-gradient(135deg,#FA8200,#861F41 35%,#B7312C 70%,#D86018)" : "rgba(255,255,255,.04)",
                color: p === page ? "#fff" : "rgba(255,255,255,.6)",
                fontWeight: p === page ? 700 : 500, fontSize: 13, cursor: "pointer",
                boxShadow: p === page ? "0 2px 8px rgba(183,49,44,.25)" : "none",
                fontFamily: "Calibri, sans-serif", transition: "all .15s",
              }}>{p}</button>
            ))}
            <PagBtn label="Siguiente →" disabled={page === pagination.totalPages} onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} />
          </div>
        )}
      </div>

      {/* ══════════════ Modal de Filtros ══════════════ */}
      {showFilters && (
        <div
          onClick={e => e.target === e.currentTarget && setShowFilters(false)}
          style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}
        >
          <div className="modal-scroll" style={{ background: "white", borderRadius: 12, width: "90%", maxWidth: 580, boxShadow: "0 10px 40px rgba(0,0,0,.35)", animation: "fadeIn .2s ease", maxHeight: "90vh", overflowY: "auto" }}>

            {/* header */}
            <div style={{ background: TIPO_GRAD[tipoKey] ?? GRAD, padding: "18px 24px", borderRadius: "12px 12px 0 0", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 15, width: 28, height: 28, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,.18)" }}>🔍</span>
                <h3 style={{ color: "#fff", margin: 0, fontSize: 15, fontWeight: 700 }}>
                  Filtros — {TIPO_LABEL[tipoKey] || "Activos"}
                </h3>
              </div>
              <button onClick={() => setShowFilters(false)} style={{ background: "none", border: "none", color: "#fff", fontSize: 24, cursor: "pointer", lineHeight: 1, opacity: 0.8 }}>×</button>
            </div>

            {/* body */}
            <div style={{ padding: "24px" }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#aaa", margin: "0 0 16px" }}>
                Campos comunes
              </p>

              {/* Nombre siempre visible. Código: oculto en UPS y BASE_DATOS. Ubicación: oculta en BASE_DATOS */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px 16px", marginBottom: 8 }}>
                <div style={{ gridColumn: (tipoKey === "UPS" || tipoKey === "BASE_DATOS") ? "1 / -1" : undefined }}>
                  <label style={labelStyle}>Nombre</label>
                  <AutoInput
                    value={filtroNombre}
                    onChange={setFiltroNombre}
                    options={optsNombre}
                    placeholder="Ej: localhost, sgrlp..."
                  />
                </div>
                {tipoKey !== "UPS" && tipoKey !== "BASE_DATOS" && (
                  <div>
                    <label style={labelStyle}>Código de servicio</label>
                    <AutoInput
                      value={filtroCodigo}
                      onChange={setFiltroCodigo}
                      options={optsCodigo}
                      placeholder="Ej: FLP0520..."
                    />
                  </div>
                )}
                {tipoKey !== "BASE_DATOS" && (
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={labelStyle}>Ubicación</label>
                    <AutoInput
                      value={filtroUbicacion}
                      onChange={setFiltroUbicacion}
                      options={optsUbicacion}
                      placeholder="Ej: Virtual/Triara, Datacenter..."
                    />
                  </div>
                )}
              </div>

              {/* campos específicos */}
              {extraFields.length > 0 && (
                <>
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#aaa", margin: "20px 0 16px", paddingTop: 16, borderTop: "1px solid #f0e8e8" }}>
                    Campos de {TIPO_LABEL[tipoKey]}
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px 16px" }}>
                    {extraFields.map(({ key, label }) => (
                      <div key={key}>
                        <label style={labelStyle}>{label}</label>
                        <AutoInput
                          value={filtroExtra[key] ?? ""}
                          onChange={v => setFiltroExtra(prev => ({ ...prev, [key]: v }))}
                          options={optsExtra[key] ?? []}
                          placeholder={`Filtrar por ${label.toLowerCase()}...`}
                        />
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* footer */}
            <div style={{ padding: "14px 24px 18px", display: "flex", justifyContent: "flex-end", gap: 12, borderTop: "1px solid #f0e8e8", background: "#fdf8f8", borderRadius: "0 0 12px 12px" }}>
              <button onClick={limpiarFiltros} style={{ padding: "10px 22px", borderRadius: 8, border: "1px solid #e0d8d8", background: "#fff", color: "#888", fontWeight: 600, cursor: "pointer", fontSize: 14, fontFamily: "Calibri, sans-serif" }}>
                Limpiar
              </button>
              <button onClick={aplicarFiltros} style={{ padding: "10px 22px", borderRadius: 8, border: "none", background: TIPO_GRAD[tipoKey] ?? GRAD, color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 14, fontFamily: "Calibri, sans-serif", boxShadow: "0 4px 12px rgba(183,49,44,.3)" }}>
                Aplicar filtros
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}