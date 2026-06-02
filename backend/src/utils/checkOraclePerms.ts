import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

import { AppDataSource } from "../config/database";

async function checkOcsTables() {
  try {
    console.log("🔍 Conectando a Oracle...");
    console.log(`   Host:    ${process.env.DB_HOST}`);
    console.log(`   User:    ${process.env.DB_USER}\n`);

    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    console.log("✅ Conectado\n");

    // ── 1. Verificar existencia de tablas ──────────────────────────────────
    const tablas = await AppDataSource.query(`
      SELECT TABLE_NAME 
      FROM USER_TABLES 
      WHERE TABLE_NAME IN ('OCS_SERVER_MAPPING', 'SOFTWARE_INSTALADO')
      ORDER BY TABLE_NAME
    `);

    const nombres = tablas.map((t: any) => t.TABLE_NAME);
    const tieneMapping  = nombres.includes("OCS_SERVER_MAPPING");
    const tieneSoftware = nombres.includes("SOFTWARE_INSTALADO");

    console.log("📋 Tablas OCS en Oracle:");
    console.log(`   OCS_SERVER_MAPPING:  ${tieneMapping  ? "✅ EXISTE" : "❌ NO EXISTE"}`);
    console.log(`   SOFTWARE_INSTALADO:  ${tieneSoftware ? "✅ EXISTE" : "❌ NO EXISTE"}`);

    // ── 2. Si existen, mostrar columnas de cada una ────────────────────────
    if (tieneMapping) {
      const cols = await AppDataSource.query(`
        SELECT COLUMN_NAME, DATA_TYPE, NULLABLE
        FROM USER_TAB_COLUMNS
        WHERE TABLE_NAME = 'OCS_SERVER_MAPPING'
        ORDER BY COLUMN_ID
      `);
      console.log("\n📋 Columnas de OCS_SERVER_MAPPING:");
      cols.forEach((c: any) =>
        console.log(`   ${c.COLUMN_NAME.padEnd(25)} ${c.DATA_TYPE.padEnd(15)} ${c.NULLABLE === "Y" ? "nullable" : "NOT NULL"}`)
      );
    }

    if (tieneSoftware) {
      const cols = await AppDataSource.query(`
        SELECT COLUMN_NAME, DATA_TYPE, NULLABLE
        FROM USER_TAB_COLUMNS
        WHERE TABLE_NAME = 'SOFTWARE_INSTALADO'
        ORDER BY COLUMN_ID
      `);
      console.log("\n📋 Columnas de SOFTWARE_INSTALADO:");
      cols.forEach((c: any) =>
        console.log(`   ${c.COLUMN_NAME.padEnd(25)} ${c.DATA_TYPE.padEnd(15)} ${c.NULLABLE === "Y" ? "nullable" : "NOT NULL"}`)
      );
    }

    // ── 3. Veredicto final ─────────────────────────────────────────────────
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    if (tieneMapping && tieneSoftware) {
      console.log("✅ AMBAS TABLAS CREADAS — listo para continuar");
    } else {
      console.log("❌ FALTAN TABLAS — TypeORM no las creó");
      console.log("\n¿Posibles causas?");
      if (!tieneMapping || !tieneSoftware) {
        console.log("   1. Las entidades no están registradas en database.ts");
        console.log("   2. NODE_ENV=production (synchronize queda en false)");
        console.log("   3. El servidor no reinició correctamente");
        console.log("\n   → Verifica que en database.ts aparezcan:");
        console.log("       OcsServerMapping,");
        console.log("       SoftwareInstalado,");
        console.log("   → Verifica que NODE_ENV no sea 'production' en tu .env");
      }
    }
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    await AppDataSource.destroy();
    process.exit(0);
  } catch (error: any) {
    console.error("\n❌ Error:");
    console.error(`   ${error.message}\n`);
    process.exit(1);
  }
}

checkOcsTables();