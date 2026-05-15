-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION: Agregar soporte para VPN Principal + Reglas Asociadas
-- Fecha: 2026-05-14
-- BD: ORACLE
--
-- DESCRIPCIÓN:
--   Esta migration agrega la columna VPN_PRINCIPAL_ID a la tabla VPNS
--   para permitir que múltiples VPNs sean reglas de una VPN principal.
--
-- IMPACTO EN DATOS:
--   ✅ NO destructiva - solo agregar columna
--   ✅ Todos los registros existentes quedan intactos
--   ✅ VPN_PRINCIPAL_ID = NULL para todos (inicialmente)
--
-- CÓMO EJECUTAR:
--   sqlplus user/password@database @001_add_vpn_principal_support.sql
--
-- ROLLBACK (si algo falla):
--   ALTER TABLE VPNS DROP CONSTRAINT FK_VPN_PRINCIPAL_ID;
--   ALTER TABLE VPNS DROP COLUMN VPN_PRINCIPAL_ID;
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Verificar que la tabla existe
DECLARE
  v_count NUMBER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM user_tables
  WHERE table_name = 'VPNS';
  
  IF v_count = 0 THEN
    RAISE_APPLICATION_ERROR(-20001, 'ERROR: Tabla VPNS no existe');
  END IF;
  
  DBMS_OUTPUT.PUT_LINE('✓ Tabla VPNS encontrada');
END;
/

-- 2. Verificar que la columna no existe ya
DECLARE
  v_count NUMBER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM user_tab_columns
  WHERE table_name = 'VPNS'
    AND column_name = 'VPN_PRINCIPAL_ID';

  IF v_count > 0 THEN
    DBMS_OUTPUT.PUT_LINE('⚠ Columna VPN_PRINCIPAL_ID ya existe - saltando');
  END IF;
END;
/

-- 3. Agregar la columna VPN_PRINCIPAL_ID
ALTER TABLE VPNS ADD (
  VPN_PRINCIPAL_ID VARCHAR2(36) NULL
);

COMMIT;
DBMS_OUTPUT.PUT_LINE('✓ Columna VPN_PRINCIPAL_ID agregada');

-- 4. Agregar constraint de Foreign Key (auto-referencia)
ALTER TABLE VPNS ADD CONSTRAINT FK_VPN_PRINCIPAL_ID
  FOREIGN KEY (VPN_PRINCIPAL_ID)
  REFERENCES VPNS(ID)
  ON DELETE SET NULL;

COMMIT;
DBMS_OUTPUT.PUT_LINE('✓ Constraint FK_VPN_PRINCIPAL_ID creado');

-- 5. Crear índice para mejorar queries por VPN_PRINCIPAL_ID
CREATE INDEX IDX_VPN_PRINCIPAL_ID ON VPNS(VPN_PRINCIPAL_ID);

COMMIT;
DBMS_OUTPUT.PUT_LINE('✓ Índice IDX_VPN_PRINCIPAL_ID creado');

-- 6. Verificar que todo quedó bien
DECLARE
  v_col_count NUMBER;
  v_constr_count NUMBER;
  v_idx_count NUMBER;
BEGIN
  SELECT COUNT(*) INTO v_col_count
  FROM user_tab_columns
  WHERE table_name = 'VPNS' AND column_name = 'VPN_PRINCIPAL_ID';
  
  SELECT COUNT(*) INTO v_constr_count
  FROM user_constraints
  WHERE table_name = 'VPNS' AND constraint_name = 'FK_VPN_PRINCIPAL_ID';
  
  SELECT COUNT(*) INTO v_idx_count
  FROM user_indexes
  WHERE table_name = 'VPNS' AND index_name = 'IDX_VPN_PRINCIPAL_ID';
  
  IF v_col_count = 1 AND v_constr_count = 1 AND v_idx_count = 1 THEN
    DBMS_OUTPUT.PUT_LINE('✅ MIGRATION COMPLETADA EXITOSAMENTE');
    DBMS_OUTPUT.PUT_LINE('   - Columna: ✓');
    DBMS_OUTPUT.PUT_LINE('   - Constraint: ✓');
    DBMS_OUTPUT.PUT_LINE('   - Índice: ✓');
  ELSE
    RAISE_APPLICATION_ERROR(-20002, 'ERROR: Migration incompleta');
  END IF;
END;
/

COMMIT;
