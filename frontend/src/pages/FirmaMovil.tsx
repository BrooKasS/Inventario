import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import SignatureCanvas from "react-signature-canvas";
import { firmarMovil, getAssetById } from "../api/client";

/* 🎨 estilos base tomados de AssetList */
const GRAD = "linear-gradient(135deg, #fa8e00 , #89183e 25%, #861F41 35%, #B7312C 70%, #D86018 100%)";
const CARD_BG = "#ffffff";
const PRIMARY = "#FA8200";
const ACCENT = "#B7312C";

export default function FirmaMovil() {
  const { assetId } = useParams<{ assetId: string }>();
  const sigRef = useRef<any>(null);

  const [asset, setAsset] = useState<any>(null);
  const [observaciones, setObservaciones] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  /* ────────────── cargar activo ────────────── */
  useEffect(() => {
    if (!assetId) return;

    const loadAsset = async () => {
      try {
        const data = await getAssetById(assetId);
        setAsset(data);
      } catch {
        setMensaje("❌ No se pudo cargar la información del activo");
      } finally {
        setLoading(false);
      }
    };

    loadAsset();
  }, [assetId]);

  /* ────────────── firmar ────────────── */
  const enviarFirma = async () => {
    if (!sigRef.current || sigRef.current.isEmpty()) {
      alert("Debe firmar antes de enviar");
      return;
    }

    try {
      setEnviando(true);

      const firmaBase64 = sigRef.current
        .getCanvas()
        .toDataURL("image/png");

      await firmarMovil(assetId!, {
        firmaBase64,
        observacionesEntrega: observaciones,
      });

      setMensaje("✅ Firma registrada correctamente. Puede venir por el equipo.");
    } catch (error: any) {
      setMensaje(error?.response?.data?.error ?? "❌ Error registrando la firma");
    } finally {
      setEnviando(false);
    }
  };

  /* ────────────── render estados ────────────── */
  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: GRAD, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
        <h3>Cargando información del equipo…</h3>
      </div>
    );
  }

  if (!asset) {
    return (
      <div style={{ minHeight: "100vh", background: GRAD, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
        <h3>❌ Activo no encontrado</h3>
      </div>
    );
  }

  /* ────────────── UI ────────────── */
  return (
    <div
      style={{
        minHeight: "100vh",
        background: GRAD,
        padding: "48px 16px",
        fontFamily: "Calibri, 'Segoe UI', sans-serif",
      }}
    >
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        {/* ── Header ── */}
        <div style={{ marginBottom: 24, color: "#fff", display: "flex", gap: 12, alignItems: "center" }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 12,
              background: "rgba(255,255,255,.18)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
            }}
          >
            📱
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700 }}>
              Acta de Entrega – Firma Digital
            </h1>
            <p style={{ margin: 0, opacity: 0.8, fontSize: 14 }}>
              Confirmación de entrega del equipo móvil
            </p>
          </div>
        </div>

        {/* ── Card principal ── */}
        <div
          style={{
            background: CARD_BG,
            borderRadius: 16,
            padding: 28,
            boxShadow: "0 12px 40px rgba(0,0,0,.35)",
          }}
        >
          {mensaje ? (
            <p style={{ fontSize: 16, fontWeight: 600 }}>{mensaje}</p>
          ) : (
            <>
              {/* ── Datos del activo ── */}
              <div style={{ marginBottom: 24 }}>
                <h3 style={{ marginBottom: 12, color: ACCENT }}>Datos del Equipo</h3>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 14 }}>
                  <strong>Activo:</strong><span>{asset.nombre}</span>
                  <strong>Usuario red:</strong><span>{asset.movil?.usuarioRed}</span>
                  <strong>Cédula:</strong><span>{asset.movil?.cedula}</span>
                  <strong>Dependencia:</strong><span>{asset.movil?.dependencia}</span>
                  <strong>Sede:</strong><span>{asset.movil?.sede}</span>
                  <strong>Marca / Modelo:</strong><span>{asset.movil?.marca} {asset.movil?.modelo}</span>
                  <strong>Serial:</strong><span>{asset.movil?.serial}</span>
                  <strong>IMEI:</strong><span>{asset.movil?.imei1}</span>
                </div>
              </div>

              {/* ── Firma ── */}
              <h3 style={{ marginBottom: 8, color: ACCENT }}>Firma del Responsable</h3>

              <SignatureCanvas
                ref={sigRef}
                penColor="black"
                canvasProps={{
                  width: 600,
                  height: 180,
                  style: {
                    border: "2px dashed #ccc",
                    borderRadius: 8,
                    background: "#fff",
                  },
                }}
              />

              {/* ── Observaciones ── */}
              <textarea
                placeholder="Observaciones de entrega (opcional)"
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                rows={4}
                style={{
                  width: "100%",
                  marginTop: 16,
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: "1px solid #ddd",
                  fontFamily: "inherit",
                  fontSize: 14,
                }}
              />

              {/* ── Botones ── */}
              <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end", gap: 12 }}>
                <button
                  onClick={() => sigRef.current?.clear()}
                  disabled={enviando}
                  style={{
                    padding: "10px 18px",
                    borderRadius: 8,
                    border: "1px solid #ddd",
                    background: "#fff",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  Limpiar
                </button>

                <button
                  onClick={enviarFirma}
                  disabled={enviando}
                  style={{
                    padding: "10px 22px",
                    borderRadius: 8,
                    border: "none",
                    background: GRAD,
                    color: "#fff",
                    cursor: "pointer",
                    fontWeight: 700,
                    boxShadow: "0 4px 12px rgba(183,49,44,.4)",
                  }}
                >
                  {enviando ? "Enviando…" : "Firmar y Enviar"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
