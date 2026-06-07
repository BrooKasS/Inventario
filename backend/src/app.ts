import express from "express";
import cors from "cors";
import routes from "./api/routes";
import { errorHandler } from "./middlewares/errorHandler";
import { authMiddleware } from "./middlewares/authMiddleware";
import { assetsController } from "./api/controllers/assets.controller";
import { asyncHandler } from "./middlewares/errorHandler";
import externalRoutes from "./api/routes/external.routes";
import { apiKeyMiddleware } from "./middlewares/apiKeyMiddleware";
import { importController } from "./api/controllers/import.controller";

export const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL ?? "http://localhost:5173",
  credentials: true,
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ── Health check — sin auth ──
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});
app.use("/api/external", apiKeyMiddleware, externalRoutes);

// ── Rutas públicas — ANTES del authMiddleware ──────────────────
app.get(
  "/api/assets/public/:id",
  asyncHandler(assetsController.getAssetById.bind(assetsController))
);
app.post(
  "/api/assets/:id/firmar",
  asyncHandler(assetsController.firmarMovil.bind(assetsController))
);
app.post(
  "/api/assets/:id/firmar-devolucion",
  asyncHandler(assetsController.firmarDevolucion.bind(assetsController))
);

// ── Test endpoints — sin auth ──
app.post("/api/assets/test-email", assetsController.testEmail.bind(assetsController));
app.post("/api/assets/test-firma-email", assetsController.testFirmaEmail.bind(assetsController));
import multer from "multer";
const upload = multer({ dest: "uploads/" });
app.post("/api/import", upload.single("file"), asyncHandler(importController.importExcel.bind(importController)));


// ── Auth global — aplica a todo lo demás ──
app.use(authMiddleware);
app.use("/api", routes);

app.use(errorHandler);