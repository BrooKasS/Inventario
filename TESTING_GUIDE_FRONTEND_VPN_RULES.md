# 🧪 GUÍA DE TESTING: Frontend VPN Rules

**Objetivo:** Validar que la implementación funciona sin errores y no rompe nada existente

---

## 🚀 PASO 1: Compilación (Sin Errores TypeScript)

```bash
# En terminal, carpeta frontend
cd frontend
npm run build

# Esperado:
✅ Compilación exitosa
✅ Sin errores TypeScript
✅ Sin warnings de tipo
✅ Assets generados en dist/
```

**Si hay error:**
```
ERROR: "VpnRule is not exported from types"
SOLUCIÓN: Verificar que frontend/src/types/index.tsx tenga:
  export interface VpnRule { ... }
```

---

## 🧩 PASO 2: Ejecución en Desarrollo

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Esperado:
✅ npx ts-node-dev src/app.ts
✅ Express server running on port 3001
✅ Database connected

# Terminal 2: Frontend
cd frontend
npm run dev

# Esperado:
✅ Vite dev server running
✅ Local: http://localhost:5173
✅ Hot reload activo
```

---

## 📋 PASO 3: Testing Manual en Navegador

### Test 3.1: Abrir Modal - SERVIDOR

**Acción:**
1. Ir a Dashboard
2. Botón "+ Nuevo"
3. Seleccionar "SERVIDOR"
4. Abre modal "Nuevo Servidor"

**Esperado:**
- ✅ Modal abre sin errores
- ✅ NO aparece sección "Reglas VPN" (tipo !== VPN)
- ✅ Solo aparecen campos de servidor
- ✅ Botón "Crear Activo" en footer

**Conclusión:** ✅ Otros tipos no afectados

---

### Test 3.2: Crear VPN Simple (Sin Reglas)

**Acción:**
1. "+ Nuevo" → Seleccionar "VPN S2S"
2. Llenar:
   - Nombre: "VPN Test 1"
   - Ubicación: "Data Center"
   - Propietario: "Gerencia TI"
   - Custodio: "Juan Pérez"
   - Conexión: "IPSec"
   - Fases: "Phase 2"
   - Origen: "172.16.0.50/32"
   - Destino: "172.18.140.0/24"
3. **NO agregar ninguna regla**
4. Clic "Crear Activo"

**Esperado:**
- ✅ Modal renderiza sección "Reglas VPN" (tipo === VPN)
- ✅ Sección "Datos Principales" con 4 campos
- ✅ Sección "Reglas VPN" vacía (counter 0)
- ✅ Formulario "Nueva Regla" disponible
- ✅ Sin errores en console
- ✅ Asset creado en backend
- ✅ EN BD: 1 row ASSETS, 1 row VPNS, 0 rows VPN_RULES

**SQL Verification:**
```sql
SELECT * FROM VPNS WHERE NOMBRE = 'VPN Test 1';
-- Resultado: 1 row

SELECT * FROM VPN_RULES WHERE VPN_ID = '...';
-- Resultado: 0 rows (vacío)
```

**Conclusión:** ✅ VPN sin reglas sigue funcionando igual (backward compatible)

---

### Test 3.3: Crear VPN con 1 Regla

**Acción:**
1. "+ Nuevo" → "VPN S2S"
2. Llenar datos principales:
   - Nombre: "VPN Test 2"
   - Conexión: "IPSec"
   - Fases: "Phase 2"
   - Origen: "192.168.1.0/24"
   - Destino: "10.0.0.0/8"
3. **Agregar 1 Regla:**
   - Conexión: "BGP"
   - Fases: "Routing"
   - Origen: "AS 65001"
   - Destino: "AS 65002"
4. Clic "+ Agregar Regla"

**Esperado:**
- ✅ Formulario "Nueva Regla" limpiado inmediatamente
- ✅ Regla aparece en sección "Reglas Agregadas (1)"
- ✅ Muestra los valores: "Conexión: BGP", etc.
- ✅ Botón "Eliminar" disponible

5. Clic "Crear Activo"

**Esperado:**
- ✅ Asset creado
- ✅ EN BD: 1 row VPNS, 1 row VPN_RULES

**SQL Verification:**
```sql
SELECT * FROM VPNS WHERE NOMBRE = 'VPN Test 2';
-- Resultado: 1 row, ID = 'vpn-uuid-2'

SELECT * FROM VPN_RULES WHERE VPN_ID = 'vpn-uuid-2';
-- Resultado: 1 row
--   ID: rule-uuid
--   CONEXION: BGP
--   FASES: Routing
--   ORIGEN: AS 65001
--   DESTINO: AS 65002
```

**Conclusión:** ✅ VPN con regla funciona correctamente

---

### Test 3.4: Crear VPN con Múltiples Reglas (3)

**Acción:**
1. "+ Nuevo" → "VPN S2S"
2. Llenar datos principales
3. **Agregar 3 Reglas:**
   ```
   Regla 1:
   - Conexión: BGP
   - Fases: Routing
   - Origen: AS 65001
   - Destino: AS 65002
   
   Regla 2:
   - Conexión: EIGRP
   - Fases: Dynamic
   - Origen: 10.1.1.0/24
   - Destino: 10.2.2.0/24
   
   Regla 3:
   - Conexión: Static
   - Fases: Manual
   - Origen: 192.168.0.0/16
   - Destino: 172.16.0.0/16
   ```

**Esperado:**
- ✅ Cada regla agregada inmediatamente
- ✅ Counter muestra "Reglas Agregadas (3)"
- ✅ Las 3 reglas visibles en lista
- ✅ Formulario limpio después de cada add

4. Clic "Crear Activo"

**Esperado:**
- ✅ EN BD: 1 row VPNS, 3 rows VPN_RULES

```sql
SELECT COUNT(*) FROM VPN_RULES WHERE VPN_ID = 'vpn-uuid-3';
-- Resultado: 3
```

**Conclusión:** ✅ Múltiples reglas funcionan correctamente

---

### Test 3.5: Remover Regla Antes de Crear

**Acción:**
1. "+ Nuevo" → "VPN S2S"
2. Agregar 3 reglas (como test anterior)
3. Clic "Eliminar" en regla 2 (EIGRP)

**Esperado:**
- ✅ Regla 2 desaparece de la lista
- ✅ Counter actualiza a "Reglas Agregadas (2)"
- ✅ Quedan reglas 1 y 3 solamente

4. Clic "Crear Activo"

**Esperado:**
- ✅ EN BD: 1 row VPNS, 2 rows VPN_RULES (reglas 1 y 3)

```sql
SELECT CONEXION FROM VPN_RULES WHERE VPN_ID = 'vpn-uuid-4' ORDER BY ID;
-- Resultado:
--   BGP
--   Static
-- (NO EIGRP)
```

**Conclusión:** ✅ Remover regla funciona correctamente

---

### Test 3.6: Cerrar Modal Sin Guardar

**Acción:**
1. "+ Nuevo" → "VPN S2S"
2. Agregar 2 reglas
3. Clic botón X o "Cancelar"

**Esperado:**
- ✅ Modal cierra
- ✅ Estado se limpia (vpnRules = [])
- ✅ Siguiente apertura modal: sin reglas previas

4. "+ Nuevo" → "VPN S2S" (segunda vez)

**Esperado:**
- ✅ Modal abre sin reglas (empty state)
- ✅ Sección "Reglas Agregadas" NO aparece
- ✅ Formulario "Nueva Regla" vacío

**Conclusión:** ✅ Limpieza de estado funciona correctamente

---

### Test 3.7: Obtener VPN Creado (GET /api/assets/{id})

**Acción (en Network tab o Postman):**
```bash
GET /api/assets/{vpn-test-3-id}
```

**Esperado en Response:**
```json
{
  "id": "asset-uuid",
  "tipo": "VPN",
  "nombre": "VPN Test 3",
  "vpn": {
    "id": "vpn-uuid",
    "assetId": "asset-uuid",
    "conexion": "IPSec",
    "fases": "Phase 2",
    "origen": "192.168.1.0/24",
    "destino": "10.0.0.0/8",
    "reglas": [
      {
        "id": "rule-uuid-1",
        "vpnId": "vpn-uuid",
        "conexion": "BGP",
        "fases": "Routing",
        "origen": "AS 65001",
        "destino": "AS 65002"
      },
      {
        "id": "rule-uuid-2",
        "vpnId": "vpn-uuid",
        "conexion": "EIGRP",
        "fases": "Dynamic",
        "origen": "10.1.1.0/24",
        "destino": "10.2.2.0/24"
      },
      {
        "id": "rule-uuid-3",
        "vpnId": "vpn-uuid",
        "conexion": "Static",
        "fases": "Manual",
        "origen": "192.168.0.0/16",
        "destino": "172.16.0.0/16"
      }
    ]
  }
}
```

**Verificación:**
- ✅ vpn.reglas es array (no objeto)
- ✅ Cada regla tiene id, vpnId, conexion, fases, origen, destino
- ✅ NO hay vpnPrincipalId (eliminado correctamente)
- ✅ 3 reglas retornadas

**Conclusión:** ✅ Backend carga reglas correctamente

---

### Test 3.8: Validación - Regla Vacía

**Acción:**
1. "+ Nuevo" → "VPN S2S"
2. Llenar datos principales
3. En "Nueva Regla", dejar TODO vacío
4. Clic "+ Agregar Regla"

**Esperado:**
- ✅ Regla NO se agrega (validación handleAddRule)
- ✅ Sección "Reglas Agregadas" sigue vacía
- ✅ Sin error visual (esperado)

**Conclusión:** ✅ Validación de regla vacía funciona

---

### Test 3.9: Validación - Campos Requeridos

**Acción:**
1. "+ Nuevo" → Cualquier tipo
2. Dejar "Nombre" vacío
3. Clic "Crear Activo"

**Esperado:**
- ✅ Mensaje error: "El nombre es obligatorio."
- ✅ Modal NO cierra
- ✅ Estado preservado

**Conclusión:** ✅ Validación base intacta

---

## 🎯 PASO 4: Testing en Network Tab (Inspector)

### Verificar Payload POST

**Acción:**
1. Abrir DevTools → Network tab
2. "+ Nuevo" → "VPN S2S"
3. Llenar y agregar 2 reglas
4. Clic "Crear Activo"

**Esperado en Request Payload:**
```json
{
  "tipo": "VPN",
  "nombre": "Test VPN",
  "ubicacion": "Data Center",
  "propietario": "Gerencia TI",
  "custodio": "Juan",
  "codigoServicio": null,
  "vpn": {
    "conexion": "IPSec",
    "fases": "Phase 2",
    "origen": "192.168.1.0/24",
    "destino": "10.0.0.0/8",
    "reglas": [
      {
        "conexion": "BGP",
        "fases": "Routing",
        "origen": "AS 65001",
        "destino": "AS 65002"
      },
      {
        "conexion": "EIGRP",
        "fases": "Dynamic",
        "origen": "10.1.1.0/24",
        "destino": "10.2.2.0/24"
      }
    ]
  }
}
```

**Verificación:**
- ✅ vpn.reglas es array con 2 elementos
- ✅ Cada elemento tiene 4 campos
- ✅ Estructura matches backend expectations

**Conclusión:** ✅ Payload enviado correctamente

---

## ✅ CHECKLIST FINAL

```
TESTS COMPLETADOS
├─ ✅ Test 3.1: Servidor (no afectado)
├─ ✅ Test 3.2: VPN sin reglas (backward compatible)
├─ ✅ Test 3.3: VPN con 1 regla (nueva feature)
├─ ✅ Test 3.4: VPN con 3 reglas (escalabilidad)
├─ ✅ Test 3.5: Remover regla (CRUD)
├─ ✅ Test 3.6: Cerrar modal (limpieza)
├─ ✅ Test 3.7: GET API (data integrity)
├─ ✅ Test 3.8: Validación regla vacía (constraints)
├─ ✅ Test 3.9: Validación nombre requerido (base)
└─ ✅ Test 4: Network tab (payload verification)

CONCLUSIÓN GENERAL: 🟢 TODO FUNCIONA CORRECTAMENTE
```

---

## 🆘 TROUBLESHOOTING

| Problema | Causa | Solución |
|----------|-------|----------|
| Modal no muestra reglas | tipo !== "VPN" | Seleccionar "VPN S2S" |
| Error "VpnRule is not exported" | Import falta | Agregar a frontend/src/types |
| Regla no se agrega | Todos campos vacíos | Llenar al menos 1 campo |
| Payload sin reglas | array vacío | Esperado si no agregó |
| BD: 0 VPN_RULES | VPN sin reglas | Esperado, crear VPN con reglas |
| Regla desaparece al refresh | State React normal | Guardar primero antes de refresh |

---

## 📊 RESULTADOS ESPERADOS POR TIPO

| Tipo | Reglas UI | Reglas BD | Payload |
|------|-----------|----------|---------|
| SERVIDOR | ❌ No | ❌ No | Sin vpn |
| RED | ❌ No | ❌ No | Sin vpn |
| UPS | ❌ No | ❌ No | Sin vpn |
| BASE_DATOS | ❌ No | ❌ No | Sin vpn |
| VPN (sin reglas) | ✅ Sí (vacío) | ✅ 0 rows | reglas: [] |
| VPN (con reglas) | ✅ Sí (visible) | ✅ N rows | reglas: [...] |
| MOVIL | ❌ No | ❌ No | Sin vpn |

---

**Tiempo Estimado de Testing:** 30-45 minutos  
**Documentación:** Este archivo  
**Status:** 🟢 LISTO PARA VALIDAR
