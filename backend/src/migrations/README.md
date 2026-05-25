# TypeORM Migrations

## Cómo funciona:

Cada vez que cambies una Entity (agregues/elimines campos), TypeORM genera automáticamente un archivo `.ts` con la migración SQL.

## Pasos para agregar un nuevo campo:

### 1. Cambiar Entity
```typescript
// src/entities/Vpn.ts
@Column({ type: "varchar2", length: 100, nullable: true })
nuevoField!: string | null;
```

### 2. Generar migración automática
```bash
npm run migration:generate -- src/migrations/AddNuevoFieldToVpn
```

Esto genera un archivo como: `src/migrations/1234567890-AddNuevoFieldToVpn.ts`

### 3. Revisar la migración
Abre el archivo generado y verifica que sea correcto:
```typescript
export class AddNuevoFieldToVpn1234567890 implements MigrationInterface {
  // up: lo que AGREGA
  // down: lo que REVIERTE (por si algo falla)
}
```

### 4. Commitear a GIT
```bash
git add src/migrations/
git commit -m "Migration: Add nuevoField to Vpn table"
```

### 5. Deploy
Cuando la app inicia:
```
1. Compila TypeScript
2. Lee carpeta dist/migrations/
3. Ejecuta migraciones no ejecutadas aún
4. La BD se actualiza automáticamente
```

## Otros comandos:

```bash
# Ver todas las migraciones
npm run migration:run

# Revertir la última migración (si algo salió mal)
npm run migration:revert
```

## ⚠️ IMPORTANTE:

- **NO edites migraciones generadas** (se rompe el versionado)
- Si cometiste error: revertir + generar de nuevo
- Las migraciones se guardan en tabla `typeorm_migrations` de BD

## Rollback de emergencia (si BD se daña):

```bash
npm run migration:revert
npm run migration:revert  # Ejecuta todas las que pueda revertir
```
