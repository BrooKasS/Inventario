import ExcelJS from "exceljs";

// ─────────────────────────────────────────────────────────────────────────────
// Paleta — replica los colores usados en los scripts Python originales
// (openpyxl PatternFill / Font). ExcelJS usa ARGB (8 dígitos, con alpha "FF").
// ─────────────────────────────────────────────────────────────────────────────
export const LEGACY_COLORS = {
  header: "FFFFFF00", // amarillo — diario/semanal/mensual procesar_html.py
  row: "FFD9EAD3", // verde claro
  border: "FF000000",
};

export const KPI_COLORS = {
  header: "FF1E3A8A", // azul oscuro
  headerFg: "FFFFFFFF",
  odd: "FFEFF6FF", // azul muy claro
  even: "FFFFFFFF",
  total: "FFFEF9C3", // amarillo (filas de totales)
  alert: "FFFEE2E2", // rojo claro (fallos/advertencias)
  subtotal: "FFDBEAFE", // azul claro
  border: "FFCBD5E1",
};

function thinBorder(argb: string): Partial<ExcelJS.Borders> {
  const side: ExcelJS.Border = { style: "thin", color: { argb } };
  return { top: side, left: side, right: side, bottom: side };
}

export function autosizeColumns(sheet: ExcelJS.Worksheet, maxWidth = 55, padding = 2): void {
  sheet.columns.forEach((col) => {
    let maxLen = 0;
    col.eachCell?.({ includeEmpty: true }, (cell) => {
      const len = cell.value != null ? String(cell.value).length : 0;
      if (len > maxLen) maxLen = len;
    });
    col.width = Math.min(maxLen + padding, maxWidth);
  });
}

/**
 * Estilo "legacy" — usado por los informes diario / semanal / mensual.
 * Replica diario/scripts/procesar_html.py: encabezado amarillo + negrita,
 * filas de datos en verde claro con borde fino, columnas autoajustadas.
 */
export function applyLegacyStyle(sheet: ExcelJS.Worksheet): void {
  const headerRow = sheet.getRow(1);
  headerRow.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: LEGACY_COLORS.header } };
    cell.font = { bold: true };
  });

  for (let r = 2; r <= sheet.rowCount; r++) {
    const row = sheet.getRow(r);
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: LEGACY_COLORS.row } };
      cell.border = thinBorder(LEGACY_COLORS.border);
    });
  }

  autosizeColumns(sheet, 80);
}

/**
 * Estilo "KPI" — usado por el informe KPI (dashboard + FS/BD + VMware).
 * Replica KPI/script/procesar_html.py::_apply_styles: encabezado azul oscuro,
 * filas alternadas, filas de totales/alertas/subtotales resaltadas, freeze panes.
 */
export function applyKpiStyle(
  sheet: ExcelJS.Worksheet,
  opts?: { totalRows?: Set<number>; alertRows?: Set<number>; subtotalRows?: Set<number> }
): void {
  const totalRows = opts?.totalRows ?? new Set<number>();
  const alertRows = opts?.alertRows ?? new Set<number>();
  const subtotalRows = opts?.subtotalRows ?? new Set<number>();

  const headerRow = sheet.getRow(1);
  headerRow.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: KPI_COLORS.header } };
    cell.font = { bold: true, color: { argb: KPI_COLORS.headerFg }, size: 10, name: "Arial" };
    cell.border = thinBorder(KPI_COLORS.border);
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
  });
  headerRow.height = 28;

  for (let i = 2; i <= sheet.rowCount; i++) {
    const row = sheet.getRow(i);
    let bg = i % 2 === 0 ? KPI_COLORS.odd : KPI_COLORS.even;
    if (totalRows.has(i)) bg = KPI_COLORS.total;
    else if (alertRows.has(i)) bg = KPI_COLORS.alert;
    else if (subtotalRows.has(i)) bg = KPI_COLORS.subtotal;

    const bold = totalRows.has(i) || subtotalRows.has(i);

    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bg } };
      cell.border = thinBorder(KPI_COLORS.border);
      cell.font = { bold, size: 9, name: "Arial" };
      cell.alignment = { vertical: "middle" };
    });
  }

  autosizeColumns(sheet, 55, 4);
  sheet.views = [{ state: "frozen", ySplit: 1 }];
}
