import axios from "axios";
import { getToken, logoutUser } from "./auth";

const api = axios.create({
  baseURL: "http://localhost:3000/api",
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
  api.get(`/assets/${id}`).then(r => r.data.data);

export const getStats = () =>
  api.get("/assets/stats").then(r => r.data.data);

export const createAsset = (data: any) =>
  api.post("/assets", data).then(r => r.data.data);

export const updateAsset = (id: string, data: any) =>
  api.patch(`/assets/${id}`, data).then(r => r.data.data);

export async function descargarWordMovil(id: string) {
  const token = getToken();
  const res = await fetch(`http://localhost:3000/api/assets/${id}/word`, {
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

export const deleteAsset = (id: string, autor: string = "Sistema") =>
  api.delete(`/assets/${id}`, { data: { autor } }).then(r => r.data);

export const restoreAsset = (id: string, autor: string = "Sistema") =>
  api.post(`/assets/${id}/restore`, { autor }).then(r => r.data);

export const getDeleted = () =>
  api.get("/assets/deleted").then(r => r.data.data);

export default api;