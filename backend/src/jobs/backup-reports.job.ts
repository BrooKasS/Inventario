import cron from "node-cron";
import { backupReportsService, BackupTipo } from "../api/services/backupReports.service";

const jobRunning: Record<BackupTipo, boolean> = {
  diario: false,
  semanal: false,
  mensual: false,
  kpi: false,
};

// ─────────────────────────────────────────────────────────────────────────────
// Descarga + procesa + envía automáticamente el informe del tipo indicado.
// Réplica de diario/scripts/index.js (orquestación descargar → procesar → enviar).
// ─────────────────────────────────────────────────────────────────────────────
async function runAndSend(tipo: BackupTipo): Promise<void> {
  if (jobRunning[tipo]) {
    console.warn(`⚠️  [BACKUP-JOB:${tipo}] Ya en ejecución, se omite este disparo.`);
    return;
  }

  jobRunning[tipo] = true;
  console.log(`\n🕒 [BACKUP-JOB:${tipo}] Iniciado — ${new Date().toISOString()}`);
  try {
    const run = await backupReportsService.createRun(tipo, { trigger: "cron" });
    console.log(
      `✅ [BACKUP-JOB:${tipo}] Procesado — correos: ${run.correosEncontrados} | archivos: ${run.archivosProcesados}`
    );

    if (run.archivosProcesados === 0) {
      console.warn(`⚠️  [BACKUP-JOB:${tipo}] Sin adjuntos en el rango, no se envía correo.`);
      return;
    }

    await backupReportsService.sendRun(tipo, run.runId, {});
    console.log(`📧 [BACKUP-JOB:${tipo}] Correo enviado correctamente.`);
  } catch (error: any) {
    console.error(`❌ [BACKUP-JOB:${tipo}] Error: ${error.message}`);
  } finally {
    jobRunning[tipo] = false;
  }
}

function esUltimoDiaDelMes(): boolean {
  const hoy = new Date();
  const manana = new Date(hoy);
  manana.setDate(hoy.getDate() + 1);
  return manana.getDate() === 1;
}

export function initBackupReportsJobs(): void {
  const timezone = "America/Bogota";

  // Diario — todos los días a las 9:30am
  cron.schedule("30 9 * * *", () => runAndSend("diario"), { timezone });

  // Semanal — todos los viernes a las 9:10am (rango: sábado anterior → hoy)
  cron.schedule("10 9 * * 5", () => runAndSend("semanal"), { timezone });

  // Mensual — chequea todos los días a las 9:31am si hoy es el último día del mes
  cron.schedule(
    "31 9 * * *",
    () => {
      if (esUltimoDiaDelMes()) runAndSend("mensual");
    },
    { timezone }
  );

  // KPI: sin cron — se dispara únicamente bajo demanda desde la UI.

  console.log("⏰ [BACKUP-JOB] Cron jobs registrados — diario 9:30am, semanal viernes 9:10am, mensual último día 9:31am (America/Bogota)");
}

export async function triggerManualRun(tipo: BackupTipo): Promise<void> {
  return runAndSend(tipo);
}
