import "dotenv/config";
import "reflect-metadata";
import { DataSource } from "typeorm";

import { Asset } from "./entities/Asset";
import { Servidor } from "./entities/Servidor";
import { Red } from "./entities/Red";
import { Ups } from "./entities/Ups";
import { BaseDatos } from "./entities/BaseDatos";
import { Vpn } from "./entities/Vpn";
import { VpnRule } from "./entities/VpnRule";
import { Movil } from "./entities/Movil";
import { Bitacora } from "./entities/Bitacora";
import { OcsServerMapping } from "./entities/OcsServerMapping";
import { SoftwareInstalado } from "./entities/SoftwareInstalado";
import { CertificadoSsl } from "./entities/CertificadoSsl";
import { CertificadoSslApp } from "./entities/CertificadoSslApp";

export const AppDataSource = new DataSource({
  type: "oracle",
  host: process.env.DB_HOST!,
  port: Number(process.env.DB_PORT!),
  serviceName: process.env.DB_SERVICE!,
  username: process.env.DB_USER!,
  password: process.env.DB_PASSWORD!,

  synchronize: process.env.NODE_ENV !== "production",
  logging: false,

  entities: [
    Asset,
    Servidor,
    Red,
    Ups,
    BaseDatos,
    Vpn,
    VpnRule,
    Movil,
    Bitacora,
    OcsServerMapping,
    SoftwareInstalado,
    CertificadoSsl,
    CertificadoSslApp,
  ],

  migrationsRun: process.env.NODE_ENV === "production",
  migrations: ["dist/migrations/*.js"],
});
