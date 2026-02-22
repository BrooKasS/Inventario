import express from "express";
import cors from "cors";
import routes from "./api/routes";
import { errorHandler } from "./middlewares/errorHandler";

export const app = express();

// Middlewares
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API Routes
app.use("/api", routes);

// Error handler (debe ir al final)
app.use(errorHandler);