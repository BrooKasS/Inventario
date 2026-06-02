import { Router } from "express";
import { ocsController } from "../controllers/ocs.controller";
import { asyncHandler } from "../../middlewares/errorHandler";
import { requireAdmin } from "../../middlewares/requireAdmin";

const router = Router();

router.get("/status", asyncHandler(ocsController.getStatus.bind(ocsController)));
router.post("/sync", requireAdmin, asyncHandler(ocsController.syncNow.bind(ocsController)));
router.get("/software/all", asyncHandler(ocsController.getAllSoftware.bind(ocsController)));
router.get("/software/:assetId", asyncHandler(ocsController.getSoftwareByAsset.bind(ocsController)));
router.get("/debug-ips", asyncHandler(ocsController.debugOcsIps.bind(ocsController)));
router.get("/debug-unmapped", asyncHandler(ocsController.debugUnmapped.bind(ocsController)));
router.get("/unmatched", asyncHandler(ocsController.getUnmatched.bind(ocsController)));

export default router;