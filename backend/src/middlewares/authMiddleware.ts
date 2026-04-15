import { Request, Response, NextFunction } from "express";
import { authService } from "../auth/auth.service";

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // ✅ Rutas públicas (SIN TOKEN)
  const rutasPublicas = [
    "/api/auth/login",
    "/health",
  ];

  // ✅ Permitir:
  // - login
  // - health
  // - GET asset público para firma
  // - POST firmar acta
  if (
    rutasPublicas.includes(req.path) ||
    req.path.match(/^\/api\/assets\/public\/[^/]+$/) ||
    req.path.match(/^\/api\/assets\/[^/]+\/firmar$/)
  ) {
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
    const payload = authService.verificarToken(token);
    (req as any).usuario = payload.usuario;
    (req as any).nombre = payload.nombre;
    next();
  } catch {
    return res.status(401).json({
      success: false,
      error: "Token inválido o expirado — inicia sesión nuevamente",
    });
  }
}