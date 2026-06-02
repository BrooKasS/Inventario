import { Router } from "express";
import importRoutes from "./import.routes";
import assetsRoutes from "./assets.routes";
import authRoutes from "../../auth/auth.routes";
import ocsroutes from "./ocs.routes";

const router = Router();

router.use("/auth", authRoutes); 
router.use("/import", importRoutes);
router.use("/ocs", ocsroutes);
router.use("/assets", assetsRoutes);


export default router;




