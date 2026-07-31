import * as cheerio from "cheerio";
import ExcelJS from "exceljs";
import { applyKpiStyle } from "./excelStyle";

// Puerto de KPI/script/procesar_html.py (dashboard + FS/BD + VMware)

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

export interface KpiSummaryRow {
  cliente: string;
  totalJobs: number;
  completados: number;
  completadosConErrores: number;
  completadosConAdvertencias: number;
  fallidos: number;
  enEjecucion: number;
  retrasados: number;
  confirmados: number;
  tamanoAppGB: number;
  tamanoMediaEstGB: number;
  ahorroEspacioPct: number;
  horaInicio: string;
  horaFin: string;
  objetosProtegidos: number;
  objetosFallidos: number;
  carpetasFallidas: number;
  fecha: string;
}

export interface KpiFsRow {
  clienteMaquina: string;
  agenteInstancia: string;
  tipoAgente: string;
  backupSetSubclient: string;
  jobId: string;
  tipoBackup: string;
  scanType: string;
  estado: string;
  horaInicio: string;
  horaFin: string;
  duracionMin: number;
  tamanoAppGB: number;
  compresionPct: number;
  datosTransferidosGB: number;
  tamanoMediaEstGB: number;
  ahorroEspacioPct: number;
  throughputGBHr: number;
  objetosProtegidos: number;
  objetosFallidos: number;
  mediaAgent: string;
  contenidoFiltro: string;
  fecha: string;
}

export interface KpiVmRow {
  nombreVm: string;
  host: string;
  mediaAgent: string;
  estado: string;
  tamanoVmGB: number;
  tamanoBackupGB: number;
  tamanoGuestGB: number;
  horaInicio: string;
  horaFin: string;
  vmwareTools: string;
  hwVersion: string;
  sistemaOperativo: string;
  tipoBackup: string;
  cbtStatus: string;
  modoTransporte: string;
  razonFalla: string;
  fecha: string;
}

export interface KpiReportSummary {
  totalJobs: number;
  completados: number;
  completadosConErrores: number;
  completadosConAdvertencias: number;
  fallidos: number;
  enEjecucion: number;
  pctExito: number;
  pctError: number;
  pctFallo: number;
  totalFs: number;
  completadosFs: number;
  totalDatosGB: number;
  totalTransferidoGB: number;
  promedioCompresionPct: number;
  promedioAhorroPct: number;
  totalVms: number;
  vmsCompletadas: number;
  pctExitoVms: number;
  clientes: number;
  topClientes: { cliente: string; totalJobs: number; completados: number; pctExito: number }[];
  vmsConFallas: { nombreVm: string; estado: string; sistemaOperativo: string; razonFalla: string }[];
}

// Normaliza espacios en vez de eliminarlos: colapsa espacios/():nbsp/tabs/
// saltos de línea (los <BR> del HTML original) a un solo espacio. Si se
// eliminaran todos los espacios, comparaciones como `=== "Machine Name"` o
// `.includes("Backup Set")` nunca matchearían contra el texto ya limpiado.
function cleanText(text: string): string {
  return text.replace(/ /g, " ").replace(/\s+/g, " ").trim();
}

function parseFloatCell(text: string): number {
  const cleaned = text.replace(/\s*\(.*?\)/g, "").replace(/,/g, "").trim();
  const n = parseFloat(cleaned);
  return Number.isNaN(n) ? 0 : n;
}

function parseIntCell(text: string): number {
  const n = parseInt(cleanText(text).replace(/,/g, "").replace(/\s/g, ""), 10);
  return Number.isNaN(n) ? 0 : n;
}

function parsePct(text: string): number {
  let m = text.match(/\(([\d.]+)%\)/);
  if (m) return parseFloat(m[1]);
  m = text.match(/([\d.]+)%/);
  if (m) return parseFloat(m[1]);
  return 0;
}

function parseDurationMinutes(text: string): number {
  const t = text.trim();
  const parts = t.split(":");
  if (parts.length === 3) {
    return Number(parts[0]) * 60 + Number(parts[1]) + Number(parts[2]) / 60;
  }
  if (parts.length === 2) {
    return Number(parts[0]) * 60 + Number(parts[1]);
  }
  return 0;
}

function extractDateFromFilename(filename: string): string {
  const m = filename.match(/(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : "";
}

// Los reportes de Veeam/CommVault emiten a veces <tr><tr> consecutivos sin
// cerrar el primero (visible en el header de las tablas "Protected Virtual
// Machines"). Eso rompe el parseo de esa tabla en cheerio. Se colapsa la
// apertura duplicada antes de parsear.
function sanitizeVeeamHtml(html: string): string {
  return html.replace(/<tr\b[^>]*>\s*(?=<tr\b)/gi, "");
}

function extractFailureReason(text: string): string {
  const m = text.match(/Failure Reason[:]\s*(.+)/i);
  return m ? m[1].trim() : "";
}

// En la tabla grande de detalle de jobs, la columna "Job ID (CommCell)
// (Status)" no trae el estado como palabra — viene como código de una
// letra entre paréntesis pegado al Job ID (ej. "64396797* (C)"). El
// significado de cada código está en la leyenda del reporte.
const STATUS_CODE_MAP: Record<string, string> = {
  A: "Active",
  D: "Delayed",
  STK: "Stuck",
  NR: "No Run",
  C: "Completed",
  CWE: "Completed with errors",
  CWW: "Completed with warnings",
  K: "Killed",
  F: "Failed",
  CMTD: "Committed",
};

function extractJobIdAndStatus(rawCellText: string): { jobId: string; status: string } {
  const text = rawCellText.replace(/ /g, " ");
  const jobIdMatch = text.match(/(\d+)/);
  const jobId = jobIdMatch ? jobIdMatch[1] : "";
  const codeMatch = text.match(/\(([A-Z]+)\)\s*$/);
  const code = codeMatch ? codeMatch[1] : "";
  return { jobId, status: STATUS_CODE_MAP[code] || code };
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function parseVeeamKpiHtml(
  html: string,
  filename: string
): { fs: KpiFsRow[]; summary: KpiSummaryRow[]; vm: KpiVmRow[] } {
  const $ = cheerio.load(sanitizeVeeamHtml(html));
  const fileDate = extractDateFromFilename(filename);

  const fs: KpiFsRow[] = [];
  const summary: KpiSummaryRow[] = [];
  const vm: KpiVmRow[] = [];

  $("table").each((_, table) => {
    const $table = $(table);
    const rows = $table.find("tr");
    if (rows.length === 0) return;

    const tableHtml = $.html($table);
    const headerCells = $(rows[0]).find("td");
    const headerTexts = headerCells.toArray().map((td) => cleanText($(td).text()));
    const idx = (pred: (h: string) => boolean) => headerTexts.findIndex(pred);

    // ── Tabla 1: Summary (resumen por cliente) ─────────────────────────
    if (tableHtml.includes("Summary") && headerTexts.length <= 3) {
      rows.slice(1).each((_, tr) => {
        const cells = $(tr).find("td");
        if (cells.length < 10) return;
        const client = cleanText($(cells[0]).text());
        const clientLower = client.toLowerCase();
        if (clientLower === "all" || clientLower === "client" || EXCLUDED_CLIENTS.includes(clientLower)) return;
        if (!client) return;

        const appSizeRaw = cells.length > 9 ? cleanText($(cells[9]).text()) : "";
        summary.push({
          cliente: client,
          totalJobs: parseIntCell($(cells[2]).text()),
          completados: parseIntCell($(cells[3]).text()),
          completadosConErrores: parseIntCell($(cells[4]).text()),
          completadosConAdvertencias: parseIntCell($(cells[5]).text()),
          fallidos: parseIntCell($(cells[6]).text()),
          enEjecucion: parseIntCell($(cells[7]).text()),
          retrasados: parseIntCell($(cells[8]).text()),
          confirmados: cells.length > 9 ? parseIntCell($(cells[9]).text()) : 0,
          tamanoAppGB: parseFloatCell(appSizeRaw),
          tamanoMediaEstGB: cells.length > 10 ? parseFloatCell(cleanText($(cells[10]).text())) : 0,
          ahorroEspacioPct: cells.length > 11 ? parsePct(cleanText($(cells[11]).text())) : 0,
          horaInicio: cells.length > 12 ? cleanText($(cells[12]).text()) : "",
          horaFin: cells.length > 13 ? cleanText($(cells[13]).text()) : "",
          objetosProtegidos:
            cells.length > 14 ? parseFloatCell(cleanText($(cells[14]).text()).replace(/,/g, "")) : 0,
          objetosFallidos: cells.length > 15 ? parseIntCell($(cells[15]).text()) : 0,
          carpetasFallidas: cells.length > 16 ? parseIntCell($(cells[16]).text()) : 0,
          fecha: fileDate,
        });
      });
      return;
    }

    // ── Tabla 2: Detalle de Jobs (File System, SQL, VMware, etc.) ──────
    // Es la tabla grande (900+ filas). NO tiene columna "Machine Name": su
    // primera columna es "Client". El estado real viene codificado como
    // letra entre paréntesis junto al Job ID (ej. "64396797* (C)" = Completed).
    const clientIdx = headerTexts.findIndex((h) => h === "Client");
    const scanTypeIdx = headerTexts.findIndex((h) => h === "Scan Type");
    const agentIdx = idx((h) => h.includes("Agent"));
    const backupSetIdx = idx((h) => h.includes("Backup Set"));
    const jobIdIdx = idx((h) => h.includes("Job ID"));
    const typeIdx = headerTexts.findIndex((h) => h === "Type");
    const startIdx = idx((h) => h.includes("Start Time"));
    const endIdx = idx((h) => h.includes("End Time"));
    const appSizeIdx = idx((h) => h.includes("Size of Application"));
    const dataTxIdx = idx((h) => h.includes("Data Transferred"));
    const mediaSizeIdx = idx((h) => h.includes("Estimated Media"));
    const spacePctIdx = idx((h) => h.includes("Space Saving"));
    const transferTimeIdx = idx((h) => h.includes("Transfer Time"));
    const throughputIdx = idx((h) => h.includes("Throughput"));
    const protObjIdx = idx((h) => h.includes("Protected Objects"));
    const failObjIdx = idx((h) => h.includes("Failed Objects"));
    const mediaAgentIdx = idx((h) => h.includes("MediaAgent"));

    if (clientIdx !== -1 && scanTypeIdx !== -1 && jobIdIdx !== -1) {
      const allIdx = [
        clientIdx, agentIdx, backupSetIdx, jobIdIdx, typeIdx, scanTypeIdx, startIdx, endIdx,
        appSizeIdx, dataTxIdx, mediaSizeIdx, spacePctIdx, transferTimeIdx, throughputIdx,
        protObjIdx, failObjIdx, mediaAgentIdx,
      ].filter((x) => x !== -1);
      const maxIdx = allIdx.length ? Math.max(...allIdx) : -1;

      const dataRows = rows.slice(1).toArray();
      for (let i = 0; i < dataRows.length; i++) {
        const tr = dataRows[i];
        const cells = $(tr).find("td");
        if (cells.length <= maxIdx) continue;

        const client = cleanText($(cells[clientIdx]).text());
        if (!client || client.toLowerCase() === "client") continue;

        const jobRaw = jobIdIdx !== -1 ? $(cells[jobIdIdx]).text() : "";
        const { jobId: jobIdClean, status } = extractJobIdAndStatus(jobRaw);
        if (!VALID_STATUSES.has(status)) continue;

        const appRaw = appSizeIdx !== -1 ? cleanText($(cells[appSizeIdx]).text()) : "";

        const agentRaw = agentIdx !== -1 ? cleanText($(cells[agentIdx]).text()) : "";
        let agentType: string;
        if (agentRaw.includes("Virtual Server") || agentRaw.includes("VMware")) agentType = "VMware";
        else if (agentRaw.includes("SQL")) agentType = "SQL Server";
        else if (agentRaw.includes("Oracle")) agentType = "Oracle DB";
        else if (agentRaw.includes("Win")) agentType = "Windows FS";
        else if (agentRaw.includes("Linux")) agentType = "Linux FS";
        else if (agentRaw.includes("Solaris")) agentType = "Solaris FS";
        else if (agentRaw.includes("FreeBSD")) agentType = "FreeBSD FS";
        else agentType = agentRaw ? agentRaw.split("/")[0].trim() : "Desconocido";

        const transferRaw =
          transferTimeIdx !== -1 ? cleanText($(cells[transferTimeIdx]).text()).split("(")[0].trim() : "";
        const transferMin = parseDurationMinutes(transferRaw);

        // Busca, en las filas inmediatamente siguientes (antes del próximo
        // job real), el bloque "Content, filter and filter exception".
        let contenidoFiltro = "";
        for (let j = i + 1; j < dataRows.length; j++) {
          const nextCells = $(dataRows[j]).find("td");
          if (nextCells.length > maxIdx) break;
          const nextHtml = $.html(dataRows[j]);
          if (nextHtml.includes("Content, filter and filter exception")) {
            const items = $(dataRows[j])
              .find("li")
              .toArray()
              .map((li) => cleanText($(li).text()))
              .filter(Boolean);
            contenidoFiltro = items.join(", ");
            break;
          }
        }

        fs.push({
          clienteMaquina: client,
          agenteInstancia: agentRaw,
          tipoAgente: agentType,
          backupSetSubclient: backupSetIdx !== -1 ? cleanText($(cells[backupSetIdx]).text()) : "",
          jobId: jobIdClean,
          tipoBackup: typeIdx !== -1 ? cleanText($(cells[typeIdx]).text()) : "",
          scanType: scanTypeIdx !== -1 ? cleanText($(cells[scanTypeIdx]).text()) : "",
          estado: status,
          horaInicio: startIdx !== -1 ? cleanText($(cells[startIdx]).text()).split("(")[0].trim() : "",
          horaFin: endIdx !== -1 ? cleanText($(cells[endIdx]).text()).split("(")[0].trim() : "",
          duracionMin: Math.round(transferMin * 100) / 100,
          tamanoAppGB: parseFloatCell(appRaw),
          compresionPct: parsePct(appRaw),
          datosTransferidosGB: dataTxIdx !== -1 ? parseFloatCell(cleanText($(cells[dataTxIdx]).text())) : 0,
          tamanoMediaEstGB: mediaSizeIdx !== -1 ? parseFloatCell(cleanText($(cells[mediaSizeIdx]).text())) : 0,
          ahorroEspacioPct: spacePctIdx !== -1 ? parsePct(cleanText($(cells[spacePctIdx]).text())) : 0,
          throughputGBHr:
            throughputIdx !== -1 ? parseFloatCell(cleanText($(cells[throughputIdx]).text()).split("(")[0]) : 0,
          objetosProtegidos:
            protObjIdx !== -1 ? parseFloatCell(cleanText($(cells[protObjIdx]).text()).replace(/,/g, "")) : 0,
          objetosFallidos: failObjIdx !== -1 ? parseIntCell($(cells[failObjIdx]).text()) : 0,
          mediaAgent: mediaAgentIdx !== -1 ? cleanText($(cells[mediaAgentIdx]).text()) : "",
          contenidoFiltro,
          fecha: fileDate,
        });
      }
      return;
    }

    // ── Tablas VMware: detalle de máquinas virtuales ───────────────────
    const vmNameIdx = headerTexts.findIndex((h) => h === "Machine Name");
    const hostIdx = headerTexts.findIndex((h) => h === "Host");
    const vmAgentIdx = headerTexts.findIndex((h) => h === "Agent");
    const vmStatusIdx = headerTexts.findIndex((h) => h === "Status");
    const vmSizeIdx = idx((h) => h.includes("Virtual Machine Size"));
    const bkSizeIdx = headerTexts.findIndex((h) => h === "Backup Size");
    const guestSizeIdx = idx((h) => h.includes("Guest Size"));
    const vmStartIdx = headerTexts.findIndex((h) => h === "Start Time");
    const vmEndIdx = headerTexts.findIndex((h) => h === "End Time");
    const vmtoolsIdx = idx((h) => h.includes("VMware Tools"));
    const hwVerIdx = idx((h) => h.includes("Hardware Version"));
    const osIdx = idx((h) => h.includes("Operating System"));
    const bkTypeIdx = headerTexts.findIndex((h) => h === "Backup Type");
    const cbtIdx = idx((h) => h.includes("CBT Status"));
    const transportIdx = idx((h) => h.includes("Transport Mode"));

    if (vmNameIdx !== -1 && vmSizeIdx !== -1 && vmStatusIdx !== -1) {
      const vmRows = rows.slice(1).toArray();
      for (let vi = 0; vi < vmRows.length; vi++) {
        const cells = $(vmRows[vi]).find("td");
        if (cells.length < 4) continue;
        const vmName = vmNameIdx < cells.length ? cleanText($(cells[vmNameIdx]).text()) : "";
        if (!vmName || vmName === "Machine Name") continue;
        const vmStatus = vmStatusIdx < cells.length ? cleanText($(cells[vmStatusIdx]).text()) : "";
        if (!["Completed", "Failed", "Partial"].includes(vmStatus)) continue;

        // El motivo de falla no está en la fila de la VM: Veeam lo agrega
        // en una <TR> aparte (una sola <td>) justo después de esa fila.
        let failureReason = "";
        for (let j = vi + 1; j < vmRows.length; j++) {
          const nextCells = $(vmRows[j]).find("td");
          if (nextCells.length >= 4) break;
          const reason = extractFailureReason(cleanText($(vmRows[j]).text()));
          if (reason) {
            failureReason = reason;
            break;
          }
        }

        const vmSizeRaw = vmSizeIdx < cells.length ? cleanText($(cells[vmSizeIdx]).text()) : "";
        const bkSizeRaw = bkSizeIdx !== -1 && bkSizeIdx < cells.length ? cleanText($(cells[bkSizeIdx]).text()) : "";
        const gstSizeRaw =
          guestSizeIdx !== -1 && guestSizeIdx < cells.length ? cleanText($(cells[guestSizeIdx]).text()) : "";

        vm.push({
          nombreVm: vmName,
          host: hostIdx !== -1 && hostIdx < cells.length ? cleanText($(cells[hostIdx]).text()) : "",
          mediaAgent: vmAgentIdx !== -1 && vmAgentIdx < cells.length ? cleanText($(cells[vmAgentIdx]).text()) : "",
          estado: vmStatus,
          tamanoVmGB: parseFloatCell(vmSizeRaw),
          tamanoBackupGB: parseFloatCell(bkSizeRaw),
          tamanoGuestGB: parseFloatCell(gstSizeRaw),
          horaInicio: vmStartIdx !== -1 && vmStartIdx < cells.length ? cleanText($(cells[vmStartIdx]).text()) : "",
          horaFin: vmEndIdx !== -1 && vmEndIdx < cells.length ? cleanText($(cells[vmEndIdx]).text()) : "",
          vmwareTools: vmtoolsIdx !== -1 && vmtoolsIdx < cells.length ? cleanText($(cells[vmtoolsIdx]).text()) : "",
          hwVersion: hwVerIdx !== -1 && hwVerIdx < cells.length ? cleanText($(cells[hwVerIdx]).text()) : "",
          sistemaOperativo: osIdx !== -1 && osIdx < cells.length ? cleanText($(cells[osIdx]).text()) : "",
          tipoBackup: bkTypeIdx !== -1 && bkTypeIdx < cells.length ? cleanText($(cells[bkTypeIdx]).text()) : "",
          cbtStatus: cbtIdx !== -1 && cbtIdx < cells.length ? cleanText($(cells[cbtIdx]).text()) : "",
          modoTransporte:
            transportIdx !== -1 && transportIdx < cells.length ? cleanText($(cells[transportIdx]).text()) : "",
          razonFalla: failureReason,
          fecha: fileDate,
        });
      }
    }
  });

  return { fs, summary, vm };
}

export async function buildKpiBackupReport(
  files: { filename: string; html: string }[]
): Promise<{ workbook: ExcelJS.Workbook; summary: KpiReportSummary }> {
  const allFs: KpiFsRow[] = [];
  const allSummary: KpiSummaryRow[] = [];
  const allVm: KpiVmRow[] = [];

  for (const f of files) {
    const { fs, summary, vm } = parseVeeamKpiHtml(f.html, f.filename);
    allFs.push(...fs);
    allSummary.push(...summary);
    allVm.push(...vm);
  }

  const sSum = (key: keyof Pick<KpiSummaryRow, "totalJobs" | "completados" | "completadosConErrores" | "completadosConAdvertencias" | "fallidos" | "enEjecucion" | "retrasados" | "confirmados" | "tamanoAppGB" | "tamanoMediaEstGB" | "objetosProtegidos" | "objetosFallidos">) =>
    allSummary.reduce((acc, r) => acc + r[key], 0);

  const totalJobs = sSum("totalJobs");
  const completados = sSum("completados");
  const completadosConErrores = sSum("completadosConErrores");
  const completadosConAdvertencias = sSum("completadosConAdvertencias");
  const fallidos = sSum("fallidos");
  const enEjecucion = sSum("enEjecucion");

  const pctExito = totalJobs > 0 ? Math.round((completados / totalJobs) * 10000) / 100 : 0;
  const pctError = totalJobs > 0 ? Math.round((completadosConErrores / totalJobs) * 10000) / 100 : 0;
  const pctFallo = totalJobs > 0 ? Math.round((fallidos / totalJobs) * 10000) / 100 : 0;

  const totalVms = allVm.length;
  const vmsCompletadas = allVm.filter((v) => v.estado === "Completed").length;
  const pctExitoVms = totalVms > 0 ? Math.round((vmsCompletadas / totalVms) * 10000) / 100 : 0;

  const totalFs = allFs.length;
  const completadosFs = allFs.filter((r) => r.estado === "Completed").length;
  const totalDatosGB = Math.round(allFs.reduce((a, r) => a + r.tamanoAppGB, 0) * 100) / 100;
  const totalTransferidoGB = Math.round(allFs.reduce((a, r) => a + r.datosTransferidosGB, 0) * 100) / 100;
  const promedioCompresionPct = Math.round(mean(allFs.map((r) => r.compresionPct)) * 100) / 100;
  const promedioAhorroPct = Math.round(mean(allFs.map((r) => r.ahorroEspacioPct)) * 100) / 100;

  const topClientes = [...allSummary]
    .sort((a, b) => b.totalJobs - a.totalJobs)
    .slice(0, 5)
    .map((r) => ({
      cliente: r.cliente,
      totalJobs: r.totalJobs,
      completados: r.completados,
      pctExito: r.totalJobs > 0 ? Math.round((r.completados / r.totalJobs) * 1000) / 10 : 0,
    }));

  const vmsConFallas = allVm
    .filter((v) => v.razonFalla !== "")
    .slice(0, 10)
    .map((v) => ({
      nombreVm: v.nombreVm,
      estado: v.estado,
      sistemaOperativo: v.sistemaOperativo,
      razonFalla: v.razonFalla,
    }));

  const summary: KpiReportSummary = {
    totalJobs,
    completados,
    completadosConErrores,
    completadosConAdvertencias,
    fallidos,
    enEjecucion,
    pctExito,
    pctError,
    pctFallo,
    totalFs,
    completadosFs,
    totalDatosGB,
    totalTransferidoGB,
    promedioCompresionPct,
    promedioAhorroPct,
    totalVms,
    vmsCompletadas,
    pctExitoVms,
    clientes: allSummary.length,
    topClientes,
    vmsConFallas,
  };

  const fileDate = files.length ? extractDateFromFilename(files[0].filename) : "";
  const workbook = buildKpiWorkbook(allFs, allSummary, allVm, summary, fileDate);

  return { workbook, summary };
}

function buildKpiWorkbook(
  allFs: KpiFsRow[],
  allSummary: KpiSummaryRow[],
  allVm: KpiVmRow[],
  summary: KpiReportSummary,
  fileDate: string
): ExcelJS.Workbook {
  const workbook = new ExcelJS.Workbook();

  // ── Dashboard KPI (primera hoja) ────────────────────────────────────────
  const dash = workbook.addWorksheet("Dashboard KPI");
  dash.properties.tabColor = { argb: "FF1E3A8A" };
  dash.views = [{ state: "frozen", ySplit: 3, showGridLines: false } as ExcelJS.WorksheetViewFrozen];

  const headerFill: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A8A" } };
  const oddFill: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEFF6FF" } };
  const evenFill: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFFFF" } };
  const border: Partial<ExcelJS.Borders> = {
    top: { style: "thin", color: { argb: "FFCBD5E1" } },
    left: { style: "thin", color: { argb: "FFCBD5E1" } },
    right: { style: "thin", color: { argb: "FFCBD5E1" } },
    bottom: { style: "thin", color: { argb: "FFCBD5E1" } },
  };

  // Banner de título a todo el ancho.
  for (let col = 1; col <= 8; col++) dash.getCell(1, col).fill = headerFill;
  dash.getCell("A1").value = `📊  INFORME GENERAL DE BACKUP — FIDUPREVISORA — ${fileDate}`;
  dash.getCell("A1").font = { bold: true, size: 14, color: { argb: "FFFFFFFF" }, name: "Arial" };
  dash.getCell("A1").alignment = { horizontal: "center", vertical: "middle" };
  dash.mergeCells("A1:H1");
  dash.getRow(1).height = 26;

  dash.getCell("A2").value = `Generado: ${new Date().toISOString().slice(0, 19).replace("T", " ")}`;
  dash.getCell("A2").font = { italic: true, size: 9, color: { argb: "FF64748B" }, name: "Arial" };
  dash.getCell("A2").alignment = { horizontal: "center" };
  dash.mergeCells("A2:H2");

  // Cada fila es una "tarjeta": ícono + etiqueta, y un valor grande con
  // color según el estado (verde/ámbar/rojo). Las de porcentaje guardan
  // el número puro (no texto) para poder ponerles una barra de datos.
  type CardRow = { icon: string; label: string; value: number; isPercent?: boolean; color: string };
  const cardRows: CardRow[] = [
    { icon: "📁", label: "Total de Jobs programados", value: summary.totalJobs, color: "FF1E3A8A" },
    { icon: "✅", label: "Jobs Completados", value: summary.completados, color: "FF16A34A" },
    {
      icon: "🟠",
      label: "Jobs Completados con errores",
      value: summary.completadosConErrores,
      color: summary.completadosConErrores > 0 ? "FFD97706" : "FF64748B",
    },
    {
      icon: "🟡",
      label: "Jobs Completados con advertencias",
      value: summary.completadosConAdvertencias,
      color: summary.completadosConAdvertencias > 0 ? "FFD97706" : "FF64748B",
    },
    {
      icon: "🔴",
      label: "Jobs Fallidos",
      value: summary.fallidos,
      color: summary.fallidos > 0 ? "FFDC2626" : "FF16A34A",
    },
    {
      icon: "⏳",
      label: "Jobs en Ejecución",
      value: summary.enEjecucion,
      color: summary.enEjecucion > 0 ? "FF2563EB" : "FF64748B",
    },
    {
      icon: "📈",
      label: "% Tasa de éxito (Completed)",
      value: summary.pctExito,
      isPercent: true,
      color: summary.pctExito >= 90 ? "FF16A34A" : summary.pctExito >= 70 ? "FFD97706" : "FFDC2626",
    },
    {
      icon: "📉",
      label: "% Completados con error",
      value: summary.pctError,
      isPercent: true,
      color: summary.pctError === 0 ? "FF16A34A" : summary.pctError <= 10 ? "FFD97706" : "FFDC2626",
    },
    {
      icon: "🚫",
      label: "% Fallidos",
      value: summary.pctFallo,
      isPercent: true,
      color: summary.pctFallo === 0 ? "FF16A34A" : summary.pctFallo <= 10 ? "FFD97706" : "FFDC2626",
    },
  ];

  let rowNum = 4;

  const cSectionA = dash.getCell(rowNum, 1);
  const cSectionB = dash.getCell(rowNum, 2);
  cSectionA.value = "📋 RESUMEN GENERAL DE JOBS";
  cSectionA.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10, name: "Arial" };
  cSectionA.fill = headerFill;
  cSectionB.fill = headerFill;
  dash.mergeCells(rowNum, 1, rowNum, 2);
  rowNum += 1;

  const percentRefs: string[] = [];
  cardRows.forEach((row, i) => {
    const c1 = dash.getCell(rowNum, 1);
    const c2 = dash.getCell(rowNum, 2);
    c1.value = `${row.icon}  ${row.label}`;
    c1.font = { size: 9, name: "Arial", color: { argb: "FF334155" } };
    c1.alignment = { vertical: "middle" };

    c2.value = row.value;
    if (row.isPercent) {
      c2.numFmt = '0.00"%"';
      percentRefs.push(`B${rowNum}`);
    }
    c2.font = { size: 14, bold: true, name: "Arial", color: { argb: row.color } };
    c2.alignment = { horizontal: "center", vertical: "middle" };

    const bg = i % 2 === 0 ? evenFill : oddFill;
    c1.fill = bg;
    c2.fill = bg;
    c1.border = border;
    c2.border = border;
    dash.getRow(rowNum).height = 20;
    rowNum += 1;
  });

  // Barra de datos nativa de Excel (escala fija 0-100%) en cada celda de
  // porcentaje: se ve como una mini barra de progreso dentro de la celda.
  percentRefs.forEach((ref, i) => {
    dash.addConditionalFormatting({
      ref,
      rules: [
        {
          type: "dataBar",
          priority: i + 1,
          cfvo: [
            { type: "num", value: 0 },
            { type: "num", value: 100 },
          ],
          color: { argb: "FFBFDBFE" },
        },
      ],
    } as unknown as ExcelJS.ConditionalFormattingOptions);
  });

  dash.getColumn(1).width = 42;
  dash.getColumn(2).width = 22;

  if (summary.topClientes.length > 0) {
    rowNum += 2;
    dash.getCell(rowNum, 4).value = "🏆 TOP 5 CLIENTES POR TOTAL JOBS";
    dash.getCell(rowNum, 4).font = { bold: true, size: 10, color: { argb: "FF1E3A8A" }, name: "Arial" };
    dash.mergeCells(rowNum, 4, rowNum, 7);
    rowNum += 1;

    const headersTop = ["Cliente", "Total Jobs", "Completados", "% Éxito"];
    headersTop.forEach((h, i) => {
      const c = dash.getCell(rowNum, 4 + i);
      c.value = h;
      c.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 9, name: "Arial" };
      c.fill = headerFill;
      c.border = border;
      c.alignment = { horizontal: "center" };
    });
    rowNum += 1;

    const topClientesFirstRow = rowNum;
    summary.topClientes.forEach((r, i) => {
      const bg = i % 2 === 0 ? oddFill : evenFill;
      const vals = [r.cliente, r.totalJobs, r.completados, `${r.pctExito}%`];
      vals.forEach((v, ci) => {
        const c = dash.getCell(rowNum, 4 + ci);
        c.value = v;
        c.font = { size: 9, name: "Arial" };
        c.fill = bg;
        c.border = border;
        c.alignment = { horizontal: ci > 0 ? "center" : "left" };
      });
      rowNum += 1;
    });
    const topClientesLastRow = rowNum - 1;

    // Barra de datos comparando el total de jobs entre los 5 clientes.
    dash.addConditionalFormatting({
      ref: `E${topClientesFirstRow}:E${topClientesLastRow}`,
      rules: [
        {
          type: "dataBar",
          priority: 1,
          cfvo: [{ type: "min" }, { type: "max" }],
          color: { argb: "FF93C5FD" },
        },
      ],
    } as unknown as ExcelJS.ConditionalFormattingOptions);

    dash.getColumn(4).width = 35;
    dash.getColumn(5).width = 14;
    dash.getColumn(6).width = 14;
    dash.getColumn(7).width = 10;
  }

  if (summary.vmsConFallas.length > 0) {
    rowNum += 2;
    dash.getCell(rowNum, 4).value = "🔴 VMs CON ADVERTENCIAS / FALLAS (máx 10)";
    dash.getCell(rowNum, 4).font = { bold: true, size: 10, color: { argb: "FFDC2626" }, name: "Arial" };
    dash.mergeCells(rowNum, 4, rowNum, 8);
    rowNum += 1;

    const alertFill: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEE2E2" } };
    const headersVm = ["Nombre VM", "Estado", "SO", "Razón de Falla"];
    headersVm.forEach((h, i) => {
      const c = dash.getCell(rowNum, 4 + i);
      c.value = h;
      c.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 9, name: "Arial" };
      c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFDC2626" } };
      c.border = border;
      c.alignment = { horizontal: "center" };
    });
    rowNum += 1;

    summary.vmsConFallas.forEach((v) => {
      const vals = [v.nombreVm, v.estado, v.sistemaOperativo, v.razonFalla];
      vals.forEach((val, ci) => {
        const c = dash.getCell(rowNum, 4 + ci);
        c.value = val;
        c.font = { size: 8, name: "Arial" };
        c.fill = alertFill;
        c.border = border;
        c.alignment = { wrapText: true, vertical: "middle" };
      });
      dash.getRow(rowNum).height = 30;
      rowNum += 1;
    });

    dash.getColumn(8).width = 50;
  }

  // ── Resumen por Cliente ──────────────────────────────────────────────────
  const sheetSummary = workbook.addWorksheet("Resumen por Cliente");
  sheetSummary.columns = [
    { header: "Cliente", key: "cliente", width: 22 },
    { header: "Total Jobs", key: "totalJobs", width: 12 },
    { header: "Completados", key: "completados", width: 12 },
    { header: "Completados con errores", key: "completadosConErrores", width: 16 },
    { header: "Completados con advertencias", key: "completadosConAdvertencias", width: 16 },
    { header: "Fallidos", key: "fallidos", width: 10 },
    { header: "En ejecución", key: "enEjecucion", width: 12 },
    { header: "Retrasados", key: "retrasados", width: 12 },
    { header: "Confirmados", key: "confirmados", width: 12 },
    { header: "Tamaño App (GB)", key: "tamanoAppGB", width: 14 },
    { header: "Tamaño Media Estimado (GB)", key: "tamanoMediaEstGB", width: 16 },
    { header: "Ahorro de Espacio (%)", key: "ahorroEspacioPct", width: 14 },
    { header: "Objetos Protegidos", key: "objetosProtegidos", width: 14 },
    { header: "Objetos Fallidos", key: "objetosFallidos", width: 14 },
    { header: "Fecha", key: "fecha", width: 14 },
  ];
  allSummary.forEach((r) =>
    sheetSummary.addRow({
      cliente: r.cliente,
      totalJobs: r.totalJobs,
      completados: r.completados,
      completadosConErrores: r.completadosConErrores,
      completadosConAdvertencias: r.completadosConAdvertencias,
      fallidos: r.fallidos,
      enEjecucion: r.enEjecucion,
      retrasados: r.retrasados,
      confirmados: r.confirmados,
      tamanoAppGB: r.tamanoAppGB,
      tamanoMediaEstGB: r.tamanoMediaEstGB,
      ahorroEspacioPct: r.ahorroEspacioPct,
      objetosProtegidos: r.objetosProtegidos,
      objetosFallidos: r.objetosFallidos,
      fecha: r.fecha,
    })
  );

  const nDataSummary = allSummary.length;
  const pctTasaExito = summary.totalJobs > 0 ? (summary.completados / summary.totalJobs) * 100 : 0;
  sheetSummary.addRow({
    cliente: "── TOTALES ──",
    totalJobs: summary.totalJobs,
    completados: summary.completados,
    completadosConErrores: summary.completadosConErrores,
    completadosConAdvertencias: summary.completadosConAdvertencias,
    fallidos: summary.fallidos,
    enEjecucion: summary.enEjecucion,
    tamanoAppGB: summary.totalDatosGB,
    ahorroEspacioPct: Math.round(mean(allSummary.map((r) => r.ahorroEspacioPct)) * 100) / 100,
  });
  sheetSummary.addRow({ cliente: "% Tasa de Éxito (Completed)", totalJobs: pctTasaExito.toFixed(2) });
  const totalRowsSummary = new Set([nDataSummary + 2, nDataSummary + 3]);
  applyKpiStyle(sheetSummary, { totalRows: totalRowsSummary });

  // ── Backup FS y BD ───────────────────────────────────────────────────────
  if (allFs.length > 0) {
    const sheetFs = workbook.addWorksheet("Backup FS y BD");
    sheetFs.columns = [
      { header: "Cliente / Máquina", key: "clienteMaquina", width: 24 },
      { header: "Agente / Instancia", key: "agenteInstancia", width: 18 },
      { header: "Tipo de Agente", key: "tipoAgente", width: 14 },
      { header: "Backup Set / Subclient", key: "backupSetSubclient", width: 18 },
      { header: "Job ID", key: "jobId", width: 10 },
      { header: "Tipo de Backup", key: "tipoBackup", width: 14 },
      { header: "Scan Type", key: "scanType", width: 14 },
      { header: "Estado", key: "estado", width: 16 },
      { header: "Hora Inicio", key: "horaInicio", width: 14 },
      { header: "Hora Fin", key: "horaFin", width: 14 },
      { header: "Duración (min)", key: "duracionMin", width: 14 },
      { header: "Tamaño App (GB)", key: "tamanoAppGB", width: 14 },
      { header: "Compresión (%)", key: "compresionPct", width: 14 },
      { header: "Datos Transferidos (GB)", key: "datosTransferidosGB", width: 16 },
      { header: "Tamaño Media Est. (GB)", key: "tamanoMediaEstGB", width: 16 },
      { header: "Ahorro Espacio (%)", key: "ahorroEspacioPct", width: 14 },
      { header: "Throughput (GB/Hr)", key: "throughputGBHr", width: 14 },
      { header: "Objetos Protegidos", key: "objetosProtegidos", width: 14 },
      { header: "Objetos Fallidos", key: "objetosFallidos", width: 14 },
      { header: "Media Agent", key: "mediaAgent", width: 16 },
      { header: "Content / Filter Exception", key: "contenidoFiltro", width: 40 },
      { header: "Fecha", key: "fecha", width: 14 },
    ];
    allFs.forEach((r) => sheetFs.addRow({ ...r }));

    const nDataFs = allFs.length;
    sheetFs.addRow({
      clienteMaquina: "── RESUMEN ──",
      tamanoAppGB: summary.totalDatosGB,
      datosTransferidosGB: summary.totalTransferidoGB,
      compresionPct: summary.promedioCompresionPct,
      ahorroEspacioPct: summary.promedioAhorroPct,
    });
    sheetFs.addRow({ clienteMaquina: "Total Jobs ejecutados", estado: summary.totalFs });
    sheetFs.addRow({ clienteMaquina: "Total Jobs Completados", estado: summary.completadosFs });

    const totalRowsFs = new Set([nDataFs + 2, nDataFs + 3, nDataFs + 4]);
    const alertRowsFs = new Set<number>();
    allFs.forEach((r, i) => {
      if (r.objetosFallidos > 0 || (r.estado !== "Completed" && r.estado !== "")) {
        alertRowsFs.add(i + 2);
      }
    });
    applyKpiStyle(sheetFs, { totalRows: totalRowsFs, alertRows: alertRowsFs });
  }

  // ── Backup VMware ────────────────────────────────────────────────────────
  if (allVm.length > 0) {
    const sheetVm = workbook.addWorksheet("Backup VMware");
    sheetVm.columns = [
      { header: "Nombre VM", key: "nombreVm", width: 24 },
      { header: "Host", key: "host", width: 20 },
      { header: "Media Agent", key: "mediaAgent", width: 16 },
      { header: "Estado", key: "estado", width: 14 },
      { header: "Tamaño VM (GB)", key: "tamanoVmGB", width: 14 },
      { header: "Tamaño Backup (GB)", key: "tamanoBackupGB", width: 14 },
      { header: "Tamaño Guest (GB)", key: "tamanoGuestGB", width: 14 },
      { header: "Hora Inicio", key: "horaInicio", width: 14 },
      { header: "Hora Fin", key: "horaFin", width: 14 },
      { header: "VMware Tools", key: "vmwareTools", width: 14 },
      { header: "HW Version", key: "hwVersion", width: 12 },
      { header: "Sistema Operativo", key: "sistemaOperativo", width: 20 },
      { header: "Tipo Backup", key: "tipoBackup", width: 14 },
      { header: "CBT Status", key: "cbtStatus", width: 12 },
      { header: "Modo Transporte", key: "modoTransporte", width: 16 },
      { header: "Razón de Falla", key: "razonFalla", width: 50 },
      { header: "Fecha", key: "fecha", width: 14 },
    ];
    allVm.forEach((r) => sheetVm.addRow({ ...r }));

    const nDataVm = allVm.length;
    const vmsConAdvertencias = allVm.filter((v) => v.razonFalla !== "").length;
    sheetVm.addRow({
      nombreVm: "── RESUMEN VMs ──",
      tamanoVmGB: Math.round(allVm.reduce((a, r) => a + r.tamanoVmGB, 0) * 100) / 100,
      tamanoBackupGB: Math.round(allVm.reduce((a, r) => a + r.tamanoBackupGB, 0) * 100) / 100,
    });
    sheetVm.addRow({ nombreVm: "Total VMs respaldadas", estado: summary.totalVms });
    sheetVm.addRow({ nombreVm: "VMs Completadas", estado: summary.vmsCompletadas });
    sheetVm.addRow({ nombreVm: "VMs con advertencias/fallas", estado: vmsConAdvertencias });

    const totalRowsVm = new Set([nDataVm + 2, nDataVm + 3, nDataVm + 4, nDataVm + 5]);
    const alertRowsVm = new Set<number>();
    allVm.forEach((v, i) => {
      if (v.razonFalla !== "" || v.estado === "Failed") alertRowsVm.add(i + 2);
    });
    applyKpiStyle(sheetVm, { totalRows: totalRowsVm, alertRows: alertRowsVm });
  }

  return workbook;
}
