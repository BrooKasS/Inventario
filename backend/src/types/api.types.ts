// Tipos compartidos para toda la API
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface AssetFilters extends PaginationParams {
  tipo?: "SERVIDOR" | "RED" | "UPS" | "BASE_DATOS" | "VPN" | "MOVIL";
  q?: string; // búsqueda por nombre o código
}

export interface ImportResult {
  creados: number;
  actualizados: number;
  errores: number;
}

export interface BitacoraEntry {
  autor: string;
  tipoEvento: "IMPORTACION" | "CAMBIO_CAMPO" | "MANTENIMIENTO" | "INCIDENTE" | "NOTA";
  descripcion: string;
  campoModificado?: string;
  valorAnterior?: string;
  valorNuevo?: string;
}