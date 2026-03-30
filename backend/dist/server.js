"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const database_1 = require("./config/database");
const PORT = process.env.PORT || 3000;
async function start() {
    try {
        // Inicializar conexión TypeORM (Oracle)
        await database_1.AppDataSource.initialize();
        console.log("✅ Conectado a Oracle");
        app_1.app.listen(PORT, () => {
            console.log(`🚀 API corriendo en http://localhost:${PORT}`);
            console.log(`📊 Health check: http://localhost:${PORT}/health`);
        });
    }
    catch (error) {
        console.error("❌ Error al iniciar servidor:", error);
        process.exit(1);
    }
}
start();
// Graceful shutdown
process.on("SIGINT", async () => {
    await database_1.AppDataSource.destroy();
    process.exit(0);
});
