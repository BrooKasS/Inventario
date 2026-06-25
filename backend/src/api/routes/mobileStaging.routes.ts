import { Router } from "express";
import { authMiddleware } from "../../middlewares/authMiddleware";
import { requireAdmin }   from "../../middlewares/requireAdmin";
import {
  crearStaging,
  listarStaging,
  buscarStaging,
  statsStaging,
  marcarUsado,
  eliminarStaging,
  forzarEliminarStaging,
  editarStaging,
  obtenerOpciones,
} from "../controllers/mobileStaging.controller";

const router = Router();

router.use(authMiddleware, requireAdmin);

router.post("/",                     crearStaging);
router.get("/",                      listarStaging);
router.get("/search",                buscarStaging);      
router.get("/stats",                 statsStaging);
router.get("/opciones", authMiddleware, obtenerOpciones);         
router.patch("/:serial/usado",       marcarUsado);          
router.patch("/:id",                 editarStaging);        
router.delete("/:id/force",          forzarEliminarStaging);
router.delete("/:id",                eliminarStaging);
export default router;