import openpyxl
from collections import defaultdict
import os
import re

# Verificar que el archivo existe
ruta_archivo = r'C:\Users\p_scorrea\OneDrive - Fiduprevisora S.A\Escritorio\Archivos\Export_VPN_S2S_Fidu.xlsx'

# Cargar el Excel
wb = openpyxl.load_workbook(ruta_archivo)
ws = wb.active

# Leer datos - COMENZAR EN FILA 3 (fila 2 son encabezados)
datos = []
for row_idx, row in enumerate(ws.iter_rows(min_row=3, values_only=True), start=3):
    if row and len(row) > 2:
        nombre = str(row[1]).strip() if row[1] else None
        ip = str(row[2]).strip() if row[2] else 'N/A'
        fase = str(row[3]).strip() if len(row) > 3 and row[3] else 'N/A'
        
        if nombre:
            datos.append({
                'nombre': nombre,
                'ip': ip,
                'fase': fase,
                'orden': row_idx  # Orden de aparición en Excel
            })

# Agrupar por IP
por_ip = defaultdict(list)
for d in datos:
    por_ip[d['ip']].append(d)

print("="*100)
print("ANÁLISIS ULTRA MÁXIMO - IDENTIFICACIÓN DE VPNs PRINCIPALES")
print("="*100 + "\n")

# Función para detectar si un nombre termina en número
def termina_en_numero(nombre):
    return bool(re.search(r'\d+$', nombre))

# Función para proponer el principal
def encontrar_principal(vpns):
    """
    Estrategia para identificar el principal:
    1. Si hay UN SOLO que NO termina en número → ESE es el principal
    2. Si hay VARIOS que no terminan en número → El primero en orden
    3. Si TODOS terminan en número → El primero en orden (sin sufijo numérico)
    4. Si está vacío → El primero
    """
    
    # Estrategia 1: Buscar que NO termina en número
    sin_numero = [v for v in vpns if not termina_en_numero(v['nombre'])]
    if len(sin_numero) == 1:
        return sin_numero[0], "ÚNICO sin número"
    elif len(sin_numero) > 1:
        # Si hay varios, tomar el primero en orden de Excel
        return min(sin_numero, key=lambda x: x['orden']), f"PRIMERO de {len(sin_numero)} sin número"
    
    # Estrategia 2: Si todos terminan en número, buscar el más corto o primero
    if len(vpns) > 0:
        # El primero en orden
        return min(vpns, key=lambda x: x['orden']), f"PRIMERO en orden (todos con número)"
    
    return None, "NO ENCONTRADO"

# Analizar por IP
principales_identificados = []
estadisticas = {
    'ips_con_multiples': 0,
    'ips_con_una': 0,
    'sin_ip': 0
}

print(f"{'IP':<20} {'CANT':<5} {'PRINCIPAL IDENTIFICADO':<30} {'CRITERIO':<30} {'RESTO':<30}\n")
print("-" * 120)

for ip in sorted(por_ip.keys()):
    vpns = por_ip[ip]
    
    # Estadísticas
    if ip == 'N/A':
        estadisticas['sin_ip'] += len(vpns)
    elif len(vpns) > 1:
        estadisticas['ips_con_multiples'] += 1
    else:
        estadisticas['ips_con_una'] += 1
    
    # Encontrar principal
    principal, criterio = encontrar_principal(vpns)
    principales_identificados.append(principal)
    
    # Información del resto
    resto_nombres = [v['nombre'] for v in vpns if v['nombre'] != principal['nombre']]
    resto_str = ', '.join(resto_nombres[:3])
    if len(resto_nombres) > 3:
        resto_str += f", +{len(resto_nombres)-3}"
    
    ip_display = ip if ip != 'N/A' else '(sin IP)'
    print(f"{ip_display:<20} {len(vpns):<5} {principal['nombre']:<30} {criterio:<30} {resto_str:<30}")

print("\n" + "="*100)
print("RESUMEN ESTADÍSTICO")
print("="*100)
print(f"\n✅ TOTAL DE REGISTROS ANALIZADOS: {len(datos)}")
print(f"✅ TOTAL DE IPs ÚNICAS (CON IP): {len([ip for ip in por_ip.keys() if ip != 'N/A'])}")
print(f"✅ TOTAL DE VPNs SIN IP (C2S): {estadisticas['sin_ip']}")
print(f"\n📊 IPs CON MÚLTIPLES VPNs (S2S): {estadisticas['ips_con_multiples']}")
print(f"📊 IPs CON UNA SOLA VPN (S2S): {estadisticas['ips_con_una']}")
print(f"\n🎯 TOTAL DE PRINCIPALES IDENTIFICADOS: {len(principales_identificados)}")
print(f"   - S2S (con IP): ~{estadisticas['ips_con_multiples'] + estadisticas['ips_con_una']}")
print(f"   - C2S (sin IP): {len([v for v in principales_identificados if v['ip'] == 'N/A']) if principales_identificados else 0}")

print("\n" + "="*100)
print("CRITERIO DE IDENTIFICACIÓN PROPUESTO")
print("="*100)
print("""
✅ ESTRATEGIA IDENTIFICADA:

Para PRINCIPALES (mostrar en dashboard):
1. POR CADA IP ÚNICA → mostrar UN SOLO VPN
2. CRITERIO: El que NO termina en número (ej: VPN_ALFAGL, no VPN_ALFAGL_2)
3. Si TODOS terminan en número → mostrar el PRIMERO en orden de Excel

Para S2S (con IP):
- ~49 IPs = ~49 PRINCIPALES a mostrar

Para C2S (sin IP):
- ~21 sin IP = ¿mostrar todas o solo una por grupo?

IMPLEMENTACIÓN EN BD:
- Filtrar getAssets(): 
  a) Agrupar por IP
  b) Tomar solo el PRIMERO por cada IP (o usar nombre sin número)
""")

print("\n" + "="*100)
print("PRIMERAS 5 VPNs PRINCIPALES DETECTADAS")
print("="*100 + "\n")
for i, p in enumerate(principales_identificados[:5], 1):
    print(f"{i}. {p['nombre']:<30} IP: {p['ip']:<20} Fase: {p['fase']}")

