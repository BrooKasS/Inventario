"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMovilEmail = sendMovilEmail;
const axios_1 = __importDefault(require("axios"));
async function sendMovilEmail(params) {
    if (!process.env.FLOW_URL2) {
        console.error("❌ FLOW_URL2 NO está definido");
        throw new Error("FLOW_URL2 no configurado en .env");
    }
    console.log("✅ Enviando a FLOW_URL2:", process.env.FLOW_URL2);
    await axios_1.default.post(process.env.FLOW_URL2, params, {
        headers: { "Content-Type": "application/json" },
        timeout: 20000,
    });
}
``;
