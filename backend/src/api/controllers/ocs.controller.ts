import { Request, Response } from "express";
import { ocsSyncService } from "../services/ocs-sync.service";
import { triggerManualSync } from "../../jobs/ocs-sync.job";
import { SoftwareInstalado } from "../../entities/SoftwareInstalado";
import { AppDataSource } from "../../config/database";
import { OcsDataSource } from "../../config/ocs.database";

export class OcsController {
  async getStatus(req: Request, res: Response) {
    const info = await ocsSyncService.getLastSyncInfo();
    res.json({ success: true, data: info });
  }

  async syncNow(req: Request, res: Response) {
    // responde inmediato y corre en background
    triggerManualSync().catch((e) =>
      console.error("[OCS-CTRL] Error en sync manual:", e.message)
    
    );
    res.json({ success: true, message: "Sync iniciado en background" });
  }

  async getSoftwareByAsset(req: Request, res: Response) {
  const { assetId } = req.params as { assetId: string };
  const repo = AppDataSource.getRepository(SoftwareInstalado);
  const software = await repo.find({
    where: { asset: { id: assetId } },
    order: { softwareName: "ASC" },
  });
  res.json({ success: true, data: software });
}


async debugOcsIps(req: Request, res: Response) {
  const rows = await OcsDataSource.query(`
    SELECT ID, NAME, IPADDR 
    FROM hardware 
    WHERE IPADDR IS NOT NULL 
      AND IPADDR != '' 
    LIMIT 10
  `);
  res.json({ success: true, data: rows });
}

async debugUnmapped(req: Request, res: Response) {
  const { OcsServerMapping } = await import("../../entities/OcsServerMapping");
  
  const mapped = await AppDataSource.getRepository(OcsServerMapping)
    .createQueryBuilder("m")
    .select("m.ocsHardwareId", "id")
    .getRawMany();

  const mappedIds = mapped.map((r: any) => Number(r.id));

  const all = await OcsDataSource.query(`
    SELECT ID, NAME, IPADDR 
    FROM hardware 
    WHERE DEVICEID IS NOT NULL 
      AND DEVICEID != 'REMOVED'
      AND IPADDR IS NOT NULL 
      AND IPADDR != ''
      AND IPADDR NOT IN ('127.0.0.1','0.0.0.0')
  `);

  const unmapped = all.filter((h: any) => !mappedIds.includes(Number(h.ID)));
  res.json({ success: true, total: unmapped.length, data: unmapped });
}
async getUnmatched(req: Request, res: Response) {
  const { OcsServerMapping } = await import("../../entities/OcsServerMapping");

  const mapped = await AppDataSource.getRepository(OcsServerMapping)
    .createQueryBuilder("m")
    .select("m.ocsHardwareId", "id")
    .getRawMany();

  const mappedIds = mapped.map((r: any) => Number(r.id));

  const all = await OcsDataSource.query(`
    SELECT
      h.ID, h.NAME, h.IPADDR, h.OSNAME, h.MEMORY,
      COALESCE(
        NULLIF(cpu.LOGICAL_CPUS, 0),
        NULLIF(cpu.CORES, 0),
        NULLIF(h.PROCESSORN, 0)
      ) AS VCPU
    FROM hardware h
    LEFT JOIN (
      SELECT
        HARDWARE_ID,
        SUM(COALESCE(LOGICAL_CPUS, 0)) AS LOGICAL_CPUS,
        SUM(COALESCE(CORES, 0))        AS CORES
      FROM cpus
      GROUP BY HARDWARE_ID
    ) cpu ON cpu.HARDWARE_ID = h.ID
    WHERE h.DEVICEID IS NOT NULL
      AND h.DEVICEID != 'REMOVED'
      AND h.IPADDR IS NOT NULL
      AND h.IPADDR != ''
      AND h.IPADDR LIKE '172.16.%'
    ORDER BY h.NAME
  `);

  const unmatched = all.filter((h: any) => !mappedIds.includes(Number(h.ID)));
  res.json({ success: true, total: unmatched.length, data: unmatched });
}
async getAllSoftware(req: Request, res: Response) {
  const { q, page = "1", limit = "100" } = req.query as Record<string, string>;
  const pageNum  = parseInt(page)  || 1;
  const limitNum = parseInt(limit) || 100;
  const skip     = (pageNum - 1) * limitNum;

  const repo = AppDataSource.getRepository(SoftwareInstalado);

  const qb = repo.createQueryBuilder("sw")
    .leftJoinAndSelect("sw.asset", "asset")
    .leftJoinAndSelect("asset.servidor", "servidor")
    .orderBy("sw.softwareName", "ASC");

  if (q) {
    qb.where(
      "LOWER(sw.softwareName) LIKE :q OR LOWER(sw.softwarePublisher) LIKE :q OR LOWER(asset.nombre) LIKE :q",
      { q: `%${q.toLowerCase()}%` }
    );
  }

  const [rows, total] = await qb.skip(skip).take(limitNum).getManyAndCount();

  // Stats globales (sin filtro de q para que las cards sean siempre del total real)
  const statsRepo = AppDataSource.getRepository(SoftwareInstalado);
  const totalInstalaciones = await statsRepo.count();
  const totalAppsRaw = await statsRepo
    .createQueryBuilder("sw")
    .select("COUNT(DISTINCT sw.softwareName)", "cnt")
    .getRawOne();
  const totalServidoresRaw = await statsRepo
    .createQueryBuilder("sw")
    .select("COUNT(DISTINCT sw.asset)", "cnt")
    .getRawOne();

  res.json({
    success: true,
    data: {
      rows: rows.map(sw => ({
        assetId:           sw.asset?.id          ?? null,
        softwareName:      sw.softwareName,
        softwareVersion:   sw.softwareVersion   ?? null,
        softwarePublisher: sw.softwarePublisher ?? null,
        servidorNombre:    sw.asset?.nombre     ?? null,
        servidorIp:        sw.asset?.servidor?.ipInterna ?? null,
      })),
      total,
      stats: {
        totalInstalaciones,
        totalApps:       parseInt(totalAppsRaw?.cnt       ?? "0"),
        totalServidores: parseInt(totalServidoresRaw?.cnt ?? "0"),
      },
    },
  });
}



}

export const ocsController = new OcsController();

