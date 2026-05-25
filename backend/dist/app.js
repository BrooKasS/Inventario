"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const routes_1 = __importDefault(require("./api/routes"));
const errorHandler_1 = require("./middlewares/errorHandler");
const authMiddleware_1 = require("./middlewares/authMiddleware");
const assets_controller_1 = require("./api/controllers/assets.controller");
exports.app = (0, express_1.default)();
// ✅ CORS restringido
exports.app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL ?? "http://localhost:5173",
    credentials: true,
}));
exports.app.use(express_1.default.json({ limit: "10mb" }));
exports.app.use(express_1.default.urlencoded({ extended: true }));
// Health check (sin autenticación)
exports.app.get("/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});
// 🧪 TEST: Endpoints de prueba SIN autenticación
exports.app.post("/api/assets/test-email", assets_controller_1.assetsController.testEmail.bind(assets_controller_1.assetsController));
exports.app.post("/api/assets/test-firma-email", assets_controller_1.assetsController.testFirmaEmail.bind(assets_controller_1.assetsController));
exports.app.use(authMiddleware_1.authMiddleware);
exports.app.use("/api", routes_1.default);
// ✅ errorHandler UNA sola vez
exports.app.use(errorHandler_1.errorHandler);
