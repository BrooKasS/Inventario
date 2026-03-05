// src/utils/exporters.ts
import type { Asset } from "../types";

/** Mapea label por tipo (singular) para exportes */
const TIPO_LABEL_SINGULAR: Record<string, string> = {
  SERVIDOR:   "Servidor",
  BASE_DATOS: "Base de Datos",
  RED:        "Red",
  UPS:        "UPS",
};

/** Aplana los activos a filas planas para exportación */
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
        "Sistema Operativo": s.sistemaOperativo ?? "",
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

/** Exporta a Excel usando SheetJS */
export async function exportarActivosExcel(assets: Asset[], nombre: string) {
  const XLSX = await import("xlsx");
  const filas = prepararFilasActivos(assets);
  const ws = XLSX.utils.json_to_sheet(filas);

  // ancho general
  ws["!cols"] = Object.keys(filas[0] || {}).map(() => ({ wch: 22 }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Activos");
  XLSX.writeFile(wb, `Activos_${nombre}_${fechaArchivo()}.xlsx`);
}

/** Exporta a PDF usando jsPDF + autoTable */
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
  Tipo: string;
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

/** Exporta Observaciones (Bitácora) a Excel */
export async function exportarObservacionesExcel(rows: ObservacionRow[], nombre: string) {
  if (!rows.length) return;
  const XLSX = await import("xlsx");
  const ws = XLSX.utils.json_to_sheet(rows);

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

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Observaciones");
  XLSX.writeFile(wb, `Observaciones_${nombre}_${fechaArchivo()}.xlsx`);
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