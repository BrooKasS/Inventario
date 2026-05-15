import openpyxl
from collections import defaultdict

# Cargar el Excel
wb = openpyxl.load_workbook(r'C:\Users\p_scorrea\OneDrive - Fiduprevisora S.A\Escritorio\Archivos\Export_VPN_S2S_Fidu.xlsx')
ws = wb.active

# Leer datos
datos = []
for row in ws.iter_rows(min_row=2, values_only=True):
    if row[0]:  # Si hay valor en nombre
        datos.append({
            'nombre': str(row[0]).strip(),
            'ip': str(row[1]).strip() if row[1] else 'N/A',
            'fase': str(row[2]).strip() if row[2] else 'N/A',
        })

print(f"TOTAL DE FILAS: {len(datos)}\n")

# Agrupar por IP
por_ip = defaultdict(list)
for d in datos:
    por_ip[d['ip']].append(d['nombre'])

# Mostrar agrupaciones
print("AGRUPACIONES POR IP:")
for ip in sorted(por_ip.keys()):
    nombres = por_ip[ip]
    print(f"\nIP: {ip} → {len(nombres)} registros")
    for nombre in nombres[:5]:  # Mostrar primeros 5
        print(f"   - {nombre}")
    if len(nombres) > 5:
        print(f"   ... y {len(nombres)-5} más")

print(f"\n\nTOTAL DE IPs ÚNICAS: {len(por_ip)}")
print(f"TOTAL DE REGISTROS: {len(datos)}")
