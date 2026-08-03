// frontend/src/components/AssetCreateModal.forms.tsx
import { useState, useRef} from "react";
import { useEffect } from "react";
import type { VpnRule } from "../types";
import { C, Field, SelectField, AutocompleteField, SelectWithOtherField, inputStyle, labelStyle } from "./AssetCreateModal.fields";

/* ─── FIELD_MODE ─── */
const FIELD_MODE: Record<string, Record<string, "field" | "select" | "autocomplete" | "select-other">> = {
  SERVIDOR: {
    ambiente:           "select",
    tipoServidor:       "select",
    sistemaOperativo:   "autocomplete",
    contratoQueSoporta: "autocomplete",
    appSoporta:         "field",
    monitoreo:          "select",
    backup:             "select",
    vramMb:             "autocomplete",
    vcpu:               "autocomplete",
    rutasBackup:        "autocomplete",
  },
  RED: {
    estado:             "select",
    modelo:             "autocomplete",
    contratoQueSoporta: "autocomplete",
    ipGestion:          "autocomplete",
  },
  UPS: {
    estado:             "select",
    modelo:             "autocomplete",
  },
  BASE_DATOS: {
    ambiente:           "autocomplete",
    contratoQueSoporta: "autocomplete",
    appSoporta:         "field",
    contenedorFisico:   "field",
  },
  MOVIL: {
    marca:              "select-other",
    region:             "select",
    modelo:             "select-other",
    dependencia:        "field",
    sede:               "autocomplete",
  },
  ASSET: {
    ubicacion:          "autocomplete",
    propietario:        "autocomplete",
    custodio:           "field",
  },
};

/* ─── SELECT_OPTIONS ─── */
const SELECT_OPTIONS: Record<string, Record<string, string[]>> = {
  SERVIDOR: {
    ambiente:     ["DRP", "PRODUCCIÓN", "PRUEBAS", "VALIDAR"],
    tipoServidor: ["FÍSICO", "VIRTUAL", "NUBE"],
    monitoreo:    ["SI", "NO"],
    backup:       ["SI", "NO"],
  },
  RED: {
    estado: ["ACTIVO", "DESACTIVADO"],
  },
  UPS: {
    estado: ["ACTIVO", "INACTIVO", "DESCONECTADO"],
  },
  BASE_DATOS: {
    ambiente: ["PRODUCCIÓN", "PRUEBAS"],
  },
  MOVIL: {
    marca:  ["Samsung", "Motorola", "Xiaomi", "Huawei", "Apple"],
    region: [
      "Bogotá", "Bucaramanga", "Cúcuta", "Villavicencio", "Ibagué",
      "Barranquilla", "Santa Marta", "Sincelejo", "Cartagena",
      "Montería", "Medellín", "Cali", "Pereira",
    ],
    modelo: ["Galaxy S26", "Galaxy S26 Ultra", "Galaxy A56"],
  },
};

/* ─── SmartField ─── */
function SmartField({
  tipo, field, label, value, onChange, placeholder, required, type, extraOptions,
}: {
  tipo: string;
  field: string;
  label: string;
  value: string;
  onChange: (f: string, v: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
  extraOptions?: string[];
}) {
  const mode = FIELD_MODE[tipo]?.[field] ?? "field";

  if (mode === "select-other") {
    const baseOptions = SELECT_OPTIONS[tipo]?.[field] ?? [];
    const options = Array.from(new Set([...baseOptions, ...(extraOptions ?? [])]));
    return (
      <SelectWithOtherField
        label={label}
        field={field}
        value={value}
        onChange={onChange}
        options={options}
        required={required}
      />
    );
  }

  if (mode === "select") {
    const options = SELECT_OPTIONS[tipo]?.[field] ?? [];
    return (
      <SelectField
        label={label}
        field={field}
        value={value}
        onChange={onChange}
        options={options}
        required={required}
      />
    );
  }

  if (mode === "autocomplete") {
    return (
      <AutocompleteField
        label={label}
        field={field}
        value={value}
        onChange={onChange}
        tipo={tipo as "SERVIDOR" | "RED" | "UPS" | "BASE_DATOS" | "MOVIL"}
        required={required}
        placeholder={placeholder}
      />
    );
  }

  return (
    <Field
      label={label}
      field={field}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      type={type}
    />
  );
}

/* ═══════════════════════════════════════════════════════
   FormSection
═══════════════════════════════════════════════════════ */
export function FormSection({ title, icon, children }: {
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
   FormServidor
═══════════════════════════════════════════════════════ */
export function FormServidor({ data, onChange }: { data: any; onChange: (f: string, v: string) => void }) {
  return (
    <>
      <FormSection title="Red" icon="🌐">
        <Field label="IP Interna"  field="ipInterna"  value={data.ipInterna  ?? ""} onChange={onChange} placeholder="Ej: 192.168.1.10" />
        <Field label="IP Gestión"  field="ipGestion"  value={data.ipGestion  ?? ""} onChange={onChange} placeholder="Ej: 10.0.0.1" />
        <Field label="IP Servicio" field="ipServicio" value={data.ipServicio ?? ""} onChange={onChange} placeholder="Ej: 172.16.0.5" />
      </FormSection>
      <FormSection title="Recursos" icon="⚙️">
        <SmartField tipo="SERVIDOR" field="vcpu"             label="vCPU"             value={data.vcpu             ?? ""} onChange={onChange} type="number" placeholder="Ej: 4" />
        <SmartField tipo="SERVIDOR" field="vramMb"           label="vRAM (MB)"        value={data.vramMb           ?? ""} onChange={onChange} type="number" placeholder="Ej: 8192" />
        <SmartField tipo="SERVIDOR" field="sistemaOperativo" label="Sistema Operativo" value={data.sistemaOperativo ?? ""} onChange={onChange} placeholder="Ej: Windows Server 2019" />
      </FormSection>
      <FormSection title="Operación" icon="🔧">
        <SmartField tipo="SERVIDOR" field="ambiente"           label="Ambiente"               value={data.ambiente           ?? ""} onChange={onChange} />
        <SmartField tipo="SERVIDOR" field="tipoServidor"       label="Tipo de Servidor"       value={data.tipoServidor       ?? ""} onChange={onChange} />
        <SmartField tipo="SERVIDOR" field="appSoporta"         label="Aplicación que soporta" value={data.appSoporta         ?? ""} onChange={onChange} />
        <SmartField tipo="SERVIDOR" field="monitoreo"          label="Monitoreo"              value={data.monitoreo          ?? ""} onChange={onChange} />
        <SmartField tipo="SERVIDOR" field="backup"             label="Backup"                 value={data.backup             ?? ""} onChange={onChange} />
        <SmartField tipo="SERVIDOR" field="rutasBackup"        label="Rutas de Backup"        value={data.rutasBackup        ?? ""} onChange={onChange} />
        <Field                      field="fechaFinSoporte"    label="Fecha Fin Soporte"      value={data.fechaFinSoporte    ?? ""} onChange={onChange} type="date" />
        <SmartField tipo="SERVIDOR" field="contratoQueSoporta" label="Contrato que lo soporta" value={data.contratoQueSoporta ?? ""} onChange={onChange} />
      </FormSection>
    </>
  );
}

/* ═══════════════════════════════════════════════════════
   FormRed
═══════════════════════════════════════════════════════ */
export function FormRed({ data, onChange }: { data: any; onChange: (f: string, v: string) => void }) {
  return (
    <FormSection title="Equipo de Red" icon="🔌">
      <Field      field="serial"             label="Serial"                  value={data.serial             ?? ""} onChange={onChange} />
      <Field      field="mac"                label="MAC"                     value={data.mac                ?? ""} onChange={onChange} placeholder="Ej: AA:BB:CC:DD:EE:FF" />
      <SmartField tipo="RED" field="modelo"             label="Modelo"                  value={data.modelo             ?? ""} onChange={onChange} placeholder="Ej: Cisco Catalyst 9200" />
      <SmartField tipo="RED" field="ipGestion"          label="IP Gestión"              value={data.ipGestion          ?? ""} onChange={onChange} placeholder="Ej: 10.0.0.1" />
      <SmartField tipo="RED" field="estado"             label="Estado"                  value={data.estado             ?? ""} onChange={onChange} />
      <Field      field="fechaFinSoporte"    label="Fecha Fin Soporte"       value={data.fechaFinSoporte    ?? ""} onChange={onChange} type="date" />
      <SmartField tipo="RED" field="contratoQueSoporta" label="Contrato que lo soporta" value={data.contratoQueSoporta ?? ""} onChange={onChange} />
    </FormSection>
  );
}

/* ═══════════════════════════════════════════════════════
   FormUps
═══════════════════════════════════════════════════════ */
export function FormUps({ data, onChange }: { data: any; onChange: (f: string, v: string) => void }) {
  return (
    <FormSection title="UPS" icon="🔋">
      <Field      field="serial" label="Serial" value={data.serial ?? ""} onChange={onChange} />
      <Field      field="placa"  label="Placa"  value={data.placa  ?? ""} onChange={onChange} />
      <SmartField tipo="UPS" field="modelo" label="Modelo" value={data.modelo ?? ""} onChange={onChange} placeholder="Ej: APC Smart-UPS 1500" />
      <SmartField tipo="UPS" field="estado" label="Estado" value={data.estado ?? ""} onChange={onChange} />
    </FormSection>
  );
}

/* ═══════════════════════════════════════════════════════
   FormBaseDatos
═══════════════════════════════════════════════════════ */
export function FormBaseDatos({ data, onChange }: { data: any; onChange: (f: string, v: string) => void }) {
  return (
    <FormSection title="Base de Datos" icon="🗄️">
      <Field      field="servidor1"          label="Servidor 1"              value={data.servidor1          ?? ""} onChange={onChange} required />
      <Field      field="servidor2"          label="Servidor 2"              value={data.servidor2          ?? ""} onChange={onChange} />
      <Field      field="racScan"            label="RAC/Scan"                value={data.racScan            ?? ""} onChange={onChange} />
      <SmartField tipo="BASE_DATOS" field="ambiente"           label="Ambiente"                value={data.ambiente           ?? ""} onChange={onChange} />
      <SmartField tipo="BASE_DATOS" field="appSoporta"         label="Aplicación que soporta" value={data.appSoporta         ?? ""} onChange={onChange} />
      <Field      field="versionBd"          label="Versión BD"              value={data.versionBd          ?? ""} onChange={onChange} placeholder="Ej: Oracle 19c" />
      <Field      field="fechaFinalSoporte"  label="Fecha Final Soporte"     value={data.fechaFinalSoporte  ?? ""} onChange={onChange} type="date" />
      <SmartField tipo="BASE_DATOS" field="contenedorFisico"  label="Contenedor Físico"       value={data.contenedorFisico   ?? ""} onChange={onChange} />
      <SmartField tipo="BASE_DATOS" field="contratoQueSoporta" label="Contrato que lo soporta" value={data.contratoQueSoporta ?? ""} onChange={onChange} />
    </FormSection>
  );
}

/* ═══════════════════════════════════════════════════════
   FormVpn
═══════════════════════════════════════════════════════ */
export function FormVpn({
  data, onChange, vpnRules, currentRule, onAddRule, onRemoveRule, onRuleFieldChange,
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
      <FormSection title="VPN S2S - Datos Principales" icon="🔒">
        <Field label="Conexión" field="conexion" value={data.conexion ?? ""} onChange={onChange} placeholder="Ej: 190.60.242.196" required />
        <Field label="Fases"    field="fases"    value={data.fases    ?? ""} onChange={onChange} placeholder="Ej: Phase 2" />
        <Field label="Origen"   field="origen"   value={data.origen   ?? ""} onChange={onChange} placeholder="Ej: 172.16.0.50 255.255.255.255" />
        <Field label="Destino"  field="destino"  value={data.destino  ?? ""} onChange={onChange} placeholder="Ej: 172.18.140.0 255.255.255.0" />
      </FormSection>

      {/* ── Reglas VPN ── */}
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
              marginLeft: "auto", fontSize: 10, fontWeight: 700,
              background: "#B7312C", color: "#fff",
              padding: "3px 8px", borderRadius: 4,
              fontFamily: "Calibri, sans-serif",
            }}>
              {vpnRules.length} regla{vpnRules.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Lista de reglas agregadas */}
        {vpnRules.length > 0 && (
          <div style={{ marginBottom: 18 }}>
            <div style={{
              fontSize: 10, fontWeight: 700, color: "#5a4a45",
              marginBottom: 8, textTransform: "uppercase",
              letterSpacing: "0.08em", fontFamily: "Calibri, sans-serif",
            }}>
              Reglas Agregadas
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {vpnRules.map((rule, idx) => (
                <div key={idx} style={{
                  display: "flex", alignItems: "flex-start", justifyContent: "space-between",
                  background: "#fefcfa", padding: "14px 15px", borderRadius: 8,
                  border: "1px solid #e5ddd8", boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
                }}>
                  <div style={{ flex: 1, fontSize: 12, color: "#1A1A1A" }}>
                    <div style={{ marginBottom: 6 }}><span style={{ fontWeight: 700, color: "#5a4a45" }}>Conexión:</span> <span style={{ color: "#666" }}>{rule.conexion || "—"}</span></div>
                    <div style={{ marginBottom: 6 }}><span style={{ fontWeight: 700, color: "#5a4a45" }}>Fases:</span> <span style={{ color: "#666" }}>{rule.fases || "—"}</span></div>
                    <div style={{ marginBottom: 6 }}><span style={{ fontWeight: 700, color: "#5a4a45" }}>Origen:</span> <span style={{ color: "#666" }}>{rule.origen || "—"}</span></div>
                    <div><span style={{ fontWeight: 700, color: "#5a4a45" }}>Destino:</span> <span style={{ color: "#666" }}>{rule.destino || "—"}</span></div>
                  </div>
                  <button
                    onClick={() => onRemoveRule(idx)}
                    style={{
                      marginLeft: 12, padding: "8px 12px", background: "#ffebeb",
                      border: "1px solid #f08080", color: "#c0392b",
                      borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer",
                      fontFamily: "Calibri, sans-serif", textTransform: "uppercase",
                      whiteSpace: "nowrap",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = "#ff9999"; e.currentTarget.style.color = "#fff"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "#ffebeb"; e.currentTarget.style.color = "#c0392b"; }}
                  >
                    Eliminar
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Formulario nueva regla */}
        <div style={{
          background: "#fefcfa", border: "1px solid #e5ddd8",
          borderRadius: 8, padding: "16px 15px",
        }}>
          <div style={{
            fontSize: 10, fontWeight: 700, color: "#5a4a45",
            marginBottom: 12, textTransform: "uppercase",
            letterSpacing: "0.08em", fontFamily: "Calibri, sans-serif",
          }}>
            📝 Nueva Regla
          </div>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))",
            gap: "12px 14px", marginBottom: 12,
          }}>
            <div><label style={labelStyle}>Conexión</label><input type="text" placeholder="Ej: IPSec, BGP..." value={currentRule.conexion ?? ""} onChange={e => onRuleFieldChange("conexion", e.target.value)} style={inputStyle} /></div>
            <div><label style={labelStyle}>Fases</label><input type="text" placeholder="Ej: IKEv2 P1 y P2..." value={currentRule.fases ?? ""} onChange={e => onRuleFieldChange("fases", e.target.value)} style={inputStyle} /></div>
            <div><label style={labelStyle}>Origen</label><input type="text" placeholder="Ej: AS 65001..." value={currentRule.origen ?? ""} onChange={e => onRuleFieldChange("origen", e.target.value)} style={inputStyle} /></div>
            <div><label style={labelStyle}>Destino</label><input type="text" placeholder="Ej: AS 65002..." value={currentRule.destino ?? ""} onChange={e => onRuleFieldChange("destino", e.target.value)} style={inputStyle} /></div>
          </div>
          <button
            onClick={onAddRule}
            style={{
              width: "100%", padding: "11px 15px", background: C.grad,
              border: "none", color: "#fff", borderRadius: 6,
              fontSize: 12, fontWeight: 800, cursor: "pointer",
              textTransform: "uppercase", letterSpacing: "0.02em",
              boxShadow: "0 4px 12px rgba(183, 49, 44, 0.2)",
              fontFamily: "Calibri, sans-serif",
            }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 6px 16px rgba(183, 49, 44, 0.3)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 4px 12px rgba(183, 49, 44, 0.2)"; e.currentTarget.style.transform = "translateY(0)"; }}
          >
            + Agregar Regla
          </button>
        </div>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════
   FormCertificadoSsl — 3 modos: DOMINIO, APLICACION, PROVEEDOR
═══════════════════════════════════════════════════════ */
/* ─── Helper: Días restantes hasta fecha con color ─── */
function DiasRestantes({ fecha }: { fecha: string | null | undefined }) {
  if (!fecha) return null;
  const ahora = new Date();
  const fin = new Date(fecha + "T23:59:59");
  const diffMs = fin.getTime() - ahora.getTime();
  const diffDias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const diffMeses = diffDias / 30;

  if (diffDias < 0) return <span style={{ color: "#c0392b", fontWeight: 800 }}>⚠️ VENCIDO</span>;

  let color = "#27ae60"; // verde < 4 meses
  if (diffMeses < 2) color = "#c0392b";   // rojo < 2 meses
  else if (diffMeses < 3) color = "#f39c12"; // amarillo < 3 meses

  const label =
    diffDias >= 30
      ? `${Math.floor(diffMeses)} mes${Math.floor(diffMeses) !== 1 ? "es" : ""} ${diffDias % 30} día${diffDias % 30 !== 1 ? "s" : ""}`
      : `${diffDias} día${diffDias !== 1 ? "s" : ""}`;

  return (
    <span style={{ color, fontWeight: 800, fontSize: 12 }}>
      {label}
    </span>
  );
}

const MODOS_CERT = [
  { value: "DOMINIO",    label: "🌐 Dominio",      desc: "Nombre app + dominio + proveedor + fechas" },
  { value: "APLICACION", label: "💻 Aplicación",   desc: "Nombre app + URL + proveedor + fechas" },
  { value: "PROVEEDOR",  label: "🏢 Proveedor",    desc: "Proveedor + fechas + apps hijas editables" },
];

export function FormCertificadoSsl({
  data,
  onChange,
  certificadoApps = [],
  currentCertApp = { nombreAplicacion: "", url: "", fechaInicio: "", fechaFin: "" },
  onAddCertApp,
  onRemoveCertApp,
  onCertAppFieldChange,
}: {
  data: any;
  onChange: (f: string, v: string) => void;
  certificadoApps?: { nombreAplicacion?: string | null; url?: string | null; fechaInicio?: string | null; fechaFin?: string | null }[];
  currentCertApp?: { nombreAplicacion?: string | null; url?: string | null; fechaInicio?: string | null; fechaFin?: string | null };
  onAddCertApp?: () => void;
  onRemoveCertApp?: (index: number) => void;
  onCertAppFieldChange?: (field: string, value: string) => void;
}) {
  const modo = data.tipoCertificado || "DOMINIO";

  return (
    <>
      {/* ── Selector de modo ── */}
      <FormSection title="Tipo de Certificado SSL" icon="🔐">
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {MODOS_CERT.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => onChange("tipoCertificado", m.value)}
              style={{
                flex: 1, minWidth: 160,
                padding: "14px 16px", borderRadius: 10,
                border: modo === m.value ? "2px solid #B7312C" : "1.5px solid #ddd",
                background: modo === m.value ? "#fff5f2" : "#fafbfc",
                cursor: "pointer", textAlign: "left",
                transition: "all .2s",
                boxShadow: modo === m.value ? "0 2px 8px rgba(183,49,44,.15)" : "none",
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 800, color: modo === m.value ? "#B7312C" : "#333", marginBottom: 4 }}>
                {m.label}
              </div>
              <div style={{ fontSize: 11, color: "#888", fontWeight: 500 }}>{m.desc}</div>
            </button>
          ))}
        </div>
      </FormSection>

      {/* ── Helper inline para mostrar días restantes junto a la fecha ── */}
      {data.fechaFin && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: -10, marginBottom: 10 }}>
          <DiasRestantes fecha={data.fechaFin} />
        </div>
      )}

      {/* MODO DOMINIO */}
      {modo === "DOMINIO" && (
        <FormSection title="Datos del Dominio" icon="🌐">
          <Field label="Nombre del Dominio"   field="nombreDominio"    value={data.nombreDominio    ?? ""} onChange={onChange} placeholder="Ej: *.fiduprevisora.gov.co" />
          <Field label="Proveedor"            field="proveedor"        value={data.proveedor        ?? ""} onChange={onChange} placeholder="Ej: DigiCert" />
          <Field label="Fecha de Inicio"      field="fechaInicio"      value={data.fechaInicio      ?? ""} onChange={onChange} type="date" />
          <div>
            <Field label="Fecha de Vencimiento" field="fechaFin" value={data.fechaFin ?? ""} onChange={onChange} type="date" />
            <DiasRestantes fecha={data.fechaFin} />
          </div>
        </FormSection>
      )}

      {/* MODO APLICACION */}
      {modo === "APLICACION" && (
        <FormSection title="Datos de la Aplicación" icon="💻">
          <Field label="Nombre de Aplicación" field="nombreAplicacion" value={data.nombreAplicacion ?? ""} onChange={onChange} placeholder="Ej: SAP ERP" required />
          <Field label="Proveedor"            field="proveedor"        value={data.proveedor        ?? ""} onChange={onChange} placeholder="Ej: DigiCert" />
          <Field label="URL"                  field="url"              value={data.url              ?? ""} onChange={onChange} placeholder="Ej: https://ejemplo.com" />
          <Field label="Fecha de Inicio"      field="fechaInicio"      value={data.fechaInicio      ?? ""} onChange={onChange} type="date" />
          <div>
            <Field label="Fecha de Vencimiento" field="fechaFin" value={data.fechaFin ?? ""} onChange={onChange} type="date" />
            <DiasRestantes fecha={data.fechaFin} />
          </div>
        </FormSection>
      )}

      {/* MODO PROVEEDOR — campos simples + apps hijas */}
      {modo === "PROVEEDOR" && (
        <>
          <FormSection title="Datos del Proveedor" icon="🏢">
            <Field label="Nombre del Proveedor"  field="proveedor"        value={data.proveedor        ?? ""} onChange={onChange} placeholder="Ej: DigiCert" required />
            <Field label="URL"                   field="url"              value={data.url              ?? ""} onChange={onChange} placeholder="Ej: https://proveedor.com" />
            <Field label="Fecha de Inicio"       field="fechaInicio"      value={data.fechaInicio      ?? ""} onChange={onChange} type="date" />
            <div>
              <Field label="Fecha de Vencimiento" field="fechaFin" value={data.fechaFin ?? ""} onChange={onChange} type="date" />
              <DiasRestantes fecha={data.fechaFin} />
            </div>
          </FormSection>

          {/* Apps hijas del proveedor */}
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
              }}>Aplicaciones del Proveedor</span>
              {certificadoApps.length > 0 && (
                <span style={{
                  marginLeft: "auto", fontSize: 10, fontWeight: 700,
                  background: "#B7312C", color: "#fff",
                  padding: "3px 8px", borderRadius: 4,
                  fontFamily: "Calibri, sans-serif",
                }}>
                  {certificadoApps.length} app{certificadoApps.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>

            {/* Lista de apps agregadas */}
            {certificadoApps.length > 0 && (
              <div style={{ marginBottom: 18 }}>
                <div style={{
                  fontSize: 10, fontWeight: 700, color: "#5a4a45",
                  marginBottom: 8, textTransform: "uppercase",
                  letterSpacing: "0.08em", fontFamily: "Calibri, sans-serif",
                }}>
                  Apps Agregadas
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {certificadoApps.map((app, idx) => (
                    <div key={idx} style={{
                      display: "flex", alignItems: "flex-start", justifyContent: "space-between",
                      background: "#fefcfa", padding: "14px 15px", borderRadius: 8,
                      border: "1px solid #e5ddd8", boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
                    }}>
                      <div style={{ flex: 1, fontSize: 12, color: "#1A1A1A" }}>
                        <div style={{ marginBottom: 6 }}>
                          <span style={{ fontWeight: 700, color: "#5a4a45" }}>App:</span>{" "}
                          <span style={{ color: "#666" }}>{app.nombreAplicacion || "—"}</span>
                        </div>
                        <div style={{ marginBottom: 6 }}>
                          <span style={{ fontWeight: 700, color: "#5a4a45" }}>URL:</span>{" "}
                          {app.url ? (
                            <a
                              href={/^https?:\/\//i.test(app.url.trim()) ? app.url.trim() : `https://${app.url.trim()}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: "#B7312C", fontWeight: 600, textDecoration: "none" }}
                            >
                              {app.url}
                            </a>
                          ) : (
                            <span style={{ color: "#666" }}>—</span>
                          )}
                        </div>
                        <div>
                          <span style={{ fontWeight: 700, color: "#5a4a45" }}>Fechas:</span>{" "}
                          <span style={{ color: "#666" }}>
                            {app.fechaInicio || "?"} → {app.fechaFin || "?"}
                          </span>
                        </div>
                      </div>
                      {onRemoveCertApp && (
                        <button
                          onClick={() => onRemoveCertApp(idx)}
                          style={{
                            marginLeft: 12, padding: "8px 12px", background: "#ffebeb",
                            border: "1px solid #f08080", color: "#c0392b",
                            borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer",
                            fontFamily: "Calibri, sans-serif", textTransform: "uppercase",
                            whiteSpace: "nowrap",
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = "#ff9999"; e.currentTarget.style.color = "#fff"; }}
                          onMouseLeave={e => { e.currentTarget.style.background = "#ffebeb"; e.currentTarget.style.color = "#c0392b"; }}
                        >
                          Eliminar
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Formulario para nueva app hija */}
            <div style={{
              background: "#fefcfa", border: "1px solid #e5ddd8",
              borderRadius: 8, padding: "16px 15px",
            }}>
              <div style={{
                fontSize: 10, fontWeight: 700, color: "#5a4a45",
                marginBottom: 12, textTransform: "uppercase",
                letterSpacing: "0.08em", fontFamily: "Calibri, sans-serif",
              }}>
                📝 Nueva Aplicación
              </div>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))",
                gap: "12px 14px", marginBottom: 12,
              }}>
                <div>
                  <label style={labelStyle}>Nombre App</label>
                  <input type="text" placeholder="Ej: SAP ERP" value={currentCertApp?.nombreAplicacion ?? ""}
                    onChange={e => onCertAppFieldChange?.("nombreAplicacion", e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>URL</label>
                  <input type="text" placeholder="Ej: https://app.ejemplo.com" value={currentCertApp?.url ?? ""}
                    onChange={e => onCertAppFieldChange?.("url", e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Fecha Inicio</label>
                  <input type="date" value={currentCertApp?.fechaInicio ?? ""}
                    onChange={e => onCertAppFieldChange?.("fechaInicio", e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Fecha Fin</label>
                  <input type="date" value={currentCertApp?.fechaFin ?? ""}
                    onChange={e => onCertAppFieldChange?.("fechaFin", e.target.value)} style={inputStyle} />
                </div>
              </div>
              <button
                onClick={onAddCertApp}
                style={{
                  width: "100%", padding: "11px 15px", background: C.grad,
                  border: "none", color: "#fff", borderRadius: 6,
                  fontSize: 12, fontWeight: 800, cursor: "pointer",
                  textTransform: "uppercase", letterSpacing: "0.02em",
                  boxShadow: "0 4px 12px rgba(183, 49, 44, 0.2)",
                  fontFamily: "Calibri, sans-serif",
                }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 6px 16px rgba(183, 49, 44, 0.3)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 4px 12px rgba(183, 49, 44, 0.2)"; e.currentTarget.style.transform = "translateY(0)"; }}
              >
                + Agregar App
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}

/* ═══════════════════════════════════════════════════════
   FormMovil
═══════════════════════════════════════════════════════ */
export function FormMovil({ data, onChange }: { data: any; onChange: (f: string, v: string) => void }) {
  const [sugerencias, setSugerencias] = useState<any[]>([]);
  const [mostrarDrop, setMostrarDrop] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [marcasExtra, setMarcasExtra]   = useState<string[]>([]);
  const [modelosExtra, setModelosExtra] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      const token = sessionStorage.getItem("inventario_token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/mobile-staging/opciones`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        setMarcasExtra(json.marcas  ?? []);
        setModelosExtra(json.modelos ?? []);
      }
    })();
  }, []);

  const buscarSerial = (valor: string) => {
    onChange("serial", valor);
    onChange("imei1", "");
    onChange("imei2", "");
    onChange("marca",  "");
    onChange("modelo", "");

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (valor.length < 2) {
      setSugerencias([]);
      setMostrarDrop(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const token = sessionStorage.getItem("inventario_token");
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/mobile-staging/search?serial=${encodeURIComponent(valor)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.ok) {
          const json = await res.json();
          const items = json?.data ?? json ?? [];
          setSugerencias(items);
          setMostrarDrop(items.length > 0);
        }
      } catch {
        setSugerencias([]);
        setMostrarDrop(false);
      }
    }, 400);
  };

  const seleccionarSugerencia = (item: any) => {
    onChange("serial",  item.serial  ?? "");
    onChange("imei1",   item.imei1   ?? "");
    onChange("imei2",   item.imei2   ?? "");
    onChange("marca",   item.marca   ?? "");
    onChange("modelo",  item.modelo  ?? "");
    setSugerencias([]);
    setMostrarDrop(false);
  };

  return (
    <>
      <FormSection title="Identificación del Móvil" icon="📱">
        <div style={{ position: "relative" }}>
          <Field
            label="Serial"
            field="serial"
            value={data.serial ?? ""}
            onChange={buscarSerial}
            placeholder="Escribe el serial para autocompletar"
            required
          />
          {mostrarDrop && sugerencias.length > 0 && (
            <div style={{
              position: "absolute", zIndex: 999, top: "100%", left: 0, right: 0,
              background: "#fff", border: "1px solid #e5ddd8", borderRadius: 8,
              boxShadow: "0 4px 16px rgba(0,0,0,0.10)", marginTop: 3, overflow: "hidden",
            }}>
              {sugerencias.map((item, idx) => (
                <div
                  key={idx}
                  onMouseDown={() => seleccionarSugerencia(item)}
                  style={{
                    padding: "10px 14px", fontSize: 13,
                    fontFamily: "Calibri, sans-serif", color: "#1A1A1A",
                    cursor: "pointer",
                    borderBottom: idx < sugerencias.length - 1 ? "1px solid #f5f0ed" : "none",
                    background: "#fff", transition: "background 0.1s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#fef7f4")}
                  onMouseLeave={e => (e.currentTarget.style.background = "#fff")}
                >
                  <strong>{item.serial}</strong>
                  {item.marca && <span style={{ color: "#888", marginLeft: 8 }}>{item.marca}</span>}
                  {item.modelo && <span style={{ color: "#888", marginLeft: 4 }}>{item.modelo}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
        <Field label="IMEI 1" field="imei1" value={data.imei1 ?? ""} onChange={onChange} placeholder="Ej: 123456789012345" />
        <Field label="IMEI 2" field="imei2" value={data.imei2 ?? ""} onChange={onChange} placeholder="Ej: 123456789012345" />
        <SmartField tipo="MOVIL" field="marca"  label="Marca"  value={data.marca  ?? ""} onChange={onChange} extraOptions={marcasExtra} />
        <SmartField tipo="MOVIL" field="modelo" label="Modelo" value={data.modelo ?? ""} onChange={onChange} extraOptions={modelosExtra} />
      </FormSection>

      <FormSection title="Asignación" icon="👤">
        <SmartField tipo="MOVIL" field="region"      label="Regional"       value={data.region      ?? ""} onChange={onChange} />
        <SmartField tipo="MOVIL" field="sede"        label="Sede"           value={data.sede        ?? ""} onChange={onChange} placeholder="Ej: Calle 72" />
        <SmartField tipo="MOVIL" field="dependencia" label="Dependencia"    value={data.dependencia ?? ""} onChange={onChange} placeholder="Ej: Talento Humano" />
        <Field field="cedula"           label="Cédula"          value={data.cedula           ?? ""} onChange={onChange} placeholder="Ej: 123456789" />
        <Field field="usuarioRed"       label="Usuario Red"     value={data.usuarioRed       ?? ""} onChange={onChange} placeholder="Ej: jperez" />
        <Field field="correoResponsable" label="Correo Responsable" value={data.correoResponsable ?? ""} onChange={onChange} placeholder="Ej: juan@fiduprevisora.gov.co" />
        <Field field="numeroLinea"      label="Número de Línea" value={data.numeroLinea      ?? ""} onChange={onChange} placeholder="Ej: 3001234567" />
        <Field field="sim"              label="SIM"             value={data.sim              ?? ""} onChange={onChange} placeholder="Ej: 8950123456789" />
        <Field field="uni"              label="UNI"             value={data.uni              ?? ""} onChange={onChange} type="number" placeholder="Ej: 1" />
      </FormSection>

      <FormSection title="Fechas" icon="📅">
        <Field field="fechaEntrega"          label="Fecha de Entrega"      value={data.fechaEntrega          ?? ""} onChange={onChange} type="date" />
        <Field field="fechaDevolucion"       label="Fecha de Devolución"   value={data.fechaDevolucion       ?? ""} onChange={onChange} type="date" />
        <Field field="observacionesEntrega"  label="Observaciones Entrega" value={data.observacionesEntrega  ?? ""} onChange={onChange} placeholder="Observaciones..." />
        <Field field="observacionesDevolucion" label="Observaciones Devolución" value={data.observacionesDevolucion ?? ""} onChange={onChange} placeholder="Observaciones..." />
      </FormSection>
    </>
  );
}

