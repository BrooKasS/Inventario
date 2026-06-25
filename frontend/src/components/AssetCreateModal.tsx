// frontend/src/components/AssetCreateModal.tsx
// ─────────────────────────────────────────────────────────────────────────
// Shell: estado, lógica submit, render del modal.
// Componentes de campo → AssetCreateModal.fields.tsx
// Formularios por tipo → AssetCreateModal.forms.tsx
// ⛔ NO tocar submit, estado, handlers, payload — idénticos al original
// ─────────────────────────────────────────────────────────────────────────
import { useState, useEffect } from "react";
import { createAsset } from "../api/client";
import type { TipoActivo, VpnRule } from "../types";
import { C, Field, AutocompleteField } from "./AssetCreateModal.fields";
import {
  FormSection,
  FormServidor,
  FormRed,
  FormUps,
  FormBaseDatos,
  FormVpn,
  FormMovil,
} from "./AssetCreateModal.forms";

/* ─── Constantes UI ─── */
const TIPO_LABEL: Record<string, string> = {
  SERVIDOR:   "Servidor",
  BASE_DATOS: "Base de Datos",
  RED:        "Red",
  UPS:        "UPS",
  VPN:        "VPN S2S",
  MOVIL:      "Móvil",
};

const TIPO_ICON: Record<string, string> = {
  SERVIDOR:   "🖥️",
  BASE_DATOS: "🗄️",
  RED:        "🌐",
  UPS:        "⚡",
  VPN:        "🔒",
  MOVIL:      "📱",
};

/* ─── Parser de errores de validación (idéntico al original) ─── */
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

/* ─── Props ─── */
interface AssetCreateModalProps {
  open: boolean;
  onClose: () => void;
  tipo: TipoActivo;
  onCreated: () => void;
  initialData?: {
    nombre?: string;
    ipInterna?: string;
    sistemaOperativo?: string;
    vramMb?: string;
    vcpu?: string;
  };
}

export default function AssetCreateModal({
  open, onClose, tipo, onCreated, initialData,
}: AssetCreateModalProps) {

  /* ── Estado del formulario (idéntico al original) ── */


const DEFAULTS_POR_TIPO: Record<string, {
  ubicacion: string;
  propietario: string;
  custodio: string;
  codigoServicio: string;
}> = {
  SERVIDOR:   { ubicacion: "TRIARA", propietario: "Gerencia TI",    custodio: "Profesional de servidores", codigoServicio: "FLP0" },
  RED:        { ubicacion: "",       propietario: "Fiduprevisora",   custodio: "Profesional de redes",      codigoServicio: "FLP0" },
  UPS:        { ubicacion: "",       propietario: "FIDUPREVISORA",   custodio: "Profesional de redes",      codigoServicio: "" },
  BASE_DATOS: { ubicacion: "",       propietario: "FIDUPREVISORA",   custodio: "Profesional de redes",      codigoServicio: "" },
  VPN:        { ubicacion: "",       propietario: "",                custodio: "",                          codigoServicio: "" },
  MOVIL:      { ubicacion: "",       propietario: "",                custodio: "",                          codigoServicio: "" },
};

const DEFAULTS_DETALLE: Record<string, Record<string, string>> = {
  SERVIDOR:   { ipInterna: "172.16.0" },
  RED:        { ipInterna: "172.16.0" },
  UPS:        { ipInterna: "" },
  BASE_DATOS: { ipInterna: "" },
  VPN:        { ipInterna: "" },
  MOVIL:      { region: "Bogotá", sede: "Calle 72" },
};

const [general, setGeneral] = useState({
  nombre:         initialData?.nombre ?? "",
  ubicacion:      "",
  propietario:    "",
  custodio:       "",
  codigoServicio: "",
});

const [detalle, setDetalle] = useState<Record<string, string>>({
  ipInterna:        initialData?.ipInterna        ?? "",
  sistemaOperativo: initialData?.sistemaOperativo ?? "",
  vramMb:           initialData?.vramMb           ?? "",
  vcpu:             initialData?.vcpu             ?? "",
});

const [saving, setSaving] = useState(false);
const [error,  setError]  = useState<string | null>(null);

const [vpnRules, setVpnRules] = useState<Partial<VpnRule>[]>([]);
const [currentRule, setCurrentRule] = useState<Partial<VpnRule>>({
  conexion: "", fases: "", origen: "", destino: "",
});

useEffect(() => {
  if (open) {
    const d  = DEFAULTS_POR_TIPO[tipo]  ?? { ubicacion: "", propietario: "", custodio: "", codigoServicio: "" };
    const dd = DEFAULTS_DETALLE[tipo]   ?? {};
    setGeneral({
      nombre:         initialData?.nombre ?? "",
      ubicacion:      d.ubicacion,
      propietario:    d.propietario,
      custodio:       d.custodio,
      codigoServicio: d.codigoServicio,
    });
    setDetalle(prev => ({
      ...prev,
      ipInterna:        dd.ipInterna        ?? initialData?.ipInterna        ?? "",
      sistemaOperativo: initialData?.sistemaOperativo ?? "",
      vramMb:           initialData?.vramMb           ?? "",
      vcpu:             initialData?.vcpu             ?? "",
      region:           dd.region           ?? prev.region           ?? "",
      sede:             dd.sede             ?? prev.sede             ?? "",
    }));
  }
}, [open, tipo, initialData]);

if (!open) return null;


  /* ── Handlers (idénticos al original) ── */
  const handleGeneral = (field: string, val: string) => {
    setGeneral(prev => ({ ...prev, [field]: val }));
    setError(null);
  };

  const handleDetalle = (field: string, val: string) => {
    setDetalle(prev => ({ ...prev, [field]: val }));
    setError(null);
  };

  const handleAddRule = () => {
    if (!currentRule.conexion && !currentRule.fases &&
        !currentRule.origen  && !currentRule.destino) return;
    setVpnRules([...vpnRules, { ...currentRule }]);
    setCurrentRule({ conexion: "", fases: "", origen: "", destino: "" });
    setError(null);
  };

  const handleRemoveRule = (index: number) => {
    setVpnRules(vpnRules.filter((_, i) => i !== index));
    setError(null);
  };

  const handleRuleFieldChange = (field: keyof VpnRule, value: string) => {
    setCurrentRule({ ...currentRule, [field]: value || null });
    setError(null);
  };

  /* ── Cerrar y limpiar (idéntico al original) ── */
  const handleClose = () => {
    setGeneral({ nombre: "", ubicacion: "", propietario: "", custodio: "", codigoServicio: "" });
    setDetalle({ ipInterna: "", sistemaOperativo: "", vramMb: "", vcpu: "" });
    setVpnRules([]);
    setCurrentRule({ conexion: "", fases: "", origen: "", destino: "" });
    setError(null);
    onClose();
  };

  /* ── Submit (idéntico al original — no se toca) ── */
  const handleSubmit = async () => {
    if (!general.nombre.trim()) {
      setError("El nombre es obligatorio.");
      return;
    }

    if (tipo === "VPN" && !detalle.conexion?.trim()) {
      setError("Para VPN, la Conexión (IP) es obligatoria.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const detalleConvertido: Record<string, any> = { ...detalle };

      if (tipo === "SERVIDOR") {
        if (detalleConvertido.vcpu)   detalleConvertido.vcpu   = parseInt(detalleConvertido.vcpu)   || null;
        if (detalleConvertido.vramMb) detalleConvertido.vramMb = parseInt(detalleConvertido.vramMb) || null;
      }

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
          Object.assign(payload, detalleConvertido);
        } else if (tipo === "VPN") {
          payload[tipoKey] = {
            ...detalleConvertido,
            reglas: vpnRules.map(rule => ({
              conexion: rule.conexion ?? null,
              fases:    rule.fases    ?? null,
              origen:   rule.origen   ?? null,
              destino:  rule.destino  ?? null,
            })),
          };
        } else {
          payload[tipoKey] = detalleConvertido;
        }
      }

      await createAsset(payload);

      if (tipo === "MOVIL" && payload.serial) {
        await fetch(
          `${import.meta.env.VITE_API_URL}/mobile-staging/${payload.serial}/usado`,
          {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${sessionStorage.getItem("inventario_token")}`,
            },
          }
        );
      }

      onCreated();
      handleClose();
    } catch (e: any) {
      setError(e?.response?.data?.error ?? "Error al crear el activo. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  /* ── Visibilidad campos generales (idéntico al original) ── */
  const mostrarCodigo      = tipo !== "UPS" && tipo !== "BASE_DATOS" && tipo !== "VPN" && tipo !== "MOVIL";
  const mostrarUbicacion   = tipo !== "BASE_DATOS" && tipo !== "VPN" && tipo !== "MOVIL";
  const mostrarPropietario = tipo !== "MOVIL";
  const mostrarCustodio    = tipo !== "MOVIL";

  /* ── Render ── */
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
            from { opacity: 0; transform: scale(0.98) translateY(10px); }
            to   { opacity: 1; transform: scale(1)    translateY(0); }
          }
          .create-scroll::-webkit-scrollbar { width: 6px; }
          .create-scroll::-webkit-scrollbar-track { background: #f8f6f3; }
          .create-scroll::-webkit-scrollbar-thumb { background: #ddd; border-radius: 3px; }
          .create-scroll::-webkit-scrollbar-thumb:hover { background: #bbb; }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
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
              background: "rgba(255,255,255,.15)", border: "none",
              color: "#fff", borderRadius: 8, width: 36, height: 36,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", fontSize: 20, lineHeight: 1,
              transition: "all 0.15s ease",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,.25)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,.15)"}
          >×</button>
        </div>

        {/* ── Body scrollable ── */}
        <div className="create-scroll" style={{ padding: "22px 24px", overflowY: "auto", flex: 1 }}>

          {/* Error */}
          {error && (
            <div style={{
              background: "linear-gradient(135deg, #fff5f5 0%, #ffebeb 100%)",
              border: "1.5px solid #f08080",
              borderRadius: 10, padding: "14px 16px", marginBottom: 18,
              fontSize: 13, color: "#c0392b",
              fontFamily: "Calibri, sans-serif",
              boxShadow: "0 2px 8px rgba(192,57,43,0.1)",
            }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <span style={{ marginTop: 2, flexShrink: 0, fontSize: 16 }}>⚠️</span>
                <div style={{ flex: 1 }}>
                  {parseValidationErrors(error).length > 1 ? (
                    <>
                      <div style={{ fontWeight: 700, marginBottom: 8, color: "#c0392b" }}>
                        Validación fallida:
                      </div>
                      <ul style={{ margin: 0, paddingLeft: 20 }}>
                        {parseValidationErrors(error).map((err, idx) => (
                          <li key={idx} style={{
                            marginBottom: idx < parseValidationErrors(error).length - 1 ? 5 : 0,
                            color: "#a93226",
                          }}>
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
                tipo === "VPN"      ? "Ej: ALFAGL_BACKUP" :
                tipo === "MOVIL"    ? "Ej: Movil 001"     :
                tipo === "SERVIDOR" ? "Ej: SRV-PROD-01"   :
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
  <AutocompleteField
    label="Ubicación"
    field="ubicacion"
    value={general.ubicacion}
    onChange={handleGeneral}
    tipo={"ASSET" as any}
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
          {tipo === "SERVIDOR"   && <FormServidor data={detalle} onChange={handleDetalle} />}
          {tipo === "RED"        && <FormRed       data={detalle} onChange={handleDetalle} />}
          {tipo === "UPS"        && <FormUps       data={detalle} onChange={handleDetalle} />}
          {tipo === "BASE_DATOS" && <FormBaseDatos data={detalle} onChange={handleDetalle} />}
          {tipo === "VPN"        && (
            <FormVpn
              data={detalle}
              onChange={handleDetalle}
              vpnRules={vpnRules}
              currentRule={currentRule}
              onAddRule={handleAddRule}
              onRemoveRule={handleRemoveRule}
              onRuleFieldChange={handleRuleFieldChange}
            />
          )}
          {tipo === "MOVIL" && <FormMovil data={detalle} onChange={handleDetalle} />}
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
              flex: 1, padding: "12px 16px", borderRadius: 8,
              border: "1px solid #e5ddd8",
              background: "#fff", color: "#2C2C2C",
              fontSize: 13, fontWeight: 700,
              cursor: "pointer", transition: "all 0.15s ease",
              letterSpacing: "0.02em",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "#f5f3f1"; e.currentTarget.style.borderColor = "#d5cdc8"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "#fff";    e.currentTarget.style.borderColor = "#e5ddd8"; }}
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
              boxShadow: !general.nombre ? "none" : "0 4px 12px rgba(183,49,44,0.25)",
            }}
            onMouseEnter={e => {
              if (!general.nombre) return;
              e.currentTarget.style.boxShadow = "0 6px 18px rgba(183,49,44,0.35)";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={e => {
              if (!general.nombre) return;
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(183,49,44,0.25)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            {saving ? "Guardando..." : "Crear Activo"}
          </button>
        </div>
      </div>
    </div>
  );
}