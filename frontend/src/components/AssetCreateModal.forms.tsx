// frontend/src/components/AssetCreateModal.forms.tsx
import { useState, useRef} from "react";
import { useEffect } from "react";
import type { VpnRule } from "../types";
import { C, Field, SelectField, AutocompleteField, SelectWithOtherField, inputStyle, labelStyle } from "./AssetCreateModal.fields";

/* ─── FIELD_MODE ─── */
const FIELD_MODE: Record<string, Record<string, "field" | "select" | "autocomplete" | "select-other">> = { // ← CAMBIO: tipo extendido
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
    ambiente: ["PRODUCCIÓN", "DESARROLLO", "QA", "CERTIFICACIÓN"],
  },
  MOVIL: {
    marca:  ["Samsung", "Motorola", "Xiaomi", "Huawei", "Apple"],   // ← CAMBIO: sin "Otra", la agrega SelectWithOtherField
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
  tipo, field, label, value, onChange, placeholder, required, type, extraOptions, // ← CAMBIO
}: {
  tipo: string;
  field: string;
  label: string;
  value: string;
  onChange: (f: string, v: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
  extraOptions?: string[]; // ← CAMBIO
}) {
  const mode = FIELD_MODE[tipo]?.[field] ?? "field";

  if (mode === "select-other") {
  const baseOptions = SELECT_OPTIONS[tipo]?.[field] ?? [];
  const options = Array.from(new Set([...baseOptions, ...(extraOptions ?? [])])); // se agrega extraoptions
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
   FormSection — idéntico al original
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
   FormServidor — idéntico al original
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
   FormRed — idéntico al original
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
   FormUps — idéntico al original
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
   FormBaseDatos — idéntico al original
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
   FormVpn — idéntico al original
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
   FormMovil
═══════════════════════════════════════════════════════ */
export function FormMovil({ data, onChange }: { data: any; onChange: (f: string, v: string) => void }) {
  const [sugerencias, setSugerencias] = useState<any[]>([]);
  const [mostrarDrop, setMostrarDrop] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [marcasExtra, setMarcasExtra]   = useState<string[]>([]);
  const [modelosExtra, setModelosExtra] = useState<string[]>([]);

  // ← CAMBIO: cargar opciones reales guardadas en MobileStaging al montar el form
  useEffect(() => {
    (async () => {
      const token = sessionStorage.getItem("inventario_token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/mobile-staging/opciones`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMarcasExtra(data.marcas  ?? []);
        setModelosExtra(data.modelos ?? []);
      }
    })();
  }, []);

  const buscarSerial = (valor: string) => {
    onChange("serial", valor);
    onChange("imei1", "");
    onChange("imei2", "");
    onChange("marca",  "");   // ← CAMBIO
    onChange("modelo", "");   // ← CAMBIO

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (valor.length < 2) {
      setSugerencias([]);
      setMostrarDrop(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      const token = sessionStorage.getItem("inventario_token");
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/mobile-staging/search?q=${encodeURIComponent(valor)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const result = await res.json();
      setSugerencias(result);
      setMostrarDrop(result.length > 0);
    }, 300);
  };

  const seleccionarSerial = (item: any) => {
    onChange("serial", item.serial);
    onChange("imei1",  item.imei1  || "");
    onChange("imei2",  item.imei2  || "");
    onChange("marca",  item.marca  || "");   // ← CAMBIO
    onChange("modelo", item.modelo || "");   // ← CAMBIO
    setSugerencias([]);
    setMostrarDrop(false);
  };

  return (
    <>
      <FormSection title="Datos del Usuario" icon="👤">
        <Field label="# Caso"             field="numeroCaso"        value={data.numeroCaso        ?? ""} onChange={onChange} />
        <SmartField tipo="MOVIL" field="region"      label="Región/Departamento" value={data.region            ?? ""} onChange={onChange} />
        <SmartField tipo="MOVIL" field="dependencia" label="Dependencia/Área"    value={data.dependencia       ?? ""} onChange={onChange} />
        <SmartField tipo="MOVIL" field="sede"        label="Sede"                value={data.sede              ?? ""} onChange={onChange} />
        <Field label="C.C."               field="cedula"            value={data.cedula            ?? ""} onChange={onChange} />
        <Field label="Usuario de Red"     field="usuarioRed"        value={data.usuarioRed        ?? ""} onChange={onChange} />
        <Field label="Correo Responsable" field="correoResponsable" value={data.correoResponsable ?? ""} onChange={onChange} />
      </FormSection>

      <FormSection title="Datos del Equipo" icon="📱">
        <Field label="UNI" field="uni" value={"1"} onChange={onChange} readOnly />

        {/* Marca — select-other, autofillado desde staging */}
       

        {/* Modelo — select-other, autofillado desde staging.
            Si staging tiene un modelo fuera de la lista → SelectWithOtherField
            lo detecta automáticamente y activa el input con el valor ya escrito */}
        <SmartField tipo="MOVIL" field="marca"  label="Marca"  value={data.marca  ?? ""} onChange={onChange} extraOptions={marcasExtra} />
        <SmartField tipo="MOVIL" field="modelo" label="Modelo" value={data.modelo ?? ""} onChange={onChange} extraOptions={modelosExtra} />
 
        {/* Serial con autocomplete MobileStaging */}
        <div style={{ position: "relative" }}>
          <label style={labelStyle}>Serial</label>
          <input
            value={data.serial ?? ""}
            onChange={e => buscarSerial(e.target.value)}
            style={inputStyle}
            placeholder="Escanea o escribe el serial..."
          />
          {mostrarDrop && (
            <div style={{
              position: "absolute", zIndex: 999,
              background: "#fff", border: "1px solid #d1d5db",
              borderRadius: 6, width: "100%",
            }}>
              {sugerencias.map((s: any) => (
                <div
                  key={s.id}
                  onClick={() => seleccionarSerial(s)}
                  style={{ padding: 8, cursor: "pointer" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#fef7f4")}
                  onMouseLeave={e => (e.currentTarget.style.background = "#fff")}
                >
                  <strong>{s.serial}</strong>
                  {s.marca && <span style={{ marginLeft: 8, color: "#888", fontSize: 12 }}>{s.marca} {s.modelo}</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        <Field label="IMEI 1"           field="imei1"       value={data.imei1       ?? ""} onChange={onChange} />
        <Field label="IMEI 2"           field="imei2"       value={data.imei2       ?? ""} onChange={onChange} />
        <SelectField
          label="SIM" field="sim"
          value={data.sim ?? ""}
          onChange={onChange}
          options={["Sí", "No"]}
        />
        <Field label="Número de Línea"  field="numeroLinea" value={data.numeroLinea  ?? ""} onChange={onChange} />
        <Field label="Fecha de Entrega" field="fechaEntrega" value={data.fechaEntrega ?? ""} onChange={onChange} type="date" />
      </FormSection>

      <FormSection title="Observaciones de Entrega" icon="📝">
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={labelStyle}>Observaciones</label>
          <textarea
            value={data.observacionesEntrega ?? ""}
            onChange={e => onChange("observacionesEntrega", e.target.value)}
            rows={3}
            style={{ ...inputStyle }}
          />
        </div>
      </FormSection>
    </>
  );
}