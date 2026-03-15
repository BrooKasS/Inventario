import { app } from "./app";
import { prisma } from "./config/database";

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    // Verificar conexión a BD
    await prisma.$connect();
    console.log("✅ Conectado a PostgreSQL");

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
  await prisma.$disconnect();
  process.exit(0);
});

