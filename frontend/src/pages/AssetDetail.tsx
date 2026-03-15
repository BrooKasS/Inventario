import { useEffect, useState, useMemo } from "react";
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

const EVENTO_LABEL: Record<string, string> = {
  IMPORTACION: "Importación",
  CAMBIO_CAMPO: "Cambio de campo",
  MANTENIMIENTO: "Mantenimiento",
  INCIDENTE: "Incidente",
  NOTA: "Nota",
};

const EVENTO_COLOR: Record<string, { bg: string; color: string }> = {
  IMPORTACION:  { bg: "#e0f0ff", color: "#0c5460" },
  CAMBIO_CAMPO: { bg: "#fff3cd", color: "#856404" },
  MANTENIMIENTO:{ bg: "#d4edda", color: "#155724" },
  INCIDENTE:    { bg: "#f8d7da", color: "#721c24" },
  NOTA:         { bg: "#e2e3e5", color: "#383d41" },
};

/* ══════════════════════════════════════════
   EXPORT HELPERS
══════════════════════════════════════════ */

/** Formatea fecha para nombre de archivo */
function fechaArchivo() {
  return new Date().toISOString().slice(0, 10);
}

/** Prepara filas para export */
function prepararFilas(entries: BitacoraEntry[]) {
  return entries.map(e => ({
    Fecha:             new Date(e.creadoEn).toLocaleString("es-CO"),
    Autor:             e.autor,
    "Tipo de evento":  EVENTO_LABEL[e.tipoEvento] ?? e.tipoEvento,
    Descripción:       e.descripcion,
    "Campo modificado":e.campoModificado ?? "",
    "Valor anterior":  e.valorAnterior   ?? "",
    "Valor nuevo":     e.valorNuevo      ?? "",
  }));
}

/** Export a Excel usando SheetJS (xlsx) — instalado vía npm */
async function exportarExcel(entries: BitacoraEntry[], nombreActivo: string) {
  // Importación dinámica para no bloquear el bundle inicial
  const XLSX = await import("xlsx");
  const filas = prepararFilas(entries);
  const ws    = XLSX.utils.json_to_sheet(filas);

  /* Ancho de columnas */
  ws["!cols"] = [
    { wch: 22 }, // Fecha
    { wch: 18 }, // Autor
    { wch: 18 }, // Tipo
    { wch: 50 }, // Descripción
    { wch: 20 }, // Campo
    { wch: 20 }, // Anterior
    { wch: 20 }, // Nuevo
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Bitácora");
  XLSX.writeFile(wb, `Bitacora_${nombreActivo}_${fechaArchivo()}.xlsx`);
}

/** Export a PDF usando jsPDF + autoTable */
async function exportarPDF(
  entries: BitacoraEntry[],
  asset: Asset,
) {
  const { default: jsPDF }   = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc  = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const nombre = asset.nombre ?? "Activo";
  const tipo   = asset.tipo.replace("_", " ");

  /* ── Encabezado ── */
  // Fondo degradado simulado con rectángulos
  doc.setFillColor(134, 31, 65);   // #861F41
  doc.rect(0, 0, 297, 28, "F");
  doc.setFillColor(250, 130, 0);   // #FA8200
  doc.rect(0, 0, 60, 28, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("BITÁCORA DE ACTIVO", 14, 11);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`${tipo}  ·  ${nombre}`, 14, 18);
  if (asset.ubicacion) doc.text(`📍 ${asset.ubicacion}`, 14, 24);

  doc.setFontSize(9);
  doc.text(`Generado: ${new Date().toLocaleString("es-CO")}`, 297 - 14, 18, { align: "right" });
  doc.text(`${entries.length} registro(s)`, 297 - 14, 24, { align: "right" });

  /* ── Tabla ── */
  const filas = entries.map(e => [
    new Date(e.creadoEn).toLocaleString("es-CO"),
    e.autor,
    EVENTO_LABEL[e.tipoEvento] ?? e.tipoEvento,
    e.descripcion,
    e.campoModificado ?? "—",
    e.valorAnterior   ?? "—",
    e.valorNuevo      ?? "—",
  ]);

  autoTable(doc, {
    startY: 32,
    head: [["Fecha", "Autor", "Tipo", "Descripción", "Campo", "Valor anterior", "Valor nuevo"]],
    body: filas,
    styles: {
      font: "helvetica",
      fontSize: 8,
      cellPadding: 3,
      overflow: "linebreak",
    },
    headStyles: {
      fillColor: [183, 49, 44],   // #B7312C
      textColor: 255,
      fontStyle: "bold",
      fontSize: 8,
    },
    alternateRowStyles: { fillColor: [253, 248, 248] },
    columnStyles: {
      0: { cellWidth: 32 },
      1: { cellWidth: 22 },
      2: { cellWidth: 24 },
      3: { cellWidth: 80 },
      4: { cellWidth: 28 },
      5: { cellWidth: 30 },
      6: { cellWidth: 30 },
    },
    didDrawPage: (data: any) => {
      /* pie de página */
      const pageCount = (doc as any).internal.getNumberOfPages();
      doc.setFontSize(7);
      doc.setTextColor(160);
      doc.text(
        `Página ${data.pageNumber} de ${pageCount}  ·  Inventario TI`,
        297 / 2, 210 - 5,
        { align: "center" }
      );
    },
  });

  doc.save(`Bitacora_${nombre}_${fechaArchivo()}.pdf`);
}

/* ══════════════════════════════════════════
   SUB-COMPONENTS
══════════════════════════════════════════ */

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

/* Botón de export reutilizable */
function ExportBtn({
  label, emoji, onClick, disabled,
}: {
  label: string; emoji: string; onClick: () => void; disabled?: boolean;
}) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "7px 14px", borderRadius: 8,
        border: "1.5px solid rgba(255,255,255,.4)",
        background: hov && !disabled ? "rgba(255,255,255,.25)" : "rgba(255,255,255,.12)",
        color: disabled ? "rgba(255,255,255,.3)" : "#fff",
        fontWeight: 700, fontSize: 12, cursor: disabled ? "not-allowed" : "pointer",
        fontFamily: "Calibri, sans-serif", transition: "all .18s",
        opacity: disabled ? 0.5 : 1,
        letterSpacing: "0.03em",
      }}
    >
      <span>{emoji}</span>
      <span>{label}</span>
    </button>
  );
}

/* Input de filtro inline */
function FiltroInput({
  value, onChange, placeholder,
}: {
  value: string; onChange: (v: string) => void; placeholder: string;
}) {
  return (
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        padding: "7px 12px", border: "1.5px solid #e8d8d8",
        borderRadius: 8, fontSize: 13, fontFamily: "Calibri, sans-serif",
        outline: "none", background: "#fff", color: "#333",
        transition: "border-color .2s", minWidth: 0, width: "100%",
      }}
      onFocus={e => (e.currentTarget.style.borderColor = C.primary)}
      onBlur={e => (e.currentTarget.style.borderColor = "#e8d8d8")}
    />
  );
}

/* ══════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════ */
export default function AssetDetail() {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();

  /* ── asset state ── */
  const [asset,   setAsset]   = useState<Asset | null>(null);
  const [editing, setEditing] = useState(false);
  const [changes, setChanges] = useState<Record<string, any>>({});
  const [saving,  setSaving]  = useState(false);

  /* ── nueva observación ── */
  const [showObs,    setShowObs]    = useState(false);
  const [obsAutor,   setObsAutor]   = useState("");
  const [obsTipo,    setObsTipo]    = useState<TipoEvento>("NOTA");
  const [obsDesc,    setObsDesc]    = useState("");
  const [obsLoading, setObsLoading] = useState(false);

  /* ── filtros de bitácora ── */
  const [fTipo,   setFTipo]   = useState<string>("");   // "" = todos
  const [fAutor,  setFAutor]  = useState("");
  const [fDesde,  setFDesde]  = useState("");
  const [fHasta,  setFHasta]  = useState("");

  /* ── export loading ── */
  const [exporting, setExporting] = useState<"excel" | "pdf" | null>(null);

  const load = () => { if (id) getAssetById(id).then(setAsset); };
  useEffect(() => { load(); }, [id]);

  /* ── bitácora filtrada (memo para no recalcular en cada render) ── */
  const bitacoraFiltrada = useMemo(() => {
    const entries = asset?.bitacora ?? [];
    return entries.filter(e => {
      /* tipo */
      if (fTipo && e.tipoEvento !== fTipo) return false;
      /* autor (case-insensitive, parcial) */
      if (fAutor && !e.autor.toLowerCase().includes(fAutor.toLowerCase())) return false;
      /* rango de fechas */
      const fecha = new Date(e.creadoEn);
      if (fDesde) {
        const desde = new Date(fDesde);
        desde.setHours(0, 0, 0, 0);
        if (fecha < desde) return false;
      }
      if (fHasta) {
        const hasta = new Date(fHasta);
        hasta.setHours(23, 59, 59, 999);
        if (fecha > hasta) return false;
      }
      return true;
    });
  }, [asset?.bitacora, fTipo, fAutor, fDesde, fHasta]);

  const hayFiltros = !!(fTipo || fAutor || fDesde || fHasta);

  const limpiarFiltros = () => {
    setFTipo(""); setFAutor(""); setFDesde(""); setFHasta("");
  };

  /* ── handlers ── */
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
      setShowObs(false); setObsAutor(""); setObsDesc(""); setObsTipo("NOTA");
      load();
    } finally { setObsLoading(false); }
  };

  /* ── export handlers ── */
  const handleExportExcel = async () => {
    if (!asset) return;
    setExporting("excel");
    try { await exportarExcel(bitacoraFiltrada, asset.nombre ?? "Activo"); }
    catch (err) { console.error("Error exportando Excel:", err); alert("Error al generar Excel"); }
    finally { setExporting(null); }
  };

  const handleExportPDF = async () => {
    if (!asset) return;
    setExporting("pdf");
    try { await exportarPDF(bitacoraFiltrada, asset); }
    catch (err) { console.error("Error exportando PDF:", err); alert("Error al generar PDF"); }
    finally { setExporting(null); }
  };

  /* ── loading state ── */
  if (!asset) return (
    <div style={{
      padding: "64px 40px", textAlign: "center",
      display: "flex", flexDirection: "column", alignItems: "center", gap: 14,
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: "50%",
        border: "4px solid rgba(255,255,255,.1)",
        borderTop: "4px solid #FA8200",
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
  const v = asset.vpn;

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 14px", border: "2px solid #e0e0e0",
    borderRadius: 8, fontSize: 14, fontFamily: "Calibri, sans-serif",
    transition: "border-color .2s", outline: "none",
    background: "#fff", color: "#333",
  };

  const labelStyle: React.CSSProperties = {
    display: "block", fontSize: 11, fontWeight: 700,
    color: C.primary, letterSpacing: "0.1em",
    textTransform: "uppercase", marginBottom: 6,
  };

  /* ── autores únicos para el datalist ── */
  const autoresUnicos = Array.from(
    new Set((asset.bitacora ?? []).map(e => e.autor))
  ).sort();

  return (
    <div style={{
      maxWidth: 960, margin: "0 auto", padding: "32px 24px",
      fontFamily: "Calibri, 'Segoe UI', sans-serif",
    }}>
      <style>{`
        @keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}
        @keyframes fadeSlide{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
      `}</style>

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
          <h1 style={{ color: "#333", fontSize: 28, fontWeight: 700, margin: 0 }}>
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
        <Field label="Nombre"            value={asset.nombre}         editing={editing} field="nombre"         onChange={(f, v) => handleChange(null, f, v)} />
        <Field label="Ubicación"         value={asset.ubicacion}      editing={editing} field="ubicacion"      onChange={(f, v) => handleChange(null, f, v)} />
        <Field label="Propietario"       value={asset.propietario}    editing={editing} field="propietario"    onChange={(f, v) => handleChange(null, f, v)} />
        <Field label="Custodio"          value={asset.custodio}       editing={editing} field="custodio"       onChange={(f, v) => handleChange(null, f, v)} />
        <Field label="Código de Servicio" value={asset.codigoServicio} editing={editing} field="codigoServicio" onChange={(f, v) => handleChange(null, f, v)} />
      </Section>

      {/* ── SERVIDOR ── */}
      {s && (
        <>
          <Section title="Red" icon="🌐">
            <Field label="IP Interna"  value={s.ipInterna}  editing={editing} field="ipInterna"  onChange={(f, v) => handleChange("servidor", f, v)} />
            <Field label="IP Gestión"  value={s.ipGestion}  editing={editing} field="ipGestion"  onChange={(f, v) => handleChange("servidor", f, v)} />
            <Field label="IP Servicio" value={s.ipServicio} editing={editing} field="ipServicio" onChange={(f, v) => handleChange("servidor", f, v)} />
          </Section>
          <Section title="Recursos" icon="⚙️">
            <Field label="vCPU"              value={s.vcpu}            editing={editing} field="vcpu"            onChange={(f, v) => handleChange("servidor", f, v)} />
            <Field label="vRAM (MB)"         value={s.Mb}          editing={editing} field="vramMb"          onChange={(f, v) => handleChange("servidor", f, v)} />
            <Field label="Sistema Operativo" value={s.sistemaOperativo} editing={editing} field="sistemaOperativo" onChange={(f, v) => handleChange("servidor", f, v)} />
          </Section>
          <Section title="Operación" icon="🔧">
            <Field label="Ambiente"              value={s.ambiente}           editing={editing} field="ambiente"           onChange={(f, v) => handleChange("servidor", f, v)} />
            <Field label="Tipo Servidor"         value={s.tipoServidor}       editing={editing} field="tipoServidor"       onChange={(f, v) => handleChange("servidor", f, v)} />
            <Field label="Aplicación que soporta" value={s.appSoporta}        editing={editing} field="appSoporta"         onChange={(f, v) => handleChange("servidor", f, v)} />
            <Field label="Monitoreo"             value={s.monitoreo}          editing={editing} field="monitoreo"          onChange={(f, v) => handleChange("servidor", f, v)} />
            <Field label="Backup"                value={s.backup}             editing={editing} field="backup"             onChange={(f, v) => handleChange("servidor", f, v)} />
            <Field label="Rutas de Backup"       value={s.rutasBackup}        editing={editing} field="rutasBackup"        onChange={(f, v) => handleChange("servidor", f, v)} />
            <Field label="Fecha Fin Soporte"     value={s.fechaFinSoporte}    editing={editing} field="fechaFinSoporte"    onChange={(f, v) => handleChange("servidor", f, v)} />
            <Field label="Contrato que lo soporta" value={s.contratoQueSoporta} editing={editing} field="contratoQueSoporta" onChange={(f, v) => handleChange("servidor", f, v)} />
          </Section>
        </>
      )}

      {/* ── RED ── */}
      {r && (
        <Section title="Equipo de Red" icon="🔌">
          <Field label="Serial"                value={r.serial}             editing={editing} field="serial"             onChange={(f, v) => handleChange("red", f, v)} />
          <Field label="MAC"                   value={r.mac}                editing={editing} field="mac"                onChange={(f, v) => handleChange("red", f, v)} />
          <Field label="Modelo"                value={r.modelo}             editing={editing} field="modelo"             onChange={(f, v) => handleChange("red", f, v)} />
          <Field label="IP Gestión"            value={r.ipGestion}          editing={editing} field="ipGestion"          onChange={(f, v) => handleChange("red", f, v)} />
          <Field label="Estado"                value={r.estado}             editing={editing} field="estado"             onChange={(f, v) => handleChange("red", f, v)} />
          <Field label="Fecha Fin Soporte"     value={r.fechaFinSoporte}    editing={editing} field="fechaFinSoporte"    onChange={(f, v) => handleChange("red", f, v)} />
          <Field label="Contrato que lo soporta" value={r.contratoQueSoporta} editing={editing} field="contratoQueSoporta" onChange={(f, v) => handleChange("red", f, v)} />
        </Section>
      )}

      {/* ── UPS ── */}
      {u && (
        <Section title="UPS" icon="🔋">
          <Field label="Serial" value={u.serial} editing={editing} field="serial" onChange={(f, v) => handleChange("ups", f, v)} />
          <Field label="Placa"  value={u.placa}  editing={editing} field="placa"  onChange={(f, v) => handleChange("ups", f, v)} />
          <Field label="Modelo" value={u.modelo} editing={editing} field="modelo" onChange={(f, v) => handleChange("ups", f, v)} />
          <Field label="Estado" value={u.estado} editing={editing} field="estado" onChange={(f, v) => handleChange("ups", f, v)} />
        </Section>
      )}

      {/* ── BASE DE DATOS ── */}
      {b && (
        <Section title="Base de Datos" icon="🗄️">
          <Field label="Servidor 1"            value={b.servidor1}          editing={editing} field="servidor1"          onChange={(f, v) => handleChange("baseDatos", f, v)} />
          <Field label="Servidor 2"            value={b.servidor2}          editing={editing} field="servidor2"          onChange={(f, v) => handleChange("baseDatos", f, v)} />
          <Field label="RAC/Scan"              value={b.racScan}            editing={editing} field="racScan"            onChange={(f, v) => handleChange("baseDatos", f, v)} />
          <Field label="Ambiente"              value={b.ambiente}           editing={editing} field="ambiente"           onChange={(f, v) => handleChange("baseDatos", f, v)} />
          <Field label="Aplicación"            value={b.appSoporta}         editing={editing} field="appSoporta"         onChange={(f, v) => handleChange("baseDatos", f, v)} />
          <Field label="Versión BD"            value={b.versionBd}          editing={editing} field="versionBd"          onChange={(f, v) => handleChange("baseDatos", f, v)} />
          <Field label="Fecha Final Soporte"   value={b.fechaFinalSoporte}  editing={editing} field="fechaFinalSoporte"  onChange={(f, v) => handleChange("baseDatos", f, v)} />
          <Field label="Contenedor Físico"     value={b.contenedorFisico}   editing={editing} field="contenedorFisico"   onChange={(f, v) => handleChange("baseDatos", f, v)} />
          <Field label="Contrato que lo soporta" value={b.contratoQueSoporta} editing={editing} field="contratoQueSoporta" onChange={(f, v) => handleChange("baseDatos", f, v)} />
        </Section>
      )}

{/* ── VPN ── */}
{v && (
  <Section title="VPN" icon="🔒">
    <Field label="Conexión" value={v.conexion} editing={editing} field="conexion" onChange={(f, val) => handleChange("vpn", f, val)} />
    <Field label="Fases"    value={v.fases}    editing={editing} field="fases"    onChange={(f, val) => handleChange("vpn", f, val)} />
    <Field label="Origen"   value={v.origen}   editing={editing} field="origen"   onChange={(f, val) => handleChange("vpn", f, val)} />
    <Field label="Destino"  value={v.destino}  editing={editing} field="destino"  onChange={(f, val) => handleChange("vpn", f, val)} />
  </Section>
)}
      {/* ══════════════════════════════════════════
          BITÁCORA
      ══════════════════════════════════════════ */}
      <div style={{
        borderRadius: 14, overflow: "hidden",
        border: "1px solid #f0e8e8",
        boxShadow: "0 2px 12px rgba(183,49,44,.08)",
      }}>

        {/* ── Header principal ── */}
        <div style={{
          background: C.grad, padding: "12px 20px",
          display: "flex", justifyContent: "space-between",
          alignItems: "center", flexWrap: "wrap", gap: 10,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 14 }}>📋</span>
            <span style={{
              fontSize: 11, fontWeight: 700, letterSpacing: "0.12em",
              textTransform: "uppercase", color: "#fff",
            }}>
              Bitácora / Observaciones
            </span>
            {/* contador */}
            <span style={{
              background: "rgba(255,255,255,.2)", color: "#fff",
              fontSize: 10, fontWeight: 700, padding: "2px 8px",
              borderRadius: 20, letterSpacing: "0.05em",
            }}>
              {hayFiltros
                ? `${bitacoraFiltrada.length} de ${asset.bitacora?.length ?? 0}`
                : `${asset.bitacora?.length ?? 0} registros`}
            </span>
          </div>

          {/* botones: exports + agregar */}
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <ExportBtn
              emoji="📊"
              label={exporting === "excel" ? "Generando..." : "Excel"}
              disabled={bitacoraFiltrada.length === 0 || exporting !== null}
              onClick={handleExportExcel}
            />
            <ExportBtn
              emoji="📄"
              label={exporting === "pdf" ? "Generando..." : "PDF"}
              disabled={bitacoraFiltrada.length === 0 || exporting !== null}
              onClick={handleExportPDF}
            />
            <div style={{ width: 1, height: 24, background: "rgba(255,255,255,.25)" }} />
            <button
              onClick={() => setShowObs(v => !v)}
              style={{
                padding: "7px 16px", borderRadius: 20,
                border: "2px solid rgba(255,255,255,.5)",
                background: showObs ? "rgba(255,255,255,.25)" : "rgba(255,255,255,.12)",
                color: "#fff", fontWeight: 700,
                cursor: "pointer", fontSize: 12, transition: "all .2s",
                letterSpacing: "0.05em",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,.25)")}
              onMouseLeave={e => (e.currentTarget.style.background = showObs ? "rgba(255,255,255,.25)" : "rgba(255,255,255,.12)")}
            >
              + Agregar Observación
            </button>
          </div>
        </div>

        {/* ── Barra de filtros ── */}
        <div style={{
          background: "#fdf5f5",
          borderBottom: "1px solid #f0e0e0",
          padding: "14px 20px",
        }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 140px 140px auto",
            gap: "10px 12px",
            alignItems: "end",
          }}>
            {/* Tipo de evento */}
            <div>
              <label style={{ ...labelStyle, fontSize: 10, marginBottom: 5 }}>Tipo de evento</label>
              <select
                value={fTipo}
                onChange={e => setFTipo(e.target.value)}
                style={{
                  width: "100%", padding: "7px 10px",
                  border: "1.5px solid #e8d8d8", borderRadius: 8,
                  fontSize: 13, fontFamily: "Calibri, sans-serif",
                  background: "#fff", color: fTipo ? "#333" : "#999",
                  outline: "none", cursor: "pointer",
                }}
              >
                <option value="">Todos los tipos</option>
                <option value="NOTA">Nota</option>
                <option value="MANTENIMIENTO">Mantenimiento</option>
                <option value="INCIDENTE">Incidente</option>
                <option value="CAMBIO_CAMPO">Cambio de campo</option>
                <option value="IMPORTACION">Importación</option>
              </select>
            </div>

            {/* Autor */}
            <div>
              <label style={{ ...labelStyle, fontSize: 10, marginBottom: 5 }}>Autor</label>
              <datalist id="autores-list">
                {autoresUnicos.map(a => <option key={a} value={a} />)}
              </datalist>
              <input
                list="autores-list"
                value={fAutor}
                onChange={e => setFAutor(e.target.value)}
                placeholder="Todos los autores..."
                style={{
                  width: "100%", padding: "7px 12px",
                  border: "1.5px solid #e8d8d8", borderRadius: 8,
                  fontSize: 13, fontFamily: "Calibri, sans-serif",
                  background: "#fff", color: "#333",
                  outline: "none", boxSizing: "border-box",
                }}
                onFocus={e => (e.currentTarget.style.borderColor = C.primary)}
                onBlur={e => (e.currentTarget.style.borderColor = "#e8d8d8")}
              />
            </div>

            {/* Desde */}
            <div>
              <label style={{ ...labelStyle, fontSize: 10, marginBottom: 5 }}>Desde</label>
              <input
                type="date"
                value={fDesde}
                onChange={e => setFDesde(e.target.value)}
                style={{
                  width: "100%", padding: "7px 10px",
                  border: "1.5px solid #e8d8d8", borderRadius: 8,
                  fontSize: 13, fontFamily: "Calibri, sans-serif",
                  background: "#fff", color: "#333", outline: "none",
                  boxSizing: "border-box",
                }}
                onFocus={e => (e.currentTarget.style.borderColor = C.primary)}
                onBlur={e => (e.currentTarget.style.borderColor = "#e8d8d8")}
              />
            </div>

            {/* Hasta */}
            <div>
              <label style={{ ...labelStyle, fontSize: 10, marginBottom: 5 }}>Hasta</label>
              <input
                type="date"
                value={fHasta}
                onChange={e => setFHasta(e.target.value)}
                style={{
                  width: "100%", padding: "7px 10px",
                  border: "1.5px solid #e8d8d8", borderRadius: 8,
                  fontSize: 13, fontFamily: "Calibri, sans-serif",
                  background: "#fff", color: "#333", outline: "none",
                  boxSizing: "border-box",
                }}
                onFocus={e => (e.currentTarget.style.borderColor = C.primary)}
                onBlur={e => (e.currentTarget.style.borderColor = "#e8d8d8")}
              />
            </div>

            {/* Limpiar */}
            <div>
              {hayFiltros && (
                <button
                  onClick={limpiarFiltros}
                  style={{
                    padding: "7px 14px", borderRadius: 8,
                    border: "1.5px solid #e0c8c8",
                    background: "#fff", color: C.primary,
                    fontWeight: 700, fontSize: 12, cursor: "pointer",
                    fontFamily: "Calibri, sans-serif",
                    transition: "all .18s", whiteSpace: "nowrap",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#fff0ee")}
                  onMouseLeave={e => (e.currentTarget.style.background = "#fff")}
                >
                  ✕ Limpiar
                </button>
              )}
            </div>
          </div>

          {/* Indicador de filtros activos */}
          {hayFiltros && (
            <div style={{
              marginTop: 10, fontSize: 11, color: "#888",
              fontFamily: "Calibri, sans-serif",
            }}>
              Mostrando <strong style={{ color: C.primary }}>{bitacoraFiltrada.length}</strong> de{" "}
              <strong>{asset.bitacora?.length ?? 0}</strong> registros
              {fTipo && <> · Tipo: <strong>{EVENTO_LABEL[fTipo]}</strong></>}
              {fAutor && <> · Autor: <strong>{fAutor}</strong></>}
              {fDesde && <> · Desde: <strong>{fDesde}</strong></>}
              {fHasta && <> · Hasta: <strong>{fHasta}</strong></>}
            </div>
          )}
        </div>

        {/* ── Formulario nueva observación ── */}
        {showObs && (
          <div style={{
            padding: 24, borderBottom: "1px solid #f0e8e8",
            background: "#fff", animation: "fadeSlide .2s ease",
          }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 14 }}>
              <div>
                <label style={labelStyle}>Tu nombre</label>
                <input
                  style={inputStyle} value={obsAutor}
                  onChange={e => setObsAutor(e.target.value)}
                  placeholder="Ej: Juan Pérez"
                  onFocus={e => (e.currentTarget.style.borderColor = C.primary)}
                  onBlur={e => (e.currentTarget.style.borderColor = "#e0e0e0")}
                />
              </div>
              <div>
                <label style={labelStyle}>Tipo de evento</label>
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
              <label style={labelStyle}>Descripción</label>
              <textarea
                style={{ ...inputStyle, resize: "vertical", minHeight: 80 }}
                value={obsDesc}
                onChange={e => setObsDesc(e.target.value)}
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
                  background: "#fff", color: "#555", fontWeight: 600,
                  cursor: "pointer", fontSize: 13,
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
                  fontSize: 13,
                  opacity: (obsLoading || !obsAutor || !obsDesc) ? 0.6 : 1,
                }}
              >
                {obsLoading ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        )}

        {/* ── Lista de entradas ── */}
        <div style={{ padding: "20px 24px", background: "#fff" }}>
          {bitacoraFiltrada.length === 0 ? (
            <div style={{
              textAlign: "center", padding: "40px 20px",
              color: "#ccc", fontSize: 14,
            }}>
              <div style={{ fontSize: 36, marginBottom: 8, opacity: 0.4 }}>
                {hayFiltros ? "🔍" : "📋"}
              </div>
              {hayFiltros
                ? "Ningún registro coincide con los filtros aplicados"
                : "Sin registros aún"}
              {hayFiltros && (
                <div style={{ marginTop: 12 }}>
                  <button
                    onClick={limpiarFiltros}
                    style={{
                      padding: "7px 16px", borderRadius: 8,
                      border: `1.5px solid ${C.primary}`,
                      background: "#fff", color: C.primary,
                      fontWeight: 700, fontSize: 12,
                      cursor: "pointer", fontFamily: "Calibri, sans-serif",
                    }}
                  >
                    Limpiar filtros
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {bitacoraFiltrada.map((entry: BitacoraEntry) => {
                const ec = EVENTO_COLOR[entry.tipoEvento] ?? { bg: "#e2e3e5", color: "#383d41" };
                return (
                  <div
                    key={entry.id}
                    style={{
                      display: "flex", gap: 14, alignItems: "flex-start",
                      padding: "14px 16px", borderRadius: 10,
                      background: "#fafafa", border: "1px solid #f0eded",
                      transition: "box-shadow .2s",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 2px 10px rgba(183,49,44,.08)")}
                    onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}
                  >
                    {/* acento lateral */}
                    <div style={{
                      width: 3, minHeight: 40, borderRadius: 2,
                      flexShrink: 0, background: C.grad,
                    }} />
                    <div style={{ flex: 1 }}>
                      <div style={{
                        display: "flex", flexWrap: "wrap",
                        gap: 8, alignItems: "center", marginBottom: 6,
                      }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#333" }}>
                          {entry.autor}
                        </span>
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: "2px 10px",
                          borderRadius: 12, textTransform: "uppercase",
                          letterSpacing: "0.08em",
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
                          background: "#fff", border: "1px solid #eee",
                          borderRadius: 6, padding: "4px 10px",
                          display: "inline-flex", gap: 6, alignItems: "center",
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