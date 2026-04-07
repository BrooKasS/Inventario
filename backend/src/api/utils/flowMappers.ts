// src/utils/flowMappers.ts
type AnyObj = Record<string, any>;

// Convierte números y fechas a los formatos que el conector maneja bien
const toISODate = (d?: any) =>
  d ? new Date(d).toISOString().slice(0, 10) : undefined;

// Convierte MB -> "X GB"
const toGB = (mb?: number) =>
  typeof mb === "number" && !Number.isNaN(mb)
    ? `${Math.round(mb / 1024)} GB`
    : undefined;

/**
 * ✅ Inyecta siempre el flag Eliminado
 * Power Automate y Office Script lo reciben dentro del objeto
 */
function withEliminado(asset: AnyObj, payload: AnyObj) {
  return {
    ...payload,
    Eliminado: asset.deletedAt != null,
  };
}

/** Normaliza el 'tipo' de tu DB al 'tipo' de Power Automate (Switch) */
export function toFlowTipo(
  dbTipoOrFlowTipo: string
): "TServidores" | "TRedes" | "TUPS" | "TBD" {
  const v = (dbTipoOrFlowTipo || "").toUpperCase();

  if (v === "SERVIDOR") return "TServidores";
  if (v === "RED") return "TRedes";
  if (v === "UPS") return "TUPS";
  if (v === "BASE_DATOS" || v === "BASE-DATOS" || v === "BASEDATOS") return "TBD";

  // Si ya viene con el nombre de tabla, respeta
  if (["TSERVIDORES", "TREDES", "TUPS", "TBD"].includes(v))
    return dbTipoOrFlowTipo as any;

  throw new Error(`Tipo no reconocido para Flow: ${dbTipoOrFlowTipo}`);
}

/** SERVIDOR → TServidores */
export function mapServidorToFlow(a: AnyObj) {
  const s = a.servidor ?? {};

  return withEliminado(a, {
    id: a.id,
    nombre: a.nombre,
    propietario: a.propietario,
    custodio: a.custodio,
    monitoreo: s.monitoreo,
    backup: s.backup,
    ip: s.ip ?? s.ipInterna,
    ipGestion: s.ipGestion,
    ipBackup: s.ipBackup,
    ipServicio: s.ipServicio,
    ambiente: s.ambiente,
    tipoServidor: s.tipoServidor,
    aplicacion: s.aplicacion ?? a.aplicacion,
    ubicacion: a.ubicacion,
    responsable: a.responsable,
    vcpu: s.vcpu != null ? String(s.vcpu) : undefined,
    vram: s.vram ?? toGB(s.vramMb),
    sistemaOperativo: s.sistemaOperativo,
    fechaFinSoporte: toISODate(s.fechaFinSoporte),
    rutasBackup: s.rutasBackup,
    contratoAsociado: a.contratoAsociado,
    bitacora: "",
  });
}

/** RED → TRedes */
export function mapRedToFlow(a: AnyObj) {
  const r = a.red ?? {};

  return withEliminado(a, {
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
  });
}

/** UPS → TUPS */
export function mapUpsToFlow(a: AnyObj) {
  const u = a.ups ?? {};

  return withEliminado(a, {
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
  });
}

/** BASE_DATOS → TBD */
export function mapBDToFlow(a: AnyObj) {
  const b = a.baseDatos ?? {};

  return withEliminado(a, {
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
  });
}

/** Mapea assets al payload { tipo, assets } */
export function mapAssetsToFlowPayload(
  dbTipoOrFlowTipo: string,
  assets: AnyObj[]
) {
  const flowTipo = toFlowTipo(dbTipoOrFlowTipo);

  let mapped: AnyObj[];

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

  return {
    tipo: flowTipo,
    assets: mapped,
  };
}