import { msgraphService } from "../services/msgraph.service";
import { Asset } from "../../entities/Asset";

// Notifica alta/baja/restauracion de un activo (servidor, base de datos,
// UPS, red, VPN o certificado SSL). Nunca debe romper la operacion si el
// correo falla, por eso atrapa sus propios errores y no lanza.
//
// El HTML usa tablas y estilos inline a propósito (no flexbox/grid/box-shadow)
// para que se vea bien también en Outlook de escritorio, que ignora la mayoría
// del CSS moderno.

export type Evento = "creado" | "deshabilitado" | "restaurado";
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

interface EventoConfig {
  color: string;
  icono: string;
  autorLabel: string;
  titulo: (nombreTipo: string, g: string) => string;
}

const EVENTOS: Record<Evento, EventoConfig> = {
  creado: {
    color: "#16A34A",
    icono: "🆕",
    autorLabel: "Creado por",
    titulo: (nombre, g) => `Nuev${g} ${nombre} registrad${g}`,
  },
  deshabilitado: {
    color: "#DC2626",
    icono: "🔴",
    autorLabel: "Deshabilitado por",
    titulo: (nombre, g) => `${nombre} deshabilitad${g}`,
  },
  restaurado: {
    color: "#2563EB",
    icono: "♻️",
    autorLabel: "Restaurado por",
    titulo: (nombre, g) => `${nombre} restaurad${g}`,
  },
};

// Formatea una fecha como dd/mm/aaaa (es-CO) o "—" si es nula/indefinida.
export function filaFecha(fecha: Date | string | null | undefined): string {
  return fecha ? new Date(fecha).toLocaleDateString("es-CO") : "—";
}

function esc(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Dado un Asset con sus relaciones cargadas, arma las filas de detalle
// segun su tipo. Devuelve null si el tipo no tiene alerta o falta la
// relacion (dato inconsistente) — el llamador simplemente no envia nada.
export function filasDeAsset(asset: Asset): { tipo: TipoAlerta; filas: Fila[] } | null {
  switch (asset.tipo) {
    case "SERVIDOR":
      if (!asset.servidor) return null;
      return {
        tipo: "SERVIDOR",
        filas: [
          ["Código de servicio", asset.codigoServicio ?? "—"],
          ["Ambiente", asset.servidor.ambiente ?? "—"],
          ["Sistema operativo", asset.servidor.sistemaOperativo ?? "—"],
          ["IP interna", asset.servidor.ipInterna ?? "—"],
          ["Propietario", asset.propietario ?? "—"],
          ["Custodio", asset.custodio ?? "—"],
        ],
      };
    case "BASE_DATOS":
      if (!asset.baseDatos) return null;
      return {
        tipo: "BASE_DATOS",
        filas: [
          ["Código de servicio", asset.codigoServicio ?? "—"],
          ["Ambiente", asset.baseDatos.ambiente ?? "—"],
          ["Versión BD", asset.baseDatos.versionBd ?? "—"],
          ["Servidor 1", asset.baseDatos.servidor1 ?? "—"],
          ["Propietario", asset.propietario ?? "—"],
          ["Custodio", asset.custodio ?? "—"],
        ],
      };
    case "UPS":
      if (!asset.ups) return null;
      return {
        tipo: "UPS",
        filas: [
          ["Código de servicio", asset.codigoServicio ?? "—"],
          ["Modelo", asset.ups.modelo ?? "—"],
          ["Serial", asset.ups.serial ?? "—"],
          ["Estado", asset.ups.estado ?? "—"],
          ["Ubicación", asset.ubicacion ?? "—"],
          ["Custodio", asset.custodio ?? "—"],
        ],
      };
    case "RED":
      if (!asset.red) return null;
      return {
        tipo: "RED",
        filas: [
          ["Código de servicio", asset.codigoServicio ?? "—"],
          ["Modelo", asset.red.modelo ?? "—"],
          ["IP de gestión", asset.red.ipGestion ?? "—"],
          ["Estado", asset.red.estado ?? "—"],
          ["Propietario", asset.propietario ?? "—"],
          ["Custodio", asset.custodio ?? "—"],
        ],
      };
    case "VPN":
      if (!asset.vpn) return null;
      return {
        tipo: "VPN",
        filas: [
          ["Código de servicio", asset.codigoServicio ?? "—"],
          ["Conexión", asset.vpn.conexion ?? "—"],
          ["Origen", asset.vpn.origen ?? "—"],
          ["Destino", asset.vpn.destino ?? "—"],
          ["Propietario", asset.propietario ?? "—"],
          ["Custodio", asset.custodio ?? "—"],
        ],
      };
    case "CERTIFICADO_SSL":
      if (!asset.certificadoSsl) return null;
      return {
        tipo: "CERTIFICADO_SSL",
        filas: [
          ["Tipo", asset.certificadoSsl.tipoCertificado ?? "—"],
          ["Dominio/Aplicación", asset.certificadoSsl.nombreDominio ?? asset.certificadoSsl.nombreAplicacion ?? "—"],
          ["Proveedor", asset.certificadoSsl.proveedor ?? "—"],
          ["Vence", filaFecha(asset.certificadoSsl.fechaFin)],
        ],
      };
    default:
      return null;
  }
}

export async function sendAssetAlerta(
  evento: Evento,
  tipo: TipoAlerta,
  asset: Pick<Asset, "nombre">,
  filas: Fila[],
  extra?: { autor?: string; motivo?: string }
): Promise<void> {
  const config = TIPOS[tipo];
  const eventoConfig = EVENTOS[evento];
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

  const g = config.genero === "F" ? "a" : "o";
  const tituloEvento = eventoConfig.titulo(config.nombre, g);
  const nombreAsset = asset.nombre ?? "—";

  const filasCompletas: Fila[] = [
    ...filas,
    ...(extra?.autor ? ([[eventoConfig.autorLabel, extra.autor]] as Fila[]) : []),
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
              <td style="background-color:${eventoConfig.color};padding:22px 28px;border-radius:10px 10px 0 0;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="font-size:28px;padding-right:14px;">${eventoConfig.icono}</td>
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
      subject: `${eventoConfig.icono} ${tituloEvento} — ${nombreAsset}`,
      html,
    });
  } catch (error: any) {
    console.error(
      `❌ [ASSET-ALERTA] Error enviando notificación de ${tipo}/${evento}:`,
      error.response?.data ?? error.message
    );
  }
}

// Envuelve filasDeAsset + sendAssetAlerta: dado un Asset ya cargado con sus
// relaciones, arma las filas segun su tipo y envia. No hace nada si el tipo
// no tiene alerta configurada o falta la relacion.
export async function notificarAsset(
  evento: Evento,
  asset: Asset,
  extra?: { autor?: string; motivo?: string }
): Promise<void> {
  const info = filasDeAsset(asset);
  if (!info) return;
  await sendAssetAlerta(evento, info.tipo, asset, info.filas, extra);
}
