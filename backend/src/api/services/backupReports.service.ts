import fs from "fs/promises";
import path from "path";
import { msgraphService } from "./msgraph.service";
import { buildSimpleBackupReport, SimpleReportSummary } from "../utils/backupReports/parseVeeamSimple";
import { buildKpiBackupReport, KpiReportSummary } from "../utils/backupReports/parseVeeamKpi";

export type BackupTipo = "diario" | "semanal" | "mensual" | "kpi";

export interface RunMeta {
  runId: string;
  tipo: BackupTipo;
  trigger: "manual" | "cron";
  fechaInicio: string;
  fechaFin: string;
  creadoEn: string;
  correosEncontrados: number;
  archivosProcesados: number;
  resumen: SimpleReportSummary | KpiReportSummary | null;
  enviado: boolean;
  enviadoEn?: string;
  enviadoA?: { to: string[]; cc?: string[] };
}

const STORAGE_ROOT = path.join(process.cwd(), "storage", "backups");
const TIPOS: BackupTipo[] = ["diario", "semanal", "mensual", "kpi"];

function assertTipo(tipo: string): asserts tipo is BackupTipo {
  if (!TIPOS.includes(tipo as BackupTipo)) {
    throw new Error(`Tipo de informe de backup inválido: ${tipo}`);
  }
}

function startOfDayUTC(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0));
}
function endOfDayUTC(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59));
}

/** Replica los rangos por defecto que calculaba cada script Python original. */
function defaultRangeForTipo(tipo: BackupTipo): { desde: Date; hasta: Date } {
  const now = new Date();

  if (tipo === "diario") {
    return { desde: startOfDayUTC(now), hasta: endOfDayUTC(now) };
  }

  if (tipo === "semanal") {
    // dias_desde_sabado = (weekday_python + 2) % 7 ; weekday_python: Mon=0..Sun=6
    const pyWeekday = (now.getUTCDay() + 6) % 7;
    const diasDesdeSabado = (pyWeekday + 2) % 7;
    const desde = new Date(now);
    desde.setUTCDate(now.getUTCDate() - diasDesdeSabado);
    return { desde: startOfDayUTC(desde), hasta: endOfDayUTC(now) };
  }

  if (tipo === "mensual") {
    const desde = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    return { desde, hasta: endOfDayUTC(now) };
  }

  // kpi: por defecto, mes anterior completo (igual que el arranque de la app de escritorio)
  const firstOfThisMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const lastOfPrevMonth = new Date(firstOfThisMonth.getTime() - 1);
  const firstOfPrevMonth = new Date(Date.UTC(lastOfPrevMonth.getUTCFullYear(), lastOfPrevMonth.getUTCMonth(), 1));
  return { desde: firstOfPrevMonth, hasta: endOfDayUTC(lastOfPrevMonth) };
}

function runDir(tipo: BackupTipo, runId: string): string {
  return path.join(STORAGE_ROOT, tipo, runId);
}

function newRunId(): string {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

async function readRunMeta(tipo: BackupTipo, runId: string): Promise<RunMeta> {
  const raw = await fs.readFile(path.join(runDir(tipo, runId), "resumen.json"), "utf-8");
  return JSON.parse(raw);
}

async function writeRunMeta(meta: RunMeta): Promise<void> {
  await fs.writeFile(
    path.join(runDir(meta.tipo, meta.runId), "resumen.json"),
    JSON.stringify(meta, null, 2),
    "utf-8"
  );
}

async function listRuns(tipo: string): Promise<RunMeta[]> {
  assertTipo(tipo);
  const dir = path.join(STORAGE_ROOT, tipo);
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const runs = await Promise.all(
      entries
        .filter((e) => e.isDirectory())
        .map((e) => readRunMeta(tipo, e.name).catch(() => null))
    );
    return runs
      .filter((r): r is RunMeta => r !== null)
      .sort((a, b) => b.creadoEn.localeCompare(a.creadoEn));
  } catch (err: any) {
    if (err.code === "ENOENT") return [];
    throw err;
  }
}

async function getRun(tipo: string, runId: string): Promise<RunMeta> {
  assertTipo(tipo);
  return readRunMeta(tipo, runId);
}

async function getRunExcelBuffer(tipo: string, runId: string): Promise<Buffer> {
  assertTipo(tipo);
  return fs.readFile(path.join(runDir(tipo, runId), "informe.xlsx"));
}

async function deleteRun(tipo: string, runId: string): Promise<void> {
  assertTipo(tipo);
  await fs.rm(runDir(tipo, runId), { recursive: true, force: true });
}

async function createRun(
  tipo: string,
  params: { fechaInicio?: string; fechaFin?: string; trigger?: "manual" | "cron" } = {}
): Promise<RunMeta> {
  assertTipo(tipo);

  const remitente = process.env.BACKUP_REMITENTE || "gti@fiduprevisora.com.co";
  const range = params.fechaInicio && params.fechaFin
    ? { desde: new Date(params.fechaInicio), hasta: new Date(params.fechaFin) }
    : defaultRangeForTipo(tipo);

  const mensajes = await msgraphService.listMessagesFromSender(
    remitente,
    range.desde.toISOString(),
    range.hasta.toISOString()
  );

  // Descarga adjuntos en lotes concurrentes en vez de uno por uno — con
  // rangos largos (muchos correos) la versión secuencial tardaba lo
  // suficiente para que el proxy devolviera 502/504 antes de terminar.
  const CONCURRENCIA_DESCARGA = 8;
  const conAdjuntos = mensajes.filter((m) => m.hasAttachments);
  const files: { filename: string; html: string }[] = [];
  for (let i = 0; i < conAdjuntos.length; i += CONCURRENCIA_DESCARGA) {
    const lote = conAdjuntos.slice(i, i + CONCURRENCIA_DESCARGA);
    const resultados = await Promise.all(lote.map((m) => msgraphService.downloadAttachments(m.id)));
    for (const adjuntos of resultados) {
      for (const adj of adjuntos) {
        if (adj.name.toLowerCase().endsWith(".html")) {
          files.push({ filename: adj.name, html: adj.buffer.toString("utf-8") });
        }
      }
    }
  }

  const runId = newRunId();
  const dir = runDir(tipo, runId);
  await fs.mkdir(dir, { recursive: true });

  // Guarda el HTML crudo de cada adjunto — útil para depurar el parseo sin
  // depender de volver a descargar el correo (los adjuntos solo viven en
  // memoria durante el procesamiento).
  if (files.length > 0) {
    const rawDir = path.join(dir, "raw");
    await fs.mkdir(rawDir, { recursive: true });
    await Promise.all(
      files.map((f, i) => fs.writeFile(path.join(rawDir, `${i}_${f.filename}`), f.html, "utf-8"))
    );
  }

  const { workbook, summary } =
    tipo === "kpi" ? await buildKpiBackupReport(files) : await buildSimpleBackupReport(files);

  const excelBuffer = await workbook.xlsx.writeBuffer();
  await fs.writeFile(path.join(dir, "informe.xlsx"), Buffer.from(excelBuffer));

  const meta: RunMeta = {
    runId,
    tipo,
    trigger: params.trigger ?? "manual",
    fechaInicio: range.desde.toISOString(),
    fechaFin: range.hasta.toISOString(),
    creadoEn: new Date().toISOString(),
    correosEncontrados: mensajes.length,
    archivosProcesados: files.length,
    resumen: summary,
    enviado: false,
  };
  await writeRunMeta(meta);

  return meta;
}

function formatFechaLarga(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("es-CO", { day: "2-digit", month: "long", year: "numeric", timeZone: "America/Bogota" });
}

/** Réplica de las plantillas HTML de enviar_reporte.py (diario/semanal/mensual). */
function buildSimpleEmailHtml(tipo: BackupTipo, s: SimpleReportSummary, meta: RunMeta): string {
  const rangoTexto =
    tipo === "diario"
      ? `Informe General de Backup - ${formatFechaLarga(meta.fechaFin)}`
      : `Informe General de Backup - del ${formatFechaLarga(meta.fechaInicio)} al ${formatFechaLarga(meta.fechaFin)}`;

  const saludo =
    tipo === "diario"
      ? "Buenos días, Ingenieros Luis Rico y John Fredy Calderon:"
      : "Buenos días, Ingenieros Luis Rico y Diego Pardo:";

  const firma = tipo === "diario" ? "" : "<br>Diego Fernando Pardo Romero";

  return `
<h3>${rangoTexto}</h3>
<p>${saludo}</p>
<p>Adjunto el informe de las tareas de backup ejecutadas.</p>

<h4>Resumen de Backups Full a Servidores:</h4>
<table style="border-collapse: collapse; width: 100%; max-width: 600px;">
    <tr><th style="border: 1px solid black; padding: 5px; text-align: left;">Descripción</th>
        <th style="border: 1px solid black; padding: 5px; text-align: left;">Valor</th></tr>
    <tr><td style="border: 1px solid black; padding: 5px;">Número de Tareas de Backup Programadas Ejecutadas</td>
        <td style="border: 1px solid black; padding: 5px;">${s.tareasProgramadasEjecutadas}</td></tr>
    <tr><td style="border: 1px solid black; padding: 5px;">Número de Tareas de Backup Programadas Completadas</td>
        <td style="border: 1px solid black; padding: 5px;">${s.tareasProgramadasCompletadas}</td></tr>
</table>

<h4>Resumen de Backups al File System Servidores:</h4>
<table style="border-collapse: collapse; width: 100%; max-width: 600px;">
    <tr><th style="border: 1px solid black; padding: 5px; text-align: left;">Descripción</th>
        <th style="border: 1px solid black; padding: 5px; text-align: left;">Valor</th></tr>
    <tr><td style="border: 1px solid black; padding: 5px;">Total Jobs (All)</td>
        <td style="border: 1px solid black; padding: 5px;">${s.totalJobs}</td></tr>
    <tr><td style="border: 1px solid black; padding: 5px;">Completed (All)</td>
        <td style="border: 1px solid black; padding: 5px;">${s.completed}</td></tr>
    <tr><td style="border: 1px solid black; padding: 5px;">Completed with errors (All)</td>
        <td style="border: 1px solid black; padding: 5px;">${s.completedWithErrors}</td></tr>
    <tr><td style="border: 1px solid black; padding: 5px;">Completed with warnings (All)</td>
        <td style="border: 1px solid black; padding: 5px;">${s.completedWithWarnings}</td></tr>
    <tr><td style="border: 1px solid black; padding: 5px;">Unsuccessful (All)</td>
        <td style="border: 1px solid black; padding: 5px;">${s.unsuccessful}</td></tr>
    <tr><td style="border: 1px solid black; padding: 5px;">Running (All)</td>
        <td style="border: 1px solid black; padding: 5px;">${s.running}</td></tr>
    <tr><td style="border: 1px solid black; padding: 5px;">Delayed (All)</td>
        <td style="border: 1px solid black; padding: 5px;">${s.delayed}</td></tr>
    <tr><td style="border: 1px solid black; padding: 5px;">Committed (All)</td>
        <td style="border: 1px solid black; padding: 5px;">${s.committed}</td></tr>
    <tr><td style="border: 1px solid black; padding: 5px;">Porcentaje de Tareas Completadas</td>
        <td style="border: 1px solid black; padding: 5px;">${s.porcentajeCompletado}%</td></tr>
</table>

<p>Nota: Recordar que cuando falla en un objeto o más ("El proceso no puede acceder al archivo porque está siendo utilizado por otro proceso") es relativamente común cuando otros programas están utilizando archivos al mismo tiempo que el sistema de backup. Sin embargo, le informamos que esto no afecta el resultado del respaldo, aunque el sistema de backup no pudo acceder a esos archivos específicos porque estaban en uso, el respaldo sigue completándose correctamente. Esto es porque el sistema tiene mecanismos para manejar esos bloqueos y continuar con la operación. Los archivos que no pudieron ser procesados en ese momento se respaldarán en el próximo ciclo o intento cuando ya no estén siendo utilizados. Esto de acuerdo con el Caso registrado al proveedor SD3708796.</p>

<p>Saludos,${firma}</p>
`;
}

function subjectForTipo(tipo: BackupTipo): string {
  switch (tipo) {
    case "diario":
      return "Informe General Diario de Backup de Servidores";
    case "semanal":
      return "Informe General Semanal de Backup de Servidores";
    case "mensual":
      return "Informe General Mensual de Backup de Servidores";
    default:
      return "Informe General de Backup de Servidores";
  }
}

function envList(name: string): string[] {
  return (process.env[name] || "")
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);
}

function defaultRecipientsForTipo(tipo: BackupTipo): { to: string[]; cc: string[] } {
  switch (tipo) {
    case "diario":
      return { to: envList("BACKUP_DIARIO_TO"), cc: [] };
    case "semanal":
      return { to: envList("BACKUP_SEMANAL_TO"), cc: envList("BACKUP_SEMANAL_CC") };
    case "mensual":
      return { to: envList("BACKUP_MENSUAL_TO"), cc: envList("BACKUP_MENSUAL_CC") };
    default:
      return { to: [], cc: [] };
  }
}

async function sendRun(
  tipo: string,
  runId: string,
  params: { to?: string[]; cc?: string[]; asunto?: string; mensaje?: string }
): Promise<RunMeta> {
  assertTipo(tipo);
  const meta = await readRunMeta(tipo, runId);
  const excelBuffer = await getRunExcelBuffer(tipo, runId);

  const defaults = defaultRecipientsForTipo(tipo);
  const to = params.to?.length ? params.to : defaults.to;
  const cc = params.cc?.length ? params.cc : defaults.cc;
  if (!to.length) throw new Error("No hay destinatarios configurados para enviar este informe.");

  const html =
    tipo !== "kpi"
      ? buildSimpleEmailHtml(tipo, meta.resumen as SimpleReportSummary, meta)
      : (params.mensaje || "Adjunto encontrará el informe general de backup de servidores.").replace(/\n/g, "<br>");

  const subject = params.asunto || subjectForTipo(tipo);

  await msgraphService.sendMail({
    to,
    cc,
    subject,
    html,
    attachment: { name: "Informe General de Backup Servidores.xlsx", buffer: excelBuffer },
  });

  meta.enviado = true;
  meta.enviadoEn = new Date().toISOString();
  meta.enviadoA = { to, cc };
  await writeRunMeta(meta);
  return meta;
}

export const backupReportsService = {
  createRun,
  listRuns,
  getRun,
  getRunExcelBuffer,
  deleteRun,
  sendRun,
  defaultRangeForTipo,
  defaultRecipientsForTipo,
};
