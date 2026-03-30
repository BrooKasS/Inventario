"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.generarExcelInventario = generarExcelInventario;
/**
 * exportInventario.ts
 * Genera el Excel de inventario con el formato exacto del template FR-GTE-02-049
 * Estrategia: copia el template y escribe los datos desde fila 11
 *
 * Ubicación: backend/src/utils/exportInventario.ts
 */
console.log("EXPORT INVENTARIO EJECUTANDO");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const child_process_1 = require("child_process");
// Ruta al template — copiado en backend/src/utils/template_inventario.xlsx
const TEMPLATE_PATH = path.join(__dirname, "template_inventario.xlsx");
console.log("EXPORT INVENTARIO EJECUTANDO");
function v(val) {
    if (val === null || val === undefined)
        return "";
    return String(val);
}
function mbToGb(mb) {
    if (!mb)
        return "";
    return `${Math.round(mb / 1024)} GB`;
}
/**
 * Genera el Excel de inventario usando Python + openpyxl
 * Retorna el buffer del archivo generado
 */
async function generarExcelInventario(assets) {
    if (!fs.existsSync(TEMPLATE_PATH)) {
        throw new Error(`Template no encontrado en: ${TEMPLATE_PATH}. Copia el archivo FR-GTE-02-049 ahí.`);
    }
    // Separar por tipo
    const servidores = assets.filter(a => a.tipo === "SERVIDOR");
    const redes = assets.filter(a => a.tipo === "RED");
    const ups = assets.filter(a => a.tipo === "UPS");
    const bds = assets.filter(a => a.tipo === "BASE_DATOS");
    // Construir payload JSON para el script Python
    const payload = {
        template: TEMPLATE_PATH,
        servidores: servidores.map(a => ({
            nombre: v(a.nombre),
            propietario: v(a.propietario),
            custodio: v(a.custodio),
            monitoreo: v(a.servidor?.monitoreo),
            backup: v(a.servidor?.backup),
            ipInterna: v(a.servidor?.ipInterna),
            ipGestion: v(a.servidor?.ipGestion),
            ipServicio: v(a.servidor?.ipServicio),
            ambiente: v(a.servidor?.ambiente),
            tipoServidor: v(a.servidor?.tipoServidor),
            appSoporta: v(a.servidor?.appSoporta),
            ubicacion: v(a.ubicacion),
            vcpu: v(a.servidor?.vcpu),
            vramMb: mbToGb(a.servidor?.vramMb),
            sistemaOperativo: v(a.servidor?.sistemaOperativo),
            fechaFinSoporte: v(a.servidor?.fechaFinSoporte),
            rutasBackup: v(a.servidor?.rutasBackup),
            contratoQueSoporta: v(a.servidor?.contratoQueSoporta),
        })),
        redes: redes.map(a => ({
            nombre: v(a.nombre),
            propietario: v(a.propietario),
            custodio: v(a.custodio),
            serial: v(a.red?.serial),
            mac: v(a.red?.mac),
            modelo: v(a.red?.modelo),
            fechaFinSoporte: v(a.red?.fechaFinSoporte),
            ipGestion: v(a.red?.ipGestion),
            estado: v(a.red?.estado),
            codigoServicio: v(a.codigoServicio),
            ubicacion: v(a.ubicacion),
            contratoQueSoporta: v(a.red?.contratoQueSoporta),
        })),
        ups: ups.map(a => ({
            nombre: v(a.nombre),
            propietario: v(a.propietario),
            custodio: v(a.custodio),
            serial: v(a.ups?.serial),
            placa: v(a.ups?.placa),
            modelo: v(a.ups?.modelo),
            estado: v(a.ups?.estado),
            ubicacion: v(a.ubicacion),
        })),
        bds: bds.map(a => ({
            nombre: v(a.nombre),
            propietario: v(a.propietario),
            custodio: v(a.custodio),
            servidor1: v(a.baseDatos?.servidor1),
            servidor2: v(a.baseDatos?.servidor2),
            racScan: v(a.baseDatos?.racScan),
            ambiente: v(a.baseDatos?.ambiente),
            appSoporta: v(a.baseDatos?.appSoporta),
            versionBd: v(a.baseDatos?.versionBd),
            fechaFinalSoporte: v(a.baseDatos?.fechaFinalSoporte),
            contenedorFisico: v(a.baseDatos?.contenedorFisico),
            contratoQueSoporta: v(a.baseDatos?.contratoQueSoporta),
        })),
    };
    const payloadPath = path.join(__dirname, `export_payload_${Date.now()}.json`);
    const outputPath = path.join(__dirname, `export_out_${Date.now()}.xlsx`);
    try {
        fs.writeFileSync(payloadPath, JSON.stringify(payload));
        const scriptPath = path.join(__dirname, "exportInventario.py");
        (0, child_process_1.execSync)(`python3 "${scriptPath}" "${payloadPath}" "${outputPath}"`, {
            timeout: 30000,
            stdio: "pipe",
        });
        const buffer = fs.readFileSync(outputPath);
        return buffer;
    }
    finally {
        if (fs.existsSync(payloadPath))
            fs.unlinkSync(payloadPath);
        if (fs.existsSync(outputPath))
            fs.unlinkSync(outputPath);
    }
}
