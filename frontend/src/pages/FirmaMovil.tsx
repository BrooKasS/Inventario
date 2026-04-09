import { useRef, useState } from "react";
import { useParams } from "react-router-dom";
import SignatureCanvas from "react-signature-canvas";
import { firmarMovil } from "../api/client";

export default function FirmaMovil() {
  const { assetId } = useParams<{ assetId: string }>();
  const sigRef = useRef<SignatureCanvas>(null);
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
        .getTrimmedCanvas()
        .toDataURL("image/png");

      await firmarMovil(assetId!, firmaBase64);

      setMensaje("✅ Firma registrada correctamente. Puede venir por el equipo.");
    } catch (error: any) {
      console.error(error);
      setMensaje(
        error?.response?.data?.error ?? "❌ Error registrando la firma"
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
          <p>
            Por favor firme en el recuadro para confirmar la entrega del equipo.
          </p>

          <SignatureCanvas
            ref={sigRef}
            penColor="black"
            canvasProps={{
              width: 400,
              height: 150,
              style: {
                border: "1px solid #ccc",
                backgroundColor: "#fff",
              },
            }}
          />

          <div style={{ marginTop: 10 }}>
            <button
              onClick={() => sigRef.current?.clear()}
              disabled={enviando}
            >
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