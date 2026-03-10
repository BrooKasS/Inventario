// src/api/utils/flowSanitizer.ts
type AnyObj = Record<string, any>;

/**
 * Convierte null/undefined -> "" y números/fechas -> string.
 * NOTA: no hace deep para objetos anidados (no lo necesitas porque tus registros son planos).
 */
export function sanitizeRecordForFlow<T extends AnyObj>(rec: T): T {
  const out: AnyObj = {};
  for (const [k, v] of Object.entries(rec)) {
    if (v === null || v === undefined) {
      out[k] = "";
    } else if (v instanceof Date) {
      out[k] = v.toISOString().slice(0, 10); // YYYY-MM-DD
    } else if (typeof v === "number") {
      out[k] = String(v);
    } else {
      out[k] = v;
    }
  }
  return out as T;
}

export function sanitizePayloadForFlow(payload: { tipo: string; assets: AnyObj[] }) {
  return {
    tipo: payload.tipo,
    assets: payload.assets.map(sanitizeRecordForFlow),
  };
}