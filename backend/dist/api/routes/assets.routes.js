"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const assets_controller_1 = require("../controllers/assets.controller");
const errorHandler_1 = require("../../middlewares/errorHandler");
const requireAdmin_1 = require("../../middlewares/requireAdmin");
const router = (0, express_1.Router)();
// ── Lectura — TODOS (ADMIN y AUDITOR) ──────────────────────────────
router.get("/", (0, errorHandler_1.asyncHandler)(assets_controller_1.assetsController.getAssets.bind(assets_controller_1.assetsController)));
router.get("/debug/vpn-test", (0, errorHandler_1.asyncHandler)(assets_controller_1.assetsController.debugVpnTest.bind(assets_controller_1.assetsController)));
router.get("/stats", (0, errorHandler_1.asyncHandler)(assets_controller_1.assetsController.getStats.bind(assets_controller_1.assetsController)));
router.get("/deleted", (0, errorHandler_1.asyncHandler)(assets_controller_1.assetsController.getDeleted.bind(assets_controller_1.assetsController)));
router.get("/:id", (0, errorHandler_1.asyncHandler)(assets_controller_1.assetsController.getAssetById.bind(assets_controller_1.assetsController)));
router.get("/:id/word", assets_controller_1.assetsController.generarWord.bind(assets_controller_1.assetsController));
router.get("/:id/bitacora", (0, errorHandler_1.asyncHandler)(assets_controller_1.assetsController.getBitacora.bind(assets_controller_1.assetsController)));
// ── Exportación — TODOS ─────────────────────────────────────────────
router.post("/export-excel", assets_controller_1.assetsController.exportExcel.bind(assets_controller_1.assetsController));
router.post("/export-observaciones", assets_controller_1.assetsController.exportObservaciones.bind(assets_controller_1.assetsController));
// ── Firma — TODOS (es pública por diseño) ──────────────────────────
router.post("/:id/firmar", (0, errorHandler_1.asyncHandler)(assets_controller_1.assetsController.firmarMovil.bind(assets_controller_1.assetsController)));
// ── Escritura — SOLO ADMIN ──────────────────────────────────────────
router.post("/", requireAdmin_1.requireAdmin, (0, errorHandler_1.asyncHandler)(assets_controller_1.assetsController.createAsset.bind(assets_controller_1.assetsController)));
router.patch("/:id", requireAdmin_1.requireAdmin, (0, errorHandler_1.asyncHandler)(assets_controller_1.assetsController.updateAsset.bind(assets_controller_1.assetsController)));
router.delete("/:id", requireAdmin_1.requireAdmin, (0, errorHandler_1.asyncHandler)(assets_controller_1.assetsController.deleteAsset.bind(assets_controller_1.assetsController)));
router.post("/:id/restore", requireAdmin_1.requireAdmin, (0, errorHandler_1.asyncHandler)(assets_controller_1.assetsController.restoreAsset.bind(assets_controller_1.assetsController)));
router.post("/:id/bitacora", requireAdmin_1.requireAdmin, (0, errorHandler_1.asyncHandler)(assets_controller_1.assetsController.addBitacoraEntry.bind(assets_controller_1.assetsController)));
router.post("/sync-excel", requireAdmin_1.requireAdmin, (0, errorHandler_1.asyncHandler)(assets_controller_1.assetsController.syncExcel.bind(assets_controller_1.assetsController)));
exports.default = router;
