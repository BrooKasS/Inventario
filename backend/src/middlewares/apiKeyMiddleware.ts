import { Request, Response, NextFunction } from "express";

export function apiKeyMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const key = req.headers["x-api-key"];

  if (!key || key !== process.env.COMPANION_API_KEY) {
    return res.status(401).json({
      success: false,
      error: "API key inválida o ausente",
    });
  }

  next();
}