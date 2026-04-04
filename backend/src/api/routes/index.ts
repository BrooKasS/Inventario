import { Router } from "express";
import importRoutes from "./import.routes";
import assetsRoutes from "./assets.routes";
import authRoutes from "../../auth/auth.routes";

const router = Router();

router.use("/auth", authRoutes); 
router.use("/import", importRoutes);
router.use("/assets", assetsRoutes);

export default router;