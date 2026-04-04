import { Request, Response } from "express";
import { Router } from "express";
import { assetsService } from "../services/assets.service";
import { ApiResponse } from "../../types/api.types";
import { sendToFlow } from "../utils/flow";
import { mapAssetsToFlowPayload, toFlowTipo } from "../utils/flowMappers";
import { sanitizePayloadForFlow } from "../utils/flowSanitizer";
import { generarWordMovil } from "../utils/generarMovilDocx";
import { generarExcelInventario } from "../utils/ExportInventario";
import { generarExcelObservaciones } from "../utils/exportObservaciones"
const r = Router();

export class AssetsController {

  // GET /assets
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

  // GET /assets/stats
  async getStats(req: Request, res: Response) {
    const stats = await assetsService.getStats();

    res.json({
      success: true,
      data: stats,
    } as ApiResponse<typeof stats>);
  }

  // GET /assets/deleted
  async getDeleted(req: Request, res: Response) {
    const assets = await assetsService.getDeleted();

    res.json({
      success: true,
      data: assets,
    } as ApiResponse<typeof assets>);
  }

  // GET /assets/:id
  async getAssetById(req: Request, res: Response) {
    const id = req.params.id as string;
    const asset = await assetsService.getAssetById(id);

    res.json({
      success: true,
      data: asset,
    } as ApiResponse<typeof asset>);
  }

  // POST /assets
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

  // PATCH /assets/:id
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

  // DELETE /assets/:id
  async deleteAsset(req: Request, res: Response) {
    const  id  = req.params.id as string;
   const autor = req.body.autor as string | undefined;

    const asset = await assetsService.softDelete(id, autor ?? "Sistema");

    res.json({
      success: true,
      data: asset,
      message: "Activo movido a papelera.",
    } as ApiResponse<typeof asset>);
  }

  // POST /assets/:id/restore
  async restoreAsset(req: Request, res: Response) {
    const  id  = req.params.id as string;
     const autor = req.body.autor as string | undefined;

    const asset = await assetsService.restoreAsset(id, autor ?? "Sistema");

    res.json({
      success: true,
      data: asset,
      message: "Activo restaurado correctamente.",
    } as ApiResponse<typeof asset>);
  }

  // GET /assets/:id/bitacora
  async getBitacora(req: Request, res: Response) {
    const id = req.params.id as string;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
    const bitacora = await assetsService.getBitacora(id, limit);

    res.json({
      success: true,
      data: bitacora,
    } as ApiResponse<typeof bitacora>);
  }

  // POST /assets/:id/bitacora
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



  // ─── AGREGAR en assets.controller.ts ───────────────────────────────
// Importar al inicio del archivo:
// import { generarWordMovil } from "../../utils/generarWordMovil";

  async generarWord(req: Request, res: Response) {
    try {
     const id = req.params.id as string;
      const asset = await assetsService.getAssetById(id);

      if (!asset || asset.tipo !== "MOVIL") {
        return res.status(400).json({ success: false, error: "Activo no es de tipo MOVIL" });
      }

      const m = asset.movil;
      const buffer = await generarWordMovil({
        nombre:                  asset.nombre,
        numeroCaso:              m?.numeroCaso              ?? null,
        region:                  m?.region                 ?? null,
        dependencia:             m?.dependencia            ?? null,
        sede:                    m?.sede                   ?? null,
        cedula:                  m?.cedula                 ?? null,
        usuarioRed:              m?.usuarioRed             ?? null,
        uni:                     m?.uni                    ?? null,
        marca:                   m?.marca                  ?? null,
        modelo:                  m?.modelo                 ?? null,
        serial:                  m?.serial                 ?? null,
        imei1:                   m?.imei1                  ?? null,
        imei2:                   m?.imei2                  ?? null,
        sim:                     m?.sim                    ?? null,
        numeroLinea:             m?.numeroLinea            ?? null,
        fechaEntrega:            m?.fechaEntrega           ?? null,
        observacionesEntrega:    m?.observacionesEntrega   ?? null,
        fechaDevolucion:         m?.fechaDevolucion        ?? null,
        observacionesDevolucion: m?.observacionesDevolucion ?? null,
      });

      const nombre = `FR-GTE-02-044_${(asset.nombre ?? "movil").replace(/\s+/g, "_")}.docx`;

      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
      res.setHeader("Content-Disposition", `attachment; filename="${nombre}"`);
      res.setHeader("Content-Length", buffer.length);
      return res.send(buffer);

    } catch (error: any) {
      console.error("❌ Error generando Word:", error);
      return res.status(500).json({ success: false, error: "Error generando el documento" });
    }
  }


// ─── AGREGAR en assets.routes.ts ───────────────────────────────────
// ANTES de la ruta /:id para evitar conflictos:
// router.get("/:id/word", assetsController.generarWord);

  // POST /assets/sync-excel
  async syncExcel(req: Request, res: Response) {
    try {
      console.log("[syncExcel] Headers:", req.headers);
      console.log("[syncExcel] Body:", req.body);

      const { tipo, ids } = req.body || {};
      if (!tipo) {
        return res.status(400).json({
          success: false,
          error: "El campo 'tipo' es requerido (SERVIDOR|RED|UPS|BASE_DATOS o TServidores|TRedes|TUPS|TBD)",
        } as ApiResponse<never>);
      }

      if (!process.env.FLOW_URL) {
        console.error("[syncExcel] Falta FLOW_URL en .env");
        return res.status(500).json({
          success: false,
          error: "Falta configurar FLOW_URL en .env",
        } as ApiResponse<never>);
      }

      const t = String(tipo).toUpperCase();
      const dbTipo: "SERVIDOR" | "RED" | "UPS" | "BASE_DATOS" =
        t === "TSERVIDORES" ? "SERVIDOR"   :
        t === "TREDES"      ? "RED"        :
        t === "TUPS"        ? "UPS"        :
        t === "TBD"         ? "BASE_DATOS" :
                              (t as any);

      console.log("[syncExcel] dbTipo:", dbTipo, "ids:", ids);

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

      const payload      = mapAssetsToFlowPayload(tipo, assets);
      const cleanPayload = sanitizePayloadForFlow(payload);

      console.log("[syncExcel] payload preview:", JSON.stringify(cleanPayload).slice(0, 350), "...");

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
 async exportExcel(req: Request, res: Response) {
  try {
    const tipos: string[] = req.body.tipos ?? [];
    const ids: string[]   = req.body.ids   ?? [];

    let assets: any[] = [];
    if (ids.length > 0) {
      assets = await assetsService.getAssetsByTipoAndIds({ ids });
    } else if (tipos.length > 0) {
      for (const tipo of tipos) {
        const r = await assetsService.getAssetsByTipoAndIds({ tipo });
        assets = assets.concat(r);
      }
    } else {
      for (const tipo of ["SERVIDOR", "RED", "UPS", "BASE_DATOS"]) {
        const r = await assetsService.getAssetsByTipoAndIds({ tipo });
        assets = assets.concat(r);
      }
    }

    if (assets.length === 0) {
      return res.status(404).json({ success: false, error: "No hay activos para exportar" });
    }

    const buffer = await generarExcelInventario(assets);
    const fecha  = new Date().toISOString().slice(0, 10);

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="Inventario_TI_${fecha}.xlsx"`);
    res.setHeader("Content-Length", buffer.length);
    return res.send(buffer);

  } catch (error: any) {
    console.error("❌ Error exportando Excel:", error);
    return res.status(500).json({ success: false, error: "Error generando el Excel" });
  }
}

   async exportObservaciones(req: Request, res: Response) {
    try {
      const { rows, incluirTecnicos } = req.body;
 
      if (!rows || !Array.isArray(rows) || rows.length === 0) {
        return res.status(400).json({ success: false, error: "No hay observaciones para exportar" });
      }
 
      const buffer = await generarExcelObservaciones({
        rows,
        incluirTecnicos: incluirTecnicos ?? false,
      });
 
      const fecha = new Date().toISOString().slice(0, 10);
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename="Observaciones_${fecha}.xlsx"`);
      res.setHeader("Content-Length", buffer.length);
      return res.send(buffer);
 
    } catch (error: any) {
      console.error("❌ Error exportando observaciones:", error);
      return res.status(500).json({ success: false, error: "Error generando el Excel de observaciones" });
    }
  }
 
  
}

export const assetsController = new AssetsController();