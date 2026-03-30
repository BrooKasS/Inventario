"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendToFlow = sendToFlow;
// utils/flow.ts
async function sendToFlow(payload) {
    const url = process.env.FLOW_URL;
    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        // evita que la petición quede colgada si hay bloqueo de archivo
        signal: AbortSignal.timeout(30000),
    });
    const text = await res.text().catch(() => "");
    if (!res.ok)
        throw new Error(`Flow error ${res.status}: ${text}`);
    return text || "ok";
}
