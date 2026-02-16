-- CreateEnum
CREATE TYPE "TipoActivo" AS ENUM ('SERVIDOR', 'RED', 'UPS', 'BASE_DATOS');

-- CreateEnum
CREATE TYPE "TipoEvento" AS ENUM ('IMPORTACION', 'CAMBIO_CAMPO', 'MANTENIMIENTO', 'INCIDENTE', 'NOTA');

-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL,
    "tipo" "TipoActivo" NOT NULL,
    "nombre" TEXT,
    "codigoServicio" TEXT,
    "ubicacion" TEXT,
    "responsable" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Servidor" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "monitoreo" TEXT,
    "backup" TEXT,
    "ipInterna" TEXT,
    "ipGestion" TEXT,
    "ipServicio" TEXT,
    "ambiente" TEXT,
    "tipoServidor" TEXT,
    "appSoporta" TEXT,
    "vcpu" INTEGER,
    "vramMb" INTEGER,
    "sistemaOperativo" TEXT,
    "rutasBackup" TEXT,

    CONSTRAINT "Servidor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Red" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "serial" TEXT,
    "mac" TEXT,
    "modelo" TEXT,
    "ipGestion" TEXT,
    "estado" TEXT,

    CONSTRAINT "Red_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ups" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "serial" TEXT,
    "placa" TEXT,
    "modelo" TEXT,
    "estado" TEXT,

    CONSTRAINT "Ups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BaseDatos" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "servidor1" TEXT,
    "servidor2" TEXT,
    "racScan" TEXT,
    "ambiente" TEXT,
    "appSoporta" TEXT,
    "versionBd" TEXT,
    "contenedorFisico" TEXT,

    CONSTRAINT "BaseDatos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bitacora" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "autor" TEXT NOT NULL,
    "tipoEvento" "TipoEvento" NOT NULL,
    "descripcion" TEXT NOT NULL,
    "campoModificado" TEXT,
    "valorAnterior" TEXT,
    "valorNuevo" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Bitacora_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Asset_tipo_idx" ON "Asset"("tipo");

-- CreateIndex
CREATE INDEX "Asset_nombre_idx" ON "Asset"("nombre");

-- CreateIndex
CREATE INDEX "Asset_codigoServicio_idx" ON "Asset"("codigoServicio");

-- CreateIndex
CREATE UNIQUE INDEX "Servidor_assetId_key" ON "Servidor"("assetId");

-- CreateIndex
CREATE UNIQUE INDEX "Red_assetId_key" ON "Red"("assetId");

-- CreateIndex
CREATE UNIQUE INDEX "Ups_assetId_key" ON "Ups"("assetId");

-- CreateIndex
CREATE UNIQUE INDEX "BaseDatos_assetId_key" ON "BaseDatos"("assetId");

-- CreateIndex
CREATE INDEX "Bitacora_assetId_idx" ON "Bitacora"("assetId");

-- CreateIndex
CREATE INDEX "Bitacora_creadoEn_idx" ON "Bitacora"("creadoEn");

-- AddForeignKey
ALTER TABLE "Servidor" ADD CONSTRAINT "Servidor_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Red" ADD CONSTRAINT "Red_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ups" ADD CONSTRAINT "Ups_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BaseDatos" ADD CONSTRAINT "BaseDatos_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bitacora" ADD CONSTRAINT "Bitacora_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
