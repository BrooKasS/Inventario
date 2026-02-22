import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";

const nav = [
  { label: "Dashboard", path: "/dashboard", icon: "⊞" },
  { label: "Servidores", path: "/inventario/SERVIDOR", icon: "🖥" },
  { label: "Bases de Datos", path: "/inventario/BASE_DATOS", icon: "🗄" },
  { label: "UPS", path: "/inventario/UPS", icon: "⚡" },
  { label: "Red", path: "/inventario/RED", icon: "🌐" },
];

export default function Layout() {
  const navigate = useNavigate();
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState<string | null>(null);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportMsg(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("http://localhost:3000/api/import", {
        method: "POST",
        body: form,
      });
      const json = await res.json();
      const d = json.data;
      setImportMsg(`✅ ${d.creados} creados, ${d.actualizados} actualizados, ${d.errores} errores`);
    } catch {
      setImportMsg("❌ Error al importar");
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  };

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100 font-mono overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 bg-gray-900 border-r border-gray-800 flex flex-col">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-gray-800">
          <div className="text-xs text-gray-500 uppercase tracking-widest mb-1">Inventario</div>
          <div className="text-lg font-bold" style={{ color: "#FA8241" }}>Infraestructura</div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {nav.map(n => (
            <NavLink
              key={n.path}
              to={n.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded text-sm transition-all ${
                  isActive
                    ? "text-white font-semibold"
                    : "text-gray-400 hover:text-gray-200 hover:bg-gray-800"
                }`
              }
              style={({ isActive }) => isActive ? { backgroundColor: "#861F2C" } : {}}
            >
              <span>{n.icon}</span>
              <span>{n.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Import */}
        <div className="px-3 py-4 border-t border-gray-800">
          <label className="block w-full text-center text-xs py-2 px-3 rounded cursor-pointer transition-all text-white font-semibold"
            style={{ backgroundColor: "#D86000" }}
          >
            {importing ? "Importando..." : "📥 Importar Excel"}
            <input type="file" accept=".xlsx" className="hidden" onChange={handleImport} disabled={importing} />
          </label>
          {importMsg && (
            <div className="mt-2 text-xs text-gray-400 text-center">{importMsg}</div>
          )}
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}