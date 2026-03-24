import type { Asset, BitacoraEntry } from "../../types";
import { EVENTO_LABEL } from "./constants";

/** Formatea fecha para nombre de archivo */
export function fechaArchivo() {
  return new Date().toISOString().slice(0, 10);
}

/** Prepara filas para export */
export function prepararFilas(entries: BitacoraEntry[]) {
  return entries.map((e) => ({
    Fecha: new Date(e.creadoEn).toLocaleString("es-CO"),
    Autor: e.autor,
    "Tipo de evento": EVENTO_LABEL[e.tipoEvento] ?? e.tipoEvento,
    Descripción: e.descripcion,
    "Campo modificado": e.campoModificado ?? "",
    "Valor anterior": e.valorAnterior ?? "",
    "Valor nuevo": e.valorNuevo ?? "",
  }));
}

/** Export a Excel usando SheetJS (xlsx) */
export async function exportarExcel(
  entries: BitacoraEntry[],
  nombreActivo: string
) {
  const XLSX = await import("xlsx");
  const filas = prepararFilas(entries);
  const ws = XLSX.utils.json_to_sheet(filas);

  /* Ancho de columnas */
  ws["!cols"] = [
    { wch: 22 }, // Fecha
    { wch: 18 }, // Autor
    { wch: 18 }, // Tipo
    { wch: 50 }, // Descripción
    { wch: 20 }, // Campo
    { wch: 20 }, // Anterior
    { wch: 20 }, // Nuevo
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Bitácora");
  XLSX.writeFile(wb, `Bitacora_${nombreActivo}_${fechaArchivo()}.xlsx`);
}

/** Export a PDF usando jsPDF + autoTable */
export async function exportarPDF(
  entries: BitacoraEntry[],
  asset: Asset
) {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });
  const nombre = asset.nombre ?? "Activo";
  const tipo = asset.tipo.replace("_", " ");

  /* ── Encabezado ── */
  // Fondo degradado simulado con rectángulos
  doc.setFillColor(134, 31, 65); // #861F41
  doc.rect(0, 0, 297, 28, "F");
  doc.setFillColor(250, 130, 0); // #FA8200
  doc.rect(0, 0, 60, 28, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("BITÁCORA DE ACTIVO", 14, 11);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`${tipo}  ·  ${nombre}`, 14, 18);
  if (asset.ubicacion)
    doc.text(`📍 ${asset.ubicacion}`, 14, 24);

  doc.setFontSize(9);
  doc.text(`Generado: ${new Date().toLocaleString("es-CO")}`, 297 - 14, 18, {
    align: "right",
  });
  doc.text(`${entries.length} registro(s)`, 297 - 14, 24, {
    align: "right",
  });

  /* ── Tabla ── */
  const filas = entries.map((e) => [
    new Date(e.creadoEn).toLocaleString("es-CO"),
    e.autor,
    EVENTO_LABEL[e.tipoEvento] ?? e.tipoEvento,
    e.descripcion,
    e.campoModificado ?? "—",
    e.valorAnterior ?? "—",
    e.valorNuevo ?? "—",
  ]);

  autoTable(doc, {
    startY: 32,
    head: [
      [
        "Fecha",
        "Autor",
        "Tipo",
        "Descripción",
        "Campo",
        "Valor anterior",
        "Valor nuevo",
      ],
    ],
    body: filas,
    styles: {
      font: "helvetica",
      fontSize: 8,
      cellPadding: 3,
      overflow: "linebreak",
    },
    headStyles: {
      fillColor: [183, 49, 44], // #B7312C
      textColor: 255,
      fontStyle: "bold",
      fontSize: 8,
    },
    alternateRowStyles: { fillColor: [253, 248, 248] },
    columnStyles: {
      0: { cellWidth: 32 },
      1: { cellWidth: 22 },
      2: { cellWidth: 24 },
      3: { cellWidth: 80 },
      4: { cellWidth: 28 },
      5: { cellWidth: 30 },
      6: { cellWidth: 30 },
    },
    didDrawPage: (data: any) => {
      /* pie de página */
      const pageCount = (doc as any).internal.getNumberOfPages();
      doc.setFontSize(7);
      doc.setTextColor(160);
      doc.text(`Página ${data.pageNumber} de ${pageCount}  ·  Inventario TI`, 297 / 2, 210 - 5, {
        align: "center",
      });
    },
  });

  doc.save(`Bitacora_${nombre}_${fechaArchivo()}.pdf`);
}
