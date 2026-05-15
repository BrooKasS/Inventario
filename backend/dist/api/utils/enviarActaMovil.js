"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generarYEnviarActaMovil = generarYEnviarActaMovil;
const generarMovilDocx_1 = require("./generarMovilDocx");
const sendMovilEmail_1 = require("./sendMovilEmail");
async function generarYEnviarActaMovil({ correo, nombreActivo, assetId, datosWord, }) {
    // 1️⃣ Generar Word
    const buffer = await (0, generarMovilDocx_1.generarWordMovil)(datosWord);
    // 2️⃣ Convertir a Base64
    const archivoBase64 = buffer.toString("base64");
    // 3️⃣ Enviar correo
    await (0, sendMovilEmail_1.sendMovilEmail)({
        correo,
        nombreActivo,
        assetId,
        nombreArchivo: `Acta_Entrega_${nombreActivo}.docx`,
        archivoBase64,
    });
    // 4️⃣ Devolver buffer por si alguien lo necesita después
    return buffer;
}
