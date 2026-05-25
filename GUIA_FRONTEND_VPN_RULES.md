# 📱 GUÍA: Implementar VPN Rules en AssetCreateModal

**Objetivo:** Actualizar el formulario de creación de Assets para permitir crear múltiples VPN Rules en una sola operación.

---

## 🎯 REQUISITOS

### Cambios de Interface (TypeScript)
```typescript
// IMPORTAR la nueva interface
import type { VpnRule } from "../types";

// ✅ VpnRule debe tener:
interface VpnRule {
  id: string;
  vpnId: string;
  conexion: string | null;
  fases: string | null;
  origen: string | null;
  destino: string | null;
}

// ✅ Vpn debe tener:
interface Vpn {
  id: string;
  assetId: string;
  conexion: string | null;
  fases: string | null;
  origen: string | null;
  destino: string | null;
  reglas?: VpnRule[];  // ✅ Ahora es VpnRule[], no Vpn[]
}
```

---

## 🛠️ ESTRUCTURA PROPUESTA PARA AssetCreateModal

### 1. Estado Local para Reglas

```typescript
// Dentro del componente AssetCreateModal
const [vpnRules, setVpnRules] = useState<Partial<VpnRule>[]>([]);

// Campos que el usuario puede editar
const [currentRule, setCurrentRule] = useState<Partial<VpnRule>>({
  conexion: "",
  fases: "",
  origen: "",
  destino: "",
});
```

### 2. Funciones Helper

```typescript
// Agregar nueva regla a la lista
const handleAddRule = () => {
  if (!currentRule.conexion && !currentRule.fases && 
      !currentRule.origen && !currentRule.destino) {
    return; // No agregar si está vacía
  }
  
  setVpnRules([...vpnRules, { ...currentRule }]);
  // Limpiar el formulario actual
  setCurrentRule({
    conexion: "",
    fases: "",
    origen: "",
    destino: "",
  });
};

// Remover una regla de la lista
const handleRemoveRule = (index: number) => {
  setVpnRules(vpnRules.filter((_, i) => i !== index));
};

// Actualizar campo en regla actual
const handleRuleFieldChange = (field: keyof VpnRule, value: string) => {
  setCurrentRule({
    ...currentRule,
    [field]: value || null,
  });
};
```

### 3. Sección del Formulario para Reglas

```typescript
// Renderizar SOLO cuando tipo === "VPN"
{tipo === "VPN" && (
  <div className="border rounded-lg p-4 bg-gray-50">
    <h3 className="text-lg font-semibold mb-4">Reglas VPN</h3>
    
    {/* Lista de Reglas Existentes */}
    {vpnRules.length > 0 && (
      <div className="mb-4">
        <h4 className="font-medium text-sm mb-2">
          Reglas Agregadas ({vpnRules.length})
        </h4>
        <div className="space-y-2">
          {vpnRules.map((rule, idx) => (
            <div 
              key={idx}
              className="flex items-start justify-between bg-white p-3 rounded border border-gray-200"
            >
              <div className="text-sm flex-1">
                <p><strong>Conexión:</strong> {rule.conexion || "—"}</p>
                <p><strong>Fases:</strong> {rule.fases || "—"}</p>
                <p><strong>Origen:</strong> {rule.origen || "—"}</p>
                <p><strong>Destino:</strong> {rule.destino || "—"}</p>
              </div>
              <button
                onClick={() => handleRemoveRule(idx)}
                className="ml-2 px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
              >
                Eliminar
              </button>
            </div>
          ))}
        </div>
      </div>
    )}
    
    {/* Formulario para Nueva Regla */}
    <div className="bg-white p-4 rounded border border-gray-300">
      <h4 className="font-medium text-sm mb-3">Nueva Regla</h4>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
        <input
          type="text"
          placeholder="Conexión (ej: IPSec, BGP)"
          value={currentRule.conexion || ""}
          onChange={(e) => handleRuleFieldChange("conexion", e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded"
        />
        
        <input
          type="text"
          placeholder="Fases (ej: IKEv2 P1 y P2)"
          value={currentRule.fases || ""}
          onChange={(e) => handleRuleFieldChange("fases", e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded"
        />
        
        <input
          type="text"
          placeholder="Origen (ej: 192.168.1.0/24)"
          value={currentRule.origen || ""}
          onChange={(e) => handleRuleFieldChange("origen", e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded"
        />
        
        <input
          type="text"
          placeholder="Destino (ej: 10.0.0.0/8)"
          value={currentRule.destino || ""}
          onChange={(e) => handleRuleFieldChange("destino", e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded"
        />
      </div>
      
      <button
        onClick={handleAddRule}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        + Agregar Regla
      </button>
    </div>
  </div>
)}
```

### 4. Actualizar handleSubmit

```typescript
const handleSubmit = async () => {
  // ... validaciones existentes ...
  
  const payload: any = {
    tipo,
    nombre,
    ubicacion,
    propietario,
    custodio,
    codigoServicio,
  };
  
  // Agregar datos específicos por tipo
  if (tipo === "VPN") {
    payload.vpn = {
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
    };
  } else if (tipo === "SERVIDOR") {
    payload.servidor = { /* ... */ };
  }
  // ... otros tipos ...
  
  try {
    const response = await fetch("/api/assets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) throw new Error("Error creando asset");
    
    const createdAsset = await response.json();
    console.log("✅ Asset creado:", createdAsset);
    
    // Cerrar modal y refrescar lista
    onClose();
    // Llamar a callback para refrescar la lista de assets
  } catch (error) {
    console.error("❌ Error:", error);
    // Mostrar mensaje de error al usuario
  }
};
```

---

## 📋 FLUJO VISUAL PROPUESTO

```
┌─────────────────────────────────────────────────────┐
│         Crear Nuevo Asset - VPN                      │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Nombre: [________________]                         │
│  Ubicación: [________________]                      │
│  ...                                                │
│                                                      │
│  ┌─────────────────────────────────────────────┐  │
│  │ Datos VPN                                   │  │
│  ├─────────────────────────────────────────────┤  │
│  │ Conexión: [_______________]                 │  │
│  │ Fases: [_______________]                    │  │
│  │ Origen: [_______________]                   │  │
│  │ Destino: [_______________]                  │  │
│  └─────────────────────────────────────────────┘  │
│                                                      │
│  ┌─────────────────────────────────────────────┐  │
│  │ Reglas VPN                                  │  │
│  ├─────────────────────────────────────────────┤  │
│  │                                             │  │
│  │  ✅ Reglas Agregadas (2)                   │  │
│  │  ┌─────────────────────────────────────┐  │  │
│  │  │ Conexión: BGP                       │  │  │
│  │  │ Fases: Routing                      │✕ │  │
│  │  │ Origen: AS 65001                    │  │  │
│  │  │ Destino: AS 65002                   │  │  │
│  │  └─────────────────────────────────────┘  │  │
│  │  ┌─────────────────────────────────────┐  │  │
│  │  │ Conexión: EIGRP                     │  │  │
│  │  │ Fases: Dynamic                      │✕ │  │
│  │  │ Origen: 10.1.1.0/24                 │  │  │
│  │  │ Destino: 10.2.2.0/24                │  │  │
│  │  └─────────────────────────────────────┘  │  │
│  │                                             │  │
│  │  📝 Nueva Regla                            │  │
│  │  Conexión: [_____________]                 │  │
│  │  Fases: [_____________]                    │  │
│  │  Origen: [_____________]                   │  │
│  │  Destino: [_____________]                  │  │
│  │  [+ Agregar Regla]                         │  │
│  └─────────────────────────────────────────────┘  │
│                                                      │
│  [Cancelar]                         [Crear Asset]  │
└─────────────────────────────────────────────────────┘
```

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

- [ ] Importar `VpnRule` en AssetCreateModal.tsx
- [ ] Agregar estado `vpnRules` (array vacío inicialmente)
- [ ] Agregar estado `currentRule` (objeto con campos vacíos)
- [ ] Implementar `handleAddRule()`
- [ ] Implementar `handleRemoveRule(index)`
- [ ] Implementar `handleRuleFieldChange(field, value)`
- [ ] Renderizar sección de reglas (solo si tipo === "VPN")
- [ ] Renderizar lista de reglas agregadas
- [ ] Renderizar formulario para nueva regla
- [ ] Actualizar `handleSubmit` para incluir reglas en payload
- [ ] Probar creación de VPN sin reglas
- [ ] Probar creación de VPN con 1 regla
- [ ] Probar creación de VPN con múltiples reglas
- [ ] Probar eliminación de regla antes de crear
- [ ] Verificar que el API recibe las reglas correctamente

---

## 🧪 CASOS DE PRUEBA

### Test 1: VPN sin Reglas
1. Seleccionar tipo = VPN
2. Llenar datos VPN (conexion, fases, origen, destino)
3. NO agregar ninguna regla
4. Clic en "Crear Asset"
5. **Esperado:** API recibe `reglas: []`, se crea VPN con array vacío

### Test 2: VPN con 2 Reglas
1. Seleccionar tipo = VPN
2. Llenar datos VPN principal
3. Agregar regla 1: BGP
4. Agregar regla 2: EIGRP
5. Clic en "Crear Asset"
6. **Esperado:** VPN creada con 2 VpnRule en DB

### Test 3: Remover Regla
1. Agregar 3 reglas
2. Remover la regla del medio
3. Clic en "Crear Asset"
4. **Esperado:** Solo 2 reglas se crean en la BD

### Test 4: Validación
1. Intentar agregar regla sin llenar campos
2. **Esperado:** Botón "Agregar Regla" no hace nada o valida campos

---

## 📝 NOTAS IMPORTANTES

- **Reglas Opcionales:** El usuario puede crear una VPN sin reglas
- **Reglas Múltiples:** No hay límite de reglas que se pueden agregar
- **Actualización Posterior:** Las reglas pueden actualizarse en la página de detalle del asset
- **Validación:** Considerar validación de campos (ej: origen/destino deben ser CIDR válidos)
- **Confirmación:** Mostrar mensaje de éxito/error después de crear

---

## 🔗 INTEGRACIÓN CON DETAIL PAGE

Cuando se implementa la actualización en `AssetDetail/index.tsx`, usar la misma estructura para gestionar reglas:

```typescript
// En AssetDetail (actualizar VPN existente)
const handleUpdateVpnRules = (newRules: Partial<VpnRule>[]) => {
  // PUT /api/assets/{assetId}
  // {
  //   vpn: {
  //     reglas: newRules
  //   }
  // }
};
```

---

**Última actualización:** 2025  
**Estado:** 📝 Guía lista para implementación
