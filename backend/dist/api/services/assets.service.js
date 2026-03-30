"use strict";
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
const Movil_1 = require("../../entities/Movil");
const typeorm_1 = require("typeorm");
class AssetsService {
    async getAssets(filters) {
        const { tipo, q, page = 1, limit = 50 } = filters;
        const skip = (page - 1) * limit;
        const assetRepository = database_1.AppDataSource.getRepository(Asset_1.Asset);
        if (q) {
            // Use query builder for OR conditions
            const qb = assetRepository
                .createQueryBuilder("asset")
                .leftJoinAndSelect("asset.servidor", "servidor")
                .leftJoinAndSelect("asset.red", "red")
                .leftJoinAndSelect("asset.ups", "ups")
                .leftJoinAndSelect("asset.baseDatos", "baseDatos")
                .leftJoinAndSelect("asset.vpn", "vpn")
                .leftJoinAndSelect("asset.movil", "movil")
                .where("asset.deletedAt IS NULL")
                .andWhere("(LOWER(asset.nombre) LIKE LOWER(:q) OR LOWER(asset.codigoServicio) LIKE LOWER(:q))", { q: `%${q}%` });
            if (tipo) {
                qb.andWhere("asset.tipo = :tipo", { tipo });
            }
            const [assets, total] = await qb
                .orderBy("asset.actualizadoEn", "DESC")
                .skip(skip)
                .take(limit)
                .getManyAndCount();
            return {
                assets,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            };
        }
        const where = { deletedAt: (0, typeorm_1.IsNull)() };
        if (tipo)
            where.tipo = tipo;
        const [assets, total] = await Promise.all([
            assetRepository.find({
                where,
                relations: ["servidor", "red", "ups", "baseDatos", "vpn", "movil"],
                order: { actualizadoEn: "DESC" },
                skip,
                take: limit,
            }),
            assetRepository.count({ where }),
        ]);
        return {
            assets,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async getAssetById(id) {
        const assetRepository = database_1.AppDataSource.getRepository(Asset_1.Asset);
        const bitacoraRepository = database_1.AppDataSource.getRepository(Bitacora_1.Bitacora);
        const asset = await assetRepository.findOne({
            where: { id },
            relations: ["servidor", "red", "ups", "baseDatos", "vpn", "movil"],
        });
        if (!asset)
            throw new Error("Asset no encontrado");
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
        // Campos MOVIL
        numeroCaso, region, dependencia, sede, cedula, usuarioRed, correoResponsable, uni, marca, modelo, serial, imei1, imei2, sim, numeroLinea, fechaEntrega, observacionesEntrega, } = data;
        const assetRepository = database_1.AppDataSource.getRepository(Asset_1.Asset);
        const bitacoraRepository = database_1.AppDataSource.getRepository(Bitacora_1.Bitacora);
        const servidorRepository = database_1.AppDataSource.getRepository(Servidor_1.Servidor);
        const redRepository = database_1.AppDataSource.getRepository(Red_1.Red);
        const upsRepository = database_1.AppDataSource.getRepository(Ups_1.Ups);
        const baseDatosRepository = database_1.AppDataSource.getRepository(BaseDatos_1.BaseDatos);
        const vpnRepository = database_1.AppDataSource.getRepository(Vpn_1.Vpn);
        const movilRepository = database_1.AppDataSource.getRepository(Movil_1.Movil);
        // Create asset
        const asset = assetRepository.create({
            tipo,
            nombre,
            ubicacion: ubicacion ?? null,
            propietario: propietario ?? null,
            custodio: custodio ?? null,
            codigoServicio: codigoServicio ?? null,
        });
        const savedAsset = await assetRepository.save(asset);
        // Create related detail if provided
        if (servidor) {
            const servidorData = servidorRepository.create({ ...servidor, asset: savedAsset });
            await servidorRepository.save(servidorData);
        }
        if (red) {
            const redData = redRepository.create({ ...red, asset: savedAsset });
            await redRepository.save(redData);
        }
        if (ups) {
            const upsData = upsRepository.create({ ...ups, asset: savedAsset });
            await upsRepository.save(upsData);
        }
        if (baseDatos) {
            const baseDatosData = baseDatosRepository.create({ ...baseDatos, asset: savedAsset });
            await baseDatosRepository.save(baseDatosData);
        }
        if (vpn) {
            const vpnData = vpnRepository.create({ ...vpn, asset: savedAsset });
            await vpnRepository.save(vpnData);
        }
        // Create movil if tipo is MOVIL
        if (tipo === "MOVIL") {
            const movilData = movilRepository.create({
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
                asset: savedAsset,
            });
            await movilRepository.save(movilData);
        }
        // Create bitacora entry
        const bitacoraEntry = bitacoraRepository.create({
            asset: savedAsset,
            autor,
            tipoEvento: "IMPORTACION",
            descripcion: "Activo creado manualmente.",
        });
        await bitacoraRepository.save(bitacoraEntry);
        // Return asset with relations
        return assetRepository.findOne({
            where: { id: savedAsset.id },
            relations: ["servidor", "red", "ups", "baseDatos", "vpn", "movil"],
        });
    }
    async updateAsset(id, data, autor) {
        const assetRepository = database_1.AppDataSource.getRepository(Asset_1.Asset);
        const servidorRepository = database_1.AppDataSource.getRepository(Servidor_1.Servidor);
        const redRepository = database_1.AppDataSource.getRepository(Red_1.Red);
        const upsRepository = database_1.AppDataSource.getRepository(Ups_1.Ups);
        const baseDatosRepository = database_1.AppDataSource.getRepository(BaseDatos_1.BaseDatos);
        const vpnRepository = database_1.AppDataSource.getRepository(Vpn_1.Vpn);
        const movilRepository = database_1.AppDataSource.getRepository(Movil_1.Movil);
        const bitacoraRepository = database_1.AppDataSource.getRepository(Bitacora_1.Bitacora);
        const asset = await assetRepository.findOne({
            where: { id },
            relations: ["servidor", "red", "ups", "baseDatos", "vpn", "movil"],
        });
        if (!data || typeof data !== "object")
            throw new Error("Body inválido");
        if (!asset)
            throw new Error("Asset no encontrado");
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
        const total = await assetRepository.count({ where: { deletedAt: (0, typeorm_1.IsNull)() } });
        const porTipo = await assetRepository
            .createQueryBuilder("asset")
            .select("asset.tipo", "tipo")
            .addSelect("COUNT(*)", "count")
            .where("asset.deletedAt IS NULL")
            .groupBy("asset.tipo")
            .getRawMany();
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
            relations: ["servidor", "red", "ups", "baseDatos", "vpn", "movil"],
            order: { actualizadoEn: "DESC" },
            take: 10000,
        });
        return assets;
    }
    // ======================
    // SOFT DELETE / PAPELERA
    // ======================
    async softDelete(id, autor = "Sistema") {
        const assetRepository = database_1.AppDataSource.getRepository(Asset_1.Asset);
        const bitacoraRepository = database_1.AppDataSource.getRepository(Bitacora_1.Bitacora);
        const asset = await assetRepository.findOne({ where: { id } });
        if (!asset)
            throw new Error("Asset no encontrado");
        await assetRepository.update(id, { deletedAt: new Date() });
        const bitacoraEntry = bitacoraRepository.create({
            asset: { id },
            autor,
            tipoEvento: "NOTA",
            descripcion: "Activo eliminado y movido a papelera.",
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
            relations: ["servidor", "red", "ups", "baseDatos", "vpn", "movil"],
            order: { deletedAt: "DESC" },
        });
    }
}
exports.AssetsService = AssetsService;
exports.assetsService = new AssetsService();
