"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.importService = exports.ImportService = void 0;
const importExcel_1 = require("../../importer/importExcel");
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
class ImportService {
    async importarExcel(filePath, originalName, autor) {
        // Validar que el archivo existe
        try {
            await promises_1.default.access(filePath);
        }
        catch {
            throw new Error("Archivo no encontrado");
        }
        // Validar extensión del nombre original (no del path temporal)
        const ext = path_1.default.extname(originalName).toLowerCase();
        if (![".xlsx", ".xls"].includes(ext)) {
            throw new Error("El archivo debe ser Excel (.xlsx o .xls)");
        }
        // Ejecutar importación
        const resultado = await (0, importExcel_1.importExcel)(filePath, autor);
        // Eliminar archivo temporal
        try {
            await promises_1.default.unlink(filePath);
        }
        catch (e) {
            console.warn("No se pudo eliminar archivo temporal:", filePath);
        }
        return resultado;
    }
}
exports.ImportService = ImportService;
exports.importService = new ImportService();
