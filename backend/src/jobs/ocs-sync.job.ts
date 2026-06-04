import cron from "node-cron";
import { ocsSyncService } from "../api/services/ocs-sync.service";

let jobRunning = false; // Guard para evitar ejecuciones solapadas

// ─────────────────────────────────────────────────────────────────────────────
// Función que ejecuta el sync con protección completa
// ─────────────────────────────────────────────────────────────────────────────
async function runSync(trigger: "cron" | "manual" = "cron"): Promise<void> {
  if (jobRunning) {
    console.warn(`⚠️  [OCS-JOB] Sync ya en ejecución, omitiendo (trigger: ${trigger})`);
    return;
  }

  jobRunning = true;
  console.log(`\n🕒 [OCS-JOB] Sync iniciado — trigger: ${trigger} — ${new Date().toISOString()}`);
  try {
    const result = await ocsSyncService.syncOcsToOracle();
    console.log(
      `✅ [OCS-JOB] Sync completado — ` +
      `Mapeados: ${result.mapped} | Sin match: ${result.unmapped} | ` +
      `Software: ${result.softwareInserted} | Errores: ${result.errors} | ` +
      `Duración: ${result.duration}`
    );
  } catch (error: any) {
    console.error(`❌ [OCS-JOB] Error en sync (${trigger}): ${error.message}`);
    // No relanzamos el error para que el cron siga vivo la próxima noche
  } finally {
    jobRunning = false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Inicializar el cron job
// ─────────────────────────────────────────────────────────────────────────────
export function initOcsSyncJob(): void {
  // Se ejecuta todos los días a las 3:00am
  cron.schedule("39 11 * * *", () => {
    runSync("cron");
  }, {
    timezone: "America/Bogota", // ← ajusta a tu zona horaria
  });

  console.log("⏰ [OCS-JOB] Cron job registrado — ejecución diaria a las 3:00am (America/Bogota)");
}

// ─────────────────────────────────────────────────────────────────────────────
// Exportar función para ejecución manual (desde endpoint o script)
// ─────────────────────────────────────────────────────────────────────────────
export async function triggerManualSync(): Promise<void> {
  return runSync("manual");
}