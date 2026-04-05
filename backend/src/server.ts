import "dotenv/config";
import { app } from "./app";
import { AppDataSource } from "./config/database";

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    // Inicializar conexión TypeORM (Oracle)
    await AppDataSource.initialize();
    console.log("✅ Conectado a Oracle");

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

// Graceful shutdown
process.on("SIGINT", async () => {
  await AppDataSource.destroy();
  process.exit(0);
});