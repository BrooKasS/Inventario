import "reflect-metadata";
import { AppDataSource } from "../config/database";
import { Asset } from "../entities/Asset";
import { Vpn } from "../entities/Vpn";
import { VpnRule } from "../entities/VpnRule";

async function diagnostico() {
  try {
    console.log("🔍 INICIANDO DIAGNÓSTICO...\n");
    
    await AppDataSource.initialize();
    console.log("✅ Conectado a BD\n");

    const assetRepo = AppDataSource.getRepository(Asset);
    const vpnRepo = AppDataSource.getRepository(Vpn);
    const ruleRepo = AppDataSource.getRepository(VpnRule);

    // 1. Contar totales
    const totalAssets = await assetRepo.count();
    const totalVpns = await vpnRepo.count();
    const totalRules = await ruleRepo.count();
    const vpnAssets = await assetRepo.count({ where: { tipo: "VPN" } as any });

    console.log("📊 CONTEOS GENERALES:");
    console.log(`   Total Assets: ${totalAssets}`);
    console.log(`   Total Assets VPN: ${vpnAssets}`);
    console.log(`   Total VPNS en tabla: ${totalVpns}`);
    console.log(`   Total REGLAS en tabla: ${totalRules}\n`);

    // 2. VPNs con reglas vs sin reglas
    const vpnsConReglas = await vpnRepo
      .createQueryBuilder("vpn")
      .leftJoinAndSelect("vpn.reglas", "reglas")
      .andWhere("reglas.id IS NOT NULL")
      .getMany();
    
    const vpnSinReglas = totalVpns - new Set(vpnsConReglas.map(v => v.id)).size;

    console.log("📋 ESTADÍSTICAS DE REGLAS:");
    console.log(`   VPNs CON al menos 1 regla: ${new Set(vpnsConReglas.map(v => v.id)).size}`);
    console.log(`   VPNs SIN reglas: ${vpnSinReglas}\n`);

    // 3. Buscar "test"
    console.log("🔎 BUSCANDO VPN 'test':");
    const testAsset = await assetRepo.findOne({
      where: { nombre: "test", tipo: "VPN" } as any,
    });

    if (testAsset) {
      const testVpn = await vpnRepo.findOne({
        where: { asset: { id: testAsset.id } } as any,
        relations: ["reglas"],
      });

      if (testVpn) {
        console.log(`   ✅ Asset "test" encontrado: ${testAsset.id}`);
        console.log(`   ✅ VPN asociada: ${testVpn.id}`);
        console.log(`   Datos VPN: conexion=${testVpn.conexion}, fases=${testVpn.fases}`);
        console.log(`   Reglas cargadas en relación: ${testVpn.reglas?.length ?? 0}`);

        // Query directa
        const reglasDirect = await ruleRepo.find({
          where: { vpn: { id: testVpn.id } },
        });
        console.log(`   Reglas en tabla (query directo): ${reglasDirect.length}`);

        if (reglasDirect.length > 0) {
          console.log(`\n   📝 DETALLES DE REGLAS:`);
          reglasDirect.forEach((r, i) => {
            console.log(`      [${i + 1}] id=${r.id}, vpnId=${r.vpn.id}`);
            console.log(`          conexion="${r.conexion}", fases="${r.fases}"`);
            console.log(`          origen="${r.origen}", destino="${r.destino}"`);
          });
        }
      } else {
        console.log(`   ❌ VPN no encontrada para asset "test"`);
      }
    } else {
      console.log(`   ❌ Asset "test" NO existe en BD\n`);
    }

    // 4. Primeras 5 VPNs con reglas
    console.log(`\n📊 PRIMERAS 5 VPNs CON REGLAS:`);
    const top5 = await vpnRepo
      .createQueryBuilder("vpn")
      .leftJoinAndSelect("vpn.reglas", "reglas")
      .leftJoinAndSelect("vpn.asset", "asset")
      .where("reglas.id IS NOT NULL")
      .orderBy("asset.nombre", "ASC")
      .take(5)
      .getMany();

    if (top5.length === 0) {
      console.log(`   ⚠️  No hay VPNs con reglas`);
    } else {
      top5.forEach((vpn, i) => {
        console.log(`\n   [${i + 1}] ${vpn.asset?.nombre || "sin nombre"}`);
        console.log(`       VPN ID: ${vpn.id}`);
        console.log(`       Reglas: ${vpn.reglas?.length ?? 0}`);
      });
    }

    // 5. Diagnóstico de qué filtro necesitamos
    console.log(`\n\n🎯 DIAGNÓSTICO DE FILTRO:`);
    console.log(`   Si antes mostraba ~50-100 VPNs y ahora 226,`);
    console.log(`   probablemente se necesita filtrar por:`);
    console.log(`   → SOLO mostrar VPNs que TENGAN reglas (${new Set(vpnsConReglas.map(v => v.id)).size} VPNs)`);
    console.log(`   → O restaurar un campo 'principal' para diferenciar`);

  } catch (error: any) {
    console.error("\n❌ ERROR:", error.message);
    console.error(error.stack);
  } finally {
    await AppDataSource.destroy();
    console.log("\n✅ Desconectado\n");
  }
}

diagnostico();
