import axios from "axios";
import { getToken, logoutUser } from "./auth";

export type BackupTipo = "diario" | "semanal" | "mensual" | "kpi";

export interface BackupRun {
  runId: string;
  tipo: BackupTipo;
  trigger: "manual" | "cron";
  fechaInicio: string;
  fechaFin: string;
  creadoEn: string;
  correosEncontrados: number;
  archivosProcesados: number;
  resumen: Record<string, any> | null;
  enviado: boolean;
  enviadoEn?: string;
  enviadoA?: { to: string[]; cc?: string[] };
}

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/backups`,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) logoutUser();
    return Promise.reject(error);
  }
);

export const listRuns = (tipo: BackupTipo): Promise<BackupRun[]> =>
  api.get(`/${tipo}/runs`).then((r) => r.data.data);

export const getRun = (tipo: BackupTipo, runId: string): Promise<BackupRun> =>
  api.get(`/${tipo}/runs/${runId}`).then((r) => r.data.data);

export const createRun = (
  tipo: BackupTipo,
  params?: { fechaInicio?: string; fechaFin?: string }
): Promise<BackupRun> => api.post(`/${tipo}/runs`, params ?? {}).then((r) => r.data.data);

export const sendRun = (
  tipo: BackupTipo,
  runId: string,
  params: { to?: string[]; cc?: string[]; asunto?: string; mensaje?: string }
): Promise<BackupRun> => api.post(`/${tipo}/runs/${runId}/enviar`, params).then((r) => r.data.data);

export const deleteRun = (tipo: BackupTipo, runId: string): Promise<void> =>
  api.delete(`/${tipo}/runs/${runId}`).then(() => undefined);

export async function downloadRunExcel(tipo: BackupTipo, runId: string) {
  const token = getToken();
  const res = await fetch(`${import.meta.env.VITE_API_URL}/backups/${tipo}/runs/${runId}/excel`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Error al descargar el Excel del informe");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Informe_Backup_${tipo}_${runId}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}
