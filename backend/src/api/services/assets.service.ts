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
import { CertificadoSsl } from "../../entities/CertificadoSsl";
import { FindOptionsWhere, In, IsNull, Not } from "typeorm";
import { v4 as uuidv4 } from "uuid";
import { generarPdfDevolucion, generarPdfEntrega } from "../utils/generarMovilDocx";
import { sendMovilEmail } from "../utils/sendMovilEmail";
import { sendAssetAlerta, filaFecha } from "../utils/sendAssetAlerta";
import fs from "fs";
import { sendToFlowRaw } from "../utils/flowRaw";
import path from "path";
import { sendToFlowFirmada } from "../utils/flowRaw";
import { sendToFlowDevolucion, sendToFlowFirmarDevolucion, sendToFlowArchivoDevolucion } from "../utils/flowRaw";
import { validateAssetData, isCreatedToday } from "../utils/validationRules";
import { OcsServerMapping } from "../../entities/OcsServerMapping";
import { SoftwareInstalado } from "../../entities/SoftwareInstalado";
import { CertificadoSslApp } from "../../entities/CertificadoSslApp";


export class AssetsService {
  async getAssets(filters: AssetFilters) {
    const { tipo, tipos, q, page = 1, limit = 50 } = filters;
    const skip = (page - 1) * limit;
    

    const assetRepository = AppDataSource.getRepository(Asset);
    const vpnRepository = AppDataSource.getRepository(Vpn);

    // ------------------------------------------------------------------------
    // PARA VPN: OBTENER SOLO PRINCIPALES (1 por cada conexion/IP)
    // ------------------------------------------------------------------------
    let vpnPrincipalesIds: string[] = [];
    if (tipo === "VPN") {
      // Query: GROUP BY conexion para obtener 1 VPN por cada IP �nica
      // Solo agrupa VPNs con conexion v�lida (IS NOT NULL)
      const vpnPrincipales = await vpnRepository
        .createQueryBuilder("vpn")
        .select("MIN(vpn.id)", "id")
        .addSelect("vpn.conexion", "conexion")
        .where("vpn.conexion IS NOT NULL")
        .groupBy("vpn.conexion")
        .getRawMany();
      
      vpnPrincipalesIds = vpnPrincipales.map((v: any) => v.id);
      
      console.log(`? VPN PRINCIPALES: ${vpnPrincipalesIds.length} encontrados`);
    }

    // ------------------------------------------------------------------------
    // B�SQUEDA CON QUERY (filtro por nombre/c�digo)
    // ------------------------------------------------------------------------
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
        .leftJoinAndSelect("asset.certificadoSsl", "certificadoSsl")
        .leftJoinAndSelect("certificadoSsl.aplicaciones",  "aplicaciones")
        .where("asset.deletedAt IS NULL");

      if (tipo) {
        qb.andWhere("asset.tipo = :tipo", { tipo });
      }

      if (tipos && tipos.length > 0) {
        qb.andWhere("asset.tipo IN (:...tipos)", { tipos });
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

    // ------------------------------------------------------------------------
    // B�SQUEDA SIN QUERY (solo filtro por tipo)
    // ------------------------------------------------------------------------
    const qb = assetRepository
      .createQueryBuilder("asset")
      .leftJoinAndSelect("asset.servidor", "servidor")
      .leftJoinAndSelect("asset.red", "red")
      .leftJoinAndSelect("asset.ups", "ups")
      .leftJoinAndSelect("asset.baseDatos", "baseDatos")
      .leftJoinAndSelect("asset.vpn", "vpn")
      .leftJoinAndSelect("vpn.reglas", "vpnRules")
      .leftJoinAndSelect("asset.movil", "movil")
      .leftJoinAndSelect("asset.certificadoSsl", "certificadoSsl")
      .leftJoinAndSelect("certificadoSsl.aplicaciones",  "aplicaciones")
      .where("asset.deletedAt IS NULL");

    if (tipo) {
      qb.andWhere("asset.tipo = :tipo", { tipo });
    }

    if (tipos && tipos.length > 0) {
      qb.andWhere("asset.tipo IN (:...tipos)", { tipos });
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
    const vpnRepository = AppDataSource.getRepository(Vpn);

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
      .leftJoinAndSelect("asset.certificadoSsl", "certificadoSsl")
      .leftJoinAndSelect("certificadoSsl.aplicaciones",  "aplicaciones")
      .where("asset.id = :id", { id })
      .getOne();

    if (!asset) throw new Error("Asset no encontrado");
    
    // ----------------------------------------------------------------
    // SI ES VPN: CARGAR TAMBI�N LAS REGLAS HIST�RICAS (VPNs hermanas)
    // ----------------------------------------------------------------
    if (asset.vpn && asset.vpn.conexion) {
      // Buscar todas las VPNs con el mismo conexion (reglas hist�ricas)
      const vpnRelacionadas = await vpnRepository.find({
        where: { conexion: asset.vpn.conexion },
      });
      
      // Filtrar: excluir la VPN principal (la del asset), el resto son hist�ricas
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
      servidor, red, ups, baseDatos, vpn, certificadoSsl,
      numeroCaso, region, dependencia, sede, cedula, usuarioRed,
      correoResponsable, uni, marca, modelo, serial, imei1, imei2,
      sim, numeroLinea, fechaEntrega, observacionesEntrega,
    } = data;

    // ? VALIDACI�N: nuevas entradas SIEMPRE se validan
    const { valid, errors } = validateAssetData(tipo, data, true);
    if (!valid) {
      throw new Error(`Validaci�n fallida: ${errors.join(", ")}`);
    }

    const assetRepository     = AppDataSource.getRepository(Asset);
    const bitacoraRepository  = AppDataSource.getRepository(Bitacora);
    const servidorRepository  = AppDataSource.getRepository(Servidor);
    const redRepository       = AppDataSource.getRepository(Red);
    const upsRepository       = AppDataSource.getRepository(Ups);
    const baseDatosRepository = AppDataSource.getRepository(BaseDatos);
    const vpnRepository       = AppDataSource.getRepository(Vpn);
    const vpnRuleRepository   = AppDataSource.getRepository(VpnRule);
    const movilRepository     = AppDataSource.getRepository(Movil);
    const certificadoSslRepository = AppDataSource.getRepository(CertificadoSsl);
    const certificadoSslAppRepository =  AppDataSource.getRepository(CertificadoSslApp);
      
    // -- Crear Asset base --
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

      await sendAssetAlerta("creado", "SERVIDOR", savedAsset, [
        ["Código de servicio", savedAsset.codigoServicio ?? "—"],
        ["Ambiente", servidorToSave.ambiente ?? "—"],
        ["Sistema operativo", servidorToSave.sistemaOperativo ?? "—"],
        ["IP interna", servidorToSave.ipInterna ?? "—"],
        ["Propietario", savedAsset.propietario ?? "—"],
        ["Custodio", savedAsset.custodio ?? "—"],
      ], { autor });
    }
    if (red) {
      const redToSave = { ...red, asset: savedAsset };
      if (!redToSave.id) redToSave.id = uuidv4();
      await redRepository.save(redToSave);

      await sendAssetAlerta("creado", "RED", savedAsset, [
        ["Código de servicio", savedAsset.codigoServicio ?? "—"],
        ["Modelo", redToSave.modelo ?? "—"],
        ["IP de gestión", redToSave.ipGestion ?? "—"],
        ["Estado", redToSave.estado ?? "—"],
        ["Propietario", savedAsset.propietario ?? "—"],
        ["Custodio", savedAsset.custodio ?? "—"],
      ], { autor });
    }
    if (ups) {
      const upsToSave = { ...ups, asset: savedAsset };
      if (!upsToSave.id) upsToSave.id = uuidv4();
      await upsRepository.save(upsToSave);

      await sendAssetAlerta("creado", "UPS", savedAsset, [
        ["Código de servicio", savedAsset.codigoServicio ?? "—"],
        ["Modelo", upsToSave.modelo ?? "—"],
        ["Serial", upsToSave.serial ?? "—"],
        ["Estado", upsToSave.estado ?? "—"],
        ["Ubicación", savedAsset.ubicacion ?? "—"],
        ["Custodio", savedAsset.custodio ?? "—"],
      ], { autor });
    }
    if (baseDatos) {
      const baseDatosToSave = { ...baseDatos, asset: savedAsset };
      if (!baseDatosToSave.id) baseDatosToSave.id = uuidv4();
      await baseDatosRepository.save(baseDatosToSave);

      await sendAssetAlerta("creado", "BASE_DATOS", savedAsset, [
        ["Código de servicio", savedAsset.codigoServicio ?? "—"],
        ["Ambiente", baseDatosToSave.ambiente ?? "—"],
        ["Versión BD", baseDatosToSave.versionBd ?? "—"],
        ["Servidor 1", baseDatosToSave.servidor1 ?? "—"],
        ["Propietario", savedAsset.propietario ?? "—"],
        ["Custodio", savedAsset.custodio ?? "—"],
      ], { autor });
    }
    if (vpn) {
      const vpnToSave = { ...vpn, asset: savedAsset };
      if (!vpnToSave.id) vpnToSave.id = uuidv4();
      
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
            vpn: savedVpn, // ? TypeORM maneja el VPN_ID autom�ticamente
            conexion: regla.conexion ?? null,
            fases: regla.fases ?? null,
            origen: regla.origen ?? null,
            destino: regla.destino ?? null,
          });
          return rule;
        });
        
        await vpnRuleRepository.save(vpnRulesToSave);
      }

      await sendAssetAlerta("creado", "VPN", savedAsset, [
        ["Código de servicio", savedAsset.codigoServicio ?? "—"],
        ["Conexión", vpnToSave.conexion ?? "—"],
        ["Origen", vpnToSave.origen ?? "—"],
        ["Destino", vpnToSave.destino ?? "—"],
        ["Propietario", savedAsset.propietario ?? "—"],
        ["Custodio", savedAsset.custodio ?? "—"],
      ], { autor });
    }

    // -- CERTIFICADO SSL --
    if (tipo === "CERTIFICADO_SSL" && certificadoSsl) {
      const { nombreAplicacion, nombreDominio, proveedor, url, fechaInicio, fechaFin } = certificadoSsl;
      const certData = certificadoSslRepository.create({
        id: uuidv4(),
        asset: savedAsset,
        tipoCertificado: certificadoSsl.tipoCertificado ?? null,
        nombreAplicacion: nombreAplicacion ?? null,
        nombreDominio:    nombreDominio    ?? null,
        proveedor:        proveedor        ?? null,
        url:              url              ?? null,
        fechaInicio:      fechaInicio      ? new Date(fechaInicio) : null,
        fechaFin:         fechaFin         ? new Date(fechaFin)    : null,
      });
      const savedCert =
        await certificadoSslRepository.save(certData);

      if (
        certificadoSsl.aplicaciones &&
        Array.isArray(certificadoSsl.aplicaciones) &&
        certificadoSsl.aplicaciones.length > 0
      ) {
        const apps = certificadoSsl.aplicaciones.map((app: any) =>
          certificadoSslAppRepository.create({
            id: uuidv4(),
            certificadoSsl: savedCert,
            nombreAplicacion: app.nombreAplicacion ?? null,
            url: app.url ?? null,
            fechaInicio: app.fechaInicio
              ? new Date(app.fechaInicio)
              : null,
            fechaFin: app.fechaFin
              ? new Date(app.fechaFin)
              : null,
          })
        );
      
        await certificadoSslAppRepository.save(apps);
      }

      await sendAssetAlerta("creado", "CERTIFICADO_SSL", savedAsset, [
        ["Tipo", savedCert.tipoCertificado ?? "—"],
        ["Dominio/Aplicación", savedCert.nombreDominio ?? savedCert.nombreAplicacion ?? "—"],
        ["Proveedor", savedCert.proveedor ?? "—"],
        ["Vence", filaFecha(savedCert.fechaFin)],
      ], { autor });
    }

      // -- MOVIL: genera solo el acta de ENTREGA --
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
        estados:             "PENDIENTE_ENTREGA",
      });

      await movilRepository.save(movilData);

      // Generar acta de ENTREGA (sin datos de devoluci�n)
      const bufferEntrega = await generarPdfEntrega({
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
          console.error("?? Error enviando acta MOVIL:", error);
        }
      }
    }

    // -- Bit�cora creaci�n --
    await bitacoraRepository.save(
      bitacoraRepository.create({
        asset:       savedAsset,
        autor,
        tipoEvento:  "IMPORTACION",
        descripcion: "Activo creado manualmente.",
      })
    );

    // Retornar con QueryBuilder para cargar correctamente todas las relaciones
    return assetRepository
      .createQueryBuilder("asset")
      .leftJoinAndSelect("asset.servidor", "servidor")
      .leftJoinAndSelect("asset.red", "red")
      .leftJoinAndSelect("asset.ups", "ups")
      .leftJoinAndSelect("asset.baseDatos", "baseDatos")
      .leftJoinAndSelect("asset.vpn", "vpn")
      .leftJoinAndSelect("vpn.reglas", "reglas")
      .leftJoinAndSelect("asset.movil", "movil")
      .leftJoinAndSelect("asset.certificadoSsl", "certificadoSsl")
      .leftJoinAndSelect("certificadoSsl.aplicaciones", "aplicaciones")
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
      case "DEVOLUCION": nuevoEstado = "PENDIENTE_DEVOLUCION"; break;
      default: throw new Error("Estado no permite cambio manual");
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

      if (nuevoEstado === "PENDIENTE_DEVOLUCION" && movil.correoResponsable) {
        await sendToFlowFirmarDevolucion({
          correo:       movil.correoResponsable,
          nombreActivo: movil.asset?.nombre || "Activo",
          assetId,
          linkFirma:    `${process.env.FRONTEND_URL}/firmar-devolucion/${assetId}`,
        });
      }
    } catch (error) {
      console.warn("?? Error en env�o de correos:", error);
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

    // 1?? Guardar firma PNG
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
        estados: "ENTREGADO",
        observacionesEntrega: observacionesEntrega ?? asset.movil.observacionesEntrega,
      }
    );

    // 2?? Generar SOLO el acta de ENTREGA firmada
    const m = asset.movil;

    const bufferEntrega = await generarPdfEntrega({
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

    // 3?? Enviar acta de ENTREGA al Flow
    try {
      const nombreArchivo  = `Acta_Entrega_${asset.nombre?.replace(/\s+/g, "_")}.pdf`;
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
      console.error("?? Error enviando acta de entrega firmada al Flow:", error);
    }

    // 4?? Bit�cora final
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

      const estadoActual = movil.estados as EstadoMovil | "PENDIENTE" | null;
      if (estadoActual !== "PENDIENTE_DEVOLUCION" && estadoActual !== "PENDIENTE") {
        throw new Error("El activo no est� listo para firma de devoluci�n");
      }

      // Guardar firma de devoluci�n
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

      // Generar SOLO el acta de DEVOLUCI�N
      const bufferDevolucion = await generarPdfDevolucion({
        ...movil,
        nombre:         movil.asset.nombre,
        firmaPathFinal: firmaPath,
        fechaDevolucion,
      });

      // Enviar acta de DEVOLUCI�N al Flow
      try {
        const nombreArchivo = `Acta_Devolucion_${movil.asset.nombre?.replace(/\s+/g, "_")}.pdf`;

        await sendToFlowArchivoDevolucion({
          correo:        movil.correoResponsable,
          nombreActivo:  movil.asset.nombre,
          assetId,
          nombreArchivo,
          archivoBase64: bufferDevolucion.toString("base64"),
        });
      } catch (flowError) {
        console.error("?? Error enviando acta de devoluci�n al Flow:", flowError);
      }

      // Bit�cora
      await bitacoraRepo.save(
        bitacoraRepo.create({
          asset:       movil.asset,
          autor:       "Usuario",
          tipoEvento:  "NOTA",
          descripcion: "Devoluci�n firmada correctamente. Acta de devoluci�n generada y enviada.",
        })
      );

      return { ok: true };

    } catch (error) {
      console.error("? Error en firmarDevolucion:", error);
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
    const certificadoSslRepository = AppDataSource.getRepository(CertificadoSsl);
    const certificadoSslAppRepository = AppDataSource.getRepository(CertificadoSslApp);

    const asset = await assetRepository.findOne({
      where: { id },
      relations: ["servidor", "red", "ups", "baseDatos", "vpn", "vpn.reglas", "movil", "certificadoSsl", "certificadoSsl.aplicaciones",],
    });

    if (!data || typeof data !== "object") throw new Error("Body inv�lido");
    if (!asset) throw new Error("Asset no encontrado");

    const updates: Partial<Asset> = {};
    const bitacoraEntries: any[]  = [];
    if (
      asset.tipo === "CERTIFICADO_SSL" &&
      asset.certificadoSsl &&
      data.certificadoSsl
    ) {
      const cert = asset.certificadoSsl;
    
      const certUpdates: any = {};
    
      Object.keys(data.certificadoSsl).forEach((key) => {
      
        if (key === "aplicaciones") return;
      
        const oldVal = (cert as any)[key];
        const newVal = data.certificadoSsl[key];
      
        if (newVal !== undefined && newVal !== oldVal) {
        
          certUpdates[key] = newVal;
        
          bitacoraEntries.push({
            campoModificado: key,
            valorAnterior: String(oldVal ?? ""),
            valorNuevo: String(newVal ?? ""),
          });
        }
      });
    
      if (certUpdates.fechaInicio) {
        certUpdates.fechaInicio =
          new Date(certUpdates.fechaInicio);
      }
    
      if (certUpdates.fechaFin) {
        certUpdates.fechaFin =
          new Date(certUpdates.fechaFin);
      }
    
      if (Object.keys(certUpdates).length > 0) {
        await certificadoSslRepository.update(
          { id: cert.id },
          certUpdates
        );
      }
    
      // ----------------------------------------
      // Aplicaciones hijas
      // ----------------------------------------
    
      if (
        data.certificadoSsl.aplicaciones !== undefined
      ) {
      
        await certificadoSslAppRepository.delete({
          certificadoSsl: {
            id: cert.id,
          },
        });
      
        const apps =
          data.certificadoSsl.aplicaciones || [];
      
        if (apps.length > 0) {
        
          const nuevasApps = apps.map(
            (app: any) =>
              certificadoSslAppRepository.create({
                id: uuidv4(),
                certificadoSsl: cert,
              
                nombreAplicacion:
                  app.nombreAplicacion ?? null,
              
                url:
                  app.url ?? null,
              
                fechaInicio:
                  app.fechaInicio
                    ? new Date(app.fechaInicio)
                    : null,
              
                fechaFin:
                  app.fechaFin
                    ? new Date(app.fechaFin)
                    : null,
              })
          );
        
          await certificadoSslAppRepository.save(
            nuevasApps
          );
        }
      
        bitacoraEntries.push({
          campoModificado: "aplicaciones",
          valorAnterior:
            String(
              cert.aplicaciones?.length ?? 0
            ),
          valorNuevo:
            String(
              apps.length
            ),
        });
      }
    }
    // ? VALIDACI�N PATCH-SAFE:
    // Si el registro fue creado hoy, se valida el resultado final (actual + cambios),
    // no solo el body parcial. As� editar un solo campo no dispara falsos obligatorios.
    const isNewRecord = isCreatedToday(asset.creadoEn);
    if (isNewRecord) {
      const dataToValidate: any = { ...asset, ...data };

      if (asset.servidor || data.servidor) {
        dataToValidate.servidor = { ...(asset.servidor ?? {}), ...(data.servidor ?? {}) };
      }
      if (asset.red || data.red) {
        dataToValidate.red = { ...(asset.red ?? {}), ...(data.red ?? {}) };
      }
      if (asset.ups || data.ups) {
        dataToValidate.ups = { ...(asset.ups ?? {}), ...(data.ups ?? {}) };
      }
      if (asset.baseDatos || data.baseDatos) {
        dataToValidate.baseDatos = { ...(asset.baseDatos ?? {}), ...(data.baseDatos ?? {}) };
      }
      if (asset.vpn || data.vpn) {
        dataToValidate.vpn = { ...(asset.vpn ?? {}), ...(data.vpn ?? {}) };
      }
      if (asset.movil || data.movil) {
        dataToValidate.movil = { ...(asset.movil ?? {}), ...(data.movil ?? {}) };
      }

      const { valid, errors } = validateAssetData(asset.tipo, dataToValidate, true);
      if (!valid) {
        throw new Error(`Validaci�n fallida: ${errors.join(", ")}`);
      }
    }


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

      // -------------------------------------------------------------
      // MANEJAR REGLAS (VpnRule)
      // -------------------------------------------------------------
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

      const camposBloqueadosConFirma = new Set([
        "numeroCaso", "region", "dependencia", "sede", "cedula", "usuarioRed", "uni",
        "marca", "modelo", "serial", "imei1", "imei2", "sim", "numeroLinea",
        "fechaEntrega", "observacionesEntrega",
      ]);

      Object.keys(data.movil).forEach((key) => {
        const oldVal = (movil as any)[key];
        const newVal = data.movil[key];

        // El estado solo cambia por los endpoints del flujo, nunca por edici�n general.
        if (key === "estados") {
          if (newVal !== undefined && newVal !== oldVal) {
            throw new Error("El estado del m�vil no se puede editar manualmente desde el formulario. Usa el flujo de entrega/devoluci�n.");
          }
          return;
        }

        if (movil.estados === "DEVUELTO" && newVal !== undefined && newVal !== oldVal) {
          throw new Error("No puedes editar los datos del m�vil porque el proceso ya est� cerrado como DEVUELTO.");
        }

        if (movil.firmaPath && camposBloqueadosConFirma.has(key) && newVal !== undefined && newVal !== oldVal) {
          throw new Error(`No puedes modificar ${key} porque el acta de entrega ya fue firmada.`);
        }

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

    // ----------------------------------------------------------------
    // TOTAL: Contar Assets por Tipo
    // ----------------------------------------------------------------
    const vpnRepository = AppDataSource.getRepository(Vpn);

// Contar VPNs principales (1 por conexi�n �nica)
const vpnPrincipalesCount = await vpnRepository
  .createQueryBuilder("vpn")
  .select("COUNT(DISTINCT vpn.conexion)", "cnt")
  .where("vpn.conexion IS NOT NULL")
  .getRawOne();

const porTipoRaw = await assetRepository
  .createQueryBuilder("asset")
  .select("asset.tipo", "tipo")
  .addSelect("COUNT(DISTINCT asset.id)", "count")
  .where("asset.deletedAt IS NULL")
  .andWhere("asset.tipo != :vpn", { vpn: "VPN" })
  .groupBy("asset.tipo")
  .getRawMany();

// Agregar VPN con conteo correcto
const vpnCount = parseInt(vpnPrincipalesCount?.cnt ?? "0");
if (vpnCount > 0) {
  porTipoRaw.push({ tipo: "VPN", count: String(vpnCount) });
}

const porTipo = porTipoRaw;
const totalAssets = porTipo.reduce((sum, t) => sum + parseInt(t.count, 10), 0);

return {
  total: totalAssets,
  porTipo: porTipo.map(t => ({ tipo: t.tipo, count: parseInt(t.count, 10) })),
};

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

    const asset = await assetRepository.findOne({
      where: { id },
      relations: ["movil", "certificadoSsl", "servidor", "baseDatos", "ups", "red", "vpn"],
    });
    if (!asset) throw new Error("Asset no encontrado");

    if (asset.tipo === "MOVIL" && asset.movil) {
      if (asset.movil.estados !== "DEVUELTO" && asset.movil.estados !== null) {
        throw new Error(
          "No puedes deshabilitar este activo porque el equipo a�n est� en manos del empleado. Completa el proceso de devoluci�n primero."
        );
      }
    }

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
        descripcion: "Activo deshabilitado y movido a hist�rico.",
      })
    );

    if (asset.tipo === "SERVIDOR" && asset.servidor) {
      await sendAssetAlerta("deshabilitado", "SERVIDOR", asset, [
        ["Código de servicio", asset.codigoServicio ?? "—"],
        ["Ambiente", asset.servidor.ambiente ?? "—"],
        ["Sistema operativo", asset.servidor.sistemaOperativo ?? "—"],
        ["IP interna", asset.servidor.ipInterna ?? "—"],
        ["Propietario", asset.propietario ?? "—"],
        ["Custodio", asset.custodio ?? "—"],
      ], { autor, motivo });
    }

    if (asset.tipo === "BASE_DATOS" && asset.baseDatos) {
      await sendAssetAlerta("deshabilitado", "BASE_DATOS", asset, [
        ["Código de servicio", asset.codigoServicio ?? "—"],
        ["Ambiente", asset.baseDatos.ambiente ?? "—"],
        ["Versión BD", asset.baseDatos.versionBd ?? "—"],
        ["Servidor 1", asset.baseDatos.servidor1 ?? "—"],
        ["Propietario", asset.propietario ?? "—"],
        ["Custodio", asset.custodio ?? "—"],
      ], { autor, motivo });
    }

    if (asset.tipo === "UPS" && asset.ups) {
      await sendAssetAlerta("deshabilitado", "UPS", asset, [
        ["Código de servicio", asset.codigoServicio ?? "—"],
        ["Modelo", asset.ups.modelo ?? "—"],
        ["Serial", asset.ups.serial ?? "—"],
        ["Estado", asset.ups.estado ?? "—"],
        ["Ubicación", asset.ubicacion ?? "—"],
        ["Custodio", asset.custodio ?? "—"],
      ], { autor, motivo });
    }

    if (asset.tipo === "RED" && asset.red) {
      await sendAssetAlerta("deshabilitado", "RED", asset, [
        ["Código de servicio", asset.codigoServicio ?? "—"],
        ["Modelo", asset.red.modelo ?? "—"],
        ["IP de gestión", asset.red.ipGestion ?? "—"],
        ["Estado", asset.red.estado ?? "—"],
        ["Propietario", asset.propietario ?? "—"],
        ["Custodio", asset.custodio ?? "—"],
      ], { autor, motivo });
    }

    if (asset.tipo === "VPN" && asset.vpn) {
      await sendAssetAlerta("deshabilitado", "VPN", asset, [
        ["Código de servicio", asset.codigoServicio ?? "—"],
        ["Conexión", asset.vpn.conexion ?? "—"],
        ["Origen", asset.vpn.origen ?? "—"],
        ["Destino", asset.vpn.destino ?? "—"],
        ["Propietario", asset.propietario ?? "—"],
        ["Custodio", asset.custodio ?? "—"],
      ], { autor, motivo });
    }

    if (asset.tipo === "CERTIFICADO_SSL" && asset.certificadoSsl) {
      await sendAssetAlerta("deshabilitado", "CERTIFICADO_SSL", asset, [
        ["Tipo", asset.certificadoSsl.tipoCertificado ?? "—"],
        ["Dominio/Aplicación", asset.certificadoSsl.nombreDominio ?? asset.certificadoSsl.nombreAplicacion ?? "—"],
        ["Proveedor", asset.certificadoSsl.proveedor ?? "—"],
        ["Vence", filaFecha(asset.certificadoSsl.fechaFin)],
      ], { autor, motivo });
    }

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

  async hardDelete(id: string): Promise<void> {
    const assetRepository     = AppDataSource.getRepository(Asset);
    const bitacoraRepository  = AppDataSource.getRepository(Bitacora);
    const servidorRepository  = AppDataSource.getRepository(Servidor);
    const redRepository       = AppDataSource.getRepository(Red);
    const upsRepository       = AppDataSource.getRepository(Ups);
    const baseDatosRepository = AppDataSource.getRepository(BaseDatos);
    const vpnRepository       = AppDataSource.getRepository(Vpn);
    const vpnRuleRepository   = AppDataSource.getRepository(VpnRule);
    const movilRepository     = AppDataSource.getRepository(Movil);    const asset = await assetRepository.findOne({
      where: { id },
      relations: ["vpn"],
    });

    if (!asset) throw new Error("Asset no encontrado");

    // 1. Borrar archivos de firma del disco (si es MOVIL)
    try {
      const firmaPath     = path.join(process.cwd(), "storage/firmas", `${id}.png`);
      const firmaDevPath  = path.join(process.cwd(), "storage/firmas", `${id}_devolucion.png`);
      
      if (fs.existsSync(firmaPath))    fs.unlinkSync(firmaPath);
      if (fs.existsSync(firmaDevPath)) fs.unlinkSync(firmaDevPath);
    } catch (e) {
      console.warn("?? No se pudo borrar firma del disco:", e);
    }

    // 2. Borrar vpn_rules si tiene VPN
    if (asset.vpn) {
      await vpnRuleRepository.delete({ vpn: { id: asset.vpn.id } });
    }

    // 3. Borrar bit�cora
    await bitacoraRepository.delete({ asset: { id } });

    // 4. Borrar relaciones espec�ficas por tipo
    await servidorRepository.delete({ asset: { id } });
    await redRepository.delete({ asset: { id } });
    await upsRepository.delete({ asset: { id } });
    await baseDatosRepository.delete({ asset: { id } });
    await vpnRepository.delete({ asset: { id } });
    await movilRepository.delete({ id });

    // 5. Borrar el asset
    await assetRepository.delete({ id });
  }

  async hardDeleteAll(): Promise<number> {
    const assetRepository     = AppDataSource.getRepository(Asset);
    const bitacoraRepository  = AppDataSource.getRepository(Bitacora);
    const servidorRepository  = AppDataSource.getRepository(Servidor);
    const redRepository       = AppDataSource.getRepository(Red);
    const upsRepository       = AppDataSource.getRepository(Ups);
    const baseDatosRepository = AppDataSource.getRepository(BaseDatos);
    const vpnRepository       = AppDataSource.getRepository(Vpn);
    const vpnRuleRepository   = AppDataSource.getRepository(VpnRule);
    const movilRepository     = AppDataSource.getRepository(Movil);

    // Obtener todos los eliminados
    const deleted = await assetRepository.find({
      where: { deletedAt: Not(IsNull()) },
      relations: ["vpn"],
    });

    if (deleted.length === 0) return 0;

    for (const asset of deleted) {
      try {
        // Borrar firmas del disco
        const firmaPath    = path.join(process.cwd(), "storage/firmas", `${asset.id}.png`);
        const firmaDevPath = path.join(process.cwd(), "storage/firmas", `${asset.id}_devolucion.png`);
        if (fs.existsSync(firmaPath))    fs.unlinkSync(firmaPath);
        if (fs.existsSync(firmaDevPath)) fs.unlinkSync(firmaDevPath);
      } catch (e) {
        console.warn("?? No se pudo borrar firma:", e);
      }

      if (asset.vpn) {
        await vpnRuleRepository.delete({ vpn: { id: asset.vpn.id } });
      }
    }

    const ids = deleted.map(a => a.id);

    await bitacoraRepository.delete({ asset: { id: In(ids) } });
    await servidorRepository.delete({ asset: { id: In(ids) } });
    await redRepository.delete({ asset: { id: In(ids) } });
    await upsRepository.delete({ asset: { id: In(ids) } });
    await baseDatosRepository.delete({ asset: { id: In(ids) } });
    await vpnRepository.delete({ asset: { id: In(ids) } });

    // Movil usa id directo
    await movilRepository.delete({ id: In(ids) });

    await assetRepository.delete({ id: In(ids) });

    return deleted.length;
  }
  async getSuggestions(field: string, tipo: string, q: string): Promise<string[]> {

  const tableMap: Record<string, string> = {
    SERVIDOR:   "SERVIDORES",
    RED:        "REDES",
    UPS:        "UPS",
    BASE_DATOS: "BASE_DATOS",
    MOVIL:      "MOVILES",
    ASSET:       "ASSETS",
  };

  const fieldToColumn: Record<string, Record<string, string>> = {
    SERVIDOR: {
      ambiente:           "ambiente",
      tipoServidor:       "tipoServidor",
      sistemaOperativo:   "sistemaOperativo",
      contratoQueSoporta: "contratoQueSoporta",
      appSoporta:         "appSoporta",
      monitoreo:          "monitoreo",
      backup:             "backup",
      vramMb:             "vramMb",
      vcpu:               "vcpu",
      rutasBackup:         "rutasBackup",
      
      
    },
    RED: {
      estado:             "estado",
      modelo:             "modelo",
      contratoQueSoporta: "contratoQueSoporta",
      ipGestion:          "ipGestion",
    },
    UPS: {
      estado:             "estado",
      modelo:             "modelo",
    },
    BASE_DATOS: {
      ambiente:           "ambiente",
      contratoQueSoporta: "contratoQueSoporta",
      appSoporta:         "appSoporta",
      contenedorFisico:   "contenedorFisico",
    },
    MOVIL: {
      marca:              "marca",
      modelo:             "modelo",
      region:             "region",
      dependencia:        "dependencia",
      sede:               "sede",
    },
    ASSET: {
      ubicacion:          "ubicacion",
      propietario:        "propietario",
      custodio:           "custodio",
    },
  };

  const table  = tableMap[tipo];
  const colMap = fieldToColumn[tipo];
  if (!table || !colMap) return [];
  const column = colMap[field];
  if (!column) return [];

  const qTrimmed  = (q ?? "").trim();
  const likeParam = qTrimmed.length > 0
    ? `%${qTrimmed.toLowerCase()}%`
    : "%";

  if (!/^[A-Za-z0-9_]+$/.test(column)) {
    console.error(`[getSuggestions] Columna inv�lida: "${column}"`);
    return [];
  }

  try {
   const rows: Array<Record<string, unknown>> = await AppDataSource.query(
  `SELECT * FROM (
     SELECT DISTINCT TO_CHAR("${column}") AS SUGGESTION
     FROM   "${table}"
     WHERE  "${column}" IS NOT NULL
       AND  LOWER(TO_CHAR("${column}")) LIKE :1
   ) WHERE ROWNUM <= 10`,
  [likeParam]
);

    return rows
      .map((r) => {
        const val = r["SUGGESTION"] ?? r["suggestion"] ?? Object.values(r)[0];
        return typeof val === "string" ? val.trim() : null;
      })
      .filter((v): v is string => v !== null && v.length > 0);

  } catch (err) {
    console.error(`[getSuggestions] Error tipo=${tipo} field=${field} col=${column}:`, err);
    return [];
  }
}

}

export const assetsService = new AssetsService();



