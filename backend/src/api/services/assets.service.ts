import { AppDataSource } from "../../config/database";
import { AssetFilters } from "../../types/api.types";
import { Asset } from "../../entities/Asset";
import { Bitacora } from "../../entities/Bitacora";
import { Servidor } from "../../entities/Servidor";
import { Red } from "../../entities/Red";
import { Ups } from "../../entities/Ups";
import { BaseDatos } from "../../entities/BaseDatos";
import { Vpn } from "../../entities/Vpn";
import { Movil } from "../../entities/Movil";
import { FindOptionsWhere, In, IsNull, Not } from "typeorm";

export class AssetsService {
  async getAssets(filters: AssetFilters) {
    const { tipo, q, page = 1, limit = 50 } = filters;
    const skip = (page - 1) * limit;

    const assetRepository = AppDataSource.getRepository(Asset);

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
        .andWhere(
          "(LOWER(asset.nombre) LIKE LOWER(:q) OR LOWER(asset.codigoServicio) LIKE LOWER(:q))",
          { q: `%${q}%` }
        );

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

    const where: FindOptionsWhere<Asset> = { deletedAt: IsNull() };
    if (tipo) where.tipo = tipo as any;

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

  async getAssetById(id: string) {
    const assetRepository = AppDataSource.getRepository(Asset);
    const bitacoraRepository = AppDataSource.getRepository(Bitacora);

    const asset = await assetRepository.findOne({
      where: { id },
      relations: ["servidor", "red", "ups", "baseDatos", "vpn", "movil"],
    });

    if (!asset) throw new Error("Asset no encontrado");
    
    // Get last 50 bitacora entries from DB (same as original Prisma logic)
    const bitacora = await bitacoraRepository.find({
      where: { asset: { id } },
      order: { creadoEn: "DESC" },
      take: 50,
    });
    
    asset.bitacora = bitacora;
    return asset;
  }

  async createAsset(data: any, autor: string = "Sistema") {
    const {
      tipo, nombre, ubicacion, propietario, custodio, codigoServicio,
      servidor, red, ups, baseDatos, vpn,
      // Campos MOVIL
      numeroCaso, region, dependencia, sede, cedula, usuarioRed,
      correoResponsable, uni, marca, modelo, serial, imei1, imei2,
      sim, numeroLinea, fechaEntrega, observacionesEntrega,
    } = data;

    const assetRepository = AppDataSource.getRepository(Asset);
    const bitacoraRepository = AppDataSource.getRepository(Bitacora);
    const servidorRepository = AppDataSource.getRepository(Servidor);
    const redRepository = AppDataSource.getRepository(Red);
    const upsRepository = AppDataSource.getRepository(Ups);
    const baseDatosRepository = AppDataSource.getRepository(BaseDatos);
    const vpnRepository = AppDataSource.getRepository(Vpn);
    const movilRepository = AppDataSource.getRepository(Movil);

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

  async updateAsset(id: string, data: any, autor: string) {
    const assetRepository = AppDataSource.getRepository(Asset);
    const servidorRepository = AppDataSource.getRepository(Servidor);
    const redRepository = AppDataSource.getRepository(Red);
    const upsRepository = AppDataSource.getRepository(Ups);
    const baseDatosRepository = AppDataSource.getRepository(BaseDatos);
    const vpnRepository = AppDataSource.getRepository(Vpn);
    const movilRepository = AppDataSource.getRepository(Movil);
    const bitacoraRepository = AppDataSource.getRepository(Bitacora);

    const asset = await assetRepository.findOne({
      where: { id },
      relations: ["servidor", "red", "ups", "baseDatos", "vpn", "movil"],
    });

    if (!data || typeof data !== "object") throw new Error("Body inválido");
    if (!asset) throw new Error("Asset no encontrado");

    const updates: Partial<Asset> = {};
    const bitacoraEntries: any[] = [];

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
      const detailUpdates: any = {};
      const servidor = asset.servidor;

      Object.keys(data.servidor).forEach((key) => {
        const oldVal = (servidor as any)[key];
        const newVal = data.servidor[key];
        if (newVal !== undefined && newVal !== oldVal) {
          detailUpdates[key] = newVal;
          bitacoraEntries.push({ campoModificado: key, valorAnterior: String(oldVal ?? ""), valorNuevo: String(newVal ?? "") });
        }
      });

      if (detailUpdates.vcpu !== undefined)   detailUpdates.vcpu   = detailUpdates.vcpu   ? parseInt(detailUpdates.vcpu)   : null;
      if (detailUpdates.vramMb !== undefined) detailUpdates.vramMb = detailUpdates.vramMb ? parseInt(detailUpdates.vramMb) : null;

      if (Object.keys(detailUpdates).length > 0) {
        await servidorRepository.update({ asset: { id } }, detailUpdates);
      }
    }

    // ======================
    // RED
    // ======================

    if (asset.tipo === "RED" && asset.red && data.red) {
      const detailUpdates: any = {};
      const red = asset.red;

      Object.keys(data.red).forEach((key) => {
        const oldVal = (red as any)[key];
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
      const detailUpdates: any = {};
      const ups = asset.ups;

      Object.keys(data.ups).forEach((key) => {
        const oldVal = (ups as any)[key];
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
      const detailUpdates: any = {};
      const baseDatos = asset.baseDatos;

      Object.keys(data.baseDatos).forEach((key) => {
        const oldVal = (baseDatos as any)[key];
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
      const detailUpdates: any = {};
      const vpn = asset.vpn;

      Object.keys(data.vpn).forEach((key) => {
        const oldVal = (vpn as any)[key];
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
      const detailUpdates: any = {};
      const movil = asset.movil;

      Object.keys(data.movil).forEach((key) => {
        const oldVal = (movil as any)[key];
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
        tipoEvento: "CAMBIO_CAMPO" as const,
        descripcion: `Campo ${entry.campoModificado} modificado`,
        ...entry,
      }));
      const bitacoraRecords = bitacoraRepository.create(bitacoraDataToSave as any);
      await bitacoraRepository.save(bitacoraRecords);
    }

    return this.getAssetById(id);
  }

  async getBitacora(assetId: string, limit = 100) {
    const bitacoraRepository = AppDataSource.getRepository(Bitacora);
    return bitacoraRepository.find({
      where: { asset: { id: assetId } },
      order: { creadoEn: "DESC" },
      take: limit,
    });
  }

  async addBitacoraEntry(
    assetId: string,
    data: {
      autor: string;
      tipoEvento: "MANTENIMIENTO" | "INCIDENTE" | "NOTA";
      descripcion: string;
    }
  ) {
    await this.getAssetById(assetId);
    const bitacoraRepository = AppDataSource.getRepository(Bitacora);
    const bitacoraEntry = bitacoraRepository.create({
      asset: { id: assetId },
      ...data,
    });
    return bitacoraRepository.save(bitacoraEntry);
  }

  async getStats() {
    const assetRepository = AppDataSource.getRepository(Asset);

    const total = await assetRepository.count({ where: { deletedAt: IsNull() } });

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

  async getAssetsByTipoAndIds(opts: { tipo?: string; ids?: string[] }) {
    const assetRepository = AppDataSource.getRepository(Asset);

    const where: FindOptionsWhere<Asset> = { deletedAt: IsNull() };

    if (opts.tipo) where.tipo = opts.tipo as any;
    if (opts.ids && opts.ids.length > 0) where.id = In(opts.ids);

    const assets = await assetRepository.find({
      where,
      relations: ["servidor", "red", "ups", "baseDatos", "vpn", "movil"],
      order: { actualizadoEn: "DESC" },
      take: 10_000,
    });

    return assets;
  }

  // ======================
  // SOFT DELETE / PAPELERA
  // ======================

  async softDelete(id: string, autor: string = "Sistema") {
    const assetRepository = AppDataSource.getRepository(Asset);
    const bitacoraRepository = AppDataSource.getRepository(Bitacora);

    const asset = await assetRepository.findOne({ where: { id } });
    if (!asset) throw new Error("Asset no encontrado");

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

  async restoreAsset(id: string, autor: string = "Sistema") {
    const assetRepository = AppDataSource.getRepository(Asset);
    const bitacoraRepository = AppDataSource.getRepository(Bitacora);

    const asset = await assetRepository.findOne({ where: { id } });
    if (!asset) throw new Error("Asset no encontrado");

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
    const assetRepository = AppDataSource.getRepository(Asset);
    return assetRepository.find({
      where: { deletedAt: Not(IsNull()) },
      relations: ["servidor", "red", "ups", "baseDatos", "vpn", "movil"],
      order: { deletedAt: "DESC" },
    });
  }
}

export const assetsService = new AssetsService();