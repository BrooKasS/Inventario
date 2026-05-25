"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdmin = requireAdmin;
function requireAdmin(req, res, next) {
    const rol = req.rol;
    if (rol !== "ADMIN") {
        return res.status(403).json({
            success: false,
            error: "No tienes permisos para realizar esta acción.",
        });
    }
    next();
}
