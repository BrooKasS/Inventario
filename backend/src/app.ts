import express from "express";
import cors from "cors";
import routes from "./api/routes";
import { errorHandler } from "./middlewares/errorHandler";
import { authMiddleware } from "./middlewares/authMiddleware";
import { assetsController } from "./api/controllers/assets.controller";

export const app = express();

// ✅ CORS restringido
app.use(cors({
  origin: process.env.FRONTEND_URL ?? "http://localhost:5173",
  credentials: true,
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Health check (sin autenticación)
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// 🧪 TEST: Endpoints de prueba SIN autenticación
app.post("/api/assets/test-email", assetsController.testEmail.bind(assetsController));
app.post("/api/assets/test-firma-email", assetsController.testFirmaEmail.bind(assetsController));

app.use(authMiddleware);
app.use("/api", routes);

// ✅ errorHandler UNA sola vez
app.use(errorHandler);