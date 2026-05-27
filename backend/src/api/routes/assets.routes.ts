import { Router } from "express";
import { assetsController } from "../controllers/assets.controller";
import { asyncHandler } from "../../middlewares/errorHandler";
import { requireAdmin } from "../../middlewares/requireAdmin";

const router = Router();

// ── Lectura — TODOS (ADMIN y AUDITOR) ──────────────────────────────
router.get("/", asyncHandler(assetsController.getAssets.bind(assetsController)));
router.get("/debug/vpn-test", asyncHandler(assetsController.debugVpnTest.bind(assetsController)));
router.get("/stats", asyncHandler(assetsController.getStats.bind(assetsController)));
router.get("/deleted", asyncHandler(assetsController.getDeleted.bind(assetsController)));
router.get("/public/:id", asyncHandler(assetsController.getAssetById.bind(assetsController)));
router.get("/activo/:id", asyncHandler(assetsController.getAssetById.bind(assetsController)));
router.get("/:id", asyncHandler(assetsController.getAssetById.bind(assetsController)));
router.get("/:id/word", assetsController.generarWord.bind(assetsController));
router.get("/:id/bitacora", asyncHandler(assetsController.getBitacora.bind(assetsController)));

// ── Exportación — TODOS ─────────────────────────────────────────────
router.post("/export-excel", assetsController.exportExcel.bind(assetsController));
router.post("/export-observaciones", assetsController.exportObservaciones.bind(assetsController));

// ── Firma y estado — TODOS (acciones del usuario final) ────────────
router.post("/:id/firmar", asyncHandler(assetsController.firmarMovil.bind(assetsController)));
router.post("/:id/firmar-devolucion", asyncHandler(assetsController.firmarDevolucion.bind(assetsController)));
router.post("/:id/estado",requireAdmin, asyncHandler(assetsController.cambiarEstadoMovil.bind(assetsController)));

// ── Escritura — SOLO ADMIN ──────────────────────────────────────────
router.post("/", requireAdmin, asyncHandler(assetsController.createAsset.bind(assetsController)));
router.patch("/:id", requireAdmin, asyncHandler(assetsController.updateAsset.bind(assetsController)));
router.delete("/:id", requireAdmin, asyncHandler(assetsController.deleteAsset.bind(assetsController)));
router.post("/:id/restore", requireAdmin, asyncHandler(assetsController.restoreAsset.bind(assetsController)));
router.post("/:id/bitacora", requireAdmin, asyncHandler(assetsController.addBitacoraEntry.bind(assetsController)));
router.post("/sync-excel", requireAdmin, asyncHandler(assetsController.syncExcel.bind(assetsController)));

export default router;