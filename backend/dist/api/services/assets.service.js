"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.assetsService = exports.AssetsService = void 0;
const database_1 = require("../../config/database");
const Asset_1 = require("../../entities/Asset");
const Bitacora_1 = require("../../entities/Bitacora");
const Servidor_1 = require("../../entities/Servidor");
const Red_1 = require("../../entities/Red");
const Ups_1 = require("../../entities/Ups");
const BaseDatos_1 = require("../../entities/BaseDatos");
const Vpn_1 = require("../../entities/Vpn");
const VpnRule_1 = require("../../entities/VpnRule");
const Movil_1 = require("../../entities/Movil");
const typeorm_1 = require("typeorm");
const uuid_1 = require("uuid");
const generarMovilDocx_1 = require("../utils/generarMovilDocx");
const sendMovilEmail_1 = require("../utils/sendMovilEmail");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const flowRaw_1 = require("../utils/flowRaw");
const validationRules_1 = require("../utils/validationRules");
class AssetsService {
    async getAssets(filters) {
        const { tipo, q, page = 1, limit = 50 } = filters;
        const skip = (page - 1) * limit;
        const assetRepository = database_1.AppDataSource.getRepository(Asset_1.Asset);
        const vpnRepository = database_1.AppDataSource.getRepository(Vpn_1.Vpn);
        // ════════════════════════════════════════════════════════════════════════
        // PARA VPN: OBTENER SOLO PRINCIPALES (1 por cada conexion/IP)
        // ════════════════════════════════════════════════════════════════════════
        let vpnPrincipalesIds = [];
        if (tipo === "VPN") {
            // Query: GROUP BY conexion para obtener 1 VPN por cada IP única
            // Solo agrupa VPNs con conexion válida (IS NOT NULL)
            const vpnPrincipales = await vpnRepository
                .createQueryBuilder("vpn")
                .select("MIN(vpn.id)", "id")
                .addSelect("vpn.conexion", "conexion")
                .where("vpn.conexion IS NOT NULL")
                .groupBy("vpn.conexion")
                .getRawMany();
            vpnPrincipalesIds = vpnPrincipales.map((v) => v.id);
            console.log(`✅ VPN PRINCIPALES: ${vpnPrincipalesIds.length} encontrados`);
        }
        // ════════════════════════════════════════════════════════════════════════
        // BÚSQUEDA CON QUERY (filtro por nombre/código)
        // ════════════════════════════════════════════════════════════════════════
        if (q) {
            const qb = assetRepository
                .createQueryBuilder("asset")
                .leftJoinAndSelect("asset.servidor", "servidor")
                .leftJoinAndSelect("asset.red", "red")
                .leftJoinAndSelect("asset.ups", "ups")
                .leftJoinAndSelect("asset.baseDatos", "baseDatos")
                .leftJoinAndSelect("asset.vpn", "vpn")
                .leftJoinAndSelect("vpn.reglas", "vpnRules")
                .leftJoinAndSelect("asset.movil", "movil")
                .where("asset.deletedAt IS NULL");
            if (tipo) {
                qb.andWhere("asset.tipo = :tipo", { tipo });
            }
            if (tipo === "VPN") {
                if (vpnPrincipalesIds.length > 0) {
                    qb.andWhere("vpn.id IN (:...vpnIds)", { vpnIds: vpnPrincipalesIds });
                }
                else {
                    qb.andWhere("1 = 0");
                }
            }
            qb.andWhere("(LOWER(asset.nombre) LIKE LOWER(:q) OR LOWER(asset.codigoServicio) LIKE LOWER(:q))", { q: `%${q}%` });
            const [assets, total] = await qb
                .orderBy("asset.actualizadoEn", "DESC")
                .skip(skip)
                .take(limit)
                .getManyAndCount();
            return {
                assets,
                pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
            };
        }
        // ════════════════════════════════════════════════════════════════════════
        // BÚSQUEDA SIN QUERY (solo filtro por tipo)
        // ════════════════════════════════════════════════════════════════════════
        const qb = assetRepository
            .createQueryBuilder("asset")
            .leftJoinAndSelect("asset.servidor", "servidor")
            .leftJoinAndSelect("asset.red", "red")
            .leftJoinAndSelect("asset.ups", "ups")
            .leftJoinAndSelect("asset.baseDatos", "baseDatos")
            .leftJoinAndSelect("asset.vpn", "vpn")
            .leftJoinAndSelect("vpn.reglas", "vpnRules")
            .leftJoinAndSelect("asset.movil", "movil")
            .where("asset.deletedAt IS NULL");
        if (tipo) {
            qb.andWhere("asset.tipo = :tipo", { tipo });
        }
        if (tipo === "VPN") {
            if (vpnPrincipalesIds.length > 0) {
                qb.andWhere("vpn.id IN (:...vpnIds)", { vpnIds: vpnPrincipalesIds });
            }
            else {
                qb.andWhere("1 = 0");
            }
        }
        const [assets, total] = await qb
            .orderBy("asset.actualizadoEn", "DESC")
            .skip(skip)
            .take(limit)
            .getManyAndCount();
        return {
            assets,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }
    async getAssetById(id) {
        const assetRepository = database_1.AppDataSource.getRepository(Asset_1.Asset);
        const bitacoraRepository = database_1.AppDataSource.getRepository(Bitacora_1.Bitacora);
        const vpnRepository = database_1.AppDataSource.getRepository(Vpn_1.Vpn);
        // Usar QueryBuilder para cargar todas las relaciones correctamente
        const asset = await assetRepository
            .createQueryBuilder("asset")
            .leftJoinAndSelect("asset.servidor", "servidor")
            .leftJoinAndSelect("asset.red", "red")
            .leftJoinAndSelect("asset.ups", "ups")
            .leftJoinAndSelect("asset.baseDatos", "baseDatos")
            .leftJoinAndSelect("asset.vpn", "vpn")
            .leftJoinAndSelect("vpn.reglas", "reglas")
            .leftJoinAndSelect("asset.movil", "movil")
            .where("asset.id = :id", { id })
            .getOne();
        if (!asset)
            throw new Error("Asset no encontrado");
        // ════════════════════════════════════════════════════════════════
        // SI ES VPN: CARGAR TAMBIÉN LAS REGLAS HISTÓRICAS (VPNs hermanas)
        // ════════════════════════════════════════════════════════════════
        if (asset.vpn && asset.vpn.conexion) {
            // Buscar todas las VPNs con el mismo conexion (reglas históricas)
            const vpnRelacionadas = await vpnRepository.find({
                where: { conexion: asset.vpn.conexion },
            });
            // Filtrar: excluir la VPN principal (la del asset), el resto son históricas
            const reglasHistoricas = vpnRelacionadas.filter((v) => v.id !== asset.vpn.id);
            // Guardar en un campo adicional (compatible con frontend)
            asset.vpn.reglasHistoricas = reglasHistoricas;
        }
        // Get last 50 bitacora entries from DB (same as original Prisma logic)
        const bitacora = await bitacoraRepository.find({
            where: { asset: { id } },
            order: { creadoEn: "DESC" },
            take: 50,
        });
        asset.bitacora = bitacora;
        return asset;
    }
    async createAsset(data, autor = "Sistema") {
        const { tipo, nombre, ubicacion, propietario, custodio, codigoServicio, servidor, red, ups, baseDatos, vpn, 
        // MOVIL
        numeroCaso, region, dependencia, sede, cedula, usuarioRed, correoResponsable, uni, marca, modelo, serial, imei1, imei2, sim, numeroLinea, fechaEntrega, observacionesEntrega, } = data;
        // Siempre se validan nuevas entradas no lo que ya hay
        const { valid, errors } = (0, validationRules_1.validateAssetData)(tipo, data, true);
        if (!valid) {
            throw new Error(`Validación fallida: ${errors.join(", ")}`);
        }
        const assetRepository = database_1.AppDataSource.getRepository(Asset_1.Asset);
        const bitacoraRepository = database_1.AppDataSource.getRepository(Bitacora_1.Bitacora);
        const servidorRepository = database_1.AppDataSource.getRepository(Servidor_1.Servidor);
        const redRepository = database_1.AppDataSource.getRepository(Red_1.Red);
        const upsRepository = database_1.AppDataSource.getRepository(Ups_1.Ups);
        const baseDatosRepository = database_1.AppDataSource.getRepository(BaseDatos_1.BaseDatos);
        const vpnRepository = database_1.AppDataSource.getRepository(Vpn_1.Vpn);
        const vpnRuleRepository = database_1.AppDataSource.getRepository(VpnRule_1.VpnRule);
        const movilRepository = database_1.AppDataSource.getRepository(Movil_1.Movil);
        // ======================
        // CREAR ASSET
        // ======================
        const asset = assetRepository.create({
            tipo,
            nombre,
            ubicacion: ubicacion ?? null,
            propietario: propietario ?? null,
            custodio: custodio ?? null,
            codigoServicio: codigoServicio ?? null,
        });
        const savedAsset = await assetRepository.save(asset);
        // ======================
        // RELACIONES
        // ======================
        if (servidor) {
            const servidorToSave = { ...servidor, asset: savedAsset };
            if (!servidorToSave.id)
                servidorToSave.id = (0, uuid_1.v4)();
            await servidorRepository.save(servidorToSave);
        }
        if (red) {
            const redToSave = { ...red, asset: savedAsset };
            if (!redToSave.id)
                redToSave.id = (0, uuid_1.v4)();
            await redRepository.save(redToSave);
        }
        if (ups) {
            const upsToSave = { ...ups, asset: savedAsset };
            if (!upsToSave.id)
                upsToSave.id = (0, uuid_1.v4)();
            await upsRepository.save(upsToSave);
        }
        if (baseDatos) {
            const baseDatosToSave = { ...baseDatos, asset: savedAsset };
            if (!baseDatosToSave.id)
                baseDatosToSave.id = (0, uuid_1.v4)();
            await baseDatosRepository.save(baseDatosToSave);
        }
        if (vpn) {
            const vpnToSave = { ...vpn, asset: savedAsset };
            if (!vpnToSave.id)
                vpnToSave.id = (0, uuid_1.v4)();
            // Separar reglas del objeto VPN
            const reglas = vpnToSave.reglas || [];
            delete vpnToSave.reglas; // Remover reglas del objeto principal
            // Guardar VPN principal
            const savedVpn = await vpnRepository.save(vpnToSave);
            // Guardar reglas como VpnRule separadas
            if (reglas && Array.isArray(reglas) && reglas.length > 0) {
                const vpnRulesToSave = reglas.map((regla) => {
                    const rule = vpnRuleRepository.create({
                        id: (0, uuid_1.v4)(),
                        vpn: savedVpn, // ✅ TypeORM maneja el VPN_ID automáticamente
                        conexion: regla.conexion ?? null,
                        fases: regla.fases ?? null,
                        origen: regla.origen ?? null,
                        destino: regla.destino ?? null,
                    });
                    return rule;
                });
                await vpnRuleRepository.save(vpnRulesToSave);
            }
        }
        // ======================
        // MOVIL + WORD (+ CORREO OPCIONAL) ✅
        // ======================
        if (tipo === "MOVIL") {
            const movilData = movilRepository.create({
                id: savedAsset.id, // ✅ CLAVE: MISMO ID DEL ASSET
                asset: savedAsset, // ✅ relación correcta
                numeroCaso: numeroCaso ?? null,
                region: region ?? null,
                dependencia: dependencia ?? null,
                sede: sede ?? null,
                cedula: cedula ?? null,
                usuarioRed: usuarioRed ?? null,
                correoResponsable: correoResponsable ?? null,
                uni: uni ?? null,
                marca: marca ?? null,
                modelo: modelo ?? null,
                serial: serial ?? null,
                imei1: imei1 ?? null,
                imei2: imei2 ?? null,
                sim: sim ?? null,
                numeroLinea: numeroLinea ?? null,
                fechaEntrega: fechaEntrega ? new Date(fechaEntrega) : null,
                observacionesEntrega: observacionesEntrega ?? null,
            });
            await movilRepository.save(movilData);
            // ✅ Generar Word SIEMPRE (reutilizable)
            const buffer = await (0, generarMovilDocx_1.generarWordMovil)({
                nombre: savedAsset.nombre,
                numeroCaso,
                region,
                dependencia,
                sede,
                cedula,
                usuarioRed,
                uni,
                marca,
                modelo,
                serial,
                imei1,
                imei2,
                sim,
                numeroLinea,
                fechaEntrega,
                observacionesEntrega,
                fechaDevolucion: null,
                observacionesDevolucion: null,
                firmaPath: null,
                fechaFirma: null,
            });
            // ✅ Enviar correo SOLO si hay responsable
            if (correoResponsable) {
                try {
                    await (0, sendMovilEmail_1.sendMovilEmail)({
                        correo: correoResponsable,
                        nombreActivo: savedAsset.nombre,
                        assetId: savedAsset.id,
                        linkFirma: `${process.env.FRONTEND_URL}/firmar/${savedAsset.id}`,
                    });
                    await bitacoraRepository.save(bitacoraRepository.create({
                        asset: savedAsset,
                        autor: "Sistema",
                        tipoEvento: "NOTA",
                        descripcion: `Acta de entrega enviada a ${correoResponsable}`,
                    }));
                }
                catch (error) {
                    console.error("⚠️ Error enviando acta MOVIL:", error);
                }
            }
        }
        // ======================
        // BITÁCORA CREACIÓN
        // ======================
        await bitacoraRepository.save(bitacoraRepository.create({
            asset: savedAsset,
            autor,
            tipoEvento: "IMPORTACION",
            descripcion: "Activo creado manualmente.",
        }));
        // Retornar con QueryBuilder para cargar correctamente reglas VPN anidadas
        return assetRepository
            .createQueryBuilder("asset")
            .leftJoinAndSelect("asset.servidor", "servidor")
            .leftJoinAndSelect("asset.red", "red")
            .leftJoinAndSelect("asset.ups", "ups")
            .leftJoinAndSelect("asset.baseDatos", "baseDatos")
            .leftJoinAndSelect("asset.vpn", "vpn")
            .leftJoinAndSelect("vpn.reglas", "reglas")
            .leftJoinAndSelect("asset.movil", "movil")
            .where("asset.id = :id", { id: savedAsset.id })
            .getOne();
    }
    async firmarMovil(assetId, firmaBase64, observacionesEntrega) {
        // ✅ Sanitizar ID
        assetId = assetId.replace(/[^a-fA-F0-9-]/g, "");
        const assetRepo = database_1.AppDataSource.getRepository(Asset_1.Asset);
        const movilRepo = database_1.AppDataSource.getRepository(Movil_1.Movil);
        const bitacoraRepo = database_1.AppDataSource.getRepository(Bitacora_1.Bitacora);
        const asset = await assetRepo.findOne({
            where: { id: assetId },
            relations: ["movil"],
        });
        if (!asset || asset.tipo !== "MOVIL" || !asset.movil) {
            throw new Error("Activo no encontrado o no es MOVIL");
        }
        if (asset.movil.firmaPath) {
            throw new Error("Este activo ya fue firmado");
        }
        // ──────────────
        // 1️⃣ Guardar firma PNG
        // ──────────────
        const firmaBuffer = Buffer.from(firmaBase64.replace(/^data:image\/png;base64,/, ""), "base64");
        const firmaDir = path_1.default.join(process.cwd(), "storage/firmas");
        fs_1.default.mkdirSync(firmaDir, { recursive: true });
        const firmaPath = path_1.default.join(firmaDir, `${assetId}.png`);
        fs_1.default.writeFileSync(firmaPath, firmaBuffer);
        const fechaFirma = new Date();
        await movilRepo.update({ id: assetId }, { firmaPath, fechaFirma, observacionesEntrega: observacionesEntrega ?? asset.movil.observacionesEntrega });
        // ──────────────
        // 2️⃣ Generar Word firmado
        // ──────────────
        const m = asset.movil;
        const buffer = await (0, generarMovilDocx_1.generarWordMovil)({
            nombre: asset.nombre,
            numeroCaso: m.numeroCaso,
            region: m.region,
            dependencia: m.dependencia,
            sede: m.sede,
            cedula: m.cedula,
            usuarioRed: m.usuarioRed,
            uni: m.uni,
            marca: m.marca,
            modelo: m.modelo,
            serial: m.serial,
            imei1: m.imei1,
            imei2: m.imei2,
            sim: m.sim,
            numeroLinea: m.numeroLinea,
            fechaEntrega: m.fechaEntrega,
            observacionesEntrega: m.observacionesEntrega,
            fechaDevolucion: m.fechaDevolucion,
            observacionesDevolucion: m.observacionesDevolucion,
            firmaPath,
            fechaFirma,
        });
        // ──────────────
        // ✅ 3️⃣ ENVIAR AL FLOW (RAW)
        // ──────────────
        try {
            const nombreArchivo = `Acta_Entrega_${asset.nombre?.replace(/\s+/g, "_")}.docx`;
            const archivoBase64 = buffer.toString("base64");
            await (0, flowRaw_1.sendToFlowFirmada)({
                correo: m.correoResponsable,
                nombreActivo: asset.nombre,
                assetId,
                nombreArchivo,
                observacionesEntrega,
                archivoBase64,
            });
            await bitacoraRepo.save(bitacoraRepo.create({
                asset: { id: assetId },
                autor: "Sistema",
                tipoEvento: "NOTA",
                descripcion: "Acta firmada enviada a Power Automate.",
            }));
        }
        catch (error) {
            console.error("⚠️ Error enviando acta firmada al Flow:", error);
        }
        // ──────────────
        // 4️⃣ Bitácora final
        // ──────────────
        await bitacoraRepo.save(bitacoraRepo.create({
            asset: { id: assetId },
            autor: "Usuario",
            tipoEvento: "NOTA",
            descripcion: "Acta firmada digitalmente. Equipo listo para entrega.",
        }));
        return {
            ok: true,
            fechaFirma,
        };
    }
    async updateAsset(id, data, autor) {
        const assetRepository = database_1.AppDataSource.getRepository(Asset_1.Asset);
        const servidorRepository = database_1.AppDataSource.getRepository(Servidor_1.Servidor);
        const redRepository = database_1.AppDataSource.getRepository(Red_1.Red);
        const upsRepository = database_1.AppDataSource.getRepository(Ups_1.Ups);
        const baseDatosRepository = database_1.AppDataSource.getRepository(BaseDatos_1.BaseDatos);
        const vpnRepository = database_1.AppDataSource.getRepository(Vpn_1.Vpn);
        const vpnRuleRepository = database_1.AppDataSource.getRepository(VpnRule_1.VpnRule);
        const movilRepository = database_1.AppDataSource.getRepository(Movil_1.Movil);
        const bitacoraRepository = database_1.AppDataSource.getRepository(Bitacora_1.Bitacora);
        const asset = await assetRepository.findOne({
            where: { id },
            relations: ["servidor", "red", "ups", "baseDatos", "vpn", "vpn.reglas", "movil"],
        });
        if (!data || typeof data !== "object")
            throw new Error("Body inválido");
        if (!asset)
            throw new Error("Asset no encontrado");
        //  Valida si el registro es nuevo , si es nuevo, agarra las funciones de validación
        const isNewRecord = (0, validationRules_1.isCreatedToday)(asset.creadoEn);
        if (isNewRecord) {
            const { valid, errors } = (0, validationRules_1.validateAssetData)(asset.tipo, data, false);
            if (!valid) {
                throw new Error(`Validación fallida: ${errors.join(", ")}`);
            }
        }
        const updates = {};
        const bitacoraEntries = [];
        // ======================
        // CAMPOS BASE DE ASSET
        // ======================
        if (data.nombre !== undefined && data.nombre !== asset.nombre) {
            updates.nombre = data.nombre;
            bitacoraEntries.push({ campoModificado: "nombre", valorAnterior: asset.nombre, valorNuevo: data.nombre });
        }
        if (data.ubicacion !== undefined && data.ubicacion !== asset.ubicacion) {
            updates.ubicacion = data.ubicacion;
            bitacoraEntries.push({ campoModificado: "ubicacion", valorAnterior: asset.ubicacion, valorNuevo: data.ubicacion });
        }
        if (data.propietario !== undefined && data.propietario !== asset.propietario) {
            updates.propietario = data.propietario;
            bitacoraEntries.push({ campoModificado: "propietario", valorAnterior: asset.propietario, valorNuevo: data.propietario });
        }
        if (data.custodio !== undefined && data.custodio !== asset.custodio) {
            updates.custodio = data.custodio;
            bitacoraEntries.push({ campoModificado: "custodio", valorAnterior: asset.custodio, valorNuevo: data.custodio });
        }
        if (Object.keys(updates).length > 0) {
            await assetRepository.update(id, updates);
        }
        // ======================
        // SERVIDOR
        // ======================
        if (asset.tipo === "SERVIDOR" && asset.servidor && data.servidor) {
            const detailUpdates = {};
            const servidor = asset.servidor;
            Object.keys(data.servidor).forEach((key) => {
                const oldVal = servidor[key];
                const newVal = data.servidor[key];
                if (newVal !== undefined && newVal !== oldVal) {
                    detailUpdates[key] = newVal;
                    bitacoraEntries.push({ campoModificado: key, valorAnterior: String(oldVal ?? ""), valorNuevo: String(newVal ?? "") });
                }
            });
            if (detailUpdates.vcpu !== undefined)
                detailUpdates.vcpu = detailUpdates.vcpu ? parseInt(detailUpdates.vcpu) : null;
            if (detailUpdates.vramMb !== undefined)
                detailUpdates.vramMb = detailUpdates.vramMb ? parseInt(detailUpdates.vramMb) : null;
            if (Object.keys(detailUpdates).length > 0) {
                await servidorRepository.update({ asset: { id } }, detailUpdates);
            }
        }
        // ======================
        // RED
        // ======================
        if (asset.tipo === "RED" && asset.red && data.red) {
            const detailUpdates = {};
            const red = asset.red;
            Object.keys(data.red).forEach((key) => {
                const oldVal = red[key];
                const newVal = data.red[key];
                if (newVal !== undefined && newVal !== oldVal) {
                    detailUpdates[key] = newVal;
                    bitacoraEntries.push({ campoModificado: key, valorAnterior: String(oldVal ?? ""), valorNuevo: String(newVal ?? "") });
                }
            });
            if (Object.keys(detailUpdates).length > 0) {
                await redRepository.update({ asset: { id } }, detailUpdates);
            }
        }
        // ======================
        // UPS
        // ======================
        if (asset.tipo === "UPS" && asset.ups && data.ups) {
            const detailUpdates = {};
            const ups = asset.ups;
            Object.keys(data.ups).forEach((key) => {
                const oldVal = ups[key];
                const newVal = data.ups[key];
                if (newVal !== undefined && newVal !== oldVal) {
                    detailUpdates[key] = newVal;
                    bitacoraEntries.push({ campoModificado: key, valorAnterior: String(oldVal ?? ""), valorNuevo: String(newVal ?? "") });
                }
            });
            if (Object.keys(detailUpdates).length > 0) {
                await upsRepository.update({ asset: { id } }, detailUpdates);
            }
        }
        // ======================
        // BASE_DATOS
        // ======================
        if (asset.tipo === "BASE_DATOS" && asset.baseDatos && data.baseDatos) {
            const detailUpdates = {};
            const baseDatos = asset.baseDatos;
            Object.keys(data.baseDatos).forEach((key) => {
                const oldVal = baseDatos[key];
                const newVal = data.baseDatos[key];
                if (newVal !== undefined && newVal !== oldVal) {
                    detailUpdates[key] = newVal;
                    bitacoraEntries.push({ campoModificado: key, valorAnterior: String(oldVal ?? ""), valorNuevo: String(newVal ?? "") });
                }
            });
            if (Object.keys(detailUpdates).length > 0) {
                await baseDatosRepository.update({ asset: { id } }, detailUpdates);
            }
        }
        // ======================
        // VPN
        // ======================
        if (asset.tipo === "VPN" && asset.vpn && data.vpn) {
            const detailUpdates = {};
            const vpn = asset.vpn;
            Object.keys(data.vpn).forEach((key) => {
                if (key === "reglas")
                    return; // Manejar reglas por separado
                const oldVal = vpn[key];
                const newVal = data.vpn[key];
                if (newVal !== undefined && newVal !== oldVal) {
                    detailUpdates[key] = newVal;
                    bitacoraEntries.push({ campoModificado: key, valorAnterior: String(oldVal ?? ""), valorNuevo: String(newVal ?? "") });
                }
            });
            if (Object.keys(detailUpdates).length > 0) {
                await vpnRepository.update({ asset: { id } }, detailUpdates);
            }
            // ─────────────────────────────────────────────────────────────
            // MANEJAR REGLAS (VpnRule)
            // ─────────────────────────────────────────────────────────────
            if (data.vpn.reglas !== undefined) {
                const newReglas = data.vpn.reglas || [];
                const oldReglas = vpn.reglas || [];
                // Eliminar reglas antiguas
                if (oldReglas.length > 0) {
                    await vpnRuleRepository.delete({ vpn: { id: vpn.id } });
                }
                // Crear nuevas reglas
                if (Array.isArray(newReglas) && newReglas.length > 0) {
                    const vpnRulesToSave = newReglas.map((regla) => {
                        return vpnRuleRepository.create({
                            id: (0, uuid_1.v4)(),
                            vpn: vpn,
                            conexion: regla.conexion ?? null,
                            fases: regla.fases ?? null,
                            origen: regla.origen ?? null,
                            destino: regla.destino ?? null,
                        });
                    });
                    await vpnRuleRepository.save(vpnRulesToSave);
                    bitacoraEntries.push({
                        campoModificado: "vpnRules",
                        valorAnterior: `${oldReglas.length} reglas`,
                        valorNuevo: `${newReglas.length} reglas`
                    });
                }
            }
        }
        // ======================
        // MOVIL
        // ======================
        if (asset.tipo === "MOVIL" && asset.movil && data.movil) {
            const detailUpdates = {};
            const movil = asset.movil;
            Object.keys(data.movil).forEach((key) => {
                const oldVal = movil[key];
                const newVal = data.movil[key];
                if (newVal !== undefined && newVal !== oldVal) {
                    detailUpdates[key] = newVal;
                    bitacoraEntries.push({
                        campoModificado: key,
                        valorAnterior: String(oldVal ?? ""),
                        valorNuevo: String(newVal ?? ""),
                    });
                }
            });
            // Convertir fechas si vienen como string
            if (detailUpdates.fechaEntrega !== undefined) {
                detailUpdates.fechaEntrega = detailUpdates.fechaEntrega
                    ? new Date(detailUpdates.fechaEntrega)
                    : null;
            }
            if (detailUpdates.fechaDevolucion !== undefined) {
                detailUpdates.fechaDevolucion = detailUpdates.fechaDevolucion
                    ? new Date(detailUpdates.fechaDevolucion)
                    : null;
            }
            if (Object.keys(detailUpdates).length > 0) {
                await movilRepository.update({ asset: { id } }, detailUpdates);
            }
        }
        // ======================
        // BITÁCORA
        // ======================
        if (bitacoraEntries.length > 0) {
            const bitacoraDataToSave = bitacoraEntries.map((entry) => ({
                asset: { id },
                autor,
                tipoEvento: "CAMBIO_CAMPO",
                descripcion: `Campo ${entry.campoModificado} modificado`,
                ...entry,
            }));
            const bitacoraRecords = bitacoraRepository.create(bitacoraDataToSave);
            await bitacoraRepository.save(bitacoraRecords);
        }
        return this.getAssetById(id);
    }
    async getBitacora(assetId, limit = 100) {
        const bitacoraRepository = database_1.AppDataSource.getRepository(Bitacora_1.Bitacora);
        return bitacoraRepository.find({
            where: { asset: { id: assetId } },
            order: { creadoEn: "DESC" },
            take: limit,
        });
    }
    async addBitacoraEntry(assetId, data) {
        await this.getAssetById(assetId);
        const bitacoraRepository = database_1.AppDataSource.getRepository(Bitacora_1.Bitacora);
        const bitacoraEntry = bitacoraRepository.create({
            asset: { id: assetId },
            ...data,
        });
        return bitacoraRepository.save(bitacoraEntry);
    }
    async getStats() {
        const assetRepository = database_1.AppDataSource.getRepository(Asset_1.Asset);
        // ════════════════════════════════════════════════════════════════
        // TOTAL: Contar Assets por Tipo
        // ════════════════════════════════════════════════════════════════
        const porTipo = await assetRepository
            .createQueryBuilder("asset")
            .select("asset.tipo", "tipo")
            .addSelect("COUNT(DISTINCT asset.id)", "count")
            .where("asset.deletedAt IS NULL")
            .groupBy("asset.tipo")
            .getRawMany();
        // Calcular total sumando todos los tipos
        const total = porTipo.reduce((sum, t) => sum + parseInt(t.count, 10), 0);
        return {
            total,
            porTipo: porTipo.map((t) => ({ tipo: t.tipo, count: parseInt(t.count, 10) })),
        };
    }
    async getAssetsByTipoAndIds(opts) {
        const assetRepository = database_1.AppDataSource.getRepository(Asset_1.Asset);
        const where = { deletedAt: (0, typeorm_1.IsNull)() };
        if (opts.tipo)
            where.tipo = opts.tipo;
        if (opts.ids && opts.ids.length > 0)
            where.id = (0, typeorm_1.In)(opts.ids);
        const assets = await assetRepository.find({
            where,
            relations: ["servidor", "red", "ups", "baseDatos", "vpn", "vpn.reglas", "movil"],
            order: { actualizadoEn: "DESC" },
            take: 10000,
        });
        return assets;
    }
    // ======================
    // SOFT DELETE / PAPELERA
    // ======================
    async softDelete(id, autor = "Sistema", motivo = "Sin motivo") {
        const assetRepository = database_1.AppDataSource.getRepository(Asset_1.Asset);
        const bitacoraRepository = database_1.AppDataSource.getRepository(Bitacora_1.Bitacora);
        const asset = await assetRepository.findOne({ where: { id } });
        if (!asset)
            throw new Error("Asset no encontrado");
        await assetRepository.update(id, {
            deletedAt: new Date(),
            motivoDeshabilitacion: motivo,
            deshabilitadoPor: autor,
        });
        const bitacoraEntry = bitacoraRepository.create({
            asset: { id },
            autor,
            tipoEvento: "NOTA",
            descripcion: "Activo deshabilitado y movido a histórico.",
        });
        await bitacoraRepository.save(bitacoraEntry);
        const updatedAsset = await assetRepository.findOne({ where: { id } });
        return updatedAsset;
    }
    async restoreAsset(id, autor = "Sistema") {
        const assetRepository = database_1.AppDataSource.getRepository(Asset_1.Asset);
        const bitacoraRepository = database_1.AppDataSource.getRepository(Bitacora_1.Bitacora);
        const asset = await assetRepository.findOne({ where: { id } });
        if (!asset)
            throw new Error("Asset no encontrado");
        await assetRepository.update(id, { deletedAt: null });
        const bitacoraEntry = bitacoraRepository.create({
            asset: { id },
            autor,
            tipoEvento: "NOTA",
            descripcion: "Activo restaurado desde papelera.",
        });
        await bitacoraRepository.save(bitacoraEntry);
        const updatedAsset = await assetRepository.findOne({ where: { id } });
        return updatedAsset;
    }
    async getDeleted() {
        const assetRepository = database_1.AppDataSource.getRepository(Asset_1.Asset);
        return assetRepository.find({
            where: { deletedAt: (0, typeorm_1.Not)((0, typeorm_1.IsNull)()) },
            relations: ["servidor", "red", "ups", "baseDatos", "vpn", "vpn.reglas", "movil"],
            order: { deletedAt: "DESC" },
        });
    }
}
exports.AssetsService = AssetsService;
exports.assetsService = new AssetsService();
