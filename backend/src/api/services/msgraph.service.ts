import axios from "axios";
import https from "https";

// La red corporativa intercepta TLS con un certificado autofirmado (mismo
// motivo por el que sendMovilEmail.ts ya desactiva la verificación TLS).
const httpsAgent = new https.Agent({ rejectUnauthorized: false });

export interface GraphMessage {
  id: string;
  subject: string;
  receivedDateTime: string;
  hasAttachments?: boolean;
  from?: { emailAddress?: { address?: string } };
}

export interface GraphAttachment {
  name: string;
  buffer: Buffer;
  sizeKB: number;
}

export interface SendMailAttachment {
  name: string;
  buffer: Buffer;
  contentType?: string;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} no configurado en .env`);
  return value;
}

function mailbox(): string {
  return process.env.MSGRAPH_MAILBOX || "fpmail@fiduprevisora.com.co";
}

let cachedToken: { token: string; expiresAt: number } | null = null;

// ─────────────────────────────────────────────────────────────────────────────
// GET con reintento automático ante 429 (Too Many Requests) — Graph devuelve
// el header Retry-After con los segundos exactos a esperar. Sin esto, correr
// varias descargas en paralelo (ver backupReports.service.ts) revienta con
// rangos de fecha largos en cuanto Graph empieza a limitar la tasa.
// ─────────────────────────────────────────────────────────────────────────────
async function graphGet(
  url: string,
  config: { headers: Record<string, string>; params?: Record<string, any> }
): Promise<any> {
  const MAX_REINTENTOS = 5;
  for (let intento = 0; ; intento++) {
    try {
      const res = await axios.get(url, { ...config, httpsAgent });
      return res.data;
    } catch (err: any) {
      const status = err?.response?.status;
      if (status !== 429 || intento >= MAX_REINTENTOS) throw err;

      const retryAfter = Number(err.response.headers?.["retry-after"]);
      const esperaSeg = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : 2 ** intento;
      await new Promise((resolve) => setTimeout(resolve, (esperaSeg + 0.5) * 1000));
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Autenticación (client credentials) — reemplaza el uso de MSAL de los scripts
// originales replicando el mismo POST OAuth2 que ya usaba enviar_reporte.py
// ─────────────────────────────────────────────────────────────────────────────
async function getGraphToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) {
    return cachedToken.token;
  }

  const tenantId = requireEnv("TENANT_ID");
  const clientId = requireEnv("CLIENT_ID");
  const clientSecret = requireEnv("CLIENT_SECRET");

  const url = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
    scope: "https://graph.microsoft.com/.default",
  });

  const { data } = await axios.post(url, body, { httpsAgent });
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in ?? 3000) * 1000,
  };
  return cachedToken.token;
}

// ─────────────────────────────────────────────────────────────────────────────
// Lista correos del remitente configurado dentro de un rango de fechas,
// siguiendo @odata.nextLink (paginación, igual que KPI/script/Descargar_KPI_Backup.pyw)
// ─────────────────────────────────────────────────────────────────────────────
async function listMessagesFromSender(
  remitente: string,
  fechaInicioISO: string,
  fechaFinISO: string
): Promise<GraphMessage[]> {
  const token = await getGraphToken();
  const headers = { Authorization: `Bearer ${token}` };

  let url: string | null = `https://graph.microsoft.com/v1.0/users/${mailbox()}/messages`;
  let params: Record<string, any> | undefined = {
    $filter: `receivedDateTime ge ${fechaInicioISO} and receivedDateTime le ${fechaFinISO}`,
    $orderby: "receivedDateTime desc",
    $top: 50,
    $select: "id,subject,receivedDateTime,from,hasAttachments",
  };

  const mensajes: GraphMessage[] = [];
  while (url) {
    const data = await graphGet(url, { headers, params });
    mensajes.push(...(data.value ?? []));
    url = data["@odata.nextLink"] ?? null;
    params = undefined; // nextLink ya trae la query completa
  }

  return mensajes.filter(
    (m) => (m.from?.emailAddress?.address || "").toLowerCase() === remitente.toLowerCase()
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Descarga adjuntos en memoria (sin escribir a disco) — evita el paso de
// limpieza (eliminar_archivos.py) que tenía el proyecto original
// ─────────────────────────────────────────────────────────────────────────────
async function downloadAttachments(messageId: string): Promise<GraphAttachment[]> {
  const token = await getGraphToken();
  const url = `https://graph.microsoft.com/v1.0/users/${mailbox()}/messages/${messageId}/attachments`;
  const data = await graphGet(url, { headers: { Authorization: `Bearer ${token}` } });

  const archivos: GraphAttachment[] = [];
  for (const adj of data.value ?? []) {
    if (!adj.contentBytes) continue;
    const buffer = Buffer.from(adj.contentBytes, "base64");
    archivos.push({
      name: adj.name || "sin_nombre",
      buffer,
      sizeKB: Math.round((buffer.length / 1024) * 10) / 10,
    });
  }
  return archivos;
}

// ─────────────────────────────────────────────────────────────────────────────
// Envío de correo con adjunto opcional
// ─────────────────────────────────────────────────────────────────────────────
async function sendMail(params: {
  to: string[];
  cc?: string[];
  subject: string;
  html: string;
  attachment?: SendMailAttachment;
}): Promise<void> {
  const token = await getGraphToken();
  const url = `https://graph.microsoft.com/v1.0/users/${mailbox()}/sendMail`;

  const message: any = {
    subject: params.subject,
    body: { contentType: "HTML", content: params.html },
    toRecipients: params.to
      .map((a) => a.trim())
      .filter(Boolean)
      .map((address) => ({ emailAddress: { address } })),
  };

  const cc = (params.cc ?? []).map((a) => a.trim()).filter(Boolean);
  if (cc.length) {
    message.ccRecipients = cc.map((address) => ({ emailAddress: { address } }));
  }

  if (params.attachment) {
    message.attachments = [
      {
        "@odata.type": "#microsoft.graph.fileAttachment",
        name: params.attachment.name,
        contentType:
          params.attachment.contentType ||
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        contentBytes: params.attachment.buffer.toString("base64"),
      },
    ];
  }

  await axios.post(
    url,
    { message, saveToSentItems: true },
    { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, httpsAgent }
  );
}

export const msgraphService = {
  getGraphToken,
  listMessagesFromSender,
  downloadAttachments,
  sendMail,
};
