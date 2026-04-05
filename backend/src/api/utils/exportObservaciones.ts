/**
 * exportObservaciones.ts
 * Genera el Excel de observaciones con formato corporativo usando Python + openpyxl.
 *
 * Ubicación: backend/src/utils/exportObservaciones.ts
 */

import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

interface ObservacionRow {
  Activo: string;
  Tipo: string;
  Código: string;
  Ubicación?: string;
  Fecha: string;
  Autor: string;
  "Tipo de evento": string;
  Descripción: string;
  "Campo modificado": string;
  "Valor anterior": string;
  "Valor nuevo": string;
}

interface ExportObsOptions {
  rows: ObservacionRow[];
  incluirTecnicos?: boolean;
}

export async function generarExcelObservaciones(opts: ExportObsOptions): Promise<Buffer> {
  const { rows, incluirTecnicos = false } = opts;

  const payloadPath = path.join(__dirname, `obs_payload_${Date.now()}.json`);
  const outputPath  = path.join(__dirname, `obs_out_${Date.now()}.xlsx`);

try {
  fs.writeFileSync(payloadPath, JSON.stringify({ rows, incluirTecnicos }));
  const scriptPath = path.join(__dirname, "exportObservaciones.py");
  const pythonCmd = process.platform === "win32" ? "python" : "python3";
  execSync(`"${pythonCmd}" "${scriptPath}" "${payloadPath}" "${outputPath}"`, {
    timeout: 120000,
    stdio: "pipe",
    windowsHide: true,
  });

    const buffer = fs.readFileSync(outputPath);
    return buffer;
  } finally {
    if (fs.existsSync(payloadPath)) fs.unlinkSync(payloadPath);
    if (fs.existsSync(outputPath))  fs.unlinkSync(outputPath);
  }
}