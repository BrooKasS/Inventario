import axios from "axios";

function normalizeFlowUrl(envVar?: string): string {
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

export async function sendToFlowRaw(payload: any) {
  const url = normalizeFlowUrl(process.env.FLOW_URL2);

  console.log("✅ Enviando a FLOW_URL2:", url);

  const res = await axios.post(url, payload, {
    headers: { "Content-Type": "application/json" },
    maxBodyLength: Infinity,
  });

  return res.data;
}

export async function sendToFlowDevolucion(data: any) {
  await fetch(process.env.FLOW_URL_DEVOLUCION!, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
}


export async function sendToFlowFirmarDevolucion(data: any) {
  await fetch(process.env.FLOW_URL_FIRMAR_DEVOLUCION!, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
}

export async function sendToFlowArchivoDevolucion(payload: any) {
  const url = normalizeFlowUrl(process.env.FLOW_URL_ARCHIVO_DEVOLUCION);

  console.log("✅ Enviando a FLOW_URL_ARCHIVO_DEVOLUCION:", url);

  const res = await axios.post(url, payload, {
    headers: { "Content-Type": "application/json" },
    maxBodyLength: Infinity,
  });

  return res.data;
}
``

export async function sendToFlowFirmada(payload: any) {
  const url = normalizeFlowUrl(process.env.FLOW_URL_FIRMADA);

  console.log("✅ Enviando a FLOW_URL_FIRMADA:", url);

  const res = await axios.post(url, payload, {
    headers: { "Content-Type": "application/json" },
    maxBodyLength: Infinity,
  });


  return res.data;
}