import { Request, Response } from "express";
import { importService } from "../services/import.service";
import { ApiResponse, ImportResult } from "../../types/api.types";

export class ImportController {
  async importExcel(req: Request, res: Response) {
    try {
      const file = (req as any).file;

      if (!file) {
        return res.status(400).json({
          success: false,
          error: "No se proporcionó archivo",
        } as ApiResponse<never>);
      }

    
      const autor = req.body?.autor || "Sistema";

      const resultado = await importService.importarExcel(
        file.path,
        file.originalname,
        autor
      );

      return res.json({
        success: true,
        data: resultado,
        message: `Importación completada: ${resultado.creados} creados, ${resultado.actualizados} actualizados, ${resultado.errores} errores`,
      } as ApiResponse<ImportResult>);
    } catch (error: any) {
      console.error("❌ Error en importExcel:", error);

      return res.status(500).json({
        success: false,
        error: "Error interno en la importación",
      } as ApiResponse<never>);
    }
  }
}

export const importController = new ImportController();