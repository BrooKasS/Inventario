import { Request, Response } from "express";
import { Router } from "express";
import { assetsService } from "../services/assets.service";
import { ApiResponse } from "../../types/api.types";
import { sendToFlow } from "../utils/flow";
import { mapAssetsToFlowPayload, toFlowTipo } from "../utils/flowMappers";
import { sanitizePayloadForFlow } from "../utils/flowSanitizer";
import { prisma } from "../../config/database";



const r = Router();

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
  async createAsset(req: Request, res: Response) {
  const data = req.body;
  if (!data.tipo || !data.nombre) {
    return res.status(400).json({
      success: false,
      error: "Los campos tipo y nombre son requeridos",
    });
  }
  const asset = await assetsService.createAsset(data, "Sistema");
  res.status(201).json({
    success: true,
    data: asset,
    message: "Activo creado correctamente",
  });
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
  
// POST /assets/sync-excel
async syncExcel(req: Request, res: Response) {
  try {
    // Logs de diagnóstico (puedes quitarlos después)
    console.log("[syncExcel] Headers:", req.headers);
    console.log("[syncExcel] Body:", req.body);

    const { tipo, ids } = req.body || {};
    if (!tipo) {
      return res.status(400).json({
        success: false,
        error:
          "El campo 'tipo' es requerido (SERVIDOR|RED|UPS|BASE_DATOS o TServidores|TRedes|TUPS|TBD)",
      } as ApiResponse<never>);
    }

    if (!process.env.FLOW_URL) {
      console.error("[syncExcel] Falta FLOW_URL en .env");
      return res.status(500).json({
        success: false,
        error: "Falta configurar FLOW_URL en .env",
      } as ApiResponse<never>);
    }

    // Normaliza tipo para consultar en BD
    const t = String(tipo).toUpperCase();
    const dbTipo: "SERVIDOR" | "RED" | "UPS" | "BASE_DATOS" =
      t === "TSERVIDORES" ? "SERVIDOR" :
      t === "TREDES"       ? "RED"      :
      t === "TUPS"         ? "UPS"      :
      t === "TBD"          ? "BASE_DATOS" :
                             (t as any);

    console.log("[syncExcel] dbTipo:", dbTipo, "ids:", ids);

    // Obtiene assets (con includes)
    const assets = await assetsService.getAssetsByTipoAndIds({
      tipo: dbTipo,
      ids: Array.isArray(ids) ? ids : undefined,
    });
    console.log("[syncExcel] assets count:", assets.length);

    if (assets.length === 0) {
      return res.status(404).json({
        success: false,
        error: `No hay assets para tipo=${dbTipo}${ids?.length ? ` con ids=[${ids.join(",")}]` : ""}`,
      } as ApiResponse<never>);
    }

    // Mapea -> sanitiza (convierte null/undefined a "", números/fechas a string)
    const payload = mapAssetsToFlowPayload(tipo, assets);
    const cleanPayload = sanitizePayloadForFlow(payload);

    console.log(
      "[syncExcel] payload preview:",
      JSON.stringify(cleanPayload).slice(0, 350),
      "..."
    );

    // Envía al Flow (ya sin nulls)
    const flowResp = await sendToFlow(cleanPayload);
    console.log("[syncExcel] flowResp:", flowResp);

    return res.json({
      success: true,
      data: { sent: cleanPayload, flowResp },
      message: `Sincronizados ${cleanPayload.assets.length} registros a ${toFlowTipo(tipo)}`,
    } as ApiResponse<any>);
  } catch (e: any) {
    console.error("[syncExcel] ERROR:", e?.message, e?.stack);
    return res.status(500).json({
      success: false,
      error: e?.message || "Error interno del servidor",
    } as ApiResponse<never>);
  }
}

}

export const assetsController = new AssetsController();