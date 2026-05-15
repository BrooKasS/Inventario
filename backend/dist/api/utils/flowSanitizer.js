"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeRecordForFlow = sanitizeRecordForFlow;
exports.sanitizePayloadForFlow = sanitizePayloadForFlow;
/**
 * Convierte null/undefined -> ""
 * Convierte Date -> YYYY-MM-DD
 * Convierte number -> string
 * ✅ PRESERVA boolean (especialmente Eliminado)
 */
function sanitizeRecordForFlow(rec) {
    const out = {};
    for (const [k, v] of Object.entries(rec)) {
        // ✅ PRESERVAR Eliminado COMO BOOLEAN
        if (k === "Eliminado") {
            out[k] = v === true;
            continue;
        }
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
