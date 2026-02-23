import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getAssetById, updateAsset, addObservacion } from "../api/client";
import type { Asset, BitacoraEntry, TipoEvento } from "../types";

/* ─── design tokens ─── */
const C = {
  grad: "linear-gradient(135deg, #FA8200 0%, #861F41 35%, #B7312C 70%, #D86018 100%)",
  primary: "#B7312C",
  dark: "#861F41",
  accent: "#FA8200",
  warm: "#D86018",
};

/* ─── sub-components ─── */
function Field({
  label, value, editing, field, onChange,
}: {
  label: string; value: string | number | null;
  editing: boolean; field: string;
  onChange: (field: string, val: string) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={{
        fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
        textTransform: "uppercase", color: "#B7312C", fontFamily: "Calibri, sans-serif",
      }}>
        {label}
      </span>
      {editing ? (
        <input
          defaultValue={value?.toString() ?? ""}
          onChange={e => onChange(field, e.target.value)}
          style={{
            background: "#fff", border: "2px solid #e0e0e0",
            borderRadius: 6, padding: "7px 10px", fontSize: 13,
            color: "#333", fontFamily: "Calibri, sans-serif",
            outline: "none", transition: "border-color .2s",
          }}
          onFocus={e => (e.currentTarget.style.borderColor = "#B7312C")}
          onBlur={e => (e.currentTarget.style.borderColor = "#e0e0e0")}
        />
      ) : (
        <span style={{
          fontSize: 13, color: value ? "#333" : "#999",
          fontFamily: "Calibri, sans-serif", lineHeight: 1.5,
        }}>
          {value ?? "—"}
        </span>
      )}
    </div>
  );
}

function Section({ title, icon, children }: {
  title: string; icon?: string; children: React.ReactNode;
}) {
  return (
    <div style={{
      borderRadius: 14, overflow: "hidden",
      border: "1px solid #f0e8e8",
      boxShadow: "0 2px 12px rgba(183,49,44,.08)",
      marginBottom: 16,
    }}>
      {/* section header */}
      <div style={{
        background: C.grad, padding: "14px 20px",
        display: "flex", alignItems: "center", gap: 10,
      }}>
        {icon && <span style={{ fontSize: 16 }}>{icon}</span>}
        <span style={{
          fontSize: 11, fontWeight: 700, letterSpacing: "0.14em",
          textTransform: "uppercase", color: "#fff",
        }}>
          {title}
        </span>
      </div>
      {/* grid body */}
      <div style={{
        padding: "20px", display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
        gap: "16px 24px", background: "#fff",
      }}>
        {children}
      </div>
    </div>
  );
}

const EVENTO_LABEL: Record<string, string> = {
  IMPORTACION: "Importación", CAMBIO_CAMPO: "Cambio de campo",
  MANTENIMIENTO: "Mantenimiento", INCIDENTE: "Incidente", NOTA: "Nota",
};

const EVENTO_COLOR: Record<string, { bg: string; color: string }> = {
  IMPORTACION: { bg: "#e0f0ff", color: "#0c5460" },
  CAMBIO_CAMPO: { bg: "#fff3cd", color: "#856404" },
  MANTENIMIENTO: { bg: "#d4edda", color: "#155724" },
  INCIDENTE: { bg: "#f8d7da", color: "#721c24" },
  NOTA: { bg: "#e2e3e5", color: "#383d41" },
};

/* ─── main component ─── */
export default function AssetDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [asset, setAsset] = useState<Asset | null>(null);
  const [editing, setEditing] = useState(false);
  const [changes, setChanges] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);

  const [showObs, setShowObs] = useState(false);
  const [obsAutor, setObsAutor] = useState("");
  const [obsTipo, setObsTipo] = useState<TipoEvento>("NOTA");
  const [obsDesc, setObsDesc] = useState("");
  const [obsLoading, setObsLoading] = useState(false);

  const load = () => { if (id) getAssetById(id).then(setAsset); };
  useEffect(() => { load(); }, [id]);

  const handleChange = (section: string | null, field: string, val: string) => {
    if (section) {
      setChanges(prev => ({ ...prev, [section]: { ...(prev[section] || {}), [field]: val } }));
    } else {
      setChanges(prev => ({ ...prev, [field]: val }));
    }
  };

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    try { await updateAsset(id, changes); setEditing(false); setChanges({}); load(); }
    finally { setSaving(false); }
  };

  const handleAddObs = async () => {
    if (!id || !obsAutor || !obsDesc) return;
    setObsLoading(true);
    try {
      await addObservacion(id, { autor: obsAutor, tipoEvento: obsTipo, descripcion: obsDesc });
      setShowObs(false); setObsAutor(""); setObsDesc(""); setObsTipo("NOTA"); load();
    } finally { setObsLoading(false); }
  };

  if (!asset) return (
    <div style={{
      padding: "64px 40px", textAlign: "center",
      display: "flex", flexDirection: "column", alignItems: "center", gap: 14,
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: "50%",
        border: "4px solid rgba(255,255,255,.1)",
        borderTop: "4px solid #36fa00",
        animation: "spin 1s linear infinite",
      }} />
      <span style={{ color: "rgba(255,255,255,.35)", fontSize: 14 }}>Cargando activo...</span>
      <style>{`@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const s = asset.servidor;
  const r = asset.red;
  const u = asset.ups;
  const b = asset.baseDatos;

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 14px", border: "2px solid #e0e0e0",
    borderRadius: 8, fontSize: 14, fontFamily: "Calibri, sans-serif",
    transition: "border-color .2s", outline: "none",
    background: "#fff", color: "#333",
  };

  return (
    <div style={{
      maxWidth: 960, margin: "0 auto", padding: "32px 24px",
      fontFamily: "Calibri, 'Segoe UI', sans-serif",
      background: C.grad,  // Fondo gradiente para la página completa
    }}>

      {/* ── Back button ── */}
      <button
        onClick={() => navigate(-1)}
        style={{
          background: "none", border: "none", cursor: "pointer",
          color: "#fff", fontSize: 13, fontWeight: 600,
          display: "flex", alignItems: "center", gap: 6,
          marginBottom: 20, padding: 0, letterSpacing: "0.03em",
        }}
        onMouseEnter={e => (e.currentTarget.style.color = "#FA8200")}
        onMouseLeave={e => (e.currentTarget.style.color = "#fff")}
      >
        ← Volver al listado
      </button>

      {/* ── Hero card ── */}
      <div style={{
        background: "#fff", borderRadius: 14,
        padding: "28px 32px", marginBottom: 24,
        boxShadow: "0 8px 32px rgba(183,49,44,.25)",
        display: "flex", justifyContent: "space-between",
        alignItems: "center", flexWrap: "wrap", gap: 16,
      }}>
        <div>
          <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
            <span style={{
              background: C.grad, color: "#fff",
              fontSize: 11, fontWeight: 700, letterSpacing: "0.1em",
              padding: "4px 12px", borderRadius: 20, textTransform: "uppercase",
            }}>
              {asset.tipo.replace("_", " ")}
            </span>
            {asset.codigoServicio && (
              <span style={{
                background: "#f0f0f0", color: "#555",
                fontSize: 11, padding: "4px 12px", borderRadius: 20,
              }}>
                {asset.codigoServicio}
              </span>
            )}
          </div>
          <h1 style={{
            color: "#333", fontSize: 28, fontWeight: 700,
            margin: 0,
          }}>
            {asset.nombre ?? "Sin nombre"}
          </h1>
          {asset.ubicacion && (
            <p style={{ color: "#777", marginTop: 6, fontSize: 14 }}>
              📍 {asset.ubicacion}
            </p>
          )}
        </div>

        {/* action buttons */}
        <div style={{ display: "flex", gap: 10 }}>
          {editing ? (
            <>
              <button
                onClick={() => { setEditing(false); setChanges({}); }}
                style={{
                  padding: "10px 22px", borderRadius: 8, border: "2px solid #e0e0e0",
                  background: "#fff", color: "#555", fontWeight: 600,
                  cursor: "pointer", fontSize: 14, transition: "all .2s",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "#f0f0f0")}
                onMouseLeave={e => (e.currentTarget.style.background = "#fff")}
              >
                Cancelar
              </button>
              <button
                onClick={handleSave} disabled={saving}
                style={{
                  padding: "10px 22px", borderRadius: 8, border: "none",
                  background: C.grad, color: "#fff", fontWeight: 700,
                  cursor: saving ? "not-allowed" : "pointer", fontSize: 14,
                  opacity: saving ? 0.7 : 1, transition: "all .2s",
                  boxShadow: "0 4px 12px rgba(183,49,44,.15)",
                }}
              >
                {saving ? "Guardando..." : "💾 Guardar"}
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditing(true)}
              style={{
                padding: "10px 22px", borderRadius: 8, border: "none",
                background: C.grad, color: "#fff", fontWeight: 700,
                cursor: "pointer", fontSize: 14, transition: "all .2s",
                boxShadow: "0 4px 12px rgba(183,49,44,.15)",
              }}
              onMouseEnter={e => (e.currentTarget.style.transform = "translateY(-2px)")}
              onMouseLeave={e => (e.currentTarget.style.transform = "translateY(0)")}
            >
              ✏️ Editar
            </button>
          )}
        </div>
      </div>

      {/* ── Información General ── */}
      <Section title="Información General" icon="🏷️">
        <Field label="Nombre" value={asset.nombre} editing={editing} field="nombre" onChange={(f, v) => handleChange(null, f, v)} />
        <Field label="Ubicación" value={asset.ubicacion} editing={editing} field="ubicacion" onChange={(f, v) => handleChange(null, f, v)} />
        <Field label="Propietario" value={asset.propietario} editing={editing} field="propietario" onChange={(f, v) => handleChange(null, f, v)} />
        <Field label="Custodio" value={asset.custodio} editing={editing} field="custodio" onChange={(f, v) => handleChange(null, f, v)} />
        <Field label="Código de Servicio" value={asset.codigoServicio} editing={editing} field="codigoServicio" onChange={(f, v) => handleChange(null, f, v)} />
      </Section>

      {/* ── SERVIDOR ── */}
      {s && (
        <>
          <Section title="Red" icon="🌐">
            <Field label="IP Interna" value={s.ipInterna} editing={editing} field="ipInterna" onChange={(f, v) => handleChange("servidor", f, v)} />
            <Field label="IP Gestión" value={s.ipGestion} editing={editing} field="ipGestion" onChange={(f, v) => handleChange("servidor", f, v)} />
            <Field label="IP Servicio" value={s.ipServicio} editing={editing} field="ipServicio" onChange={(f, v) => handleChange("servidor", f, v)} />
          </Section>
          <Section title="Recursos" icon="⚙️">
            <Field label="vCPU" value={s.vcpu} editing={editing} field="vcpu" onChange={(f, v) => handleChange("servidor", f, v)} />
            <Field label="vRAM (MB)" value={s.vramMb} editing={editing} field="vramMb" onChange={(f, v) => handleChange("servidor", f, v)} />
            <Field label="Sistema Operativo" value={s.sistemaOperativo} editing={editing} field="sistemaOperativo" onChange={(f, v) => handleChange("servidor", f, v)} />
          </Section>
          <Section title="Operación" icon="🔧">
            <Field label="Ambiente" value={s.ambiente} editing={editing} field="ambiente" onChange={(f, v) => handleChange("servidor", f, v)} />
            <Field label="Tipo Servidor" value={s.tipoServidor} editing={editing} field="tipoServidor" onChange={(f, v) => handleChange("servidor", f, v)} />
            <Field label="Aplicación que soporta" value={s.appSoporta} editing={editing} field="appSoporta" onChange={(f, v) => handleChange("servidor", f, v)} />
            <Field label="Monitoreo" value={s.monitoreo} editing={editing} field="monitoreo" onChange={(f, v) => handleChange("servidor", f, v)} />
            <Field label="Backup" value={s.backup} editing={editing} field="backup" onChange={(f, v) => handleChange("servidor", f, v)} />
            <Field label="Rutas de Backup" value={s.rutasBackup} editing={editing} field="rutasBackup" onChange={(f, v) => handleChange("servidor", f, v)} />
            <Field label="Fecha Fin Soporte" value={s.fechaFinSoporte} editing={editing} field="fechaFinSoporte" onChange={(f, v) => handleChange("servidor", f, v)} />
            <Field label="Contrato que lo soporta" value={s.contratoQueSoporta} editing={editing} field="contratoQueSoporta" onChange={(f, v) => handleChange("servidor", f, v)} />
          </Section>
        </>
      )}

      {/* ── RED ── */}
      {r && (
        <Section title="Equipo de Red" icon="🔌">
          <Field label="Serial" value={r.serial} editing={editing} field="serial" onChange={(f, v) => handleChange("red", f, v)} />
          <Field label="MAC" value={r.mac} editing={editing} field="mac" onChange={(f, v) => handleChange("red", f, v)} />
          <Field label="Modelo" value={r.modelo} editing={editing} field="modelo" onChange={(f, v) => handleChange("red", f, v)} />
          <Field label="IP Gestión" value={r.ipGestion} editing={editing} field="ipGestion" onChange={(f, v) => handleChange("red", f, v)} />
          <Field label="Estado" value={r.estado} editing={editing} field="estado" onChange={(f, v) => handleChange("red", f, v)} />
          <Field label="Fecha Fin Soporte" value={r.fechaFinSoporte} editing={editing} field="fechaFinSoporte" onChange={(f, v) => handleChange("red", f, v)} />
          <Field label="Contrato que lo soporta" value={r.contratoQueSoporta} editing={editing} field="contratoQueSoporta" onChange={(f, v) => handleChange("red", f, v)} />
        </Section>
      )}

      {/* ── UPS ── */}
      {u && (
        <Section title="UPS" icon="🔋">
          <Field label="Serial" value={u.serial} editing={editing} field="serial" onChange={(f, v) => handleChange("ups", f, v)} />
          <Field label="Placa" value={u.placa} editing={editing} field="placa" onChange={(f, v) => handleChange("ups", f, v)} />
          <Field label="Modelo" value={u.modelo} editing={editing} field="modelo" onChange={(f, v) => handleChange("ups", f, v)} />
          <Field label="Estado" value={u.estado} editing={editing} field="estado" onChange={(f, v) => handleChange("ups", f, v)} />
        </Section>
      )}

      {/* ── BASE DE DATOS ── */}
      {b && (
        <Section title="Base de Datos" icon="🗄️">
          <Field label="Servidor 1" value={b.servidor1} editing={editing} field="servidor1" onChange={(f, v) => handleChange("baseDatos", f, v)} />
          <Field label="Servidor 2" value={b.servidor2} editing={editing} field="servidor2" onChange={(f, v) => handleChange("baseDatos", f, v)} />
          <Field label="RAC/Scan" value={b.racScan} editing={editing} field="racScan" onChange={(f, v) => handleChange("baseDatos", f, v)} />
          <Field label="Ambiente" value={b.ambiente} editing={editing} field="ambiente" onChange={(f, v) => handleChange("baseDatos", f, v)} />
          <Field label="Aplicación" value={b.appSoporta} editing={editing} field="appSoporta" onChange={(f, v) => handleChange("baseDatos", f, v)} />
          <Field label="Versión BD" value={b.versionBd} editing={editing} field="versionBd" onChange={(f, v) => handleChange("baseDatos", f, v)} />
          <Field label="Fecha Final Soporte" value={b.fechaFinalSoporte} editing={editing} field="fechaFinalSoporte" onChange={(f, v) => handleChange("baseDatos", f, v)} />
          <Field label="Contenedor Físico" value={b.contenedorFisico} editing={editing} field="contenedorFisico" onChange={(f, v) => handleChange("baseDatos", f, v)} />
          <Field label="Contrato que lo soporta" value={b.contratoQueSoporta} editing={editing} field="contratoQueSoporta" onChange={(f, v) => handleChange("baseDatos", f, v)} />
        </Section>
      )}

      {/* ── BITÁCORA ── */}
      <div style={{
        borderRadius: 14, overflow: "hidden",
        border: "1px solid #f0e8e8",
        boxShadow: "0 2px 12px rgba(183,49,44,.08)",
      }}>
        {/* header */}
        <div style={{
          background: C.grad, padding: "12px 20px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 14 }}>📋</span>
            <span style={{
              fontSize: 11, fontWeight: 700, letterSpacing: "0.12em",
              textTransform: "uppercase", color: "#fff",
            }}>
              Bitácora / Observaciones
            </span>
          </div>
          <button
            onClick={() => setShowObs(v => !v)}
            style={{
              padding: "7px 16px", borderRadius: 20, border: "2px solid rgba(255,255,255,.5)",
              background: "rgba(255,255,255,.12)", color: "#fff", fontWeight: 700,
              cursor: "pointer", fontSize: 12, transition: "all .2s", letterSpacing: "0.05em",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,.25)")}
            onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,.12)")}
          >
            + Agregar Observación
          </button>
        </div>

        {/* ── observation form ── */}
        {showObs && (
          <div style={{
            padding: 24, borderBottom: "1px solid #f0e8e8",
            background: "#fff",
          }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 14 }}>
              <div>
                <label style={{
                  display: "block", fontSize: 11, fontWeight: 700,
                  color: C.primary, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6,
                }}>Tu nombre</label>
                <input
                  style={inputStyle} value={obsAutor}
                  onChange={e => setObsAutor(e.target.value)} placeholder="Ej: Carlos"
                  onFocus={e => (e.currentTarget.style.borderColor = C.primary)}
                  onBlur={e => (e.currentTarget.style.borderColor = "#e0e0e0")}
                />
              </div>
              <div>
                <label style={{
                  display: "block", fontSize: 11, fontWeight: 700,
                  color: C.primary, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6,
                }}>Tipo de evento</label>
                <select
                  style={inputStyle} value={obsTipo}
                  onChange={e => setObsTipo(e.target.value as TipoEvento)}
                  onFocus={e => (e.currentTarget.style.borderColor = C.primary)}
                  onBlur={e => (e.currentTarget.style.borderColor = "#e0e0e0")}
                >
                  <option value="NOTA">Nota</option>
                  <option value="MANTENIMIENTO">Mantenimiento</option>
                  <option value="INCIDENTE">Incidente</option>
                </select>
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{
                display: "block", fontSize: 11, fontWeight: 700,
                color: C.primary, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6,
              }}>Descripción</label>
              <textarea
                style={{ ...inputStyle, resize: "vertical", minHeight: 80 }}
                value={obsDesc} onChange={e => setObsDesc(e.target.value)}
                placeholder="Describe el evento o novedad..."
                onFocus={e => (e.currentTarget.style.borderColor = C.primary)}
                onBlur={e => (e.currentTarget.style.borderColor = "#e0e0e0")}
              />
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowObs(false)}
                style={{
                  padding: "9px 20px", borderRadius: 8, border: "2px solid #e0e0e0",
                  background: "#fff", color: "#555", fontWeight: 600, cursor: "pointer", fontSize: 13,
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "#f0f0f0")}
                onMouseLeave={e => (e.currentTarget.style.background = "#fff")}
              >
                Cancelar
              </button>
              <button
                onClick={handleAddObs}
                disabled={obsLoading || !obsAutor || !obsDesc}
                style={{
                  padding: "9px 20px", borderRadius: 8, border: "none",
                  background: C.grad, color: "#fff", fontWeight: 700,
                  cursor: (obsLoading || !obsAutor || !obsDesc) ? "not-allowed" : "pointer",
                  fontSize: 13, opacity: (obsLoading || !obsAutor || !obsDesc) ? 0.6 : 1,
                }}
              >
                {obsLoading ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        )}

        {/* ── entries list ── */}
        <div style={{ padding: "20px 24px", background: "#fff" }}>
          {(asset.bitacora ?? []).length === 0 ? (
            <div style={{
              textAlign: "center", padding: "40px 20px",
              color: "#ccc", fontSize: 14,
            }}>
              <div style={{ fontSize: 36, marginBottom: 8, opacity: 0.4 }}>📋</div>
              Sin registros aún
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {(asset.bitacora ?? []).map((entry: BitacoraEntry) => {
                const ec = EVENTO_COLOR[entry.tipoEvento] ?? { bg: "#e2e3e5", color: "#383d41" };
                return (
                  <div key={entry.id} style={{
                    display: "flex", gap: 14, alignItems: "flex-start",
                    padding: "14px 16px", borderRadius: 10,
                    background: "#fafafa", border: "1px solid #f0eded",
                    transition: "box-shadow .2s",
                  }}
                    onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 2px 10px rgba(183,49,44,.08)")}
                    onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}
                  >
                    {/* left accent */}
                    <div style={{
                      width: 3, minHeight: 40, borderRadius: 2, flexShrink: 0,
                      background: C.grad,
                    }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#333" }}>{entry.autor}</span>
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: "2px 10px",
                          borderRadius: 12, textTransform: "uppercase", letterSpacing: "0.08em",
                          background: ec.bg, color: ec.color,
                        }}>
                          {EVENTO_LABEL[entry.tipoEvento]}
                        </span>
                        <span style={{ fontSize: 11, color: "#bbb", marginLeft: "auto" }}>
                          {new Date(entry.creadoEn).toLocaleString("es-CO")}
                        </span>
                      </div>
                      <p style={{ fontSize: 13, color: "#555", margin: 0, lineHeight: 1.55 }}>
                        {entry.descripcion}
                      </p>
                      {entry.campoModificado && (
                        <div style={{
                          marginTop: 8, fontSize: 11, fontFamily: "monospace",
                          background: "#fff", border: "1px solid #eee", borderRadius: 6,
                          padding: "4px 10px", display: "inline-flex", gap: 6, alignItems: "center",
                        }}>
                          <span style={{ color: "#888" }}>{entry.campoModificado}:</span>
                          <span style={{ color: "#c0392b" }}>{entry.valorAnterior || "vacío"}</span>
                          <span style={{ color: "#aaa" }}>→</span>
                          <span style={{ color: "#27ae60" }}>{entry.valorNuevo || "vacío"}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}