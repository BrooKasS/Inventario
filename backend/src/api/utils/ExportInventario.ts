/**
 * ExportInventario.ts — v4
 * + Hojas InventarioVPN e InventarioMovil
 * Ubicación: backend/src/api/utils/ExportInventario.ts
 */
import * as fs   from "fs";
import * as path from "path";
import { execSync } from "child_process";

const TEMPLATE_PATH = path.join(__dirname, "template_inventario.xlsx");

interface AssetData {
  tipo:           string;
  nombre:         string | null;
  propietario:    string | null;
  custodio:       string | null;
  codigoServicio: string | null;
  ubicacion:      string | null;
  servidor?:      any;
  red?:           any;
  ups?:           any;
  baseDatos?:     any;
  vpn?:           any;
  movil?:         any;
}

function v(val: any): string {
  if (val === null || val === undefined) return "";
  return String(val);
}

export async function generarExcelInventario(assets: AssetData[]): Promise<Buffer> {
  if (!fs.existsSync(TEMPLATE_PATH)) {
    throw new Error(`Template no encontrado en: ${TEMPLATE_PATH}`);
  }

  const servidores = assets.filter(a => a.tipo === "SERVIDOR");
  const redes      = assets.filter(a => a.tipo === "RED");
  const ups        = assets.filter(a => a.tipo === "UPS");
  const bds        = assets.filter(a => a.tipo === "BASE_DATOS");
  const vpns       = assets.filter(a => a.tipo === "VPN");
  const moviles    = assets.filter(a => a.tipo === "MOVIL");

  const payload = {
    template: TEMPLATE_PATH,

    servidores: servidores.map(a => ({
      nombre:             v(a.nombre),
      propietario:        v(a.propietario),
      custodio:           v(a.custodio),
      monitoreo:          v(a.servidor?.monitoreo),
      backup:             v(a.servidor?.backup),
      ipInterna:          v(a.servidor?.ipInterna),
      ipGestion:          v(a.servidor?.ipGestion),
      ipServicio:         v(a.servidor?.ipServicio),
      ambiente:           v(a.servidor?.ambiente),
      tipoServidor:       v(a.servidor?.tipoServidor),
      appSoporta:         v(a.servidor?.appSoporta),
      ubicacion:          v(a.ubicacion),
      vcpu:               v(a.servidor?.vcpu),
      vramMb:             v(a.servidor?.vramMb),
      sistemaOperativo:   v(a.servidor?.sistemaOperativo),
      fechaFinSoporte:    v(a.servidor?.fechaFinSoporte),
      rutasBackup:        v(a.servidor?.rutasBackup),
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

    vpns: vpns.map(a => ({
      nombre:   v(a.nombre),
      conexion: v(a.vpn?.conexion),
      fases:    v(a.vpn?.fases),
      origen:   v(a.vpn?.origen),
      destino:  v(a.vpn?.destino),
    })),

    moviles: moviles.map(a => ({
      nombre:                  v(a.nombre),
      numeroCaso:              v(a.movil?.numeroCaso),
      region:                  v(a.movil?.region),
      dependencia:             v(a.movil?.dependencia),
      sede:                    v(a.movil?.sede),
      cedula:                  v(a.movil?.cedula),
      usuarioRed:              v(a.movil?.usuarioRed),
      correoResponsable:       v(a.movil?.correoResponsable),
      uni:                     v(a.movil?.uni),
      marca:                   v(a.movil?.marca),
      modelo:                  v(a.movil?.modelo),
      serial:                  v(a.movil?.serial),
      imei1:                   v(a.movil?.imei1),
      imei2:                   v(a.movil?.imei2),
      sim:                     v(a.movil?.sim),
      numeroLinea:             v(a.movil?.numeroLinea),
      fechaEntrega:            v(a.movil?.fechaEntrega),
      observacionesEntrega:    v(a.movil?.observacionesEntrega),
      fechaDevolucion:         v(a.movil?.fechaDevolucion),
      observacionesDevolucion: v(a.movil?.observacionesDevolucion),
    })),
  };

  const payloadPath = path.join(__dirname, `export_payload_${Date.now()}.json`);
  const outputPath  = path.join(__dirname, `export_out_${Date.now()}.xlsx`);

  try {
    fs.writeFileSync(payloadPath, JSON.stringify(payload));
    const scriptPath = path.join(__dirname, "exportInventario.py");
    const pythonCmd  = process.platform === "win32" ? "python" : "python3";
    execSync(`"${pythonCmd}" "${scriptPath}" "${payloadPath}" "${outputPath}"`, {
      timeout: 120000,
      stdio: "pipe",
      windowsHide: true,
    });
    return fs.readFileSync(outputPath);
  } finally {
    if (fs.existsSync(payloadPath)) fs.unlinkSync(payloadPath);
    if (fs.existsSync(outputPath))  fs.unlinkSync(outputPath);
  }
}