import { useState } from "react";
import { createAsset } from "../api/client";
import type { TipoActivo } from "../types";
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
};

const TIPO_LABEL: Record<string, string> = {
  SERVIDOR:   "Servidor",
  BASE_DATOS: "Base de Datos",
  RED:        "Red",
  UPS:        "UPS",
  VPN:        "VPN S2S",
};

const TIPO_ICON: Record<string, string> = {
  SERVIDOR:   "🖥️",
  BASE_DATOS: "🗄️",
  RED:        "🌐",
  UPS:        "⚡",
  VPN:        "🔒",
};

/* ─── Estilos base ─── */
const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "9px 12px",
  border: `1.5px solid ${C.border}`,
  borderRadius: 8,
  fontSize: 13,
  fontFamily: "Calibri, sans-serif",
  color: C.text,
  background: "#fff",
  outline: "none",
  transition: "border-color .18s",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: C.primary,
  marginBottom: 5,
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
          borderColor: focused ? C.primary : C.border,
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
    <div style={{ marginBottom: 20 }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        marginBottom: 12, paddingBottom: 8,
        borderBottom: `1.5px solid ${C.border}`,
      }}>
        {icon && <span style={{ fontSize: 14 }}>{icon}</span>}
        <span style={{
          fontSize: 10, fontWeight: 700, letterSpacing: "0.12em",
          textTransform: "uppercase", color: C.muted,
          fontFamily: "Calibri, sans-serif",
        }}>{title}</span>
      </div>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
        gap: "14px 16px",
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

function FormVpn({ data, onChange }: { data: any; onChange: (f: string, v: string) => void }) {
  return (
    <FormSection title="VPN S2S" icon="🔒">
      <Field label="Conexión" field="conexion" value={data.conexion ?? ""} onChange={onChange} placeholder="Ej: 190.60.242.196" />
      <Field label="Fases"    field="fases"    value={data.fases    ?? ""} onChange={onChange} placeholder="Ej: Phase 2" />
      <Field label="Origen"   field="origen"   value={data.origen   ?? ""} onChange={onChange} placeholder="Ej: 172.16.0.50 255.255.255.255" />
      <Field label="Destino"  field="destino"  value={data.destino  ?? ""} onChange={onChange} placeholder="Ej: 172.18.140.0 255.255.255.0" />
    </FormSection>
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

  if (!open) return null;

  const handleGeneral = (field: string, val: string) =>
    setGeneral(prev => ({ ...prev, [field]: val }));

  const handleDetalle = (field: string, val: string) =>
    setDetalle(prev => ({ ...prev, [field]: val }));

  /* ── Limpiar al cerrar ── */
  const handleClose = () => {
    setGeneral({ nombre: "", ubicacion: "", propietario: "", custodio: "", codigoServicio: "" });
    setDetalle({});
    setError(null);
    onClose();
  };

  /* ── Submit ── */
  const handleSubmit = async () => {
    if (!general.nombre.trim()) {
      setError("El nombre es obligatorio.");
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
        payload[tipoKey] = detalleConvertido;
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
  const mostrarCodigo   = tipo !== "UPS" && tipo !== "BASE_DATOS" && tipo !== "VPN";
  const mostrarUbicacion = tipo !== "BASE_DATOS" && tipo !== "VPN";

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
        borderRadius: 14,
        width: "100%",
        maxWidth: 680,
        maxHeight: "90vh",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 20px 60px rgba(0,0,0,.4)",
        animation: "fadeIn .2s ease",
        overflow: "hidden",
      }}>
        <style>{`
          @keyframes fadeIn { from { opacity:0; transform:scale(.97) } to { opacity:1; transform:scale(1) } }
          .create-scroll::-webkit-scrollbar { width: 5px }
          .create-scroll::-webkit-scrollbar-track { background: #fdf8f8 }
          .create-scroll::-webkit-scrollbar-thumb { background: #e0c8c8; border-radius: 4px }
        `}</style>

        {/* ── Header ── */}
        <div style={{
          background: C.grad,
          padding: "18px 24px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: "rgba(255,255,255,.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18,
            }}>
              {TIPO_ICON[tipo] ?? "📦"}
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>
                Nuevo {TIPO_LABEL[tipo] ?? "Activo"}
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,.7)", marginTop: 1 }}>
                Completa los campos y guarda
              </div>
            </div>
          </div>
          <button
            onClick={handleClose}
            style={{
              background: "rgba(255,255,255,.12)", border: "1.5px solid rgba(255,255,255,.25)",
              color: "#fff", borderRadius: 8, width: 32, height: 32,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", fontSize: 18, lineHeight: 1,
            }}
          >×</button>
        </div>

        {/* ── Body (scrollable) ── */}
        <div className="create-scroll" style={{ padding: "22px 24px", overflowY: "auto", flex: 1 }}>

          {/* Error */}
          {error && (
            <div style={{
              background: "#fff0f0", border: "1.5px solid #f5c6c6",
              borderRadius: 8, padding: "10px 14px", marginBottom: 16,
              fontSize: 13, color: "#c0392b", fontFamily: "Calibri, sans-serif",
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <span>⚠️</span><span>{error}</span>
            </div>
          )}

          {/* Información General */}
          <FormSection title="Información General" icon="🏷️">
            <Field
              label="Nombre" field="nombre"
              value={general.nombre} onChange={handleGeneral}
              required placeholder={`Ej: ${tipo === "VPN" ? "ALFAGL_BACKUP" : tipo === "SERVIDOR" ? "SRV-PROD-01" : "EQUIPO-001"}`}
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
            <Field
              label="Propietario" field="propietario"
              value={general.propietario} onChange={handleGeneral}
              placeholder="Ej: Gerencia TI"
            />
            <Field
              label="Custodio" field="custodio"
              value={general.custodio} onChange={handleGeneral}
              placeholder="Ej: Juan Pérez"
            />
          </FormSection>

          {/* Formulario específico por tipo */}
          {tipo === "SERVIDOR"   && <FormServidor   data={detalle} onChange={handleDetalle} />}
          {tipo === "RED"        && <FormRed         data={detalle} onChange={handleDetalle} />}
          {tipo === "UPS"        && <FormUps         data={detalle} onChange={handleDetalle} />}
          {tipo === "BASE_DATOS" && <FormBaseDatos   data={detalle} onChange={handleDetalle} />}
          {tipo === "VPN"        && <FormVpn         data={detalle} onChange={handleDetalle} />}
        </div>

        {/* ── Footer ── */}
        <div style={{
          padding: "14px 24px",
          borderTop: `1px solid ${C.border}`,
          background: C.surface,
          display: "flex", justifyContent: "flex-end", gap: 10,
          flexShrink: 0,
        }}>
          <button
            onClick={handleClose}
            style={{
              padding: "10px 22px", borderRadius: 8,
              border: `1.5px solid ${C.border}`,
              background: "#fff", color: C.muted,
              fontWeight: 600, fontSize: 13,
              cursor: "pointer", fontFamily: "Calibri, sans-serif",
              transition: "all .15s",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "#f5f0f0")}
            onMouseLeave={e => (e.currentTarget.style.background = "#fff")}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            style={{
              padding: "10px 24px", borderRadius: 8, border: "none",
              background: saving ? "#ccc" : C.grad,
              color: "#fff", fontWeight: 700, fontSize: 13,
              cursor: saving ? "not-allowed" : "pointer",
              fontFamily: "Calibri, sans-serif",
              boxShadow: saving ? "none" : "0 4px 12px rgba(183,49,44,.3)",
              transition: "all .15s",
              display: "flex", alignItems: "center", gap: 8,
            }}
          >
            {saving ? (
              <>
                <div style={{
                  width: 14, height: 14, border: "2px solid rgba(255,255,255,.3)",
                  borderTop: "2px solid #fff", borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                }} />
                Guardando...
              </>
            ) : (
              <>💾 Crear {TIPO_LABEL[tipo]}</>
            )}
          </button>
        </div>
      </div>

      <style>{`@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}`}</style>
    </div>
  );
}