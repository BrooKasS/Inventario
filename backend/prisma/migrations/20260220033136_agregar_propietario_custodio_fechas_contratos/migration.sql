/*
  Warnings:

  - You are about to drop the column `responsable` on the `Asset` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Asset" DROP COLUMN "responsable",
ADD COLUMN     "custodio" TEXT,
ADD COLUMN     "propietario" TEXT;

-- AlterTable
ALTER TABLE "BaseDatos" ADD COLUMN     "contratoQueSoporta" TEXT,
ADD COLUMN     "fechaFinalSoporte" TEXT;

-- AlterTable
ALTER TABLE "Red" ADD COLUMN     "contratoQueSoporta" TEXT,
ADD COLUMN     "fechaFinSoporte" TEXT;

-- AlterTable
ALTER TABLE "Servidor" ADD COLUMN     "contratoQueSoporta" TEXT,
ADD COLUMN     "fechaFinSoporte" TEXT;
