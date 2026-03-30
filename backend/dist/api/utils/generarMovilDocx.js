"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generarWordMovil = generarWordMovil;
const docx_1 = require("docx");
/* ─── Helpers ─── */
const val = (v) => v ?? "";
function formatFecha(f) {
    if (!f)
        return "";
    const d = typeof f === "string" ? new Date(f) : f;
    return d.toLocaleDateString("es-CO", { day: "2-digit", month: "2-digit", year: "numeric" });
}
/* ─── Estilos de borde ─── */
const BORDER_SINGLE = { style: docx_1.BorderStyle.SINGLE, size: 8, color: "000000" };
const BORDER_NIL = { style: docx_1.BorderStyle.NIL, size: 0, color: "000000" };
const ALL_BORDERS = { top: BORDER_SINGLE, bottom: BORDER_SINGLE, left: BORDER_SINGLE, right: BORDER_SINGLE };
const SHADING_GRAY = { fill: "D9D9D9", type: docx_1.ShadingType.CLEAR, color: "000000" };
const SHADING_CLEAR = { fill: "auto", type: docx_1.ShadingType.CLEAR, color: "auto" };
const CELL_MARGINS = { top: 80, bottom: 80, left: 100, right: 100 };
/* ─── TextRun helpers ─── */
function labelRun(text) {
    return new docx_1.TextRun({
        text,
        bold: true,
        font: "Calibri",
        size: 20,
        color: "000000",
    });
}
function valueRun(text) {
    return new docx_1.TextRun({
        text,
        font: "Calibri",
        size: 20,
        color: "000000",
    });
}
function headerRun(text) {
    return new docx_1.TextRun({
        text,
        bold: true,
        font: "Calibri",
        size: 20,
        color: "000000",
    });
}
/* ─── Celda con label (izquierda) ─── */
function labelCell(text, width, borders = ALL_BORDERS) {
    return new docx_1.TableCell({
        width: { size: width, type: docx_1.WidthType.DXA },
        borders,
        shading: SHADING_CLEAR,
        verticalAlign: docx_1.VerticalAlign.CENTER,
        margins: CELL_MARGINS,
        children: [
            new docx_1.Paragraph({
                spacing: { after: 0, line: 240 },
                children: [labelRun(text)],
            }),
        ],
    });
}
/* ─── Celda con valor (derecha) ─── */
function valueCell(text, width, borders = ALL_BORDERS, span) {
    return new docx_1.TableCell({
        width: { size: width, type: docx_1.WidthType.DXA },
        columnSpan: span,
        borders,
        shading: SHADING_CLEAR,
        verticalAlign: docx_1.VerticalAlign.CENTER,
        margins: CELL_MARGINS,
        children: [
            new docx_1.Paragraph({
                spacing: { after: 0, line: 240 },
                children: [valueRun(text)],
            }),
        ],
    });
}
/* ─── Fila label | valor (2 columnas) ─── */
function labelValueRow(label, value, labelW = 4272, valueW = 5763) {
    return new docx_1.TableRow({
        height: { value: 280, rule: "atLeast" },
        children: [
            labelCell(label, labelW),
            valueCell(value, valueW, ALL_BORDERS, 4),
        ],
    });
}
/* ─── Fila header gris (full width) ─── */
function grayHeaderRow(text, totalW = 10035) {
    return new docx_1.TableRow({
        height: { value: 300, rule: "atLeast" },
        children: [
            new docx_1.TableCell({
                width: { size: totalW, type: docx_1.WidthType.DXA },
                columnSpan: 5,
                borders: ALL_BORDERS,
                shading: SHADING_GRAY,
                verticalAlign: docx_1.VerticalAlign.CENTER,
                margins: CELL_MARGINS,
                children: [
                    new docx_1.Paragraph({
                        alignment: docx_1.AlignmentType.CENTER,
                        spacing: { after: 0, line: 240 },
                        children: [headerRun(text)],
                    }),
                ],
            }),
        ],
    });
}
/* ─── Fila de datos equipo: LABEL | UNI: valor ─── */
function equipoHeaderRow(labelText, uniLabel, uniVal, totalW = 10035) {
    return new docx_1.TableRow({
        height: { value: 200, rule: "atLeast" },
        children: [
            new docx_1.TableCell({
                width: { size: 4272, type: docx_1.WidthType.DXA },
                borders: { top: BORDER_NIL, bottom: BORDER_SINGLE, left: BORDER_SINGLE, right: BORDER_SINGLE },
                shading: SHADING_CLEAR,
                verticalAlign: docx_1.VerticalAlign.CENTER,
                margins: CELL_MARGINS,
                children: [
                    new docx_1.Paragraph({
                        alignment: docx_1.AlignmentType.CENTER,
                        spacing: { after: 0, line: 240 },
                        children: [headerRun(labelText)],
                    }),
                ],
            }),
            new docx_1.TableCell({
                width: { size: 1435, type: docx_1.WidthType.DXA },
                borders: { top: BORDER_SINGLE, bottom: BORDER_NIL, left: BORDER_NIL, right: BORDER_SINGLE },
                shading: SHADING_CLEAR,
                verticalAlign: docx_1.VerticalAlign.CENTER,
                margins: CELL_MARGINS,
                children: [
                    new docx_1.Paragraph({
                        alignment: docx_1.AlignmentType.CENTER,
                        spacing: { after: 0, line: 240 },
                        children: [headerRun(`${uniLabel} `)],
                    }),
                ],
            }),
            new docx_1.TableCell({
                width: { size: 4305, type: docx_1.WidthType.DXA },
                columnSpan: 3,
                borders: { top: BORDER_SINGLE, bottom: BORDER_SINGLE, left: BORDER_NIL, right: BORDER_SINGLE },
                shading: SHADING_CLEAR,
                verticalAlign: docx_1.VerticalAlign.CENTER,
                margins: CELL_MARGINS,
                children: [
                    new docx_1.Paragraph({
                        alignment: docx_1.AlignmentType.CENTER,
                        spacing: { after: 0, line: 240 },
                        children: [valueRun(uniVal)],
                    }),
                ],
            }),
        ],
    });
}
/* ─── Fila simple centrada label | valor ─── */
function simpleRow(label, value) {
    return new docx_1.TableRow({
        height: { value: 280, rule: "atLeast" },
        children: [
            new docx_1.TableCell({
                width: { size: 4272, type: docx_1.WidthType.DXA },
                borders: { top: BORDER_NIL, bottom: BORDER_SINGLE, left: BORDER_SINGLE, right: BORDER_SINGLE },
                shading: SHADING_CLEAR,
                verticalAlign: docx_1.VerticalAlign.CENTER,
                margins: CELL_MARGINS,
                children: [
                    new docx_1.Paragraph({
                        alignment: docx_1.AlignmentType.CENTER,
                        spacing: { after: 0, line: 240 },
                        children: [headerRun(label)],
                    }),
                ],
            }),
            new docx_1.TableCell({
                width: { size: 5763, type: docx_1.WidthType.DXA },
                columnSpan: 4,
                borders: { top: BORDER_SINGLE, bottom: BORDER_NIL, left: BORDER_NIL, right: BORDER_SINGLE },
                shading: SHADING_CLEAR,
                verticalAlign: docx_1.VerticalAlign.CENTER,
                margins: CELL_MARGINS,
                children: [
                    new docx_1.Paragraph({
                        alignment: docx_1.AlignmentType.CENTER,
                        spacing: { after: 0, line: 240 },
                        children: [valueRun(value)],
                    }),
                ],
            }),
        ],
    });
}
/* ─── Fila observaciones (full width, alta) ─── */
function obsRow(text, height = 800, totalW = 10035) {
    return new docx_1.TableRow({
        height: { value: height, rule: "atLeast" },
        children: [
            new docx_1.TableCell({
                width: { size: totalW, type: docx_1.WidthType.DXA },
                columnSpan: 5,
                borders: ALL_BORDERS,
                shading: SHADING_CLEAR,
                verticalAlign: docx_1.VerticalAlign.TOP,
                margins: CELL_MARGINS,
                children: [
                    new docx_1.Paragraph({
                        spacing: { after: 0, line: 240 },
                        children: [valueRun(text)],
                    }),
                ],
            }),
        ],
    });
}
/* ─── Fila firma ─── */
function firmaRow(totalW = 10035) {
    return new docx_1.TableRow({
        height: { value: 700, rule: "atLeast" },
        children: [
            new docx_1.TableCell({
                width: { size: totalW, type: docx_1.WidthType.DXA },
                columnSpan: 5,
                borders: ALL_BORDERS,
                shading: SHADING_CLEAR,
                verticalAlign: docx_1.VerticalAlign.CENTER,
                margins: CELL_MARGINS,
                children: [
                    new docx_1.Paragraph({
                        spacing: { after: 0, line: 240 },
                        children: [
                            new docx_1.TextRun({ text: "        ", font: "Calibri", size: 20 }),
                            new docx_1.TextRun({ text: "Firma: ", bold: true, font: "Calibri", size: 24, color: "000000" }),
                        ],
                    }),
                ],
            }),
        ],
    });
}
/* ══════════════════════════════════════════════
   FUNCIÓN PRINCIPAL
══════════════════════════════════════════════ */
async function generarWordMovil(datos) {
    const fechaEntrega = formatFecha(datos.fechaEntrega);
    const fechaDevolucion = formatFecha(datos.fechaDevolucion);
    /* ── TABLA 1: ENTREGA ── */
    const tabla1 = new docx_1.Table({
        width: { size: 10035, type: docx_1.WidthType.DXA },
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
            new docx_1.TableRow({
                height: { value: 60, rule: "exact" },
                children: [
                    new docx_1.TableCell({
                        width: { size: 10035, type: docx_1.WidthType.DXA },
                        columnSpan: 5,
                        borders: { top: BORDER_NIL, bottom: BORDER_NIL, left: BORDER_NIL, right: BORDER_NIL },
                        shading: SHADING_CLEAR,
                        children: [new docx_1.Paragraph({ spacing: { after: 0 }, children: [] })],
                    }),
                ],
            }),
            // Header DATOS DE EQUIPO ENTREGADO
            grayHeaderRow("DATOS DE EQUIPO ENTREGADO"),
            // Sub-header CELULAR | UNI
            equipoHeaderRow("CELULAR", "UNI:", val(datos.uni)),
            // Filas de datos equipo
            simpleRow("MARCA", val(datos.marca)),
            simpleRow("MODELO", val(datos.modelo)),
            simpleRow("SERIAL", val(datos.serial)),
            simpleRow("IMEI 1", val(datos.imei1)),
            simpleRow("IMEI 2", val(datos.imei2)),
            simpleRow("SIM", val(datos.sim)),
            simpleRow("NUMERO DE LINEA", val(datos.numeroLinea)),
            // Recomendaciones de Uso (header gris)
            grayHeaderRow("Recomendaciones de Uso"),
            // Texto fijo recomendaciones
            new docx_1.TableRow({
                height: { value: 400, rule: "atLeast" },
                children: [
                    new docx_1.TableCell({
                        width: { size: 10035, type: docx_1.WidthType.DXA },
                        columnSpan: 5,
                        borders: ALL_BORDERS,
                        shading: SHADING_CLEAR,
                        verticalAlign: docx_1.VerticalAlign.TOP,
                        margins: CELL_MARGINS,
                        children: [
                            new docx_1.Paragraph({ spacing: { after: 0, line: 240 }, children: [new docx_1.TextRun({ text: "1.  El equipo móvil debe utilizarse principalmente para actividades relacionadas con el trabajo.", font: "Calibri", size: 18, color: "000000" })] }),
                            new docx_1.Paragraph({ spacing: { after: 0, line: 240 }, children: [new docx_1.TextRun({ text: "2.  No se deben almacenar, compartir o transmitir datos sensibles o confidenciales sin medidas de seguridad adecuadas.", font: "Calibri", size: 18, color: "000000" })] }),
                            new docx_1.Paragraph({ spacing: { after: 0, line: 240 }, children: [new docx_1.TextRun({ text: "3.  Está prohibida la instalación de aplicaciones no autorizadas o sospechosas.", font: "Calibri", size: 18, color: "000000" })] }),
                            new docx_1.Paragraph({ spacing: { after: 0, line: 240 }, children: [new docx_1.TextRun({ text: "4.  Los dispositivos deben estar protegidos con contraseñas seguras, huella dactilar o reconocimiento facial.", font: "Calibri", size: 18, color: "000000" })] }),
                            new docx_1.Paragraph({ spacing: { after: 0, line: 240 }, children: [new docx_1.TextRun({ text: "5.  Los equipos móviles deben ser manipulados únicamente por personal autorizado en caso de reparaciones.", font: "Calibri", size: 18, color: "000000" })] }),
                            new docx_1.Paragraph({ spacing: { after: 0, line: 240 }, children: [new docx_1.TextRun({ text: "6.  El usuario es responsable de cualquier daño causado por el uso inapropiado del dispositivo.", font: "Calibri", size: 18, color: "000000" })] }),
                            new docx_1.Paragraph({ spacing: { after: 0 }, children: [new docx_1.TextRun({ text: "7.  En caso de pérdida o robo debe ser reportado inmediatamente a la Vicepresidencia de Tecnología e Información.", font: "Calibri", size: 18, color: "000000" })] }),
                        ],
                    }),
                ],
            }),
            // OBSERVACIONES header
            grayHeaderRow("OBSERVACIONES"),
            // Observaciones entrega
            obsRow(val(datos.observacionesEntrega)),
            // Firma entrega
            firmaRow(),
        ],
    });
    /* ── TABLA 2: DEVOLUCIÓN ── */
    const tabla2 = new docx_1.Table({
        width: { size: 10093, type: docx_1.WidthType.DXA },
        columnWidths: [4248, 2835, 3010],
        rows: [
            // Header DATOS DE EQUIPO DEVUELTO
            new docx_1.TableRow({
                height: { value: 300, rule: "atLeast" },
                children: [
                    new docx_1.TableCell({
                        width: { size: 10093, type: docx_1.WidthType.DXA },
                        columnSpan: 3,
                        borders: ALL_BORDERS,
                        shading: SHADING_GRAY,
                        verticalAlign: docx_1.VerticalAlign.CENTER,
                        margins: CELL_MARGINS,
                        children: [
                            new docx_1.Paragraph({
                                alignment: docx_1.AlignmentType.CENTER,
                                spacing: { after: 0, line: 240 },
                                children: [headerRun("DATOS DE EQUIPO DEVUELTO")],
                            }),
                        ],
                    }),
                ],
            }),
            // Sub-header CELULAR | UNI (3 cols)
            new docx_1.TableRow({
                height: { value: 200, rule: "atLeast" },
                children: [
                    new docx_1.TableCell({
                        width: { size: 4248, type: docx_1.WidthType.DXA },
                        borders: ALL_BORDERS,
                        shading: SHADING_CLEAR,
                        verticalAlign: docx_1.VerticalAlign.CENTER,
                        margins: CELL_MARGINS,
                        children: [new docx_1.Paragraph({ alignment: docx_1.AlignmentType.CENTER, spacing: { after: 0, line: 240 }, children: [headerRun("CELULAR")] })],
                    }),
                    new docx_1.TableCell({
                        width: { size: 2835, type: docx_1.WidthType.DXA },
                        borders: ALL_BORDERS,
                        shading: SHADING_CLEAR,
                        verticalAlign: docx_1.VerticalAlign.CENTER,
                        margins: CELL_MARGINS,
                        children: [new docx_1.Paragraph({ alignment: docx_1.AlignmentType.CENTER, spacing: { after: 0, line: 240 }, children: [headerRun("UNI: ")] })],
                    }),
                    new docx_1.TableCell({
                        width: { size: 3010, type: docx_1.WidthType.DXA },
                        borders: ALL_BORDERS,
                        shading: SHADING_CLEAR,
                        verticalAlign: docx_1.VerticalAlign.CENTER,
                        margins: CELL_MARGINS,
                        children: [new docx_1.Paragraph({ alignment: docx_1.AlignmentType.CENTER, spacing: { after: 0, line: 240 }, children: [valueRun(val(datos.uni))] })],
                    }),
                ],
            }),
            // Filas datos devolución (3 cols: label | span2)
            ...["MARCA", "MODELO", "SERIAL", "IMEI 1", "IMEI 2", "SIM", "NUMERO DE LINEA"].map((label, i) => {
                const values = {
                    "MARCA": val(datos.marca),
                    "MODELO": val(datos.modelo),
                    "SERIAL": val(datos.serial),
                    "IMEI 1": val(datos.imei1),
                    "IMEI 2": val(datos.imei2),
                    "SIM": val(datos.sim),
                    "NUMERO DE LINEA": val(datos.numeroLinea),
                };
                return new docx_1.TableRow({
                    height: { value: 300, rule: "atLeast" },
                    children: [
                        new docx_1.TableCell({
                            width: { size: 4248, type: docx_1.WidthType.DXA },
                            borders: ALL_BORDERS,
                            shading: SHADING_CLEAR,
                            verticalAlign: docx_1.VerticalAlign.CENTER,
                            margins: CELL_MARGINS,
                            children: [new docx_1.Paragraph({ alignment: docx_1.AlignmentType.CENTER, spacing: { after: 0, line: 240 }, children: [headerRun(label)] })],
                        }),
                        new docx_1.TableCell({
                            width: { size: 5845, type: docx_1.WidthType.DXA },
                            columnSpan: 2,
                            borders: ALL_BORDERS,
                            shading: SHADING_CLEAR,
                            verticalAlign: docx_1.VerticalAlign.CENTER,
                            margins: CELL_MARGINS,
                            children: [new docx_1.Paragraph({ alignment: docx_1.AlignmentType.CENTER, spacing: { after: 0, line: 240 }, children: [valueRun(values[label] ?? "")] })],
                        }),
                    ],
                });
            }),
            // OBSERVACIONES devolución header
            new docx_1.TableRow({
                height: { value: 300, rule: "atLeast" },
                children: [
                    new docx_1.TableCell({
                        width: { size: 10093, type: docx_1.WidthType.DXA },
                        columnSpan: 3,
                        borders: ALL_BORDERS,
                        shading: SHADING_GRAY,
                        verticalAlign: docx_1.VerticalAlign.CENTER,
                        margins: CELL_MARGINS,
                        children: [new docx_1.Paragraph({ alignment: docx_1.AlignmentType.CENTER, spacing: { after: 0, line: 240 }, children: [headerRun("OBSERVACIONES")] })],
                    }),
                ],
            }),
            // Obs devolución
            new docx_1.TableRow({
                height: { value: 800, rule: "atLeast" },
                children: [
                    new docx_1.TableCell({
                        width: { size: 10093, type: docx_1.WidthType.DXA },
                        columnSpan: 3,
                        borders: ALL_BORDERS,
                        shading: SHADING_CLEAR,
                        verticalAlign: docx_1.VerticalAlign.TOP,
                        margins: CELL_MARGINS,
                        children: [new docx_1.Paragraph({ spacing: { after: 0, line: 240 }, children: [valueRun(val(datos.observacionesDevolucion))] })],
                    }),
                ],
            }),
            // Fecha devolución
            new docx_1.TableRow({
                height: { value: 300, rule: "atLeast" },
                children: [
                    new docx_1.TableCell({
                        width: { size: 10093, type: docx_1.WidthType.DXA },
                        columnSpan: 3,
                        borders: ALL_BORDERS,
                        shading: SHADING_CLEAR,
                        verticalAlign: docx_1.VerticalAlign.CENTER,
                        margins: CELL_MARGINS,
                        children: [new docx_1.Paragraph({ spacing: { after: 0, line: 240 }, children: [labelRun(`Fecha de devolución: `), valueRun(fechaDevolucion)] })],
                    }),
                ],
            }),
            // Firma devolución
            new docx_1.TableRow({
                height: { value: 700, rule: "atLeast" },
                children: [
                    new docx_1.TableCell({
                        width: { size: 10093, type: docx_1.WidthType.DXA },
                        columnSpan: 3,
                        borders: ALL_BORDERS,
                        shading: SHADING_CLEAR,
                        verticalAlign: docx_1.VerticalAlign.CENTER,
                        margins: CELL_MARGINS,
                        children: [
                            new docx_1.Paragraph({
                                spacing: { after: 0, line: 240 },
                                children: [
                                    new docx_1.TextRun({ text: "        ", font: "Calibri", size: 20 }),
                                    new docx_1.TextRun({ text: "Firma:", bold: true, font: "Calibri", size: 24, color: "000000" }),
                                ],
                            }),
                        ],
                    }),
                ],
            }),
        ],
    });
    /* ── Documento ── */
    const doc = new docx_1.Document({
        sections: [{
                properties: {
                    page: {
                        size: { width: 11906, height: 16838 }, // A4
                        margin: { top: 567, right: 1274, bottom: 1417, left: 1701 },
                    },
                },
                children: [
                    tabla1,
                    new docx_1.Paragraph({ spacing: { after: 200 }, children: [] }),
                    tabla2,
                ],
            }],
    });
    return await docx_1.Packer.toBuffer(doc);
}
