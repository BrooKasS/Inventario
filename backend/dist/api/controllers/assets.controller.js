"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
const sendMovilEmail_1 = require("../utils/sendMovilEmail");
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
        try {
            const autor = req.usuario ?? "Sistema";
            const asset = await assets_service_1.assetsService.createAsset(data, autor);
            res.status(201).json({
                success: true,
                data: asset,
                message: "Activo creado correctamente",
            });
        }
        catch (error) {
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
    async updateAsset(req, res) {
        const id = req.params.id;
        const data = req.body;
        const autor = req.usuario ?? "Sistema";
        const asset = await assets_service_1.assetsService.updateAsset(id, data, autor);
        res.json({
            success: true,
            data: asset,
            message: "Asset actualizado correctamente",
        });
    }
    // DELETE /assets/:id
    async deleteAsset(req, res) {
        const id = req.params.id;
        const autor = req.usuario ?? "Sistema";
        const motivo = req.body.motivo ?? "Sin motivo";
        const asset = await assets_service_1.assetsService.softDelete(id, autor, motivo);
        res.json({
            success: true,
            data: asset,
            message: "Activo movido a papelera.",
        });
    }
    // POST /assets/:id/restore
    async restoreAsset(req, res) {
        const id = req.params.id;
        const autor = req.usuario ?? "Sistema";
        const asset = await assets_service_1.assetsService.restoreAsset(id, autor);
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
        const { tipoEvento, descripcion } = req.body;
        const autor = req.usuario ?? "Sistema";
        if (!tipoEvento || !descripcion) {
            return res.status(400).json({
                success: false,
                error: "Los campos tipoEvento y descripcion son requeridos",
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
                firmaPath: m?.firmaPath ?? null,
                fechaFirma: m?.fechaFirma ?? null,
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
            const tipos = req.body.tipos ?? [];
            const ids = req.body.ids ?? [];
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
                for (const tipo of ["SERVIDOR", "RED", "UPS", "BASE_DATOS", "VPN", "MOVIL"]) {
                    const r = await assets_service_1.assetsService.getAssetsByTipoAndIds({ tipo });
                    assets = assets.concat(r);
                }
            }
            if (assets.length === 0) {
                return res.status(404).json({ success: false, error: "No hay activos para exportar" });
            }
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
    // POST /assets/:id/firmar
    async firmarMovil(req, res) {
        const id = req.params.id;
        const { firmaBase64 } = req.body;
        if (!firmaBase64) {
            return res.status(400).json({
                success: false,
                error: "El campo 'firmaBase64' es requerido",
            });
        }
        try {
            const result = await assets_service_1.assetsService.firmarMovil(id, firmaBase64);
            return res.json({
                success: true,
                message: "Firma registrada correctamente. Puede venir por el equipo.",
                data: result,
            });
        }
        catch (error) {
            console.error("❌ Error firmando acta:", error);
            return res.status(400).json({
                success: false,
                error: error.message ?? "Error firmando el acta",
            });
        }
    }
    // TEST: Enviar gmail sin que se cree un activo necesariamente
    async testEmail(req, res) {
        try {
            const { correo, nombreActivo, linkFirma } = req.body;
            if (!correo) {
                return res.status(400).json({
                    success: false,
                    error: "Correo es requerido",
                });
            }
            console.log("🧪 TEST EMAIL - Enviando a:", correo);
            await (0, sendMovilEmail_1.sendMovilEmail)({
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
        }
        catch (error) {
            console.error("❌ Error en test email:", error);
            return res.status(500).json({
                success: false,
                error: error.message || "Error enviando email de prueba",
            });
        }
    }
    // 🧪 TEST: Enviar email de FIRMA de prueba (segundo flujo)
    async testFirmaEmail(req, res) {
        try {
            const { correo, nombreActivo } = req.body;
            if (!correo) {
                return res.status(400).json({
                    success: false,
                    error: "Correo es requerido",
                });
            }
            console.log("🧪 TEST FIRMA EMAIL - Enviando a:", correo);
            const { sendToFlowFirmada } = await Promise.resolve().then(() => __importStar(require("../utils/flowRaw")));
            // Simular un archivo Word en Base64 (Word vacío mínimo)
            const wordBase64 = "UEsDBBQABgAIAAAAIQDfpq61XgEAAHoFAAATAAAAd29yZC9kb2N1bWVudC54bWxMjMHqwjAUhV8l5N4m7dSKY";
            await sendToFlowFirmada({
                correo,
                nombreActivo: nombreActivo || "TEST",
                assetId: "test-firma-" + Date.now(),
                nombreArchivo: "Acta_Entrega_TEST.docx",
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
        }
        catch (error) {
            console.error("❌ Error en test firma email:", error);
            return res.status(500).json({
                success: false,
                error: error.message || "Error enviando email de firma",
            });
        }
    }
}
exports.AssetsController = AssetsController;
exports.assetsController = new AssetsController();
