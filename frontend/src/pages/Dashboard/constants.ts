// Gradiente principal
export const MAIN_GRADIENT = "linear-gradient(135deg, #fa8100 0%, #861F41 35%, #B7312C 70%, #D86018 100%)";

// Mapeos de tipos de activo
export const TIPO_LABEL: Record<string, string> = {
  SERVIDOR: "Servidores",
  BASE_DATOS: "Bases de Datos",
  RED: "Red",
  UPS: "UPS",
  VPN: "VPN S2S"
};

export const TIPO_LABEL_SINGULAR: Record<string, string> = {
  SERVIDOR: "Servidor", 
  BASE_DATOS: "Base de Datos",
  RED: "Red",
  UPS: "UPS",
  VPN: "VPN S2S",
};

export const TIPO_ICON: Record<string, string> = {
  SERVIDOR: "🖥️",
  BASE_DATOS: "🗄️",
  RED: "🌐",
  UPS: "⚡",
  VPN: "🔒",
};

export const TIPO_GRAD: Record<string, string> = {
  SERVIDOR: "linear-gradient(135deg, #FA8200, #D86018)",
  BASE_DATOS: "linear-gradient(135deg, #861F41, #B7312C)",
  RED: "linear-gradient(135deg, #B7312C, #D86018)",
  UPS: "linear-gradient(135deg, #FA8200, #861F41)",
  VPN: "linear-gradient(135deg, #7a7a7a, #000000)",
};

// Colores sólidos para gráficas
export const COLOR_TIPO: Record<string, string> = {
  SERVIDOR: "#FA8200",
  BASE_DATOS: "#861F41",
  RED: "#B7312C",
  UPS: "#D86018",
  VPN: "#7a7a7a",
};

// Mapeo de tipos de evento
export const EVENTO_LABEL_MAP: Record<string, string> = {
  IMPORTACION: "Importación",
  CAMBIO_CAMPO: "Cambio de campo",
  MANTENIMIENTO: "Mantenimiento",
  INCIDENTE: "Incidente",
  NOTA: "Nota",
};

export const EVENTOS = ["NOTA", "MANTENIMIENTO", "INCIDENTE", "CAMBIO_CAMPO", "IMPORTACION"] as const;

// Colores para eventos en gráficas
export const EVENT_COLOR_MAP: Record<string, string> = {
  NOTA: "#FA8200",
  MANTENIMIENTO: "#861F41",
  INCIDENTE: "#B7312C",
  CAMBIO_CAMPO: "#D86018",
  IMPORTACION: "#7a7a7a",
};

// Configuración de paginación
export const DEFAULT_PAGE_SIZE = 200;
export const DEFAULT_PREVIEW_LIMIT = 50;
export const DEFAULT_RECENT_LIMIT = 10;
