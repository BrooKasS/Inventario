de la mejor manera posible. RESPUESTA DEFINITIVA

16:02
CONTEXTO VAULTIS — BUG codigoServicio + Import Update
STACK
Node.js + Express + TypeScript + TypeORM 0.3.28 + Oracle. Una sola BD Oracle compartida local/prod. synchronize=true local, false prod.

PROBLEMA 1 — Edit no guarda codigoServicio
codigoServicio vive en entidad Asset (tabla ASSETS), no en Servidor.
Causa: En asset.service.ts → updateAsset(), el bloque que mapea campos de Asset a updates tiene nombre, ubicacion, pero le falta codigoServicio, propietario y custodio.
El frontend los manda, el service los ignora silenciosamente. Oracle nunca recibe el UPDATE.

Fix — único archivo: asset.service.ts
Busca el bloque con if (data.nombre !== undefined y agrega INMEDIATAMENTE después:

typescript
if (data.codigoServicio !== undefined && data.codigoServicio !== asset.codigoServicio) {
  updates.codigoServicio = data.codigoServicio;
  bitacoraEntries.push({ campoModificado: "codigoServicio", valorAnterior: asset.codigoServicio, valorNuevo: data.codigoServicio });
}
if (data.propietario !== undefined && data.propietario !== asset.propietario) {
  updates.propietario = data.propietario;
  bitacoraEntries.push({ campoModificado: "propietario", valorAnterior: asset.propietario, valorNuevo: data.propietario });
}
if (data.custodio !== undefined && data.custodio !== asset.custodio) {
  updates.custodio = data.custodio;
  bitacoraEntries.push({ campoModificado: "custodio", valorAnterior: asset.custodio, valorNuevo: data.custodio });
}
Verificar también que propietario y custodio no estén ya más abajo en el mismo bloque para no duplicar.

PROBLEMA 2 — Import Excel no actualiza codigoServicio en registros existentes
Contexto importador (backend/src/importer/importExcel.ts)
Servidores — llave de búsqueda actual: nombre exacto + verificación IP.

typescript
// Busca por nombre, luego verifica que ipInterna coincida
existing = await assetRepo.findOne({ where: { tipo:"SERVIDOR", nombre: nombreFinal } })
if (existing && existing.servidor?.ipInterna !== ipInterna) existing = null;
Problema: Si el nombre cambió en el Excel (tilde, mayúscula, typo), no encuentra el registro → lo crea duplicado en vez de actualizar → codigoServicio nunca se escribe en el existente.

Bloque else (actualización) actual — servidores:

typescript
await servidorRepo.update({ asset: { id: existing.id } }, datosServidor);
existing.ubicacion = toStr(row["Ubicación"]);
existing.codigoServicio = toStr(row["Código de Servicio"]); // YA ESTÁ
await assetRepo.save(existing);
codigoServicio ya se escribe — pero solo llega aquí si la búsqueda encontró el registro. El bug real es la búsqueda frágil por nombre.

Redes — bloque else ya tiene existing.codigoServicio. Igual, depende de que la búsqueda matchee.

UPS — bloque else NO tiene codigoServicio. Hay que agregarlo.

Fix importador — 2 cambios:
CAMBIO A — Lógica de búsqueda servidores (buscar primero por IP, más confiable):

typescript
let existing: (Asset & { servidor: Servidor }) | null = null;

// 1. Primero por IP interna (campo único y estable)
if (ipInterna) {
  const candidates = await assetRepo.find({
    where: { tipo: "SERVIDOR" },
    relations: ["servidor"],
  });
  existing = candidates.find(a => a.servidor?.ipInterna === ipInterna) as any || null;
}

// 2. Fallback por nombre exacto si no encontró por IP
if (!existing && nombreFinal) {
  existing = await assetRepo.findOne({
    where: { tipo: "SERVIDOR", nombre: nombreFinal } as any,
    relations: ["servidor"],
  }) as any;
}
CAMBIO B — Bloque else servidores, actualizar TODOS los campos Asset:

typescript
} else {
  await servidorRepo.update({ asset: { id: existing.id } } as any, datosServidor);

  // Solo pisa si Excel trae valor (no borrar datos existentes con vacíos)
  existing.codigoServicio = toStr(row["Código de Servicio"]) || existing.codigoServicio;
  existing.ubicacion      = toStr(row["Ubicación"])          || existing.ubicacion;
  existing.propietario    = toStr(row["Propietario"])        || existing.propietario;
  existing.custodio       = toStr(row["Custodio"])           || existing.custodio;
  await assetRepo.save(existing);
  resumen.actualizados++;
}
CAMBIO C — Bloque else UPS, agregar codigoServicio:

typescript
existing.codigoServicio = toStr(row["Código de Servicio"]) || existing.codigoServicio;
existing.ubicacion   = toStr(row["Ubicación"])   || existing.ubicacion;
existing.propietario = toStr(row["Propietario"]) || existing.propietario;
existing.custodio    = toStr(row["Custodio"])    || existing.custodio;
await assetRepo.save(existing);
ADVERTENCIA CRÍTICA — Nombre exacto de columna Excel
toStr(row["Código de Servicio"]) devuelve "" si la columna en el Excel se llama diferente (sin tilde, espacios extra, etc.). Antes de ejecutar, confirmar nombre exacto de columna haciendo un console.log(Object.keys(rows[0])) al inicio de importarServidores y verificar en los logs de PM2.

ARCHIVOS A TOCAR — RESUMEN
Archivo	Cambio
backend/src/api/services/asset.service.ts	Agregar codigoServicio, propietario, custodio en bloque updates de updateAsset
backend/src/importer/importExcel.ts	Cambio A: búsqueda por IP primero en servidores
backend/src/importer/importExcel.ts	Cambio B: bloque else servidores completo
backend/src/importer/importExcel.ts	Cambio C: bloque else UPS agregar campos Asset
ORDEN DE EJECUCIÓN
Fix asset.service.ts → probar edit desde frontend → confirmar que guarda
Agregar console.log(Object.keys(rows[0])) en importExcel → subir → hacer import de prueba → revisar logs PM2 → confirmar nombre columna
Aplicar cambios A+B+C en importExcel → build → reimportar Excel
REGLA CRÍTICA
synchronize=false en prod. Estos cambios son solo lógica, no entidades. No se crean ni alteran tablas. Seguro deployar directamente.


revisa bien todo, no dñar absolutamente nada, OBJETIVO FINAL REVISADO — Import (reemplaza Cambios B y C)
La lógica NO debe tocar ningún campo de registros existentes excepto codigoServicio, y solo si está null o vacío en BD. Todo lo demás intacto — ni datosServidor, ni ubicacion, ni custodio, ni nada.
typescript// Bloque else SERVIDORES — reemplazar completamente
} else {
  if (!existing.codigoServicio) {
    existing.codigoServicio = toStr(row["Código de Servicio"]) || null;
    await assetRepo.save(existing);
  }
  resumen.actualizados++;
}

// Bloque else REDES — solo agregar:
if (!existing.codigoServicio) {
  existing.codigoServicio = toStr(row["Código de Servicio"]) || null;
  await assetRepo.save(existing);
}

// Bloque else UPS — igual:
if (!existing.codigoServicio) {
  existing.codigoServicio = toStr(row["Código de Servicio"]) || null;
  await assetRepo.save(existing);
}
Cambio A (búsqueda por IP en servidores) sigue igual — es necesario para encontrar el registro.
Pendiente confirmar: nombre exacto de columna en Excel ("Código de Servicio" con tilde). Pasar Excel en la nueva conversación antes de ejecutar nada.
Tengo todo. Análisis completo y definitivo:

AGRÉGALE ESTO AL FINAL DEL PROMPT para la nueva conversación:

ANÁLISIS EXCEL REAL — CRÍTICO
Nombres exactos de columnas (con espacios invisibles confirmados con repr())
InventarioServidores (fila 8 = headers, datos desde fila 9, 191 filas):
col 0:  'Nombre del Servidor'
col 1:  'Propietario'
col 2:  'Custodio'
col 3:  'Monitoreo'
col 4:  'Backup'
col 5:  'Dirección IP'
col 6:  'IP de Gestion'
col 7:  ' IP de Servicio'        ← ESPACIO AL INICIO
col 8:  'Código de Servicio '    ← ESPACIO AL FINAL
col 9:  'Ambiente'
col 10: 'Tipo de Servidor'
col 11: 'Aplicación que soporta'
col 12: 'Ubicación'
col 13: 'vCPU'
col 14: 'vRAM'
col 15: 'Sistema Operativo'
col 16: 'Fecha Fin Soporte'
col 17: 'Rutas de Backup'
col 18: 'Contrato que lo soporta'   ← IMPORTER USA 'Contrato Asociado' = BUG ACTIVO
col 19: 'Bitacora'
InventarioRedes (fila 8 = headers, 98 filas, todas con datos completos):
col 1:  'Nombre del Equipo'
col 2:  'Serial'
col 3:  'Mac'
col 4:  'Modelo'
col 5:  'Fecha Fin de soporte'      ← IMPORTER USA 'Fecha Fin Soporte' = BUG ACTIVO
col 6:  'IP de Gestion'
col 7:  'Estado'
col 8:  'Código de Servicio '       ← ESPACIO AL FINAL
col 9:  'Ubicación'
col 10: 'Propietario'
col 11: 'Custodio'
col 12: 'Contrato que lo soporta'   ← IMPORTER USA 'Contrato Asociado' = BUG ACTIVO
col 13: 'Bitacora'
InventarioUPS (fila 8 = headers, 39 filas):
col 1: 'Nombre del Equipo'
col 2: 'Propietario'
col 3: 'Custodio'
col 4: 'Serial'
col 5: 'Placa'
col 6: 'Modelo'
col 7: 'Estado'
col 8: 'Ubicación'
col 9: 'Bitacora'
← NO TIENE COLUMNA Código de Servicio — UPS no actualiza código nunca
InventarioBD (fila 8 = headers):
col 1:  'Nombre del Base de Datos'
col 2:  'Propietario'
col 3:  'Custodio'
col 4:  'Servidor 1'
col 5:  'Servidor 2'
col 6:  'Rac-Scan'
col 7:  'Ambiente'
col 8:  'Aplicación que soporta'
col 9:  'Version de BD'
col 10: 'Fecha Final de soporte'
col 11: 'Contenedor Fisico'
col 12: 'Contrato que lo soporta'
← NO TIENE Código de Servicio

Estadísticas de datos
HojaTotalCon Código ServicioSin IPServidores191188 (solo 2 sin código)18Redes9898 (todos completos)—UPS39N/A (no existe col)—
Hay 1 IP duplicada en Excel: 10.10.2.40 aparece 2 veces — el fix por IP debe manejar este caso.
Los 18 servidores sin IP sí tienen nombre único y código de servicio — el fallback por nombre los cubre correctamente.

Bugs activos en importExcel.ts descubiertos por análisis Excel
BUG A — contratoQueSoporta nunca importa en ninguna hoja:
typescript// Importer usa:
contratoQueSoporta: toStr(row["Contrato Asociado"]),  // → siempre ""
// Excel tiene: 'Contrato que lo soporta'
// Fix:
contratoQueSoporta: toStr(row["Contrato que lo soporta"]),
BUG B — ipServicio nunca importa en Servidores:
typescript// Importer usa:
ipServicio: toStr(row["IP de Servicio"]),   // → siempre ""
// Excel tiene: ' IP de Servicio' (espacio al inicio)
// Fix:
ipServicio: toStr(row[" IP de Servicio"]),
// O mejor, hacer trim en parseSheet o usar toStr que ya hace trim si lo tiene
BUG C — fechaFinSoporte nunca importa en Redes:
typescript// Importer usa:
fechaFinSoporte: toDate(row["Fecha Fin Soporte"]),  // → siempre null
// Excel tiene: 'Fecha Fin de soporte'
// Fix:
fechaFinSoporte: toDate(row["Fecha Fin de soporte"]),
BUG D — Código de Servicio  tiene espacio final — depende de si parseSheet hace trim:
Si parseSheet usa XLSX.utils.sheet_to_json sin raw:false, los nombres de columna se leen exactamente como están. Confirmar si toStr(row["Código de Servicio"]) devuelve "" → si sí, cambiar a toStr(row["Código de Servicio "]) (con espacio) O agregar .trim() a las keys en parseSheet.

Objetivo final — qué actualizar en registros existentes (sin tocar nada más)
Servidores (buscar primero por IP, fallback nombre):

Solo si !existing.codigoServicio: actualizar codigoServicio
No tocar ningún otro campo

Redes (buscar por nombre + serial como está):

Solo si !existing.codigoServicio: actualizar codigoServicio
No tocar ningún otro campo

UPS: No aplica, Excel no tiene la columna.
BD: No aplica, Excel no tiene la columna.

Archivos a tocar — definitivo
ArchivoCambiosasset.service.tsAgregar codigoServicio, propietario, custodio en bloque updates de updateAssetimportExcel.tsBug A: 'Contrato que lo soporta' en Servidores y RedesimportExcel.tsBug B: ' IP de Servicio' en ServidoresimportExcel.tsBug C: 'Fecha Fin de soporte' en RedesimportExcel.tsBug D: confirmar trim de keys o agregar espacio en 'Código de Servicio 'importExcel.tsCambio A: búsqueda por IP primero en ServidoresimportExcel.tsCambio bloque else: solo actualizar codigoServicio si !existing.codigoServicio
Regla absoluta: ningún campo existente se pisa. Solo se rellena lo que está null/vacío.

