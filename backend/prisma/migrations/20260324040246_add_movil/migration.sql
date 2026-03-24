-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TipoActivo" ADD VALUE 'VPN';
ALTER TYPE "TipoActivo" ADD VALUE 'MOVIL';

-- AlterTable
ALTER TABLE "Asset" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Vpn" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "conexion" TEXT,
    "fases" TEXT,
    "origen" TEXT,
    "destino" TEXT,

    CONSTRAINT "Vpn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Movil" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "numeroCaso" TEXT,
    "region" TEXT,
    "dependencia" TEXT,
    "sede" TEXT,
    "cedula" TEXT,
    "usuarioRed" TEXT,
    "correoResponsable" TEXT,
    "uni" TEXT,
    "marca" TEXT,
    "modelo" TEXT,
    "serial" TEXT,
    "imei1" TEXT,
    "imei2" TEXT,
    "sim" TEXT,
    "numeroLinea" TEXT,
    "fechaEntrega" TIMESTAMP(3),
    "observacionesEntrega" TEXT,
    "fechaDevolucion" TIMESTAMP(3),
    "observacionesDevolucion" TEXT,

    CONSTRAINT "Movil_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Vpn_assetId_key" ON "Vpn"("assetId");

-- CreateIndex
CREATE UNIQUE INDEX "Movil_assetId_key" ON "Movil"("assetId");

-- AddForeignKey
ALTER TABLE "Vpn" ADD CONSTRAINT "Vpn_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Movil" ADD CONSTRAINT "Movil_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
