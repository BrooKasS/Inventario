"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncHandler = void 0;
exports.errorHandler = errorHandler;
function errorHandler(err, req, res, next) {
    console.error("❌ Error:", err);
    // Error de validación
    if (err.name === "ValidationError") {
        return res.status(400).json({
            success: false,
            error: err.message,
        });
    }
    // Error de registro no encontrado (TypeORM)
    if (err.name === "EntityNotFoundError") {
        return res.status(404).json({
            success: false,
            error: "Registro no encontrado",
        });
    }
    // Error genérico
    return res.status(500).json({
        success: false,
        error: "Error interno del servidor",
        message: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
}
// Wrapper para handlers async
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};
exports.asyncHandler = asyncHandler;
