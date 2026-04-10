import { Outlet, NavLink } from "react-router-dom";
import { useState } from "react";
import { logoutUser, getUsuario } from "../api/auth";

const nav = [
  { label: "Dashboard",      path: "/dashboard",            icon: "⊞" },
  { label: "Servidores",     path: "/inventario/SERVIDOR",  icon: "🖥" },
  { label: "Bases de Datos", path: "/inventario/BASE_DATOS",icon: "🗄" },
  { label: "UPS",            path: "/inventario/UPS",       icon: "⚡" },
  { label: "Red",            path: "/inventario/RED",       icon: "🌐" },
  { label: "VPN",            path: "/inventario/VPN",       icon: "🔒" },
  { label: "Móviles",        path: "/inventario/MOVIL",     icon: "📱" },
  { label: "Histórico",      path: "/papelera",             icon: "🗑" },
];

const GRAD    = "linear-gradient(135deg, #FA8200 0%, #861F41 35%, #B7312C 70%, #D86018 100%)";
const PRIMARY = "#B7312C";

export default function Layout() {
  const [importing,   setImporting]   = useState(false);
  const [importMsg,   setImportMsg]   = useState<string | null>(null);
  const [hoveredPath, setHoveredPath] = useState<string | null>(null);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportMsg(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res  = await fetch("http://localhost:3000/api/import", {
        method: "POST",
        body: form,
        headers: {
          Authorization: `Bearer ${localStorage.getItem("inventario_token")}`,
        },
      });
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
      background: "#fafbfc",
    }}>

      {/* ── Sidebar ── */}
      <aside style={{
        width: 230, flexShrink: 0,
        background: "#f8f9fa",
        boxShadow: "4px 0 20px rgba(0,0,0,.08)",
        display: "flex", flexDirection: "column",
        position: "relative", zIndex: 10,
      }}>

        {/* Logo / brand */}
        <div style={{ background: GRAD, padding: "28px 20px 24px", boxShadow: "0 4px 12px rgba(183,49,44,.15)" }}>
          <div style={{
            fontSize: 9, fontWeight: 800, letterSpacing: "0.22em",
            textTransform: "uppercase", color: "rgba(255,255,255,.68)",
            marginBottom: 6,
          }}>
            Sistema de
          </div>
          <div style={{
            fontSize: 18, fontWeight: 800, color: "#fff",
            letterSpacing: "0.01em", lineHeight: 1.3,
          }}>
            Inventario
          </div>
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, padding: "16px 10px", display: "flex", flexDirection: "column", gap: 6 }}>
          {nav.map(n => (
            <NavLink
              key={n.path}
              to={n.path}
              onMouseEnter={() => setHoveredPath(n.path)}
              onMouseLeave={() => setHoveredPath(null)}
              style={({ isActive }) => ({
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 14px", borderRadius: 10,
                textDecoration: "none", fontSize: 14, fontWeight: isActive ? 750 : 500,
                transition: "all .2s cubic-bezier(0.4, 0, 0.2, 1)",
                color: isActive ? "#fff" : hoveredPath === n.path ? PRIMARY : "#333",
                background: isActive ? GRAD : hoveredPath === n.path ? "#ffe8dc" : "transparent",
                boxShadow: isActive ? "0 4px 14px rgba(183,49,44,.18)" : "none",
                borderLeft: isActive ? "none" : hoveredPath === n.path ? `4px solid ${PRIMARY}` : "4px solid transparent",
              })}
            >
              <span style={{ fontSize: 16, lineHeight: 1 }}>{n.icon}</span>
              <span>{n.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Divider */}
        <div style={{ height: 1, background: "#e8ddd8", margin: "8px 16px" }} />

        {/* Import button */}
        <div style={{ padding: "16px 12px 10px" }}>
          <label style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            width: "100%", padding: "11px 0", borderRadius: 10,
            background: importing ? "#ddb8ae" : GRAD,
            color: "#fff", fontSize: 13, fontWeight: 750,
            cursor: importing ? "not-allowed" : "pointer",
            boxShadow: importing ? "0 1px 3px rgba(0,0,0,.1)" : "0 6px 16px rgba(183,49,44,.25)",
            transition: "all .25s cubic-bezier(0.4, 0, 0.2, 1)", letterSpacing: "0.03em",
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
              marginTop: 10, padding: "9px 12px", borderRadius: 8,
              background: importMsg.startsWith("✅") ? "#e8f5e9" : "#ffebee",
              color: importMsg.startsWith("✅") ? "#2e7d32" : "#c62828",
              fontSize: 11, lineHeight: 1.6, textAlign: "center", fontWeight: 600,
              border: `1px solid ${importMsg.startsWith("✅") ? "#a5d6a7" : "#ef9a9a"}`,
            }}>
              {importMsg}
            </div>
          )}
        </div>

        {/* Usuario + Cerrar sesión */}
        <div style={{ padding: "10px 12px 14px" }}>
          <div style={{
            fontSize: 11, color: "#666", textAlign: "center",
            marginBottom: 10, fontWeight: 700, letterSpacing: "0.03em",
          }}>
            👤 {getUsuario() ?? "Usuario"}
          </div>
          
          <button
            onClick={() => {
              if (window.confirm("¿Cerrar sesión?")) logoutUser();
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = "#c62828";
              e.currentTarget.style.color = "#fff";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(198, 40, 40, .25)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "#d32f2f";
              e.currentTarget.style.boxShadow = "none";
            }}
            style={{
              display: "flex", alignItems: "center",
              justifyContent: "center", gap: 8,
              width: "100%", padding: "10px 0", borderRadius: 10,
              background: "transparent",
              border: "1.5px solid #d32f2f",
              color: "#d32f2f", fontSize: 13, fontWeight: 750,
              cursor: "pointer", transition: "all .25s cubic-bezier(0.4, 0, 0.2, 1)",
              letterSpacing: "0.03em",
            }}
          >
            🚪 Cerrar sesión
          </button>
        </div>

        {/* Bottom watermark */}
        <div style={{
          padding: "12px 16px 16px",
          fontSize: 9, color: "#888", textAlign: "center",
          letterSpacing: "0.06em", fontWeight: 500,
        }}>
          © {new Date().getFullYear()} TI
        </div>
      </aside>

      {/* ── Main content ── */}
      <main style={{
        flex: 1, overflowY: "auto",
        background: GRAD,
        padding: 0,
      }}>
        <div style={{
          background: GRAD,
          minHeight: "100%",
          borderRadius: 0,
        }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}