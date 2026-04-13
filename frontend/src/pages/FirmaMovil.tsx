import { useRef, useState } from "react";
import { useParams } from "react-router-dom";
import SignatureCanvas from "react-signature-canvas";
import { firmarMovil } from "../api/client";

export default function FirmaMovil() {
  const { assetId } = useParams<{ assetId: string }>();
  const sigRef = useRef<any>(null);

  const [observaciones, setObservaciones] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);

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
      console.error(error);
      setMensaje(
        error?.response?.data?.error ??
        "❌ Error registrando la firma"
      );
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div style={{ maxWidth: 500, margin: "0 auto", padding: 20 }}>
      <h2>Firma de Acta de Entrega</h2>

      {mensaje ? (
        <p>{mensaje}</p>
      ) : (
        <>
          <p>Por favor firme y agregue observaciones si aplica.</p>

          <SignatureCanvas
            ref={sigRef}
            penColor="black"
            canvasProps={{
              width: 400,
              height: 150,
              style: { border: "1px solid #ccc", background: "#fff" },
            }}
          />

          <textarea
            placeholder="Observaciones de entrega (opcional)"
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            style={{ width: "100%", marginTop: 10 }}
            rows={4}
          />

          <div style={{ marginTop: 10 }}>
            <button onClick={() => sigRef.current?.clear()} disabled={enviando}>
              Limpiar
            </button>

            <button
              style={{ marginLeft: 10 }}
              onClick={enviarFirma}
              disabled={enviando}
            >
              {enviando ? "Enviando..." : "Firmar y Enviar"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
``