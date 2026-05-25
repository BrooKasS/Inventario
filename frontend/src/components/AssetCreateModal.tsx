import { useState } from "react";
import { createAsset } from "../api/client";
import type { TipoActivo, VpnRule } from "../types";
/* ─── Design tokens — mismo sistema que el resto de la app ─── */
const C = {
  grad:    "linear-gradient(135deg, #FA8200 0%, #861F41 35%, #B7312C 70%, #D86018 100%)",
  primary: "#B7312C",
  accent:  "#FA8200",
  dark:    "#861F41",
  border:  "#F0E8E8",
  surface: "#FAFAFA",
  text:    "#1A1A1A",
  muted:   "#888",
  success: "#27AE60",
  error:   "#E74C3C",
  warning: "#F39C12",
  info:    "#3498DB",
};

const TIPO_LABEL: Record<string, string> = {
  SERVIDOR:   "Servidor",
  BASE_DATOS: "Base de Datos",
  RED:        "Red",
  UPS:        "UPS",
  VPN:        "VPN S2S",
  MOVIL:      "Móvil",
};

/**
 * Parsea errores de validación del backend
 * Entrada: "Validación fallida: Error1, Error2, Error3"
 * Salida: ["Error1", "Error2", "Error3"]
 * Si no es validación fallida, retorna el string como array de 1 elemento
 */
function parseValidationErrors(errorMsg: string | null): string[] {
  if (!errorMsg || typeof errorMsg !== "string") return [];
  
  const trimmed = errorMsg.trim();
  if (!trimmed) return [];
  
  if (trimmed.includes("Validación fallida:")) {
    const afterPrefix = trimmed.split("Validación fallida:")[1];
    if (afterPrefix) {
      return afterPrefix
        .split(",")
        .map((err) => err.trim())
        .filter((err) => err.length > 0);
    }
  }
  
  return [trimmed];
}

const TIPO_ICON: Record<string, string> = {
  SERVIDOR:   "🖥️",
  BASE_DATOS: "🗄️",
  RED:        "🌐",
  UPS:        "⚡",
  VPN:        "🔒",
  MOVIL:      "📱",
};

/* ─── Estilos base ─── */
const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "13px 15px",
  border: `1px solid #e5ddd8`,
  borderRadius: 8,
  fontSize: 13,
  fontFamily: "Calibri, sans-serif",
  color: C.text,
  background: "#fefcfa",
  outline: "none",
  transition: "all 0.2s ease",
  boxSizing: "border-box",
  boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "#4a4a4a",
  marginBottom: 7,
  fontFamily: "Calibri, sans-serif",
};

/* ─── Componente Field ─── */
function Field({
  label, field, value, onChange, type = "text", placeholder, required,
}: {
  label: string;
  field: string;
  value: string;
  onChange: (field: string, val: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <div>
      <label style={labelStyle}>
        {label}{required && <span style={{ color: C.accent, marginLeft: 3 }}>*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(field, e.target.value)}
        placeholder={placeholder ?? `Ej: ${label.toLowerCase()}...`}
        style={{
          ...inputStyle,
          borderColor: focused ? C.primary : "#e5ddd8",
          boxShadow: focused 
            ? `0 0 0 2px rgba(183, 49, 44, 0.08), 0 2px 6px rgba(0,0,0,0.06)`
            : "0 1px 2px rgba(0,0,0,0.03)",
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </div>
  );
}

/* ─── Sección con título ─── */
function FormSection({ title, icon, children }: {
  title: string; icon?: string; children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 26 }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        marginBottom: 14, paddingBottom: 10,
        borderBottom: `1px solid #f0e8e3`,
      }}>
        {icon && <span style={{ fontSize: 16 }}>{icon}</span>}
        <span style={{
          fontSize: 11, fontWeight: 800, letterSpacing: "0.12em",
          textTransform: "uppercase", color: "#5a4a45",
          fontFamily: "Calibri, sans-serif",
        }}>{title}</span>
      </div>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))",
        gap: "15px 16px",
      }}>
        {children}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   FORMULARIOS POR TIPO
═══════════════════════════════════════════════════════ */

function FormServidor({ data, onChange }: { data: any; onChange: (f: string, v: string) => void }) {
  return (
    <>
      <FormSection title="Red" icon="🌐">
        <Field label="IP Interna"    field="ipInterna"    value={data.ipInterna    ?? ""} onChange={onChange} placeholder="Ej: 192.168.1.10" />
        <Field label="IP Gestión"    field="ipGestion"    value={data.ipGestion    ?? ""} onChange={onChange} placeholder="Ej: 10.0.0.1" />
        <Field label="IP Servicio"   field="ipServicio"   value={data.ipServicio   ?? ""} onChange={onChange} placeholder="Ej: 172.16.0.5" />
      </FormSection>
      <FormSection title="Recursos" icon="⚙️">
        <Field label="vCPU"              field="vcpu"              value={data.vcpu              ?? ""} onChange={onChange} type="number" placeholder="Ej: 4" />
        <Field label="vRAM (MB)"         field="vramMb"            value={data.vramMb            ?? ""} onChange={onChange} type="number" placeholder="Ej: 8192" />
        <Field label="Sistema Operativo" field="sistemaOperativo"  value={data.sistemaOperativo  ?? ""} onChange={onChange} placeholder="Ej: Windows Server 2019" />
      </FormSection>
      <FormSection title="Operación" icon="🔧">
        <Field label="Ambiente"               field="ambiente"           value={data.ambiente           ?? ""} onChange={onChange} placeholder="Ej: Producción" />
        <Field label="Tipo de Servidor"       field="tipoServidor"       value={data.tipoServidor       ?? ""} onChange={onChange} placeholder="Ej: Virtual" />
        <Field label="Aplicación que soporta" field="appSoporta"         value={data.appSoporta         ?? ""} onChange={onChange} placeholder="Ej: Oracle EBS" />
        <Field label="Monitoreo"              field="monitoreo"          value={data.monitoreo          ?? ""} onChange={onChange} placeholder="Ej: Zabbix" />
        <Field label="Backup"                 field="backup"             value={data.backup             ?? ""} onChange={onChange} placeholder="Ej: Veeam" />
        <Field label="Rutas de Backup"        field="rutasBackup"        value={data.rutasBackup        ?? ""} onChange={onChange} placeholder="Ej: /backup/srv" />
        <Field label="Fecha Fin Soporte"      field="fechaFinSoporte"    value={data.fechaFinSoporte    ?? ""} onChange={onChange} type="date" />
        <Field label="Contrato que lo soporta" field="contratoQueSoporta" value={data.contratoQueSoporta ?? ""} onChange={onChange} placeholder="Ej: CTR-2024-001" />
      </FormSection>
    </>
  );
}

function FormRed({ data, onChange }: { data: any; onChange: (f: string, v: string) => void }) {
  return (
    <FormSection title="Equipo de Red" icon="🔌">
      <Field label="Serial"                  field="serial"             value={data.serial             ?? ""} onChange={onChange} />
      <Field label="MAC"                     field="mac"                value={data.mac                ?? ""} onChange={onChange} placeholder="Ej: AA:BB:CC:DD:EE:FF" />
      <Field label="Modelo"                  field="modelo"             value={data.modelo             ?? ""} onChange={onChange} placeholder="Ej: Cisco Catalyst 9200" />
      <Field label="IP Gestión"              field="ipGestion"          value={data.ipGestion          ?? ""} onChange={onChange} placeholder="Ej: 10.0.0.1" />
      <Field label="Estado"                  field="estado"             value={data.estado             ?? ""} onChange={onChange} placeholder="Ej: Activo" />
      <Field label="Fecha Fin Soporte"       field="fechaFinSoporte"    value={data.fechaFinSoporte    ?? ""} onChange={onChange} type="date" />
      <Field label="Contrato que lo soporta" field="contratoQueSoporta" value={data.contratoQueSoporta ?? ""} onChange={onChange} placeholder="Ej: CTR-2024-001" />
    </FormSection>
  );
}

function FormUps({ data, onChange }: { data: any; onChange: (f: string, v: string) => void }) {
  return (
    <FormSection title="UPS" icon="🔋">
      <Field label="Serial" field="serial" value={data.serial ?? ""} onChange={onChange} />
      <Field label="Placa"  field="placa"  value={data.placa  ?? ""} onChange={onChange} />
      <Field label="Modelo" field="modelo" value={data.modelo ?? ""} onChange={onChange} placeholder="Ej: APC Smart-UPS 1500" />
      <Field label="Estado" field="estado" value={data.estado ?? ""} onChange={onChange} placeholder="Ej: Activo" />
    </FormSection>
  );
}

function FormBaseDatos({ data, onChange }: { data: any; onChange: (f: string, v: string) => void }) {
  return (
    <FormSection title="Base de Datos" icon="🗄️">
      <Field label="Servidor 1"              field="servidor1"          value={data.servidor1          ?? ""} onChange={onChange} required />
      <Field label="Servidor 2"              field="servidor2"          value={data.servidor2          ?? ""} onChange={onChange} />
      <Field label="RAC/Scan"               field="racScan"            value={data.racScan            ?? ""} onChange={onChange} />
      <Field label="Ambiente"               field="ambiente"           value={data.ambiente           ?? ""} onChange={onChange} placeholder="Ej: Producción" />
      <Field label="Aplicación que soporta" field="appSoporta"         value={data.appSoporta         ?? ""} onChange={onChange} />
      <Field label="Versión BD"             field="versionBd"          value={data.versionBd          ?? ""} onChange={onChange} placeholder="Ej: Oracle 19c" />
      <Field label="Fecha Final Soporte"    field="fechaFinalSoporte"  value={data.fechaFinalSoporte  ?? ""} onChange={onChange} type="date" />
      <Field label="Contenedor Físico"      field="contenedorFisico"   value={data.contenedorFisico   ?? ""} onChange={onChange} />
      <Field label="Contrato que lo soporta" field="contratoQueSoporta" value={data.contratoQueSoporta ?? ""} onChange={onChange} placeholder= "Ej: CTR 2024-001 o pega un link" />
    </FormSection>
  );
}

function FormVpn({ 
  data, 
  onChange, 
  vpnRules, 
  currentRule, 
  onAddRule, 
  onRemoveRule, 
  onRuleFieldChange 
}: { 
  data: any; 
  onChange: (f: string, v: string) => void;
  vpnRules: Partial<VpnRule>[];
  currentRule: Partial<VpnRule>;
  onAddRule: () => void;
  onRemoveRule: (index: number) => void;
  onRuleFieldChange: (field: keyof VpnRule, value: string) => void;
}) {
  return (
    <>
      {/* ══════════════════════════════════════════════════════════════ */}
      {/* Sección: Datos Principales de VPN                            */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <FormSection title="VPN S2S - Datos Principales" icon="🔒">
        <Field label="Conexión" field="conexion" value={data.conexion ?? ""} onChange={onChange} placeholder="Ej: 190.60.242.196" required />
        <Field label="Fases"    field="fases"    value={data.fases    ?? ""} onChange={onChange} placeholder="Ej: Phase 2" />
        <Field label="Origen"   field="origen"   value={data.origen   ?? ""} onChange={onChange} placeholder="Ej: 172.16.0.50 255.255.255.255" />
        <Field label="Destino"  field="destino"  value={data.destino  ?? ""} onChange={onChange} placeholder="Ej: 172.18.140.0 255.255.255.0" />
      </FormSection>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* Sección: Reglas VPN (NUEVO)                                  */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <div style={{ marginBottom: 26 }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          marginBottom: 14, paddingBottom: 10,
          borderBottom: `1px solid #f0e8e3`,
        }}>
          <span style={{ fontSize: 16 }}>📋</span>
          <span style={{
            fontSize: 11, fontWeight: 800, letterSpacing: "0.12em",
            textTransform: "uppercase", color: "#5a4a45",
            fontFamily: "Calibri, sans-serif",
          }}>Reglas VPN</span>
          {vpnRules.length > 0 && (
            <span style={{
              marginLeft: "auto",
              fontSize: 10, fontWeight: 700, 
              background: "#B7312C", color: "#fff",
              padding: "3px 8px", borderRadius: 4,
              fontFamily: "Calibri, sans-serif",
            }}>
              {vpnRules.length} regla{vpnRules.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* ──────────────────────────────────────────────────────────────── */}
        {/* Lista de Reglas Agregadas                                       */}
        {/* ──────────────────────────────────────────────────────────────── */}
        {vpnRules.length > 0 && (
          <div style={{ marginBottom: 18 }}>
            <div style={{
              fontSize: 10, fontWeight: 700, color: "#5a4a45",
              marginBottom: 8, textTransform: "uppercase",
              letterSpacing: "0.08em",
              fontFamily: "Calibri, sans-serif",
            }}>
              Reglas Agregadas
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {vpnRules.map((rule, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    background: "#fefcfa",
                    padding: "14px 15px",
                    borderRadius: 8,
                    border: "1px solid #e5ddd8",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div style={{ flex: 1, fontSize: 12, color: "#1A1A1A" }}>
                    <div style={{ marginBottom: 6 }}>
                      <span style={{ fontWeight: 700, color: "#5a4a45" }}>Conexión:</span>{" "}
                      <span style={{ color: "#666" }}>{rule.conexion || "—"}</span>
                    </div>
                    <div style={{ marginBottom: 6 }}>
                      <span style={{ fontWeight: 700, color: "#5a4a45" }}>Fases:</span>{" "}
                      <span style={{ color: "#666" }}>{rule.fases || "—"}</span>
                    </div>
                    <div style={{ marginBottom: 6 }}>
                      <span style={{ fontWeight: 700, color: "#5a4a45" }}>Origen:</span>{" "}
                      <span style={{ color: "#666" }}>{rule.origen || "—"}</span>
                    </div>
                    <div>
                      <span style={{ fontWeight: 700, color: "#5a4a45" }}>Destino:</span>{" "}
                      <span style={{ color: "#666" }}>{rule.destino || "—"}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => onRemoveRule(idx)}
                    style={{
                      marginLeft: 12,
                      flexShrink: 0,
                      padding: "8px 12px",
                      background: "#ffebeb",
                      border: "1px solid #f08080",
                      color: "#c0392b",
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                      fontFamily: "Calibri, sans-serif",
                      textTransform: "uppercase",
                      letterSpacing: "0.02em",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#ff9999";
                      e.currentTarget.style.color = "#fff";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "#ffebeb";
                      e.currentTarget.style.color = "#c0392b";
                    }}
                  >
                    Eliminar
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ──────────────────────────────────────────────────────────────── */}
        {/* Formulario para Nueva Regla                                      */}
        {/* ──────────────────────────────────────────────────────────────── */}
        <div style={{
          background: "#fefcfa",
          border: "1px solid #e5ddd8",
          borderRadius: 8,
          padding: "16px 15px",
          boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
        }}>
          <div style={{
            fontSize: 10, fontWeight: 700, color: "#5a4a45",
            marginBottom: 12, textTransform: "uppercase",
            letterSpacing: "0.08em",
            fontFamily: "Calibri, sans-serif",
          }}>
            📝 Nueva Regla
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))",
            gap: "12px 14px",
            marginBottom: 12,
          }}>
            <div>
              <label style={labelStyle}>Conexión</label>
              <input
                type="text"
                placeholder="Ej: IPSec, BGP..."
                value={currentRule.conexion ?? ""}
                onChange={(e) => onRuleFieldChange("conexion", e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Fases</label>
              <input
                type="text"
                placeholder="Ej: IKEv2 P1 y P2..."
                value={currentRule.fases ?? ""}
                onChange={(e) => onRuleFieldChange("fases", e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Origen</label>
              <input
                type="text"
                placeholder="Ej: AS 65001..."
                value={currentRule.origen ?? ""}
                onChange={(e) => onRuleFieldChange("origen", e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Destino</label>
              <input
                type="text"
                placeholder="Ej: AS 65002..."
                value={currentRule.destino ?? ""}
                onChange={(e) => onRuleFieldChange("destino", e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>

          <button
            onClick={onAddRule}
            style={{
              width: "100%",
              padding: "11px 15px",
              background: C.grad,
              border: "none",
              color: "#fff",
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 800,
              cursor: "pointer",
              transition: "all 0.15s ease",
              letterSpacing: "0.02em",
              textTransform: "uppercase",
              boxShadow: "0 4px 12px rgba(183, 49, 44, 0.2)",
              fontFamily: "Calibri, sans-serif",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = "0 6px 16px rgba(183, 49, 44, 0.3)";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(183, 49, 44, 0.2)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            + Agregar Regla
          </button>
        </div>
      </div>
    </>
  );
}

function FormMovil({ data, onChange }: { data: any; onChange: (f: string, v: string) => void }) {
  return (
    <>
      <FormSection title="Datos del Usuario" icon="👤">
        <Field label="# Caso"               field="numeroCaso"         value={data.numeroCaso         ?? ""} onChange={onChange} placeholder="Ej: 12345" />
        <Field label="Región/Departamento"  field="region"             value={data.region             ?? ""} onChange={onChange} placeholder="Ej: Cundinamarca" />
        <Field label="Dependencia/Área"     field="dependencia"        value={data.dependencia        ?? ""} onChange={onChange} placeholder="Ej: Gerencia TI" />
        <Field label="Sede"                 field="sede"               value={data.sede               ?? ""} onChange={onChange} placeholder="Ej: Bogotá" />
        <Field label="C.C."                 field="cedula"             value={data.cedula             ?? ""} onChange={onChange} placeholder="Ej: 1000123456" />
        <Field label="Usuario de Red"       field="usuarioRed"         value={data.usuarioRed         ?? ""} onChange={onChange} placeholder="Ej: jperez" />
        <Field label="Correo Responsable"   field="correoResponsable"  value={data.correoResponsable  ?? ""} onChange={onChange} placeholder="Ej: jperez@empresa.com" type="email" />
      </FormSection>
      <FormSection title="Datos del Equipo" icon="📱">
        <Field label="UNI"            field="uni"         value={data.uni         ?? ""} onChange={onChange} placeholder="Ej: UNI-001" />
        <Field label="Marca"          field="marca"       value={data.marca       ?? ""} onChange={onChange} placeholder="Ej: Samsung" />
        <Field label="Modelo"         field="modelo"      value={data.modelo      ?? ""} onChange={onChange} placeholder="Ej: Galaxy A54" />
        <Field label="Serial"         field="serial"      value={data.serial      ?? ""} onChange={onChange} placeholder="Ej: R58N123ABC" />
        <Field label="IMEI 1"         field="imei1"       value={data.imei1       ?? ""} onChange={onChange} placeholder="Ej: 357123456789012" />
        <Field label="IMEI 2"         field="imei2"       value={data.imei2       ?? ""} onChange={onChange} placeholder="Ej: 357123456789013" />
        <Field label="SIM"            field="sim"         value={data.sim         ?? ""} onChange={onChange} placeholder="Ej: 8957010001234567890" />
        <Field label="Número de Línea" field="numeroLinea" value={data.numeroLinea ?? ""} onChange={onChange} placeholder="Ej: 3001234567" />
        <Field label="Fecha de Entrega" field="fechaEntrega" value={data.fechaEntrega ?? ""} onChange={onChange} type="date" />
      </FormSection>
      <FormSection title="Observaciones de Entrega" icon="📝">
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={labelStyle}>Observaciones</label>
          <textarea
            value={data.observacionesEntrega ?? ""}
            onChange={e => onChange("observacionesEntrega", e.target.value)}
            placeholder="Observaciones al momento de la entrega..."
            rows={3}
            style={{
              ...inputStyle,
              resize: "vertical",
              minHeight: 72,
            }}
          />
        </div>
      </FormSection>
    </>
  );
}

/* ═══════════════════════════════════════════════════════
   MODAL PRINCIPAL
═══════════════════════════════════════════════════════ */
interface AssetCreateModalProps {
  open: boolean;
  onClose: () => void;
  tipo: TipoActivo;
  onCreated: () => void;
}

export default function AssetCreateModal({
  open, onClose, tipo, onCreated,
}: AssetCreateModalProps) {
  /* ── Estado del formulario ── */
  const [general, setGeneral] = useState({
    nombre: "", ubicacion: "", propietario: "", custodio: "", codigoServicio: "",
  });
  const [detalle, setDetalle] = useState<Record<string, string>>({});
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  // ══════════════════════════════════════════════════════════════
  // NUEVO: Estado para Reglas VPN (SOLO se usa cuando tipo === "VPN")
  // ══════════════════════════════════════════════════════════════
  const [vpnRules, setVpnRules] = useState<Partial<VpnRule>[]>([]);
  const [currentRule, setCurrentRule] = useState<Partial<VpnRule>>({
    conexion: "",
    fases: "",
    origen: "",
    destino: "",
  });

  if (!open) return null;

  const handleGeneral = (field: string, val: string) => {
    setGeneral(prev => ({ ...prev, [field]: val }));
    setError(null);
  };

  const handleDetalle = (field: string, val: string) => {
    setDetalle(prev => ({ ...prev, [field]: val }));
    setError(null);
  };

  // ══════════════════════════════════════════════════════════════
  // NUEVO: Funciones para Reglas VPN
  // ══════════════════════════════════════════════════════════════
  const handleAddRule = () => {
    // No agregar si todos los campos están vacíos
    if (!currentRule.conexion && !currentRule.fases && 
        !currentRule.origen && !currentRule.destino) {
      return;
    }
    
    // Agregar regla a la lista
    setVpnRules([...vpnRules, { ...currentRule }]);
    
    // Limpiar formulario
    setCurrentRule({
      conexion: "",
      fases: "",
      origen: "",
      destino: "",
    });
    
    setError(null);
  };

  const handleRemoveRule = (index: number) => {
    setVpnRules(vpnRules.filter((_, i) => i !== index));
    setError(null);
  };

  const handleRuleFieldChange = (field: keyof VpnRule, value: string) => {
    setCurrentRule({
      ...currentRule,
      [field]: value || null,
    });
    setError(null);
  };

  /* ── Limpiar al cerrar ── */
  const handleClose = () => {
    setGeneral({ nombre: "", ubicacion: "", propietario: "", custodio: "", codigoServicio: "" });
    setDetalle({});
    setVpnRules([]); // NUEVO: Limpiar reglas
    setCurrentRule({ conexion: "", fases: "", origen: "", destino: "" }); // NUEVO: Limpiar formulario actual
    setError(null);
    onClose();
  };

  /* ── Submit ── */
  const handleSubmit = async () => {
    if (!general.nombre.trim()) {
      setError("El nombre es obligatorio.");
      return;
    }

    // ✅ Validación específica para VPN: Conexión es obligatoria
    if (tipo === "VPN" && !detalle.conexion?.trim()) {
      setError("Para VPN, la Conexión (IP) es obligatoria.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      // Convertir números donde corresponde
      const detalleConvertido: Record<string, any> = { ...detalle };
      if (tipo === "SERVIDOR") {
        if (detalleConvertido.vcpu)   detalleConvertido.vcpu   = parseInt(detalleConvertido.vcpu)   || null;
        if (detalleConvertido.vramMb) detalleConvertido.vramMb = parseInt(detalleConvertido.vramMb) || null;
      }

      // Limpiar campos vacíos del detalle
      Object.keys(detalleConvertido).forEach(k => {
        if (detalleConvertido[k] === "" || detalleConvertido[k] === null) {
          detalleConvertido[k] = null;
        }
      });

      const tipoKey = tipo === "SERVIDOR"   ? "servidor"
                    : tipo === "RED"        ? "red"
                    : tipo === "UPS"        ? "ups"
                    : tipo === "BASE_DATOS" ? "baseDatos"
                    : tipo === "VPN"        ? "vpn"
                    : tipo === "MOVIL"      ? "movil"
                    : null;

      const payload: any = {
        tipo,
        nombre:         general.nombre.trim()         || null,
        ubicacion:      general.ubicacion.trim()      || null,
        propietario:    general.propietario.trim()    || null,
        custodio:       general.custodio.trim()       || null,
        codigoServicio: general.codigoServicio.trim() || null,
      };
if (tipoKey && Object.keys(detalleConvertido).length > 0) {
  if (tipo === "MOVIL") {
    // El backend espera los campos móvil en el root, no en payload.movil
    Object.assign(payload, detalleConvertido);
  } else if (tipo === "VPN") {
    // NUEVO: Para VPN, agregar las reglas al payload
    payload[tipoKey] = {
      ...detalleConvertido,
      reglas: vpnRules.map(rule => ({
        conexion: rule.conexion ?? null,
        fases: rule.fases ?? null,
        origen: rule.origen ?? null,
        destino: rule.destino ?? null,
      }))
    };
  } else {
    payload[tipoKey] = detalleConvertido;
  }
}

      await createAsset(payload);
      onCreated();
      handleClose();
    } catch (e: any) {
      setError(e?.response?.data?.error ?? "Error al crear el activo. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  /* ── Render ── */
  const mostrarCodigo    = tipo !== "UPS" && tipo !== "BASE_DATOS" && tipo !== "VPN" && tipo !== "MOVIL";
  const mostrarUbicacion = tipo !== "BASE_DATOS" && tipo !== "VPN" && tipo !== "MOVIL";
  const mostrarPropietario = tipo !== "MOVIL";
  const mostrarCustodio    = tipo !== "MOVIL";

  return (
    <div
      onClick={e => e.target === e.currentTarget && handleClose()}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,.6)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1000, padding: 16,
      }}
    >
      <div style={{
        background: "#fff",
        borderRadius: 12,
        width: "100%",
        maxWidth: 680,
        maxHeight: "90vh",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 20px 60px rgba(0,0,0,.12), 0 0 1px rgba(0,0,0,.16)",
        overflow: "hidden",
        animation: "modalIn .25s ease-out",
      }}>
        <style>{`
          @keyframes modalIn {
            from {
              opacity: 0;
              transform: scale(0.98) translateY(10px);
            }
            to {
              opacity: 1;
              transform: scale(1) translateY(0);
            }
          }
          .create-scroll::-webkit-scrollbar { width: 6px; }
          .create-scroll::-webkit-scrollbar-track { background: #f8f6f3; }
          .create-scroll::-webkit-scrollbar-thumb { 
            background: #ddd; 
            border-radius: 3px;
          }
          .create-scroll::-webkit-scrollbar-thumb:hover { 
            background: #bbb;
          }
        `}</style>

        {/* ── Header ── */}
        <div style={{
          background: C.grad,
          padding: "24px 28px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexShrink: 0,
          boxShadow: "0 2px 8px rgba(0,0,0,.08)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 10,
              background: "rgba(255,255,255,.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22,
            }}>
              {TIPO_ICON[tipo] ?? "📦"}
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>
                Nuevo {TIPO_LABEL[tipo] ?? "Activo"}
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,.7)", marginTop: 2 }}>
                Completa los campos requeridos
              </div>
            </div>
          </div>
          <button
            onClick={handleClose}
            style={{
              background: "rgba(255,255,255,.15)", 
              border: "none",
              color: "#fff", 
              borderRadius: 8, 
              width: 36, height: 36,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", 
              fontSize: 20, 
              lineHeight: 1,
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,.25)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,.15)";
            }}
          >×</button>
        </div>

        {/* ── Body (scrollable) ── */}
        <div className="create-scroll" style={{ padding: "22px 24px", overflowY: "auto", flex: 1 }}>

          {/* Error */}
          {error && (
            <div style={{
              background: "linear-gradient(135deg, #fff5f5 0%, #ffebeb 100%)", 
              border: "1.5px solid #f08080",
              borderRadius: 10, 
              padding: "14px 16px", 
              marginBottom: 18,
              fontSize: 13, 
              color: "#c0392b", 
              fontFamily: "Calibri, sans-serif",
              boxShadow: "0 2px 8px rgba(192, 57, 43, 0.1)",
            }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <span style={{ marginTop: 2, flexShrink: 0, fontSize: 16 }}>⚠️</span>
                <div style={{ flex: 1 }}>
                  {parseValidationErrors(error).length > 1 ? (
                    <>
                      <div style={{ fontWeight: 700, marginBottom: 8, color: "#c0392b" }}>Validación fallida:</div>
                      <ul style={{ margin: 0, paddingLeft: 20 }}>
                        {parseValidationErrors(error).map((err, idx) => (
                          <li key={idx} style={{ marginBottom: idx < parseValidationErrors(error).length - 1 ? 5 : 0, color: "#a93226" }}>
                            {err}
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : (
                    <span>{error}</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Información General */}
          <FormSection title="Información General" icon="🏷️">
            <Field
              label="Nombre" field="nombre"
              value={general.nombre} onChange={handleGeneral}
              required
              placeholder={
                tipo === "VPN"   ? "Ej: ALFAGL_BACKUP"  :
                tipo === "MOVIL" ? "Ej: Movil 001"      :
                tipo === "SERVIDOR" ? "Ej: SRV-PROD-01"  :
                "Ej: EQUIPO-001"
              }
            />
            {mostrarCodigo && (
              <Field
                label="Código de Servicio" field="codigoServicio"
                value={general.codigoServicio} onChange={handleGeneral}
                placeholder="Ej: FLP0520"
              />
            )}
            {mostrarUbicacion && (
              <Field
                label="Ubicación" field="ubicacion"
                value={general.ubicacion} onChange={handleGeneral}
                placeholder="Ej: Virtual/Triara"
              />
            )}
            {mostrarPropietario && (
              <Field
                label="Propietario" field="propietario"
                value={general.propietario} onChange={handleGeneral}
                placeholder="Ej: Gerencia TI"
              />
            )}
            {mostrarCustodio && (
              <Field
                label="Custodio" field="custodio"
                value={general.custodio} onChange={handleGeneral}
                placeholder="Ej: Juan Pérez"
              />
            )}
          </FormSection>

          {/* Formulario específico por tipo */}
          {tipo === "SERVIDOR"   && <FormServidor  data={detalle} onChange={handleDetalle} />}
          {tipo === "RED"        && <FormRed        data={detalle} onChange={handleDetalle} />}
          {tipo === "UPS"        && <FormUps        data={detalle} onChange={handleDetalle} />}
          {tipo === "BASE_DATOS" && <FormBaseDatos  data={detalle} onChange={handleDetalle} />}
          {tipo === "VPN"        && <FormVpn        data={detalle} onChange={handleDetalle} vpnRules={vpnRules} currentRule={currentRule} onAddRule={handleAddRule} onRemoveRule={handleRemoveRule} onRuleFieldChange={handleRuleFieldChange} />}
          {tipo === "MOVIL"      && <FormMovil      data={detalle} onChange={handleDetalle} />}
        </div>

        {/* ── Footer ── */}
        <div style={{
          display: "flex", gap: 12, padding: "20px 28px",
          background: "#fafaf9",
          borderTop: "1px solid #e5ddd8",
          flexShrink: 0,
        }}>
          <button
            onClick={handleClose}
            style={{
              flex: 1, padding: "12px 16px", borderRadius: 8, border: "1px solid #e5ddd8",
              background: "#fff", color: "#2C2C2C", fontSize: 13, fontWeight: 700,
              cursor: "pointer", transition: "all 0.15s ease",
              letterSpacing: "0.02em",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#f5f3f1";
              e.currentTarget.style.borderColor = "#d5cdc8";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#fff";
              e.currentTarget.style.borderColor = "#e5ddd8";
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={!general.nombre}
            style={{
              flex: 1, padding: "12px 16px", borderRadius: 8, border: "none",
              background: !general.nombre ? "#ddd" : C.grad,
              color: "#fff", fontSize: 13, fontWeight: 800,
              cursor: !general.nombre ? "not-allowed" : "pointer",
              transition: "all 0.15s ease",
              letterSpacing: "0.02em",
              boxShadow: !general.nombre 
                ? "none"
                : "0 4px 12px rgba(183, 49, 44, 0.25)",
            }}
            onMouseEnter={(e) => {
              if (!general.nombre) return;
              e.currentTarget.style.boxShadow = "0 6px 18px rgba(183, 49, 44, 0.35)";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              if (!general.nombre) return;
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(183, 49, 44, 0.25)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            {saving ? "Guardando..." : "Crear Activo"}
          </button>
        </div>
      </div>

      <style>{`@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}`}</style>
    </div>
  );
}