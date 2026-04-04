/**
 * exportInventario.ts
 * Genera el Excel de inventario con el formato exacto del template FR-GTE-02-049
 * Estrategia: copia el template y escribe los datos desde fila 11
 *
 * Ubicación: backend/src/utils/exportInventario.ts
 */
console.log("EXPORT INVENTARIO EJECUTANDO");
import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

// Ruta al template — copiado en backend/src/utils/template_inventario.xlsx
const TEMPLATE_PATH = path.join(__dirname, "template_inventario.xlsx");
console.log("EXPORT INVENTARIO EJECUTANDO");
interface AssetData {
  tipo: string;
  nombre: string | null;
  propietario: string | null;
  custodio: string | null;
  codigoServicio: string | null;
  ubicacion: string | null;
  servidor?: any;
  red?: any;
  ups?: any;
  baseDatos?: any;
}

function v(val: any): string {
  if (val === null || val === undefined) return "";
  return String(val);
}

function mbToGb(mb: number | null): string {
  if (!mb) return "";
  return `${Math.round(mb / 1024)} GB`;
}

/**
 * Genera el Excel de inventario usando Python + openpyxl
 * Retorna el buffer del archivo generado
 */
export async function generarExcelInventario(assets: AssetData[]): Promise<Buffer> {
  if (!fs.existsSync(TEMPLATE_PATH)) {
    throw new Error(`Template no encontrado en: ${TEMPLATE_PATH}. Copia el archivo FR-GTE-02-049 ahí.`);
  }

  // Separar por tipo
  const servidores = assets.filter(a => a.tipo === "SERVIDOR");
  const redes      = assets.filter(a => a.tipo === "RED");
  const ups        = assets.filter(a => a.tipo === "UPS");
  const bds        = assets.filter(a => a.tipo === "BASE_DATOS");

  // Construir payload JSON para el script Python
  const payload = {
    template: TEMPLATE_PATH,
    servidores: servidores.map(a => ({
      nombre:          v(a.nombre),
      propietario:     v(a.propietario),
      custodio:        v(a.custodio),
      monitoreo:       v(a.servidor?.monitoreo),
      backup:          v(a.servidor?.backup),
      ipInterna:       v(a.servidor?.ipInterna),
      ipGestion:       v(a.servidor?.ipGestion),
      ipServicio:      v(a.servidor?.ipServicio),
      ambiente:        v(a.servidor?.ambiente),
      tipoServidor:    v(a.servidor?.tipoServidor),
      appSoporta:      v(a.servidor?.appSoporta),
      ubicacion:       v(a.ubicacion),
      vcpu:            v(a.servidor?.vcpu),
      vramMb:          v(a.servidor?.vramMb),
      sistemaOperativo: v(a.servidor?.sistemaOperativo),
      fechaFinSoporte: v(a.servidor?.fechaFinSoporte),
      rutasBackup:     v(a.servidor?.rutasBackup),
      contratoQueSoporta: v(a.servidor?.contratoQueSoporta),
    })),
    redes: redes.map(a => ({
      nombre:             v(a.nombre),
      propietario:        v(a.propietario),
      custodio:           v(a.custodio),
      serial:             v(a.red?.serial),
      mac:                v(a.red?.mac),
      modelo:             v(a.red?.modelo),
      fechaFinSoporte:    v(a.red?.fechaFinSoporte),
      ipGestion:          v(a.red?.ipGestion),
      estado:             v(a.red?.estado),
      codigoServicio:     v(a.codigoServicio),
      ubicacion:          v(a.ubicacion),
      contratoQueSoporta: v(a.red?.contratoQueSoporta),
    })),
    ups: ups.map(a => ({
      nombre:      v(a.nombre),
      propietario: v(a.propietario),
      custodio:    v(a.custodio),
      serial:      v(a.ups?.serial),
      placa:       v(a.ups?.placa),
      modelo:      v(a.ups?.modelo),
      estado:      v(a.ups?.estado),
      ubicacion:   v(a.ubicacion),
    })),
    bds: bds.map(a => ({
      nombre:             v(a.nombre),
      propietario:        v(a.propietario),
      custodio:           v(a.custodio),
      servidor1:          v(a.baseDatos?.servidor1),
      servidor2:          v(a.baseDatos?.servidor2),
      racScan:            v(a.baseDatos?.racScan),
      ambiente:           v(a.baseDatos?.ambiente),
      appSoporta:         v(a.baseDatos?.appSoporta),
      versionBd:          v(a.baseDatos?.versionBd),
      fechaFinalSoporte:  v(a.baseDatos?.fechaFinalSoporte),
      contenedorFisico:   v(a.baseDatos?.contenedorFisico),
      contratoQueSoporta: v(a.baseDatos?.contratoQueSoporta),
    })),
  };

  const payloadPath = path.join(__dirname, `export_payload_${Date.now()}.json`);
  const outputPath  = path.join(__dirname, `export_out_${Date.now()}.xlsx`);

  try {
    fs.writeFileSync(payloadPath, JSON.stringify(payload));

    const scriptPath = path.join(__dirname, "exportInventario.py");
    execSync(`python3 "${scriptPath}" "${payloadPath}" "${outputPath}"`, {
      timeout: 30999000,
      stdio: "pipe",
    });

    const buffer = fs.readFileSync(outputPath);
    return buffer;
  } finally {
    if (fs.existsSync(payloadPath)) fs.unlinkSync(payloadPath);
    if (fs.existsSync(outputPath))  fs.unlinkSync(outputPath);
  }
}