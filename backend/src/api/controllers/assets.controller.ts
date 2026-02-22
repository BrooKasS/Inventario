import { Request, Response } from "express";
import { assetsService } from "../services/assets.service";
import { ApiResponse } from "../../types/api.types";

export class AssetsController {
  async getAssets(req: Request, res: Response) {
    const filters = {
      tipo: req.query.tipo as any,
      q: (req.query.q as string) || undefined,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
    };

    const result = await assetsService.getAssets(filters);

    res.json({
      success: true,
      data: result,
    } as ApiResponse<typeof result>);
  }

  async getAssetById(req: Request, res: Response) {
    const id = req.params.id as string;
    const asset = await assetsService.getAssetById(id);

    res.json({
      success: true,
      data: asset,
    } as ApiResponse<typeof asset>);
  }

  async updateAsset(req: Request, res: Response) {
  const id = req.params.id as string;
  const data = req.body;

  const asset = await assetsService.updateAsset(id, data, "Sistema");

  res.json({
    success: true,
    data: asset,
    message: "Asset actualizado correctamente",
  } as ApiResponse<typeof asset>);
}

  async getBitacora(req: Request, res: Response) {
    const id = req.params.id as string;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;

    const bitacora = await assetsService.getBitacora(id, limit);

    res.json({
      success: true,
      data: bitacora,
    } as ApiResponse<typeof bitacora>);
  }

  // Observaciones manuales — el usuario ingresa su nombre como autor
  async addBitacoraEntry(req: Request, res: Response) {
    const id = req.params.id as string;
    const { autor, tipoEvento, descripcion } = req.body;

    if (!autor || !tipoEvento || !descripcion) {
      return res.status(400).json({
        success: false,
        error: "Los campos autor, tipoEvento y descripcion son requeridos",
      } as ApiResponse<never>);
    }

    const entry = await assetsService.addBitacoraEntry(id, {
      autor,
      tipoEvento,
      descripcion,
    });

    res.json({
      success: true,
      data: entry,
      message: "Observación agregada correctamente",
    } as ApiResponse<typeof entry>);
  }

  async getStats(req: Request, res: Response) {
    const stats = await assetsService.getStats();

    res.json({
      success: true,
      data: stats,
    } as ApiResponse<typeof stats>);
  }
}

export const assetsController = new AssetsController();