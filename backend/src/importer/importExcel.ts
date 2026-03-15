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

function toDate(val: any): Date | null {
  if (val === null || val === undefined) return null;
  if (typeof val === "number" && !isNaN(val) && val > 0) {
    const parsed = XLSX.SSF.parse_date_code(val);
    if (!parsed) return null;
    return new Date(Date.UTC(parsed.y, parsed.m - 1, parsed.d));
  }
  if (val instanceof Date) {
    return isNaN(val.getTime()) ? null : val;
  }
  if (typeof val === "string") {
    const trimmed = val.trim();
    if (!trimmed || trimmed.length > 30) return null;
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

  const HEADER_ROW = 10;
  const headerRow = rawRows[HEADER_ROW] as any[];
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
// SERVIDORES — llave compuesta: codigoServicio + nombre
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
// UPS — llave: serial
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
// VPN — llave: nombre (único en el Excel)
//
// Estructura hoja "Export" (datos desde fila 3, índice 2):
//   Col B (idx 1) → Nombre de la VPN
//   Col C (idx 2) → Conexión  (IP peer — puede ser número sin puntos)
//   Col D (idx 3) → Fases     (siempre "Phase 2")
//   Col E (idx 4) → Origen y Destino ("Origen: X, Destino: Y")
//
// Casos especiales manejados:
//   - IPs numéricas (ej: 177253101154 → "177.253.101.154")
//   - N/A en Conexión → null
//   - N/A en Origen/Destino → null
//   - Nombres simbólicos (ej: "GRP_DU-TORRETAS") → guardados tal cual
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Reconstruye una IP desde número entero (Excel elimina los puntos).
 * Usa backtracking para encontrar la partición correcta en 4 octetos ≤ 255.
 */
function reconstruirIP(num: number): string {
  const s = String(Math.round(num));

  function backtrack(pos: number, partes: number[]): string[] | null {
    if (partes.length === 4 && pos === s.length) return partes.map(String);
    if (partes.length === 4 || pos === s.length) return null;

    const restantes = 4 - partes.length;
    const maxLen    = Math.min(3, s.length - pos - (restantes - 1));

    for (let len = 1; len <= maxLen; len++) {
      const seg = parseInt(s.slice(pos, pos + len), 10);
      if (seg > 255) break;
      if (len > 1 && s[pos] === "0") break;
      const result = backtrack(pos + len, [...partes, seg]);
      if (result) return result;
    }
    return null;
  }

  const partes = backtrack(0, []);
  return partes ? partes.join(".") : s; // fallback: guardar tal cual
}

/** Parsea el campo Conexión — maneja string, número y N/A */
function parsearConexion(raw: unknown): string | null {
  if (raw === null || raw === undefined || raw === "") return null;
  if (typeof raw === "number") return reconstruirIP(raw);
  const s = String(raw).trim();
  if (!s || s.toUpperCase() === "N/A") return null;
  return s;
}

/** Limpia un valor N/A del Excel VPN (incluyendo el texto largo explicativo) */
function limpiarValorVPN(s: string): string | null {
  if (!s) return null;
  const limpio = s.trim();
  if (limpio.toUpperCase().startsWith("N/A")) return null;
  return limpio || null;
}

/** Separa "Origen: X, Destino: Y" en dos campos independientes */
function parsearOrigenDestino(raw: unknown): { origen: string | null; destino: string | null } {
  if (raw === null || raw === undefined) return { origen: null, destino: null };

  const s = String(raw).trim();
  if (!s) return { origen: null, destino: null };

  const sepIdx = s.indexOf(", Destino:");
  if (sepIdx === -1) {
    // Sin separador esperado — poner todo en origen por si acaso
    return { origen: limpiarValorVPN(s.replace(/^Origen:\s*/i, "")), destino: null };
  }

  const origenPart  = s.slice(0, sepIdx).replace(/^Origen:\s*/i, "").trim();
  const destinoPart = s.slice(sepIdx + 2).replace(/^Destino:\s*/i, "").trim();

  return {
    origen:  limpiarValorVPN(origenPart),
    destino: limpiarValorVPN(destinoPart),
  };
}

async function importarVPN(workbook: XLSX.WorkBook, autor: string, resumen: Resumen) {
  const sheet = workbook.Sheets["Export"];
  if (!sheet) {
    
    return;
  }

  // Leer con raw:true para preservar números (IPs sin puntos)
  const filas = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: null,
    raw:    true,
  }) as unknown[][];

  // Fila 1 (índice 0): vacía
  // Fila 2 (índice 1): encabezados
  // Fila 3+ (índice 2+): datos
  const FILA_INICIO = 1;

  let procesadas = 0;

  for (let i = FILA_INICIO; i < filas.length; i++) {
    const fila   = filas[i];
    const numFila = i + 1;

    // Columnas B=1, C=2, D=3, E=

    const nombre = toStr(fila[0]);
 
    if (!nombre) continue;

    const conexion = parsearConexion(fila[1]);
    const fases    = toStr(fila[2]);
    const { origen, destino } = parsearOrigenDestino(fila[3]);

    const datosVpn = { conexion, fases, origen, destino };

    try {
      const existing = await prisma.asset.findFirst({
        where: { tipo: "VPN", nombre },
      });

      if (!existing) {
        const asset = await prisma.asset.create({
          data: {
            tipo: "VPN",
            nombre,
            vpn: { create: datosVpn },
          },
        });
        await prisma.bitacora.create({
          data: {
            assetId:     asset.id,
            autor,
            tipoEvento:  "IMPORTACION",
            descripcion: "VPN importada desde Excel.",
          },
        });
        resumen.creados++;
      } else {
        console.log(`ACTUALIZANDO: "${nombre}" id=${existing.id}`);
        await prisma.vpn.upsert({
          where:  { assetId: existing.id },
          update: datosVpn,
          create: { assetId: existing.id, ...datosVpn },
        });
        await prisma.bitacora.create({
          data: {
            assetId:     existing.id,
            autor,
            tipoEvento:  "IMPORTACION",
            descripcion: "VPN actualizada desde Excel.",
          },
        });
        resumen.actualizados++;
      }

      procesadas++;
    } catch (e: any) {
      console.error(`  ❌ VPN fila ${numFila} "${nombre}": ${e.message}`);
      resumen.errores++;
    }
  }

  if (procesadas > 0) {
    console.log(`   → ${procesadas} VPNs procesadas`);
  }
}

//esta es la exportación principal 
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

  console.log("📂 VPN (Export)...");
  await importarVPN(workbook, autor, resumen);

  console.log("\n─────────────────────────────────");
  console.log(`✅ Creados:      ${resumen.creados}`);
  console.log(`🔄 Actualizados: ${resumen.actualizados}`);
  console.log(`❌ Errores:      ${resumen.errores}`);
  console.log("─────────────────────────────────");

  return resumen;
}