// utils/flow.ts
function deHtmlEntities(s: string) {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

export async function sendToFlow(payload: unknown) {
  const raw = process.env.FLOW_URL || "";
  if (!raw) throw new Error("FLOW_URL no configurada");

  // Log de control
  console.log("[sendToFlow] RAW .env URL:", raw);

  // 1) Normaliza entidades HTML (obligatorio si copiaste desde el portal)
  let url = deHtmlEntities(raw).trim();

  // 2) Verifica parseo + llaves de query
  try {
    const u = new URL(url);
    const keys = Array.from(u.searchParams.keys()).sort();
    console.log("[sendToFlow] AFTER deHtml, Query keys:", keys); // Debe: ['api-version','sig','sp','sv']
  } catch (e) {
    console.warn("[sendToFlow] URL no parseable tras deHtml; revisa FLOW_URL en .env", e);
  }

  // 3) Asegura que en el log se vea '&' y no '&amp;'
  console.log("[sendToFlow] URL efectiva:", url.replace(/sig=[^&]+/, "sig=***"));

  // --- reintentos abreviados por brevedad (lo que ya tenías) ---
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(9000000),
  });
  const text = await res.text().catch(() => "");
  if (!res.ok) throw new Error(`Flow error ${res.status}: ${text}`);
  return text || "ok";
}
``