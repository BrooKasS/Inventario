import { Request, Response } from "express";
import { Router } from "express";
import { assetsService } from "../services/assets.service";
import { ApiResponse } from "../../types/api.types";
import { sendToFlow } from "../utils/flow";
import { mapAssetsToFlowPayload, toFlowTipo } from "../utils/flowMappers";
import { sanitizePayloadForFlow } from "../utils/flowSanitizer";
import { generarPdfMovil } from "../utils/generarMovilDocx";
import { generarExcelInventario } from "../utils/ExportInventario";
import * as XLSX from "xlsx";
import { generarExcelObservaciones } from "../utils/exportObservaciones";
import { sendMovilEmail } from "../utils/sendMovilEmail";
import { ocsService } from "../services/ocs.service";
import { generarExcelOCS } from "../utils/exportOCSInventario";
import { validateAssetData } from "../utils/validationRules";
import { Bitacora } from "../../entities/Bitacora";
import { AppDataSource } from "../../config/database";


const r = Router();


export class AssetsController {

  // GET /assets
  async getAssets(req: Request, res: Response) {
    const filters = {
      tipo: req.query.tipo as any,
      tipos: req.query.tipos ? (Array.isArray(req.query.tipos) ? req.query.tipos as any : [req.query.tipos as any]) : undefined,
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

    try {
      const autor = (req as any).usuario ?? "Sistema";
      const asset = await assetsService.createAsset(data, autor);

      res.status(201).json({
        success: true,
        data: asset,
        message: "Activo creado correctamente",
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

  // PATCH /assets/:id
  async updateAsset(req: Request, res: Response) {
    const id = req.params.id as string;
    const data = req.body;

    const autor = (req as any).usuario ?? "Sistema";
    const asset = await assetsService.updateAsset(id, data, autor);

    res.json({
      success: true,
      data: asset,
      message: "Asset actualizado correctamente",
    } as ApiResponse<typeof asset>);
  }

  // DELETE /assets/:id
  async deleteAsset(req: Request, res: Response) {
    const  id  = req.params.id as string;
   const autor = (req as any).usuario ?? "Sistema";
    const motivo = req.body.motivo ?? "Sin motivo";

    const asset = await assetsService.softDelete(id, autor, motivo);

    res.json({
      success: true,
      data: asset,
      message: "Activo movido a papelera.",
    } as ApiResponse<typeof asset>);
  }

  // POST /assets/:id/restore
  async restoreAsset(req: Request, res: Response) {
    const  id  = req.params.id as string;
     const autor = (req as any).usuario ?? "Sistema";

    const asset = await assetsService.restoreAsset(id, autor);

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
async deleteBitacoraEntry(req: Request, res: Response) {
  const bitacoraId = req.params.bitacoraId as string;
  const bitacoraRepository = AppDataSource.getRepository(Bitacora);
  await bitacoraRepository.delete(bitacoraId);
  res.json({ success: true, message: "Eliminado" });
}

  // POST /assets/:id/bitacora
  async addBitacoraEntry(req: Request, res: Response) {
    const id = req.params.id as string;
    const { tipoEvento, descripcion } = req.body;
    const autor = (req as any).usuario ?? "Sistema";

    if (!tipoEvento || !descripcion) {
      return res.status(400).json({
        success: false,
        error: "Los campos tipoEvento y descripcion son requeridos",
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
      const buffer = await generarPdfMovil({
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
        firmaPath:              m?.firmaPath             ?? null,
        fechaFirma:             m?.fechaFirma            ?? null,
      });

      const nombre = `FR-GTE-02-044_${(asset.nombre ?? "movil").replace(/\s+/g, "_")}.pdf`;

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
    const movilExportMode = req.body.movilExportMode === "escaneados" ? "escaneados" : "usuario";

    let assets: any[] = [];
    if (ids.length > 0) {
      assets = await assetsService.getAssetsByTipoAndIds({ ids });
    } else if (tipos.length > 0) {
      for (const tipo of tipos) {
        const r = await assetsService.getAssetsByTipoAndIds({ tipo });
        assets = assets.concat(r);
      }
    } else {
      for (const tipo of ["SERVIDOR", "RED", "UPS", "BASE_DATOS", "VPN", "MOVIL", "CERTIFICADO_SSL"]) {
        const r = await assetsService.getAssetsByTipoAndIds({ tipo });
        assets = assets.concat(r);
      }
    }

    if (assets.length === 0) {
      return res.status(404).json({ success: false, error: "No hay activos para exportar" });
    }

    const buffer = await generarExcelInventario(assets, { movilExportMode });
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

  async exportExcelSingle(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ success: false, error: "Falta el id del activo" });
      }

      const assets = await assetsService.getAssetsByTipoAndIds({ ids: [id] as string[] });

      if (!assets || assets.length === 0) {
        return res.status(404).json({ success: false, error: "Activo no encontrado" });
      }

            const asset = assets[0];
      const camposExcluidos = new Set(["id", "createdAt", "updatedAt", "deletedAt", "creadoEn"]);
      const filas: [string, string][] = [];

      function aplanarActivo(obj: any, prefijo = ""): void {
        if (obj === null || obj === undefined || typeof obj !== "object") return;
        for (const [clave, valor] of Object.entries(obj)) {
          if (camposExcluidos.has(clave)) continue;
          if (valor === null || valor === undefined || valor === "") continue;
          const etiqueta = prefijo ? `${prefijo} - ${clave}` : clave;
          if (Array.isArray(valor)) {
            if (valor.length === 0) continue;
            filas.push([etiqueta, JSON.stringify(valor)]);
          } else if (typeof valor === "object") {
            aplanarActivo(valor, etiqueta);
          } else {
            filas.push([etiqueta, String(valor)]);
          }
        }
      }

      aplanarActivo(asset);

      const datosHoja = [["CAMPO", "VALOR"], ...filas];
      const hoja = XLSX.utils.aoa_to_sheet(datosHoja);
      const anchoCampo = Math.max(20, ...filas.map(([campo]) => campo.length + 2));
      const anchoValor = Math.max(30, ...filas.map(([, valor]) => Math.min(valor.length + 2, 80)));
      hoja["!cols"] = [{ wch: anchoCampo }, { wch: anchoValor }];

      const libro = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(libro, hoja, "Activo");
      const buffer = XLSX.write(libro, { type: "buffer", bookType: "xlsx" }) as Buffer;

      const fecha = new Date().toISOString().slice(0, 10);
      const nombreActivo = String(asset?.nombre ?? "activo").replace(/[^a-zA-Z0-9_-]/g, "_");

      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename="Inventario_${nombreActivo}_${fecha}.xlsx"`);
      res.setHeader("Content-Length", buffer.length);
      return res.send(buffer);

    } catch (error: any) {
      console.error("❌ Error exportando Excel individual:", error);
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


  async cambiarEstadoMovil(req: Request<{id:string}>, res: Response) {
    const id = req.params.id;
    
    const result = await assetsService.cambiarEstadoMovil(id);
    
    res.json({
      success: true,
      data: result,
    });
  }
  async firmarDevolucion(
    req: Request<{ id: string }>,
    res: Response
  ) {
    const id = req.params.id;
    const { firmaBase64 } = req.body;

    if (!firmaBase64) {
      return res.status(400).json({
        success: false,
        error: "El campo 'firmaBase64' es requerido",
      });
    }

    const result = await assetsService.firmarDevolucion(id, firmaBase64);

    if (result && result.ok === false) {
      return res.status(400).json({
        success: false,
        error: result.error || "Error firmando devolución",
      });
    }

    return res.json({
      success: true,
      data: result,
    });
  }
  // POST /assets/:id/firmar
  async firmarMovil(req: Request, res: Response) {
    const id = req.params.id as string;
  const { firmaBase64, observacionesEntrega } = req.body;

    if (!firmaBase64) {
    return res.status(400).json({
      success: false,
      error: "El campo 'firmaBase64' es requerido",
    });
  }

  try {
    const result = await assetsService.firmarMovil(id, firmaBase64, observacionesEntrega);

    return res.json({
      success: true,
      message: "Firma registrada correctamente. Puede venir por el equipo.",
      data: result,
    });
  } catch (error: any) {
    console.error("❌ Error firmando acta:", error);

    return res.status(400).json({
      success: false,
      error: error.message ?? "Error firmando el acta",
    });
  }
}

  // TEST: Enviar gmail sin que se cree un activo necesariamente
  async testEmail(req: Request, res: Response) {
    try {
      const { correo, nombreActivo, linkFirma } = req.body;

      if (!correo) {
        return res.status(400).json({
          success: false,
          error: "Correo es requerido",
        });
      }

      console.log("🧪 TEST EMAIL - Enviando a:", correo);
      
      await sendMovilEmail({
        correo,
        nombreActivo: nombreActivo || "TEST",
        assetId: "test-" + Date.now(),
        linkFirma: linkFirma || "http://localhost:5173/firmar/test",
      });

      return res.json({
        success: true,
        message: "Email de prueba enviado exitosamente",
        data: {
          correo,
          nombreActivo: nombreActivo || "TEST",
          linkFirma: linkFirma || "http://localhost:5173/firmar/test",
        },
      });
    } catch (error: any) {
      console.error("❌ Error en test email:", error);
      return res.status(500).json({
        success: false,
        error: error.message || "Error enviando email de prueba",
      });
    }
  }

  async exportOCS(req: Request, res: Response) {
    const data = await ocsService.getInventario();
    const archivos = generarExcelOCS(data);
    res.json({
      success: true,
      message: "Excels generados correctamente",
      total: archivos.length,
      archivos,
    });
  }

  // 🧪 TEST: Enviar email de FIRMA de prueba (segundo flujo)
  async testFirmaEmail(req: Request, res: Response) {
    try {
      const { correo, nombreActivo } = req.body;

      if (!correo) {
        return res.status(400).json({
          success: false,
          error: "Correo es requerido",
        });
      }

      console.log("🧪 TEST FIRMA EMAIL - Enviando a:", correo);

      const { sendToFlowFirmada } = await import("../utils/flowRaw");

      // Simular un archivo Word en Base64 (Word vacío mínimo)
      const wordBase64 = "UEsDBBQABgAIAAAAIQDfpq61XgEAAHoFAAATAAAAd29yZC9kb2N1bWVudC54bWxMjMHqwjAUhV8l5N4m7dSKY";

      await sendToFlowFirmada({
        correo,
        nombreActivo: nombreActivo || "TEST",
        assetId: "test-firma-" + Date.now(),
        nombreArchivo: "Acta_Entrega_TEST.pdf",
        archivoBase64: wordBase64,
        observacionesEntrega: "Test de envío - No es un documento real",
      });

      return res.json({
        success: true,
        message: "Email de prueba FIRMA enviado exitosamente",
        data: {
          correo,
          nombreActivo: nombreActivo || "TEST",
          assetId: "test-firma-" + Date.now(),
          flujo: "FLOW_URL_FIRMADA",
        },
      });
    } catch (error: any) {
      console.error("❌ Error en test firma email:", error);
      return res.status(500).json({
        success: false,
        error: error.message || "Error enviando email de firma",
      });
    }
  }

  // DEBUG: GET /assets/debug/vpn-test
  async debugVpnTest(req: Request, res: Response) {
    try {
      const { AppDataSource } = await import("../../config/database");
      const { Asset } = await import("../../entities/Asset");
      const { Vpn } = await import("../../entities/Vpn");
      const { VpnRule } = await import("../../entities/VpnRule");

      const assetRepo = AppDataSource.getRepository(Asset);
      const vpnRepo = AppDataSource.getRepository(Vpn);
      const ruleRepo = AppDataSource.getRepository(VpnRule);

      // Búsqueda del asset "test"
      const testAsset = await assetRepo.findOne({
        where: { nombre: "test", tipo: "VPN" } as any,
      });

      const totalVpns = await vpnRepo.count();
      const totalRules = await ruleRepo.count();

      if (!testAsset) {
        return res.json({
          success: true,
          data: {
            message: 'Asset "test" NO encontrado',
            totalVpns,
            totalRules,
            testAssetFound: false,
          },
        });
      }

      const testVpn = await vpnRepo.findOne({
        where: { asset: { id: testAsset.id } } as any,
        relations: ["reglas"],
      });

      const reglasDirect = testVpn 
        ? await ruleRepo.find({ where: { vpn: { id: testVpn.id } } })
        : [];

      return res.json({
        success: true,
        data: {
          totalVpns,
          totalRules,
          testAssetFound: true,
          testAsset: { id: testAsset.id, nombre: testAsset.nombre, tipo: testAsset.tipo },
          testVpn: testVpn ? {
            id: testVpn.id,
            conexion: testVpn.conexion,
            fases: testVpn.fases,
            origen: testVpn.origen,
            destino: testVpn.destino,
            reglasCount: testVpn.reglas?.length ?? 0,
          } : null,
          reglasDirect: reglasDirect.map(r => ({
            id: r.id,
            vpnId: r.vpn?.id,
            conexion: r.conexion,
            fases: r.fases,
            origen: r.origen,
            destino: r.destino,
          })),
        },
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  async hardDelete(req: Request, res: Response) {
    const id = req.params.id as string;
    await assetsService.hardDelete(id);
    res.json({ success: true, message: "Activo eliminado permanentemente." });
  }

  async hardDeleteAll(req: Request, res: Response) {
    const count = await assetsService.hardDeleteAll();
    res.json({ 
      success: true, 
      message: `${count} activos eliminados permanentemente del histórico.` 
    });
  }

  getSuggestions = async (req: Request, res: Response): Promise<void> => {
  const { field, tipo, q } = req.query as Record<string, string>;

  if (!field || !tipo) {
    res.status(400).json({ success: false, error: "field y tipo son requeridos" });
    return;
  }

  const suggestions = await assetsService.getSuggestions(
    field,
    tipo,
    q ?? ""
  );

  res.json({ success: true, data: { suggestions } });
};
}

export const assetsController = new AssetsController();



