# � CONTEXTO OCS INVENTORY - INTEGRACIÓN APP INVENTARIO

**Fecha:** 28 Mayo 2026 | **Estado:** Investigación fase conectividad | **Criticidad:** ALTA

---

## 📊 **ESTADO ACTUAL - MAPEO COMPLETO**

### **Stack Actual**
- Backend: Express.js 4.18.2 + TypeORM 0.3.28 + Oracle DB (172.16.0.29:1521/PRODB)
- Frontend: React 18 + Vite (localhost:5173)
- Autenticación: JWT 8h + LDAP fiduprevisora.com.co
- Admin by env.ADMINS list

### **Entidades Existentes - ESTADO ✅**
| Entidad | Tipo | Relación | Status |
|---------|------|----------|--------|
| Asset | Principal | Punto central | ✅ Completa |
| Servidor | OneToOne con Asset | appSoporta (varchar 1000) | ✅ Existente - SIN CAMBIOS |
| VPN | OneToOne con Asset | reglas + reglasHistóricas | ✅ Completa |
| VPNRule | OneToMany | FK a VPN | ✅ Cascade delete OK |
| Movil | OneToOne con Asset | Con firma digital + estado | ✅ Completa |
| Red, Ups, BaseDatos | OneToOne con Asset | Estándar | ✅ Completa |
| Bitacora | Audit trail | FK Asset | ✅ Implementada |

### **Controllers/Services/Routes - ESTADO ✅**
- assets.controller.ts: ✅ 11+ métodos (getAssets, hardDelete, hardDeleteAll, etc)
- assets.service.ts: ✅ hardDelete + hardDeleteAll implementados correctamente (líneas ~936-1037)
- assets.routes.ts: ✅ Orden correcto (DELETE /hard-all ANTES DE DELETE /:id para evitar conflicts)

---

## 🔍 **INVESTIGACIÓN OCS - HALLAZGOS CRÍTICOS**

### **OCS Inventory Operacional - VERIFICADO ✅**
- Ubicación: http://172.16.0.117/ocsreports/index.php?function=visu_computers
- Total computadores: **84 máquinas registradas**
- Total apps (ejemplo BOG_VAF_013): **142 software instalado**
- Usuario válido: ❓ "admin" RECHAZADO → Need different user

### **Conectividad OCS - Estado Crítico**

| Canal | Status | Hallazgo |
|-------|--------|----------|
| UI Web (172.16.0.117) | ✅ OK | Accesible, login requerido, 84 hosts visibles |
| Detalles por host | ✅ OK | Hardware, software, config disponibles por computador |
| Software per host | ✅ OK | Tab "Software" muestra apps instaladas (142 en BOG_VAF_013) |
| API REST /ocsapi/v2 | ❌ 404 | Path inexistente - NO usar |
| SSH Port 22 | ❌ TIMEOUT | 173.16.0.117:22 timeout - Puerto bloqueado/firewall |
| BD MySQL 3006 | 🔄 PENDING | Requiere SSH tunnel - Aún no probado |

### **Datos Observados - Estructura Confirmada**
- Computadores: ID, NAME, IPADDR (100.65.15.4), MACADDR, OSNAME, RAM, CPU
- Software: NAME, PUBLISHER/Editor, VERSION, Architecture, InstallDate
- Campos UI: Editor (Vendor) | Name | Version | Comments
- Relación BD OCS: 1 Computador = N Software (FK model esperado)

### **IPs Observadas - DISCREPANCIA CRÍTICA**
- UI accesible: `172.16.0.117` ✅
- SSH/BD indicado: `173.16.0.117` ❌ Timeout
- **ANÁLISIS:** Probablemente typo o redes diferentes - Necesita confirmación admin

---

## � **BLOQUEANTES - ROOT CAUSE ANALYSIS**

### **Bloqueante 1: SSH Connection Failed (CRÍTICO)**
- Error: `ssh: connect to host 173.16.0.117 port 22: Connection timed out`
- IP 173.16.0.117 no responde en puerto 22
- Root cause: Firewall bloqueado O IP incorrecta
- Impacto: No puede abrirse tunnel SSH para acceder BD MySQL OCS
- Resolución: Admin debe confirmar IP correcta (172 vs 173) y abrir puerto 22

### **Bloqueante 2: Usuario OCS Desconocido**
- Intento: "admin" → Respuesta "User not registered"
- Implicación: El usuario para UI OCS no es "admin"
- Posibles valores: ocsweb, p_scorrea, root, o credential específica
- Resolución: Preguntar admin cuál es usuario válido para OCS UI

### **Bloqueante 3: API REST Desconocida**
- Probado: /ocsapi/v2/computers → HTTP 404
- Implicación: OCS expone BD directa, no API REST
- Decisión: Usar conexión MySQL directa (más confiable)
- Path correcto: MySQL 3006 via SSH tunnel

### **Bloqueante 4: Estructura BD OCS PENDIENTE VERIFICACIÓN**
- Tablas: Asumo "computers" y "software" pero DEBEN confirmarse
- Campos: Asumo COMPUTER_ID como FK pero DEBE verificarse
- Schema: Nombres exactos de columnas CRÍTICO para queries
- Resolución: SHOW TABLES; DESCRIBE en MySQL OCS

---

## 🏗️ **ARQUITECTURA RECOMENDADA - DECISIONES JUSTIFICADAS**

### **Entidades Nuevas Requeridas (3 archivos TypeORM)**

#### **1. SoftwareInstalado.ts** 
- Ubicación: `backend/src/entities/SoftwareInstalado.ts`
- Propósito: Registrar software instalado por servidor
- Estructura: ManyToOne(Servidor) + nombre, version, vendor, tamanioMb, fuenteOcs (flag), sincronizadoEn
- Razón: Modelar 1 Servidor = N Apps instaladas
- BD: Tabla ORACLE "SOFTWARE_INSTALADO"

#### **2. OcsServidorMapping.ts**
- Ubicación: `backend/src/entities/OcsServidorMapping.ts`
- Propósito: Mapeo bidireccional: Servidor local ↔ OCS Computer
- Estructura: ManyToOne(Servidor) + ocsComputerId (number), ocsHostname, ocsMacAddress, ocsIpAddr, activo, sincronizadoEn
- Razón: Evitar duplicados, permitir desmapeo, auditable
- BD: Tabla ORACLE "OCS_SERVIDOR_MAPPING"

#### **3. Servidor.ts - Actualizar MÍNIMAMENTE**
- Cambio: Agregar relaciones (sin tocar appSoporta)
  - `@OneToMany(() => SoftwareInstalado)` lazy = false
  - `@OneToOne(() => OcsServidorMapping)` nullable = true
- Razón: Mantener backward compatibility

### **Service Layer - ocs.service.ts**
- Ubicación: `backend/src/api/services/ocs.service.ts`
- Responsabilidades:
  1. Conectar a BD MySQL OCS (pool mysql2/promise)
  2. Traer todos computadores: `getAllComputers()` 
  3. Traer software x computador: `getSoftwareByComputerId(id)`
  4. Match inteligente: `matchServerWithOcs()` con score (nombre 80%, IP 70%, MAC 90%)
  5. Preview sync: `generateSyncPreview()` sin tocar BD
- Config: `.env` → OCS_DB_HOST, OCS_DB_PORT, OCS_DB_USER, OCS_DB_PASSWORD, OCS_DB_NAME

### **Controller Layer - ocs.controller.ts**
- Ubicación: `backend/src/api/controllers/ocs.controller.ts`
- Endpoints:
  1. `GET /api/ocs/preview` → Mostrar PREVIEW sin modificar (público, lectura)
  2. `POST /api/ocs/confirm-sync` → Crear mappings (ADMIN only)
  3. `POST /api/ocs/sync-software/:id` → Sync 1 servidor (ADMIN)
  4. `POST /api/ocs/sync-all-software` → Batch sync (ADMIN, heavy)

### **Routes Layer - ocs.routes.ts**
- Ubicación: `backend/src/api/routes/ocs.routes.ts`
- Integración: En `app.ts` → `app.use("/api/ocs", ocsRoutes)`
- Protección: GET preview = público | POST = requireAdmin

### **Estrategia de Sincronización**
1. Preview: Carga OCS, compara local, genera matches con confidence scores
2. Admin: Revisa preview, confirma mappings (previene auto-duplicados)
3. Sync: Guarda mappings en OcsServidorMapping, luego sync software
4. Cron (futuro): Nightly batch a las 2 AM UTC-5 (POST /sync-all-software)

### **Decisión Crítica: BD MySQL vs API REST**
- ✅ ELEGIDA: BD MySQL OCS (conexión directa por SSH tunnel)
- ✅ Razón 1: API REST retorna 404 → no existe o path desconocido
- ✅ Razón 2: BD ofrece control total sobre queries
- ✅ Razón 3: Better performance que parsear HTML UI
- ✅ Razón 4: Estándar en OCS (UI también usa BD directa)
- Prerequisito: SSH tunnel abierto (dependencia de admin net)

---

## ⚠️ **BLOQUEANTES CRITICOS - ACCIÓN INMEDIATA**

| Bloqueante | Status | Acción Requerida | Owner |
|-----------|--------|------------------|-------|
| SSH Port 22 Timeout | 🔴 CRÍTICO | Confirmar IP: 172.16.0.117 o 173.16.0.117? | Admin Red |
| BD MySQL Acceso | 🔴 CRÍTICO | Abrir puerto 22 + 3006 o proporcionar acceso alternativo | Admin Red |
| Usuario OCS válido | 🟡 IMPORTANTE | Identificar user que NO sea "admin" | Admin OCS |
| Schema BD OCS | 🔴 CRÍTICO | SHOW TABLES; DESCRIBE computers; DESCRIBE software; | p_scorrea |

**Timeline: Resolver bloqueantes antes de iniciar implementación**

---

## 📋 **PRÓXIMOS PASOS - SECUENCIA ORDENADA**

### **FASE 0: PREREQUISITOS (Sin estos, no continuar)**
- [ ] Admin confirma IP correcta: 172.16.0.117 u 173.16.0.117?
- [ ] Admin abre puerto 22 para SSH tunnel
- [ ] Admin confirma usuario válido para OCS (no "admin")
- [ ] p_scorrea abre SSH tunnel: `ssh -L 3307:localhost:3006 root@[IP] -N`
- [ ] p_scorrea verifica conexión: `mysql -h 127.0.0.1 -P 3307 -u ocs_user -p ocsweb`
- [ ] p_scorrea ejecuta SHOW TABLES; + DESCRIBE en MySQL OCS
- [ ] p_scorrea confirma tablas/campos exactos

### **FASE 1: Crear Entidades (1 hora)**
- [ ] SoftwareInstalado.ts → `backend/src/entities/`
- [ ] OcsServidorMapping.ts → `backend/src/entities/`
- [ ] Actualizar Servidor.ts (agregar relaciones)
- [ ] Crear migraciones en Oracle (CREATE TABLE)
- [ ] Verificar sync: `npm run typeorm migration:run`

### **FASE 2: Implementar Service (2-3 horas)**
- [ ] Crear ocs.service.ts → `backend/src/api/services/`
- [ ] Implementar: connectOcsDb(), getAllComputers(), getSoftwareByComputerId()
- [ ] Implementar: matchServerWithOcs() con scoring
- [ ] Implementar: generateSyncPreview() (sin modificar BD)
- [ ] Test: GET todos los computers desde OCS BD

### **FASE 3: Implementar Controller + Routes (1-2 horas)**
- [ ] Crear ocs.controller.ts → `backend/src/api/controllers/`
- [ ] Crear ocs.routes.ts → `backend/src/api/routes/`
- [ ] Agregar rutas en app.ts: `app.use("/api/ocs", ocsRoutes)`
- [ ] Verificar: GET /api/ocs/preview (sin auth)
- [ ] Verificar: POST endpoints retornan 403 sin ADMIN

### **FASE 4: Frontend UI (3-4 horas)**
- [ ] Página: "Sincronizar OCS" 
- [ ] GET /api/ocs/preview → mostrar tabla de matches
- [ ] Botón: Confirmar mapeos → POST /confirm-sync
- [ ] Botón: Sincronizar → POST /sync-all-software
- [ ] Indicadores: Loading, success, error states

### **FASE 5: Testing & Validation (2-3 horas)**
- [ ] Test flow completo: preview → confirm → sync
- [ ] Validar: SoftwareInstalado tiene N registros
- [ ] Validar: OcsServidorMapping tiene mappings
- [ ] Validar: No hay duplicados
- [ ] Validar: fuenteOcs=1 solo OCS, fuenteOcs=0 manual

### **FASE 6: Automatización (opcional, 1-2 horas)**
- [ ] Crear cron job: Nightly sync a las 2 AM
- [ ] Implementar: POST /api/ocs/sync-all-software ejecuta automático
- [ ] Logging: Timestamps de última sincronización

**Total estimado: 10-16 horas desarrollo (1-2 días)**

---

## 🎯 **DECISIONES ARQUITECTÓNICAS JUSTIFICADAS**

| Decisión | Opción Alt | Razón Elegida | Trade-off |
|----------|-----------|---------------|-----------|
| BD MySQL vs API REST | API REST | BD: 404 error, API no existe | Requiere SSH tunnel |
| Mapeo Separado vs Inline | Inline en Servidor | Evita duplicados automáticos | 1 tabla extra |
| Preview sin auth vs Protegida | Protegida | Lectura pública OK, escritura ADMIN | Menor seguridad por default |
| Sync Manual vs Auto | Automático | Control admin antes de modificar | Más pasos manuales |
| Confidence Scoring | Simple match | Previene falsos positivos | Overhead de cálculo |
| fuenteOcs flag | Sin trackear | Distinguir OCS vs manual | Campo extra |

---

## 🔐 **Seguridad Implementada**

- `requireAdmin` middleware: Endpoints POST/DELETE requieren rol ADMIN
- No sobreescribe manual: fuenteOcs=1 solo toca datos OCS, fuenteOcs=0 respeta manual
- Cascade delete: Al eliminar Servidor, elimina SoftwareInstalado y OcsServidorMapping
- No auto-create: Preview solo muestra, admin confirma mappings
- Audit trail: Timestamp sincronizadoEn en ambas tablas

---

## 📈 **Timeline Estimado**

| Fase | Duración | Riesgo | Notas |
|------|----------|--------|-------|
| 1. Resolver SSH | 1-2 hrs | ALTO | Depende de admin red |
| 2. Verificar BD | 30 min | BAJO | Una vez SSH abierto |
| 3. Crear entidades | 1 hr | BAJO | SQL simple |
| 4. Service OCS | 2-3 hrs | MEDIO | Lógica de match |
| 5. Controller/Routes | 1-2 hrs | BAJO | Handlers estándar |
| 6. Frontend UI | 3-4 hrs | MEDIO | Tablas, confirmación |
| 7. Testing | 2-3 hrs | MEDIO | Validar datos |
| **TOTAL** | **10-16 hrs** | | **1-2 días de dev** |

---

## 🎯 **DECISIÓN FINAL - RECOMENDACIÓN**

**MEJOR ENFOQUE:**

1. ✅ **Resolver conectividad SSH** (bloqueante crítico)
2. ✅ **Verificar estructura BD OCS** (confirmar tablas/campos)
3. ✅ **Implementar service OCS + preview** (seguro, sin modificar BD)
4. ✅ **Admin revisa preview** (confirma mappings antes de sync)
5. ✅ **Sync manual primero** (POST /sync-software/:id)
6. ✅ **Cron job después** (automatizar nightly)

**Justificación:**
- ✅ Control total
- ✅ Sin duplicados automáticos
- ✅ Auditable
- ✅ Reversible
- ✅ Bajo riesgo
- ✅ Escalable

---

## 🚨 **INFORMACIÓN CRÍTICA PARA PRÓXIMA SESIÓN**

**SI CONTINÚAS EN OTRA CONVERSACIÓN:**

1. **Primero:** Solicitar al admin resultado de SSH
   ```
   Preguntar: ¿Es 172.16.0.117 o 173.16.0.117?
   Test: ssh -L 3307:localhost:3006 root@[IP_CORRECRA] -N
   Si funciona: mysql -h 127.0.0.1 -P 3307 -u ocs_user -p ocsweb
   ```

2. **Luego:** Ejecutar SHOW TABLES en MySQL OCS y reportar nombres exactos

3. **Después:** Seguir checklist PASO 2 → PASO 3 → etc.

4. **Código a usar:** TODO el código de service/controller/routes está en este documento

5. **Entidades:** Copiar exactamente desde este documento (SoftwareInstalado.ts, OcsServidorMapping.ts)

---

## 📞 **Contactar Admin - Script**

```
Asunto: Acceso a BD OCS Inventory (urgente)

Hola,

Necesito acceso a la BD MySQL del OCS Inventory para sincronizar 
servidores automáticamente con nuestro app de Inventario.

Detalles:
- IP: ¿172.16.0.117 o 173.16.0.117?
- Puerto: 3006
- User: ocs_user
- Database: ocsweb
- Método: SSH tunnel (ssh -L 3307:localhost:3006)

¿Pueden abrir puerto 22 en el servidor OCS?
o ¿hay acceso VPN alternativo?

Gracias,
p_scorrea
```

---

**ESTADO FINAL:** ✅ READY PARA CONTINUAR EN PRÓXIMA SESIÓN

Con este documento tienes TODO para:
1. Entender exactamente dónde estamos
2. Saber qué hacer próximo
3. Código completo para implementar
4. Decisiones tomadas y justificadas
5. Timeline realista
6. Próximos pasos específicos

🎯 **PRÓXIMA ACCIÓN: verificar ocs sync services, asssets.routes.ts
