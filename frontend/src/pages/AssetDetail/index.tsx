import { useNavigate } from "react-router-dom";
import { Field, Section } from "./DetailComponents";
import {
  ServidorSections,
  RedSection,
  UpsSection,
  BaseDatosSection,
  VpnSection,
  MovilSection,
} from "./TypeSections";
import { BitacoraSection } from "./BitacoraSection";
import { useAssetDetail } from "./useAssetDetail";
import { C, inputStyle, labelStyle } from "./constants";

/* ═══════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════ */
export default function AssetDetail() {
  const navigate = useNavigate();
  const state = useAssetDetail();

  const {
    asset,
    editing,
    setEditing,
    saving,
    handleChange,
    handleSave,
    bitacoraFiltrada,
  } = state;

  /* ── loading state ── */
  if (!asset)
    return (
      <div
        style={{
          padding: "64px 40px",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 14,
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            border: "4px solid rgba(255,255,255,.1)",
            borderTop: "4px solid #FA8200",
            animation: "spin 1s linear infinite",
          }}
        />
        <span style={{ color: "rgba(255,255,255,.35)", fontSize: 14 }}>
          Cargando activo...
        </span>
        <style>{`@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}`}</style>
      </div>
    );

  return (
    <div
      style={{
        maxWidth: 960,
        margin: "0 auto",
        padding: "32px 24px",
        fontFamily: "Calibri, 'Segoe UI', sans-serif",
      }}
    >
      <style>{`
        @keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}
        @keyframes fadeSlide{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
      `}</style>

      {/* ── Back button ── */}
      <button
        onClick={() => navigate(-1)}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "#fff",
          fontSize: 13,
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          gap: 6,
          marginBottom: 20,
          padding: 0,
          letterSpacing: "0.03em",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#FA8200")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "#fff")}
      >
        ← Volver al listado
      </button>

      {/* ── Hero card ── */}
      <div
        style={{
          background: "#fff",
          borderRadius: 14,
          padding: "28px 32px",
          marginBottom: 24,
          boxShadow: "0 8px 32px rgba(183,49,44,.25)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              gap: 8,
              marginBottom: 10,
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                background: C.grad,
                color: "#fff",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.1em",
                padding: "4px 12px",
                borderRadius: 20,
                textTransform: "uppercase",
              }}
            >
              {asset.tipo.replace("_", " ")}
            </span>
            {asset.codigoServicio && (
              <span
                style={{
                  background: "#f0f0f0",
                  color: "#555",
                  fontSize: 11,
                  padding: "4px 12px",
                  borderRadius: 20,
                }}
              >
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
                onClick={() => {
                  setEditing(false);
                }}
                style={{
                  padding: "10px 22px",
                  borderRadius: 8,
                  border: "2px solid #e0e0e0",
                  background: "#fff",
                  color: "#555",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontSize: 14,
                  transition: "all .2s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#f0f0f0")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "#fff")
                }
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  padding: "10px 22px",
                  borderRadius: 8,
                  border: "none",
                  background: C.grad,
                  color: "#fff",
                  fontWeight: 700,
                  cursor: saving ? "not-allowed" : "pointer",
                  fontSize: 14,
                  opacity: saving ? 0.7 : 1,
                  transition: "all .2s",
                  boxShadow: "0 4px 12px rgba(183,49,44,.15)",
                }}
              >
                {saving ? "Guardando..." : "💾 Guardar"}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={async () => {
                  const motivo = window.prompt(`¿Por qué deshabilitas "${asset.nombre}"?\n(Escribe el motivo)`);
                  if (motivo === null) return;
                  if (!motivo.trim()) {
                    alert("El motivo es obligatorio");
                    return;
                  }
                  const { deleteAsset } = await import("../../api/client");
                  await deleteAsset(asset.id, motivo);
                  navigate(-1);
                }}
                style={{
                  padding: "10px 22px",
                  borderRadius: 8,
                  border: "2px solid #f5c6c6",
                  background: "#fff",
                  color: "#c0392b",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontSize: 14,
                }}
              >
                🗑 Eliminar
              </button>

              {asset.tipo === "MOVIL" && (
  <button onClick={async () => {
    const { descargarWordMovil } = await import("../../api/client");
    await descargarWordMovil(asset.id);
  }} style={{
    padding: "10px 22px", borderRadius: 8, border: "none",
    background: C.grad, color: "#fff", fontWeight: 700,
    cursor: "pointer", fontSize: 14,
  }}>
    📄 Descargar Formato
  </button>
)}

              <button
                onClick={() => setEditing(true)}
                style={{
                  padding: "10px 22px",
                  borderRadius: 8,
                  border: "none",
                  background: C.grad,
                  color: "#fff",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontSize: 14,
                  transition: "all .2s",
                  boxShadow: "0 4px 12px rgba(183,49,44,.15)",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.transform = "translateY(-2px)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.transform = "translateY(0)")
                }
              >
                ✏️ Editar
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Información General ── */}
      <Section title="Información General" icon="🏷️">
        <Field
          label="Nombre"
          value={asset.nombre}
          editing={editing}
          field="nombre"
          onChange={(f, v) => handleChange(null, f, v)}
        />
        <Field
          label="Ubicación"
          value={asset.ubicacion}
          editing={editing}
          field="ubicacion"
          onChange={(f, v) => handleChange(null, f, v)}
        />
        <Field
          label="Propietario"
          value={asset.propietario}
          editing={editing}
          field="propietario"
          onChange={(f, v) => handleChange(null, f, v)}
        />
        <Field
          label="Custodio"
          value={asset.custodio}
          editing={editing}
          field="custodio"
          onChange={(f, v) => handleChange(null, f, v)}
        />
        <Field
          label="Código de Servicio"
          value={asset.codigoServicio}
          editing={editing}
          field="codigoServicio"
          onChange={(f, v) => handleChange(null, f, v)}
        />
      </Section>

      {/* ── Secciones por tipo de activo ── */}
      <ServidorSections
        asset={asset}
        editing={editing}
        handleChange={handleChange}
      />
      <RedSection
        asset={asset}
        editing={editing}
        handleChange={handleChange}
      />
      <UpsSection
        asset={asset}
        editing={editing}
        handleChange={handleChange}
      />
      <BaseDatosSection
        asset={asset}
        editing={editing}
        handleChange={handleChange}
      />
      <VpnSection
        asset={asset}
        editing={editing}
        handleChange={handleChange}
      />
      <MovilSection
        asset={asset}
        editing={editing}
        handleChange={handleChange}
      />

      {/* ── Bitácora ── */}
      <BitacoraSection
        bitacora={asset.bitacora}
        bitacoraFiltrada={bitacoraFiltrada}
        hayFiltros={state.hayFiltros}
        showObs={state.showObs}
        setShowObs={state.setShowObs}
        obsTipo={state.obsTipo}
        setObsTipo={state.setObsTipo}
        obsDesc={state.obsDesc}
        setObsDesc={state.setObsDesc}
        obsLoading={state.obsLoading}
        fTipo={state.fTipo}
        setFTipo={state.setFTipo}
        fAutor={state.fAutor}
        setFAutor={state.setFAutor}
        fDesde={state.fDesde}
        setFDesde={state.setFDesde}
        fHasta={state.fHasta}
        setFHasta={state.setFHasta}
        exporting={state.exporting}
        autoresUnicos={state.autoresUnicos}
        handleAddObs={state.handleAddObs}
        handleExportExcel={state.handleExportExcel}
        handleExportPDF={state.handleExportPDF}
        limpiarFiltros={state.limpiarFiltros}
        inputStyle={inputStyle}
        labelStyle={labelStyle}
      />
    </div>
  );
}