/* ─── DESIGN TOKENS ─── */
export const C = {
  grad: "linear-gradient(135deg, #FA8200 0%, #861F41 35%, #B7312C 70%, #D86018 100%)",
  primary: "#B7312C",
  dark: "#861F41",
  accent: "#FA8200",
  warm: "#D86018",
};

export const EVENTO_LABEL: Record<string, string> = {
  IMPORTACION: "Importación",
  CAMBIO_CAMPO: "Cambio de campo",
  MANTENIMIENTO: "Mantenimiento",
  INCIDENTE: "Incidente",
  NOTA: "Nota",
};

export const EVENTO_COLOR: Record<string, { bg: string; color: string }> = {
  IMPORTACION: { bg: "#e0f0ff", color: "#0c5460" },
  CAMBIO_CAMPO: { bg: "#fff3cd", color: "#856404" },
  MANTENIMIENTO: { bg: "#d4edda", color: "#155724" },
  INCIDENTE: { bg: "#f8d7da", color: "#721c24" },
  NOTA: { bg: "#e2e3e5", color: "#383d41" },
};

/* Estilos reutilizables */
export const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 11,
  fontWeight: 800,
  color: "#333",
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  marginBottom: 8,
  opacity: 0.85,
};

export const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "11px 14px",
  border: "1.5px solid #ddd",
  borderRadius: 12,
  fontSize: 14,
  fontFamily: "Calibri, sans-serif",
  transition: "all .25s cubic-bezier(0.4, 0, 0.2, 1)",
  outline: "none",
  background: "#fafbfc",
  color: "#333",
};
