"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assetsController = exports.AssetsController = void 0;
const express_1 = require("express");
const assets_service_1 = require("../services/assets.service");
const flow_1 = require("../utils/flow");
const flowMappers_1 = require("../utils/flowMappers");
const flowSanitizer_1 = require("../utils/flowSanitizer");
const generarMovilDocx_1 = require("../utils/generarMovilDocx");
const ExportInventario_1 = require("../utils/ExportInventario");
const exportObservaciones_1 = require("../utils/exportObservaciones");
const r = (0, express_1.Router)();
class AssetsController {
    // GET /assets
    async getAssets(req, res) {
        const filters = {
            tipo: req.query.tipo,
            q: req.query.q || undefined,
            page: req.query.page ? parseInt(req.query.page) : 1,
            limit: req.query.limit ? parseInt(req.query.limit) : 50,
        };
        const result = await assets_service_1.assetsService.getAssets(filters);
        res.json({
            success: true,
            data: result,
        });
    }
    // GET /assets/stats
    async getStats(req, res) {
        const stats = await assets_service_1.assetsService.getStats();
        res.json({
            success: true,
            data: stats,
        });
    }
    // GET /assets/deleted
    async getDeleted(req, res) {
        const assets = await assets_service_1.assetsService.getDeleted();
        res.json({
            success: true,
            data: assets,
        });
    }
    // GET /assets/:id
    async getAssetById(req, res) {
        const id = req.params.id;
        const asset = await assets_service_1.assetsService.getAssetById(id);
        res.json({
            success: true,
            data: asset,
        });
    }
    // POST /assets
    async createAsset(req, res) {
        const data = req.body;
        if (!data.tipo || !data.nombre) {
            return res.status(400).json({
                success: false,
                error: "Los campos tipo y nombre son requeridos",
            });
        }
        const asset = await assets_service_1.assetsService.createAsset(data, "Sistema");
        res.status(201).json({
            success: true,
            data: asset,
            message: "Activo creado correctamente",
        });
    }
    // PATCH /assets/:id
    async updateAsset(req, res) {
        const id = req.params.id;
        const data = req.body;
        const asset = await assets_service_1.assetsService.updateAsset(id, data, "Sistema");
        res.json({
            success: true,
            data: asset,
            message: "Asset actualizado correctamente",
        });
    }
    // DELETE /assets/:id
    async deleteAsset(req, res) {
        const id = req.params.id;
        const autor = req.body.autor;
        const asset = await assets_service_1.assetsService.softDelete(id, autor ?? "Sistema");
        res.json({
            success: true,
            data: asset,
            message: "Activo movido a papelera.",
        });
    }
    // POST /assets/:id/restore
    async restoreAsset(req, res) {
        const id = req.params.id;
        const autor = req.body.autor;
        const asset = await assets_service_1.assetsService.restoreAsset(id, autor ?? "Sistema");
        res.json({
            success: true,
            data: asset,
            message: "Activo restaurado correctamente.",
        });
    }
    // GET /assets/:id/bitacora
    async getBitacora(req, res) {
        const id = req.params.id;
        const limit = req.query.limit ? parseInt(req.query.limit) : 100;
        const bitacora = await assets_service_1.assetsService.getBitacora(id, limit);
        res.json({
            success: true,
            data: bitacora,
        });
    }
    // POST /assets/:id/bitacora
    async addBitacoraEntry(req, res) {
        const id = req.params.id;
        const { autor, tipoEvento, descripcion } = req.body;
        if (!autor || !tipoEvento || !descripcion) {
            return res.status(400).json({
                success: false,
                error: "Los campos autor, tipoEvento y descripcion son requeridos",
            });
        }
        const entry = await assets_service_1.assetsService.addBitacoraEntry(id, {
            autor,
            tipoEvento,
            descripcion,
        });
        res.json({
            success: true,
            data: entry,
            message: "Observación agregada correctamente",
        });
    }
    // ─── AGREGAR en assets.controller.ts ───────────────────────────────
    // Importar al inicio del archivo:
    // import { generarWordMovil } from "../../utils/generarWordMovil";
    async generarWord(req, res) {
        try {
            const id = req.params.id;
            const asset = await assets_service_1.assetsService.getAssetById(id);
            if (!asset || asset.tipo !== "MOVIL") {
                return res.status(400).json({ success: false, error: "Activo no es de tipo MOVIL" });
            }
            const m = asset.movil;
            const buffer = await (0, generarMovilDocx_1.generarWordMovil)({
                nombre: asset.nombre,
                numeroCaso: m?.numeroCaso ?? null,
                region: m?.region ?? null,
                dependencia: m?.dependencia ?? null,
                sede: m?.sede ?? null,
                cedula: m?.cedula ?? null,
                usuarioRed: m?.usuarioRed ?? null,
                uni: m?.uni ?? null,
                marca: m?.marca ?? null,
                modelo: m?.modelo ?? null,
                serial: m?.serial ?? null,
                imei1: m?.imei1 ?? null,
                imei2: m?.imei2 ?? null,
                sim: m?.sim ?? null,
                numeroLinea: m?.numeroLinea ?? null,
                fechaEntrega: m?.fechaEntrega ?? null,
                observacionesEntrega: m?.observacionesEntrega ?? null,
                fechaDevolucion: m?.fechaDevolucion ?? null,
                observacionesDevolucion: m?.observacionesDevolucion ?? null,
            });
            const nombre = `FR-GTE-02-044_${(asset.nombre ?? "movil").replace(/\s+/g, "_")}.docx`;
            res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
            res.setHeader("Content-Disposition", `attachment; filename="${nombre}"`);
            res.setHeader("Content-Length", buffer.length);
            return res.send(buffer);
        }
        catch (error) {
            console.error("❌ Error generando Word:", error);
            return res.status(500).json({ success: false, error: "Error generando el documento" });
        }
    }
    // ─── AGREGAR en assets.routes.ts ───────────────────────────────────
    // ANTES de la ruta /:id para evitar conflictos:
    // router.get("/:id/word", assetsController.generarWord);
    // POST /assets/sync-excel
    async syncExcel(req, res) {
        try {
            console.log("[syncExcel] Headers:", req.headers);
            console.log("[syncExcel] Body:", req.body);
            const { tipo, ids } = req.body || {};
            if (!tipo) {
                return res.status(400).json({
                    success: false,
                    error: "El campo 'tipo' es requerido (SERVIDOR|RED|UPS|BASE_DATOS o TServidores|TRedes|TUPS|TBD)",
                });
            }
            if (!process.env.FLOW_URL) {
                console.error("[syncExcel] Falta FLOW_URL en .env");
                return res.status(500).json({
                    success: false,
                    error: "Falta configurar FLOW_URL en .env",
                });
            }
            const t = String(tipo).toUpperCase();
            const dbTipo = t === "TSERVIDORES" ? "SERVIDOR" :
                t === "TREDES" ? "RED" :
                    t === "TUPS" ? "UPS" :
                        t === "TBD" ? "BASE_DATOS" :
                            t;
            console.log("[syncExcel] dbTipo:", dbTipo, "ids:", ids);
            const assets = await assets_service_1.assetsService.getAssetsByTipoAndIds({
                tipo: dbTipo,
                ids: Array.isArray(ids) ? ids : undefined,
            });
            console.log("[syncExcel] assets count:", assets.length);
            if (assets.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: `No hay assets para tipo=${dbTipo}${ids?.length ? ` con ids=[${ids.join(",")}]` : ""}`,
                });
            }
            const payload = (0, flowMappers_1.mapAssetsToFlowPayload)(tipo, assets);
            const cleanPayload = (0, flowSanitizer_1.sanitizePayloadForFlow)(payload);
            console.log("[syncExcel] payload preview:", JSON.stringify(cleanPayload).slice(0, 350), "...");
            const flowResp = await (0, flow_1.sendToFlow)(cleanPayload);
            console.log("[syncExcel] flowResp:", flowResp);
            return res.json({
                success: true,
                data: { sent: cleanPayload, flowResp },
                message: `Sincronizados ${cleanPayload.assets.length} registros a ${(0, flowMappers_1.toFlowTipo)(tipo)}`,
            });
        }
        catch (e) {
            console.error("[syncExcel] ERROR:", e?.message, e?.stack);
            return res.status(500).json({
                success: false,
                error: e?.message || "Error interno del servidor",
            });
        }
    }
    async exportExcel(req, res) {
        try {
            // ids es opcional — si no viene, exporta todos los del tipo
            const tipos = req.query.tipos
                ? String(req.query.tipos).split(",").filter(Boolean)
                : [];
            const ids = req.query.ids
                ? String(req.query.ids).split(",").filter(Boolean)
                : [];
            // Traer activos
            let assets = [];
            if (ids.length > 0) {
                assets = await assets_service_1.assetsService.getAssetsByTipoAndIds({ ids });
            }
            else if (tipos.length > 0) {
                for (const tipo of tipos) {
                    const r = await assets_service_1.assetsService.getAssetsByTipoAndIds({ tipo });
                    assets = assets.concat(r);
                }
            }
            else {
                // Todos (SERVIDOR, RED, UPS, BASE_DATOS)
                for (const tipo of ["SERVIDOR", "RED", "UPS", "BASE_DATOS"]) {
                    const r = await assets_service_1.assetsService.getAssetsByTipoAndIds({ tipo });
                    assets = assets.concat(r);
                }
            }
            if (assets.length === 0) {
                return res.status(404).json({ success: false, error: "No hay activos para exportar" });
            }
            console.log("🔍 Assets recibidos:", assets.length);
            console.log("🔍 Primer asset:", JSON.stringify(assets[0], null, 2));
            const buffer = await (0, ExportInventario_1.generarExcelInventario)(assets);
            const fecha = new Date().toISOString().slice(0, 10);
            res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            res.setHeader("Content-Disposition", `attachment; filename="Inventario_TI_${fecha}.xlsx"`);
            res.setHeader("Content-Length", buffer.length);
            return res.send(buffer);
        }
        catch (error) {
            console.error("❌ Error exportando Excel:", error);
            return res.status(500).json({ success: false, error: "Error generando el Excel" });
        }
    }
    async exportObservaciones(req, res) {
        try {
            const { rows, incluirTecnicos } = req.body;
            if (!rows || !Array.isArray(rows) || rows.length === 0) {
                return res.status(400).json({ success: false, error: "No hay observaciones para exportar" });
            }
            const buffer = await (0, exportObservaciones_1.generarExcelObservaciones)({
                rows,
                incluirTecnicos: incluirTecnicos ?? false,
            });
            const fecha = new Date().toISOString().slice(0, 10);
            res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            res.setHeader("Content-Disposition", `attachment; filename="Observaciones_${fecha}.xlsx"`);
            res.setHeader("Content-Length", buffer.length);
            return res.send(buffer);
        }
        catch (error) {
            console.error("❌ Error exportando observaciones:", error);
            return res.status(500).json({ success: false, error: "Error generando el Excel de observaciones" });
        }
    }
}
exports.AssetsController = AssetsController;
exports.assetsController = new AssetsController();
