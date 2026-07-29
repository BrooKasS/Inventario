import { Router } from "express";
import importRoutes from "./import.routes";
import assetsRoutes from "./assets.routes";
import authRoutes from "../../auth/auth.routes";
import ocsroutes from "./ocs.routes";
import mobileStagingRoutes from "./mobileStaging.routes";
import certificadosSslRoutes from "./certificadosSsl.routes";

const router = Router();

router.use("/auth", authRoutes); 
router.use("/import", importRoutes);
router.use("/ocs", ocsroutes);
router.use("/assets", assetsRoutes);
router.use("/mobile-staging", mobileStagingRoutes);
router.use("/certificados-ssl", certificadosSslRoutes);


export default router;




