/*
  Warnings:

  - The `fechaFinalSoporte` column on the `BaseDatos` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `fechaFinSoporte` column on the `Red` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `fechaFinSoporte` column on the `Servidor` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "BaseDatos" DROP COLUMN "fechaFinalSoporte",
ADD COLUMN     "fechaFinalSoporte" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Red" DROP COLUMN "fechaFinSoporte",
ADD COLUMN     "fechaFinSoporte" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Servidor" DROP COLUMN "fechaFinSoporte",
ADD COLUMN     "fechaFinSoporte" TIMESTAMP(3);
