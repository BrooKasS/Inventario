export type TipoActivo = "SERVIDOR" | "RED" | "UPS" | "BASE_DATOS";
export type TipoEvento = "IMPORTACION" | "CAMBIO_CAMPO" | "MANTENIMIENTO" | "INCIDENTE" | "NOTA";

export interface Servidor {
  id: string;
  assetId: string;
  monitoreo: string | null;
  backup: string | null;
  ipInterna: string | null;
  ipGestion: string | null;
  ipServicio: string | null;
  ambiente: string | null;
  tipoServidor: string | null;
  appSoporta: string | null;
  vcpu: number | null;
  vramMb: number | null;
  sistemaOperativo: string | null;
  fechaFinSoporte: string | null;
  rutasBackup: string | null;
  contratoQueSoporta: string | null;
}

export interface Red {
  id: string;
  assetId: string;
  serial: string | null;
  mac: string | null;
  modelo: string | null;
  fechaFinSoporte: string | null;
  ipGestion: string | null;
  estado: string | null;
  contratoQueSoporta: string | null;
}

export interface Ups {
  id: string;
  assetId: string;
  serial: string | null;
  placa: string | null;
  modelo: string | null;
  estado: string | null;
}

export interface BaseDatos {
  id: string;
  assetId: string;
  servidor1: string | null;
  servidor2: string | null;
  racScan: string | null;
  ambiente: string | null;
  appSoporta: string | null;
  versionBd: string | null;
  fechaFinalSoporte: string | null;
  contenedorFisico: string | null;
  contratoQueSoporta: string | null;
}

export interface BitacoraEntry {
  id: string;
  assetId: string;
  autor: string;
  tipoEvento: TipoEvento;
  descripcion: string;
  campoModificado: string | null;
  valorAnterior: string | null;
  valorNuevo: string | null;
  creadoEn: string;
}

export interface Asset {
  id: string;
  tipo: TipoActivo;
  nombre: string | null;
  codigoServicio: string | null;
  ubicacion: string | null;
  propietario: string | null;
  custodio: string | null;
  creadoEn: string;
  actualizadoEn: string;
  servidor: Servidor | null;
  red: Red | null;
  ups: Ups | null;
  baseDatos: BaseDatos | null;
  bitacora?: BitacoraEntry[];
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AssetsResponse {
  assets: Asset[];
  pagination: Pagination;
}

export interface StatsResponse {
  total: number;
  porTipo: { tipo: TipoActivo; count: number }[];
}