import { Router } from "express";
import importRoutes from "./import.routes";
import assetsRoutes from "./assets.routes";

const router = Router();

router.use("/import", importRoutes);
router.use("/assets", assetsRoutes);

export default router;