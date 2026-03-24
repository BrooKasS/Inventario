import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  BorderStyle,
  WidthType,
  ShadingType,
  AlignmentType,
  VerticalAlign,
  HeightRule,
  convertInchesToTwip,
} from "docx";

interface MovilDocxData {
  numeroCaso?: string | null;
  region?: string | null;
  dependencia?: string | null;
  nombreUsuario?: string | null;
  sede?: string | null;
  cedula?: string | null;
  fecha?: string | null;
  usuarioRed?: string | null;
  marca?: string | null;
  modelo?: string | null;
  serial?: string | null;
  imei1?: string | null;
  imei2?: string | null;
  sim?: string | null;
  numeroLinea?: string | null;
  observacionesEntrega?: string | null;
  observacionesDevolucion?: string | null;
}

const BORDER_STYLE = {
  style: BorderStyle.SINGLE,
  size: 8,
  color: "000000",
};

const GRAY_SHADING = {
  type: ShadingType.CLEAR,
  color: "D9D9D9",
};

function createBorderedCell(text: string, isBold = false, isGray = false, colspan = 1): TableCell {
  return new TableCell({
    text: text || "",
    borders: {
      top: BORDER_STYLE,
      bottom: BORDER_STYLE,
      left: BORDER_STYLE,
      right: BORDER_STYLE,
    },
    shading: isGray ? GRAY_SHADING : undefined,
    children: [
      new Paragraph({
        text,
        run: new TextRun({
          font: "Calibri",
          size: isBold ? 40 : 24, // 20 half-points = 10pt (bold), 24 = 12pt
          bold: isBold,
        }),
      }),
    ],
    width: { size: 100, type: WidthType.PERCENTAGE },
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 50, bottom: 50, left: 50, right: 50 },
  });
}

export async function generarMovilDocx(data: MovilDocxData): Promise<Buffer> {
  const recomendaciones = [
    "El equipo móvil debe utilizarse principalmente para actividades relacionadas con el trabajo.",
    "No se deben almacenar, compartir o transmitir datos sensibles o confidenciales sin medidas de seguridad adecuadas, como cifrado o autenticación de dos factores.",
    "Está prohibida la instalación de aplicaciones no autorizadas o sospechosas que puedan comprometer la seguridad del equipo o la privacidad de los datos.",
    "Los dispositivos deben estar protegidos con contraseñas seguras, huella dactilar o reconocimiento facial. Las contraseñas deben cambiarse regularmente.",
    "Los equipos móviles deben ser manipulados únicamente por personal autorizado en caso de reparaciones o mantenimiento, evitando el uso de servicios no certificados.",
    "El usuario es responsable de cualquier daño causado por el uso inapropiado del dispositivo.",
    "En caso de pérdida o robo debe ser reportado inmediatamente a la Vicepresidencia de Tecnología e Información.",
  ];

  const recomendacionesText = recomendaciones
    .map((r, i) => `${i + 1}. ${r}`)
    .join("\n\n");

  // TABLA 1: DATOS PERSONALES + EQUIPO ENTREGADO
  const tabla1 = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      // Fila 1: # Caso + Región
      new TableRow({
        cells: [
          createBorderedCell(`# Caso: ${data.numeroCaso || ""}`),
          createBorderedCell(`Región/Departamento: ${data.region || ""}`),
        ],
      }),
      // Fila 2: Dependencia + Nombre
      new TableRow({
        cells: [
          createBorderedCell(`Dependencia/Área: ${data.dependencia || ""}`),
          createBorderedCell(`Nombre: ${data.nombreUsuario || ""}`),
        ],
      }),
      // Fila 3: Sede + Cédula
      new TableRow({
        cells: [
          createBorderedCell(`Sede: ${data.sede || ""}`),
          createBorderedCell(`C.C.: ${data.cedula || ""}`),
        ],
      }),
      // Fila 4: Fecha + Usuario Red
      new TableRow({
        cells: [
          createBorderedCell(`Fecha: ${data.fecha || ""}`),
          createBorderedCell(`Usuario de red: ${data.usuarioRed || ""}`),
        ],
      }),
      // Fila 5: Separador vacío
      new TableRow({
        cells: [createBorderedCell(""), createBorderedCell("")],
      }),
      // Fila 6: DATOS DE EQUIPO ENTREGADO (GRIS)
      new TableRow({
        cells: [
          new TableCell({
            columnSpan: 2,
            text: "DATOS DE EQUIPO ENTREGADO",
            borders: {
              top: BORDER_STYLE,
              bottom: BORDER_STYLE,
              left: BORDER_STYLE,
              right: BORDER_STYLE,
            },
            shading: GRAY_SHADING,
            children: [
              new Paragraph({
                text: "DATOS DE EQUIPO ENTREGADO",
                run: new TextRun({
                  font: "Calibri",
                  size: 40,
                  bold: true,
                }),
              }),
            ],
          }),
        ],
      }),
      // Fila 7: CELULAR + UNI:
      new TableRow({
        cells: [createBorderedCell("CELULAR"), createBorderedCell("UNI:")],
      }),
      // Fila 8: MARCA
      new TableRow({
        cells: [createBorderedCell("MARCA"), createBorderedCell(data.marca || "")],
      }),
      // Fila 9: MODELO
      new TableRow({
        cells: [createBorderedCell("MODELO"), createBorderedCell(data.modelo || "")],
      }),
      // Fila 10: SERIAL
      new TableRow({
        cells: [createBorderedCell("SERIAL"), createBorderedCell(data.serial || "")],
      }),
      // Fila 11: IMEI 1
      new TableRow({
        cells: [
          createBorderedCell("IMEI 1"),
          createBorderedCell(data.imei1 || ""),
        ],
      }),
      // Fila 12: IMEI 2
      new TableRow({
        cells: [
          createBorderedCell("IMEI 2"),
          createBorderedCell(data.imei2 || ""),
        ],
      }),
      // Fila 13: SIM
      new TableRow({
        cells: [createBorderedCell("SIM"), createBorderedCell(data.sim || "")],
      }),
      // Fila 14: NÚMERO DE LÍNEA
      new TableRow({
        cells: [
          createBorderedCell("NUMERO DE LINEA"),
          createBorderedCell(data.numeroLinea || ""),
        ],
      }),
      // Fila 15: Recomendaciones de Uso (GRIS)
      new TableRow({
        cells: [
          new TableCell({
            columnSpan: 2,
            text: "Recomendaciones de Uso",
            borders: {
              top: BORDER_STYLE,
              bottom: BORDER_STYLE,
              left: BORDER_STYLE,
              right: BORDER_STYLE,
            },
            shading: GRAY_SHADING,
            children: [
              new Paragraph({
                text: "Recomendaciones de Uso",
                run: new TextRun({
                  font: "Calibri",
                  size: 40,
                  bold: true,
                }),
              }),
            ],
          }),
        ],
      }),
      // Fila 16: Bullets de recomendaciones
      new TableRow({
        cells: [
          new TableCell({
            columnSpan: 2,
            borders: {
              top: BORDER_STYLE,
              bottom: BORDER_STYLE,
              left: BORDER_STYLE,
              right: BORDER_STYLE,
            },
            children: recomendaciones.map(
              (rec, i) =>
                new Paragraph({
                  text: `${i + 1}. ${rec}`,
                  run: new TextRun({
                    font: "Calibri",
                    size: 24,
                  }),
                  spacing: { line: 240, lineRule: "auto" },
                })
            ),
          }),
        ],
      }),
      // Fila 17: OBSERVACIONES (GRIS)
      new TableRow({
        cells: [
          new TableCell({
            columnSpan: 2,
            text: "OBSERVACIONES",
            borders: {
              top: BORDER_STYLE,
              bottom: BORDER_STYLE,
              left: BORDER_STYLE,
              right: BORDER_STYLE,
            },
            shading: GRAY_SHADING,
            children: [
              new Paragraph({
                text: "OBSERVACIONES",
                run: new TextRun({
                  font: "Calibri",
                  size: 40,
                  bold: true,
                }),
              }),
            ],
          }),
        ],
      }),
      // Fila 18: Observaciones Entrega
      new TableRow({
        cells: [
          new TableCell({
            columnSpan: 2,
            text: data.observacionesEntrega || "",
            borders: {
              top: BORDER_STYLE,
              bottom: BORDER_STYLE,
              left: BORDER_STYLE,
              right: BORDER_STYLE,
            },
            children: [
              new Paragraph({
                text: data.observacionesEntrega || "",
                run: new TextRun({
                  font: "Calibri",
                  size: 24,
                }),
              }),
            ],
          }),
        ],
      }),
      // Fila 19: Firma
      new TableRow({
        cells: [
          createBorderedCell("Firma:"),
          createBorderedCell(""),
        ],
      }),
    ],
  });

  // TABLA 2: DATOS DE EQUIPO DEVUELTO (vacía para llenar a mano)
  const tabla2 = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      // Fila 20: DATOS DE EQUIPO DEVUELTO (GRIS)
      new TableRow({
        cells: [
          new TableCell({
            columnSpan: 2,
            text: "DATOS DE EQUIPO DEVUELTO",
            borders: {
              top: BORDER_STYLE,
              bottom: BORDER_STYLE,
              left: BORDER_STYLE,
              right: BORDER_STYLE,
            },
            shading: GRAY_SHADING,
            children: [
              new Paragraph({
                text: "DATOS DE EQUIPO DEVUELTO",
                run: new TextRun({
                  font: "Calibri",
                  size: 40,
                  bold: true,
                }),
              }),
            ],
          }),
        ],
      }),
      // Fila 21: CELULAR + UNI:
      new TableRow({
        cells: [createBorderedCell("CELULAR"), createBorderedCell("UNI:")],
      }),
      // Filas 22-28: Campos vacíos para llenar a mano
      new TableRow({
        cells: [createBorderedCell("MARCA"), createBorderedCell("")],
      }),
      new TableRow({
        cells: [createBorderedCell("MODELO"), createBorderedCell("")],
      }),
      new TableRow({
        cells: [createBorderedCell("SERIAL"), createBorderedCell("")],
      }),
      new TableRow({
        cells: [createBorderedCell("IMEI 1"), createBorderedCell("")],
      }),
      new TableRow({
        cells: [createBorderedCell("IMEI 2"), createBorderedCell("")],
      }),
      new TableRow({
        cells: [createBorderedCell("SIM"), createBorderedCell("")],
      }),
      new TableRow({
        cells: [createBorderedCell("NUMERO DE LINEA"), createBorderedCell("")],
      }),
      // Fila 29: OBSERVACIONES (GRIS)
      new TableRow({
        cells: [
          new TableCell({
            columnSpan: 2,
            text: "OBSERVACIONES",
            borders: {
              top: BORDER_STYLE,
              bottom: BORDER_STYLE,
              left: BORDER_STYLE,
              right: BORDER_STYLE,
            },
            shading: GRAY_SHADING,
            children: [
              new Paragraph({
                text: "OBSERVACIONES",
                run: new TextRun({
                  font: "Calibri",
                  size: 40,
                  bold: true,
                }),
              }),
            ],
          }),
        ],
      }),
      // Fila 30: Observaciones vacía para llenar a mano
      new TableRow({
        cells: [
          new TableCell({
            columnSpan: 2,
            text: "",
            borders: {
              top: BORDER_STYLE,
              bottom: BORDER_STYLE,
              left: BORDER_STYLE,
              right: BORDER_STYLE,
            },
            children: [new Paragraph("")],
          }),
        ],
      }),
      // Fila 31: Firma
      new TableRow({
        cells: [
          createBorderedCell("Firma:"),
          createBorderedCell(""),
        ],
      }),
    ],
  });

  const document = new Document({
    sections: [
      {
        margins: {
          top: 567,
          right: 1274,
          bottom: 1417,
          left: 1701,
        },
        children: [
          // Header con título
          new Paragraph({
            text: "FORMATO ENTREGA EQUIPOS MOVILES VTI",
            run: new TextRun({
              font: "Calibri",
              size: 40,
              bold: true,
            }),
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),
          tabla1,
          new Paragraph({ text: "" }),
          tabla2,
        ],
      },
    ],
  });

  return await Packer.toBuffer(document);
}
