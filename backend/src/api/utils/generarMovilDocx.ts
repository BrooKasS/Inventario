import PDFDocument from 'pdfkit';
import fs from "fs";

/* ─── Tipos ─── */
interface DatosMovil {
  nombre: string | null;
  numeroCaso: string | null;
  region: string | null;
  dependencia: string | null;
  sede: string | null;
  cedula: string | null;
  usuarioRed: string | null;
  uni: string | null;
  marca: string | null;
  modelo: string | null;
  serial: string | null;
  imei1: string | null;
  imei2: string | null;
  sim: string | null;
  numeroLinea: string | null;
  fechaEntrega: string | Date | null;
  observacionesEntrega: string | null;
  fechaDevolucion: string | Date | null;
  observacionesDevolucion: string | null;
  firmaPath: string | null;
  fechaFirma: string | Date | null;
  firmaPathFinal?: string | null;
}

/* ─── Colores corporativos ─── */
const COLORS = {
  primary: "#FF9A1F",
  secondary: "#8A1A40",
  accent1: "#B7312C",
  accent2: "#D86018",
  darkGray: "#2C3E50",
  mediumGray: "#34495E",
  lightGray: "#c9c9c9",
  lightGray2: "#f0f0f0",
  white: "#FFFFFF",
  borderGray: "#000000",
  textDark: "#1A1A1A",
};

const val = (v: string | null | undefined) => v ?? "";

function formatFecha(f: string | Date | null | undefined): string {
  if (!f) return "";
  const d = typeof f === "string" ? new Date(f) : f;
  return d.toLocaleDateString("es-CO", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/* ─── Header corporativo (fondo blanco, 3 columnas, bordes negros) ─── */
function drawHeaderCorporate(
  doc: PDFKit.PDFDocument,
  y: number,
  titleLines: string[],
  meta: { codigo?: string; proceso?: string; version?: string; fechaActualizacion?: string }
): number {
  const boxH = 60;
  const leftW = 140;
  const rightW = 175;
  const centerW = 515 - leftW - rightW;

  // Borde exterior del bloque completo
  doc.rect(40, y, 515, boxH).strokeColor(COLORS.borderGray).lineWidth(1).stroke();

  // Líneas divisorias verticales
  doc.strokeColor(COLORS.borderGray).lineWidth(1);
  doc.moveTo(40 + leftW, y).lineTo(40 + leftW, y + boxH).stroke();
  doc.moveTo(40 + leftW + centerW, y).lineTo(40 + leftW + centerW, y + boxH).stroke();

  // Columna izquierda — logo
  if (fs.existsSync("storage/img/logo.png")) {
    doc.image("storage/img/logo.png", 40 + 10, y + boxH / 2 - 20, { fit: [leftW - 20, 40], align: "center", valign: "center" });
  } else {
    doc.fontSize(15).font("Helvetica-Oblique").fillColor(COLORS.mediumGray);
    doc.text("{fiduprevisora}", 40 + 6, y + boxH / 2 - 8, { width: leftW - 12, align: "center" });
  }

  // Columna central — título en negrita, líneas cortas para evitar auto-wrap
  doc.fontSize(10.5).font("Helvetica-Bold").fillColor(COLORS.textDark);
  const titleY = y + boxH / 2 - (titleLines.length * 12) / 2;
  titleLines.forEach((line, i) => {
    doc.text(line, 40 + leftW + 8, titleY + i * 13, { width: centerW - 16, align: "center" });
  });

  // Columna derecha — metadata (label negrita + valor normal)
  const metaX = 40 + leftW + centerW + 8;
  const metaLines = [
    { label: "Código:",                 value: meta.codigo ?? "" },
    { label: "Proceso:",                value: meta.proceso ?? "" },
    { label: "Versión:",                value: meta.version ?? "" },
    { label: "Fecha de Actualización:", value: meta.fechaActualizacion ?? "" },
  ];
  const lineH = boxH / metaLines.length;
  metaLines.forEach(({ label, value }, i) => {
    const lineY = y + i * lineH + lineH / 2 - 5;
    doc.fontSize(8.5).font("Helvetica-Bold").fillColor(COLORS.textDark)
       .text(label, metaX, lineY, { continued: true });
    doc.font("Helvetica").text(` ${value}`, { width: rightW - 16 });
  });

  return y + boxH;
}

/* ─── Tabla "Datos de Registro" con bordes, 2 columnas x N filas ─── */
interface RegistroPair { label: string; value: string; }

function drawRegistroTable(
  doc: PDFKit.PDFDocument,
  rows: [RegistroPair, RegistroPair][],
  y: number,
  rowH = 18
): number {
  const colW = 515 / 2;

  rows.forEach(([left, right]) => {
    doc.rect(40, y, colW, rowH).strokeColor(COLORS.borderGray).lineWidth(0.8).stroke();
    doc.rect(40 + colW, y, colW, rowH).strokeColor(COLORS.borderGray).lineWidth(0.8).stroke();

    doc.fontSize(9).font("Helvetica-Bold").fillColor(COLORS.textDark)
       .text(left.label, 40 + 6, y + rowH / 2 - 5, { continued: true });
    doc.font("Helvetica").text(` ${left.value}`, { width: colW - 20 });

    doc.fontSize(9).font("Helvetica-Bold").fillColor(COLORS.textDark)
       .text(right.label, 40 + colW + 6, y + rowH / 2 - 5, { continued: true });
    doc.font("Helvetica").text(` ${right.value}`, { width: colW - 20 });

    y += rowH;
  });

  return y;
}

/* Título en caja bordeada, centrado, fondo claro */
function drawBoxedTitle(doc: PDFKit.PDFDocument, title: string, y: number, h = 20): number {
  doc.rect(40, y, 515, h).fillColor(COLORS.lightGray2).fill();
  doc.rect(40, y, 515, h).strokeColor(COLORS.borderGray).lineWidth(0.8).stroke();
  doc.fontSize(9.5).font("Helvetica-Bold").fillColor(COLORS.textDark);
  doc.text(title, 40, y + h / 2 - 5, { width: 515, align: "center" });
  return y + h;
}

/* Tabla de equipo a una sola columna: LABEL | VALOR, con borde en cada celda */
interface EquipoRow { label: string; value: string; subLabel?: string; }

function drawEquipmentTableFull(doc: PDFKit.PDFDocument, rows: EquipoRow[], y: number, rowH = 20): number {
  const labelColW = 165;
  const valueColW = 350;

  rows.forEach((row) => {
    doc.rect(40, y, labelColW, rowH).strokeColor(COLORS.borderGray).lineWidth(0.5).stroke();
    doc.rect(40 + labelColW, y, valueColW, rowH).strokeColor(COLORS.borderGray).lineWidth(0.5).stroke();

    doc.fontSize(9).font("Helvetica-Bold").fillColor(COLORS.textDark);
    doc.text(row.label, 40, y + rowH / 2 - 5, { width: labelColW, align: "center" });

    if (row.subLabel) {
      doc.fontSize(9).font("Helvetica-Bold").fillColor(COLORS.textDark)
         .text(row.subLabel, 40 + labelColW + 8, y + rowH / 2 - 5, { continued: true });
      doc.font("Helvetica").text(` ${row.value}`);
    } else {
      doc.fontSize(9).font("Helvetica").fillColor(COLORS.textDark);
      doc.text(row.value, 40 + labelColW + 8, y + rowH / 2 - 5, { width: valueColW - 16 });
    }
    y += rowH;
  });

  return y;
}

/* Lista numerada de recomendaciones dentro de una caja */
function drawNumberedBox(doc: PDFKit.PDFDocument, items: string[], y: number): number {
  const padV = 8;
  const lineGap = 5;
  doc.fontSize(8).font("Helvetica");
  let totalH = padV;
  const heights = items.map((text, i) => {
    const h = doc.heightOfString(`${i + 1}. ${text}`, { width: 500 });
    totalH += h + lineGap;
    return h;
  });
  totalH += padV - lineGap;

  doc.rect(40, y, 515, totalH).strokeColor(COLORS.borderGray).lineWidth(0.8).stroke();
  let cursorY = y + padV;
  items.forEach((text, i) => {
    doc.fontSize(8).font("Helvetica").fillColor(COLORS.textDark);
    doc.text(`${i + 1}. ${text}`, 46, cursorY, { width: 500, underline: true });
    cursorY += heights[i] + lineGap;
  });
  return y + totalH;
}

/* Caja de observaciones: título + área en blanco */
function drawObservationsBoxV2(
  doc: PDFKit.PDFDocument,
  title: string,
  content: string,
  y: number,
  boxH = 70
): number {
  y = drawBoxedTitle(doc, title, y, 20);
  doc.rect(40, y, 515, boxH).strokeColor(COLORS.borderGray).lineWidth(0.8).stroke();
  doc.fontSize(9).font("Helvetica").fillColor(COLORS.textDark);
  doc.text(val(content), 46, y + 6, { width: 505, height: boxH - 10 });
  return y + boxH;
}

/* Caja de firma: borde rectangular, etiqueta en negrita arriba-izquierda dentro del recuadro */
function drawSignatureBox(
  doc: PDFKit.PDFDocument,
  label: string,
  y: number,
  firmaImgPath: string | null | undefined,
  boxH = 60
): number {
  doc.rect(40, y, 515, boxH).strokeColor(COLORS.borderGray).lineWidth(0.8).stroke();

  doc.fontSize(9.5).font("Helvetica-Bold").fillColor(COLORS.textDark);
  doc.text(label, 40 + 6, y + 6);

  if (firmaImgPath && fs.existsSync(firmaImgPath)) {
    doc.image(firmaImgPath, 40 + 10, y + 20, { width: 100, height: 34 });
  }

  return y + boxH;
}

/* Footer */
function drawFooter(doc: PDFKit.PDFDocument): void {
  const footerY = 820;
  doc.strokeColor(COLORS.borderGray).lineWidth(0.5);
  doc.moveTo(40, footerY).lineTo(555, footerY).stroke();
  doc.fontSize(7.5).font("Helvetica").fillColor(COLORS.mediumGray);
  doc.text("Fiduprevisora - Dirección de Infraestructura", 40, footerY + 6, { width: 300, align: "left" });
  doc.text(`Generado: ${new Date().toLocaleDateString("es-CO")}`, 300, footerY + 6, { width: 255, align: "right" });
}

/* ══════════════════════════════════════════════
   ENTREGA — una sola página
══════════════════════════════════════════════ */
export async function generarPdfEntrega(datos: DatosMovil): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 0, bufferPages: false });
    const chunks: Buffer[] = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    let y = 25;

    y = drawHeaderCorporate(doc, y, ["FORMATO ENTREGA", "EQUIPOS MOVILES VTI"], {
      codigo: "FR-GTE-02-044",
      proceso: "Infraestructura Tecnológica",
      version: "1",
      fechaActualizacion: "26/06/2026",
    });
    y += 10;

    // DATOS DE REGISTRO
    y = drawRegistroTable(doc, [
      [{ label: "# Caso:", value: val(datos.numeroCaso) }, { label: "Región/Departamento:", value: val(datos.region) }],
      [{ label: "Dependencia/Área:", value: val(datos.dependencia) }, { label: "Nombre:", value: val(datos.nombre) }],
      [{ label: "Sede:", value: val(datos.sede) }, { label: "C.C.:", value: val(datos.cedula) }],
      [{ label: "Fecha:", value: formatFecha(datos.fechaEntrega) }, { label: "Usuario de red:", value: val(datos.usuarioRed) }],
    ], y);
    y += 16;

    // DATOS DE EQUIPO ENTREGADO
    y = drawBoxedTitle(doc, "DATOS DE EQUIPO ENTREGADO", y);
    const equipoRows: EquipoRow[] = [
      { label: "CELULAR", value: val(datos.uni), subLabel: "UNI:" },
      { label: "MARCA",   value: val(datos.marca) },
      { label: "MODELO",  value: val(datos.modelo) },
      { label: "SERIAL",  value: val(datos.serial) },
      { label: "IMEI 1",  value: val(datos.imei1) },
      { label: "IMEI 2",  value: val(datos.imei2) },
      { label: "SIM",     value: val(datos.sim) },
      { label: "NUMERO DE LINEA", value: val(datos.numeroLinea) },
    ];
    y = drawEquipmentTableFull(doc, equipoRows, y) + 12;

    // RECOMENDACIONES
    y = drawBoxedTitle(doc, "Recomendaciones de Uso", y);
    const recomTexts = [
      "El equipo móvil debe utilizarse principalmente para actividades relacionadas con el trabajo.",
      "No se deben almacenar, compartir o transmitir datos sensibles o confidenciales sin medidas de seguridad adecuadas.",
      "Está prohibida la instalación de aplicaciones no autorizadas o sospechosas.",
      "Los dispositivos deben estar protegidos con contraseñas seguras, huella dactilar o reconocimiento facial.",
      "Los equipos móviles deben ser manipulados únicamente por personal autorizado en caso de reparaciones.",
      "El usuario es responsable de cualquier daño causado por el uso inapropiado del dispositivo.",
      "En caso de pérdida o robo debe ser reportado inmediatamente a la Vicepresidencia de Tecnología e Información.",
    ];
    y = drawNumberedBox(doc, recomTexts, y) + 12;

    // OBSERVACIONES
    y = drawObservationsBoxV2(doc, "OBSERVACIONES", val(datos.observacionesEntrega), y, 70) + 16;

    // FIRMA
    y = drawSignatureBox(doc, "Firma del responsable:", y, datos.firmaPath, 60) + 10;

    doc.fontSize(10).font("Helvetica-Bold").fillColor(COLORS.textDark);
    doc.text(`Fecha de firma: ${formatFecha(datos.fechaFirma)}`, 40, y);

    drawFooter(doc);
    doc.end();
  });
}

/* ══════════════════════════════════════════════
   DEVOLUCIÓN — mismo estilo
══════════════════════════════════════════════ */
export async function generarPdfDevolucion(datos: DatosMovil): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 0, bufferPages: false });
    const chunks: Buffer[] = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    let y = 25;

    y = drawHeaderCorporate(doc, y, ["FORMATO DEVOLUCIÓN", "EQUIPOS MOVILES VTI"], {
      codigo: "0",
      proceso: "Infraestructura Tecnológica",
      version: "1",
      fechaActualizacion: "26/06/2026",
    });
    y += 10;

    y = drawRegistroTable(doc, [
      [{ label: "# Caso:", value: val(datos.numeroCaso) }, { label: "Región/Departamento:", value: val(datos.region) }],
      [{ label: "Dependencia/Área:", value: val(datos.dependencia) }, { label: "Nombre:", value: val(datos.nombre) }],
      [{ label: "Sede:", value: val(datos.sede) }, { label: "C.C.:", value: val(datos.cedula) }],
      [{ label: "Fecha Devolución:", value: formatFecha(datos.fechaDevolucion) }, { label: "Usuario de red:", value: val(datos.usuarioRed) }],
    ], y);
    y += 16;

    y = drawBoxedTitle(doc, "DATOS DE EQUIPO DEVUELTO", y);
    const equipoRows: EquipoRow[] = [
      { label: "CELULAR", value: val(datos.uni), subLabel: "UNI:" },
      { label: "MARCA",   value: val(datos.marca) },
      { label: "MODELO",  value: val(datos.modelo) },
      { label: "SERIAL",  value: val(datos.serial) },
      { label: "IMEI 1",  value: val(datos.imei1) },
      { label: "IMEI 2",  value: val(datos.imei2) },
      { label: "SIM",     value: val(datos.sim) },
      { label: "NUMERO DE LINEA", value: val(datos.numeroLinea) },
    ];
    y = drawEquipmentTableFull(doc, equipoRows, y) + 12;

    y = drawBoxedTitle(doc, "ESTADO DEL EQUIPO", y);
    const estadoRows: EquipoRow[] = [
      { label: "CONDICIÓN GENERAL", value: "Verificado en devolución" },
      { label: "ACCESORIOS",        value: "Completos" },
    ];
    y = drawEquipmentTableFull(doc, estadoRows, y) + 12;

    y = drawObservationsBoxV2(doc, "OBSERVACIONES DE DEVOLUCIÓN", val(datos.observacionesDevolucion), y, 90) + 16;

    y = drawSignatureBox(doc, "Firma del responsable:", y, datos.firmaPathFinal, 60) + 10;

    doc.fontSize(10).font("Helvetica-Bold").fillColor(COLORS.textDark);
    doc.text(`Fecha Devolución: ${formatFecha(datos.fechaDevolucion)}`, 40, y);

    drawFooter(doc);
    doc.end();
  });
}

export async function generarPdfMovil(datos: DatosMovil): Promise<Buffer> {
  return generarPdfEntrega(datos);
}