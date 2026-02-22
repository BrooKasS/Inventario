import { Router } from "express";
import { assetsController } from "../controllers/assets.controller";
import { asyncHandler } from "../../middlewares/errorHandler";

const router = Router();

// GET /assets - Lista de assets con filtros y paginación
router.get("/", asyncHandler(assetsController.getAssets.bind(assetsController)));

// GET /assets/stats - Estadísticas
router.get("/stats", asyncHandler(assetsController.getStats.bind(assetsController)));

// GET /assets/:id - Detalle de un asset
router.get("/:id", asyncHandler(assetsController.getAssetById.bind(assetsController)));

// PATCH /assets/:id - Actualizar asset
router.patch("/:id", asyncHandler(assetsController.updateAsset.bind(assetsController)));

// GET /assets/:id/bitacora - Obtener bitácora de un asset
router.get("/:id/bitacora", asyncHandler(assetsController.getBitacora.bind(assetsController)));

// POST /assets/:id/bitacora - Agregar entrada manual a bitácora
router.post("/:id/bitacora", asyncHandler(assetsController.addBitacoraEntry.bind(assetsController)));

export default router;