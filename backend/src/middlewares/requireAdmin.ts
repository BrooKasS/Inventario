import { Request, Response, NextFunction } from "express";

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const rol = (req as any).rol;

  if (rol !== "ADMIN") {
    return res.status(403).json({
      success: false,
      error: "No tienes permisos para realizar esta acción.",
    });
  }

  next();
}
