"""
exportInventario.py - VERSIÓN DEFINITIVA v3
Replica EXACTAMENTE el estilo del template original:
  - Fuente: Calibri 11 (igual que el template)
  - Bordes: thin todos lados (medium solo en BD/UPS col B izquierda, col final derecha)
  - Altura de fila: 15.75 Servidores/BD, 30.75 Redes/UPS (igual que el template)
  - Alineación: sin forzar wrap_text ni h/v (Excel lo gestiona solo, igual que el original)
  - Anchos de columna: idénticos al template (sin estirar artificialmente)
  - Fechas: parsea CUALQUIER formato (ISO, JS Date string, datetime) → DD/MM/YYYY

Ubicación: backend/src/api/utils/exportInventario.py
Uso:       python exportInventario.py <payload.json> <output.xlsx>
"""

import sys
import json
import copy
import re
from datetime import datetime
from openpyxl import load_workbook, Workbook
from openpyxl.styles import Font, Border, Side, Alignment, PatternFill


# ─────────────────────────────────────────────────────────────────────
# PARSEO DE FECHAS
# Maneja todos los formatos posibles que puede enviar el frontend/backend:
#   - ISO:        "2023-03-31T00:00:00.000Z"
#   - ISO corto:  "2023-03-31"
#   - JS Date:    "Thu Mar 30 2023 19:00:00 GMT-0500 (Colombia Standard Time)"
#   - datetime:   objeto datetime de Python
#   - Ya formato: "31/03/2023"
# ─────────────────────────────────────────────────────────────────────
_JS_MONTHS = {
    'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4,  'May': 5,  'Jun': 6,
    'Jul': 7, 'Aug': 8, 'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12,
}

def format_date(val):
    if val is None or val == '':
        return None
    if isinstance(val, datetime):
        return val.strftime('%d/%m/%Y')
    s = str(val).strip()
    if not s:
        return None

    # ISO: 2023-03-31T... o 2023-03-31
    m = re.match(r'^(\d{4})-(\d{2})-(\d{2})', s)
    if m:
        return f"{m.group(3)}/{m.group(2)}/{m.group(1)}"

    # JS Date string: "Thu Mar 30 2023 19:00:00 GMT-0500 (...)"
    # o "Thu Mar 30 2023"
    m = re.search(r'(\w{3})\s+(\w{3})\s+(\d{1,2})\s+(\d{4})', s)
    if m:
        month_str = m.group(2)
        day       = int(m.group(3))
        year      = int(m.group(4))
        month     = _JS_MONTHS.get(month_str)
        if month:
            return f"{day:02d}/{month:02d}/{year}"

    # Ya en DD/MM/YYYY
    if re.match(r'^\d{2}/\d{2}/\d{4}$', s):
        return s

    return s  # fallback: devolver tal cual


DATE_KEYS = {'fechaFinSoporte', 'fechaFinalSoporte'}


# ─────────────────────────────────────────────────────────────────────
# ESTILOS — replicados exactamente del template
# ─────────────────────────────────────────────────────────────────────
def make_border(left='thin', right='thin', top='thin', bottom='thin'):
    def side(style):
        return Side(style=style) if style else Side(style=None)
    return Border(left=side(left), right=side(right),
                  top=side(top),   bottom=side(bottom))

BORDER_THIN   = make_border()                        # todos thin
BORDER_SRV    = make_border()                        # Servidores: thin todos
BORDER_RED    = make_border()                        # Redes: thin todos
BORDER_UPS_B  = make_border(left='medium')           # UPS col B: medium izq
BORDER_UPS_D  = make_border(left='thin', right='medium')  # UPS col D: medium der
BORDER_UPS    = make_border(left='medium')           # UPS resto: medium izq
BORDER_BD_B   = make_border(left='medium')           # BD col B: medium izq
BORDER_BD_N   = make_border(right='medium')          # BD col N: medium der
BORDER_BD     = make_border()                        # BD resto: thin

FONT_DATA = Font(name='Calibri', size=11, bold=False, color='FF000000')
ALIGN_DATA = Alignment(wrap_text=True, vertical='center')   # wrap_text=True igual que Redes/UPS en template

# Alturas de fila por hoja (igual que template)
ROW_HEIGHTS = {
    'InventarioServidores': 15.75,
    'InventarioRedes':      30.75,
    'InventarioUPS':        30.75,
    'InventarioBD':         15.75,
}


def get_border(sheet_name, col_index_0based, total_cols):
    """
    Devuelve el borde correcto según la hoja y posición de columna.
    col_index_0based: 0 = col B, 1 = col C, ...
    """
    if sheet_name == 'InventarioUPS':
        if col_index_0based == 0:            return copy.copy(BORDER_UPS_B)
        if col_index_0based == 2:            return copy.copy(BORDER_UPS_D)
        return copy.copy(BORDER_UPS)
    if sheet_name == 'InventarioBD':
        if col_index_0based == 0:            return copy.copy(BORDER_BD_B)
        if col_index_0based == total_cols - 1: return copy.copy(BORDER_BD_N)
        return copy.copy(BORDER_BD)
    return copy.copy(BORDER_THIN)


# ─────────────────────────────────────────────────────────────────────
# COPIA DE HEADER (filas 1-10 del template)
# ─────────────────────────────────────────────────────────────────────
def copy_cell(src, dst):
    dst.value = src.value
    if src.has_style:
        dst.font          = copy.copy(src.font)
        dst.border        = copy.copy(src.border)
        dst.fill          = copy.copy(src.fill)
        dst.number_format = src.number_format
        dst.alignment     = copy.copy(src.alignment)


def copy_header(src_ws, dst_ws, header_rows=10):
    for row in src_ws.iter_rows(min_row=1, max_row=header_rows):
        for cell in row:
            copy_cell(cell, dst_ws.cell(row=cell.row, column=cell.column))

    for merge in src_ws.merged_cells.ranges:
        if merge.max_row <= header_rows:
            dst_ws.merge_cells(str(merge))

    # Anchos exactos del template (sin modificar)
    for col_letter, col_dim in src_ws.column_dimensions.items():
        dst_ws.column_dimensions[col_letter].width = col_dim.width

    # Alturas exactas del header
    for row_idx in range(1, header_rows + 1):
        rd = src_ws.row_dimensions.get(row_idx)
        if rd and rd.height:
            dst_ws.row_dimensions[row_idx].height = rd.height


# ─────────────────────────────────────────────────────────────────────
# ESCRITURA DE DATOS
# ─────────────────────────────────────────────────────────────────────
def write_data_rows(ws, sheet_name, data_rows, col_map, date_cols=None, start_row=11):
    """
    col_map   : lista de keys en orden (B=índice 0).
    date_cols : set de índices 0-based que son fechas.
    """
    if date_cols is None:
        date_cols = set()

    row_height = ROW_HEIGHTS.get(sheet_name, 15.75)
    total_cols = len(col_map)

    for i, row_data in enumerate(data_rows):
        row_num = start_row + i
        for j, key in enumerate(col_map):
            col_num = 2 + j   # B = 2
            raw_val = row_data.get(key, None)

            # Formatear fechas
            if j in date_cols or key in DATE_KEYS:
                val = format_date(raw_val)
            else:
                val = raw_val if raw_val not in ('', None) else None

            cell = ws.cell(row=row_num, column=col_num)
            cell.value     = val
            cell.font      = copy.copy(FONT_DATA)
            cell.border    = get_border(sheet_name, j, total_cols)
            cell.alignment = copy.copy(ALIGN_DATA)

        # Altura igual al template
        ws.row_dimensions[row_num].height = row_height


# ─────────────────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────────────────
def main():
    if len(sys.argv) < 3:
        print("Uso: python exportInventario.py <payload.json> <output.xlsx>")
        sys.exit(1)

    payload_path = sys.argv[1]
    output_path  = sys.argv[2]

    with open(payload_path, 'r', encoding='utf-8') as f:
        payload = json.load(f)

    template_path = payload['template']

    # Abrir template solo para leer header (data_only=True evita recalcular fórmulas)
    src_wb = load_workbook(template_path, read_only=False, data_only=True)

    # Workbook nuevo desde cero — evita iterar el millón de filas vacías del template
    dst_wb = Workbook()
    dst_wb.remove(dst_wb.active)

    # ── SERVIDORES ──────────────────────────────────────────────────
    # B  nombre            C  propietario        D  custodio
    # E  monitoreo         F  backup             G  ipInterna
    # H  ipGestion         I  ipServicio         J  ambiente
    # K  tipoServidor      L  appSoporta         M  ubicacion
    # N  vcpu              O  vramMb             P  sistemaOperativo
    # Q  fechaFinSoporte   R  rutasBackup        S  contratoQueSoporta
    src_ws = src_wb['InventarioServidores']
    dst_ws = dst_wb.create_sheet('InventarioServidores')
    copy_header(src_ws, dst_ws)
    write_data_rows(dst_ws, 'InventarioServidores', payload['servidores'], [
        'nombre', 'propietario', 'custodio', 'monitoreo', 'backup',
        'ipInterna', 'ipGestion', 'ipServicio',
        'ambiente', 'tipoServidor', 'appSoporta', 'ubicacion',
        'vcpu', 'vramMb', 'sistemaOperativo',
        'fechaFinSoporte', 'rutasBackup', 'contratoQueSoporta',
    ], date_cols={15})

    # ── REDES ────────────────────────────────────────────────────────
    # B  nombre            C  propietario        D  custodio
    # E  serial            F  mac                G  modelo
    # H  fechaFinSoporte   I  ipGestion          J  estado
    # K  codigoServicio    L  ubicacion          M  contratoQueSoporta
    src_ws = src_wb['InventarioRedes']
    dst_ws = dst_wb.create_sheet('InventarioRedes')
    copy_header(src_ws, dst_ws)
    write_data_rows(dst_ws, 'InventarioRedes', payload['redes'], [
        'nombre', 'propietario', 'custodio', 'serial', 'mac', 'modelo',
        'fechaFinSoporte', 'ipGestion', 'estado', 'codigoServicio',
        'ubicacion', 'contratoQueSoporta',
    ], date_cols={6})

    # ── UPS ──────────────────────────────────────────────────────────
    # B  nombre    C  propietario  D  custodio
    # E  serial    F  placa        G  modelo
    # H  estado    I  ubicacion
    src_ws = src_wb['InventarioUPS']
    dst_ws = dst_wb.create_sheet('InventarioUPS')
    copy_header(src_ws, dst_ws)
    write_data_rows(dst_ws, 'InventarioUPS', payload['ups'], [
        'nombre', 'propietario', 'custodio', 'serial', 'placa',
        'modelo', 'estado', 'ubicacion',
    ])

    # ── BASES DE DATOS ───────────────────────────────────────────────
    # B  nombre              C  propietario          D  custodio
    # E  servidor1           F  servidor2            G  racScan
    # H  ambiente            I  appSoporta           J  versionBd
    # K  fechaFinalSoporte   L  contenedorFisico     M  contratoQueSoporta
    src_ws = src_wb['InventarioBD']
    dst_ws = dst_wb.create_sheet('InventarioBD')
    copy_header(src_ws, dst_ws)
    write_data_rows(dst_ws, 'InventarioBD', payload['bds'], [
        'nombre', 'propietario', 'custodio', 'servidor1', 'servidor2',
        'racScan', 'ambiente', 'appSoporta', 'versionBd',
        'fechaFinalSoporte', 'contenedorFisico', 'contratoQueSoporta',
    ], date_cols={9})

    # ── CONTROL DE CAMBIOS (solo header) ────────────────────────────
    if 'Control de Cambios' in src_wb.sheetnames:
        src_ws = src_wb['Control de Cambios']
        dst_ws = dst_wb.create_sheet('Control de Cambios')
        copy_header(src_ws, dst_ws)

    src_wb.close()
    dst_wb.save(output_path)
    print(f"OK: {output_path}")


if __name__ == '__main__':
    main()