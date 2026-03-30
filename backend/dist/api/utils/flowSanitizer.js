"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeRecordForFlow = sanitizeRecordForFlow;
exports.sanitizePayloadForFlow = sanitizePayloadForFlow;
/**
 * Convierte null/undefined -> "" y números/fechas -> string.
 * NOTA: no hace deep para objetos anidados (no lo necesitas porque tus registros son planos).
 */
function sanitizeRecordForFlow(rec) {
    const out = {};
    for (const [k, v] of Object.entries(rec)) {
        if (v === null || v === undefined) {
            out[k] = "";
        }
        else if (v instanceof Date) {
            out[k] = v.toISOString().slice(0, 10); // YYYY-MM-DD
        }
        else if (typeof v === "number") {
            out[k] = String(v);
        }
        else {
            out[k] = v;
        }
    }
    return out;
}
function sanitizePayloadForFlow(payload) {
    return {
        tipo: payload.tipo,
        assets: payload.assets.map(sanitizeRecordForFlow),
    };
}
