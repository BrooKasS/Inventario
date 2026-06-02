import { Router } from "express";
import { assetsController } from "../controllers/assets.controller";
import { asyncHandler } from "../../middlewares/errorHandler";
import { requireAdmin } from "../../middlewares/requireAdmin";

const router = Router();

// ══════════════════════════════════════════════════════════════
// RUTAS ESTÁTICAS — deben ir ANTES de cualquier /:id
// ══════════════════════════════════════════════════════════════

// Lectura — sin autenticación requerida
router.get("/stats",           asyncHandler(assetsController.getStats.bind(assetsController)));
router.get("/deleted",         asyncHandler(assetsController.getDeleted.bind(assetsController)));
router.get("/debug/vpn-test",  asyncHandler(assetsController.debugVpnTest.bind(assetsController)));
router.get("/export/ocs",      asyncHandler(assetsController.exportOCS.bind(assetsController)));

// Exportación
router.post("/export-excel",         assetsController.exportExcel.bind(assetsController));
router.post("/export-observaciones", assetsController.exportObservaciones.bind(assetsController));

// Escritura — solo ADMIN — rutas estáticas
router.post("/",          requireAdmin, asyncHandler(assetsController.createAsset.bind(assetsController)));
router.post("/sync-excel", requireAdmin, asyncHandler(assetsController.syncExcel.bind(assetsController)));
router.delete("/hard-all", requireAdmin, asyncHandler(assetsController.hardDeleteAll.bind(assetsController)));

// ══════════════════════════════════════════════════════════════
// RUTAS CON PREFIJO FIJO + PARÁMETRO — antes de /:id genérico
// ══════════════════════════════════════════════════════════════

// Ruta pública para firma (sin JWT) — prefijo fijo "public"
router.get("/public/:id",  asyncHandler(assetsController.getAssetById.bind(assetsController)));

// Ruta privada con prefijo fijo "activo"
router.get("/activo/:id",  asyncHandler(assetsController.getAssetById.bind(assetsController)));

// Subrutas de un asset — prefijo fijo antes de /:id genérico
router.get("/:id/word",     assetsController.generarWord.bind(assetsController));
router.get("/:id/bitacora", asyncHandler(assetsController.getBitacora.bind(assetsController)));

// Firma y estado — acciones del usuario final
router.post("/:id/firmar",            asyncHandler(assetsController.firmarMovil.bind(assetsController)));
router.post("/:id/firmar-devolucion", asyncHandler(assetsController.firmarDevolucion.bind(assetsController)));
router.post("/:id/estado",            requireAdmin, asyncHandler(assetsController.cambiarEstadoMovil.bind(assetsController)));
router.post("/:id/bitacora",          requireAdmin, asyncHandler(assetsController.addBitacoraEntry.bind(assetsController)));
router.post("/:id/restore",           requireAdmin, asyncHandler(assetsController.restoreAsset.bind(assetsController)));

// Escritura por ID — solo ADMIN
router.patch("/:id",       requireAdmin, asyncHandler(assetsController.updateAsset.bind(assetsController)));
router.delete("/:id/hard", requireAdmin, asyncHandler(assetsController.hardDelete.bind(assetsController)));
router.delete("/:id",      requireAdmin, asyncHandler(assetsController.deleteAsset.bind(assetsController)));

// ══════════════════════════════════════════════════════════════
// RUTA GENÉRICA /:id — SIEMPRE AL FINAL
// ══════════════════════════════════════════════════════════════
router.get("/",     asyncHandler(assetsController.getAssets.bind(assetsController)));
router.get("/:id",  asyncHandler(assetsController.getAssetById.bind(assetsController)));

export default router;