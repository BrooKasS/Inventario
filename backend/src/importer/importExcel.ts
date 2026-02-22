import * as XLSX from "xlsx";
import { prisma } from "../config/database";

const NULL_STRINGS = new Set([
  "n/a", "na", "-", "--", "nan", "none",
  "no asignada", "no asignado",
  "sin placa", "sin datos", "sin dato",
]);

function toStr(val: any): string | null {
  if (val === null || val === undefined) return null;
  if (typeof val === "number" && isNaN(val)) return null;
  if (typeof val === "number" && val === 0) return null;
  const s = String(val).trim().replace(/\xa0/g, "").replace(/\n/g, " | ");
  if (s === "" || NULL_STRINGS.has(s.toLowerCase())) return null;
  return s;
}

function toInt(val: any): number | null {
  if (val === null || val === undefined) return null;
  if (typeof val === "number" && !isNaN(val) && val !== 0) return Math.round(val);
  return null;
}

function fixIp(val: any): string | null {
  if (val === null || val === undefined) return null;
  if (typeof val === "number" && !isNaN(val)) {
    const s = String(Math.round(val));
    const parts = s.match(/^(\d+)(\d{3})(\d{3})(\d{3})$/);
    if (parts) return `${parts[1]}.${parts[2]}.${parts[3]}.${parts[4]}`;
    return toStr(s);
  }
  return toStr(val);
}

/**
 * Convierte valor de Excel a Date para campos DateTime? en Prisma.
 * Si el valor no es una fecha válida (ej: texto largo), retorna null.
 */
function toDate(val: any): Date | null {
  if (val === null || val === undefined) return null;

  // Número serial de Excel
  if (typeof val === "number" && !isNaN(val) && val > 0) {
    const parsed = XLSX.SSF.parse_date_code(val);
    if (!parsed) return null;
    return new Date(Date.UTC(parsed.y, parsed.m - 1, parsed.d));
  }

  // Objeto Date (xlsx lo parsea directamente en algunos casos)
  if (val instanceof Date) {
    return isNaN(val.getTime()) ? null : val;
  }

  // String — solo parsear si parece fecha, no texto largo
  if (typeof val === "string") {
    const trimmed = val.trim();
    if (!trimmed || trimmed.length > 30) return null; // texto largo = no es fecha
    const d = new Date(trimmed);
    return isNaN(d.getTime()) ? null : d;
  }

  return null;
}

function parseSheet(sheet: XLSX.WorkSheet): Record<string, any>[] {
  const rawRows = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: null,
  }) as any[][];

  const HEADER_ROW = 7;
  const headerRow = rawRows[HEADER_ROW] as any[];
  const firstIsNull = headerRow[0] === null || headerRow[0] === undefined;
  const startCol = firstIsNull ? 1 : 0;

  // CRÍTICO: trim() para eliminar espacios en headers del Excel
  const headers = headerRow
    .slice(startCol)
    .map((h: any) => (typeof h === "string" ? h.trim() : null));

  const results: Record<string, any>[] = [];
  for (let i = HEADER_ROW + 1; i < rawRows.length; i++) {
    const row = (rawRows[i] as any[]).slice(startCol);
    const obj: Record<string, any> = {};
    headers.forEach((header: string | null, idx: number) => {
      if (header) obj[header] = row[idx] ?? null;
    });
    results.push(obj);
  }
  return results;
}

interface Resumen {
  creados: number;
  actualizados: number;
  errores: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// SERVIDORES — llave compuesta: codigoServicio + nombre
// FLP0118 tiene dos servidores distintos (SRINFOMPRU y srinfompru2)
// ─────────────────────────────────────────────────────────────────────────────
async function importarServidores(workbook: XLSX.WorkBook, autor: string, resumen: Resumen) {
  const sheet = workbook.Sheets["InventarioServidores"];
  if (!sheet) { console.warn("⚠️  InventarioServidores no encontrada"); return; }

  const rows = parseSheet(sheet);

  for (const row of rows) {
    const nombre         = toStr(row["Nombre del Servidor"]);
    const codigoServicio = toStr(row["Código de Servicio"]);
    if (!nombre && !codigoServicio) continue;

    const datosServidor = {
      monitoreo:          toStr(row["Monitoreo"]),
      backup:             toStr(row["Backup"]),
      ipInterna:          toStr(row["Dirección IP"]),
      ipGestion:          toStr(row["IP de Gestion"]),
      ipServicio:         toStr(row["IP de Servicio"]),
      ambiente:           toStr(row["Ambiente"]),
      tipoServidor:       toStr(row["Tipo de Servidor"]),
      appSoporta:         toStr(row["Aplicación que soporta"]),
      vcpu:               toInt(row["vCPU"]),
      vramMb:             toInt(row["vRAM"]),
      sistemaOperativo:   toStr(row["Sistema Operativo"]),
      fechaFinSoporte:    toDate(row["Fecha Fin Soporte"]),
      rutasBackup:        toStr(row["Rutas de Backup"]),
      contratoQueSoporta: toStr(row["Contrato que lo soporta"]),
    };

    try {
      const existing = await prisma.asset.findFirst({
        where: { tipo: "SERVIDOR", codigoServicio, nombre },
      });

      if (!existing) {
        const asset = await prisma.asset.create({
          data: {
            tipo: "SERVIDOR", nombre, codigoServicio,
            ubicacion:   toStr(row["Ubicación"]),
            propietario: toStr(row["Propietario"]),
            custodio:    toStr(row["Custodio"]),
            servidor: { create: datosServidor },
          },
        });
        const nota = toStr(row["Bitacora"]);
        await prisma.bitacora.create({ data: {
          assetId: asset.id, autor, tipoEvento: "IMPORTACION",
          descripcion: nota ? `Importado desde Excel. Nota: ${nota}` : "Importado desde Excel.",
        }});
        resumen.creados++;
      } else {
        await prisma.servidor.upsert({
          where:  { assetId: existing.id },
          update: datosServidor,
          create: { assetId: existing.id, ...datosServidor },
        });
        await prisma.asset.update({
          where: { id: existing.id },
          data: {
            nombre:      nombre ?? existing.nombre,
            ubicacion:   toStr(row["Ubicación"]),
            propietario: toStr(row["Propietario"]),
            custodio:    toStr(row["Custodio"]),
          },
        });
        await prisma.bitacora.create({ data: {
          assetId: existing.id, autor, tipoEvento: "IMPORTACION",
          descripcion: "Registro actualizado desde Excel.",
        }});
        resumen.actualizados++;
      }
    } catch (e: any) {
      console.error(`  ❌ Servidor "${nombre ?? codigoServicio}": ${e.message}`);
      resumen.errores++;
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// REDES — llave compuesta: nombre + serial
// sw_cartagena aparece 2 veces con diferente serial
// ─────────────────────────────────────────────────────────────────────────────
async function importarRedes(workbook: XLSX.WorkBook, autor: string, resumen: Resumen) {
  const sheet = workbook.Sheets["InventarioRedes"];
  if (!sheet) { console.warn("⚠️  InventarioRedes no encontrada"); return; }

  const rows = parseSheet(sheet);

  for (const row of rows) {
    const nombre = toStr(row["Nombre del Equipo"]);
    if (!nombre) continue;

    const serial = toStr(row["Serial"]);

    const datosRed = {
      serial,
      mac:                toStr(row["Mac"]),
      modelo:             toStr(row["Modelo"]),
      fechaFinSoporte:    toDate(row["Fecha Fin de soporte"]),
      ipGestion:          fixIp(row["IP de Gestion"]),
      estado:             toStr(row["Estado"]),
      contratoQueSoporta: toStr(row["Contrato que lo soporta"]),
    };

    try {
      const existing = await prisma.asset.findFirst({
        where: {
          tipo: "RED",
          nombre,
          red: { serial: serial ?? undefined },
        },
      });

      if (!existing) {
        const asset = await prisma.asset.create({
          data: {
            tipo: "RED", nombre,
            codigoServicio: toStr(row["Código de Servicio"]),
            ubicacion:      toStr(row["Ubicación"]),
            propietario:    toStr(row["Propietario"]),
            custodio:       toStr(row["Custodio"]),
            red: { create: datosRed },
          },
        });
        const nota = toStr(row["Bitacora"]);
        await prisma.bitacora.create({ data: {
          assetId: asset.id, autor, tipoEvento: "IMPORTACION",
          descripcion: nota ? `Importado desde Excel. Nota: ${nota}` : "Importado desde Excel.",
        }});
        resumen.creados++;
      } else {
        await prisma.red.upsert({
          where:  { assetId: existing.id },
          update: datosRed,
          create: { assetId: existing.id, ...datosRed },
        });
        await prisma.asset.update({
          where: { id: existing.id },
          data: {
            codigoServicio: toStr(row["Código de Servicio"]),
            ubicacion:      toStr(row["Ubicación"]),
            propietario:    toStr(row["Propietario"]),
            custodio:       toStr(row["Custodio"]),
          },
        });
        await prisma.bitacora.create({ data: {
          assetId: existing.id, autor, tipoEvento: "IMPORTACION",
          descripcion: "Registro actualizado desde Excel.",
        }});
        resumen.actualizados++;
      }
    } catch (e: any) {
      console.error(`  ❌ Red "${nombre}": ${e.message}`);
      resumen.errores++;
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// UPS — llave: serial (sin duplicados en el Excel)
// ─────────────────────────────────────────────────────────────────────────────
async function importarUps(workbook: XLSX.WorkBook, autor: string, resumen: Resumen) {
  const sheet = workbook.Sheets["InventarioUPS"];
  if (!sheet) { console.warn("⚠️  InventarioUPS no encontrada"); return; }

  const rows = parseSheet(sheet);

  for (const row of rows) {
    const serial = toStr(row["Serial"]);
    if (!serial) continue;

    const nombre = toStr(row["Nombre del Equipo"]);

    const datosUps = {
      serial,
      placa:  toStr(row["Placa"]),
      modelo: toStr(row["Modelo"]),
      estado: toStr(row["Estado"]),
    };

    try {
      const existing = await prisma.asset.findFirst({
        where: { tipo: "UPS", ups: { serial } },
      });

      if (!existing) {
        const asset = await prisma.asset.create({
          data: {
            tipo: "UPS", nombre,
            ubicacion:   toStr(row["Ubicación"]),
            propietario: toStr(row["Propietario"]),
            custodio:    toStr(row["Custodio"]),
            ups: { create: datosUps },
          },
        });
        const nota = toStr(row["Bitacora"]);
        await prisma.bitacora.create({ data: {
          assetId: asset.id, autor, tipoEvento: "IMPORTACION",
          descripcion: nota ? `Importado desde Excel. Nota: ${nota}` : "Importado desde Excel.",
        }});
        resumen.creados++;
      } else {
        await prisma.ups.upsert({
          where:  { assetId: existing.id },
          update: datosUps,
          create: { assetId: existing.id, ...datosUps },
        });
        await prisma.asset.update({
          where: { id: existing.id },
          data: {
            nombre,
            ubicacion:   toStr(row["Ubicación"]),
            propietario: toStr(row["Propietario"]),
            custodio:    toStr(row["Custodio"]),
          },
        });
        await prisma.bitacora.create({ data: {
          assetId: existing.id, autor, tipoEvento: "IMPORTACION",
          descripcion: "Registro actualizado desde Excel.",
        }});
        resumen.actualizados++;
      }
    } catch (e: any) {
      console.error(`  ❌ UPS "${serial}": ${e.message}`);
      resumen.errores++;
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// BASES DE DATOS — llave compuesta: nombre + servidor1
// OLIMPO aparece 2 veces con distinto servidor1 (ISRALE vs OLIMPO)
// ─────────────────────────────────────────────────────────────────────────────
async function importarBD(workbook: XLSX.WorkBook, autor: string, resumen: Resumen) {
  const sheet = workbook.Sheets["InventarioBD"];
  if (!sheet) { console.warn("⚠️  InventarioBD no encontrada"); return; }

  const rows = parseSheet(sheet);

  for (const row of rows) {
    const nombre = toStr(row["Nombre del Base de Datos"]);
    if (!nombre) continue;

    const servidor1 = toStr(row["Servidor 1"]);

    const datosBD = {
      servidor1,
      servidor2:          toStr(row["Servidor 2"]),
      racScan:            toStr(row["Rac-Scan"]),
      ambiente:           toStr(row["Ambiente"]),
      appSoporta:         toStr(row["Aplicación que soporta"]),
      versionBd:          toStr(row["Version de BD"]),
      fechaFinalSoporte:  toDate(row["Fecha Final de soporte"]),
      contenedorFisico:   toStr(row["Contenedor Fisico"]),
      contratoQueSoporta: toStr(row["Contrato que lo soporta"]),
    };

    try {
      const existing = await prisma.asset.findFirst({
        where: {
          tipo: "BASE_DATOS",
          nombre,
          baseDatos: { servidor1: servidor1 ?? undefined },
        },
      });

      if (!existing) {
        const asset = await prisma.asset.create({
          data: {
            tipo:        "BASE_DATOS",
            nombre,
            propietario: toStr(row["Propietario"]),
            custodio:    toStr(row["Custodio"]),
            baseDatos: { create: datosBD },
          },
        });
        await prisma.bitacora.create({ data: {
          assetId: asset.id, autor, tipoEvento: "IMPORTACION",
          descripcion: "Importado desde Excel.",
        }});
        resumen.creados++;
      } else {
        await prisma.baseDatos.upsert({
          where:  { assetId: existing.id },
          update: datosBD,
          create: { assetId: existing.id, ...datosBD },
        });
        await prisma.asset.update({
          where: { id: existing.id },
          data: {
            propietario: toStr(row["Propietario"]),
            custodio:    toStr(row["Custodio"]),
          },
        });
        await prisma.bitacora.create({ data: {
          assetId: existing.id, autor, tipoEvento: "IMPORTACION",
          descripcion: "Registro actualizado desde Excel.",
        }});
        resumen.actualizados++;
      }
    } catch (e: any) {
      console.error(`  ❌ BD "${nombre}": ${e.message}`);
      resumen.errores++;
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTACIÓN PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────
export async function importExcel(
  path: string,
  autor: string = "Sistema"
): Promise<Resumen> {
  console.log(`\nImportando: ${path}`);
  console.log(`Autor: ${autor}\n`);

  const workbook = XLSX.readFile(path);
  const resumen: Resumen = { creados: 0, actualizados: 0, errores: 0 };

  console.log("📂 InventarioServidores...");
  await importarServidores(workbook, autor, resumen);

  console.log("📂 InventarioRedes...");
  await importarRedes(workbook, autor, resumen);

  console.log("📂 InventarioUPS...");
  await importarUps(workbook, autor, resumen);

  console.log("📂 InventarioBD...");
  await importarBD(workbook, autor, resumen);

  console.log("\n─────────────────────────────────");
  console.log(`✅ Creados:      ${resumen.creados}`);
  console.log(`🔄 Actualizados: ${resumen.actualizados}`);
  console.log(`❌ Errores:      ${resumen.errores}`);
  console.log("─────────────────────────────────");

  return resumen;
}
