import { msgraphService } from "../services/msgraph.service";
import { Asset } from "../../entities/Asset";

// Notifica alta/baja de servidores. Destinatarios propios (SERVIDORES_ALERTAS_TO),
// distintos de los de certificados: nunca debe romper el alta/baja si el
// correo falla, por eso atrapa sus propios errores y no lanza.
export async function sendServidorAlerta(
  evento: "creado" | "deshabilitado",
  asset: Pick<Asset, "id" | "nombre" | "codigoServicio" | "ubicacion" | "propietario" | "custodio">,
  extra?: { autor?: string; motivo?: string }
): Promise<void> {
  const destinatarios = (process.env.SERVIDORES_ALERTAS_TO ?? "")
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);

  if (destinatarios.length === 0) {
    console.warn("⚠️  [SERVIDOR-ALERTA] SERVIDORES_ALERTAS_TO no configurado en .env, no se envía notificación.");
    return;
  }

  const esAlta = evento === "creado";
  const titulo = esAlta ? "🆕 Nuevo servidor registrado" : "🔴 Servidor deshabilitado";
  const color = esAlta ? "#16A34A" : "#DC2626";

  const filas = [
    ["Nombre", asset.nombre ?? "—"],
    ["Código de servicio", asset.codigoServicio ?? "—"],
    ["Ubicación", asset.ubicacion ?? "—"],
    ["Propietario", asset.propietario ?? "—"],
    ["Custodio", asset.custodio ?? "—"],
    ...(extra?.autor ? [[esAlta ? "Creado por" : "Deshabilitado por", extra.autor]] : []),
    ...(extra?.motivo ? [["Motivo", extra.motivo]] : []),
  ]
    .map(
      ([label, value]) => `
      <tr>
        <td style="padding:6px 12px;border:1px solid #e5e7eb;font-weight:700;">${label}</td>
        <td style="padding:6px 12px;border:1px solid #e5e7eb;">${value}</td>
      </tr>`
    )
    .join("");

  const html = `
    <div style="font-family:Arial,sans-serif;">
      <h2 style="color:${color};">${titulo}</h2>
      <table style="border-collapse:collapse;font-size:13px;">
        <tbody>${filas}</tbody>
      </table>
      <p style="margin-top:24px;color:#64748B;font-size:12px;">Notificación automática — Inventario Fiduprevisora.</p>
    </div>`;

  try {
    await msgraphService.sendMail({
      to: destinatarios,
      subject: `${titulo} — ${asset.nombre ?? "sin nombre"}`,
      html,
    });
  } catch (error: any) {
    console.error(`❌ [SERVIDOR-ALERTA] Error enviando notificación de ${evento}:`, error.message);
  }
}
