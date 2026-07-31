import fs from "fs/promises";
import path from "path";
import { AppDataSource } from "../../config/database";
import { Asset } from "../../entities/Asset";
import { msgraphService } from "./msgraph.service";

// Revisa certificados SSL próximos a vencer y avisa por correo cuando
// cruzan 90/60/30 días restantes (3/2/1 "meses", mismo criterio de
// 30 días por mes que ya usa el badge de días restantes en la web).
// El estado de qué umbral ya se notificó por certificado se guarda en un
// archivo (no en la BD): la tabla corre con synchronize=false en
// producción y agregar columnas nuevas ahí implicaría una migración manual.

const ESTADO_PATH = path.join(process.cwd(), "storage", "cert-alertas", "estado.json");

type Umbral = 90 | 60 | 30;
const UMBRALES: Umbral[] = [90, 60, 30];

interface EstadoCert {
  n90?: boolean;
  n60?: boolean;
  n30?: boolean;
}
type Estado = Record<string, EstadoCert>;

function claveUmbral(u: Umbral): keyof EstadoCert {
  return `n${u}` as keyof EstadoCert;
}

async function leerEstado(): Promise<Estado> {
  try {
    const raw = await fs.readFile(ESTADO_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function guardarEstado(estado: Estado): Promise<void> {
  await fs.mkdir(path.dirname(ESTADO_PATH), { recursive: true });
  await fs.writeFile(ESTADO_PATH, JSON.stringify(estado, null, 2), "utf-8");
}

function diasRestantes(fechaFin: Date): number {
  const fin = new Date(fechaFin);
  fin.setHours(23, 59, 59, 999);
  return Math.ceil((fin.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

interface CertVencer {
  nombre: string;
  tipo: string;
  proveedor: string;
  dominio: string;
  fechaFin: Date;
  dias: number;
}

const SECCIONES: { u: Umbral; titulo: string; color: string }[] = [
  { u: 90, titulo: "🟡 A 3 meses de vencer (≤ 90 días)", color: "#D97706" },
  { u: 60, titulo: "🟠 A 2 meses de vencer (≤ 60 días)", color: "#EA580C" },
  { u: 30, titulo: "🔴 A 1 mes de vencer (≤ 30 días)", color: "#DC2626" },
];

function buildEmailHtml(porUmbral: Record<Umbral, CertVencer[]>): string {
  const tablas = SECCIONES.filter((s) => porUmbral[s.u].length > 0)
    .map((s) => {
      const filas = porUmbral[s.u]
        .map(
          (c) => `
        <tr>
          <td style="padding:8px 12px;border:1px solid #e5e7eb;">${c.nombre}</td>
          <td style="padding:8px 12px;border:1px solid #e5e7eb;">${c.dominio}</td>
          <td style="padding:8px 12px;border:1px solid #e5e7eb;">${c.tipo}</td>
          <td style="padding:8px 12px;border:1px solid #e5e7eb;">${c.proveedor}</td>
          <td style="padding:8px 12px;border:1px solid #e5e7eb;">${new Date(c.fechaFin).toLocaleDateString("es-CO")}</td>
          <td style="padding:8px 12px;border:1px solid #e5e7eb;font-weight:700;">${c.dias} días</td>
        </tr>`
        )
        .join("");

      return `
      <h3 style="color:${s.color};margin:20px 0 8px;">${s.titulo}</h3>
      <table style="border-collapse:collapse;width:100%;font-family:Arial,sans-serif;font-size:13px;">
        <thead>
          <tr style="background:${s.color};color:#fff;">
            <th style="padding:8px 12px;text-align:left;">Nombre</th>
            <th style="padding:8px 12px;text-align:left;">Dominio/App</th>
            <th style="padding:8px 12px;text-align:left;">Tipo</th>
            <th style="padding:8px 12px;text-align:left;">Proveedor</th>
            <th style="padding:8px 12px;text-align:left;">Vence</th>
            <th style="padding:8px 12px;text-align:left;">Días restantes</th>
          </tr>
        </thead>
        <tbody>${filas}</tbody>
      </table>`;
    })
    .join("");

  return `
    <div style="font-family:Arial,sans-serif;">
      <h2 style="color:#1E3A8A;">Certificados SSL próximos a vencer</h2>
      <p>Los siguientes certificados cruzaron hoy un nuevo umbral de vencimiento:</p>
      ${tablas}
      <p style="margin-top:24px;color:#64748B;font-size:12px;">Notificación automática — Inventario Fiduprevisora.</p>
    </div>`;
}

async function checkAndNotify(): Promise<void> {
  const destinatarios = (process.env.CERT_ALERTAS_TO ?? "")
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);

  if (destinatarios.length === 0) {
    console.warn("⚠️  [CERT-ALERTAS] CERT_ALERTAS_TO no configurado en .env, se omite la revisión.");
    return;
  }

  const assetRepo = AppDataSource.getRepository(Asset);
  const certs = await assetRepo
    .createQueryBuilder("asset")
    .leftJoinAndSelect("asset.certificadoSsl", "certificadoSsl")
    .where("asset.tipo = :tipo", { tipo: "CERTIFICADO_SSL" })
    .andWhere("asset.deletedAt IS NULL")
    .andWhere("certificadoSsl.fechaFin IS NOT NULL")
    .getMany();

  const estado = await leerEstado();
  const porUmbral: Record<Umbral, CertVencer[]> = { 90: [], 60: [], 30: [] };
  let huboNuevo = false;

  for (const asset of certs) {
    const c = asset.certificadoSsl;
    if (!c || !c.fechaFin) continue;
    const dias = diasRestantes(c.fechaFin);

    const certEstado: EstadoCert = estado[asset.id] ?? {};
    for (const u of UMBRALES) {
      const key = claveUmbral(u);
      if (!certEstado[key] && dias <= u) {
        porUmbral[u].push({
          nombre: asset.nombre ?? "—",
          tipo: c.tipoCertificado ?? "—",
          proveedor: c.proveedor ?? "—",
          dominio: c.nombreDominio ?? c.nombreAplicacion ?? "—",
          fechaFin: c.fechaFin,
          dias,
        });
        certEstado[key] = true;
        huboNuevo = true;
      }
    }
    estado[asset.id] = certEstado;
  }

  if (!huboNuevo) {
    console.log("ℹ️  [CERT-ALERTAS] Sin certificados que crucen un nuevo umbral hoy.");
    return;
  }

  await msgraphService.sendMail({
    to: destinatarios,
    subject: `🔐 Certificados SSL por vencer — ${new Date().toLocaleDateString("es-CO")}`,
    html: buildEmailHtml(porUmbral),
  });

  await guardarEstado(estado);
  console.log(
    `✅ [CERT-ALERTAS] Notificación enviada — 90d: ${porUmbral[90].length}, 60d: ${porUmbral[60].length}, 30d: ${porUmbral[30].length}`
  );
}

export const certAlertasService = { checkAndNotify };
