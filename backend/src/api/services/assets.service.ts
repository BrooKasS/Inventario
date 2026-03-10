import { prisma } from "../../config/database";
import { AssetFilters } from "../../types/api.types";
import { Prisma } from "@prisma/client";

export class AssetsService {
  async getAssets(filters: AssetFilters) {
    const { tipo, q, page = 1, limit = 50 } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.AssetWhereInput = {};

    if (tipo) where.tipo = tipo;

    if (q) {
      where.OR = [
        { nombre: { contains: q, mode: "insensitive" } },
        { codigoServicio: { contains: q, mode: "insensitive" } },
      ];
    }

    const [assets, total] = await Promise.all([
      prisma.asset.findMany({
        where,
        skip,
        take: limit,
        include: {
          servidor: true,
          red: true,
          ups: true,
          baseDatos: true,
        },
        orderBy: { actualizadoEn: "desc" },
      }),
      prisma.asset.count({ where }),
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
    const asset = await prisma.asset.findUnique({
      where: { id },
      include: {
        servidor: true,
        red: true,
        ups: true,
        baseDatos: true,
        bitacora: {
          orderBy: { creadoEn: "desc" },
          take: 50,
        },
      },
    });

    if (!asset) throw new Error("Asset no encontrado");
    return asset;
  }

  async updateAsset(id: string, data: any, autor: string) {
    const asset = await prisma.asset.findUnique({
      where: { id },
      include: {
        servidor: true,
        red: true,
        ups: true,
        baseDatos: true,
      },
    });
    if (!data || typeof data !== "object") {
  throw new Error("Body inválido");
}

    if (!asset) throw new Error("Asset no encontrado");

    const updates: any = {};
    const bitacoraEntries: any[] = [];

    // ======================
    // CAMPOS BASE DE ASSET
    // ======================

    if (data.nombre !== undefined && data.nombre !== asset.nombre) {
      updates.nombre = data.nombre;
      bitacoraEntries.push({
        campoModificado: "nombre",
        valorAnterior: asset.nombre,
        valorNuevo: data.nombre,
      });
    }

    if (data.ubicacion !== undefined && data.ubicacion !== asset.ubicacion) {
      updates.ubicacion = data.ubicacion;
      bitacoraEntries.push({
        campoModificado: "ubicacion",
        valorAnterior: asset.ubicacion,
        valorNuevo: data.ubicacion,
      });
    }

    if (data.propietario !== undefined && data.propietario !== asset.propietario) {
      updates.propietario = data.propietario;
      bitacoraEntries.push({
        campoModificado: "propietario",
        valorAnterior: asset.propietario,
        valorNuevo: data.propietario,
      });
    }

    if (data.custodio !== undefined && data.custodio !== asset.custodio) {
      updates.custodio = data.custodio;
      bitacoraEntries.push({
        campoModificado: "custodio",
        valorAnterior: asset.custodio,
        valorNuevo: data.custodio,
      });
    }

    if (Object.keys(updates).length > 0) {
      await prisma.asset.update({
        where: { id },
        data: updates,
      });
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
          bitacoraEntries.push({
            campoModificado: key,
            valorAnterior: String(oldVal ?? ""),
            valorNuevo: String(newVal ?? ""),
          });
        }
      });

      if (Object.keys(detailUpdates).length > 0) {
        await prisma.servidor.update({
          where: { assetId: id },
          data: detailUpdates,
        });
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
          bitacoraEntries.push({
            campoModificado: key,
            valorAnterior: String(oldVal ?? ""),
            valorNuevo: String(newVal ?? ""),
          });
        }
      });

      if (Object.keys(detailUpdates).length > 0) {
        await prisma.red.update({
          where: { assetId: id },
          data: detailUpdates,
        });
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
          bitacoraEntries.push({
            campoModificado: key,
            valorAnterior: String(oldVal ?? ""),
            valorNuevo: String(newVal ?? ""),
          });
        }
      });

      if (Object.keys(detailUpdates).length > 0) {
        await prisma.ups.update({
          where: { assetId: id },
          data: detailUpdates,
        });
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
          bitacoraEntries.push({
            campoModificado: key,
            valorAnterior: String(oldVal ?? ""),
            valorNuevo: String(newVal ?? ""),
          });
        }
      });

      if (Object.keys(detailUpdates).length > 0) {
        await prisma.baseDatos.update({
          where: { assetId: id },
          data: detailUpdates,
        });
      }
    }

    // ======================
    // BITÁCORA
    // ======================

    if (bitacoraEntries.length > 0) {
      await prisma.bitacora.createMany({
        data: bitacoraEntries.map((entry) => ({
          assetId: id,
          autor,
          tipoEvento: "CAMBIO_CAMPO" as const,
          descripcion: `Campo ${entry.campoModificado} modificado`,
          ...entry,
        })),
      });
    }

    return this.getAssetById(id);
  }

  async getBitacora(assetId: string, limit = 100) {
    return prisma.bitacora.findMany({
      where: { assetId },
      orderBy: { creadoEn: "desc" },
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

    return prisma.bitacora.create({
      data: {
        assetId,
        ...data,
      },
    });
  }

  async getStats() {
    const [total, porTipo] = await Promise.all([
      prisma.asset.count(),
      prisma.asset.groupBy({
        by: ["tipo"],
        _count: true,
      }),
    ]);

    return {
      total,
      porTipo: porTipo.map((t) => ({ tipo: t.tipo, count: t._count })),
    };
  }
  
async getAssetsByTipoAndIds(opts: { tipo?: string; ids?: string[] }) {
    const where: Prisma.AssetWhereInput = {};

    if (opts.tipo) where.tipo = opts.tipo as any;
    if (opts.ids && opts.ids.length > 0) where.id = { in: opts.ids };

    const assets = await prisma.asset.findMany({
      where,
      include: { servidor: true, red: true, ups: true, baseDatos: true },
      orderBy: { actualizadoEn: "desc" },
      take: 10_000, // suficiente para sincronizar todo
    });

    return assets;
  }

}

export const assetsService = new AssetsService();