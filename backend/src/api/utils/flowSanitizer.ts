// src/api/utils/flowSanitizer.ts
type AnyObj = Record<string, any>;

/**
 * Convierte null/undefined -> ""
 * Convierte Date -> YYYY-MM-DD
 * Convierte number -> string
 * ✅ PRESERVA boolean (especialmente Eliminado)
 */
export function sanitizeRecordForFlow<T extends AnyObj>(rec: T): T {
  const out: AnyObj = {};

  for (const [k, v] of Object.entries(rec)) {

    // ✅ PRESERVAR Eliminado COMO BOOLEAN
    if (k === "Eliminado") {
      out[k] = v === true;
      continue;
    }

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

export function sanitizePayloadForFlow(payload: {
  tipo: string;
  assets: AnyObj[];
}) {
  return {
    tipo: payload.tipo,
    assets: payload.assets.map(sanitizeRecordForFlow),
  };
}