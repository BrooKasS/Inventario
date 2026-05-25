"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
const auth_service_1 = require("../auth/auth.service");
function authMiddleware(req, res, next) {
    const rutasPublicas = [
        "/api/auth/login",
        "/health",
    ];
    // ✅ Permitir login, health, lectura pública de activos y firma pública
    if (rutasPublicas.includes(req.path) ||
        (req.path.match(/^\/api\/assets\/[^/]+$/) && req.method === "GET") ||
        req.path.match(/^\/api\/assets\/[^/]+\/firmar$/)) {
        return next();
    }
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            success: false,
            error: "No autorizado — token requerido",
        });
    }
    const token = authHeader.split(" ")[1];
    try {
        const payload = auth_service_1.authService.verificarToken(token);
        // ✅ NUEVO: Verificar si el token fue revocado (sesión en otro dispositivo)
        if (auth_service_1.authService.estaTokenRevocado(token)) {
            return res.status(401).json({
                success: false,
                error: "Sesión expirada en otro dispositivo — inicia sesión nuevamente",
            });
        }
        req.usuario = payload.usuario;
        req.nombre = payload.nombre;
        req.rol = payload.rol ?? "AUDITOR";
        next();
    }
    catch {
        return res.status(401).json({
            success: false,
            error: "Token inválido o expirado — inicia sesión nuevamente",
        });
    }
}
