import { useNavigate } from "react-router-dom";
import { getRol } from "../../api/auth";
import { Field, Section } from "./DetailComponents";
import { OcsSoftwareSection } from "./OcsSoftwareSection";
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
import { useState } from "react";

type EstadoMovil =
  | "PENDIENTE_ENTREGA"
  | "ENTREGADO"
  | "DEVOLUCION"
  | "PENDIENTE_DEVOLUCION"
  | "DEVUELTO";

type MovilActionKind = "firmar_entrega" | "cambio_manual" | "firmar_devolucion" | "finalizado" | "sin_accion";

function getNextManualMovilState(estado?: string | null): EstadoMovil | null {
  switch (estado) {
    case "ENTREGADO":
      return "DEVOLUCION";
    case "DEVOLUCION":
      return "PENDIENTE_DEVOLUCION";
    default:
      return null;
  }
}

function getMovilAction(estado?: string | null): { kind: MovilActionKind; label: string } {
  switch (estado) {
    case "PENDIENTE_ENTREGA":
      return { kind: "firmar_entrega", label: "Firmar entrega presencialmente" };
    case "ENTREGADO":
      return { kind: "cambio_manual", label: "Solicitar devolucion" };
    case "DEVOLUCION":
      return { kind: "cambio_manual", label: "Enviar a firma de devolucion" };
    case "PENDIENTE_DEVOLUCION":
      return { kind: "firmar_devolucion", label: "Firmar devolucion presencialmente" };
    case "DEVUELTO":
      return { kind: "finalizado", label: "Proceso completado" };
    default:
      return { kind: "sin_accion", label: "Sin accion disponible" };
  }
}

function getEstadoColor(estado?: string | null) {
  switch (estado) {
    case "PENDIENTE_ENTREGA":
      return { color: "#3498db", background: "#3498db20" };
    case "ENTREGADO":
      return { color: "#2ecc71", background: "#2ecc7120" };
    case "DEVOLUCION":
      return { color: "#e67e22", background: "#e67e2220" };
    case "PENDIENTE_DEVOLUCION":
      return { color: "#f1c40f", background: "#f1c40f20" };
    case "DEVUELTO":
      return { color: "#27ae60", background: "#27ae6020" };
    default:
      return { color: "#7f8c8d", background: "#7f8c8d20" };
  }
}

function getManualChangeMessage(estado?: string | null) {
  switch (estado) {
    case "ENTREGADO":
      return "Se enviara un aviso de devolucion al responsable.";
    case "DEVOLUCION":
      return "Se enviara el link para firma de devolucion al responsable.";
    default:
      return "Este estado no permite cambio manual.";
  }
}

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

  const rol = getRol();
  const [loadingEstado, setLoadingEstado] = useState(false);
  const [confirmandoEstado, setConfirmandoEstado] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!asset) {
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
  }

  const estadoMovil = asset.movil?.estados as EstadoMovil | null | undefined;
  const movilAction = getMovilAction(estadoMovil);
  const nextManualState = getNextManualMovilState(estadoMovil);
  const estadoStyle = getEstadoColor(estadoMovil);
  const nextEstadoStyle = getEstadoColor(nextManualState);
  const canShowMovilAction = asset.tipo === "MOVIL" && movilAction.kind !== "finalizado" && movilAction.kind !== "sin_accion";
  const canConfirmManualState = movilAction.kind === "cambio_manual" && !!nextManualState;

  async function handleDelete() {
    if (!asset) return;
    const motivo = window.prompt(
      `Por que deshabilitas "${asset.nombre}"?\nEscribe el motivo.`
    );

    if (motivo === null) return;
    if (!motivo.trim()) {
      alert("El motivo es obligatorio");
      return;
    }

    try {
      setDeleting(true);
      const { deleteAsset } = await import("../../api/client");
      await deleteAsset(asset.id, motivo.trim());
      navigate(-1);
    } catch (error: any) {
      console.error(error);
      const msg = error?.response?.data?.error || error?.message || "Error deshabilitando activo";
      alert(msg);
    } finally {
      setDeleting(false);
    }
  }

  async function handleMovilAction() {
    if (!asset) return; 
    if (loadingEstado) return;

    if (movilAction.kind === "firmar_entrega") {
      window.open(`/firmar/${asset.id}`, "_blank", "noopener,noreferrer");
      return;
    }

    if (movilAction.kind === "firmar_devolucion") {
      window.open(`/firmar-devolucion/${asset.id}`, "_blank", "noopener,noreferrer");
      return;
    }

    if (movilAction.kind === "cambio_manual") {
      setConfirmandoEstado(true);
    }
  }

  async function confirmarCambioEstadoMovil() {
    if (loadingEstado || !canConfirmManualState) return;

    try {
      if (!asset) return;
      setLoadingEstado(true);
      const { cambiarEstadoMovil } = await import("../../api/client");
      await cambiarEstadoMovil(asset.id);
      setConfirmandoEstado(false);
      window.location.reload();
    } catch (error: any) {
      console.error(error);
      const msg = error?.response?.data?.error || error?.message || "Error cambiando estado";
      alert(msg);
    } finally {
      setLoadingEstado(false);
    }
  }

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
        Volver al listado
      </button>

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
          <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
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
              {asset.ubicacion}
            </p>
          )}
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {editing ? (
            <>
              <button
                onClick={() => setEditing(false)}
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
                onMouseEnter={(e) => (e.currentTarget.style.background = "#f0f0f0")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
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
                {saving ? "Guardando..." : "Guardar"}
              </button>
            </>
          ) : (
            <>
              {asset.tipo === "MOVIL" && (
                <button
                  onClick={async () => {
                    const { descargarWordMovil } = await import("../../api/client");
                    await descargarWordMovil(asset.id);
                  }}
                  style={{
                    padding: "10px 22px",
                    borderRadius: 8,
                    border: "none",
                    background: C.grad,
                    color: "#fff",
                    fontWeight: 700,
                    cursor: "pointer",
                    fontSize: 14,
                  }}
                >
                  Descargar formato
                </button>
              )}

              <button
                onClick={async () => {
                  const { exportarActivoExcel } = await import("../../api/client");
                  await exportarActivoExcel(asset.id, asset.nombre as any);
                }}
                style={{
                  padding: "10px 22px",
                  borderRadius: 8,
                  border: "2px solid #FA8200",
                  background: "#fff",
                  color: "#FA8200",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontSize: 14,
                }}
              >
                Exportar Excel
              </button>
              {rol === "ADMIN" && (
                <>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    style={{
                      padding: "10px 22px",
                      borderRadius: 8,
                      border: "2px solid #f5c6c6",
                      background: "#fff",
                      color: "#c0392b",
                      fontWeight: 700,
                      cursor: deleting ? "not-allowed" : "pointer",
                      fontSize: 14,
                      opacity: deleting ? 0.7 : 1,
                    }}
                  >
                    {deleting ? "Deshabilitando..." : "Deshabilitar"}
                  </button>
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
                    onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
                  >
                    Editar
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {asset.tipo === "MOVIL" && (
        <div
          style={{
            background: "#fff",
            borderRadius: 12,
            padding: "20px 24px",
            marginBottom: 20,
            boxShadow: "0 6px 20px rgba(0,0,0,.1)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            <div style={{ fontSize: 13, color: "#888" }}>Estado actual</div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                marginTop: 6,
                padding: "6px 14px",
                borderRadius: 16,
                fontWeight: 700,
                fontSize: 13,
                color: estadoStyle.color,
                background: estadoStyle.background,
              }}
            >
              {estadoMovil || "SIN ESTADO"}
            </div>
          </div>

          {canShowMovilAction && (
            <button
              disabled={loadingEstado}
              onClick={handleMovilAction}
              style={{
                padding: "10px 20px",
                borderRadius: 8,
                border: "none",
                color: "#fff",
                cursor: loadingEstado ? "not-allowed" : "pointer",
                fontWeight: 700,
                fontSize: 14,
                opacity: loadingEstado ? 0.7 : 1,
                transition: "all .2s",
                background: estadoStyle.color,
              }}
            >
              {loadingEstado ? "Procesando..." : movilAction.label}
            </button>
          )}

          {movilAction.kind === "finalizado" && (
            <span style={{ color: "#27ae60", fontWeight: 700 }}>Proceso completado</span>
          )}

          {movilAction.kind === "sin_accion" && (
            <span style={{ color: "#7f8c8d", fontWeight: 700 }}>Sin accion disponible</span>
          )}
        </div>
      )}

      {confirmandoEstado && canConfirmManualState && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.65)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2000,
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 14,
              padding: "32px 28px",
              maxWidth: 440,
              width: "90%",
              boxShadow: "0 20px 60px rgba(0,0,0,.25)",
              fontFamily: "Calibri, sans-serif",
            }}
          >
            <h3 style={{ margin: "0 0 8px", color: "#B7312C", fontSize: 18 }}>
              Confirmar cambio de estado
            </h3>
            <p style={{ color: "#555", fontSize: 14, margin: "0 0 16px" }}>
              Vas a cambiar el estado de <strong>{asset.nombre}</strong>:
            </p>

            <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "0 0 16px", flexWrap: "wrap" }}>
              <span
                style={{
                  padding: "6px 14px",
                  borderRadius: 16,
                  fontWeight: 700,
                  fontSize: 13,
                  background: estadoStyle.background,
                  color: estadoStyle.color,
                }}
              >
                {estadoMovil}
              </span>
              <span style={{ color: "#888", fontSize: 20 }}>-&gt;</span>
              <span
                style={{
                  padding: "6px 14px",
                  borderRadius: 16,
                  fontWeight: 700,
                  fontSize: 13,
                  background: nextEstadoStyle.background,
                  color: nextEstadoStyle.color,
                }}
              >
                {nextManualState}
              </span>
            </div>

            <p
              style={{
                color: "#a65f00",
                fontSize: 12,
                margin: "0 0 24px",
                fontWeight: 600,
                background: "#fff8e8",
                padding: "10px 14px",
                borderRadius: 8,
                border: "1px solid #f6d28b",
              }}
            >
              {getManualChangeMessage(estadoMovil)} Esta accion no marca el equipo como DEVUELTO;
              el cierre final requiere firma de devolucion.
            </p>

            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={() => setConfirmandoEstado(false)}
                disabled={loadingEstado}
                style={{
                  flex: 1,
                  padding: "11px 0",
                  borderRadius: 8,
                  border: "1px solid #ddd",
                  background: "#fff",
                  color: "#555",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontSize: 13,
                  fontFamily: "Calibri, sans-serif",
                }}
              >
                Cancelar
              </button>
              <button
                disabled={loadingEstado}
                onClick={confirmarCambioEstadoMovil}
                style={{
                  flex: 2,
                  padding: "11px 0",
                  borderRadius: 8,
                  border: "none",
                  background: loadingEstado ? "#ddd" : C.grad,
                  color: "#fff",
                  fontWeight: 800,
                  cursor: loadingEstado ? "not-allowed" : "pointer",
                  fontSize: 13,
                  fontFamily: "Calibri, sans-serif",
                  boxShadow: "0 4px 12px rgba(183,49,44,.25)",
                }}
              >
                {loadingEstado ? "Procesando..." : "Confirmar cambio"}
              </button>
            </div>
          </div>
        </div>
      )}

      <Section title="Informacion General" icon="">
        <Field
          label="Nombre"
          value={asset.nombre}
          editing={editing}
          field="nombre"
          onChange={(f, v) => handleChange(null, f, v)}
        />
        <Field
          label="Ubicacion"
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
        {["SERVIDOR", "RED"].includes(asset.tipo) && (
          <Field
            label="Codigo de Servicio"
            value={asset.codigoServicio}
            editing={editing}
            field="codigoServicio"
            onChange={(f, v) => handleChange(null, f, v)}
          />
        )}
      </Section>

      <ServidorSections asset={asset} editing={editing} handleChange={handleChange} />
      <RedSection asset={asset} editing={editing} handleChange={handleChange} />
      <UpsSection asset={asset} editing={editing} handleChange={handleChange} />
      <BaseDatosSection asset={asset} editing={editing} handleChange={handleChange} />
      <VpnSection asset={asset} editing={editing} handleChange={handleChange} />
      <MovilSection asset={asset} editing={editing} handleChange={handleChange} />

      {asset.tipo === "SERVIDOR" && <OcsSoftwareSection assetId={asset.id} />}

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

