"use strict";
/**
 * auth.controller.ts
 * Recibe el request HTTP de login, llama al service,
 * devuelve el token o un error claro.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = exports.AuthController = void 0;
const auth_service_1 = require("./auth.service");
class AuthController {
    /**
     * POST /api/auth/login
     * Body: { usuario: string, password: string }
     * Respuesta OK:    { success: true, token, nombre }
     * Respuesta error: { success: false, error: "Credenciales incorrectas" }
     */
    async login(req, res) {
        const { usuario, password } = req.body;
        if (!usuario || !password) {
            return res.status(400).json({
                success: false,
                error: "Usuario y contraseña son requeridos",
            });
        }
        try {
            const { token, nombre } = await auth_service_1.authService.login(usuario, password);
            return res.json({
                success: true,
                token,
                usuario,
                nombre, // ✅ NUEVO: Devolver el nombre completo
            });
        }
        catch (error) {
            // Siempre devolver 401 con mensaje genérico
            // (no revelar si el usuario existe o no)
            return res.status(401).json({
                success: false,
                error: "Credenciales incorrectas",
            });
        }
    }
}
exports.AuthController = AuthController;
exports.authController = new AuthController();
