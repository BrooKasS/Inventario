import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";

const nav = [
  { label: "Dashboard",      path: "/dashboard",           icon: "⊞" },
  { label: "Servidores",     path: "/inventario/SERVIDOR", icon: "🖥" },
  { label: "Bases de Datos", path: "/inventario/BASE_DATOS",icon: "🗄" },
  { label: "UPS",            path: "/inventario/UPS",      icon: "⚡" },
  { label: "Red",            path: "/inventario/RED",      icon: "🌐" },
];

const GRAD = "linear-gradient(135deg, #FA8200 0%, #861F41 35%, #B7312C 70%, #D86018 100%)";
const PRIMARY = "#B7312C";
const DARK  = "#861F41";

export default function Layout() {
  const [importing, setImporting]   = useState(false);
  const [importMsg, setImportMsg]   = useState<string | null>(null);
  const [hoveredPath, setHoveredPath] = useState<string | null>(null);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportMsg(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res  = await fetch("http://localhost:3000/api/import", { method: "POST", body: form });
      const json = await res.json();
      const d    = json.data;
      setImportMsg(`✅ ${d.creados} creados, ${d.actualizados} actualizados, ${d.errores} errores`);
    } catch {
      setImportMsg("❌ Error al importar");
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  };

  return (
    <div style={{
      display: "flex", height: "100vh", overflow: "hidden",
      fontFamily: "Calibri, 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      background: "#f0f5f1",
    }}>

      {/* ── Sidebar ── */}
      <aside style={{
        width: 230, flexShrink: 0,
        background: "#dedede",
        boxShadow: "2px 0 12px rgba(183,49,44,.10)",
        display: "flex", flexDirection: "column",
        position: "relative", zIndex: 10,
      }}>

        {/* Logo / brand */}
        <div style={{
          background: GRAD,
          padding: "24px 20px 20px",
        }}>
          <div style={{
            fontSize: 10, fontWeight: 700, letterSpacing: "0.18em",
            textTransform: "uppercase", color: "rgba(255, 255, 255, 0.72)",
            marginBottom: 4,
          }}>
            Inventario
          </div>
          <div style={{
            fontSize: 20, fontWeight: 700, color: "#fff",
            letterSpacing: "0.01em", lineHeight: 1.2,
          }}>
            Infraestructura
          </div>
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, padding: "12px 10px", display: "flex", flexDirection: "column", gap: 2 }}>
          {nav.map(n => (
            <NavLink
              key={n.path}
              to={n.path}
              onMouseEnter={() => setHoveredPath(n.path)}
              onMouseLeave={() => setHoveredPath(null)}
              style={({ isActive }) => ({
                display: "flex", alignItems: "center", gap: 10,
                padding: "9px 12px", borderRadius: 8,
                textDecoration: "none", fontSize: 14, fontWeight: isActive ? 700 : 500,
                transition: "all .18s",
                color: isActive ? "#fff" : hoveredPath === n.path ? PRIMARY : "#000000",
                background: isActive
                  ? GRAD
                  : hoveredPath === n.path
                  ? "#fff0ee"
                  : "transparent",
                boxShadow: isActive ? "0 2px 8px rgb(183, 49, 44)" : "none",
                borderLeft: isActive ? "none" : hoveredPath === n.path ? `3px solid ${PRIMARY}` : "3px solid transparent",
              })}
            >
              <span style={{ fontSize: 16, lineHeight: 1 }}>{n.icon}</span>
              <span>{n.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Divider */}
        <div style={{ height: 1, background: "#f0e8e8", margin: "0 16px" }} />

        {/* Import button */}
        <div style={{ padding: "16px 12px" }}>
          <label style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            width: "100%", padding: "10px 0", borderRadius: 8,
            background: importing ? "#e0c0be" : GRAD,
            color: "#fff", fontSize: 13, fontWeight: 700,
            cursor: importing ? "not-allowed" : "pointer",
            boxShadow: importing ? "none" : "0 4px 12px rgba(183,49,44,.3)",
            transition: "all .2s", letterSpacing: "0.02em",
          }}>
            <span style={{ fontSize: 15 }}>📥</span>
            {importing ? "Importando..." : "Importar Excel"}
            <input
              type="file" accept=".xlsx"
              style={{ display: "none" }}
              onChange={handleImport}
              disabled={importing}
            />
          </label>

          {importMsg && (
            <div style={{
              marginTop: 10, padding: "8px 12px", borderRadius: 8,
              background: importMsg.startsWith("✅") ? "#d4edda" : "#f8d7da",
              color: importMsg.startsWith("✅") ? "#155724" : "#721c24",
              fontSize: 11, lineHeight: 1.5, textAlign: "center",
            }}>
              {importMsg}
            </div>
          )}
        </div>

        {/* Bottom watermark */}
        <div style={{
          padding: "10px 16px 14px",
          fontSize: 10, color: "#0c0c0c", textAlign: "center",
          letterSpacing: "0.05em",
        }}>
          © {new Date().getFullYear()} Infraestructura TI
        </div>
      </aside>

      {/* ── Main content ── */}
      <main style={{
        flex: 1, overflowY: "auto",
        background: "linear-gradient(135deg, #FA8200 0%, #861F41 35%, #B7312C 70%, #D86018 100%)",
        padding: 2,
      }}>
        <div style={{
          background: "linear-gradient(135deg, #FA8200 0%, #861F41 35%, #B7312C 70%, #D86018 100%)",
          minHeight: "100%",
          borderRadius: 0,
        }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}