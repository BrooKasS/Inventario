import { prisma } from "../../config/database";
import { AssetFilters } from "../../types/api.types";
import { Prisma } from "@prisma/client";
import { sendToFlow } from "../utils/flow";
import { sanitizePayloadForFlow } from "../utils/flowSanitizer";
import { mapAssetsToFlowPayload } from "../utils/flowMappers";

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

  // ==================================================
  // UPDATE + SYNC AUTOMÁTICO
  // ==================================================
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
    // CAMPOS BASE
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
    // DETALLES POR TIPO
    // ======================
    const updateDetalle = async (actual: any, nuevo: any, repo: any) => {
      const detailUpdates: any = {};
      Object.keys(nuevo).forEach((key) => {
        if (nuevo[key] !== undefined && nuevo[key] !== actual[key]) {
          detailUpdates[key] = nuevo[key];
          bitacoraEntries.push({
            campoModificado: key,
            valorAnterior: String(actual[key] ?? ""),
            valorNuevo: String(nuevo[key] ?? ""),
          });
        }
      });

      if (Object.keys(detailUpdates).length > 0) {
        await repo.update({
          where: { assetId: id },
          data: detailUpdates,
        });
      }
    };

    if (asset.tipo === "SERVIDOR" && asset.servidor && data.servidor)
      await updateDetalle(asset.servidor, data.servidor, prisma.servidor);

    if (asset.tipo === "RED" && asset.red && data.red)
      await updateDetalle(asset.red, data.red, prisma.red);

    if (asset.tipo === "UPS" && asset.ups && data.ups)
      await updateDetalle(asset.ups, data.ups, prisma.ups);

    if (asset.tipo === "BASE_DATOS" && asset.baseDatos && data.baseDatos)
      await updateDetalle(asset.baseDatos, data.baseDatos, prisma.baseDatos);

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

    // ======================
    // 🔥 SYNC AUTOMÁTICO A EXCEL
    // ======================
    if (bitacoraEntries.length > 0) {
      const flowTipo =
        asset.tipo === "SERVIDOR"
          ? "TServidores"
          : asset.tipo === "RED"
          ? "TRedes"
          : asset.tipo === "UPS"
          ? "TUPS"
          : "TBD";

      // ✅ no bloqueante
      this.syncExcelInternal({
        tipo: flowTipo,
        ids: [id],
      }).catch((err) =>
        console.error(
          "[updateAsset][syncExcelInternal] Error:",
          err?.message || err
        )
      );
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
      data: { assetId, ...data },
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
    if (opts.ids?.length) where.id = { in: opts.ids };

    return prisma.asset.findMany({
      where,
      include: { servidor: true, red: true, ups: true, baseDatos: true },
      orderBy: { actualizadoEn: "desc" },
      take: 10_000,
    });
  }

  // ==================================================
  // ✅ ÚNICO MÉTODO QUE HABLA CON POWER AUTOMATE
  // ==================================================
  async syncExcelInternal(opts: { tipo: string; ids: string[] }) {
    const dbTipo =
      opts.tipo === "TServidores"
        ? "SERVIDOR"
        : opts.tipo === "TRedes"
        ? "RED"
        : opts.tipo === "TUPS"
        ? "UPS"
        : "BASE_DATOS";

    const assets = await this.getAssetsByTipoAndIds({
      tipo: dbTipo,
      ids: opts.ids.length ? opts.ids : undefined,
    });

    if (!assets.length) return;

    const payload = mapAssetsToFlowPayload(opts.tipo, assets);
    const cleanPayload = sanitizePayloadForFlow(payload);

    // ✅ Flow recibe EXACTAMENTE { tipo, assets }
    await sendToFlow(cleanPayload);
  }
}

export const assetsService = new AssetsService();
