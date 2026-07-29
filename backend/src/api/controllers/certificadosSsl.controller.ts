import { Request, Response } from "express";
import { assetsService } from "../services/assets.service";
import { ApiResponse } from "../../types/api.types";
import { CertificadoSslApp } from "../../entities/CertificadoSslApp";
export class CertificadosSslController {

  // GET /certificados-ssl
  async getAll(req: Request, res: Response) {
    const filters = {
      tipo: "CERTIFICADO_SSL" as any,
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

  // GET /certificados-ssl/:id
  async getById(req: Request, res: Response) {
    const id = req.params.id as string;
    const asset = await assetsService.getAssetById(id);

    if (!asset || asset.tipo !== "CERTIFICADO_SSL") {
      return res.status(404).json({
        success: false,
        error: "Certificado SSL no encontrado",
      });
    }

    res.json({
      success: true,
      data: asset,
    } as ApiResponse<typeof asset>);
  }

  // POST /certificados-ssl
  async create(req: Request, res: Response) {
    const data = req.body;

    if (!data.nombre) {
      return res.status(400).json({
        success: false,
        error: "El campo nombre es requerido",
      });
    }

    try {
      const autor = (req as any).usuario ?? "Sistema";
      const asset = await assetsService.createAsset(
        { ...data, tipo: "CERTIFICADO_SSL" },
        autor
      );

      res.status(201).json({
        success: true,
        data: asset,
        message: "Certificado SSL creado correctamente",
      });
    } catch (error: any) {
      if (error.message && error.message.includes("Validación fallida")) {
        return res.status(400).json({
          success: false,
          error: error.message,
        });
      }
      throw error;
    }
  }

  // PATCH /certificados-ssl/:id
  async update(req: Request, res: Response) {
    const id = req.params.id as string;
    const data = req.body;

    const autor = (req as any).usuario ?? "Sistema";
    const asset = await assetsService.updateAsset(id, data, autor);

    res.json({
      success: true,
      data: asset,
      message: "Certificado SSL actualizado correctamente",
    } as ApiResponse<typeof asset>);
  }

  // DELETE /certificados-ssl/:id
  async delete(req: Request, res: Response) {
    const id = req.params.id as string;
    const autor = (req as any).usuario ?? "Sistema";
    const motivo = req.body.motivo ?? "Sin motivo";

    const asset = await assetsService.softDelete(id, autor, motivo);

    res.json({
      success: true,
      data: asset,
      message: "Certificado SSL movido a papelera.",
    } as ApiResponse<typeof asset>);
  }
}

export const certificadosSslController = new CertificadosSslController();

