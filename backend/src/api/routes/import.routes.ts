import { Router } from "express";
import multer from "multer";
import { importController } from "../controllers/import.controller";
import { asyncHandler } from "../../middlewares/errorHandler";
import path from "path";
import fs from "fs";

const router = Router();

const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  dest: uploadDir,
  limits: { fileSize: 10 * 1024 * 1024 },
});

router.post(
  "/",
  upload.single("file"),
  asyncHandler(importController.importExcel.bind(importController))
);

export default router;