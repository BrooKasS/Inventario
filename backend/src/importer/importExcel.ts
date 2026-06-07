// ─────────────────────────────────────────────────────────────────────────────
// importExcel.ts  —  Importador seguro para producción
//
// REGLA DE ORO: Este archivo NUNCA borra ni sobreescribe datos existentes.
// Solo RELLENA campos que estén null/vacíos en BD.
// EXCEPCIÓN ÚNICA: codigoServicio se actualiza SIEMPRE (no existe en la app aún).
//
// BUGS CORREGIDOS vs versión anterior:
//  [B1] HEADER_ROW era 9, debe ser 7 (fila 8 del Excel, índice 7 del array)
//  [B2] ' IP de Servicio' tenía espacio al inicio → trim() en headers de parseSheet
//  [B3] 'Código de Servicio ' tenía espacio al final → trim() en headers de parseSheet
//  [B4] 'Contrato Asociado' → 'Contrato que lo soporta' en Servidores y Redes
//  [B5] 'Fecha Fin Soporte' → 'Fecha Fin de soporte' en Redes
//  [B6] 'Nombre' → 'Nombre del Base de Datos' en BD
//  [B7] 'Aplicación que Soporta' → 'Aplicación que soporta' en BD
//  [B8] importarServidores: el for-loop tenía la lógica de la función duplicada
//  [B9] IP duplicada 10.10.2.40: desempate por nombre al buscar por IP
//  [B10] UPS: agrega columna 'Bitacora' del Excel como entrada BITACORA en BD
// ─────────────────────────────────────────────────────────────────────────────

import * as XLSX from "xlsx";
import { AppDataSource } from "../config/database";
import { Asset } from "../entities/Asset";
import { Servidor } from "../entities/Servidor";
import { Red } from "../entities/Red";
import { Ups } from "../entities/Ups";
import { BaseDatos } from "../entities/BaseDatos";
import { Vpn } from "../entities/Vpn";
import { Bitacora } from "../entities/Bitacora";

const assetRepo    = AppDataSource.getRepository(Asset);
const servidorRepo = AppDataSource.getRepository(Servidor);
const redRepo      = AppDataSource.getRepository(Red);
const upsRepo      = AppDataSource.getRepository(Ups);
const bdRepo       = AppDataSource.getRepository(BaseDatos);
const vpnRepo      = AppDataSource.getRepository(Vpn);
const bitacoraRepo = AppDataSource.getRepository(Bitacora);

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
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
// parseSheet — Lee una hoja del Excel respetando que los headers están en la
// fila 8 del Excel (índice 7 en el array 0-indexed de XLSX con header:1).
//
// CORRECCIÓN B1: HEADER_ROW = 7 (antes era 9, lo cual saltaba 2 filas de datos)
// CORRECCIÓN B2/B3: trim() en los nombres de columna elimina espacios invisibles
//   al inicio (' IP de Servicio') y al final ('Código de Servicio ')
// ─────────────────────────────────────────────────────────────────────────────
function parseSheet(sheet: XLSX.WorkSheet, headerRow: number = 7): Record<string, any>[] {
  const rawRows = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: null,
  }) as any[][];
  console.log("🔴 FILA 5:", JSON.stringify(rawRows[5]));
console.log("🔴 FILA 6:", JSON.stringify(rawRows[6]));
console.log("🔴 FILA 7:", JSON.stringify(rawRows[7]));
console.log("🔴 FILA 8:", JSON.stringify(rawRows[8]));

  // [B1] Fila 8 del Excel = índice 7 del array (0-indexed).
  // El error anterior (HEADER_ROW=9) hacía que parseSheet leyera como header
  // una fila de datos reales, con lo que todos los campos salían null.
  const HEADER_ROW = headerRow;

  if (rawRows.length <= HEADER_ROW) {
    console.warn("  ⚠️  La hoja tiene menos filas de las esperadas");
    return [];
  }

  const headerRowData = rawRows[HEADER_ROW] as any[];

  // La columna A (índice 0) a veces está vacía en estas hojas → saltar
  const firstIsNull = headerRowData[0] === null || headerRowData[0] === undefined || String(headerRowData[0]).trim() === "";
  const startCol = firstIsNull ? 1 : 0;

  // [B2][B3] trim() en headers: elimina espacios al inicio y final de nombres de columna
  const headers = headerRowData
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
//
// Llave de búsqueda: primero por IP interna (más estable), fallback por nombre.
// IP duplicada 10.10.2.40: si hay varios candidatos con la misma IP, se
// desempata por nombre. Si aún hay ambigüedad, se usa el primero (no crea dup).
//
// Para registros EXISTENTES:
//   - codigoServicio: SIEMPRE (es el campo que falta en la app)
//   - propietario, custodio, ubicacion: solo si null en BD
//   - Servidor.fechaFinSoporte: solo si null en BD
//   - Servidor.contratoQueSoporta: solo si null en BD
//   - Servidor.ipServicio: solo si null en BD [B2 corregido]
//   - Resto de campos de Servidor: NO SE TOCAN
//
// CORRECCIÓN B4: 'Contrato que lo soporta' (antes 'Contrato Asociado')
// CORRECCIÓN B2: 'IP de Servicio' (el trim() en parseSheet elimina el espacio)
// ─────────────────────────────────────────────────────────────────────────────

async function importarServidores(
  
  workbook: XLSX.WorkBook,
  autor: string,
  resumen: Resumen
): Promise<void> {
  
  console.log("🔴 ENTRANDO A IMPORTAR SERVIDORES");
  const sheet = workbook.Sheets["InventarioServidores"];
  if (!sheet) {
    console.warn("⚠️  Hoja InventarioServidores no encontrada");
    return;
  }
  const rows = parseSheet(sheet,6);
  

  for (const row of rows) {
    const nombreRaw = toStr(row["Nombre del Servidor"]);
    // fixIp porque Excel a veces guarda IPs como números
    const ipInterna = fixIp(row["Dirección IP"]);

    // Fila sin nombre ni IP: basura, ignorar
    if (!nombreRaw && !ipInterna) continue;

    const nombreFinal = nombreRaw || ipInterna!;

    // Todos los datos que vendría del Excel para un registro nuevo
    const codigoServicioExcel  = toStr(row["Código de Servicio"]);  // trim() en parseSheet lo limpió
    const propietarioExcel     = toStr(row["Propietario"]);
    const custodioExcel        = toStr(row["Custodio"]);
    const ubicacionExcel       = toStr(row["Ubicación"]);
    // [B4] Nombre de columna corregido
    const contratoExcel        = toStr(row["Contrato que lo soporta"]);
    // [B2] 'IP de Servicio' ahora funciona porque parseSheet hizo trim() al header
    const ipServicioExcel      = toStr(row["IP de Servicio"]);
    const fechaFinSoporteExcel = toDate(row["Fecha Fin Soporte"]);

    try {
      // ── BÚSQUEDA: IP primero, fallback nombre ──────────────────────────────
      let existing: (Asset & { servidor: Servidor }) | null = null;

      if (ipInterna) {
        // Traer todos los servidores con esa IP (pueden ser 2 si hay IP duplicada)
        const candidates = await assetRepo.find({
          where: { tipo: "SERVIDOR" } as any,
          relations: ["servidor"],
        }) as (Asset & { servidor: Servidor })[];

        const byIp = candidates.filter(
          (a) => a.servidor?.ipInterna === ipInterna
        );

        if (byIp.length === 1) {
          existing = byIp[0];
        } else if (byIp.length > 1) {
          // [B9] IP duplicada: desempatar por nombre exacto
          const byIpAndName = byIp.find(
            (a) => a.nombre === nombreFinal
          );
          existing = byIpAndName || byIp[0]; // si no hay coincidencia de nombre, tomar el primero
        }
      }

      // Fallback por nombre si no encontró por IP
      
      if (!existing && nombreFinal) {
        existing = await assetRepo.findOne({
          where: { tipo: "SERVIDOR", nombre: nombreFinal } as any,
          relations: ["servidor"],
        }) as (Asset & { servidor: Servidor }) | null;
      }
      console.log(`>> ${nombreFinal} | found: ${existing?.nombre ?? "NO"} | codigoActual: ${existing?.codigoServicio} | codigoExcel: ${codigoServicioExcel}`);

      // ── CREACIÓN (registro nuevo) ──────────────────────────────────────────
      if (!existing) {
        const asset = assetRepo.create({
          tipo:           "SERVIDOR",
          nombre:         nombreFinal,
          codigoServicio: codigoServicioExcel,
          ubicacion:      ubicacionExcel,
          propietario:    propietarioExcel,
          custodio:       custodioExcel,
        });
        const savedAsset = await assetRepo.save(asset);

        const servidor = servidorRepo.create({
          monitoreo:          toStr(row["Monitoreo"]),
          backup:             toStr(row["Backup"]),
          ipInterna:          ipInterna,
          ipGestion:          toStr(row["IP de Gestion"]),
          ipServicio:         ipServicioExcel,
          ambiente:           toStr(row["Ambiente"]),
          tipoServidor:       toStr(row["Tipo de Servidor"]),
          appSoporta:         toStr(row["Aplicación que soporta"]),
          vcpu:               toInt(row["vCPU"]),
          vramMb:             toInt(row["vRAM"]),
          sistemaOperativo:   toStr(row["Sistema Operativo"]),
          fechaFinSoporte:    fechaFinSoporteExcel,
          rutasBackup:        toStr(row["Rutas de Backup"]),
          contratoQueSoporta: contratoExcel,
          asset: { id: savedAsset.id } as any,
        });
        await servidorRepo.save(servidor);

        const bitacoraStr = toStr(row["Bitacora"]);
        const bitacora = bitacoraRepo.create({
          asset:       { id: savedAsset.id } as any,
          autor,
          tipoEvento:  "IMPORTACION",
          descripcion: bitacoraStr
            ? `Importado desde Excel. Nota: ${bitacoraStr}`
            : "Importado desde Excel.",
        });
        await bitacoraRepo.save(bitacora);

        resumen.creados++;

      // ── ACTUALIZACIÓN (registro existente) ────────────────────────────────
      } else {
        // Cargar la sub-entidad Servidor actual para comparar
        const servidorActual = await servidorRepo.findOne({
          where: { asset: { id: existing.id } } as any,
        });

        // ── ASSET: solo rellenar lo que esté vacío ──────────────────────────
        let assetModificado = false;

        // codigoServicio: SIEMPRE actualizar (objetivo principal de esta importación)
        if (codigoServicioExcel && existing.codigoServicio !== codigoServicioExcel) {
          existing.codigoServicio = codigoServicioExcel;
          assetModificado = true;
        }
        // propietario: solo si null/vacío en BD
        if (propietarioExcel && !existing.propietario) {
          existing.propietario = propietarioExcel;
          assetModificado = true;
        }
        // custodio: solo si null/vacío en BD
        if (custodioExcel && !existing.custodio) {
          existing.custodio = custodioExcel;
          assetModificado = true;
        }
        // ubicacion: solo si null/vacío en BD
        if (ubicacionExcel && !existing.ubicacion) {
          existing.ubicacion = ubicacionExcel;
          assetModificado = true;
        }
        // nombre: NUNCA cambiar (es la llave de búsqueda)

        if (assetModificado) {
          await assetRepo.save(existing);
        }

        // ── SERVIDOR: solo rellenar campos que estén null en BD ─────────────
        if (servidorActual) {
          const servidorUpdates: Partial<Servidor> = {};

          // fechaFinSoporte: solo si null en BD (uno de los campos que no aparece en la app)
          if (fechaFinSoporteExcel && !servidorActual.fechaFinSoporte) {
            servidorUpdates.fechaFinSoporte = fechaFinSoporteExcel;
          }
          // contratoQueSoporta: solo si null en BD [B4 corregido]
          if (contratoExcel && !servidorActual.contratoQueSoporta) {
            servidorUpdates.contratoQueSoporta = contratoExcel;
          }
          // ipServicio: solo si null en BD [B2 corregido]
          if (ipServicioExcel && !servidorActual.ipServicio) {
            servidorUpdates.ipServicio = ipServicioExcel;
          }
          // El resto de campos de Servidor (monitoreo, backup, ipInterna, ipGestion,
          // ambiente, tipoServidor, appSoporta, vcpu, vramMb, sistemaOperativo,
          // rutasBackup) NO SE TOCAN en registros existentes.

          if (toStr(row["Aplicación que soporta"]) && !servidorActual.appSoporta)
  servidorUpdates.appSoporta = toStr(row["Aplicación que soporta"]);

if (toStr(row["Rutas de Backup"]) && !servidorActual.rutasBackup)
  servidorUpdates.rutasBackup = toStr(row["Rutas de Backup"]);

if (toStr(row["Ambiente"]) && !servidorActual.ambiente)
  servidorUpdates.ambiente = toStr(row["Ambiente"]);

if (toStr(row["Tipo de Servidor"]) && !servidorActual.tipoServidor)
  servidorUpdates.tipoServidor = toStr(row["Tipo de Servidor"]);

if (toStr(row["Sistema Operativo"]) && !servidorActual.sistemaOperativo)
  servidorUpdates.sistemaOperativo = toStr(row["Sistema Operativo"]);

if (toStr(row["Monitoreo"]) && !servidorActual.monitoreo)
  servidorUpdates.monitoreo = toStr(row["Monitoreo"]);

if (toStr(row["Backup"]) && !servidorActual.backup)
  servidorUpdates.backup = toStr(row["Backup"]);

if (toInt(row["vCPU"]) && !servidorActual.vcpu)
  servidorUpdates.vcpu = toInt(row["vCPU"]);

if (toInt(row["vRAM"]) && !servidorActual.vramMb)
  servidorUpdates.vramMb = toInt(row["vRAM"]);

          if (Object.keys(servidorUpdates).length > 0) {
            await servidorRepo.update(
              { asset: { id: existing.id } } as any,
              servidorUpdates
            );
          }
        } else {
          // No existe sub-entidad Servidor: crearla con todos los datos del Excel
          const nuevoServidor = servidorRepo.create({
            monitoreo:          toStr(row["Monitoreo"]),
            backup:             toStr(row["Backup"]),
            ipInterna:          ipInterna,
            ipGestion:          toStr(row["IP de Gestion"]),
            ipServicio:         ipServicioExcel,
            ambiente:           toStr(row["Ambiente"]),
            tipoServidor:       toStr(row["Tipo de Servidor"]),
            appSoporta:         toStr(row["Aplicación que soporta"]),
            vcpu:               toInt(row["vCPU"]),
            vramMb:             toInt(row["vRAM"]),
            sistemaOperativo:   toStr(row["Sistema Operativo"]),
            fechaFinSoporte:    fechaFinSoporteExcel,
            rutasBackup:        toStr(row["Rutas de Backup"]),
            contratoQueSoporta: contratoExcel,
            asset: { id: existing.id } as any,
          });
          await servidorRepo.save(nuevoServidor);
        }
        const bitacoraStr = toStr(row["Bitacora"]);
if (bitacoraStr) {
  const descripcionNota = `Observación desde Excel: ${bitacoraStr}`;
  const yaExiste = await bitacoraRepo.findOne({
    where: {
      asset: { id: existing.id } as any,
      descripcion: descripcionNota,
    } as any,
  });
  if (!yaExiste) {
    const nota = bitacoraRepo.create({
      asset:      { id: existing.id } as any,
      autor,
      tipoEvento: "NOTA",
      descripcion: descripcionNota,
    });
    await bitacoraRepo.save(nota);
  }
}

        resumen.actualizados++;
      }
    } catch (e: any) {
      console.error(`  ❌ Servidor "${nombreFinal}": ${e.message}`);
      resumen.errores++;
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// REDES
//
// Llave de búsqueda: nombre + serial (igual que antes).
//
// Para registros EXISTENTES:
//   - codigoServicio: SIEMPRE
//   - propietario, custodio, ubicacion: solo si null en BD
//   - Red.fechaFinSoporte: solo si null en BD [B5 corregido]
//   - Red.contratoQueSoporta: solo si null en BD [B4 corregido]
//   - Resto de campos de Red: NO SE TOCAN
//
// CORRECCIÓN B4: 'Contrato que lo soporta' (antes 'Contrato Asociado')
// CORRECCIÓN B5: 'Fecha Fin de soporte' (antes 'Fecha Fin Soporte')
// ─────────────────────────────────────────────────────────────────────────────
async function importarRedes(
  workbook: XLSX.WorkBook,
  autor: string,
  resumen: Resumen
): Promise<void> {
  const sheet = workbook.Sheets["InventarioRedes"];
  if (!sheet) {
    console.warn("⚠️  Hoja InventarioRedes no encontrada");
    return;
  }
  const rows = parseSheet(sheet);
  console.log(`   → ${rows.length} filas leídas de InventarioRedes`);

  for (const row of rows) {
    const nombre = toStr(row["Nombre del Equipo"]);
    if (!nombre) continue;

    const serial               = toStr(row["Serial"]);
    const contratoExcel        = toStr(row["Contrato que lo soporta"]);
    const fechaFinSoporteExcel = toDate(row["Fecha Fin de soporte"]);
    const codigoServicioExcel  = toStr(row["Código de Servicio"]);
    const propietarioExcel     = toStr(row["Propietario"]);
    const custodioExcel        = toStr(row["Custodio"]);
    const ubicacionExcel       = toStr(row["Ubicación"]);
    const bitacoraStr          = toStr(row["Bitacora"]);

    try {
      let existing: (Asset & { red: Red }) | null = null;
      existing = await assetRepo.findOne({
        where: { tipo: "RED", nombre } as any,
        relations: ["red"],
      }) as (Asset & { red: Red }) | null;

      if (existing && serial && existing.red?.serial && existing.red.serial !== serial) {
        existing = null;
      }

      // ── CREACIÓN ──────────────────────────────────────────────────────────
      if (!existing) {
        const asset = assetRepo.create({
          tipo:           "RED",
          nombre,
          codigoServicio: codigoServicioExcel,
          ubicacion:      ubicacionExcel,
          propietario:    propietarioExcel,
          custodio:       custodioExcel,
        });
        const savedAsset = await assetRepo.save(asset);

        const red = redRepo.create({
          serial,
          mac:                toStr(row["Mac"]),
          modelo:             toStr(row["Modelo"]),
          fechaFinSoporte:    fechaFinSoporteExcel,
          ipGestion:          fixIp(row["IP de Gestion"]),
          estado:             toStr(row["Estado"]),
          contratoQueSoporta: contratoExcel,
          asset: { id: savedAsset.id } as any,
        });
        await redRepo.save(red);

        // IMPORTACION limpia — sin nota embebida
        await bitacoraRepo.save(bitacoraRepo.create({
          asset:      { id: savedAsset.id } as any,
          autor,
          tipoEvento: "IMPORTACION",
          descripcion: "Importado desde Excel.",
        }));

        // NOTA separada — igual que UPS
        if (bitacoraStr) {
          await bitacoraRepo.save(bitacoraRepo.create({
            asset:      { id: savedAsset.id } as any,
            autor,
            tipoEvento: "NOTA",
            descripcion: `Observación desde Excel: ${bitacoraStr}`,
          }));
        }

        resumen.creados++;

      // ── ACTUALIZACIÓN ─────────────────────────────────────────────────────
      } else {
        const redActual = await redRepo.findOne({
          where: { asset: { id: existing.id } } as any,
        });

        let assetModificado = false;
        if (codigoServicioExcel && existing.codigoServicio !== codigoServicioExcel) {
          existing.codigoServicio = codigoServicioExcel;
          assetModificado = true;
        }
        if (propietarioExcel && !existing.propietario) {
          existing.propietario = propietarioExcel;
          assetModificado = true;
        }
        if (custodioExcel && !existing.custodio) {
          existing.custodio = custodioExcel;
          assetModificado = true;
        }
        if (ubicacionExcel && !existing.ubicacion) {
          existing.ubicacion = ubicacionExcel;
          assetModificado = true;
        }
        if (assetModificado) {
          await assetRepo.save(existing);
        }

        if (redActual) {
          const redUpdates: Partial<Red> = {};
          if (fechaFinSoporteExcel && !redActual.fechaFinSoporte) {
            redUpdates.fechaFinSoporte = fechaFinSoporteExcel;
          }
          if (contratoExcel && !redActual.contratoQueSoporta) {
            redUpdates.contratoQueSoporta = contratoExcel;
          }
          if (Object.keys(redUpdates).length > 0) {
            await redRepo.update(
              { asset: { id: existing.id } } as any,
              redUpdates
            );
          }
        } else {
          const nuevaRed = redRepo.create({
            serial,
            mac:                toStr(row["Mac"]),
            modelo:             toStr(row["Modelo"]),
            fechaFinSoporte:    fechaFinSoporteExcel,
            ipGestion:          fixIp(row["IP de Gestion"]),
            estado:             toStr(row["Estado"]),
            contratoQueSoporta: contratoExcel,
            asset: { id: existing.id } as any,
          });
          await redRepo.save(nuevaRed);
        }

        // NOTA con dedup — igual que UPS
        if (bitacoraStr) {
          const descripcionNota = `Observación desde Excel: ${bitacoraStr}`;
          const yaExiste = await bitacoraRepo
            .createQueryBuilder("b")
            .where("b.ASSET_ID = :id", { id: existing.id })
            .andWhere("b.descripcion = :desc", { desc: descripcionNota })
            .getOne();
          if (!yaExiste) {
            await bitacoraRepo.save(bitacoraRepo.create({
              asset:      { id: existing.id } as any,
              autor,
              tipoEvento: "NOTA",
              descripcion: descripcionNota,
            }));
          }
        }

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
//
// Llave de búsqueda: serial.
//
// Para registros EXISTENTES:
//   - Sub-entidad Ups (serial, placa, modelo, estado): NO SE TOCA
//   - propietario, custodio, ubicacion en Asset: solo si null en BD
//   - nombre en Asset: solo si null en BD (UPS puede tener nombre cambiado)
//
// [B10] NUEVO: columna 'Bitacora' del Excel → insertar como registro BITACORA
//   tipo "NOTA", vinculado al Asset del UPS.
//   Para evitar duplicados en reimportaciones: verifica que no exista ya
//   una nota con exactamente el mismo texto para ese asset.
//
// UPS NO tiene columna Código de Servicio en el Excel.
// ─────────────────────────────────────────────────────────────────────────────
async function importarUps(
  workbook: XLSX.WorkBook,
  autor: string,
  resumen: Resumen
): Promise<void> {
  const sheet = workbook.Sheets["InventarioUPS"];
  if (!sheet) {
    console.warn("⚠️  Hoja InventarioUPS no encontrada");
    return;
  }
  const rows = parseSheet(sheet);
  console.log(`   → ${rows.length} filas leídas de InventarioUPS`);

  for (const row of rows) {
    const serial = toStr(row["Serial"]);
    if (!serial) continue;

    const nombre           = toStr(row["Nombre del Equipo"]);
    const propietarioExcel = toStr(row["Propietario"]);
    const custodioExcel    = toStr(row["Custodio"]);
    const ubicacionExcel   = toStr(row["Ubicación"]);
    // [B10] Columna de bitácora
    const bitacoraTexto    = toStr(row["Bitacora"]);

    try {
      // ── BÚSQUEDA por serial ────────────────────────────────────────────────
      const candidates = await assetRepo.find({
        where: { tipo: "UPS" } as any,
        relations: ["ups"],
      }) as (Asset & { ups: Ups })[];

      let existing: (Asset & { ups: Ups }) | null =
        candidates.find((a) => a.ups?.serial === serial) || null;

      // ── CREACIÓN ──────────────────────────────────────────────────────────
      if (!existing) {
        const asset = assetRepo.create({
          tipo:        "UPS",
          nombre,
          ubicacion:   ubicacionExcel,
          propietario: propietarioExcel,
          custodio:    custodioExcel,
        });
        const savedAsset = await assetRepo.save(asset);

        const ups = upsRepo.create({
          serial,
          placa:  toStr(row["Placa"]),
          modelo: toStr(row["Modelo"]),
          estado: toStr(row["Estado"]),
          asset: { id: savedAsset.id } as any,
        });
        await upsRepo.save(ups);

        // [B10] Bitácora: importación + nota del Excel si existe
        const descripcion = bitacoraTexto
          ? `Importado desde Excel. Observación: ${bitacoraTexto}`
          : "Importado desde Excel.";

        const bitacora = bitacoraRepo.create({
          asset:       { id: savedAsset.id } as any,
          autor,
          tipoEvento:  "IMPORTACION",
          descripcion,
        });
        await bitacoraRepo.save(bitacora);

        resumen.creados++;

      // ── ACTUALIZACIÓN ─────────────────────────────────────────────────────
      } else {
        // ── ASSET: solo rellenar lo que esté vacío ──────────────────────────
        let assetModificado = false;

        // nombre: solo si está vacío en BD (para UPS con nombre reciente)
        if (nombre && !existing.nombre) {
          existing.nombre = nombre;
          assetModificado = true;
        }
        if (propietarioExcel && !existing.propietario) {
          existing.propietario = propietarioExcel;
          assetModificado = true;
        }
        if (custodioExcel && !existing.custodio) {
          existing.custodio = custodioExcel;
          assetModificado = true;
        }
        if (ubicacionExcel && !existing.ubicacion) {
          existing.ubicacion = ubicacionExcel;
          assetModificado = true;
        }
        // codigoServicio: UPS no tiene esta columna en el Excel → no tocar

        if (assetModificado) {
          await assetRepo.save(existing);
        }

        // Sub-entidad Ups (serial, placa, modelo, estado): NO SE TOCA

        // [B10] Bitácora del Excel: agregar solo si hay texto Y no existe ya esa nota exacta
        if (bitacoraTexto) {
          const descripcionNota = `Observación desde Excel: ${bitacoraTexto}`;

          // Verificar duplicado: buscar nota con ese texto exacto para este asset
          const yaExiste = await bitacoraRepo.findOne({
            where: {
              asset:       { id: existing.id } as any,
              descripcion: descripcionNota,
            } as any,
          });

          if (!yaExiste) {
            const notaBitacora = bitacoraRepo.create({
              asset:       { id: existing.id } as any,
              autor,
              tipoEvento:  "NOTA",
              descripcion: descripcionNota,
            });
            await bitacoraRepo.save(notaBitacora);
          }
        }

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
//
// Llave de búsqueda: nombre + servidor1 (desempate).
//
// Para registros EXISTENTES:
//   - propietario, custodio: solo si null en BD
//   - BaseDatos.fechaFinalSoporte: solo si null en BD
//   - BaseDatos.contratoQueSoporta: solo si null en BD
//   - Resto de campos de BaseDatos: NO SE TOCAN
//
// CORRECCIÓN B6: 'Nombre del Base de Datos' (antes 'Nombre')
// CORRECCIÓN B7: 'Aplicación que soporta' (antes 'Aplicación que Soporta')
// ─────────────────────────────────────────────────────────────────────────────
async function importarBD(
  workbook: XLSX.WorkBook,
  autor: string,
  resumen: Resumen
): Promise<void> {
  const sheet = workbook.Sheets["InventarioBD"];
  if (!sheet) {
    console.warn("⚠️  Hoja InventarioBD no encontrada");
    return;
  }
  const rows = parseSheet(sheet);
  console.log(`   → ${rows.length} filas leídas de InventarioBD`);

  for (const row of rows) {
    // [B6] Nombre de columna corregido
    const nombre = toStr(row["Nombre del Base de Datos"]);
    if (!nombre) continue;

    const servidor1            = toStr(row["Servidor 1"]);
    const propietarioExcel     = toStr(row["Propietario"]);
    const custodioExcel        = toStr(row["Custodio"]);
    const contratoExcel        = toStr(row["Contrato que lo soporta"]);
    const fechaFinalSoporteExcel = toDate(row["Fecha Final de soporte"]);

    try {
      // ── BÚSQUEDA: nombre + servidor1 como desempate ────────────────────────
      let existing: (Asset & { baseDatos: BaseDatos }) | null = null;

      existing = await assetRepo.findOne({
        where: { tipo: "BASE_DATOS", nombre } as any,
        relations: ["baseDatos"],
      }) as (Asset & { baseDatos: BaseDatos }) | null;

      // Desempate por servidor1 (si ambos tienen valor y no coinciden, no es el mismo)
      if (existing && servidor1 && existing.baseDatos?.servidor1 &&
          existing.baseDatos.servidor1 !== servidor1) {
        existing = null;
      }

      // ── CREACIÓN ──────────────────────────────────────────────────────────
      if (!existing) {
        const asset = assetRepo.create({
          tipo:        "BASE_DATOS",
          nombre,
          propietario: propietarioExcel,
          custodio:    custodioExcel,
        });
        const savedAsset = await assetRepo.save(asset);

        const baseDatos = bdRepo.create({
          servidor1,
          servidor2:          toStr(row["Servidor 2"]),
          racScan:            toStr(row["Rac-Scan"]),
          ambiente:           toStr(row["Ambiente"]),
          // [B7] Nombre de columna corregido
          appSoporta:         toStr(row["Aplicación que soporta"]),
          versionBd:          toStr(row["Version de BD"]),
          fechaFinalSoporte:  fechaFinalSoporteExcel,
          contenedorFisico:   toStr(row["Contenedor Fisico"]),
          contratoQueSoporta: contratoExcel,
          asset: { id: savedAsset.id } as any,
        });
        await bdRepo.save(baseDatos);

        const bitacora = bitacoraRepo.create({
          asset:       { id: savedAsset.id } as any,
          autor,
          tipoEvento:  "IMPORTACION",
          descripcion: "Importado desde Excel.",
        });
        await bitacoraRepo.save(bitacora);

        resumen.creados++;

      // ── ACTUALIZACIÓN ─────────────────────────────────────────────────────
      } else {
        const bdActual = await bdRepo.findOne({
          where: { asset: { id: existing.id } } as any,
        });

        // ── ASSET: solo rellenar lo que esté vacío ──────────────────────────
        let assetModificado = false;

        if (propietarioExcel && !existing.propietario) {
          existing.propietario = propietarioExcel;
          assetModificado = true;
        }
        if (custodioExcel && !existing.custodio) {
          existing.custodio = custodioExcel;
          assetModificado = true;
        }
        // BD no tiene codigoServicio en el Excel → no tocar

        if (assetModificado) {
          await assetRepo.save(existing);
        }

        // ── BASE_DATOS: solo rellenar lo que esté null ──────────────────────
        if (bdActual) {
          const bdUpdates: Partial<BaseDatos> = {};

          // fechaFinalSoporte: solo si null en BD (campo que aparece como '-' en la app)
          if (fechaFinalSoporteExcel && !bdActual.fechaFinalSoporte) {
            bdUpdates.fechaFinalSoporte = fechaFinalSoporteExcel;
          }
          // contratoQueSoporta: solo si null en BD
          if (contratoExcel && !bdActual.contratoQueSoporta) {
            bdUpdates.contratoQueSoporta = contratoExcel;
          }
          // servidor1, servidor2, racScan, ambiente, appSoporta,
          // versionBd, contenedorFisico: NO SE TOCAN

          if (Object.keys(bdUpdates).length > 0) {
            await bdRepo.update(
              { asset: { id: existing.id } } as any,
              bdUpdates
            );
          }
        } else {
          // No existe sub-entidad BaseDatos: crearla con todos los datos del Excel
          const nuevaBD = bdRepo.create({
            servidor1,
            servidor2:          toStr(row["Servidor 2"]),
            racScan:            toStr(row["Rac-Scan"]),
            ambiente:           toStr(row["Ambiente"]),
            appSoporta:         toStr(row["Aplicación que soporta"]),
            versionBd:          toStr(row["Version de BD"]),
            fechaFinalSoporte:  fechaFinalSoporteExcel,
            contenedorFisico:   toStr(row["Contenedor Fisico"]),
            contratoQueSoporta: contratoExcel,
            asset: { id: existing.id } as any,
          });
          await bdRepo.save(nuevaBD);
        }

        resumen.actualizados++;
      }
    } catch (e: any) {
      console.error(`  ❌ BD "${nombre}": ${e.message}`);
      resumen.errores++;
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// VPN — sin cambios respecto a la versión anterior (no fue parte del análisis)
// ─────────────────────────────────────────────────────────────────────────────

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
  return partes ? partes.join(".") : s;
}

function parsearConexion(raw: unknown): string | null {
  if (raw === null || raw === undefined || raw === "") return null;
  if (typeof raw === "number") return reconstruirIP(raw);
  const s = String(raw).trim();
  if (!s || s.toUpperCase() === "N/A") return null;
  return s;
}

function limpiarValorVPN(s: string): string | null {
  if (!s) return null;
  const limpio = s.trim();
  if (limpio.toUpperCase().startsWith("N/A")) return null;
  return limpio || null;
}

function parsearOrigenDestino(raw: unknown): { origen: string | null; destino: string | null } {
  if (raw === null || raw === undefined) return { origen: null, destino: null };
  const s = String(raw).trim();
  if (!s) return { origen: null, destino: null };
  const sepIdx = s.indexOf(", Destino:");
  if (sepIdx === -1) {
    return { origen: limpiarValorVPN(s.replace(/^Origen:\s*/i, "")), destino: null };
  }
  const origenPart  = s.slice(0, sepIdx).replace(/^Origen:\s*/i, "").trim();
  const destinoPart = s.slice(sepIdx + 2).replace(/^Destino:\s*/i, "").trim();
  return {
    origen:  limpiarValorVPN(origenPart),
    destino: limpiarValorVPN(destinoPart),
  };
}

async function importarVPN(
  workbook: XLSX.WorkBook,
  autor: string,
  resumen: Resumen
): Promise<void> {
  const sheet = workbook.Sheets["Export"];
  if (!sheet) {
    // Silencioso: el archivo de inventario no tiene hoja Export, es esperado
    return;
  }

  const filas = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: null,
    raw:    true,
  }) as unknown[][];

  const FILA_INICIO = 2;
  let procesadas = 0;

  for (let i = FILA_INICIO; i < filas.length; i++) {
    const fila    = filas[i];
    const numFila = i + 1;

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
        const asset = assetRepo.create({ tipo: "VPN", nombre });
        const savedAsset = await assetRepo.save(asset);

        const vpn = vpnRepo.create({
          ...datosVpn,
          asset: { id: savedAsset.id } as any,
        });
        await vpnRepo.save(vpn);

        const bitacora = bitacoraRepo.create({
          asset:       { id: savedAsset.id } as any,
          autor,
          tipoEvento:  "IMPORTACION",
          descripcion: "VPN importada desde Excel.",
        });
        await bitacoraRepo.save(bitacora);
        resumen.creados++;
      } else {
        const vpn = await vpnRepo.findOne({
          where: { asset: { id: existing.id } } as any,
        });
        if (vpn) {
          await vpnRepo.update({ asset: { id: existing.id } } as any, datosVpn);
        } else {
          const newVpn = vpnRepo.create({
            asset: { id: existing.id } as any,
            ...datosVpn,
          });
          await vpnRepo.save(newVpn);
        }

        const bitacora = bitacoraRepo.create({
          asset:       { id: existing.id } as any,
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

  console.log("📂 VPN (Export)...");
  await importarVPN(workbook, autor, resumen);

  console.log("\n─────────────────────────────────");
  console.log(`✅ Creados:      ${resumen.creados}`);
  console.log(`🔄 Actualizados: ${resumen.actualizados}`);
  console.log(`❌ Errores:      ${resumen.errores}`);
  console.log("─────────────────────────────────");

  return resumen;
}