

/**
 * Detecta si un asset fue creado HOY
 * Si fue creado ANTES de hoy → NO validar (es VIEJO)
 * Si fue creado HOY → VALIDAR (es NUEVO)
 */
export function isCreatedToday(createdDate: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const created = new Date(createdDate);
  created.setHours(0, 0, 0, 0);

  return created.getTime() === today.getTime();
}

/**
 * Valida cédula: máx 10 dígitos, solo números/guión
 */
function validateCedula(val: any): string | null {
  if (!val) return null;
  const str = String(val).trim();
  if (str.length > 10) return "Cédula: máximo 10 dígitos";
  if (!/^[\d\-]*$/.test(str)) return "Cédula: solo números y guiones";
  return null;
  
}


/**
 * 
 */
function validateIMEI(val: any): string | null {
  if (!val) return null;
  const str = String(val).trim();
  if (str.length > 20) return "IMEI: máximo 20   dígitos";
  if (!/^\d+$/.test(str)) return "IMEI deben ser solo números";
  return null;
}


/**
 * Valida número de línea: máx 10 dígitos
 */
function validateNumeroLinea(val: any): string | null {
  if (!val) return null;
  const str = String(val).trim();
  if (str.length > 10) return "Número de línea: máximo 10 dígitos";
  if (!/^\d+$/.test(str)) return "Número de línea: solo números";
  return null;
}


/**
 * Valida número de caso: máx 10 caracteres
 */
function validateNumeroCaso(val: any): string | null {
  if (!val) return null;
  const str = String(val).trim();
  if (str.length > 10) return "Número de caso: máximo 10 caracteres";
  return null;
}

/**
 * Valida backup/monitoreo: SI/NO (case-insensitive)
 */
function validateBackupMonitoreo(val: any): string | null {
  if (!val) return null;
  const str = String(val).trim().toUpperCase();
  if (str !== "SI" && str !== "NO" && str !== "S" && str !== "N") {
    return "Backup/Monitoreo: debe ser SI o NO";
  }
  return null;
}

/**
 * Valida campo obligatorio (no vacío, no null, no undefined)
 */
function validateRequired(val: any, fieldName: string): string | null {
  if (!val || (typeof val === "string" && String(val).trim() === "")) {
    return `${fieldName}: campo obligatorio`;
  }
  return null;
}

/**
 * Valida email: formato básico
 */
function validateEmail(val: any): string | null {
  if (!val) return null;
  const str = String(val).trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(str)) return "Email: formato inválido";
  return null;
}

/**
 * Valida IP: formato XXX.XXX.XXX.XXX
 */
function validateIP(val: any): string | null {
  if (!val) return null;
  const str = String(val).trim();
  const ipRegex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const match = str.match(ipRegex);
  if (!match) return "IP: formato inválido (debe ser XXX.XXX.XXX.XXX)";

  // Validar que cada octeto sea 0-255
  const octets = match.slice(1, 5).map(Number);
  if (octets.some((o) => o > 255)) {
    return "IP: octetos deben ser 0-255";
  }
  return null;
}

/**
 * Valida MAC: formato XX:XX:XX:XX:XX:XX (case-insensitive)
 */
function validateMAC(val: any): string | null {
  if (!val) return null;
  const str = String(val).trim().toUpperCase();
  const macRegex = /^([0-9A-F]{2}[:]){5}([0-9A-F]{2})$/;
  if (!macRegex.test(str)) {
    return "MAC: formato inválido (debe ser XX:XX:XX:XX:XX:XX)";
  }
  return null;
}

/**
 * Valida vcpu/vramMb: > 0 si existe
 */
function validatePositiveNumber(val: any, fieldName: string): string | null {
  if (!val) return null;
  const num = Number(val);
  if (isNaN(num) || num <= 0) {
    return `${fieldName}: debe ser un número > 0`;
  }
  return null;
}

/**
 * Valida fecha: no antes de HOY
 */
function validateFecha(val: any, fieldName: string): string | null {
  if (!val) return null;
  const date = new Date(val);
  if (isNaN(date.getTime())) return `${fieldName}: fecha inválida`;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dateOnly = new Date(date);
  dateOnly.setHours(0, 0, 0, 0);

  if (dateOnly < today) {
    return `${fieldName}: no puede ser anterior a hoy`;
  }
  return null;
}

/**
 * VALIDADOR PRINCIPAL
 * Retorna { valid: true } o { valid: false, errors: [...] }
 */
export function validateAssetData(
  tipo: string,
  data: any,
  isNewRecord: boolean
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Si es UPDATE de registro VIEJO → NO validar
  if (!isNewRecord && data.creadoEn && !isCreatedToday(new Date(data.creadoEn))) {
    return { valid: true, errors: [] };
  }

  // ===========================
  // VALIDACIONES POR TIPO
  // ===========================

  // MOVIL
  if (tipo === "MOVIL") {
    const movil = data.movil || data;

    // ✅ OBLIGATORIOS
    const userErr = validateRequired(movil.usuarioRed, "Usuario Red (user)");
    if (userErr) errors.push(userErr);

    const emailErr = validateRequired(movil.correoResponsable, "Correo Responsable (correo)");
    if (emailErr) errors.push(emailErr);

    // ✅ VALIDACIONES OPCIONALES (si existen)
    if (movil.numeroCaso) {
      const err = validateNumeroCaso(movil.numeroCaso);
      if (err) errors.push(err);
    }

    if (movil.cedula) {
      const err = validateCedula(movil.cedula);
      if (err) errors.push(err);
    }

    if (movil.imei1) {
      const err = validateIMEI(movil.imei1);
      if (err) errors.push(err);
    }
  

    if (movil.imei2) {
      const err = validateIMEI(movil.imei2);
      if (err) errors.push(err);
    }

    if (movil.numeroLinea) {
      const err = validateNumeroLinea(movil.numeroLinea);
      if (err) errors.push(err);
    }
    

    if (movil.correoResponsable) {
      const err = validateEmail(movil.correoResponsable);
      if (err) errors.push(err);
    }

    if (movil.fechaEntrega) {
      const err = validateFecha(movil.fechaEntrega, "Fecha de entrega");
      if (err) errors.push(err);
    }
  }

  // SERVIDOR
  if (tipo === "SERVIDOR") {
    const servidor = data.servidor || data;

    // ✅ OBLIGATORIOS
    const backupErr = validateRequired(servidor.backup, "Backup");
    if (backupErr) errors.push(backupErr);
    else {
      const err = validateBackupMonitoreo(servidor.backup);
      if (err) errors.push(err);
    }

    const monitoreoErr = validateRequired(servidor.monitoreo, "Monitoreo");
    if (monitoreoErr) errors.push(monitoreoErr);
    else {
      const err = validateBackupMonitoreo(servidor.monitoreo);
      if (err) errors.push(err);
    }

    const ambienteErr = validateRequired(servidor.ambiente, "Ambiente");
    if (ambienteErr) errors.push(ambienteErr);

    // ✅ VALIDACIONES OPCIONALES (si existen)
    if (servidor.ipInterna) {
      const err = validateIP(servidor.ipInterna);
      if (err) errors.push(err);
    }

    if (servidor.ipGestion) {
      const err = validateIP(servidor.ipGestion);
      if (err) errors.push(err);
    }

    if (servidor.ipServicio) {
      const err = validateIP(servidor.ipServicio);
      if (err) errors.push(err);
    }

    if (servidor.vcpu) {
      const err = validatePositiveNumber(servidor.vcpu, "vCPU");
      if (err) errors.push(err);
    }

    if (servidor.vramMb) {
      const err = validatePositiveNumber(servidor.vramMb, "vRAM");
      if (err) errors.push(err);
    }
  }

  // RED
  if (tipo === "RED") {
    const red = data.red || data;

    // ✅ OBLIGATORIOS
    const macErr = validateRequired(red.mac, "MAC");
    if (macErr) errors.push(macErr);
    else {
      const err = validateMAC(red.mac);
      if (err) errors.push(err);
    }

    const estadoErr = validateRequired(red.estado, "Estado");
    if (estadoErr) errors.push(estadoErr);
    else {
      const err = validateBackupMonitoreo(red.estado);
      if (err) errors.push(err);
    }

    const ipGestionErr = validateRequired(red.ipGestion, "IP Gestión");
    if (ipGestionErr) errors.push(ipGestionErr);
    else {
      const err = validateIP(red.ipGestion);
      if (err) errors.push(err);
    }

    if (red.fechaFinSoporte) {
      const err = validateFecha(red.fechaFinSoporte, "Fecha fin soporte");
      if (err) errors.push(err);
    }
  }

  // UPS
  if (tipo === "UPS") {
    const ups = data.ups || data;

    // ✅ OBLIGATORIO
    const estadoErr = validateRequired(ups.estado, "Estado");
    if (estadoErr) errors.push(estadoErr);
    else {
      const err = validateBackupMonitoreo(ups.estado);
      if (err) errors.push(err);
    }
  }

  // BASE_DATOS
  if (tipo === "BASE_DATOS") {
    const bd = data.baseDatos || data;

    // ✅ OBLIGATORIO
    const ambienteErr = validateRequired(bd.ambiente, "Ambiente");
    if (ambienteErr) errors.push(ambienteErr);

    // ✅ VALIDACIONES OPCIONALES
    if (bd.fechaFinalSoporte) {
      const err = validateFecha(bd.fechaFinalSoporte, "Fecha final soporte");
      if (err) errors.push(err);
    }
  }

  // VPN - SIN VALIDACIÓN (todo texto libre)
  return {
    valid: errors.length === 0,
    errors,
  };
}
