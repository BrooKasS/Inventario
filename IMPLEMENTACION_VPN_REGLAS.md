# 🚀 INSTRUCCIONES: Implementar VPN Reglas + Principales

## ✅ RESUMEN DE CAMBIOS

Se ha implementado un sistema para vincular VPNs principales con sus reglas asociadas. Los cambios incluyen:

| Archivo | Cambio |
|---------|--------|
| **Vpn.ts** | ✅ +3 campos nuevos (vpnPrincipalId, reglas, vpnPrincipal) |
| **importExcel.ts** | ✅ Función `vincularVpnRegla()` automática |
| **assets.service.ts** | ✅ Relaciones actualizadas para cargar reglas |
| **Migration SQL** | ✅ Archivo creado en migrations/ |
| **Script Node** | ✅ Script para procesar VPNs existentes |

---

## 🔧 PASOS A EJECUTAR (EN ORDEN)

### **PASO 1: Ejecutar Migration en BD ORACLE** ⚠️ CRÍTICO

```sql
-- En SQL*Plus o cliente Oracle:
@backend/migrations/001_add_vpn_principal_support.sql

-- O manualmente (copiar y ejecutar):
ALTER TABLE VPNS ADD (VPN_PRINCIPAL_ID VARCHAR2(36) NULL);

ALTER TABLE VPNS ADD CONSTRAINT FK_VPN_PRINCIPAL_ID
  FOREIGN KEY (VPN_PRINCIPAL_ID)
  REFERENCES VPNS(ID)
  ON DELETE SET NULL;

CREATE INDEX IDX_VPN_PRINCIPAL_ID ON VPNS(VPN_PRINCIPAL_ID);
```

✅ Verifica que la migración completó exitosamente

---

### **PASO 2: Procesar VPNs Existentes**

```bash
# Desde la raíz del proyecto
cd backend

# Ejecutar el script que identifica y vincula principales
npm run ts-node -- src/scripts/vincularVpnReglas.ts
```

📊 **Ejemplo de salida esperada:**
```
✓ Conexión a BD establecida

📊 Total de VPNs en BD: 225

📍 IPs únicas: 49

  ✓ IP 190.60.246.130: PRINCIPAL = "DIGITALWARE_AR"
     ✓ "DIGITALWARE_AR2" → vinculada
     ✓ "DIGITALWARE_AR3" → vinculada
     ...

═══════════════════════════════════════════════════════════════
✅ PROCESO COMPLETADO
   • VPNs actualizadas: ~176
   • VPNs saltadas: 0
   • VPNs sin cambios: ~49
═══════════════════════════════════════════════════════════════
```

---

### **PASO 3: Compilar y Validar Cambios**

```bash
# Compilar TypeScript
npm run build

# Si hay errores de compilación, esperar que el IDE los corrija
```

---

### **PASO 4: Reiniciar Backend**

```bash
# Matar proceso anterior
npm run dev

# O si usas un proceso manager:
pm2 restart backend
```

---

## 📊 VERIFICACIÓN POST-IMPLEMENTACIÓN

### **Query 1: Verificar que VPN_PRINCIPAL_ID fue agregada**
```sql
SELECT column_name, data_type
FROM user_tab_columns
WHERE table_name = 'VPNS'
ORDER BY column_id;
```

Debe aparecer: `VPN_PRINCIPAL_ID | VARCHAR2(36)`

---

### **Query 2: Contar VPNs principales vs reglas**
```sql
-- VPNs principales (sin VPN padre)
SELECT COUNT(*) AS principales
FROM VPNS
WHERE VPN_PRINCIPAL_ID IS NULL;

-- VPNs reglas (con VPN padre)
SELECT COUNT(*) AS reglas
FROM VPNS
WHERE VPN_PRINCIPAL_ID IS NOT NULL;
```

Resultado esperado:
- Principales: ~49
- Reglas: ~176
- Total: ~225 ✓

---

### **Query 3: Ver ejemplo de vinculación**
```sql
SELECT 
  a1.nombre AS vpn_principal,
  a2.nombre AS vpn_regla,
  v2.conexion
FROM VPNS v1
JOIN VPNS v2 ON v1.id = v2.VPN_PRINCIPAL_ID
JOIN ASSET a1 ON v1.asset_id = a1.id
JOIN ASSET a2 ON v2.asset_id = a2.id
WHERE a1.nombre = 'DIGITALWARE_AR'
ORDER BY a2.nombre;
```

Resultado esperado:
```
VPN_PRINCIPAL        | VPN_REGLA         | CONEXION
---------------------+-------------------+------------------
DIGITALWARE_AR       | DIGITALWARE_AR2   | 190.60.246.130
DIGITALWARE_AR       | DIGITALWARE_AR3   | 190.60.246.130
DIGITALWARE_AR       | DIGITALWARE_AR4   | 190.60.246.130
...
```

---

### **Query 4: Probar en Frontend**
```
GET /api/assets?tipo=VPN&limit=1

Resultado debe incluir:
{
  "id": "xxx",
  "tipo": "VPN",
  "nombre": "DIGITALWARE_AR",
  "vpn": {
    "id": "xxx",
    "conexion": "190.60.246.130",
    "reglas": [
      {
        "id": "xxx",
        "nombre": "DIGITALWARE_AR2",
        "conexion": "190.60.246.130"
      },
      {
        "id": "xxx",
        "nombre": "DIGITALWARE_AR3",
        "conexion": "190.60.246.130"
      }
    ]
  }
}
```

---

## ⚠️ ROLLBACK (Si algo falla)

### En BD ORACLE:
```sql
-- Eliminar constraint y columna
ALTER TABLE VPNS DROP CONSTRAINT FK_VPN_PRINCIPAL_ID;
ALTER TABLE VPNS DROP COLUMN VPN_PRINCIPAL_ID;
DROP INDEX IDX_VPN_PRINCIPAL_ID;
```

### En código:
```bash
git checkout backend/src/entities/Vpn.ts
git checkout backend/src/importer/importExcel.ts
git checkout backend/src/api/services/assets.service.ts
```

---

## 🎯 DATOS FINALES ESPERADOS

✅ **SIN CAMBIOS EN DATOS EXISTENTES**
- 225 VPNs siguen en la BD
- Ningún registro se perdió
- Solo se agregó vinculación de relaciones

✅ **ESTRUCTURALMENTE**
- ~49 VPNs principales (vpnPrincipalId = NULL)
- ~176 VPNs reglas (vpnPrincipalId = ID de principal)
- Búsquedas por IP = cargan todas las reglas

---

## ✅ CHECKLIST FINAL

- [ ] Migration SQL ejecutada exitosamente
- [ ] Script vincularVpnReglas.ts ejecutado sin errores
- [ ] Backend compiló sin problemas
- [ ] Backend reiniciado correctamente
- [ ] Query de verificación devuelve ~49 principales + ~176 reglas
- [ ] Frontend carga VPN con su array de reglas
- [ ] No hay errores en logs de BD
- [ ] Datos visuales en app verificados

---

## 📝 NOTAS IMPORTANTES

1. **Lazy Loading**: Las reglas se cargan automáticamente gracias a `lazy: true` en Entity
2. **Cascading**: Si se elimina VPN principal, las reglas quedan con vpnPrincipalId = NULL
3. **Futuros Imports**: El sistema automático en importExcel.ts se encargará de vincular nuevas VPNs

---

**¿Preguntas?** Revisa los logs del terminal y verifica las queries de verificación.
