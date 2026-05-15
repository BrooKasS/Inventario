"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendToFlowRaw = sendToFlowRaw;
exports.sendToFlowFirmada = sendToFlowFirmada;
const axios_1 = __importDefault(require("axios"));
function normalizeFlowUrl(envVar) {
    if (!envVar) {
        throw new Error("URL de Flow no está configurada");
    }
    const normalized = envVar
        .trim()
        .replace(/&amp;amp;/gi, "&")
        .replace(/&amp;/gi, "&");
    console.log("🔎 Flow URL ORIGINAL   :", envVar);
    console.log("✅ Flow URL NORMALIZADA:", normalized);
    return normalized;
}
async function sendToFlowRaw(payload) {
    const url = normalizeFlowUrl(process.env.FLOW_URL2);
    console.log("✅ Enviando a FLOW_URL2:", url);
    const res = await axios_1.default.post(url, payload, {
        headers: { "Content-Type": "application/json" },
        maxBodyLength: Infinity,
    });
    return res.data;
}
async function sendToFlowFirmada(payload) {
    const url = normalizeFlowUrl(process.env.FLOW_URL_FIRMADA);
    console.log("✅ Enviando a FLOW_URL_FIRMADA:", url);
    const res = await axios_1.default.post(url, payload, {
        headers: { "Content-Type": "application/json" },
        maxBodyLength: Infinity,
    });
    return res.data;
}
