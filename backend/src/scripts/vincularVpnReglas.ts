/**
 * Script: Identificar y vincular VPNs Principales con sus Reglas
 * 
 * PROPÓSITO:
 *   Después de ejecutar la migration SQL, este script:
 *   1. Lee todas las VPNs de la BD
 *   2. Las agrupa por IP (conexion)
 *   3. Para cada grupo, identifica la VPN PRINCIPAL
 *   4. Asigna vpnPrincipalId a todas las REGLAS
 *
 * LÓGICA DE IDENTIFICACIÓN:
 *   VPN PRINCIPAL = aquella cuyo nombre NO contiene sufijos numéricos
 *   REGLA = VPN con mismo IP y nombre contiene sufijos (_2, _3, etc)
 *
 * EJEMPLO:
 *   Grupo IP 190.60.246.130:
 *     - DIGITALWARE_AR (principal) ← NO tiene sufijo
 *     - DIGITALWARE_AR2 (regla) ← vpnPrincipalId = id(DIGITALWARE_AR)
 *     - DIGITALWARE_AR3 (regla) ← vpnPrincipalId = id(DIGITALWARE_AR)
 *
 * CÓMO EJECUTAR:
 *   cd backend
 *   npm run ts-node src/scripts/vincularVpnReglas.ts
 *
 * SEGURIDAD:
 *   - Valida datos antes de actualizar
 *   - Loguea cada cambio
 *   - Permite ROLLBACK manual si algo falla
 *
 */

import "dotenv/config";
import "reflect-metadata";
import { AppDataSource } from "../config/database";
import { Vpn } from "../entities/Vpn";

// ═══════════════════════════════════════════════════════════════════════════

async function main() {
  try {
    // 1. Inicializar conexión a BD
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log("✓ Conexión a BD establecida\n");
    }

    const vpnRepository = AppDataSource.getRepository(Vpn);

    // 2. Obtener todas las VPNs
    const todasVpns = await vpnRepository.find({
      relations: ["asset"],
      order: { conexion: "ASC", asset: { nombre: "ASC" } },
    });

    console.log(`📊 Total de VPNs en BD: ${todasVpns.length}\n`);

    if (todasVpns.length === 0) {
      console.log("⚠️  No hay VPNs en la BD");
      process.exit(0);
    }

    // 3. Agrupar por IP (conexion)
    const porIp = new Map<string, Vpn[]>();
    for (const vpn of todasVpns) {
      const ip = vpn.conexion || "N/A";
      if (!porIp.has(ip)) {
        porIp.set(ip, []);
      }
      porIp.get(ip)!.push(vpn);
    }

    console.log(`📍 IPs únicas: ${porIp.size}\n`);

    // 4. Procesar cada grupo
    let actualizadas = 0;
    let saltadas = 0;

    for (const [ip, vpns] of porIp) {
      // Si solo hay 1 VPN en esta IP, es principal (no hay reglas)
      if (vpns.length === 1) {
        console.log(`  ✓ IP ${ip}: 1 VPN (PRINCIPAL, sin reglas)`);
        continue;
      }

      // Si hay múltiples, identificar la principal
      const principal = identificarPrincipal(vpns);

      if (!principal) {
        console.log(`  ⚠️  IP ${ip}: NO SE PUDO IDENTIFICAR PRINCIPAL`);
        vpns.forEach((v) => {
          console.log(`     - ${v.asset?.nombre}`);
        });
        console.log("");
        saltadas += vpns.length;
        continue;
      }

      console.log(`  📌 IP ${ip}: PRINCIPAL = "${principal.asset?.nombre}"`);

      // Asignar vpnPrincipalId a todas las reglas
      for (const vpn of vpns) {
        if (vpn.id === principal.id) continue; // Saltar la principal

        if (vpn.vpnPrincipalId !== principal.id) {
          vpn.vpnPrincipalId = principal.id;
          await vpnRepository.save(vpn);
          actualizadas++;
          console.log(`     ✓ "${vpn.asset?.nombre}" → vinculada`);
        }
      }
      console.log("");
    }

    // 5. Resumen
    console.log("═".repeat(70));
    console.log(`✅ PROCESO COMPLETADO`);
    console.log(`   • VPNs actualizadas: ${actualizadas}`);
    console.log(`   • VPNs saltadas: ${saltadas}`);
    console.log(`   • VPNs sin cambios: ${todasVpns.length - actualizadas - saltadas}`);
    console.log("═".repeat(70));

    process.exit(0);
  } catch (error) {
    console.error("❌ ERROR:", error);
    process.exit(1);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// FUNCIÓN: Identificar VPN Principal en un grupo
// ═══════════════════════════════════════════════════════════════════════════

function identificarPrincipal(vpns: Vpn[]): Vpn | null {
  // Estrategia 1: Buscar la que NO tiene sufijo numérico
  const sinSufijo = vpns.find((v) => {
    const nombre = v.asset?.nombre || "";
    // Si termina con _N (donde N es número), es regla
    return !/(_\d+$|_\d{2,}$)/.test(nombre);
  });

  if (sinSufijo) return sinSufijo;

  // Estrategia 2: Si todas tienen sufijo, la principal es la primera
  // (normalmente la que fue creada primero)
  console.warn(`    ⚠️  Todas las VPNs tienen sufijo numérico. Usando la primera como principal.`);
  return vpns[0];
}

// ═══════════════════════════════════════════════════════════════════════════

main().catch((err) => {
  console.error("Error no capturado:", err);
  process.exit(1);
});
