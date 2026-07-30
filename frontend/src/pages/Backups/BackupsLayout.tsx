import { NavLink, Outlet } from "react-router-dom";
import { MAIN_GRADIENT } from "./shared";

const TABS = [
  { label: "📅 Diario", path: "diario" },
  { label: "📆 Semanal", path: "semanal" },
  { label: "🗓 Mensual", path: "mensual" },
  { label: "📊 KPI", path: "kpi" },
];

export default function BackupsLayout() {
  return (
    <div style={{ minHeight: "100%", display: "flex", flexDirection: "column" }}>
      <div
        style={{
          background: MAIN_GRADIENT,
          padding: "16px 28px 0",
          display: "flex",
          gap: 6,
          flexWrap: "wrap",
        }}
      >
        {TABS.map((t) => (
          <NavLink
            key={t.path}
            to={t.path}
            style={({ isActive }) => ({
              padding: "10px 22px",
              borderRadius: "10px 10px 0 0",
              fontWeight: 700,
              fontSize: 14,
              textDecoration: "none",
              whiteSpace: "nowrap",
              color: isActive ? "#B7312C" : "rgba(255,255,255,.85)",
              background: isActive ? "#fff" : "rgba(255,255,255,.14)",
              transition: "all .2s",
            })}
          >
            {t.label}
          </NavLink>
        ))}
      </div>
      <div style={{ flex: 1 }}>
        <Outlet />
      </div>
    </div>
  );
}
