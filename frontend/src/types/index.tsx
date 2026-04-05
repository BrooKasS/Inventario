export type TipoActivo = "SERVIDOR" | "RED" | "UPS" | "BASE_DATOS" | "VPN" | "MOVIL";
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

export interface Vpn {
  id: string;
  assetId: string;
  conexion: string | null;
  fases: string | null;
  origen: string | null;
  destino: string | null;
}

export interface Movil {
  id: string;
  assetId: string;
  numeroCaso: string | null;
  region: string | null;
  dependencia: string | null;
  sede: string | null;
  cedula: string | null;
  usuarioRed: string | null;
  correoResponsable: string | null;
  uni: string | null;
  marca: string | null;
  modelo: string | null;
  serial: string | null;
  imei1: string | null;
  imei2: string | null;
  sim: string | null;
  numeroLinea: string | null;
  fechaEntrega: string | null;
  observacionesEntrega: string | null;
  fechaDevolucion: string | null;
  observacionesDevolucion: string | null;
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
  vpn: Vpn | null;
  movil: Movil | null;
  bitacora?: BitacoraEntry[];
motivoDeshabilitacion?: string | null;
deshabilitadoPor?: string | null;
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