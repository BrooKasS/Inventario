import { Router } from "express";
import { AppDataSource } from "../../config/database";
import { Asset } from "../../entities/Asset";
import { SoftwareInstalado } from "../../entities/SoftwareInstalado";
import { IsNull } from "typeorm/find-options/operator/IsNull";

const router = Router();

/**
 * GET /api/external/servers
 * Devuelve todos los servidores activos con su software instalado
 * Protegido por x-api-key — para consumo del compañero Tenable
 */
router.get("/servers", async (req, res) => {
  try {
    const assetRepo    = AppDataSource.getRepository(Asset);
    const softwareRepo = AppDataSource.getRepository(SoftwareInstalado);

    // 1. Traer todos los servidores activos con su entidad Servidor
    const servers = await assetRepo.find({
  where: { tipo: "SERVIDOR", deletedAt: IsNull() },
  relations: ["servidor"],
});

    // 2. Por cada servidor, traer su software instalado
    const data = await Promise.all(
      servers.map(async (s) => {
        const software = await softwareRepo.find({
          where: { asset: { id: s.id } },
          order: { softwareName: "ASC" },
        });

        return {
          id:               s.id,
          nombre:           s.nombre           ?? null,
          ubicacion:        s.ubicacion         ?? null,
          propietario:      s.propietario       ?? null,
          custodio:         s.custodio          ?? null,
          codigoServicio:   s.codigoServicio    ?? null,
          ipInterna:        s.servidor?.ipInterna        ?? null,
          ipGestion:        s.servidor?.ipGestion        ?? null,
          ipServicio:       s.servidor?.ipServicio       ?? null,
          sistemaOperativo: s.servidor?.sistemaOperativo ?? null,
          ambiente:         s.servidor?.ambiente         ?? null,
          tipoServidor:     s.servidor?.tipoServidor     ?? null,
          appSoporta:       s.servidor?.appSoporta       ?? null,
          vcpu:             s.servidor?.vcpu             ?? null,
          vramMb:           s.servidor?.vramMb           ?? null,
          contratoSoporte:  s.servidor?.contratoQueSoporta ?? null,
          fechaFinSoporte:  s.servidor?.fechaFinSoporte  ?? null,
          softwareInstalado: software.map((sw) => ({
            nombre:    sw.softwareName,
            version:   sw.softwareVersion   ?? null,
            publisher: sw.softwarePublisher ?? null,
          })),
        };
      })
    );

    return res.json({
      success: true,
      total:   data.length,
      servers: data,
    });

  } catch (err: any) {
    console.error("[EXTERNAL] Error:", err.message);
    return res.status(500).json({
      success: false,
      error: "Error interno",
    });
  }
});

export default router;