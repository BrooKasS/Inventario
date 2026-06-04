import axios from "axios";
import { getToken, logoutUser } from "./auth";
import publicApi from "./publicClient";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { "Content-Type": "application/json" },
});

/**
 * Interceptor de request:
 * Agrega automáticamente el token JWT a cada request.
 */
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});


/**
 * Interceptor de response:
 * Si el backend devuelve 401 → token expirado → logout automático.
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      logoutUser(); // borra token y redirige a /login
    }
    return Promise.reject(error);
  }
);

export const getAssets = (params?: Record<string, any>) =>
  api.get("/assets", { params }).then(r => r.data.data);

export const getAssetById = (id: string) =>
  api.get(`/assets/activo/${id}`).then(r => r.data.data);

export const getStats = () =>
  api.get("/assets/stats").then(r => r.data.data);

export const createAsset = (data: any) =>
  api.post("/assets", data).then(r => r.data.data);

export const updateAsset = (id: string, data: any) =>
  api.patch(`/assets/${id}`, data).then(r => r.data.data);

export async function descargarWordMovil(id: string) {
  const token = getToken();
  const res = await fetch(`${import.meta.env.VITE_API_URL}/assets/${id}/word`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `FR-GTE-02-044_${id}.docx`;
  a.click();
  URL.revokeObjectURL(url);
}

export const getBitacora = (id: string) =>
  api.get(`/assets/${id}/bitacora`).then(r => r.data.data);

export const addObservacion = (
  id: string,
  data: { autor: string; tipoEvento: string; descripcion: string }
) => api.post(`/assets/${id}/bitacora`, data).then(r => r.data.data);

export const importExcel = (file: File) => {
  const form = new FormData();
  form.append("file", file);
  return api.post("/import", form, {
    headers: { "Content-Type": "multipart/form-data" },
  }).then(r => r.data);
};


export const deleteAsset = (id: string, motivo: string = "Sin motivo") =>
  api.delete(`/assets/${id}`, { data: { motivo } }).then((r) => r.data);

export const hardDeleteAsset = (id: string) =>
  api.delete(`/assets/${id}/hard`).then((r) => r.data);

export const hardDeleteAllAssets = () =>
  api.delete("/assets/hard-all").then((r) => r.data);

export const restoreAsset = (id: string) =>
  api.post(`/assets/${id}/restore`).then((r) => r.data);

export const getDeleted = () =>
  api.get("/assets/deleted").then((r) => r.data.data);


/* =========================
   ✅ FUNCIONES PÚBLICAS
   ========================= */

/* Obtener asset para firma (sin login) */
export const getAssetByIdPublic = (id: string) =>
  publicApi.get(`/assets/public/${id}`).then(r => r.data.data);

/* Firmar móvil (sin login) */
export const firmarMovilPublic = (
  assetId: string,
  payload: {
    firmaBase64: string;
    observacionesEntrega?: string;
  }
) =>
  publicApi.post(`/assets/${assetId}/firmar`, payload)
    .then(r => r.data);

  export const firmarDevolucionPublic = (
    assetId: string,
    payload: { firmaBase64: string }
  ) =>
    publicApi.post(`/assets/${assetId}/firmar-devolucion`, payload)
      .then(r => r.data);


export const cambiarEstadoMovil = (id: string) =>
  api.post(`/assets/${id}/estado`).then(r => r.data.data);


export const generarSoftware = () =>
  api.get("/assets/export/ocs").then(r => r.data);

export const getOcsSoftware = (assetId: string) =>
  api.get(`/ocs/software/${assetId}`).then(r => r.data);

export const getOcsStatus = () =>
  api.get("/ocs/status").then(r => r.data);
export const getOcsUnmatched = () =>
  api.get("/ocs/unmatched").then(r => r.data.data);

export const getAllSoftware = (params?: { q?: string; publisher?: string; servidor?: string }) =>
  api.get("/ocs/software/all", { params }).then(r => r.data.data);





export default api;

