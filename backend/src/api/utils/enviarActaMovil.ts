import { generarWordMovil } from "./generarMovilDocx";
import { sendMovilEmail } from "./sendMovilEmail";

interface EnviarActaMovilParams {
  correo: string;
  nombreActivo: string;
  assetId: string;
  datosWord: Parameters<typeof generarWordMovil>[0];
}

export async function generarYEnviarActaMovil({
  correo,
  nombreActivo,
  assetId,
  datosWord,
}: EnviarActaMovilParams) {
  // 1️⃣ Generar Word
  const buffer = await generarWordMovil(datosWord);

  // 2️⃣ Convertir a Base64
  const archivoBase64 = buffer.toString("base64");

  // 3️⃣ Enviar correo
  await sendMovilEmail({
    correo,
    nombreActivo,
    assetId,
    nombreArchivo: `Acta_Entrega_${nombreActivo}.docx`,
    archivoBase64,
  });

  // 4️⃣ Devolver buffer por si alguien lo necesita después
  return buffer;
}