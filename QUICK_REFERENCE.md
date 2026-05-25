# 🚀 QUICK REFERENCE: VPN Rules Implementation

**Guarda esto cerca - Es tu mejor amigo durante la implementación frontend**

---

## 📌 ARCHIVOS CRÍTICOS MODIFICADOS

```
✅ BACKEND COMPLETADO
├── backend/src/entities/
│   ├── VpnRule.ts (✨ NUEVA)
│   └── Vpn.ts (actualizada)
├── backend/src/config/
│   ├── database.ts (+ VpnRule)
│   └── data-source.ts (+ VpnRule)
└── backend/src/api/services/
    └── assets.service.ts (+ reglas logic)

🟡 FRONTEND PENDIENTE
└── frontend/src/components/
    └── AssetCreateModal.tsx (requiere actualización)

📝 DOCUMENTACIÓN
├── MIGRACION_VPN_RULES_2025.md
├── GUIA_FRONTEND_VPN_RULES.md
├── RESUMEN_CAMBIOS_VPN_RULES_FINAL.md
└── STATUS_FINAL.md
```

---

## 🧠 CONCEPTOS CLAVE

### ANTES (Auto-Referencia ❌)
```typescript
Vpn {
  id: "vpn1"
  conexion: "IPSec"
  vpnPrincipalId: null  // Principal
}

Vpn {
  id: "vpn2"
  conexion: "BGP"
  vpnPrincipalId: "vpn1"  // Regla vinculada a vpn1
}
```

### AHORA (Relación Clara ✅)
```typescript
Vpn {
  id: "vpn1"
  conexion: "IPSec"
  reglas: [VpnRule, VpnRule, ...]
}

VpnRule {
  id: "rule1"
  vpnId: "vpn1"
  conexion: "BGP"
}
```

---

## 🔗 API ENDPOINTS

### CREATE VPN con Reglas
```bash
POST /api/assets
Content-Type: application/json

{
  "tipo": "VPN",
  "nombre": "S2S VPN Bogotá",
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

### GET VPN con Reglas
```bash
GET /api/assets/{id}

RESPUESTA:
{
  "vpn": {
    "id": "vpn-uuid",
    "conexion": "IPSec",
    "reglas": [
      {
        "id": "rule-uuid-1",
        "vpnId": "vpn-uuid",
        "conexion": "BGP",
        "fases": "Routing",
        ...
      },
      {
        "id": "rule-uuid-2",
        "vpnId": "vpn-uuid",
        "conexion": "EIGRP",
        ...
      }
    ]
  }
}
```

### UPDATE VPN Reglas
```bash
PUT /api/assets/{id}

{
  "vpn": {
    "reglas": [
      { "conexion": "BGP", ... },
      { "conexion": "Static Route", ... }
    ]
  }
}
```

---

## 💻 CÓDIGO FRONTEND (Template)

### Estado
```typescript
const [vpnRules, setVpnRules] = useState<Partial<VpnRule>[]>([]);
const [currentRule, setCurrentRule] = useState<Partial<VpnRule>>({
  conexion: "",
  fases: "",
  origen: "",
  destino: "",
});
```

### Funciones Helper
```typescript
const handleAddRule = () => {
  setVpnRules([...vpnRules, { ...currentRule }]);
  setCurrentRule({ conexion: "", fases: "", origen: "", destino: "" });
};

const handleRemoveRule = (index: number) => {
  setVpnRules(vpnRules.filter((_, i) => i !== index));
};

const handleRuleFieldChange = (field: keyof VpnRule, value: string) => {
  setCurrentRule({ ...currentRule, [field]: value || null });
};
```

### En handleSubmit
```typescript
const payload = {
  tipo: "VPN",
  vpn: {
    conexion: vpn?.conexion ?? null,
    fases: vpn?.fases ?? null,
    origen: vpn?.origen ?? null,
    destino: vpn?.destino ?? null,
    reglas: vpnRules.map(rule => ({
      conexion: rule.conexion ?? null,
      fases: rule.fases ?? null,
      origen: rule.origen ?? null,
      destino: rule.destino ?? null,
    }))
  }
};
```

---

## ✅ TESTING CHECKLIST

```
[ ] POST /api/assets - VPN sin reglas → reglas: []
[ ] POST /api/assets - VPN + 1 regla → 1 VPN_RULES row
[ ] POST /api/assets - VPN + 3 reglas → 3 VPN_RULES rows
[ ] GET /api/assets/{id} → reglas devuelve VpnRule[]
[ ] PUT /api/assets/{id} → Actualiza reglas
[ ] DELETE /api/assets/{id} → Elimina VPN + reglas (CASCADE)
[ ] AssetCreateModal → Agregar/remover reglas OK
[ ] AssetDetail → Mostrar reglas OK (si implementado)
```

---

## 🔍 DEBUGGING

### "VpnRule no encontrado"
```bash
Solución:
✅ backend/src/entities/VpnRule.ts existe
✅ import en assets.service.ts: ✓
✅ import en data-source.ts: ✓
✅ import en config/database.ts: ✓
✅ Registrado en entities arrays: ✓
```

### "Reglas no se guardan"
```bash
Solución:
✅ vpnRuleRepository.save() se ejecuta: ✓
✅ reglas no son null/undefined: ✓
✅ VPN_RULES tabla existe en BD: ✓
✅ FK VPN_ID es válida: ✓
```

### "Reglas no se cargan"
```bash
Solución:
✅ assetRepository.find tiene: relations: ["vpn", "vpn.reglas"]
✅ VpnRule.ts tiene: @OneToMany(() => VpnRule, ...)
✅ Vpn.ts tiene: reglas!: VpnRule[];
```

---

## 📋 INTERFACES TypeScript

### VpnRule
```typescript
interface VpnRule {
  id: string;
  vpnId: string;
  conexion: string | null;
  fases: string | null;
  origen: string | null;
  destino: string | null;
}
```

### Vpn
```typescript
interface Vpn {
  id: string;
  assetId: string;
  conexion: string | null;
  fases: string | null;
  origen: string | null;
  destino: string | null;
  reglas?: VpnRule[];  // ← IMPORTANTE: VpnRule[], no Vpn[]
}
```

---

## 🎯 FLUJO COMPLETO

```
USUARIO:
  1. Abre AssetCreateModal
  2. Selecciona tipo = "VPN"
  3. Llena datos: conexion, fases, origen, destino
  4. Agrega 2-3 reglas
  5. Clic "Crear Asset"

FRONTEND:
  6. Prepara payload con vpn.reglas: [...]
  7. POST /api/assets

BACKEND (createAsset):
  8. Crea Asset
  9. Crea Vpn (sin reglas)
  10. Para cada regla: Crea VpnRule
  11. Retorna asset completo

BD:
  12. 1 row en ASSETS
  13. 1 row en VPNS
  14. N rows en VPN_RULES (N = cantidad reglas)

FRONTEND:
  15. Cierra modal
  16. Refrescar lista
  17. ✅ "Asset creado exitosamente"
```

---

## 🚨 ERRORES COMUNES

| Error | Causa | Solución |
|-------|-------|----------|
| `Cannot find 'VpnRule'` | Falta import | Agregar: `import { VpnRule } from "../../entities/VpnRule"` |
| `reglas is not defined` | Typo en variable | Verificar: `vpnRules` vs `reglas` |
| `vpnId is null` | No se pasó VPN ID | Verificar: `vpn: savedVpn` en create |
| `Reglas no se cargan` | Relación no en query | Agregar: `relations: [..., "vpn.reglas"]` |
| `Cascade delete no funciona` | FK sin CASCADE | Verificar: `onDelete: "CASCADE"` en @JoinColumn |

---

## 📞 DÓNDE BUSCAR RESPUESTAS

| Pregunta | Documento | Sección |
|----------|-----------|---------|
| "¿Cómo estructuro el estado?" | GUIA_FRONTEND | Estructura Propuesta |
| "¿Cuál es el payload API?" | MIGRACION | Flujo de Datos Actualizado |
| "¿Cómo hago cascade delete?" | RESUMEN_CAMBIOS | Cambios en Entidades |
| "¿Qué archivos se modificaron?" | RESUMEN_CAMBIOS | Estadísticas de Cambios |
| "¿Cómo testeo?" | MIGRACION | Testing Recomendado |
| "¿Status general?" | STATUS_FINAL | Dashboard de Completitud |

---

## 🎓 PARA ENTENDER EL CÓDIGO

### Orden de lectura recomendado:
```
1. MIGRACION_VPN_RULES_2025.md (Overview general)
   └─ ¿Qué cambió y por qué?

2. backend/src/entities/VpnRule.ts (El modelo)
   └─ Estructura de datos

3. backend/src/api/services/assets.service.ts (La lógica)
   └─ Cómo se crea/actualiza

4. GUIA_FRONTEND_VPN_RULES.md (Tu guía)
   └─ Cómo implementar UI

5. STATUS_FINAL.md (Checklist)
   └─ Qué falta hacer
```

---

## ⚡ QUICK WINS (Gana Tiempo)

✅ Copiar función `handleAddRule` como template
✅ Copiar estructura de estado de GUIA_FRONTEND
✅ Usar los casos de test de MIGRACION como validación
✅ Referencia rápida de API endpoints (arriba de este doc)
✅ Mantén STATUS_FINAL.md abierto como checklist

---

## 🔐 IMPORTANTE

**NO olvidar:**
- Reglas es OPCIONAL (usuario puede no agregar ninguna)
- VpnRule NO tiene `id` en frontend (se genera en backend)
- `reglas?: VpnRule[]` es optional pero si envías debe ser array
- Cascade delete = no queden reglas huérfanas
- Bitácora registra cambios de reglas

---

**Última actualización:** 2025  
**Versión:** 1.0 QUICK REFERENCE  
**Status:** ✅ Listo para implementación
