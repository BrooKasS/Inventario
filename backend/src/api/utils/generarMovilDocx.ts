import {
  Document, Packer, Table, TableRow, TableCell, Paragraph, TextRun,
  BorderStyle, WidthType, ShadingType, VerticalAlign, AlignmentType,
  Header, ImageRun, PageOrientation,
} from "docx";
import fs from "fs";

/* ─── Tipos ─── */
interface DatosMovil {
  // Asset base
  nombre: string | null;
  // Movil
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
}

/* ─── Helpers ─── */
const val = (v: string | null | undefined) => v ?? "";

function formatFecha(f: string | Date | null | undefined): string {
  if (!f) return "";
  const d = typeof f === "string" ? new Date(f) : f;
  return d.toLocaleDateString("es-CO", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/* ─── Estilos de borde ─── */
const BORDER_SINGLE = { style: BorderStyle.SINGLE, size: 8, color: "000000" };
const BORDER_NIL    = { style: BorderStyle.NIL,    size: 0, color: "000000" };
const ALL_BORDERS   = { top: BORDER_SINGLE, bottom: BORDER_SINGLE, left: BORDER_SINGLE, right: BORDER_SINGLE };
const SHADING_GRAY  = { fill: "D9D9D9", type: ShadingType.CLEAR, color: "000000" };
const SHADING_CLEAR = { fill: "auto",   type: ShadingType.CLEAR, color: "auto" };
const CELL_MARGINS  = { top: 80, bottom: 80, left: 100, right: 100 };

/* ─── TextRun helpers ─── */
function labelRun(text: string) {
  return new TextRun({
    text,
    bold: true,
    font: "Calibri",
    size: 20,
    color: "000000",
  });
}

function valueRun(text: string) {
  return new TextRun({
    text,
    font: "Calibri",
    size: 20,
    color: "000000",
  });
}

function headerRun(text: string) {
  return new TextRun({
    text,
    bold: true,
    font: "Calibri",
    size: 20,
    color: "000000",
  });
}

/* ─── Celda con label (izquierda) ─── */
function labelCell(text: string, width: number, borders = ALL_BORDERS) {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    borders,
    shading: SHADING_CLEAR,
    verticalAlign: VerticalAlign.CENTER,
    margins: CELL_MARGINS,
    children: [
      new Paragraph({
        spacing: { after: 0, line: 240 },
        children: [labelRun(text)],
      }),
    ],
  });
}

/* ─── Celda con valor (derecha) ─── */
function valueCell(text: string, width: number, borders = ALL_BORDERS, span?: number) {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    columnSpan: span,
    borders,
    shading: SHADING_CLEAR,
    verticalAlign: VerticalAlign.CENTER,
    margins: CELL_MARGINS,
    children: [
      new Paragraph({
        spacing: { after: 0, line: 240 },
        children: [valueRun(text)],
      }),
    ],
  });
}

/* ─── Fila label | valor (2 columnas) ─── */
function labelValueRow(label: string, value: string, labelW = 4272, valueW = 5763): TableRow {
  return new TableRow({
    height: { value: 280, rule: "atLeast" },
    children: [
      labelCell(label, labelW),
      valueCell(value, valueW, ALL_BORDERS, 4),
    ],
  });
}

/* ─── Fila header gris (full width) ─── */
function grayHeaderRow(text: string, totalW = 10035): TableRow {
  return new TableRow({
    height: { value: 300, rule: "atLeast" },
    children: [
      new TableCell({
        width: { size: totalW, type: WidthType.DXA },
        columnSpan: 5,
        borders: ALL_BORDERS,
        shading: SHADING_GRAY,
        verticalAlign: VerticalAlign.CENTER,
        margins: CELL_MARGINS,
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 0, line: 240 },
            children: [headerRun(text)],
          }),
        ],
      }),
    ],
  });
}

/* ─── Fila de datos equipo: LABEL | UNI: valor ─── */
function equipoHeaderRow(labelText: string, uniLabel: string, uniVal: string, totalW = 10035): TableRow {
  return new TableRow({
    height: { value: 200, rule: "atLeast" },
    children: [
      new TableCell({
        width: { size: 4272, type: WidthType.DXA },
        borders: { top: BORDER_NIL, bottom: BORDER_SINGLE, left: BORDER_SINGLE, right: BORDER_SINGLE },
        shading: SHADING_CLEAR,
        verticalAlign: VerticalAlign.CENTER,
        margins: CELL_MARGINS,
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 0, line: 240 },
            children: [headerRun(labelText)],
          }),
        ],
      }),
      new TableCell({
        width: { size: 1435, type: WidthType.DXA },
        borders: { top: BORDER_SINGLE, bottom: BORDER_NIL, left: BORDER_NIL, right: BORDER_SINGLE },
        shading: SHADING_CLEAR,
        verticalAlign: VerticalAlign.CENTER,
        margins: CELL_MARGINS,
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 0, line: 240 },
            children: [headerRun(`${uniLabel} `)],
          }),
        ],
      }),
      new TableCell({
        width: { size: 4305, type: WidthType.DXA },
        columnSpan: 3,
        borders: { top: BORDER_SINGLE, bottom: BORDER_SINGLE, left: BORDER_NIL, right: BORDER_SINGLE },
        shading: SHADING_CLEAR,
        verticalAlign: VerticalAlign.CENTER,
        margins: CELL_MARGINS,
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 0, line: 240 },
            children: [valueRun(uniVal)],
          }),
        ],
      }),
    ],
  });
}

/* ─── Fila simple centrada label | valor ─── */
function simpleRow(label: string, value: string): TableRow {
  return new TableRow({
    height: { value: 280, rule: "atLeast" },
    children: [
      new TableCell({
        width: { size: 4272, type: WidthType.DXA },
        borders: { top: BORDER_NIL, bottom: BORDER_SINGLE, left: BORDER_SINGLE, right: BORDER_SINGLE },
        shading: SHADING_CLEAR,
        verticalAlign: VerticalAlign.CENTER,
        margins: CELL_MARGINS,
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 0, line: 240 },
            children: [headerRun(label)],
          }),
        ],
      }),
      new TableCell({
        width: { size: 5763, type: WidthType.DXA },
        columnSpan: 4,
        borders: { top: BORDER_SINGLE, bottom: BORDER_NIL, left: BORDER_NIL, right: BORDER_SINGLE },
        shading: SHADING_CLEAR,
        verticalAlign: VerticalAlign.CENTER,
        margins: CELL_MARGINS,
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 0, line: 240 },
            children: [valueRun(value)],
          }),
        ],
      }),
    ],
  });
}

/* ─── Fila observaciones (full width, alta) ─── */
function obsRow(text: string, height = 800, totalW = 10035): TableRow {
  return new TableRow({
    height: { value: height, rule: "atLeast" },
    children: [
      new TableCell({
        width: { size: totalW, type: WidthType.DXA },
        columnSpan: 5,
        borders: ALL_BORDERS,
        shading: SHADING_CLEAR,
        verticalAlign: VerticalAlign.TOP,
        margins: CELL_MARGINS,
        children: [
          new Paragraph({
            spacing: { after: 0, line: 240 },
            children: [valueRun(text)],
          }),
        ],
      }),
    ],
  });
}

/* ─── Fila firma ─── */
function firmaRow(
  firmaPath: string | null,
  fechaFirma: string,
  totalW = 10035
): TableRow {
  return new TableRow({
    height: { value: 700, rule: "atLeast" },
    children: [
      new TableCell({
        width: { size: totalW, type: WidthType.DXA },
        columnSpan: 5,
        borders: ALL_BORDERS,
        shading: SHADING_CLEAR,
        verticalAlign: VerticalAlign.CENTER,
        margins: CELL_MARGINS,
        children: [
          // Título
          new Paragraph({
            children: [
              new TextRun({
                text: "Firma del responsable:",
                bold: true,
                font: "Calibri",
                size: 24,
              }),
            ],
          }),

          // Imagen de la firma (si existe)
          ...(firmaPath && fs.existsSync(firmaPath)
            ? [
                new Paragraph({
                  spacing: { before: 200 },
                  children: [
                    new ImageRun({
                      data: fs.readFileSync(firmaPath),
                      transformation: {
                        width: 200,
                        height: 80,
                      },
                      type: "png", // ✅ FIX DEFINITIVO PARA TYPESCRIPT
                    }),
                  ],
                }),
              ]
            : []),

          // Fecha de firma
          new Paragraph({
            spacing: { before: 100 },
            children: [
              new TextRun({
                text: `Fecha de firma: ${fechaFirma}`,
                font: "Calibri",
                size: 20,
              }),
            ],
          }),
        ],
      }),
    ],
  });
}
``

function logoParagraph(): Paragraph | null {
  const logoPath = "storage/img/logo.png";

  if (!fs.existsSync(logoPath)) return null;

  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: {
      after: 300, // espacio debajo del logo
    },
    children: [
      new ImageRun({
        data: fs.readFileSync(logoPath),
        transformation: {
          width: 300, // ajusta tamaño
          height: 80,
        },
        type: "png",
      }),
    ],
  });
}

/* ══════════════════════════════════════════════
   FUNCIÓN PRINCIPAL
══════════════════════════════════════════════ */
export async function generarWordMovil(datos: DatosMovil): Promise<Buffer> {
  const fechaEntrega   = formatFecha(datos.fechaEntrega);
  const fechaDevolucion = formatFecha(datos.fechaDevolucion);

  /* ── TABLA 1: ENTREGA ── */
  const tabla1 = new Table({
    width: { size: 10035, type: WidthType.DXA },
    columnWidths: [4272, 1435, 3132, 1173, 23],
    rows: [
      // Fila 1: # Caso | Región
      labelValueRow(`# Caso: ${val(datos.numeroCaso)}`, `Región/Departamento: ${val(datos.region)}`),

      // Fila 2: Dependencia | Nombre
      labelValueRow(`Dependencia/Área: ${val(datos.dependencia)}`, `Nombre: ${val(datos.nombre)}`),

      // Fila 3: Sede | C.C.
      labelValueRow(`Sede: ${val(datos.sede)}`, `C.C.: ${val(datos.cedula)}`),

      // Fila 4: Fecha | Usuario de red
      labelValueRow(`Fecha: ${fechaEntrega}`, `Usuario de red: ${val(datos.usuarioRed)}`),

      // Separador vacío
      new TableRow({
        height: { value: 60, rule: "exact" },
        children: [
          new TableCell({
            width: { size: 10035, type: WidthType.DXA },
            columnSpan: 5,
            borders: { top: BORDER_NIL, bottom: BORDER_NIL, left: BORDER_NIL, right: BORDER_NIL },
            shading: SHADING_CLEAR,
            children: [new Paragraph({ spacing: { after: 0 }, children: [] })],
          }),
        ],
      }),

      // Header DATOS DE EQUIPO ENTREGADO
      grayHeaderRow("DATOS DE EQUIPO ENTREGADO"),

      // Sub-header CELULAR | UNI
      equipoHeaderRow("CELULAR", "UNI:", val(datos.uni)),

      // Filas de datos equipo
      simpleRow("MARCA",          val(datos.marca)),
      simpleRow("MODELO",         val(datos.modelo)),
      simpleRow("SERIAL",         val(datos.serial)),
      simpleRow("IMEI 1",         val(datos.imei1)),
      simpleRow("IMEI 2",         val(datos.imei2)),
      simpleRow("SIM",            val(datos.sim)),
      simpleRow("NUMERO DE LINEA", val(datos.numeroLinea)),

      // Recomendaciones de Uso (header gris)
      grayHeaderRow("Recomendaciones de Uso"),

      // Texto fijo recomendaciones
      new TableRow({
        height: { value: 400, rule: "atLeast" },
        children: [
          new TableCell({
            width: { size: 10035, type: WidthType.DXA },
            columnSpan: 5,
            borders: ALL_BORDERS,
            shading: SHADING_CLEAR,
            verticalAlign: VerticalAlign.TOP,
            margins: CELL_MARGINS,
            children: [
              new Paragraph({ spacing: { after: 0, line: 240 }, children: [new TextRun({ text: "1.  El equipo móvil debe utilizarse principalmente para actividades relacionadas con el trabajo.", font: "Calibri", size: 18, color: "000000" })] }),
              new Paragraph({ spacing: { after: 0, line: 240 }, children: [new TextRun({ text: "2.  No se deben almacenar, compartir o transmitir datos sensibles o confidenciales sin medidas de seguridad adecuadas.", font: "Calibri", size: 18, color: "000000" })] }),
              new Paragraph({ spacing: { after: 0, line: 240 }, children: [new TextRun({ text: "3.  Está prohibida la instalación de aplicaciones no autorizadas o sospechosas.", font: "Calibri", size: 18, color: "000000" })] }),
              new Paragraph({ spacing: { after: 0, line: 240 }, children: [new TextRun({ text: "4.  Los dispositivos deben estar protegidos con contraseñas seguras, huella dactilar o reconocimiento facial.", font: "Calibri", size: 18, color: "000000" })] }),
              new Paragraph({ spacing: { after: 0, line: 240 }, children: [new TextRun({ text: "5.  Los equipos móviles deben ser manipulados únicamente por personal autorizado en caso de reparaciones.", font: "Calibri", size: 18, color: "000000" })] }),
              new Paragraph({ spacing: { after: 0, line: 240 }, children: [new TextRun({ text: "6.  El usuario es responsable de cualquier daño causado por el uso inapropiado del dispositivo.", font: "Calibri", size: 18, color: "000000" })] }),
              new Paragraph({ spacing: { after: 0 },            children: [new TextRun({ text: "7.  En caso de pérdida o robo debe ser reportado inmediatamente a la Vicepresidencia de Tecnología e Información.", font: "Calibri", size: 18, color: "000000" })] }),
            ],
          }),
        ],
      }),

      // OBSERVACIONES header
      grayHeaderRow("OBSERVACIONES"),

      // Observaciones entrega
      obsRow(val(datos.observacionesEntrega)),

      // Firma entrega  
      firmaRow(
        datos.firmaPath,
      formatFecha(datos.fechaFirma)
    ),


    ],
  });

  /* ── TABLA 2: DEVOLUCIÓN ── */
  const tabla2 = new Table({
    width: { size: 10093, type: WidthType.DXA },
    columnWidths: [4248, 2835, 3010],
    rows: [
      // Header DATOS DE EQUIPO DEVUELTO
      new TableRow({
        height: { value: 300, rule: "atLeast" },
        children: [
          new TableCell({
            width: { size: 10093, type: WidthType.DXA },
            columnSpan: 3,
            borders: ALL_BORDERS,
            shading: SHADING_GRAY,
            verticalAlign: VerticalAlign.CENTER,
            margins: CELL_MARGINS,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 0, line: 240 },
                children: [headerRun("DATOS DE EQUIPO DEVUELTO")],
              }),
            ],
          }),
        ],
      }),

      // Sub-header CELULAR | UNI (3 cols)
      new TableRow({
        height: { value: 200, rule: "atLeast" },
        children: [
          new TableCell({
            width: { size: 4248, type: WidthType.DXA },
            borders: ALL_BORDERS,
            shading: SHADING_CLEAR,
            verticalAlign: VerticalAlign.CENTER,
            margins: CELL_MARGINS,
            children: [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0, line: 240 }, children: [headerRun("CELULAR")] })],
          }),
          new TableCell({
            width: { size: 2835, type: WidthType.DXA },
            borders: ALL_BORDERS,
            shading: SHADING_CLEAR,
            verticalAlign: VerticalAlign.CENTER,
            margins: CELL_MARGINS,
            children: [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0, line: 240 }, children: [headerRun("UNI: ")] })],
          }),
          new TableCell({
            width: { size: 3010, type: WidthType.DXA },
            borders: ALL_BORDERS,
            shading: SHADING_CLEAR,
            verticalAlign: VerticalAlign.CENTER,
            margins: CELL_MARGINS,
            children: [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0, line: 240 }, children: [valueRun(val(datos.uni))] })],
          }),
        ],
      }),

      // Filas datos devolución (3 cols: label | span2)
      ...["MARCA", "MODELO", "SERIAL", "IMEI 1", "IMEI 2", "SIM", "NUMERO DE LINEA"].map((label, i) => {
        const values: Record<string, string> = {
          "MARCA":          val(datos.marca),
          "MODELO":         val(datos.modelo),
          "SERIAL":         val(datos.serial),
          "IMEI 1":         val(datos.imei1),
          "IMEI 2":         val(datos.imei2),
          "SIM":            val(datos.sim),
          "NUMERO DE LINEA": val(datos.numeroLinea),
        };
        return new TableRow({
          height: { value: 300, rule: "atLeast" },
          children: [
            new TableCell({
              width: { size: 4248, type: WidthType.DXA },
              borders: ALL_BORDERS,
              shading: SHADING_CLEAR,
              verticalAlign: VerticalAlign.CENTER,
              margins: CELL_MARGINS,
              children: [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0, line: 240 }, children: [headerRun(label)] })],
            }),
            new TableCell({
              width: { size: 5845, type: WidthType.DXA },
              columnSpan: 2,
              borders: ALL_BORDERS,
              shading: SHADING_CLEAR,
              verticalAlign: VerticalAlign.CENTER,
              margins: CELL_MARGINS,
              children: [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0, line: 240 }, children: [valueRun(values[label] ?? "")] })],
            }),
          ],
        });
      }),

      // OBSERVACIONES devolución header
      new TableRow({
        height: { value: 300, rule: "atLeast" },
        children: [
          new TableCell({
            width: { size: 10093, type: WidthType.DXA },
            columnSpan: 3,
            borders: ALL_BORDERS,
            shading: SHADING_GRAY,
            verticalAlign: VerticalAlign.CENTER,
            margins: CELL_MARGINS,
            children: [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0, line: 240 }, children: [headerRun("OBSERVACIONES")] })],
          }),
        ],
      }),

      // Obs devolución
      new TableRow({
        height: { value: 800, rule: "atLeast" },
        children: [
          new TableCell({
            width: { size: 10093, type: WidthType.DXA },
            columnSpan: 3,
            borders: ALL_BORDERS,
            shading: SHADING_CLEAR,
            verticalAlign: VerticalAlign.TOP,
            margins: CELL_MARGINS,
            children: [new Paragraph({ spacing: { after: 0, line: 240 }, children: [valueRun(val(datos.observacionesDevolucion))] })],
          }),
        ],
      }),

      // Fecha devolución
      new TableRow({
        height: { value: 300, rule: "atLeast" },
        children: [
          new TableCell({
            width: { size: 10093, type: WidthType.DXA },
            columnSpan: 3,
            borders: ALL_BORDERS,
            shading: SHADING_CLEAR,
            verticalAlign: VerticalAlign.CENTER,
            margins: CELL_MARGINS,
            children: [new Paragraph({ spacing: { after: 0, line: 240 }, children: [labelRun(`Fecha de devolución: `), valueRun(fechaDevolucion)] })],
          }),
        ],
      }),

      // Firma devolución
      new TableRow({
        height: { value: 700, rule: "atLeast" },
        children: [
          new TableCell({
            width: { size: 10093, type: WidthType.DXA },
            columnSpan: 3,
            borders: ALL_BORDERS,
            shading: SHADING_CLEAR,
            verticalAlign: VerticalAlign.CENTER,
            margins: CELL_MARGINS,
            children: [
              new Paragraph({
                spacing: { after: 0, line: 240 },
                children: [
                  new TextRun({ text: "        ", font: "Calibri", size: 20 }),
                  new TextRun({ text: "Firma:", bold: true, font: "Calibri", size: 24, color: "000000" }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  /* ── Documento ── */
  const doc = new Document({
    sections: [{
      properties: {
        page: {
          size: { width: 11906, height: 16838 }, // A4
          margin: { top: 567, right: 1274, bottom: 1417, left: 1701 },
        },
      },
      children: [
        ...(logoParagraph() ? [logoParagraph()!] : []),
        tabla1,
        new Paragraph({ spacing: { after: 200 }, children: [] }),
        tabla2,
      ],
    }],
  });

  return await Packer.toBuffer(doc);
}