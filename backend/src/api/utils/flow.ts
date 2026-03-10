// utils/flow.ts
export async function sendToFlow(payload: unknown) {
  const url = process.env.FLOW_URL!;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    // evita que la petición quede colgada si hay bloqueo de archivo
    signal: AbortSignal.timeout(30_000),
  });
  const text = await res.text().catch(() => "");
  if (!res.ok) throw new Error(`Flow error ${res.status}: ${text}`);
  return text || "ok";
}
