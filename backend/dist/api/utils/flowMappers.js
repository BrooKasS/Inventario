"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toFlowTipo = toFlowTipo;
exports.mapServidorToFlow = mapServidorToFlow;
exports.mapRedToFlow = mapRedToFlow;
exports.mapUpsToFlow = mapUpsToFlow;
exports.mapBDToFlow = mapBDToFlow;
exports.mapAssetsToFlowPayload = mapAssetsToFlowPayload;
// Convierte números y fechas a los formatos que el conector maneja bien
const toISODate = (d) => d ? new Date(d).toISOString().slice(0, 10) : undefined;
// Convierte MB -> "X GB"
const toGB = (mb) => typeof mb === "number" && !Number.isNaN(mb) ? `${Math.round(mb / 1024)} GB` : undefined;
/** Normaliza el 'tipo' de tu DB al 'tipo' de Power Automate (Switch) */
function toFlowTipo(dbTipoOrFlowTipo) {
    const v = (dbTipoOrFlowTipo || "").toUpperCase();
    if (v === "SERVIDOR")
        return "TServidores";
    if (v === "RED")
        return "TRedes";
    if (v === "UPS")
        return "TUPS";
    if (v === "BASE_DATOS" || v === "BASE-DATOS" || v === "BASEDATOS")
        return "TBD";
    // Si ya viene con el nombre de tabla, respeta
    if (["TSERVIDORES", "TREDES", "TUPS", "TBD"].includes(v))
        return dbTipoOrFlowTipo;
    // Por defecto (mejor fallar explícito)
    throw new Error(`Tipo no reconocido para Flow: ${dbTipoOrFlowTipo}`);
}
/** Mapea un asset tipo SERVIDOR → registro para TServidores */
function mapServidorToFlow(a) {
    const s = a.servidor ?? {};
    return {
        id: a.id,
        nombre: a.nombre,
        propietario: a.propietario,
        custodio: a.custodio,
        monitoreo: s.monitoreo,
        backup: s.backup, // En Excel existe "Backup"
        ip: s.ip ?? s.ipInterna, // tolera 'ip' o 'ipInterna'
        ipGestion: s.ipGestion,
        ipBackup: s.ipBackup,
        ipServicio: s.ipServicio,
        ambiente: s.ambiente,
        tipoServidor: s.tipoServidor,
        aplicacion: s.aplicacion ?? a.aplicacion, // tolera campo arriba
        ubicacion: a.ubicacion,
        responsable: a.responsable,
        vcpu: s.vcpu != null ? String(s.vcpu) : undefined,
        vram: s.vram ?? toGB(s.vramMb),
        sistemaOperativo: s.sistemaOperativo,
        fechaFinSoporte: toISODate(s.fechaFinSoporte),
        rutasBackup: s.rutasBackup,
        contratoAsociado: a.contratoAsociado,
        bitacora: "", // lo puedes poblar si quieres
    };
}
/** Mapea un asset tipo RED → registro para TRedes */
function mapRedToFlow(a) {
    const r = a.red ?? {};
    return {
        id: a.id,
        nombre: a.nombre,
        propietario: a.propietario,
        custodio: a.custodio,
        serial: r.serial,
        mac: r.mac,
        modelo: r.modelo,
        fechaFinSoporte: toISODate(r.fechaFinSoporte),
        ipGestion: r.ipGestion,
        estado: r.estado,
        codigoServicio: a.codigoServicio,
        ubicacion: a.ubicacion,
        contratoAsociado: a.contratoAsociado,
        bitacora: "",
    };
}
/** Mapea un asset tipo UPS → registro para TUPS */
function mapUpsToFlow(a) {
    const u = a.ups ?? {};
    return {
        id: a.id,
        nombre: a.nombre,
        propietario: a.propietario,
        custodio: a.custodio,
        serial: u.serial,
        placa: u.placa,
        modelo: u.modelo,
        estado: u.estado,
        ubicacion: a.ubicacion,
        responsable: a.responsable,
        bitacora: "",
    };
}
/** Mapea un asset tipo BASE_DATOS → registro para TBD */
function mapBDToFlow(a) {
    const b = a.baseDatos ?? {};
    return {
        id: a.id,
        nombre: a.nombre,
        propietario: a.propietario,
        custodio: a.custodio,
        servidor1: b.servidor1,
        servidor2: b.servidor2,
        racScan: b.racScan,
        ambiente: b.ambiente,
        aplicacion: b.appSoporta ?? b.aplicacion,
        versionBD: b.versionBd ?? b.versionBD,
        contenedorFisico: b.contenedorFisico,
        bitacora: "",
    };
}
/** Mapea un array de assets del tipo indicado al payload { tipo, assets } */
function mapAssetsToFlowPayload(dbTipoOrFlowTipo, assets) {
    const flowTipo = toFlowTipo(dbTipoOrFlowTipo);
    let mapped;
    switch (flowTipo) {
        case "TServidores":
            mapped = assets.map(mapServidorToFlow);
            break;
        case "TRedes":
            mapped = assets.map(mapRedToFlow);
            break;
        case "TUPS":
            mapped = assets.map(mapUpsToFlow);
            break;
        case "TBD":
            mapped = assets.map(mapBDToFlow);
            break;
        default:
            throw new Error(`Tipo de Flow no soportado: ${flowTipo}`);
    }
    return { tipo: flowTipo, assets: mapped };
}
