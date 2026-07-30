import { Router } from "express";
import { backupReportsController } from "../controllers/backupReports.controller";
import { asyncHandler } from "../../middlewares/errorHandler";
import { requireAdmin } from "../../middlewares/requireAdmin";

const router = Router();

const TIPOS_VALIDOS = ["diario", "semanal", "mensual", "kpi"];

router.param("tipo", (req, res, next, tipo) => {
  if (!TIPOS_VALIDOS.includes(tipo)) {
    return res.status(400).json({
      success: false,
      error: `Tipo de informe inválido: ${tipo}`,
    });
  }
  next();
});

// Lectura
router.get("/:tipo/runs", asyncHandler(backupReportsController.listRuns.bind(backupReportsController)));
router.get("/:tipo/runs/:runId", asyncHandler(backupReportsController.getRun.bind(backupReportsController)));
router.get(
  "/:tipo/runs/:runId/excel",
  asyncHandler(backupReportsController.downloadExcel.bind(backupReportsController))
);

// Escritura
router.post("/:tipo/runs", asyncHandler(backupReportsController.createRun.bind(backupReportsController)));
router.post(
  "/:tipo/runs/:runId/enviar",
  asyncHandler(backupReportsController.sendRun.bind(backupReportsController))
);
router.delete(
  "/:tipo/runs/:runId",
  requireAdmin,
  asyncHandler(backupReportsController.deleteRun.bind(backupReportsController))
);

export default router;
