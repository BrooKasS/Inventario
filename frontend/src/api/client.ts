import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000/api",
  headers: { "Content-Type": "application/json" },
});

export const getAssets = (params?: Record<string, any>) =>
  api.get("/assets", { params }).then(r => r.data.data);

export const getAssetById = (id: string) =>
  api.get(`/assets/${id}`).then(r => r.data.data);

export const getStats = () =>
  api.get("/assets/stats").then(r => r.data.data);

export const updateAsset = (id: string, data: any) =>
  api.patch(`/assets/${id}`, data).then(r => r.data.data);

export const getBitacora = (id: string) =>
  api.get(`/assets/${id}/bitacora`).then(r => r.data.data);

export const addObservacion = (id: string, data: { autor: string; tipoEvento: string; descripcion: string }) =>
  api.post(`/assets/${id}/bitacora`, data).then(r => r.data.data);

export const importExcel = (file: File) => {
  const form = new FormData();
  form.append("file", file);
  return api.post("/import", form, {
    headers: { "Content-Type": "multipart/form-data" },
  }).then(r => r.data);
};

export default api;