# 🔄 MIGRACIÓN: VPN Rules (Estructura OPTION 2)

**Fecha:** 2025  
**Status:** ✅ COMPLETADO  
**Impacto:** Cambio fundamental de arquitectura de reglas VPN

---

## 📋 RESUMEN EJECUTIVO

Se realizó un cambio arquitectónico fundamental para:
- **Convertir** relación VPN auto-referencial (Vpn→Vpn) a relación clara (Vpn→VpnRule)
- **Crear** tabla `VPN_RULES` como entidad separada en la base de datos
- **Eliminar** duplicidad de lógica entre VPN principal y VPN regla
- **Permitir** creación de reglas independientes durante creación de VPN principal

### Consecuencias
✅ Cada VPN ahora es un "principal" válido  
✅ Las reglas son entidades separadas sin duplicación  
✅ Eliminación en cascada automática cuando VPN principal es eliminada  
✅ API más clara y predecible  

---

## 🔧 CAMBIOS TÉCNICOS REALIZADOS

### 1. **Entidades Backend**

#### Backend/src/entities/VpnRule.ts (NUEVA)
```typescript
@Entity("VPN_RULES")
export class VpnRule {
  @PrimaryColumn({ type: "varchar2", length: 36 })
  id!: string;

  @ManyToOne(() => Vpn, (vpn) => vpn.reglas, { 
    onDelete: "CASCADE",
    eager: false 
  })
  @JoinColumn({ name: "VPN_ID" })
  vpn!: Vpn;

  @Column({ type: "varchar2", length: 36, nullable: false })
  vpnId!: string; // Foreign Key

  @Column({ type: "varchar2", length: 500, nullable: true })
  conexion!: string | null;

  @Column({ type: "varchar2", length: 500, nullable: true })
  fases!: string | null;

  @Column({ type: "varchar2", length: 1000, nullable: true })
  origen!: string | null;

  @Column({ type: "varchar2", length: 1000, nullable: true })
  destino!: string | null;
}
```

#### Backend/src/entities/Vpn.ts (MODIFICADA)
**ELIMINADAS:**
- `vpnPrincipalId` column (FK a sí misma)
- `@ManyToOne(() => Vpn, (v) => v.reglas)` (relación padre)

**AGREGADA:**
```typescript
@OneToMany(() => VpnRule, (rule) => rule.vpn, { 
  cascade: true, 
  eager: false,
  onDelete: "CASCADE"
})
reglas!: VpnRule[];
```

### 2. **Configuración ORM**

#### data-source.ts
```typescript
import { VpnRule } from "./entities/VpnRule";

export const AppDataSource = new DataSource({
  // ...
  entities: [
    Asset, Servidor, Red, Ups, BaseDatos, Vpn, VpnRule, Movil, Bitacora
  ],
  // ...
});
```

#### config/database.ts
Actualizada con importación y registro de VpnRule

### 3. **Lógica de Servicio (assets.service.ts)**

#### createAsset() - Manejo de Reglas
```typescript
if (vpn) {
  const vpnToSave = { ...vpn, asset: savedAsset };
  if (!vpnToSave.id) vpnToSave.id = uuidv4();
  
  // ✅ Separar reglas del objeto VPN
  const reglas = vpnToSave.reglas || [];
  delete vpnToSave.reglas;
  
  // ✅ Guardar VPN principal primero
  const savedVpn = await vpnRepository.save(vpnToSave);
  
  // ✅ Crear VpnRule como entidades separadas
  if (reglas && Array.isArray(reglas) && reglas.length > 0) {
    const vpnRulesToSave = reglas.map((regla: any) => {
      return vpnRuleRepository.create({
        id: uuidv4(),
        vpn: savedVpn,
        conexion: regla.conexion ?? null,
        fases: regla.fases ?? null,
        origen: regla.origen ?? null,
        destino: regla.destino ?? null,
      });
    });
    
    await vpnRuleRepository.save(vpnRulesToSave);
  }
}
```

#### updateAsset() - Actualización de Reglas
```typescript
// Eliminar reglas antiguas
if (oldReglas.length > 0) {
  await vpnRuleRepository.delete({ vpn: { id: vpn.id } });
}

// Crear nuevas reglas
if (Array.isArray(newReglas) && newReglas.length > 0) {
  const vpnRulesToSave = newReglas.map((regla: any) => {
    return vpnRuleRepository.create({
      id: uuidv4(),
      vpn: vpn,
      conexion: regla.conexion ?? null,
      fases: regla.fases ?? null,
      origen: regla.origen ?? null,
      destino: regla.destino ?? null,
    });
  });

  await vpnRuleRepository.save(vpnRulesToSave);
}
```

#### getStats() - Simplificado
**ANTES:**
```typescript
// Filtrar VPN principal (vpnPrincipalId IS NULL)
.andWhere("vpn.vpnPrincipalId IS NULL")
```

**DESPUÉS:**
```typescript
// Ya no necesario - todas las VPN son principales
// Simple conteo por tipo
.select("asset.tipo", "tipo")
.addSelect("COUNT(DISTINCT asset.id)", "count")
```

### 4. **Frontend Types**

#### frontend/src/types/index.tsx
**NUEVA interface VpnRule:**
```typescript
export interface VpnRule {
  id: string;
  vpnId: string;
  conexion: string | null;
  fases: string | null;
  origen: string | null;
  destino: string | null;
}
```

**ACTUALIZADA interface Vpn:**
```typescript
export interface Vpn {
  id: string;
  assetId: string;
  conexion: string | null;
  fases: string | null;
  origen: string | null;
  destino: string | null;
  reglas?: VpnRule[];  // ✅ Cambio: VpnRule[] en lugar de Vpn[]
  // ❌ ELIMINADO: vpnPrincipalId
}
```

---

## 🔄 FLUJO DE DATOS ACTUALIZADO

### Creación de VPN con Reglas

```
CLIENT SIDE (AssetCreateModal)
  │
  └─→ Envía: { vpn: { conexion, fases, origen, destino, reglas: [...] } }
      
SERVER SIDE (createAsset)
  │
  ├─→ 1. Crear asset base
  │
  ├─→ 2. Crear VPN principal (sin reglas)
  │      INSERT INTO VPNS (ID, CONEXION, FASES, ORIGEN, DESTINO, ASSET_ID)
  │
  └─→ 3. Crear cada regla como VpnRule
         FOR EACH regla:
           INSERT INTO VPN_RULES 
           (ID, VPN_ID, CONEXION, FASES, ORIGEN, DESTINO)
```

### Lectura de VPN con Reglas

```
CLIENT:  GET /api/assets/{id}

SERVER:  
  SELECT * FROM ASSETS WHERE ID = ?
  SELECT * FROM VPNS WHERE ASSET_ID = ?
  SELECT * FROM VPN_RULES WHERE VPN_ID = ?  ← LEFT JOIN automático
  
RESPONSE: {
  asset: { id, tipo: "VPN", ... },
  vpn: { 
    id, conexion, fases, origen, destino,
    reglas: [  ← ✅ Array de VpnRule (no Vpn)
      { id, vpnId, conexion, fases, origen, destino },
      { id, vpnId, conexion, fases, origen, destino }
    ]
  }
}
```

### Actualización de VPN con Reglas

```
CLIENT:  PUT /api/assets/{id}
  
SERVER:
  1. Cargar VPN actual con todas sus reglas
  2. Eliminar todas las VPN_RULES asociadas
  3. Crear nuevas VPN_RULES con la data nueva
  4. Bitácora registra: "10 reglas → 12 reglas"
```

---

## 📊 CAMBIOS EN BASE DE DATOS

### Antes
```sql
CREATE TABLE VPNS (
  ID VARCHAR2(36) PRIMARY KEY,
  CONEXION VARCHAR2(500),
  FASES VARCHAR2(500),
  ORIGEN VARCHAR2(1000),
  DESTINO VARCHAR2(1000),
  ASSET_ID VARCHAR2(36) UNIQUE,
  VPN_PRINCIPAL_ID VARCHAR2(36),  ❌ AUTO-REFERENCIA
  FOREIGN KEY (VPN_PRINCIPAL_ID) REFERENCES VPNS(ID) ON DELETE SET NULL
);
```

### Después
```sql
CREATE TABLE VPNS (
  ID VARCHAR2(36) PRIMARY KEY,
  CONEXION VARCHAR2(500),
  FASES VARCHAR2(500),
  ORIGEN VARCHAR2(1000),
  DESTINO VARCHAR2(1000),
  ASSET_ID VARCHAR2(36) UNIQUE
  -- ❌ VPN_PRINCIPAL_ID eliminada
);

-- ✅ NUEVA TABLA
CREATE TABLE VPN_RULES (
  ID VARCHAR2(36) PRIMARY KEY,
  VPN_ID VARCHAR2(36) NOT NULL,
  CONEXION VARCHAR2(500),
  FASES VARCHAR2(500),
  ORIGEN VARCHAR2(1000),
  DESTINO VARCHAR2(1000),
  FOREIGN KEY (VPN_ID) REFERENCES VPNS(ID) ON DELETE CASCADE
);
```

---

## 🚀 CÓMO USAR (API)

### Crear VPN con Reglas (en una sola operación)
```bash
POST /api/assets
Content-Type: application/json

{
  "tipo": "VPN",
  "nombre": "S2S VPN Bogotá",
  "ubicacion": "Data Center",
  "codigoServicio": "VPN-001",
  "vpn": {
    "conexion": "IPSec",
    "fases": "IKEv2 P1 y P2",
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

### Actualizar VPN + Reglas
```bash
PUT /api/assets/{id}
Content-Type: application/json

{
  "vpn": {
    "conexion": "IPSec Site-to-Site",
    "reglas": [
      { "conexion": "BGP", "fases": "Routing", ... },
      { "conexion": "Static Route", "fases": "Manual", ... }
    ]
  }
}
```

### Obtener VPN con Reglas
```bash
GET /api/assets/{id}

# Response:
{
  "id": "asset-uuid",
  "tipo": "VPN",
  "nombre": "S2S VPN Bogotá",
  "vpn": {
    "id": "vpn-uuid",
    "assetId": "asset-uuid",
    "conexion": "IPSec",
    "fases": "IKEv2 P1 y P2",
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
      }
    ]
  }
}
```

---

## ⚠️ IMPACTO EN DATOS EXISTENTES

### VPN Existentes sin Reglas
✅ **Sin cambios** - Simplemente se quedan con `reglas: []` vacío

### VPN Existentes con Jerarquía (Principal + Reglas)
⚠️ **Requiere migración manual** (si existen)

**Si existen datos con vpnPrincipalId:**
1. Identificar VPN principales (`vpnPrincipalId IS NULL`)
2. Copiar datos de VPN reglas a tabla VPN_RULES
3. Actualizar FK vpnId en VPN_RULES
4. Eliminar antiguas VPN reglas

**SQL Example:**
```sql
-- 1. Crear VPN_RULES a partir de VPN reglas antiguas
INSERT INTO VPN_RULES (ID, VPN_ID, CONEXION, FASES, ORIGEN, DESTINO)
SELECT 
  V_RULE.ID,
  V_PRINCIPAL.ID as VPN_ID,
  V_RULE.CONEXION,
  V_RULE.FASES,
  V_RULE.ORIGEN,
  V_RULE.DESTINO
FROM VPNS V_RULE
JOIN VPNS V_PRINCIPAL ON V_RULE.VPN_PRINCIPAL_ID = V_PRINCIPAL.ID
WHERE V_RULE.VPN_PRINCIPAL_ID IS NOT NULL;

-- 2. Eliminar VPN reglas antiguas
DELETE FROM VPNS 
WHERE VPN_PRINCIPAL_ID IS NOT NULL;

-- 3. Remover columna VPN_PRINCIPAL_ID
ALTER TABLE VPNS DROP COLUMN VPN_PRINCIPAL_ID;
```

---

## ✅ CHECKLIST DE VALIDACIÓN

- [x] VpnRule.ts creada con estructura correcta
- [x] Vpn.ts actualizada (eliminada auto-referencia)
- [x] data-source.ts registra VpnRule
- [x] config/database.ts registra VpnRule
- [x] createAsset() maneja reglas como VpnRule
- [x] updateAsset() maneja actualización de reglas
- [x] getStats() simplificada (sin filtro vpnPrincipalId)
- [x] getAssets() carga relaciones correctas
- [x] getAssetById() carga reglas correctamente
- [x] Frontend types actualizadas (Vpn + VpnRule)
- [x] API endpoints listos para recibir/devolver reglas

---

## 🔍 TESTING RECOMENDADO

### Test 1: Crear VPN Simple (sin reglas)
```bash
POST /api/assets
{
  "tipo": "VPN",
  "nombre": "VPN Test 1",
  "vpn": { "conexion": "IPSec", ... }
}
# Esperado: Crear VPN sin reglas, reglas: []
```

### Test 2: Crear VPN con 3 Reglas
```bash
POST /api/assets
{
  "tipo": "VPN",
  "nombre": "VPN Test 2",
  "vpn": {
    "conexion": "IPSec",
    "reglas": [ {...}, {...}, {...} ]
  }
}
# Esperado: VPN + 3 rows en VPN_RULES
```

### Test 3: GET Asset VPN
```bash
GET /api/assets/{vpn-asset-id}
# Esperado: vpn.reglas devuelve array de VpnRule, no Vpn
```

### Test 4: Actualizar Reglas (2 → 1)
```bash
PUT /api/assets/{vpn-asset-id}
{
  "vpn": {
    "reglas": [ {...} ]  # Solo 1 regla
  }
}
# Esperado: Elimina 2 antiguas, crea 1 nueva
```

### Test 5: Eliminar VPN Principal
```bash
DELETE /api/assets/{vpn-asset-id}
# Esperado: Elimina VPN y sus VPN_RULES automáticamente (CASCADE)
```

---

## 📝 NOTAS

- **Backward Compatibility:** El cambio es breaking para clientes que esperan `reglas: Vpn[]`
- **Performance:** Las queries ahora son más simples sin auto-joins complejos
- **Integridad:** CASCADE DELETE garantiza que no queden reglas huérfanas
- **Futuro:** Estructura lista para queries de reglas independientes (ej: "mostrar todas las reglas con origen X")

---

**Última actualización:** 2025  
**Estado de Producción:** 🟢 Listo para desplegar
