/**
 * auth.controller.ts
 * Recibe el request HTTP de login, llama al service,
 * devuelve el token o un error claro.
 */

import { Request, Response } from "express";
import { authService } from "./auth.service";

export class AuthController {

  /**
   * POST /api/auth/login
   * Body: { usuario: string, password: string }
   * Respuesta OK:    { success: true, token, nombre }
   * Respuesta error: { success: false, error: "Credenciales incorrectas" }
   */
  async login(req: Request, res: Response) {
    const { usuario, password } = req.body;

    if (!usuario || !password) {
      return res.status(400).json({
        success: false,
        error: "Usuario y contraseña son requeridos",
      });
    }

    try {
      const token = await authService.login(usuario, password);

      return res.json({
        success: true,
        token,
        usuario,
      });

    } catch (error: any) {
      // Siempre devolver 401 con mensaje genérico
      // (no revelar si el usuario existe o no)
      return res.status(401).json({
        success: false,
        error: "Credenciales incorrectas",
      });
    }
  }
}

export const authController = new AuthController();