import * as XLSX from "xlsx";
import { AppDataSource } from "../config/database";
import { Asset } from "../entities/Asset";
import { Servidor } from "../entities/Servidor";
import { Red } from "../entities/Red";
import { Ups } from "../entities/Ups";
import { BaseDatos } from "../entities/BaseDatos";
import { Vpn } from "../entities/Vpn";
import { Bitacora } from "../entities/Bitacora";

const assetRepo = AppDataSource.getRepository(Asset);
const servidorRepo = AppDataSource.getRepository(Servidor);
const redRepo = AppDataSource.getRepository(Red);
const upsRepo = AppDataSource.getRepository(Ups);
const bdRepo = AppDataSource.getRepository(BaseDatos);
const vpnRepo = AppDataSource.getRepository(Vpn);
const bitacoraRepo = AppDataSource.getRepository(Bitacora);

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


// ─────────────────────────────────────────────────────────────────────────────
function parseSheet(sheet: XLSX.WorkSheet): Record<string, any>[] {
  const rawRows = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: null,
  }) as any[][];

  // CORRECCIÓN: el header real está en el índice 7, no en el 10.
  // El índice 10 apuntaba a una fila de datos, por lo que todos los campos
  // resultaban null y se saltaban todos los registros.
  const HEADER_ROW = 9;
  const headerRow = rawRows[HEADER_ROW] as any[];

  // La columna A (índice 0) siempre está vacía en este formato → saltar
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
// ─────────────────────────────────────────────────────────────────────────────
// SERVIDORES — Lógica de Identidad Dual (Nombre / IP)
// ─────────────────────────────────────────────────────────────────────────────



// ─────────────────────────────────────────────────────────────────────────────
// SERVIDORES — VALIDACIÓN MÁXIMA (Identidad: Nombre, IP o Contrato)
// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// SERVIDORES — VALIDACIÓN TOTAL (Rescata N/A, IPs y Contratos)
// ─────────────────────────────────────────────────────────────────────────────
async function importarServidores(workbook: XLSX.WorkBook, autor: string, resumen: Resumen) {
  const sheet = workbook.Sheets["InventarioServidores"];
  if (!sheet) { console.warn("⚠️  InventarioServidores no encontrada"); return; }

  const rows = parseSheet(sheet);

  // ─────────────────────────────────────────────────────────────────────────────
// SERVIDORES — VALIDACIÓN EXTREMA PARA LLEGAR A LOS 190
// ─────────────────────────────────────────────────────────────────────────────
for (const row of rows) {
  const nombreRaw = toStr(row["Nombre del Servidor"]);
  const ipInterna = toStr(row["Dirección IP"]);
  const contrato  = toStr(row["Contrato Asociado"]);

  // 1. FILTRO ESTRICTO: Si no hay Nombre Y no hay IP, la fila se ignora.
  // Esto evita los registros basura y los nombres de contrato feos.
  if (!nombreRaw && !ipInterna) continue;

  // 2. NOMBRE DEL ACTIVO: Usamos el nombre del Excel. 
  // Si no tiene, usamos la IP. NADA MÁS.
  const nombreFinal = nombreRaw || ipInterna;

  const datosServidor = {
    monitoreo:          toStr(row["Monitoreo"]),
    backup:             toStr(row["Backup"]),
    ipInterna:          ipInterna,
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
    contratoQueSoporta: contrato,
  };

  try {
    // 3. LLAVE COMPUESTA: Buscamos que coincida el Nombre Y la IP.
    // Esto es lo que permite que si hay 2 servidores con el mismo nombre
    // pero distinta IP, se creen como 2 registros separados (Llegando a los 190).
    let existing: (Asset & { servidor: Servidor }) | null = null;
    if (nombreFinal) {
      existing = await assetRepo.findOne({
        where: { tipo: "SERVIDOR", nombre: nombreFinal } as any,
        relations: ["servidor"]
      }) as any;
      // Verificar que la IP interna coincida (para la llave compuesta)
      if (existing && existing.servidor?.ipInterna !== ipInterna) {
        existing = null; // No es el mismo, tratar como no encontrado
      }
    }

    if (!existing) {
      // 4. CREACIÓN
      const asset = assetRepo.create({
        tipo: "SERVIDOR",
        nombre: nombreFinal,
        codigoServicio: toStr(row["Código de Servicio"]),
        ubicacion:      toStr(row["Ubicación"]),
        propietario:    toStr(row["Propietario"]),
        custodio:       toStr(row["Custodio"]),
      });
      const savedAsset = await assetRepo.save(asset);
      
      const servidor = servidorRepo.create({
        ...datosServidor,
        asset: { id: savedAsset.id } as any,
      });
      await servidorRepo.save(servidor);
      resumen.creados++;
    } else {
      // 5. ACTUALIZACIÓN
      await servidorRepo.update(
        { asset: { id: existing.id } } as any,
        datosServidor
      );
      existing.ubicacion = toStr(row["Ubicación"]);
      existing.codigoServicio = toStr(row["Código de Servicio"]);
      await assetRepo.save(existing);
      resumen.actualizados++;
    }
  } catch (e: any) {
    console.error(`❌ Error en: ${nombreFinal} -> ${e.message}`);
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
     fechaFinSoporte: toDate(row["Fecha Fin Soporte"]),
      ipGestion:          fixIp(row["IP de Gestion"]),
      estado:             toStr(row["Estado"]),
      contratoQueSoporta: toStr(row["Contrato Asociado"]),
    };

    try {
      let existing: (Asset & { red: Red }) | null = null;
      if (nombre) {
        existing = await assetRepo.findOne({
          where: { tipo: "RED", nombre } as any,
          relations: ["red"]
        }) as any;
        // Verificación adicional del serial
        if (existing && serial && existing.red?.serial !== serial) {
          existing = null;
        }
      }

      if (!existing) {
        const asset = assetRepo.create({
          tipo: "RED", nombre,
          codigoServicio: toStr(row["Código de Servicio"]),
          ubicacion:      toStr(row["Ubicación"]),
          propietario:    toStr(row["Propietario"]),
          custodio:       toStr(row["Custodio"]),
        });
        const savedAsset = await assetRepo.save(asset);
        
        const red = redRepo.create({
          ...datosRed,
          asset: { id: savedAsset.id } as any,
        });
        await redRepo.save(red);
        
        const nota = toStr(row["Bitacora"]);
        const bitacora = bitacoraRepo.create({
          asset: { id: savedAsset.id } as any, autor, tipoEvento: "IMPORTACION",
          descripcion: nota ? `Importado desde Excel. Nota: ${nota}` : "Importado desde Excel.",
        });
        await bitacoraRepo.save(bitacora);
        resumen.creados++;
      } else {
        const red = await redRepo.findOne({ where: { asset: { id: existing.id } } as any });
        if (red) {
          await redRepo.update({ asset: { id: existing.id } } as any, datosRed);
        } else {
          const newRed = redRepo.create({ asset: { id: existing.id } as any, ...datosRed });
          await redRepo.save(newRed);
        }
        
        existing.codigoServicio = toStr(row["Código de Servicio"]);
        existing.ubicacion = toStr(row["Ubicación"]);
        existing.propietario = toStr(row["Propietario"]);
        existing.custodio = toStr(row["Custodio"]);
        await assetRepo.save(existing);
        
        const bitacora = bitacoraRepo.create({
          asset: { id: existing.id } as any, autor, tipoEvento: "IMPORTACION",
          descripcion: "Registro actualizado desde Excel.",
        });
        await bitacoraRepo.save(bitacora);
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
      let existing: (Asset & { ups: Ups }) | null = null;
      if (serial) {
        // Buscar por tipo UPS
        const candidates = await assetRepo.find({
          where: { tipo: "UPS" } as any,
          relations: ["ups"]
        });
        existing = candidates.find(a => a.ups?.serial === serial) as any || null;
      }

      if (!existing) {
        const asset = assetRepo.create({
          tipo: "UPS", nombre,
          ubicacion:   toStr(row["Ubicación"]),
          propietario: toStr(row["Propietario"]),
          custodio:    toStr(row["Custodio"]),
        });
        const savedAsset = await assetRepo.save(asset);
        
        const ups = upsRepo.create({
          ...datosUps,
          asset: { id: savedAsset.id } as any,
        });
        await upsRepo.save(ups);
        
        const nota = toStr(row["Bitacora"]);
        const bitacora = bitacoraRepo.create({
          asset: { id: savedAsset.id } as any, autor, tipoEvento: "IMPORTACION",
          descripcion: nota ? `Importado desde Excel. Nota: ${nota}` : "Importado desde Excel.",
        });
        await bitacoraRepo.save(bitacora);
        resumen.creados++;
      } else {
        const ups = await upsRepo.findOne({ where: { asset: { id: existing.id } } as any });
        if (ups) {
          await upsRepo.update({ asset: { id: existing.id } } as any, datosUps);
        } else {
          const newUps = upsRepo.create({ asset: { id: existing.id } as any, ...datosUps });
          await upsRepo.save(newUps);
        }
        
        existing.nombre = nombre;
        existing.ubicacion = toStr(row["Ubicación"]);
        existing.propietario = toStr(row["Propietario"]);
        existing.custodio = toStr(row["Custodio"]);
        await assetRepo.save(existing);
        
        const bitacora = bitacoraRepo.create({
          asset: { id: existing.id } as any, autor, tipoEvento: "IMPORTACION",
          descripcion: "Registro actualizado desde Excel.",
        });
        await bitacoraRepo.save(bitacora);
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
   const nombre = toStr(row["Nombre"]);
    if (!nombre) continue;

    const servidor1 = toStr(row["Servidor 1"]);

    const datosBD = {
      servidor1,
      servidor2:          toStr(row["Servidor 2"]),
      racScan:            toStr(row["Rac-Scan"]),
      ambiente:           toStr(row["Ambiente"]),
      appSoporta: toStr(row["Aplicación que Soporta"]),
      versionBd:          toStr(row["Version de BD"]),
      fechaFinalSoporte:  toDate(row["Fecha Final de soporte"]),
      contenedorFisico:   toStr(row["Contenedor Fisico"]),
      contratoQueSoporta: toStr(row["Contrato que lo soporta"]),
    };

    try {
      let existing: (Asset & { baseDatos: BaseDatos }) | null = null;
      if (nombre) {
        existing = await assetRepo.findOne({
          where: { tipo: "BASE_DATOS", nombre } as any,
          relations: ["baseDatos"]
        }) as any;
        // Verificación adicional del servidor principal
        if (existing && servidor1 && existing.baseDatos?.servidor1 !== servidor1) {
          existing = null;
        }
      }

      if (!existing) {
        const asset = assetRepo.create({
          tipo:        "BASE_DATOS",
          nombre,
          propietario: toStr(row["Propietario"]),
          custodio:    toStr(row["Custodio"]),
        });
        const savedAsset = await assetRepo.save(asset);
        
        const baseDatos = bdRepo.create({
          ...datosBD,
          asset: { id: savedAsset.id } as any,
        });
        await bdRepo.save(baseDatos);
        
        const bitacora = bitacoraRepo.create({
          asset: { id: savedAsset.id } as any, autor, tipoEvento: "IMPORTACION",
          descripcion: "Importado desde Excel.",
        });
        await bitacoraRepo.save(bitacora);
        resumen.creados++;
      } else {
        const baseDatos = await bdRepo.findOne({ where: { asset: { id: existing.id } } as any });
        if (baseDatos) {
          await bdRepo.update({ asset: { id: existing.id } } as any, datosBD);
        } else {
          const newBD = bdRepo.create({ asset: { id: existing.id } as any, ...datosBD });
          await bdRepo.save(newBD);
        }
        
        existing.propietario = toStr(row["Propietario"]);
        existing.custodio = toStr(row["Custodio"]);
        await assetRepo.save(existing);
        
        const bitacora = bitacoraRepo.create({
          asset: { id: existing.id } as any, autor, tipoEvento: "IMPORTACION",
          descripcion: "Registro actualizado desde Excel.",
        });
        await bitacoraRepo.save(bitacora);
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
// ESTRUCTURA HOJA "Export" (confirmada analizando ambos archivos reales):
//   Fila 0 (índice 0): vacía
//   Fila 1 (índice 1): encabezados — col[1]="Nombre de la VPN", col[2]="Conexión"...
//   Fila 2+ (índice 2+): datos
//
// IMPORTANTE: la col[0] (columna A) es SIEMPRE None en ambos archivos.
// Los datos reales están en col[1], col[2], col[3], col[4].
//
// CORRECCIÓN APLICADA: el código anterior usaba fila[0] como nombre (siempre None)
// y fila[1..3] para el resto. Ahora se detecta automáticamente el offset:
//   - Si col[0] es null → offset=1 (datos en col[1..4])
//   - Si col[0] tiene datos → offset=0 (datos en col[0..3])
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
    // Silencioso: el archivo de inventario no tiene hoja Export, es esperado
    return;
  }

  // Leer con raw:true para preservar números (IPs sin puntos)
  const filas = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: null,
    raw:    true,
  }) as unknown[][];

  // Estructura confirmada analizando los archivos reales:
  //   Índice 0: vacía
  //   Índice 1: encabezados (col[1]="Nombre de la VPN", etc.)
  //   Índice 2+: datos reales
  // FILA_INICIO=2 salta la fila vacía y la de encabezados correctamente.
  const FILA_INICIO = 2;

  let procesadas = 0;

  for (let i = FILA_INICIO; i < filas.length; i++) {
    const fila    = filas[i];
    const numFila = i + 1;

    // CORRECCIÓN CLAVE: la col[0] (columna A) es siempre None en el Excel.
    // Los datos reales están en col[1..4].
    // Se detecta automáticamente para ser robusto ante cambios futuros del formato.
    const offset = (fila[0] === null || fila[0] === undefined) ? 1 : 0;

    const nombre = toStr(fila[offset]);
    if (!nombre) continue;

    const conexion = parsearConexion(fila[offset + 1]);
    const fases    = toStr(fila[offset + 2]);
    const { origen, destino } = parsearOrigenDestino(fila[offset + 3]);

    const datosVpn = { conexion, fases, origen, destino };

    try {
      const existing = await assetRepo.findOne({
        where: { tipo: "VPN", nombre } as any,
      });

      if (!existing) {
        const asset = assetRepo.create({
          tipo: "VPN",
          nombre,
        });
        const savedAsset = await assetRepo.save(asset);
        
        const vpn = vpnRepo.create({
          ...datosVpn,
          asset: { id: savedAsset.id } as any,
        });
        await vpnRepo.save(vpn);
        
        const bitacora = bitacoraRepo.create({
          asset:     { id: savedAsset.id } as any,
          autor,
          tipoEvento:  "IMPORTACION",
          descripcion: "VPN importada desde Excel.",
        });
        await bitacoraRepo.save(bitacora);
        resumen.creados++;
      } else {
        const vpn = await vpnRepo.findOne({ where: { asset: { id: existing.id } } as any });
        if (vpn) {
          await vpnRepo.update({ asset: { id: existing.id } } as any, datosVpn);
        } else {
          const newVpn = vpnRepo.create({ asset: { id: existing.id } as any, ...datosVpn });
          await vpnRepo.save(newVpn);
        }
        
        const bitacora = bitacoraRepo.create({
          asset:     { id: existing.id } as any,
          autor,
          tipoEvento:  "IMPORTACION",
          descripcion: "VPN actualizada desde Excel.",
        });
        await bitacoraRepo.save(bitacora);
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

// Esta es la exportación principal
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