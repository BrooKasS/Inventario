import "reflect-metadata";
import { AppDataSource } from "../config/database";
import { Asset } from "../entities/Asset";
import { Vpn } from "../entities/Vpn";
import { VpnRule } from "../entities/VpnRule";

async function verificar() {
  try {
    await AppDataSource.initialize();
    console.log("✅ Conectado a BD\n");

    const assetRepo = AppDataSource.getRepository(Asset);
    const vpnRepo = AppDataSource.getRepository(Vpn);
    const ruleRepo = AppDataSource.getRepository(VpnRule);

    // 1. Contar VPNs totales
    const totalVpns = await vpnRepo.count();
    console.log(`📊 Total VPNs en BD: ${totalVpns}`);

    // 2. Buscar VPN "test"
    const testAsset = await assetRepo.findOne({
      where: { nombre: "test", tipo: "VPN" } as any,
    });

    if (testAsset) {
      console.log(`\n✅ Asset "test" encontrado: ${testAsset.id}`);

      const testVpn = await vpnRepo.findOne({
        where: { asset: { id: testAsset.id } } as any,
        relations: ["reglas"],
      });

      if (testVpn) {
        console.log(`✅ VPN encontrada: ${testVpn.id}`);
        console.log(`   Conexión: ${testVpn.conexion}`);
        console.log(`   Reglas cargadas: ${testVpn.reglas?.length ?? 0}`);

        // Consulta directa VPN_RULES
        const reglasDirect = await ruleRepo.find({
          where: { vpn: { id: testVpn.id } },
        });
        console.log(`   Reglas en tabla (query directo): ${reglasDirect.length}`);

        if (reglasDirect.length > 0) {
          console.log("\n   📋 Detalles de reglas:");
          reglasDirect.forEach((r, i) => {
            console.log(`      [${i + 1}] conexion="${r.conexion}", fases="${r.fases}", origen="${r.origen}", destino="${r.destino}"`);
          });
        }
      } else {
        console.log(`❌ VPN no encontrada para asset test`);
      }
    } else {
      console.log(`\n❌ Asset "test" NO encontrado en BD`);
    }

    // 3. Contar VPN_RULES totales
    const totalRules = await ruleRepo.count();
    console.log(`\n📊 Total reglas en VPN_RULES: ${totalRules}`);

    // 4. VPNs con reglas
    const vpnsConReglas = await vpnRepo
      .createQueryBuilder("vpn")
      .leftJoinAndSelect("vpn.reglas", "reglas")
      .where("reglas.id IS NOT NULL")
      .getMany();
    console.log(`📊 VPNs que TIENEN reglas: ${new Set(vpnsConReglas.map(v => v.id)).size}`);

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await AppDataSource.destroy();
  }
}

verificar();
