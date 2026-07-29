import { Router } from "express";
import { certificadosSslController } from "../controllers/certificadosSsl.controller";
import { asyncHandler } from "../../middlewares/errorHandler";
import { requireAdmin } from "../../middlewares/requireAdmin";

const router = Router();

// Lectura
router.get("/",           asyncHandler(certificadosSslController.getAll.bind(certificadosSslController)));
router.get("/:id",        asyncHandler(certificadosSslController.getById.bind(certificadosSslController)));

// Escritura — solo ADMIN
router.post("/",          requireAdmin, asyncHandler(certificadosSslController.create.bind(certificadosSslController)));
router.patch("/:id",      requireAdmin, asyncHandler(certificadosSslController.update.bind(certificadosSslController)));
router.delete("/:id",     requireAdmin, asyncHandler(certificadosSslController.delete.bind(certificadosSslController)));

export default router;

