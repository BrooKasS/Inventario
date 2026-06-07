import { Router } from "express";
import {authMiddleware} from "../../middlewares/authMiddleware"; 
import { requireAdmin } from "../../middlewares/requireAdmin"; 
import {
  crearStaging,
  listarStaging,
  buscarStaging,
  statsStaging,
  marcarUsado,
  eliminarStaging,
} from "../controllers/mobileStaging.controller";

const router = Router();

// Todas las rutas requieren JWT + ADMIN
router.use(authMiddleware, requireAdmin);

router.post("/",                    crearStaging);
router.get("/",                     listarStaging);
router.get("/search",               buscarStaging);   // ← ANTES de /:serial
router.get("/stats",                statsStaging);    // ← ANTES de /:serial
router.patch("/:serial/usado",      marcarUsado);
router.delete("/:id",               eliminarStaging);

export default router;