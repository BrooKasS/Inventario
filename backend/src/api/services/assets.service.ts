import { AppDataSource } from "../../config/database";
import { AssetFilters } from "../../types/api.types";
import { Asset } from "../../entities/Asset";
import { Bitacora } from "../../entities/Bitacora";
import { Servidor } from "../../entities/Servidor";
import { Red } from "../../entities/Red";
import { Ups } from "../../entities/Ups";
import { BaseDatos } from "../../entities/BaseDatos";
import { Vpn } from "../../entities/Vpn";
import { VpnRule } from "../../entities/VpnRule";
import { Movil } from "../../entities/Movil";
import { EstadoMovil } from "../../entities/Movil";
import { FindOptionsWhere, In, IsNull, Not } from "typeorm";
import { v4 as uuidv4 } from "uuid";
import { generarWordEntrega, generarWordDevolucion } from "../utils/generarMovilDocx";
import { sendMovilEmail } from "../utils/sendMovilEmail";
import fs from "fs";
import { sendToFlowRaw } from "../utils/flowRaw";
import path from "path";
import { sendToFlowFirmada } from "../utils/flowRaw";
import { sendToFlowDevolucion, sendToFlowFirmarDevolucion, sendToFlowArchivoDevolucion } from "../utils/flowRaw";
import { validateAssetData, isCreatedToday } from "../utils/validationRules";

export class AssetsService {
  async getAssets(filters: AssetFilters) {
    const { tipo, q, page = 1, limit = 50 } = filters;
    const skip = (page - 1) * limit;
    

    const assetRepository = AppDataSource.getRepository(Asset);
    const vpnRepository = AppDataSource.getRepository(Vpn);

    // ════════════════════════════════════════════════════════════════════════
    // PARA VPN: OBTENER SOLO PRINCIPALES (1 por cada conexion/IP)
    // ════════════════════════════════════════════════════════════════════════
    let vpnPrincipalesIds: string[] = [];
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
      
      vpnPrincipalesIds = vpnPrincipales.map((v: any) => v.id);
      
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
<<<<<<< HEAD
        .leftJoinAndSelect("vpn.reglas", "vpnRules")
        .leftJoinAndSelect("asset.movil", "movil")
        .where("asset.deletedAt IS NULL");
=======
        .leftJoinAndSelect("asset.movil", "movil")  
        .where("asset.deletedAt IS NULL")
        .andWhere(
          "(LOWER(asset.nombre) LIKE LOWER(:q) OR LOWER(asset.codigoServicio) LIKE LOWER(:q))",
          { q: `%${q}%` }
        );
>>>>>>> d25d44e15ff308652b3840ebbb904ae5ff746568

      if (tipo) {
        qb.andWhere("asset.tipo = :tipo", { tipo });
      }

      if (tipo === "VPN") {
        if (vpnPrincipalesIds.length > 0) {
          qb.andWhere("vpn.id IN (:...vpnIds)", { vpnIds: vpnPrincipalesIds });
        } else {
          qb.andWhere("1 = 0");
        }
      }

      qb.andWhere(
        "(LOWER(asset.nombre) LIKE LOWER(:q) OR LOWER(asset.codigoServicio) LIKE LOWER(:q))",
        { q: `%${q}%` }
      );

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
      } else {
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

  async getAssetById(id: string) {
    const assetRepository = AppDataSource.getRepository(Asset);
    const bitacoraRepository = AppDataSource.getRepository(Bitacora);
<<<<<<< HEAD
    const vpnRepository = AppDataSource.getRepository(Vpn);
=======
    
>>>>>>> d25d44e15ff308652b3840ebbb904ae5ff746568

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

    if (!asset) throw new Error("Asset no encontrado");
    
    // ════════════════════════════════════════════════════════════════
    // SI ES VPN: CARGAR TAMBIÉN LAS REGLAS HISTÓRICAS (VPNs hermanas)
    // ════════════════════════════════════════════════════════════════
    if (asset.vpn && asset.vpn.conexion) {
      // Buscar todas las VPNs con el mismo conexion (reglas históricas)
      const vpnRelacionadas = await vpnRepository.find({
        where: { conexion: asset.vpn.conexion },
      });
      
      // Filtrar: excluir la VPN principal (la del asset), el resto son históricas
      const reglasHistoricas = vpnRelacionadas.filter((v: Vpn) => v.id !== asset.vpn!.id);
      
      // Guardar en un campo adicional (compatible con frontend)
      (asset.vpn as any).reglasHistoricas = reglasHistoricas;
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

  async createAsset(data: any, autor: string = "Sistema") {
    const {
      tipo, nombre, ubicacion, propietario, custodio, codigoServicio,
      servidor, red, ups, baseDatos, vpn,
      numeroCaso, region, dependencia, sede, cedula, usuarioRed,
      correoResponsable, uni, marca, modelo, serial, imei1, imei2,
      sim, numeroLinea, fechaEntrega, observacionesEntrega,
    } = data;

<<<<<<< HEAD
    const assetRepository     = AppDataSource.getRepository(Asset);
    const bitacoraRepository  = AppDataSource.getRepository(Bitacora);
    const servidorRepository  = AppDataSource.getRepository(Servidor);
    const redRepository       = AppDataSource.getRepository(Red);
    const upsRepository       = AppDataSource.getRepository(Ups);
    const baseDatosRepository = AppDataSource.getRepository(BaseDatos);
    const vpnRepository       = AppDataSource.getRepository(Vpn);
    const vpnRuleRepository   = AppDataSource.getRepository(VpnRule);
    const movilRepository     = AppDataSource.getRepository(Movil);
=======
    // ✅ VALIDACIÓN: nuevas entradas SIEMPRE se validan
    const { valid, errors } = validateAssetData(tipo, data, true);
    if (!valid) {
      throw new Error(`Validación fallida: ${errors.join(", ")}`);
    }

    const assetRepository = AppDataSource.getRepository(Asset);
    const bitacoraRepository = AppDataSource.getRepository(Bitacora);
    const servidorRepository = AppDataSource.getRepository(Servidor);
    const redRepository      = AppDataSource.getRepository(Red);
    const upsRepository      = AppDataSource.getRepository(Ups);
    const baseDatosRepository= AppDataSource.getRepository(BaseDatos);
    const vpnRepository      = AppDataSource.getRepository(Vpn);
    const movilRepository    = AppDataSource.getRepository(Movil);
>>>>>>> d25d44e15ff308652b3840ebbb904ae5ff746568

    // ── Crear Asset base ──
    const asset = assetRepository.create({
      tipo,
      nombre,
      ubicacion:       ubicacion       ?? null,
      propietario:     propietario     ?? null,
      custodio:        custodio        ?? null,
      codigoServicio:  codigoServicio  ?? null,
    });

    const savedAsset = await assetRepository.save(asset);

    // ======================
    // RELACIONES
    // ======================
    if (servidor) {
      const servidorToSave = { ...servidor, asset: savedAsset };
      if (!servidorToSave.id) servidorToSave.id = uuidv4();
      await servidorRepository.save(servidorToSave);
    }
    if (red) {
      const redToSave = { ...red, asset: savedAsset };
      if (!redToSave.id) redToSave.id = uuidv4();
      await redRepository.save(redToSave);
    }
    if (ups) {
      const upsToSave = { ...ups, asset: savedAsset };
      if (!upsToSave.id) upsToSave.id = uuidv4();
      await upsRepository.save(upsToSave);
    }
    if (baseDatos) {
      const baseDatosToSave = { ...baseDatos, asset: savedAsset };
      if (!baseDatosToSave.id) baseDatosToSave.id = uuidv4();
      await baseDatosRepository.save(baseDatosToSave);
    }
    if (vpn) {
      const vpnToSave = { ...vpn, asset: savedAsset };
      if (!vpnToSave.id) vpnToSave.id = uuidv4();
<<<<<<< HEAD
      
      // Separar reglas del objeto VPN
      const reglas = vpnToSave.reglas || [];
      delete vpnToSave.reglas; // Remover reglas del objeto principal
      
      // Guardar VPN principal
      const savedVpn = await vpnRepository.save(vpnToSave);
      
      // Guardar reglas como VpnRule separadas
      if (reglas && Array.isArray(reglas) && reglas.length > 0) {
        const vpnRulesToSave = reglas.map((regla: any) => {
          const rule = vpnRuleRepository.create({
            id: uuidv4(),
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
=======
      await vpnRepository.save(vpnToSave);
>>>>>>> d25d44e15ff308652b3840ebbb904ae5ff746568
    }

    // ── MOVIL: genera solo el acta de ENTREGA ──
    if (tipo === "MOVIL") {
      const movilData = movilRepository.create({
        id:                  savedAsset.id,
        asset:               savedAsset,
        numeroCaso:          numeroCaso          ?? null,
        region:              region              ?? null,
        dependencia:         dependencia         ?? null,
        sede:                sede                ?? null,
        cedula:              cedula              ?? null,
        usuarioRed:          usuarioRed          ?? null,
        correoResponsable:   correoResponsable   ?? null,
        uni:                 uni                 ?? null,
        marca:               marca               ?? null,
        modelo:              modelo              ?? null,
        serial:              serial              ?? null,
        imei1:               imei1               ?? null,
        imei2:               imei2               ?? null,
        sim:                 sim                 ?? null,
        numeroLinea:         numeroLinea         ?? null,
        fechaEntrega:        fechaEntrega ? new Date(fechaEntrega) : null,
        observacionesEntrega: observacionesEntrega ?? null,
        estados:             "ENTREGADO",
      });

      await movilRepository.save(movilData);

      // Generar acta de ENTREGA (sin datos de devolución)
      const bufferEntrega = await generarWordEntrega({
        nombre:               savedAsset.nombre,
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
        fechaDevolucion:          null,
        observacionesDevolucion:  null,
        firmaPath:                null,
        fechaFirma:               null,
      });

      // Enviar correo de entrega si hay responsable
      if (correoResponsable) {
        try {
          await sendMovilEmail({
            correo:        correoResponsable,
            nombreActivo:  savedAsset.nombre!,
            assetId:       savedAsset.id,
            linkFirma:     `${process.env.FRONTEND_URL}/firmar/${savedAsset.id}`,
          });

          await bitacoraRepository.save(
            bitacoraRepository.create({
              asset:       savedAsset,
              autor:       "Sistema",
              tipoEvento:  "NOTA",
              descripcion: `Acta de entrega enviada a ${correoResponsable}`,
            })
          );
          
        } catch (error) {
          console.error("⚠️ Error enviando acta MOVIL:", error);
        }
      }
    }

    // ── Bitácora creación ──
    await bitacoraRepository.save(
      bitacoraRepository.create({
        asset:       savedAsset,
        autor,
        tipoEvento:  "IMPORTACION",
        descripcion: "Activo creado manualmente.",
      })
    );

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

  async cambiarEstadoMovil(assetId: string) {
    const movilRepo    = AppDataSource.getRepository(Movil);
    const bitacoraRepo = AppDataSource.getRepository(Bitacora);

    const movil = await movilRepo.findOne({
      where: { id: assetId },
      relations: ["asset"],
    });

    if (!movil) throw new Error("Movil no encontrado");

    if (movil.estados === "DEVUELTO") {
      return { estado: movil.estados };
    }

    let nuevoEstado: EstadoMovil;

    switch (movil.estados) {
      case "ENTREGADO":  nuevoEstado = "DEVOLUCION"; break;
      case "DEVOLUCION": nuevoEstado = "PENDIENTE";  break;
      case "PENDIENTE":  nuevoEstado = "DEVUELTO";   break;
      default: throw new Error("Estado no válido");
    }

    await movilRepo.update({ id: assetId }, { estados: nuevoEstado });

    try {
      if (nuevoEstado === "DEVOLUCION" && movil.correoResponsable) {
        await sendToFlowDevolucion({
          correo:       movil.correoResponsable,
          nombreActivo: movil.asset?.nombre || "Activo",
          assetId,
        });
      }

      if (nuevoEstado === "PENDIENTE" && movil.correoResponsable) {
        await sendToFlowFirmarDevolucion({
          correo:       movil.correoResponsable,
          nombreActivo: movil.asset?.nombre || "Activo",
          assetId,
          linkFirma:    `${process.env.FRONTEND_URL}/firmar-devolucion/${assetId}`,
        });
      }
    } catch (error) {
      console.warn("⚠️ Error en envío de correos:", error);
    }

    await bitacoraRepo.save(
      bitacoraRepo.create({
        asset:       movil.asset,
        autor:       "Sistema",
        tipoEvento:  "NOTA",
        descripcion: `Cambio de estado a ${nuevoEstado}`,
      })
    );

    return { estado: nuevoEstado };
  }

  async firmarMovil(assetId: string, firmaBase64: string, observacionesEntrega?: string) {
    assetId = assetId.replace(/[^a-fA-F0-9-]/g, "");

    const assetRepo    = AppDataSource.getRepository(Asset);
    const movilRepo    = AppDataSource.getRepository(Movil);
    const bitacoraRepo = AppDataSource.getRepository(Bitacora);

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

    // 1️⃣ Guardar firma PNG
    const firmaBuffer = Buffer.from(
      firmaBase64.replace(/^data:image\/png;base64,/, ""),
      "base64"
    );

    const firmaDir  = path.join(process.cwd(), "storage/firmas");
    fs.mkdirSync(firmaDir, { recursive: true });

    const firmaPath = path.join(firmaDir, `${assetId}.png`);
    fs.writeFileSync(firmaPath, firmaBuffer);

    const fechaFirma = new Date();

    await movilRepo.update(
      { id: assetId },
      {
        firmaPath,
        fechaFirma,
        observacionesEntrega: observacionesEntrega ?? asset.movil.observacionesEntrega,
      }
    );

    // 2️⃣ Generar SOLO el acta de ENTREGA firmada
    const m = asset.movil;

    const bufferEntrega = await generarWordEntrega({
      nombre:                  asset.nombre,
      numeroCaso:              m.numeroCaso,
      region:                  m.region,
      dependencia:             m.dependencia,
      sede:                    m.sede,
      cedula:                  m.cedula,
      usuarioRed:              m.usuarioRed,
      uni:                     m.uni,
      marca:                   m.marca,
      modelo:                  m.modelo,
      serial:                  m.serial,
      imei1:                   m.imei1,
      imei2:                   m.imei2,
      sim:                     m.sim,
      numeroLinea:             m.numeroLinea,
      fechaEntrega:            m.fechaEntrega,
      observacionesEntrega:    observacionesEntrega ?? m.observacionesEntrega,
      fechaDevolucion:         null,
      observacionesDevolucion: null,
      firmaPath,
      fechaFirma,
    });

    // 3️⃣ Enviar acta de ENTREGA al Flow
    try {
      const nombreArchivo  = `Acta_Entrega_${asset.nombre?.replace(/\s+/g, "_")}.docx`;
      const archivoBase64  = bufferEntrega.toString("base64");


      await sendToFlowFirmada({
        correo:              m.correoResponsable,
        nombreActivo:        asset.nombre,
        assetId,
        nombreArchivo,
        observacionesEntrega,
        archivoBase64,
      });
      

      await bitacoraRepo.save(
        bitacoraRepo.create({
          asset:       asset,
          autor:       "Sistema",
          tipoEvento:  "NOTA",
          descripcion: "Acta de entrega firmada enviada a Power Automate.",
        })
      );
    } catch (error) {
      console.error("⚠️ Error enviando acta de entrega firmada al Flow:", error);
    }

    // 4️⃣ Bitácora final
    await bitacoraRepo.save(
      bitacoraRepo.create({
        asset:       asset,
        autor:       "Usuario",
        tipoEvento:  "NOTA",
        descripcion: "Acta de entrega firmada digitalmente. Equipo listo para entrega.",
      })
    );

    return { ok: true, fechaFirma };
  }

  async firmarDevolucion(assetId: string, firmaBase64: string) {
    try {
      const movilRepo    = AppDataSource.getRepository(Movil);
      const bitacoraRepo = AppDataSource.getRepository(Bitacora);

      const movil = await movilRepo.findOne({
        where: { id: assetId },
        relations: ["asset"],
      });

      if (!movil) throw new Error("Movil no encontrado");

      if (movil.fechaDevolucion) {
        throw new Error("Este activo ya fue devuelto");
      }

      if (movil.estados !== "PENDIENTE") {
        throw new Error("El activo no está listo para devolución");
      }

      // Guardar firma de devolución
      const firmaBuffer = Buffer.from(
        firmaBase64.replace(/^data:image\/png;base64,/, ""),
        "base64"
      );

      const firmaDir  = path.join(process.cwd(), "storage/firmas");
      fs.mkdirSync(firmaDir, { recursive: true });

      const firmaPath = path.join(firmaDir, `${assetId}_devolucion.png`);
      fs.writeFileSync(firmaPath, firmaBuffer);

      const fechaDevolucion = new Date();

      await movilRepo.update(
        { id: assetId },
        { fechaDevolucion, estados: "DEVUELTO" }
      );

      // Generar SOLO el acta de DEVOLUCIÓN
      const bufferDevolucion = await generarWordDevolucion({
        ...movil,
        nombre:         movil.asset.nombre,
        firmaPathFinal: firmaPath,
        fechaDevolucion,
      });

      // Enviar acta de DEVOLUCIÓN al Flow
      try {
        const nombreArchivo = `Acta_Devolucion_${movil.asset.nombre?.replace(/\s+/g, "_")}.docx`;

        await sendToFlowArchivoDevolucion({
          correo:        movil.correoResponsable,
          nombreActivo:  movil.asset.nombre,
          assetId,
          nombreArchivo,
          archivoBase64: bufferDevolucion.toString("base64"),
        });
      } catch (flowError) {
        console.error("⚠️ Error enviando acta de devolución al Flow:", flowError);
      }

      // Bitácora
      await bitacoraRepo.save(
        bitacoraRepo.create({
          asset:       movil.asset,
          autor:       "Usuario",
          tipoEvento:  "NOTA",
          descripcion: "Devolución firmada correctamente. Acta de devolución generada y enviada.",
        })
      );

      return { ok: true };

    } catch (error) {
      console.error("❌ Error en firmarDevolucion:", error);
      return {
        ok:    false,
        error: (error as Error).message || "Error inesperado",
      };
    }
  }

  async updateAsset(id: string, data: any, autor: string) {
    const assetRepository     = AppDataSource.getRepository(Asset);
    const servidorRepository  = AppDataSource.getRepository(Servidor);
    const redRepository       = AppDataSource.getRepository(Red);
    const upsRepository       = AppDataSource.getRepository(Ups);
    const baseDatosRepository = AppDataSource.getRepository(BaseDatos);
    const vpnRepository       = AppDataSource.getRepository(Vpn);
    const vpnRuleRepository   = AppDataSource.getRepository(VpnRule);
    const movilRepository     = AppDataSource.getRepository(Movil);
    const bitacoraRepository  = AppDataSource.getRepository(Bitacora);

    const asset = await assetRepository.findOne({
      where: { id },
      relations: ["servidor", "red", "ups", "baseDatos", "vpn", "vpn.reglas", "movil"],
    });

    if (!data || typeof data !== "object") throw new Error("Body inválido");
    if (!asset) throw new Error("Asset no encontrado");

<<<<<<< HEAD
    //  Valida si el registro es nuevo , si es nuevo, agarra las funciones de validación
=======
    // ✅ VALIDACIÓN: solo validar si es registro NUEVO (creado hoy)
>>>>>>> d25d44e15ff308652b3840ebbb904ae5ff746568
    const isNewRecord = isCreatedToday(asset.creadoEn);
    if (isNewRecord) {
      const { valid, errors } = validateAssetData(asset.tipo, data, false);
      if (!valid) {
        throw new Error(`Validación fallida: ${errors.join(", ")}`);
      }
    }

    const updates: Partial<Asset> = {};
    const bitacoraEntries: any[]  = [];

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
      if (detailUpdates.vcpu   !== undefined) detailUpdates.vcpu   = detailUpdates.vcpu   ? parseInt(detailUpdates.vcpu)   : null;
      if (detailUpdates.vramMb !== undefined) detailUpdates.vramMb = detailUpdates.vramMb ? parseInt(detailUpdates.vramMb) : null;
      if (Object.keys(detailUpdates).length > 0) await servidorRepository.update({ asset: { id } }, detailUpdates);
    }

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
      if (Object.keys(detailUpdates).length > 0) await redRepository.update({ asset: { id } }, detailUpdates);
    }

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
      if (Object.keys(detailUpdates).length > 0) await upsRepository.update({ asset: { id } }, detailUpdates);
    }

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
      if (Object.keys(detailUpdates).length > 0) await baseDatosRepository.update({ asset: { id } }, detailUpdates);
    }

    if (asset.tipo === "VPN" && asset.vpn && data.vpn) {
      const detailUpdates: any = {};
      const vpn = asset.vpn;
      Object.keys(data.vpn).forEach((key) => {
        if (key === "reglas") return; // Manejar reglas por separado
        
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
          const vpnRulesToSave = newReglas.map((regla: any) => {
            return vpnRuleRepository.create({
              id: uuidv4(),
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

    if (asset.tipo === "MOVIL" && asset.movil && data.movil) {
      const detailUpdates: any = {};
      const movil = asset.movil;
      Object.keys(data.movil).forEach((key) => {
        const oldVal = (movil as any)[key];
        const newVal = data.movil[key];
        if (newVal !== undefined && newVal !== oldVal) {
          detailUpdates[key] = newVal;
          bitacoraEntries.push({ campoModificado: key, valorAnterior: String(oldVal ?? ""), valorNuevo: String(newVal ?? "") });
        }
      });
      if (detailUpdates.fechaEntrega !== undefined) {
        detailUpdates.fechaEntrega = detailUpdates.fechaEntrega ? new Date(detailUpdates.fechaEntrega) : null;
      }
      if (detailUpdates.fechaDevolucion !== undefined) {
        detailUpdates.fechaDevolucion = detailUpdates.fechaDevolucion ? new Date(detailUpdates.fechaDevolucion) : null;
      }
      if (Object.keys(detailUpdates).length > 0) await movilRepository.update({ asset: { id } }, detailUpdates);
    }

    if (bitacoraEntries.length > 0) {
      const bitacoraDataToSave = bitacoraEntries.map((entry) => ({
        asset: { id },
        autor,
        tipoEvento:  "CAMBIO_CAMPO" as const,
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
  

  async getAssetsByTipoAndIds(opts: { tipo?: string; ids?: string[] }) {
    const assetRepository = AppDataSource.getRepository(Asset);
    const where: FindOptionsWhere<Asset> = { deletedAt: IsNull() };
    if (opts.tipo) where.tipo = opts.tipo as any;
    if (opts.ids && opts.ids.length > 0) where.id = In(opts.ids);

    return assetRepository.find({
      where,
      relations: ["servidor", "red", "ups", "baseDatos", "vpn", "vpn.reglas", "movil"],
      order: { actualizadoEn: "DESC" },
      take: 10_000,
    });
  }

  async softDelete(id: string, autor: string = "Sistema", motivo: string = "Sin motivo") {
    const assetRepository    = AppDataSource.getRepository(Asset);
    const bitacoraRepository = AppDataSource.getRepository(Bitacora);

    const asset = await assetRepository.findOne({ where: { id } });
    if (!asset) throw new Error("Asset no encontrado");

    await assetRepository.update(id, {
      deletedAt:             new Date(),
      motivoDeshabilitacion: motivo,
      deshabilitadoPor:      autor,
    });

    await bitacoraRepository.save(
      bitacoraRepository.create({
        asset: { id },
        autor,
        tipoEvento:  "NOTA",
        descripcion: "Activo deshabilitado y movido a histórico.",
      })
    );

    return assetRepository.findOne({ where: { id } });
  }

  async restoreAsset(id: string, autor: string = "Sistema") {
    const assetRepository    = AppDataSource.getRepository(Asset);
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

    return assetRepository.findOne({ where: { id } });
  }

  async getDeleted() {
    const assetRepository = AppDataSource.getRepository(Asset);
    return assetRepository.find({
      where: { deletedAt: Not(IsNull()) },
      relations: ["servidor", "red", "ups", "baseDatos", "vpn", "vpn.reglas", "movil"],
      order: { deletedAt: "DESC" },
    });
  }
}

export const assetsService = new AssetsService();