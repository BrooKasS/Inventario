import { importExcel } from "../../importer/importExcel";
import { ImportResult } from "../../types/api.types";
import path from "path";
import fs from "fs/promises";

export class ImportService {
  async importarExcel(
    filePath: string,
    originalName: string,
    autor: string
  ): Promise<ImportResult> {
    // Validar que el archivo existe
    try {
      await fs.access(filePath);
    } catch {
      throw new Error("Archivo no encontrado");
    }

    // Validar extensión del nombre original (no del path temporal)
    const ext = path.extname(originalName).toLowerCase();
    if (![".xlsx", ".xls"].includes(ext)) {
      throw new Error("El archivo debe ser Excel (.xlsx o .xls)");
    }

    // Ejecutar importación
    const resultado = await importExcel(filePath, autor);

    // Eliminar archivo temporal
    try {
      await fs.unlink(filePath);
    } catch (e) {
      console.warn("No se pudo eliminar archivo temporal:", filePath);
    }

    return resultado;
  }
}

export const importService = new ImportService();