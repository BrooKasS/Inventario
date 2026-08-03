import { msgraphService } from "../services/msgraph.service";
import { Asset } from "../../entities/Asset";

// Notifica alta/baja de un activo (servidor, base de datos, UPS, red, VPN o
// certificado SSL). Nunca debe romper el alta/baja si el correo falla, por
// eso atrapa sus propios errores y no lanza.
//
// El HTML usa tablas y estilos inline a propósito (no flexbox/grid/box-shadow)
// para que se vea bien también en Outlook de escritorio, que ignora la mayoría
// del CSS moderno.

export type TipoAlerta = "SERVIDOR" | "BASE_DATOS" | "UPS" | "RED" | "VPN" | "CERTIFICADO_SSL";
export type Fila = [string, string];

interface TipoConfig {
  nombre: string;
  genero: "M" | "F";
  icono: string;
  destinatariosEnv: string;
}

const TIPOS: Record<TipoAlerta, TipoConfig> = {
  SERVIDOR:        { nombre: "Servidor",        genero: "M", icono: "🖥️", destinatariosEnv: "SERVIDORES_ALERTAS_TO" },
  BASE_DATOS:      { nombre: "Base de Datos",   genero: "F", icono: "🗄️", destinatariosEnv: "SERVIDORES_ALERTAS_TO" },
  UPS:             { nombre: "UPS",             genero: "M", icono: "🔋", destinatariosEnv: "SERVIDORES_ALERTAS_TO" },
  RED:             { nombre: "Red",             genero: "F", icono: "🌐", destinatariosEnv: "SERVIDORES_ALERTAS_TO" },
  VPN:             { nombre: "VPN",             genero: "F", icono: "🔒", destinatariosEnv: "SERVIDORES_ALERTAS_TO" },
  CERTIFICADO_SSL: { nombre: "Certificado SSL", genero: "M", icono: "🔐", destinatariosEnv: "CERT_ALERTAS_TO" },
};

// Formatea una fecha como dd/mm/aaaa (es-CO) o "—" si es nula/indefinida.
export function filaFecha(fecha: Date | string | null | undefined): string {
  return fecha ? new Date(fecha).toLocaleDateString("es-CO") : "—";
}

function esc(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function sendAssetAlerta(
  evento: "creado" | "deshabilitado",
  tipo: TipoAlerta,
  asset: Pick<Asset, "nombre">,
  filas: Fila[],
  extra?: { autor?: string; motivo?: string }
): Promise<void> {
  const config = TIPOS[tipo];
  const destinatarios = (process.env[config.destinatariosEnv] ?? "")
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);

  if (destinatarios.length === 0) {
    console.warn(
      `⚠️  [ASSET-ALERTA] ${config.destinatariosEnv} no configurado en .env, no se envía notificación (${tipo}/${evento}).`
    );
    return;
  }

  const esAlta = evento === "creado";
  const g = config.genero === "F" ? "a" : "o";
  const tituloEvento = esAlta ? `Nuev${g} ${config.nombre} registrad${g}` : `${config.nombre} deshabilitad${g}`;
  const color = esAlta ? "#16A34A" : "#DC2626";
  const iconoEvento = esAlta ? "🆕" : "🔴";
  const nombreAsset = asset.nombre ?? "—";

  const filasCompletas: Fila[] = [
    ...filas,
    ...(extra?.autor ? ([[esAlta ? "Creado por" : "Deshabilitado por", extra.autor]] as Fila[]) : []),
    ...(extra?.motivo ? ([["Motivo", extra.motivo]] as Fila[]) : []),
  ];

  const filasHtml = filasCompletas
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #F1F5F9;color:#64748B;font-size:13px;width:38%;vertical-align:top;">${esc(label)}</td>
          <td style="padding:10px 0;border-bottom:1px solid #F1F5F9;color:#0F172A;font-size:13px;font-weight:600;vertical-align:top;">${esc(value)}</td>
        </tr>`
    )
    .join("");

  const fechaHoy = new Date().toLocaleDateString("es-CO", { day: "2-digit", month: "long", year: "numeric" });

  const html = `
  <div style="background-color:#F1F5F9;padding:32px 16px;font-family:'Segoe UI',Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:#ffffff;border:1px solid #E2E8F0;border-radius:10px;">
            <tr>
              <td style="background-color:${color};padding:22px 28px;border-radius:10px 10px 0 0;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="font-size:28px;padding-right:14px;">${iconoEvento}</td>
                    <td>
                      <div style="color:#ffffff;font-size:17px;font-weight:700;line-height:1.3;">${esc(tituloEvento)}</div>
                      <div style="color:rgba(255,255,255,0.85);font-size:12px;margin-top:3px;">${config.icono} ${esc(config.nombre)} · ${fechaHoy}</div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:26px 28px 6px;">
                <div style="color:#94A3B8;font-size:11px;text-transform:uppercase;letter-spacing:.06em;font-weight:700;">Nombre del activo</div>
                <div style="color:#0F172A;font-size:21px;font-weight:700;margin-top:4px;">${esc(nombreAsset)}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:14px 28px 28px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
                  ${filasHtml}
                </table>
              </td>
            </tr>
            <tr>
              <td style="background-color:#F8FAFC;padding:14px 28px;border-top:1px solid #E2E8F0;border-radius:0 0 10px 10px;">
                <div style="color:#94A3B8;font-size:11px;">Notificación automática — Inventario Fiduprevisora</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>`;

  try {
    await msgraphService.sendMail({
      to: destinatarios,
      subject: `${iconoEvento} ${tituloEvento} — ${nombreAsset}`,
      html,
    });
  } catch (error: any) {
    console.error(
      `❌ [ASSET-ALERTA] Error enviando notificación de ${tipo}/${evento}:`,
      error.response?.data ?? error.message
    );
  }
}
