// src/utils/exporters.ts
import type { Asset } from "../types";

/** Mapea label por tipo (singular) para exportes */
const TIPO_LABEL_SINGULAR: Record<string, string> = {
  SERVIDOR:   "Servidor",
  BASE_DATOS: "Base de Datos",
  RED:        "Red",
  UPS:        "UPS",
};

/** NUEVO: Mapa de labels en plural para nombrar las hojas del Excel */
const TIPO_LABEL_PLURAL: Record<string, string> = {
  SERVIDOR:   "Servidores",
  BASE_DATOS: "Bases de Datos",
  RED:        "Red",
  UPS:        "UPS",
};


function prepararFilasActivos(assets: Asset[]) {
  return assets.map((a) => {
    const base = {
      ID: a.id,
      Tipo: TIPO_LABEL_SINGULAR[a.tipo] ?? a.tipo,
      Nombre: a.nombre ?? "",
      Ubicación: a.ubicacion ?? "",
      "Código de Servicio": a.codigoServicio ?? "",
      Propietario: a.propietario ?? "",
      Custodio: a.custodio ?? "",
      "Actualizado En": a.actualizadoEn
        ? new Date(a.actualizadoEn).toLocaleString("es-CO")
        : "",
    };

    if (a.tipo === "SERVIDOR" && a.servidor) {
      const s = a.servidor;
      return {
        ...base,
        "IP Interna": s.ipInterna ?? "",
        "IP Gestión": s.ipGestion ?? "",
        "IP Servicio": s.ipServicio ?? "",
        vCPU: s.vcpu ?? "",
        "vRAM (MB)": s.vramMb ?? "",
        "Sistema Operativo": s.sistemaOperativo ?? s.sistemaOperativo ?? "", 
        Ambiente: s.ambiente ?? "",
        "Tipo Servidor": s.tipoServidor ?? "",
        "App Soporta": s.appSoporta ?? "",
        Monitoreo: s.monitoreo ?? "",
        Backup: s.backup ?? "",
        "Rutas Backup": s.rutasBackup ?? "",
        "Fin Soporte": s.fechaFinSoporte ?? "",
        "Contrato Soporte": s.contratoQueSoporta ?? "",
      };
    }

    if (a.tipo === "BASE_DATOS" && a.baseDatos) {
      const b = a.baseDatos;
      return {
        ...base,
        "Servidor 1": b.servidor1 ?? "",
        "Servidor 2": b.servidor2 ?? "",
        "RAC/Scan": b.racScan ?? "",
        Ambiente: b.ambiente ?? "",
        "App Soporta": b.appSoporta ?? "",
        "Versión BD": b.versionBd ?? "",
        "Fin Soporte": b.fechaFinalSoporte ?? "",
        "Contenedor Físico": b.contenedorFisico ?? "",
        "Contrato Soporte": b.contratoQueSoporta ?? "",
      };
    }

    if (a.tipo === "RED" && a.red) {
      const r = a.red; 
      return {
        ...base,
        Serial: r.serial ?? "",
        MAC: r.mac ?? "",
        Modelo: r.modelo ?? "",
        "IP Gestión": r.ipGestion ?? "",
        Estado: r.estado ?? "",
        "Fin Soporte": r.fechaFinSoporte ?? "",
        "Contrato Soporte": r.contratoQueSoporta ?? "",
      };
    }

    if (a.tipo === "UPS" && a.ups) {
      const u = a.ups;
      return {
        ...base,
        Serial: u.serial ?? "",
        Placa: u.placa ?? "",
        Modelo: u.modelo ?? "",
        Estado: u.estado ?? "",
      };
    }

    return base;
  });
}

/** YYYY-MM-DD */
function fechaArchivo() {
  return new Date().toISOString().slice(0, 10);
}

/** Excel: crea hoja con ancho estándar por columnas del primer row */
function aplicarAnchosSheetJS(ws: any, rows: any[], wch = 22) {
  ws["!cols"] = Object.keys(rows[0] || {}).map(() => ({ wch }));
}

/** Segura para nombres de hoja (<=31 chars y sin caracteres inválidos) */
function nombreHojaSeguro(name: string) {
  const invalid = /[\\/?*[\]:]/g; // Excel no permite estos
  const cleaned = name.replace(invalid, " ");
  return cleaned.slice(0, 31).trim() || "Hoja";
}

/** Exporta a Excel usando SheetJS — separado por hojas por tipo */
export async function exportarActivosExcel(assets: Asset[], nombre: string): Promise<void> {
  if (assets.length === 0) return;

  const ids   = assets.map(a => a.id);
  const tipos = [...new Set(assets.map(a => a.tipo))];
  const fecha = new Date().toISOString().slice(0, 10);

 const res = await fetch("http://localhost:3000/api/assets/export-excel", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${localStorage.getItem("inventario_token")}`,
  },
  body: JSON.stringify({ ids, tipos }),
});

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Error generando el Excel");
  }

  const blob = await res.blob();
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = `Inventario_TI_${nombre}_${fecha}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(blobUrl);
}
/** Exporta a PDF usando jsPDF + autoTable (SIN cambios: una sola salida) */
export async function exportarActivosPDF(assets: Asset[], nombre: string) {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  const filas = prepararFilasActivos(assets);
  const headers = Object.keys(filas[0] || {});
  const body = filas.map((row) => headers.map((h) => (row as any)[h]));

  // Encabezado sencillo
  doc.setFillColor(134, 31, 65);
  doc.rect(0, 0, 297, 18, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(`Exporte de Activos – ${nombre}`, 12, 11);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Generado: ${new Date().toLocaleString("es-CO")}`, 297 - 12, 11, { align: "right" });

  autoTable(doc, {
    startY: 24,
    head: [headers],
    body,
    styles: { font: "helvetica", fontSize: 8, cellPadding: 2, overflow: "linebreak" },
    headStyles: { fillColor: [183, 49, 44], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [253, 248, 248] },
    columnStyles: {},
    didDrawPage: (data: any) => {
      const pageCount = (doc as any).internal.getNumberOfPages();
      doc.setFontSize(7);
      doc.setTextColor(160);
      doc.text(
        `Página ${data.pageNumber} de ${pageCount} · Inventario TI`,
        297 / 2,
        210 - 5,
        { align: "center" }
      );
    },
  });

  doc.save(`Activos_${nombre}_${fechaArchivo()}.pdf`);
}

/* ─────────────────────────────────────────── */
/*               OBSERVACIONES                 */
/* ─────────────────────────────────────────── */

const EVENTO_LABEL: Record<string, string> = {
  IMPORTACION: "Importación",
  CAMBIO_CAMPO: "Cambio de campo",
  MANTENIMIENTO: "Mantenimiento",
  INCIDENTE: "Incidente",
  NOTA: "Nota",
};

export type ObservacionRow = {
  Activo: string;
  Tipo: string;           // <- Se usa para agrupar por hoja
  Código: string;
  Ubicación?: string;
  Fecha: string;
  Autor: string;
  "Tipo de evento": string;
  Descripción: string;
  "Campo modificado": string;
  "Valor anterior": string;
  "Valor nuevo": string;
};

/** Excel: aplica anchos específicos para Observaciones */
function setColsObservaciones(ws: any) {
  ws["!cols"] = [
    { wch: 26 }, // Activo
    { wch: 16 }, // Tipo
    { wch: 18 }, // Código
    { wch: 24 }, // Ubicación
    { wch: 22 }, // Fecha
    { wch: 18 }, // Autor
    { wch: 18 }, // Tipo de evento
    { wch: 60 }, // Descripción
    { wch: 24 }, // Campo modificado
    { wch: 22 }, // Valor anterior
    { wch: 22 }, // Valor nuevo
  ];
}

export async function exportarObservacionesExcel(
  rows: ObservacionRow[],
  nombre: string,
  incluirTecnicos = false   // ← nuevo parámetro opcional
): Promise<void> {
  if (!rows.length) return;
 
  const fecha = new Date().toISOString().slice(0, 10);
 
 const res = await fetch("http://localhost:3000/api/assets/export-observaciones", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${localStorage.getItem("inventario_token")}`,
  },
  body: JSON.stringify({ rows, incluirTecnicos }),
});
 
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Error generando el Excel de observaciones");
  }
 
  const blob    = await res.blob();
  const blobUrl = URL.createObjectURL(blob);
  const a       = document.createElement("a");
  a.href        = blobUrl;
  a.download    = `Observaciones_${nombre}_${fecha}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(blobUrl);
}

/** Exporta Observaciones (Bitácora) a PDF */
export async function exportarObservacionesPDF(rows: ObservacionRow[], nombre: string) {
  if (!rows.length) return;

  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  // Encabezado
  doc.setFillColor(134, 31, 65); // #861F41
  doc.rect(0, 0, 297, 18, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(`Observaciones – ${nombre}`, 12, 11);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Generado: ${new Date().toLocaleString("es-CO")}`, 297 - 12, 11, { align: "right" });

  const headers = [
    "Activo", "Tipo", "Código", "Ubicación", "Fecha", "Autor",
    "Tipo de evento", "Descripción", "Campo modificado", "Valor anterior", "Valor nuevo",
  ];
  const body = rows.map(r => [
    r.Activo, r.Tipo, r.Código, r.Ubicación ?? "",
    r.Fecha, r.Autor, r["Tipo de evento"], r.Descripción,
    r["Campo modificado"], r["Valor anterior"], r["Valor nuevo"],
  ]);

  autoTable(doc, {
    startY: 24,
    head: [headers],
    body,
    styles: { font: "helvetica", fontSize: 8, cellPadding: 2, overflow: "linebreak" },
    headStyles: { fillColor: [183, 49, 44], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [253, 248, 248] },
    columnStyles: {
      0: { cellWidth: 36 }, // Activo
      1: { cellWidth: 20 }, // Tipo
      2: { cellWidth: 22 }, // Código
      3: { cellWidth: 28 }, // Ubicación
      4: { cellWidth: 26 }, // Fecha
      5: { cellWidth: 20 }, // Autor
      6: { cellWidth: 24 }, // Tipo de evento
      7: { cellWidth: 90 }, // Descripción
      8: { cellWidth: 28 }, // Campo modificado
      9: { cellWidth: 26 }, // Valor anterior
      10:{ cellWidth: 26 }, // Valor nuevo
    },
    didDrawPage: (data: any) => {
      const pageCount = (doc as any).internal.getNumberOfPages();
      doc.setFontSize(7);
      doc.setTextColor(160);
      doc.text(
        `Página ${data.pageNumber} de ${pageCount} · Inventario TI`,
        297 / 2,
        210 - 5,
        { align: "center" }
      );
    },
  });

  doc.save(`Observaciones_${nombre}_${fechaArchivo()}.pdf`);
}