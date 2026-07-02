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
  borderGray: "#BDC3C7",
  textDark: "#1A1A1A",
};

const val = (v: string | null | undefined) => v ?? "";

function formatFecha(f: string | Date | null | undefined): string {
  if (!f) return "";
  const d = typeof f === "string" ? new Date(f) : f;
  return d.toLocaleDateString("es-CO", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/* ─── Header ─── */
function drawHeaderGradient(
  doc: PDFKit.PDFDocument,
  y: number,
  type: "entrega" | "devolucion",
  meta?: { codigo?: string; version?: string; fechaActualizacion?: string; Proceso?: string }
): void {
  const title = type === "entrega" ? "ACTA DE ENTREGA" : "ACTA DE DEVOLUCIÓN";
  const bannerH = 65;

  // Fondo del banner (dos mitades de color)
  
  const grad = doc.linearGradient(40, y, 555, y);
  
  grad.stop(0, COLORS.primary);   // naranja
  grad.stop(1, COLORS.secondary); // vino
  
  doc.rect(40, y, 515, bannerH).fill(grad);


  if (meta) {
    const logoW = 80;
    const metaW = 185;
    const titleX = 40 + logoW;
    const titleW = 515 - logoW - metaW;
    const metaX = 40 + logoW + titleW;

    // Logo dentro del banner
    if (fs.existsSync("storage/img/logo.png")) {
      doc.image("storage/img/logo.png", 46, y + 8, { fit: [68, 48], align: "center", valign: "center" });
    } else {
      doc.fontSize(9).font("Helvetica-Bold").fillColor(COLORS.white);
      doc.text("fiduprevisora", 44, y + 26, { width: logoW - 8, align: "center" });
    }

    // Línea divisora vertical logo | título
    doc.strokeColor(COLORS.white).lineWidth(0.5).opacity(0.4);
    doc.moveTo(titleX, y + 8).lineTo(titleX, y + bannerH - 8).stroke();
    doc.opacity(1);

    // Título centrado
    doc.fontSize(22).font("Helvetica-Bold").fillColor(COLORS.white);
    doc.text(title, titleX, y + 10, { width: titleW, align: "center" });
    doc.fontSize(10).font("Helvetica").fillColor(COLORS.white).opacity(0.85);
    doc.text("Documento de Gestión de Activos Móviles", titleX, y + 40, { width: titleW, align: "center" });
    doc.opacity(1);

    // Línea divisora vertical título | metadata
    doc.strokeColor(COLORS.white).lineWidth(0.5).opacity(0.4);
    doc.moveTo(metaX, y + 8).lineTo(metaX, y + bannerH - 8).stroke();
    doc.opacity(1);

    // Metadata: código, versión, fecha
    const metaLines = [
      { label: "Código:",              value: meta.codigo ?? "FR-GTE-02-044" },
      { label: "Versión:",             value: meta.version ?? "1" },
      { label: "Fecha Actualización:", value: meta.fechaActualizacion ?? new Date().toLocaleDateString("es-CO") },
      { label: "Proceso:",            value: meta.Proceso ?? "Infraestructura Tecnológica" },
    ];
    const lineH = bannerH / metaLines.length;
    metaLines.forEach(({ label, value }, i) => {
      const lineY = y + i * lineH + 6;
      if (i > 0) {
        doc.strokeColor(COLORS.white).lineWidth(0.3).opacity(0.35);
        doc.moveTo(metaX + 4, y + i * lineH).lineTo(metaX + metaW - 4, y + i * lineH).stroke();
        doc.opacity(1);
      }
      doc.fontSize(10).font("Helvetica-Bold").fillColor(COLORS.white);
      doc.text(label, metaX + 6, lineY, { continued: true });
      doc.fontSize(10.5).font("Helvetica").fillColor(COLORS.white).opacity(0.92);
      doc.text(` ${value}`, { width: metaW - 10 })
      doc.opacity(1);
    });

  } else {
    // Sin metadata: título centrado simple (devolución)
    doc.fontSize(22).font("Helvetica-Bold").fillColor(COLORS.white);
    doc.text(title, 40, y + 16, { width: 515, align: "center" });
    doc.fontSize(8.5).font("Helvetica").fillColor(COLORS.white).opacity(0.9);
    doc.text("Documento de Gestión de Activos Móviles", 40, y + 44, { width: 515, align: "center" });
    doc.opacity(1);
  }
}

/* ─── Sección título ─── */
function drawSectionTitle(doc: PDFKit.PDFDocument, title: string, y: number): number {
  doc.strokeColor(COLORS.primary).lineWidth(2);
  doc.moveTo(40, y).lineTo(555, y).stroke();
  doc.fontSize(10).font("Helvetica-Bold").fillColor(COLORS.secondary);
  doc.text(title, 45, y + 5, { width: 510 });
  return y + 20;
}

/* ─── Info grid ─── */
interface InfoCard { label: string; value: string; }

function drawInfoGrid(doc: PDFKit.PDFDocument, cards: InfoCard[], startY: number, rowH = 38): number {
  const colW = 240;
  const gap = 20;
  const pad = 7;
  let y = startY;
  for (let i = 0; i < cards.length; i += 2) {
    const c1 = cards[i];
    const c2 = cards[i + 1];
    doc.rect(40, y, colW, rowH).fill(COLORS.lightGray2).stroke();
    doc.fontSize(8).font("Helvetica-Bold").fillColor(COLORS.secondary);
    doc.text(c1.label, 40 + pad, y + pad, { width: colW - pad * 2 });
    doc.fontSize(10).font("Helvetica").fillColor(COLORS.textDark);
    doc.text(c1.value, 40 + pad, y + 20, { width: colW - pad * 2 });
    if (c2) {
      doc.rect(40 + colW + gap, y, colW, rowH).fill(COLORS.lightGray2).stroke();
      doc.fontSize(8).font("Helvetica-Bold").fillColor(COLORS.secondary);
      doc.text(c2.label, 40 + colW + gap + pad, y + pad, { width: colW - pad * 2 });
      doc.fontSize(10).font("Helvetica").fillColor(COLORS.textDark);
      doc.text(c2.value, 40 + colW + gap + pad, y + 20, { width: colW - pad * 2 });
    }
    y += rowH + 5;
  }
  return y;
}

/* ─── Tabla equipo en 2 columnas ─── */
interface TableRow { cells: string[]; }

function drawEquipmentTable(doc: PDFKit.PDFDocument, rows: TableRow[], startY: number, rowH = 22): number {
  const col1W = 110;
  const col2W = 145;
  const pad = 5;
  const half = Math.ceil(rows.length / 2);
  let y = startY;
  for (let i = 0; i < half; i++) {
    const r1 = rows[i];
    const r2 = rows[i + half];
    const bg = i % 2 === 0 ? COLORS.lightGray2 : COLORS.white;
    doc.rect(40, y, col1W + col2W, rowH).fill(bg).stroke();
    doc.fontSize(8).font("Helvetica-Bold").fillColor(COLORS.secondary);
    doc.text(r1.cells[0], 40 + pad, y + pad, { width: col1W - pad });
    doc.fontSize(9).font("Helvetica").fillColor(COLORS.textDark);
    doc.text(r1.cells[1], 40 + col1W + pad, y + pad, { width: col2W - pad });
    if (r2) {
      const xOff = col1W + col2W + 15;
      doc.rect(40 + xOff, y, col1W + col2W, rowH).fill(bg).stroke();
      doc.fontSize(8).font("Helvetica-Bold").fillColor(COLORS.secondary);
      doc.text(r2.cells[0], 40 + xOff + pad, y + pad, { width: col1W - pad });
      doc.fontSize(9).font("Helvetica").fillColor(COLORS.textDark);
      doc.text(r2.cells[1], 40 + xOff + col1W + pad, y + pad, { width: col2W - pad });
    }
    y += rowH;
  }
  return y;
}

/* ─── Observaciones ─── */
function drawObservationsBox(
  doc: PDFKit.PDFDocument,
  title: string,
  content: string,
  startY: number,
  boxH = 55
): number {
  doc.rect(40, startY, 515, 20).fill(COLORS.secondary).stroke();
  doc.fontSize(9).font("Helvetica-Bold").fillColor(COLORS.white);
  doc.text(title, 45, startY + 6, { width: 505 });
  doc.rect(40, startY + 20, 515, boxH).fill(COLORS.lightGray2).stroke();
  doc.fontSize(9).font("Helvetica").fillColor(COLORS.textDark);
  doc.text(val(content), 45, startY + 26, { width: 505, height: boxH - 10 });
  return startY + 20 + boxH + 6;
}

/* ─── Footer ─── */
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

    // HEADER
    drawHeaderGradient(doc, y, "entrega", {
      codigo: "FR-GTE-02-044",
      version: "1",
      fechaActualizacion: "26/06/2026",
      Proceso: "Infraestructura Tecnológica",

    });
    y += 70; // 65 banner + 5 gap

    // DATOS DE REGISTRO
    y = drawSectionTitle(doc, "DATOS DE REGISTRO", y);
    const infoCabezal: InfoCard[] = [
      { label: "# CASO",      value: val(datos.numeroCaso) },
      { label: "REGIÓN",      value: val(datos.region) },
      { label: "DEPENDENCIA", value: val(datos.dependencia) },
      { label: "USUARIO",     value: val(datos.nombre) },
      { label: "SEDE",        value: val(datos.sede) },
      { label: "CÉDULA",      value: val(datos.cedula) },
      { label: "USUARIO RED", value: val(datos.usuarioRed) },
      { label: "FECHA",       value: formatFecha(datos.fechaEntrega) },
    ];
    y = drawInfoGrid(doc, infoCabezal, y, 40) + 6;

    // EQUIPO ENTREGADO
    y = drawSectionTitle(doc, "EQUIPO ENTREGADO", y);
    const equipoData: TableRow[] = [
      { cells: ["UNI",    val(datos.uni)] },
      { cells: ["MARCA",  val(datos.marca)] },
      { cells: ["MODELO", val(datos.modelo)] },
      { cells: ["SERIAL", val(datos.serial)] },
      { cells: ["IMEI 1", val(datos.imei1)] },
      { cells: ["IMEI 2", val(datos.imei2)] },
      { cells: ["SIM",    val(datos.sim)] },
      { cells: ["LÍNEA",  val(datos.numeroLinea)] },
    ];
    y = drawEquipmentTable(doc, equipoData, y, 24) + 6;

    // RECOMENDACIONES
    y = drawSectionTitle(doc, "RECOMENDACIONES", y);
    const recomTexts = [
      "El equipo móvil debe utilizarse principalmente para actividades relacionadas con el trabajo.",
      "No se deben almacenar, compartir o transmitir datos sensibles o confidenciales sin medidas de seguridad adecuadas, como cifrado o autenticación de dos factores.",
      "Está prohibida la instalación de aplicaciones no autorizadas o sospechosas que puedan comprometer la seguridad del equipo o la privacidad de los datos.",
      "Los dispositivos deben estar protegidos con contraseñas seguras, huella dactilar o reconocimiento facial. Las contraseñas deben cambiarse regularmente.",
      "Los equipos móviles deben ser manipulados únicamente por personal autorizado en caso de reparaciones o mantenimiento, evitando el uso de servicios no certificados.",
      "El usuario es responsable de cualquier daño causado por el uso inapropiado del dispositivo.",
      "En caso de pérdida o robo debe ser reportado inmediatamente a la Vicepresidencia de Tecnología e Información.",
    ];
    const recomLineGap = 4;
    const recomPadV = 8;
    doc.fontSize(7.5).font("Helvetica");
    let totalRecomH = recomPadV;
    const recomHeights: number[] = recomTexts.map(text => {
      const h = doc.heightOfString(`• ${text}`, { width: 500 });
      totalRecomH += h + recomLineGap;
      return h;
    });
    totalRecomH += recomPadV - recomLineGap;
    doc.rect(40, y, 515, totalRecomH).strokeColor(COLORS.primary).lineWidth(1).stroke();
    let recomCursorY = y + recomPadV;
    recomTexts.forEach((text, i) => {
      doc.fontSize(7.5).font("Helvetica").fillColor(COLORS.secondary);
      doc.text(`• ${text}`, 46, recomCursorY, { width: 500 });
      recomCursorY += recomHeights[i] + recomLineGap;
    });
    y += totalRecomH + 6;

    // OBSERVACIONES
    y = drawObservationsBox(doc, "OBSERVACIONES", val(datos.observacionesEntrega), y, 80);

    // ACEPTACIÓN + FIRMA
    y = drawSectionTitle(doc, "ACEPTACIÓN", y);
    doc.fontSize(9).font("Helvetica").fillColor(COLORS.textDark);
    doc.text("Declaro recibir el equipo en condiciones adecuadas.", 45, y);
    y += 14;

    const firmaH = 75;
    doc.rect(40, y, 220, firmaH).stroke();
    doc.rect(275, y, 280, firmaH).stroke();

    if (datos.firmaPath && fs.existsSync(datos.firmaPath)) {
      doc.image(datos.firmaPath, 55, y + 10, { width: 80, height: 32 });
    }
    doc.fontSize(8).font("Helvetica").fillColor(COLORS.mediumGray);
    doc.text("Firma", 40, y + firmaH - 16, { width: 220, align: "center" });
    doc.fontSize(10).font("Helvetica").fillColor(COLORS.textDark);
    doc.text("Fecha:", 292, y + 18);
    doc.fontSize(13).font("Helvetica-Bold").fillColor(COLORS.primary);
    doc.text(formatFecha(datos.fechaFirma), 292, y + 34);

    drawFooter(doc);
    doc.end();
  });
}

/* ══════════════════════════════════════════════
   DEVOLUCIÓN — una sola página
══════════════════════════════════════════════ */
export async function generarPdfDevolucion(datos: DatosMovil): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 0, bufferPages: false });
    const chunks: Buffer[] = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    let y = 25;

    // HEADER (sin metadata — título centrado simple)
    drawHeaderGradient(doc, y, "devolucion", {
      codigo: "0",
      version: "1",
      fechaActualizacion: "26/06/2026",
      Proceso: "Infraestructura Tecnológica",
    });
    y += 70;

    // DATOS DE REGISTRO
    y = drawSectionTitle(doc, "DATOS DE REGISTRO", y);
    const infoCabezal: InfoCard[] = [
      { label: "# CASO",           value: val(datos.numeroCaso) },
      { label: "REGIÓN",           value: val(datos.region) },
      { label: "DEPENDENCIA",      value: val(datos.dependencia) },
      { label: "USUARIO",          value: val(datos.nombre) },
      { label: "SEDE",             value: val(datos.sede) },
      { label: "CÉDULA",           value: val(datos.cedula) },
      { label: "USUARIO RED",      value: val(datos.usuarioRed) },
      { label: "FECHA DEVOLUCIÓN", value: formatFecha(datos.fechaDevolucion) },
    ];
    y = drawInfoGrid(doc, infoCabezal, y, 40) + 6;

    // EQUIPO DEVUELTO
    y = drawSectionTitle(doc, "EQUIPO DEVUELTO", y);
    const equipoData: TableRow[] = [
      { cells: ["UNI",    val(datos.uni)] },
      { cells: ["MARCA",  val(datos.marca)] },
      { cells: ["MODELO", val(datos.modelo)] },
      { cells: ["SERIAL", val(datos.serial)] },
      { cells: ["IMEI 1", val(datos.imei1)] },
      { cells: ["IMEI 2", val(datos.imei2)] },
      { cells: ["SIM",    val(datos.sim)] },
      { cells: ["LÍNEA",  val(datos.numeroLinea)] },
    ];
    y = drawEquipmentTable(doc, equipoData, y, 24) + 6;

    // ESTADO DEL EQUIPO
    y = drawSectionTitle(doc, "ESTADO DEL EQUIPO", y);
    const estadoCards: InfoCard[] = [
      { label: "CONDICIÓN GENERAL", value: "Verificado en devolución" },
      { label: "ACCESORIOS",        value: "Completos" },
    ];
    y = drawInfoGrid(doc, estadoCards, y, 40) + 6;

    // OBSERVACIONES
    y = drawObservationsBox(doc, "OBSERVACIONES DE DEVOLUCIÓN", val(datos.observacionesDevolucion), y, 100);

    // RECIBIDO Y ACEPTADO
    y = drawSectionTitle(doc, "RECIBIDO Y ACEPTADO", y);
    const firmaH = 100;
    doc.rect(40, y, 220, firmaH).stroke();
    doc.rect(275, y, 280, firmaH).stroke();

    if (datos.firmaPathFinal && fs.existsSync(datos.firmaPathFinal)) {
      doc.image(datos.firmaPathFinal, 55, y + 10, { width: 80, height: 32 });
    }
    doc.fontSize(8).font("Helvetica").fillColor(COLORS.mediumGray);
    doc.text("Firma", 40, y + firmaH - 16, { width: 220, align: "center" });
    doc.fontSize(10).font("Helvetica").fillColor(COLORS.textDark);
    doc.text("Fecha Devolución:", 292, y + 18);
    doc.fontSize(13).font("Helvetica-Bold").fillColor(COLORS.primary);
    doc.text(formatFecha(datos.fechaDevolucion), 292, y + 34);

    drawFooter(doc);
    doc.end();
  });
}

export async function generarPdfMovil(datos: DatosMovil): Promise<Buffer> {
  return generarPdfEntrega(datos);
}