import * as cheerio from "cheerio";
import ExcelJS from "exceljs";
import { applyLegacyStyle } from "./excelStyle";

// Puerto 1:1 de diario/scripts/procesar_html.py (idéntico en semanal/ y mensual/)

const EXCLUDED_CLIENTS = ["vcsaortezal", "vcsareptri-ort", "vcsatriara-ext"];

const VALID_STATUSES = new Set([
  "Active",
  "Delayed",
  "Completed",
  "Completed with errors",
  "Completed with warnings",
  "Killed",
  "Failed",
  "Aged",
  "No Schedule",
  "No Run",
  "Committed",
]);

export interface MachineStatusRow {
  machineName: string;
  status: string;
  fecha: string;
}

export interface SummaryRow {
  client: string;
  totalJobs: number;
  completed: number;
  completedWithErrors: number;
  completedWithWarnings: number;
  unsuccessful: number;
  running: number;
  delayed: number;
  committed: number;
  fecha: string;
}

export interface SimpleReportSummary {
  totalJobs: number;
  completed: number;
  completedWithErrors: number;
  completedWithWarnings: number;
  unsuccessful: number;
  running: number;
  delayed: number;
  committed: number;
  porcentajeCompletado: number;
  tareasProgramadasEjecutadas: number;
  tareasProgramadasCompletadas: number;
  clientes: number;
}

function cleanText(text: string): string {
  return text.replace(/ /g, "").trim();
}

function parseIntCell(text: string): number {
  const n = parseInt(text.replace(/,/g, "").replace(/\s/g, ""), 10);
  return Number.isNaN(n) ? 0 : n;
}

function extractDateFromFilename(filename: string): string {
  const m = filename.match(/(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : "";
}

const DEBUG = process.env.BACKUP_DEBUG === "1";

export function parseVeeamSimpleHtml(
  html: string,
  filename: string
): { machineStatusData: MachineStatusRow[]; summaryData: SummaryRow[] } {
  const $ = cheerio.load(html);
  const fileDate = extractDateFromFilename(filename);

  const machineStatusData: MachineStatusRow[] = [];
  const summaryData: SummaryRow[] = [];

  $("table").each((_, table) => {
    const $table = $(table);
    const rows = $table.find("tr");
    if (rows.length === 0) return;

    const tableHtml = $.html($table);

    // -------- SUMMARY --------
    if (tableHtml.includes("Summary")) {
      rows.slice(1).each((_, tr) => {
        const cells = $(tr).find("td");
        if (cells.length >= 10) {
          const client = cleanText($(cells[0]).text());
          const clientLower = client.toLowerCase();
          if (clientLower === "all" || EXCLUDED_CLIENTS.includes(clientLower)) return;
          if (clientLower === "client") return;

          summaryData.push({
            client,
            totalJobs: parseIntCell(cleanText($(cells[2]).text())),
            completed: parseIntCell(cleanText($(cells[3]).text())),
            completedWithErrors: parseIntCell(cleanText($(cells[4]).text())),
            completedWithWarnings: parseIntCell(cleanText($(cells[5]).text())),
            unsuccessful: parseIntCell(cleanText($(cells[6]).text())),
            running: parseIntCell(cleanText($(cells[7]).text())),
            delayed: parseIntCell(cleanText($(cells[8]).text())),
            committed: parseIntCell(cleanText($(cells[9]).text())),
            fecha: fileDate,
          });
        }
      });
    }

    // -------- ESTADOS DE MÁQUINA --------
    const headerCellsAll = $(rows[0]).find("td, th");
    const headerCells = $(rows[0]).find("td");
    let statusIndex = -1;
    let machineNameIndex = -1;
    headerCells.each((i, td) => {
      const t = cleanText($(td).text());
      if (statusIndex === -1 && t.includes("Status")) statusIndex = i;
      if (machineNameIndex === -1 && t.includes("Machine Name")) machineNameIndex = i;
    });

    if (DEBUG) {
      const tdTexts = headerCells.toArray().map((td) => JSON.stringify(cleanText($(td).text())));
      const thCount = headerCellsAll.length - headerCells.length;
      console.log(
        `[BACKUP_DEBUG][${filename}] tabla con ${rows.length} filas, ${headerCells.length} <td> en fila 0 (+${thCount} <th>) -> [${tdTexts.join(", ")}] statusIndex=${statusIndex} machineNameIndex=${machineNameIndex}`
      );
    }

    if (statusIndex === -1 || machineNameIndex === -1) return;

    rows.slice(1).each((_, tr) => {
      const cells = $(tr).find("td");
      if (cells.length > statusIndex && cells.length > machineNameIndex) {
        const statusText = cleanText($(cells[statusIndex]).text());
        const machineName = cleanText($(cells[machineNameIndex]).text());
        if (DEBUG && !VALID_STATUSES.has(statusText)) {
          console.log(`[BACKUP_DEBUG][${filename}] fila descartada, status no reconocido: ${JSON.stringify(statusText)} (machine=${JSON.stringify(machineName)})`);
        }
        if (VALID_STATUSES.has(statusText)) {
          machineStatusData.push({ machineName, status: statusText, fecha: fileDate });
        }
      }
    });
  });

  return { machineStatusData, summaryData };
}

function sum(
  rows: SummaryRow[],
  key: keyof Omit<SummaryRow, "client" | "fecha">
): number {
  return rows.reduce((acc, r) => acc + r[key], 0);
}

export async function buildSimpleBackupReport(
  files: { filename: string; html: string }[]
): Promise<{ workbook: ExcelJS.Workbook; summary: SimpleReportSummary }> {
  const allMachineStatus: MachineStatusRow[] = [];
  const allSummary: SummaryRow[] = [];

  for (const f of files) {
    const { machineStatusData, summaryData } = parseVeeamSimpleHtml(f.html, f.filename);
    allMachineStatus.push(...machineStatusData);
    allSummary.push(...summaryData);
  }

  const totalJobsAll = sum(allSummary, "totalJobs");
  const completedAll = sum(allSummary, "completed");
  const completedErrorsAll = sum(allSummary, "completedWithErrors");
  const completedWarningsAll = sum(allSummary, "completedWithWarnings");
  const unsuccessfulAll = sum(allSummary, "unsuccessful");
  const runningAll = sum(allSummary, "running");
  const delayedAll = sum(allSummary, "delayed");
  const committedAll = sum(allSummary, "committed");

  const totalServices = allMachineStatus.filter((m) => m.status !== "").length;
  const completedServices = allMachineStatus.filter((m) => m.status === "Completed").length;
  const porcentajeCompletado =
    totalJobsAll > 0 ? Number(((completedAll / totalJobsAll) * 100).toFixed(2)) : 0;

  // ── Workbook ──────────────────────────────────────────────────────────────
  const workbook = new ExcelJS.Workbook();

  const sheetFull = workbook.addWorksheet("Backup Full");
  sheetFull.columns = [
    { header: "Machine Name", key: "machineName", width: 20 },
    { header: "Status", key: "status", width: 20 },
    { header: "Fecha", key: "fecha", width: 14 },
  ];
  allMachineStatus.forEach((r) =>
    sheetFull.addRow({ machineName: r.machineName, status: r.status, fecha: r.fecha })
  );
  sheetFull.addRow({
    machineName: "Número de Tareas de Backup Programadas Ejecutadas",
    status: totalServices,
    fecha: "",
  });
  sheetFull.addRow({
    machineName: "Número de Tareas de Backup Programadas Completadas",
    status: completedServices,
    fecha: "",
  });
  applyLegacyStyle(sheetFull);

  const sheetFs = workbook.addWorksheet("Backup File System");
  sheetFs.columns = [
    { header: "Client", key: "client", width: 22 },
    { header: "Total Jobs", key: "totalJobs", width: 12 },
    { header: "Completed", key: "completed", width: 12 },
    { header: "Completed with errors", key: "completedWithErrors", width: 18 },
    { header: "Completed with warnings", key: "completedWithWarnings", width: 18 },
    { header: "Unsuccessful", key: "unsuccessful", width: 12 },
    { header: "Running", key: "running", width: 12 },
    { header: "Delayed", key: "delayed", width: 12 },
    { header: "Committed", key: "committed", width: 12 },
    { header: "Fecha", key: "fecha", width: 14 },
  ];
  allSummary.forEach((r) => sheetFs.addRow({ ...r }));

  sheetFs.addRow({ client: "Total Jobs (All)", totalJobs: totalJobsAll });
  sheetFs.addRow({ client: "Completed (All)", completed: completedAll });
  sheetFs.addRow({ client: "Completed with errors (All)", completed: completedErrorsAll });
  sheetFs.addRow({ client: "Completed with warnings (All)", completed: completedWarningsAll });
  sheetFs.addRow({ client: "Unsuccessful (All)", completed: unsuccessfulAll });
  sheetFs.addRow({ client: "Running (All)", completed: runningAll });
  sheetFs.addRow({ client: "Delayed (All)", completed: delayedAll });
  sheetFs.addRow({ client: "Committed (All)", completed: committedAll });
  sheetFs.addRow({
    client: "Porcentaje de Tareas Completadas (%)",
    totalJobs: porcentajeCompletado.toFixed(2),
  });

  applyLegacyStyle(sheetFs);

  const summary: SimpleReportSummary = {
    totalJobs: totalJobsAll,
    completed: completedAll,
    completedWithErrors: completedErrorsAll,
    completedWithWarnings: completedWarningsAll,
    unsuccessful: unsuccessfulAll,
    running: runningAll,
    delayed: delayedAll,
    committed: committedAll,
    porcentajeCompletado,
    tareasProgramadasEjecutadas: totalServices,
    tareasProgramadasCompletadas: completedServices,
    clientes: allSummary.length,
  };

  return { workbook, summary };
}
