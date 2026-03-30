import { Request, Response, NextFunction } from "express";

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
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
export const asyncHandler =
  (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };