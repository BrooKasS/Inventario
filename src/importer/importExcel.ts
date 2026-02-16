import * as XLSX from "xlsx";
import { prisma } from "../prisma";

// ─────────────────────────────────────────────────────────────────────────────
// CONTEXTO TÉCNICO CRÍTICO
//
// Este Excel tiene hojas con dimensiones diferentes:
//   InventarioServidores: A1:S145  → xlsx incluye columna A (null) → rawRows[7][0] = null
//   InventarioRedes:      B1:K107  → xlsx NO incluye columna A → rawRows[7][0] = header
//   InventarioUPS:        B1:I80   → xlsx NO incluye columna A → rawRows[7][0] = header
//   InventarioBD:         B1:J48   → xlsx NO incluye columna A → rawRows[7][0] = header
//
// El parser detecta esto automáticamente:
//   Si rawRows[7][0] es null/undefined → la hoja incluye col A → skipear col 0
//   Si rawRows[7][0] es un string (header real) → la hoja empieza en col B → NO skipear
//
// Headers reales verificados celda a celda (con espacios exactos del Excel):
//   Servidores: 'Código de Servicio ' (espacio al final), ' IP de Servicio' (espacio al inicio)
//   Redes:      'Código de Servicio ' (espacio al final)
//   → Se normalizan con .trim() en el parser
//
// Valores que representan ausencia de dato verificados en el Excel:
//   'N/A'         → UPS.NombreEquipo (26/39), BD.Servidor2 (varios)
//   '-'           → Redes.IpGestion (SW4_Davivienda)
//   'No asignada' → Servidores.DireccionIP (worker2)
//   'No asignado' → Servidores.Ambiente (algunos)
//   'Sin Placa'   → UPS.Placa (varios)
//
// Números en campos de texto verificados:
//   UPS.Placa:        21215, 27346, 27347, 27345, 27348, 17162, 17163, 21214 → string
//   UPS.Serial:       11244 → string "11244"
//   Redes.IpGestion:  192168120113, 192168120126 → "192.168.x.x"
//
// ─────────────────────────────────────────────────────────────────────────────
// ESTRATEGIA DE UNIQUE KEYS (Análisis exhaustivo del Excel)
//
// SERVIDORES:
//   - Único por: NOMBRE + CÓDIGO (136 combinaciones únicas de 136 registros)
//   - Casos edge: 2 servidores sin nombre usan solo código
//   - Duplicado resuelto: 'FLP0118' usado por SRINFOMPRU y srinfompru2 (diferentes)
//
// REDES:
//   - Único por: NOMBRE + SERIAL (99 combinaciones únicas de 99 registros)
//   - Serial es identificador físico único del hardware
//   - Duplicado resuelto: 'sw_cartagena' son 2 switches con serial diferente
//
// UPS:
//   - Único por: SERIAL (39 únicos de 39 registros) ✅ YA CORRECTO
//   - Muchos UPS sin nombre, serial es único identificador confiable
//
// BASE_DATOS:
//   - Único por: NOMBRE + SERVIDOR1 (37 combinaciones únicas de 37 registros)
//   - Servidor1 siempre tiene valor, indica dónde está instalada
//   - Duplicado resuelto: 'OLIMPO' son 2 BDs (RAC en ISRALE vs standalone en OLIMPO)
// ─────────────────────────────────────────────────────────────────────────────

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

// IPs guardadas como entero largo: 192168120113 → "192.168.120.113"
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

// ─────────────────────────────────────────────────────────────────────────────
// PARSER — detecta automáticamente si la hoja incluye columna A o empieza en B
// ─────────────────────────────────────────────────────────────────────────────

function parseSheet(sheet: XLSX.WorkSheet): Record<string, any>[] {
  const rawRows = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: null,
  }) as any[][];

  const HEADER_ROW = 7;
  const headerRow = rawRows[HEADER_ROW] as any[];

  // Si el primer elemento es null/undefined, la hoja incluye col A (vacía) → skipear
  // Si el primer elemento es un string, la hoja empieza en col B → NO skipear
  const firstIsNull = headerRow[0] === null || headerRow[0] === undefined;
  const startCol = firstIsNull ? 1 : 0;

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
// SERVIDORES
// Unique Key: NOMBRE + CÓDIGO DE SERVICIO
// Conteo esperado: 136 registros (todos únicos por combinación)
// ─────────────────────────────────────────────────────────────────────────────

async function importarServidores(workbook: XLSX.WorkBook, autor: string, resumen: Resumen) {
  const sheet = workbook.Sheets["InventarioServidores"];
  if (!sheet) { console.warn("⚠️  InventarioServidores no encontrada"); return; }

  const rows = parseSheet(sheet);

  for (const row of rows) {
    const nombre         = toStr(row["Nombre del Servidor"]);
    const codigoServicio = toStr(row["Código de Servicio"]);
    
    // Validación: debe tener al menos uno de los dos
    if (!nombre && !codigoServicio) continue;

    const datosServidor = {
      monitoreo:        toStr(row["Monitoreo"]),
      backup:           toStr(row["Backup"]),
      ipInterna:        toStr(row["Dirección IP"]),
      ipGestion:        toStr(row["IP de Gestion"]),
      ipServicio:       toStr(row["IP de Servicio"]),
      ambiente:         toStr(row["Ambiente"]),
      tipoServidor:     toStr(row["Tipo de Servidor"]),
      appSoporta:       toStr(row["Aplicación que soporta"]),
      vcpu:             toInt(row["vCPU"]),
      vramMb:           toInt(row["vRAM"]),
      sistemaOperativo: toStr(row["Sistema Operativo"]),
      rutasBackup:      toStr(row["Rutas de Backup"]),
    };

    try {
      // Buscar por NOMBRE + CÓDIGO (unique key compuesta)
      const existing = await prisma.asset.findFirst({
        where: { 
          tipo: "SERVIDOR",
          AND: [
            { nombre: nombre },
            { codigoServicio: codigoServicio }
          ]
        },
      });

      if (!existing) {
        const asset = await prisma.asset.create({
          data: {
            tipo: "SERVIDOR", 
            nombre, 
            codigoServicio,
            ubicacion:   toStr(row["Ubicación"]),
            responsable: toStr(row["Responsable"]),
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
            ubicacion:   toStr(row["Ubicación"]),
            responsable: toStr(row["Responsable"]),
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
// REDES
// Unique Key: NOMBRE + SERIAL
// Conteo esperado: 99 registros (todos únicos por combinación)
// ─────────────────────────────────────────────────────────────────────────────

async function importarRedes(workbook: XLSX.WorkBook, autor: string, resumen: Resumen) {
  const sheet = workbook.Sheets["InventarioRedes"];
  if (!sheet) { console.warn("⚠️  InventarioRedes no encontrada"); return; }

  const rows = parseSheet(sheet);

  for (const row of rows) {
    const nombre = toStr(row["Nombre del Equipo"]);
    const serial = toStr(row["Serial"]);
    
    if (!nombre) continue;

    const datosRed = {
      serial,
      mac:       toStr(row["Mac"]),
      modelo:    toStr(row["Modelo"]),
      ipGestion: fixIp(row["IP de Gestion"]),
      estado:    toStr(row["Estado"]),
    };

    try {
      // Buscar por NOMBRE + SERIAL (unique key compuesta)
      const existing = await prisma.asset.findFirst({ 
        where: { 
          tipo: "RED",
          AND: [
            { nombre: nombre },
            { red: { serial: serial } }
          ]
        } 
      });

      if (!existing) {
        const asset = await prisma.asset.create({
          data: {
            tipo: "RED", 
            nombre,
            codigoServicio: toStr(row["Código de Servicio"]),
            ubicacion:      toStr(row["Ubicación"]),
            responsable:    toStr(row["Responsable"]),
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
            responsable:    toStr(row["Responsable"]),
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
// UPS
// Unique Key: SERIAL (ya estaba correcto)
// Conteo esperado: 39 registros
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
      // Buscar por SERIAL (único identificador confiable)
      const existing = await prisma.asset.findFirst({
        where: { tipo: "UPS", ups: { serial } },
      });

      if (!existing) {
        const asset = await prisma.asset.create({
          data: {
            tipo: "UPS", 
            nombre,
            ubicacion:   toStr(row["Ubicación"]),
            responsable: toStr(row["Responsable"]),
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
            responsable: toStr(row["Responsable"]),
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
// BASES DE DATOS
// Unique Key: NOMBRE + SERVIDOR1
// Conteo esperado: 37 registros (todos únicos por combinación)
// ─────────────────────────────────────────────────────────────────────────────

async function importarBD(workbook: XLSX.WorkBook, autor: string, resumen: Resumen) {
  const sheet = workbook.Sheets["InventarioBD"];
  if (!sheet) { console.warn("⚠️  InventarioBD no encontrada"); return; }

  const rows = parseSheet(sheet);

  for (const row of rows) {
    const nombre = toStr(row["Nombre del Base de Datos"]);
    const servidor1 = toStr(row["Servidor 1"]);
    
    if (!nombre) continue;

    const datosBD = {
      servidor1,
      servidor2:        toStr(row["Servidor 2"]),
      racScan:          toStr(row["Rac-Scan"]),
      ambiente:         toStr(row["Ambiente"]),
      appSoporta:       toStr(row["Aplicación que soporta"]),
      versionBd:        toStr(row["Version de BD"]),
      contenedorFisico: toStr(row["Contenedor Fisico"]),
    };

    try {
      // Buscar por NOMBRE + SERVIDOR1 (unique key compuesta)
      const existing = await prisma.asset.findFirst({ 
        where: { 
          tipo: "BASE_DATOS",
          AND: [
            { nombre: nombre },
            { baseDatos: { servidor1: servidor1 } }
          ]
        } 
      });

      if (!existing) {
        const asset = await prisma.asset.create({
          data: { 
            tipo: "BASE_DATOS", 
            nombre, 
            baseDatos: { create: datosBD } 
          },
        });
        const nota = toStr(row["Bitacora"]);
        await prisma.bitacora.create({ data: {
          assetId: asset.id, autor, tipoEvento: "IMPORTACION",
          descripcion: nota ? `Importado desde Excel. Nota: ${nota}` : "Importado desde Excel.",
        }});
        resumen.creados++;
      } else {
        await prisma.baseDatos.upsert({
          where:  { assetId: existing.id },
          update: datosBD,
          create: { assetId: existing.id, ...datosBD },
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
// PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────

export async function importExcel(path: string, autor: string = "Sistema"): Promise<Resumen> {
  console.log(`\n📦 Importando: ${path}`);
  console.log(`👤 Autor: ${autor}\n`);

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

  console.log("\n" + "═".repeat(60));
  console.log(`✅ Creados:      ${resumen.creados}`);
  console.log(`🔄 Actualizados: ${resumen.actualizados}`);
  console.log(`❌ Errores:      ${resumen.errores}`);
  console.log("═".repeat(60));
  
  console.log("\n🔍 Queries de verificación:");
  console.log("─".repeat(60));
  console.log("SELECT tipo, COUNT(*) FROM \"Asset\" GROUP BY tipo;");
  console.log("-- Esperado: SERVIDOR=136 | RED=99 | UPS=39 | BASE_DATOS=37");
  console.log("");
  console.log("SELECT COUNT(*) FROM \"Asset\" WHERE tipo = 'UPS' AND nombre IS NULL;");
  console.log("-- Esperado: 26");
  console.log("");
  console.log("SELECT COUNT(*) FROM \"BaseDatos\" WHERE \"servidor2\" IS NULL;");
  console.log("-- Esperado: 27");
  console.log("");
  console.log("SELECT COUNT(*) FROM \"Servidor\" WHERE \"ipInterna\" IS NULL;");
  console.log("-- Esperado: 24");

  return resumen;
}