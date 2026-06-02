

import "dotenv/config";
console.log("[STARTUP] 🔍 .env loaded. ADMINS=", process.env.ADMINS, "| JWT_SECRET=", process.env.JWT_SECRET ? "✅" : "❌");

import { app } from "./app";
import { AppDataSource } from "./config/database";
import { OcsDataSource } from "./config/ocs.database";
import { initOcsSyncJob } from "./jobs/ocs-sync.job"; // ← corregido osc → ocs

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await AppDataSource.initialize();
    console.log("✅ Conectado a Oracle");

    await OcsDataSource.initialize();
    console.log("✅ OCS DB conectada");

    initOcsSyncJob(); // ← ambas DBs listas antes de registrar el cron

    app.listen(PORT, () => {
      console.log(`🚀 API corriendo en http://localhost:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
    });

  } catch (error) {
    console.error("❌ Error al iniciar servidor:", error);
    process.exit(1);
  }
}

start();

async function shutdown() {
  console.log("\n🛑 Apagando servidor...");
  await AppDataSource.destroy();
  await OcsDataSource.destroy();
  console.log("✅ Conexiones cerradas correctamente");
  process.exit(0);
}

process.on("SIGINT", shutdown);   // Ctrl+C
process.on("SIGTERM",shutdown);  // PM2 / systemd / Docker
