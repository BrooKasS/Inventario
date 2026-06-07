import { AppDataSource } from "../../config/database";
import { OcsDataSource } from "../../config/ocs.database";
import { OcsServerMapping } from "../../entities/OcsServerMapping";
import { SoftwareInstalado } from "../../entities/SoftwareInstalado";
import { Servidor } from "../../entities/Servidor";
import { v4 as uuidv4 } from "uuid";

interface OcsHardware {
  ID: number;
  NAME: string;
  IPADDRESS: string | null;
  OSNAME: string | null;
  MEMORY: number | null;
  VCPU: number | null;
}

interface OcsSoftware {
  HARDWARE_ID: number;
  NAME: string;
  VERSION: string | null;
  PUBLISHER: string | null;
}

interface SyncResult {
  mapped: number;
  unmapped: number;
  softwareInserted: number;
  errors: number;
  timestamp: Date;
  duration: string;
}

export class OcsSyncService {

  // ─── FIX 1: procesa hardware en batches de 50, no todo junto ───────────────
  async syncOcsToOracle(): Promise<SyncResult> {
    const startTime = Date.now();
    const result: SyncResult = {
      mapped: 0,
      unmapped: 0,
      softwareInserted: 0,
      errors: 0,
      timestamp: new Date(),
      duration: "",
    };

    console.log("[OCS-SYNC] Iniciando sincronizacion...");

    if (!OcsDataSource.isInitialized) {
      throw new Error("OcsDataSource no esta inicializado. Verifica la conexion MySQL.");
    }
    if (!AppDataSource.isInitialized) {
      throw new Error("AppDataSource no esta inicializado. Verifica la conexion Oracle.");
    }

    try {
      const hardwareList = await this.getOcsHardware();
      console.log(`[OCS-SYNC] Hardware encontrado en OCS: ${hardwareList.length}`);

      if (hardwareList.length === 0) {
        console.warn("[OCS-SYNC] No se encontro hardware en OCS.");
        result.duration = this.calcDuration(startTime);
        return result;
      }

      await this.limpiarTablas();

      // Procesar en batches de 50 equipos — softwareMap nunca crece más de 50 a la vez
      const HW_BATCH = 50;
      for (let i = 0; i < hardwareList.length; i += HW_BATCH) {
        const hwChunk = hardwareList.slice(i, i + HW_BATCH);
        const ids = hwChunk.map((h) => h.ID);

        // Solo carga software de estos 50 equipos — se libera al final del loop
        const softwareMap = await this.getOcsSoftwareGrouped(ids);

        for (const hw of hwChunk) {
          try {
            await this.procesarHardware(hw, softwareMap[hw.ID] || [], result);
          } catch (hwError: any) {
            console.error(`[OCS-SYNC] Error procesando HW-${hw.ID} (${hw.NAME}): ${hwError.message}`);
            result.errors++;
          }
        }

        console.log(
          `[OCS-SYNC] Progreso: ${Math.min(i + HW_BATCH, hardwareList.length)}/${hardwareList.length}`
        );

        // Cede el event loop entre batches para que GC pueda limpiar
        await new Promise((resolve) => setImmediate(resolve));
      }

    } catch (error: any) {
      console.error(`[OCS-SYNC] Error general en sync: ${error.message}`);
      throw error;
    }

    result.duration = this.calcDuration(startTime);
    console.log(
      `[OCS-SYNC] Completado en ${result.duration} - ` +
      `Mapeados: ${result.mapped} | Sin match: ${result.unmapped} | ` +
      `Software insertado: ${result.softwareInserted} | Errores: ${result.errors}`
    );

    return result;
  }

  // sin cambios — igual que antes
  private async getOcsHardware(): Promise<OcsHardware[]> {
    const rows = await OcsDataSource.query(`
      SELECT
        h.ID,
        h.NAME,
        h.IPADDR AS IPADDRESS,
        h.OSNAME,
        h.MEMORY,
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
          SUM(COALESCE(CORES, 0)) AS CORES
        FROM cpus
        GROUP BY HARDWARE_ID
      ) cpu ON cpu.HARDWARE_ID = h.ID
      WHERE h.DEVICEID IS NOT NULL
        AND h.DEVICEID != 'REMOVED'
        AND h.IPADDR IS NOT NULL
        AND h.IPADDR != ''
        AND h.IPADDR NOT IN ('127.0.0.1', '0.0.0.0')
      ORDER BY h.ID
    `);
    return rows as OcsHardware[];
  }

  // ─── FIX 2: software en batches de 100 IDs, no todos de un golpe ───────────
  private async getOcsSoftwareGrouped(
    hardwareIds: number[]
  ): Promise<Record<number, OcsSoftware[]>> {
    if (hardwareIds.length === 0) return {};

    const BATCH = 100;
    const grouped: Record<number, OcsSoftware[]> = {};

    for (let i = 0; i < hardwareIds.length; i += BATCH) {
      const chunk = hardwareIds.slice(i, i + BATCH);
      const placeholders = chunk.map(() => "?").join(",");

      const rows = await OcsDataSource.query(
        `SELECT
          s.HARDWARE_ID,
          s.NAME,
          s.VERSION,
          s.PUBLISHER
        FROM softwares s
        WHERE s.HARDWARE_ID IN (${placeholders})
          AND s.NAME IS NOT NULL
          AND s.NAME != ''
        ORDER BY s.HARDWARE_ID, s.NAME`,
        chunk
      );

      for (const row of rows) {
        const hwId = Number(row.HARDWARE_ID);
        if (!grouped[hwId]) grouped[hwId] = [];
        grouped[hwId].push({
          HARDWARE_ID: hwId,
          NAME: row.NAME,
          VERSION: row.VERSION ?? null,
          PUBLISHER: row.PUBLISHER ?? null,
        });
      }

      // Cede el event loop entre batches
      await new Promise((resolve) => setImmediate(resolve));
    }

    return grouped;
  }

  // sin cambios — igual que antes
  private async limpiarTablas(): Promise<void> {
    console.log("[OCS-SYNC] Limpiando datos anteriores...");
    await AppDataSource.getRepository(SoftwareInstalado).clear();
    await AppDataSource.getRepository(OcsServerMapping).clear();
    console.log("[OCS-SYNC] Tablas limpias, insertando datos frescos...");
  }

  // sin cambios — igual que antes
  private async procesarHardware(
    hw: OcsHardware,
    software: OcsSoftware[],
    result: SyncResult
  ): Promise<void> {
    if (!hw.IPADDRESS) {
      console.warn(`[OCS-SYNC] HW-${hw.ID} (${hw.NAME}) sin IP - omitido`);
      result.unmapped++;
      return;
    }

    const matchResult = await this.findServidorByIp(hw.IPADDRESS);

    if (!matchResult) {
      console.warn(`[OCS-SYNC] HW-${hw.ID} (${hw.NAME}) IP:${hw.IPADDRESS} -> sin match`);
      result.unmapped++;
      return;
    }

    const { assetId, ipField } = matchResult;

    const mappingRepo = AppDataSource.getRepository(OcsServerMapping);
    const mapping = mappingRepo.create({
      id: uuidv4(),
      asset: { id: assetId },
      ocsHardwareId: hw.ID,
      ocsHardwareName: hw.NAME ?? null,
      ipMatched: hw.IPADDRESS,
      ipFieldMatched: ipField,
      status: "MAPPED",
      syncDate: new Date(),
    });

    const savedMapping = await mappingRepo.save(mapping);

    await this.actualizarServidorDesdeOcs(assetId, hw);

    if (software.length > 0) {
      const softwareRepo = AppDataSource.getRepository(SoftwareInstalado);
      const unicos = this.deduplicarSoftware(software);

      const registros = unicos.map((sw) =>
        softwareRepo.create({
          id: uuidv4(),
          asset: { id: assetId },
          ocsServerMapping: { id: savedMapping.id },
          softwareName: sw.NAME,
          softwareVersion: sw.VERSION ?? null,
          softwarePublisher: sw.PUBLISHER ?? null,
        })
      );

      await this.insertarEnChunks(softwareRepo, registros, 500);
      result.softwareInserted += registros.length;
    }

    console.log(
      `[OCS-SYNC] HW-${hw.ID} (${hw.NAME}) -> asset ${assetId} ` +
      `[${ipField}:${hw.IPADDRESS}] - ${software.length} apps`
    );
    result.mapped++;
  }

  // sin cambios — igual que antes
  private async actualizarServidorDesdeOcs(
    assetId: string,
    hw: OcsHardware
  ): Promise<void> {
    const servidorRepo = AppDataSource.getRepository(Servidor);

    const servidor = await servidorRepo.findOne({
      where: { asset: { id: assetId } },
    });

    if (!servidor) return;

    let actualizado = false;

    const osName = hw.OSNAME?.trim();
    if (osName && servidor.sistemaOperativo !== osName) {
      servidor.sistemaOperativo = osName;
      actualizado = true;
    }

    const memory = Number(hw.MEMORY);
    if (Number.isFinite(memory) && memory > 0 && servidor.vramMb !== memory) {
      servidor.vramMb = memory;
      actualizado = true;
    }

    const vcpu = Number(hw.VCPU);
    if (Number.isFinite(vcpu) && vcpu > 0 && servidor.vcpu !== vcpu) {
      servidor.vcpu = vcpu;
      actualizado = true;
    }

    if (!actualizado) return;

    await servidorRepo.save(servidor);

    console.log(
      `[OCS-SYNC] Servidor actualizado - ` +
      `asset ${assetId} | OS: ${osName ?? "-"} | RAM: ${hw.MEMORY ?? "-"}MB | CPU: ${hw.VCPU ?? "-"}`
    );
  }

  // sin cambios — igual que antes
  private async findServidorByIp(
    ip: string
  ): Promise<{ assetId: string; ipField: string } | null> {
    const servidorRepo = AppDataSource.getRepository(Servidor);

    const raw = await servidorRepo
      .createQueryBuilder("s")
      .select("s.ipInterna", "ipInterna")
      .addSelect("s.ipGestion", "ipGestion")
      .addSelect("s.ipServicio", "ipServicio")
      .addSelect("asset.id", "assetId")
      .innerJoin("s.asset", "asset")
      .where(
        "s.ipInterna = :ip OR s.ipGestion = :ip OR s.ipServicio = :ip",
        { ip }
      )
      .getRawOne();

    if (!raw || !raw.assetId) return null;

    const ipField =
      raw.ipInterna === ip ? "ipInterna" :
      raw.ipGestion === ip ? "ipGestion" :
      "ipServicio";

    return { assetId: raw.assetId, ipField };
  }

  // sin cambios — igual que antes
  private deduplicarSoftware(software: OcsSoftware[]): OcsSoftware[] {
    const vistos = new Set<string>();
    return software.filter((sw) => {
      const key = `${sw.NAME}||${sw.VERSION ?? ""}`.toLowerCase();
      if (vistos.has(key)) return false;
      vistos.add(key);
      return true;
    });
  }

  // ─── FIX 3: insert() en lugar de save() — no hace SELECT previo ─────────────
  private async insertarEnChunks(
    repo: any,
    registros: any[],
    chunkSize: number
  ): Promise<void> {
    for (let i = 0; i < registros.length; i += chunkSize) {
      const chunk = registros.slice(i, i + chunkSize);

      // insert() es INSERT puro — save() hacía SELECT+INSERT por cada fila
      // Seguro porque limpiarTablas() ya borró todo antes del sync
      await repo.insert(chunk);

      // Cede el event loop entre chunks
      await new Promise((resolve) => setImmediate(resolve));
    }
  }

  // sin cambios — igual que antes
  private calcDuration(startTime: number): string {
    const ms = Date.now() - startTime;
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
  }

  // sin cambios — igual que antes
  async getLastSyncInfo(): Promise<{
    lastSync: Date | null;
    totalMappings: number;
    totalSoftware: number;
  }> {
    const mappingRepo = AppDataSource.getRepository(OcsServerMapping);
    const softwareRepo = AppDataSource.getRepository(SoftwareInstalado);

    const totalMappings = await mappingRepo.count();
    const totalSoftware = await softwareRepo.count();

    const lastMapping = await mappingRepo.findOne({
      where: {},
      order: { syncDate: "DESC" },
    });

    return {
      lastSync: lastMapping?.syncDate ?? null,
      totalMappings,
      totalSoftware,
    };
  }
}

export const ocsSyncService = new OcsSyncService();