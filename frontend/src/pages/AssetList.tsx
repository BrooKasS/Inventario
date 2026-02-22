import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getAssets } from "../api/client";
import type{ Asset, Pagination, TipoActivo } from "../types";

const TIPO_LABEL: Record<string, string> = {
  SERVIDOR: "Servidores",
  BASE_DATOS: "Bases de Datos",
  RED: "Red",
  UPS: "UPS",
};

function Badge({ text }: { text: string | null }) {
  if (!text) return <span className="text-gray-600">—</span>;
  return <span className="text-gray-200">{text}</span>;
}

function ServidorRow({ a, onClick }: { a: Asset; onClick: () => void }) {
  const s = a.servidor;
  return (
    <tr className="border-t border-gray-800 hover:bg-gray-900 cursor-pointer transition-all" onClick={onClick}>
      <td className="px-4 py-3 text-white font-medium">{a.nombre ?? "—"}</td>
      <td className="px-4 py-3 text-gray-400 text-xs">{a.codigoServicio ?? "—"}</td>
      <td className="px-4 py-3"><Badge text={s?.ambiente ?? null} /></td>
      <td className="px-4 py-3 text-gray-400 text-xs font-mono">{s?.ipInterna ?? "—"}</td>
      <td className="px-4 py-3 text-gray-400">{s?.vcpu ?? "—"}</td>
      <td className="px-4 py-3 text-gray-400">{s?.vramMb ? `${s.vramMb / 1024}GB` : "—"}</td>
      <td className="px-4 py-3 text-gray-400 text-xs max-w-xs truncate">{s?.sistemaOperativo ?? "—"}</td>
      <td className="px-4 py-3 text-gray-400 text-xs">{a.ubicacion ?? "—"}</td>
    </tr>
  );
}

function RedRow({ a, onClick }: { a: Asset; onClick: () => void }) {
  const r = a.red;
  return (
    <tr className="border-t border-gray-800 hover:bg-gray-900 cursor-pointer transition-all" onClick={onClick}>
      <td className="px-4 py-3 text-white font-medium">{a.nombre ?? "—"}</td>
      <td className="px-4 py-3 text-gray-400 text-xs font-mono">{r?.serial ?? "—"}</td>
      <td className="px-4 py-3 text-gray-400 text-xs">{r?.modelo ?? "—"}</td>
      <td className="px-4 py-3 text-gray-400 text-xs font-mono">{r?.ipGestion ?? "—"}</td>
      <td className="px-4 py-3"><Badge text={r?.estado ?? null} /></td>
      <td className="px-4 py-3 text-gray-400 text-xs">{a.ubicacion ?? "—"}</td>
      <td className="px-4 py-3 text-gray-400 text-xs">{a.codigoServicio ?? "—"}</td>
    </tr>
  );
}

function UpsRow({ a, onClick }: { a: Asset; onClick: () => void }) {
  const u = a.ups;
  return (
    <tr className="border-t border-gray-800 hover:bg-gray-900 cursor-pointer transition-all" onClick={onClick}>
      <td className="px-4 py-3 text-white font-medium">{a.nombre ?? "—"}</td>
      <td className="px-4 py-3 text-gray-400 text-xs font-mono">{u?.serial ?? "—"}</td>
      <td className="px-4 py-3 text-gray-400 text-xs">{u?.modelo ?? "—"}</td>
      <td className="px-4 py-3 text-gray-400 text-xs font-mono">{u?.placa ?? "—"}</td>
      <td className="px-4 py-3"><Badge text={u?.estado ?? null} /></td>
      <td className="px-4 py-3 text-gray-400 text-xs">{a.ubicacion ?? "—"}</td>
    </tr>
  );
}

function BDRow({ a, onClick }: { a: Asset; onClick: () => void }) {
  const b = a.baseDatos;
  return (
    <tr className="border-t border-gray-800 hover:bg-gray-900 cursor-pointer transition-all" onClick={onClick}>
      <td className="px-4 py-3 text-white font-medium">{a.nombre ?? "—"}</td>
      <td className="px-4 py-3 text-gray-400 text-xs">{b?.ambiente ?? "—"}</td>
      <td className="px-4 py-3 text-gray-400 text-xs">{b?.appSoporta ?? "—"}</td>
      <td className="px-4 py-3 text-gray-400 text-xs">{b?.servidor1 ?? "—"}</td>
      <td className="px-4 py-3 text-gray-400 text-xs">{b?.versionBd ?? "—"}</td>
      <td className="px-4 py-3 text-gray-400 text-xs">{b?.racScan ?? "—"}</td>
      <td className="px-4 py-3 text-gray-400 text-xs">{a.propietario ?? "—"}</td>
    </tr>
  );
}

const HEADERS: Record<string, string[]> = {
  SERVIDOR: ["Nombre", "Código", "Ambiente", "IP Interna", "vCPU", "vRAM", "Sistema Operativo", "Ubicación"],
  RED: ["Nombre", "Serial", "Modelo", "IP Gestión", "Estado", "Ubicación", "Código"],
  UPS: ["Nombre", "Serial", "Modelo", "Placa", "Estado", "Ubicación"],
  BASE_DATOS: ["Nombre", "Ambiente", "Aplicación", "Servidor 1", "Versión", "RAC/Scan", "Propietario"],
};

export default function AssetList() {
  const { tipo } = useParams<{ tipo: string }>();
  const navigate = useNavigate();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAssets({ tipo, q: q || undefined, page, limit: 50 });
      setAssets(data.assets);
      setPagination(data.pagination);
    } finally {
      setLoading(false);
    }
  }, [tipo, q, page]);

  useEffect(() => {
    setPage(1);
    setQ("");
  }, [tipo]);

  useEffect(() => { load(); }, [load]);

  const tipoKey = tipo as TipoActivo;
  const headers = HEADERS[tipoKey] ?? [];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">{TIPO_LABEL[tipoKey]}</h1>
          <p className="text-gray-500 text-sm mt-1">
            {pagination ? `${pagination.total} registros` : "Cargando..."}
          </p>
        </div>
      </div>

      {/* Búsqueda */}
      <div className="mb-5">
        <input
          type="text"
          value={q}
          onChange={e => { setQ(e.target.value); setPage(1); }}
          placeholder="Buscar por nombre o código..."
          className="w-full max-w-md bg-gray-900 border border-gray-700 rounded px-4 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-600"
        />
      </div>

      {/* Tabla */}
      <div className="rounded-lg border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-900 text-gray-400 text-xs uppercase tracking-wider">
                {headers.map(h => (
                  <th key={h} className="px-4 py-3 text-left whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={headers.length} className="px-4 py-8 text-center text-gray-600">Cargando...</td></tr>
              ) : assets.length === 0 ? (
                <tr><td colSpan={headers.length} className="px-4 py-8 text-center text-gray-600">Sin resultados</td></tr>
              ) : assets.map(a => {
                const onClick = () => navigate(`/activo/${a.id}`);
                if (tipoKey === "SERVIDOR") return <ServidorRow key={a.id} a={a} onClick={onClick} />;
                if (tipoKey === "RED") return <RedRow key={a.id} a={a} onClick={onClick} />;
                if (tipoKey === "UPS") return <UpsRow key={a.id} a={a} onClick={onClick} />;
                return <BDRow key={a.id} a={a} onClick={onClick} />;
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paginación */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1 rounded border border-gray-700 text-sm text-gray-400 disabled:opacity-30 hover:border-orange-600 hover:text-white transition-all"
          >
            ←
          </button>
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className="px-3 py-1 rounded border text-sm transition-all"
              style={p === page
                ? { backgroundColor: "#861F2C", borderColor: "#861F2C", color: "white" }
                : { borderColor: "#374151", color: "#9CA3AF" }
              }
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
            disabled={page === pagination.totalPages}
            className="px-3 py-1 rounded border border-gray-700 text-sm text-gray-400 disabled:opacity-30 hover:border-orange-600 hover:text-white transition-all"
          >
            →
          </button>
        </div>
      )}
    </div>
  );
}