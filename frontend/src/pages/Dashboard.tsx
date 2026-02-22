 import { useEffect, useState } from "react";
import  { useNavigate } from "react-router-dom";
import { getStats, getAssets } from "../api/client";
import type { StatsResponse, Asset } from "../types";

const TIPO_LABEL: Record<string, string> = {
  SERVIDOR: "Servidores",
  BASE_DATOS: "Bases de Datos",
  RED: "Red",
  UPS: "UPS",
};

const TIPO_ICON: Record<string, string> = {
  SERVIDOR: "🖥",
  BASE_DATOS: "🗄",
  RED: "🌐",
  UPS: "⚡",
};

export default function Dashboard() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [recent, setRecent] = useState<Asset[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    getStats().then(setStats);
    getAssets({ limit: 10, page: 1 }).then((d: any) => setRecent(d.assets));
  }, []);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 text-sm mt-1">Estado general del inventario</p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-2 gap-4 mb-10 lg:grid-cols-4">
        {/* Total */}
        <div className="rounded-lg p-5 border border-gray-800 bg-gray-900">
          <div className="text-3xl font-bold text-white">{stats?.total ?? "—"}</div>
          <div className="text-xs text-gray-400 mt-1 uppercase tracking-widest">Total Activos</div>
        </div>
        {stats?.porTipo.map(t => (
          <div key={t.tipo} className="rounded-lg p-5 border border-gray-800 bg-gray-900 cursor-pointer hover:border-orange-700 transition-all"
            onClick={() => navigate(`/inventario/${t.tipo}`)}
          >
            <div className="text-2xl mb-1">{TIPO_ICON[t.tipo]}</div>
            <div className="text-3xl font-bold text-white">{t.count}</div>
            <div className="text-xs text-gray-400 mt-1 uppercase tracking-widest">{TIPO_LABEL[t.tipo]}</div>
          </div>
        ))}
      </div>

      {/* Actividad reciente */}
      <div>
        <h2 className="text-sm uppercase tracking-widest text-gray-500 mb-4">Actividad Reciente</h2>
        <div className="rounded-lg border border-gray-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-900 text-gray-400 text-xs uppercase tracking-wider">
                <th className="px-4 py-3 text-left">Activo</th>
                <th className="px-4 py-3 text-left">Tipo</th>
                <th className="px-4 py-3 text-left">Código</th>
                <th className="px-4 py-3 text-left">Última actualización</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((a, i) => (
                <tr key={a.id}
                  className="border-t border-gray-800 hover:bg-gray-900 cursor-pointer transition-all"
                  onClick={() => navigate(`/activo/${a.id}`)}
                >
                  <td className="px-4 py-3 text-white font-medium">{a.nombre ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: "#861F2C", color: "white" }}>
                      {TIPO_LABEL[a.tipo]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400">{a.codigoServicio ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {new Date(a.actualizadoEn).toLocaleString("es-CO")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}