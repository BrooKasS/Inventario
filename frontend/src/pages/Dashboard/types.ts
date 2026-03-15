export interface ObservacionRow {
  Activo: string;
  Tipo: string;
  Código: string;
  Ubicación: string;
  Fecha: string;
  Autor: string;
  "Tipo de evento": string;
  Descripción: string;
  "Campo modificado": string;
  "Valor anterior": string;
  "Valor nuevo": string;
}

export interface ChartDataPoint {
  key: string;
  tipo: string;
  count: number;
  color: string;
}

export interface ObsModalRow {
  activo: string;
  tipo: string;
  codigo: string;
  fecha: string;
  autor: string;
  evento: string;
  descripcion: string;
  campo: string;
  anterior: string;
  nuevo: string;
}

export interface BitacoraEntry {
  tipoEvento?: string;
  creadoEn?: string;
  descripcion?: string;
  campoModificado?: string;
  valorAnterior?: string;
  valorNuevo?: string;
  autor?: string;
}

export type ExportMode = "activos" | "observaciones";
export type ExportType = "excel" | "pdf" | null;
