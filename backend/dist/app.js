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
exports.app = (0, express_1.default)();
// Middlewares
exports.app.use((0, cors_1.default)());
exports.app.use(express_1.default.json({ limit: "10mb" }));
exports.app.use(express_1.default.urlencoded({ extended: true }));
// Health check
exports.app.get("/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});
// API Routes
exports.app.use("/api", routes_1.default);
// Error handler (debe ir al final)
exports.app.use(errorHandler_1.errorHandler);
