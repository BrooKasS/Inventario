"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const assets_controller_1 = require("../controllers/assets.controller");
const errorHandler_1 = require("../../middlewares/errorHandler");
const router = (0, express_1.Router)();
// GET /assets - Lista de assets con filtros y paginación
router.get("/", (0, errorHandler_1.asyncHandler)(assets_controller_1.assetsController.getAssets.bind(assets_controller_1.assetsController)));
// GET /assets/stats - Estadísticas
router.get("/stats", (0, errorHandler_1.asyncHandler)(assets_controller_1.assetsController.getStats.bind(assets_controller_1.assetsController)));
router.get("/deleted", (0, errorHandler_1.asyncHandler)(assets_controller_1.assetsController.getDeleted.bind(assets_controller_1.assetsController)));
// POST /assets - Crear nuevo asset
router.post("/", (0, errorHandler_1.asyncHandler)(assets_controller_1.assetsController.createAsset.bind(assets_controller_1.assetsController)));
router.post("/export-observaciones", assets_controller_1.assetsController.exportObservaciones);
router.get("/export-excel", assets_controller_1.assetsController.exportExcel);
router.get("/:id/word", assets_controller_1.assetsController.generarWord);
// GET /assets/:id - Detalle de un asset
router.get("/:id", (0, errorHandler_1.asyncHandler)(assets_controller_1.assetsController.getAssetById.bind(assets_controller_1.assetsController)));
// PATCH /assets/:id - Actualizar asset
router.patch("/:id", (0, errorHandler_1.asyncHandler)(assets_controller_1.assetsController.updateAsset.bind(assets_controller_1.assetsController)));
// borrar asset
router.delete("/:id", (0, errorHandler_1.asyncHandler)(assets_controller_1.assetsController.deleteAsset.bind(assets_controller_1.assetsController)));
// restaurar asset
router.post("/:id/restore", (0, errorHandler_1.asyncHandler)(assets_controller_1.assetsController.restoreAsset.bind(assets_controller_1.assetsController)));
// GET /assets/:id/bitacora - Obtener bitácora de un asset
router.get("/:id/bitacora", (0, errorHandler_1.asyncHandler)(assets_controller_1.assetsController.getBitacora.bind(assets_controller_1.assetsController)));
// POST /assets/:id/bitacora - Agregar entrada manual a bitácora
router.post("/:id/bitacora", (0, errorHandler_1.asyncHandler)(assets_controller_1.assetsController.addBitacoraEntry.bind(assets_controller_1.assetsController)));
// POST /assets/sync-excel - Sincroniza registros a Excel vía Power Automate
router.post("/sync-excel", (0, errorHandler_1.asyncHandler)(assets_controller_1.assetsController.syncExcel.bind(assets_controller_1.assetsController)));
exports.default = router;
