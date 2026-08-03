import cron from "node-cron";
import { certAlertasService } from "../api/services/certAlertas.service";

let running = false;

async function run(): Promise<void> {
  if (running) {
    console.warn("⚠️  [CERT-ALERTAS-JOB] Ya en ejecución, se omite este disparo.");
    return;
  }
  running = true;
  console.log(`\n🕒 [CERT-ALERTAS-JOB] Iniciado — ${new Date().toISOString()}`);
  try {
    await certAlertasService.checkAndNotify();
  } catch (error: any) {
    console.error(`❌ [CERT-ALERTAS-JOB] Error:`, error.response?.data ?? error.message);
  } finally {
    running = false;
  }
}

export function initCertAlertasJob(): void {
  cron.schedule("0 8 * * *", run, { timezone: "America/Bogota" });
  console.log("⏰ [CERT-ALERTAS-JOB] Cron registrado — todos los días 8:00am (America/Bogota)");
}
