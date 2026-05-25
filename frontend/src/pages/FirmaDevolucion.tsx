import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import SignatureCanvas from "react-signature-canvas";
import {
  firmarDevolucionPublic,
  getAssetByIdPublic,
} from "../api/client";

/* 🎨 estilos */
const GRAD =
  "linear-gradient(135deg,#fa8e00,#89183e 25%,#861F41 35%,#B7312C 70%,#D86018 100%)";
const CARD_BG = "#ffffff";
const ACCENT = "#B7312C";

export default function FirmaDevolucion() {
  const { assetId } = useParams<{ assetId: string }>();
  const sigRef = useRef<any>(null);

  const [asset, setAsset] = useState<any>(null);
  const [firmaImagen, setFirmaImagen] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!assetId) return;

    getAssetByIdPublic(assetId)
      .then(setAsset)
      .catch(() => setMensaje("❌ No se pudo cargar el activo"))
      .finally(() => setLoading(false));
  }, [assetId]);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Solo imágenes permitidas");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setFirmaImagen(reader.result as string);
      sigRef.current?.clear();
    };
    reader.readAsDataURL(file);
  };

  const enviarFirma = async () => {
    let firmaBase64: string | null = null;

    if (firmaImagen) {
      firmaBase64 = firmaImagen;
    } else if (sigRef.current && !sigRef.current.isEmpty()) {
      firmaBase64 = sigRef.current.getCanvas().toDataURL("image/png");
    }

    if (!firmaBase64) {
      alert("Debe firmar");
      return;
    }

    try {
      setEnviando(true);

      await firmarDevolucionPublic(assetId!, {
        firmaBase64,
      });

      setMensaje(
        "✅ Devolución firmada correctamente. El proceso ha finalizado."
      );
    } catch (err: any) {
      setMensaje(
        err?.response?.data?.error || "❌ Error registrando la firma"
      );
    } finally {
      setEnviando(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: GRAD,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
        }}
      >
        <h3>Cargando...</h3>
      </div>
    );
  }

  if (!asset) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: GRAD,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
        }}
      >
        <h3>❌ Activo no encontrado</h3>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: GRAD, padding: "40px" }}>
      <div style={{ maxWidth: 700, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ color: "#fff", marginBottom: 20 }}>
          <h1 style={{ margin: 0 }}>Acta de Devolución</h1>
          <p>Firma para cierre del proceso</p>
        </div>

        {/* Card */}
        <div
          style={{
            background: CARD_BG,
            padding: 28,
            borderRadius: 16,
            boxShadow: "0 10px 30px rgba(0,0,0,.15)",
          }}
        >

          {mensaje ? (
            <p style={{ fontWeight: 600 }}>{mensaje}</p>
          ) : (
            <>
              {/* Datos */}
              <h3 style={{ color: ACCENT }}>Datos del Equipo</h3>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                  fontSize: 14,
                  marginBottom: 20,
                }}
              >
                <strong>Activo:</strong><span>{asset.nombre}</span>
                <strong>Usuario:</strong><span>{asset.movil?.usuarioRed}</span>
                <strong>Marca:</strong><span>{asset.movil?.marca}</span>
                <strong>Modelo:</strong><span>{asset.movil?.modelo}</span>
              </div>

              {/* Firma */}
              <h3 style={{ color: ACCENT }}>Firma</h3>

              <SignatureCanvas
                ref={sigRef}
                penColor="black"
                canvasProps={{
                  width: 500,
                  height: 160,
                  style: { border: "2px dashed #ccc", borderRadius: 8 },
                }}
              />

              {/* ✅ Upload mejorado */}
              <div style={{ marginTop: 14 }}>
                <label
                  style={{
                    display: "inline-block",
                    padding: "10px 18px",
                    borderRadius: 8,
                    border: "2px dashed #ccc",
                    background: "#fafafa",
                    color: "#555",
                    fontWeight: 600,
                    cursor: "pointer",
                    fontSize: 14,
                    transition: "all .2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = ACCENT;
                    e.currentTarget.style.background = "#fff4f2";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#ccc";
                    e.currentTarget.style.background = "#fafafa";
                  }}
                >
                  📤 Subir imagen de firma

                  <input
                    type="file"
                    accept="image/png,image/jpeg"
                    onChange={handleUpload}
                    style={{ display: "none" }}
                  />
                </label>
              </div>

              {firmaImagen && (
                <div
                  style={{
                    marginTop: 12,
                    padding: 10,
                    borderRadius: 10,
                    border: "1px solid #eee",
                    display: "inline-block",
                    background: "#fafafa",
                  }}
                >
                  <img
                    src={firmaImagen}
                    style={{ maxWidth: 180 }}
                  />
                </div>
              )}

              {/* ✅ BOTONES */}
              <div
                style={{
                  marginTop: 22,
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 12,
                }}
              >
                <button
                  onClick={() => {
                    sigRef.current?.clear();
                    setFirmaImagen(null);
                  }}
                  style={{
                    padding: "10px 18px",
                    borderRadius: 8,
                    border: "2px solid #ddd",
                    background: "#fff",
                    color: "#555",
                    fontWeight: 600,
                    cursor: "pointer",
                    fontSize: 14,
                    transition: "all .2s",
                  }}
                >
                  🧹 Limpiar
                </button>

                <button
                  onClick={enviarFirma}
                  disabled={enviando}
                  style={{
                    padding: "10px 20px",
                    borderRadius: 8,
                    border: "none",
                    background: GRAD,
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: enviando ? "not-allowed" : "pointer",
                    opacity: enviando ? 0.7 : 1,
                    transition: "all .2s",
                    boxShadow: "0 4px 12px rgba(183,49,44,.25)",
                  }}
                >
                  {enviando ? "⏳ Enviando..." : "✍ Firmar devolución"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}