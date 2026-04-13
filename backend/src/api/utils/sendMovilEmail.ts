import axios from "axios";


export interface SendMovilEmailParams {
  correo: string;
  nombreActivo: string;
  assetId: string;

  // Opción 1: enviar archivo
  nombreArchivo?: string;
  archivoBase64?: string;

  // Opción 2: enviar link de firma ✅
  linkFirma?: string;
}

export async function sendMovilEmail(params: SendMovilEmailParams) {
  if (!process.env.FLOW_URL2) {
    console.error("❌ FLOW_URL2 NO está definido");
    throw new Error("FLOW_URL2 no configurado en .env");
  }

  console.log("✅ Enviando a FLOW_URL2:", process.env.FLOW_URL2);

  await axios.post(process.env.FLOW_URL2, params, {
    headers: { "Content-Type": "application/json" },
    timeout: 20000,
  });
}
``