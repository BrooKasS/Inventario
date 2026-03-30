"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.importController = exports.ImportController = void 0;
const import_service_1 = require("../services/import.service");
class ImportController {
    async importExcel(req, res) {
        try {
            const file = req.file;
            if (!file) {
                return res.status(400).json({
                    success: false,
                    error: "No se proporcionó archivo",
                });
            }
            const autor = req.body?.autor || "Sistema";
            const resultado = await import_service_1.importService.importarExcel(file.path, file.originalname, autor);
            return res.json({
                success: true,
                data: resultado,
                message: `Importación completada: ${resultado.creados} creados, ${resultado.actualizados} actualizados, ${resultado.errores} errores`,
            });
        }
        catch (error) {
            console.error("❌ Error en importExcel:", error);
            return res.status(500).json({
                success: false,
                error: "Error interno en la importación",
            });
        }
    }
}
exports.ImportController = ImportController;
exports.importController = new ImportController();
