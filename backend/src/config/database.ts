import "reflect-metadata";
import { DataSource } from "typeorm";

import { Asset } from "../entities/Asset";
import { Servidor } from "../entities/Servidor";
import { Red } from "../entities/Red";
import { Ups } from "../entities/Ups";
import { BaseDatos } from "../entities/BaseDatos";
import { Vpn } from "../entities/Vpn";
import { Movil } from "../entities/Movil";
import { Bitacora } from "../entities/Bitacora";

export const AppDataSource = new DataSource({
  type: "oracle",
  host: process.env.DB_HOST!,
  port: Number(process.env.DB_PORT!),

  // ✅ ORACLE 21c XE → SOLO SERVICE NAME
  serviceName: process.env.DB_SERVICE!,

  // ✅ Usuario de aplicación
  username: process.env.DB_USER!,
  password: process.env.DB_PASSWORD!,

  synchronize: true,       // solo en desarrollo
  logging: true,

  entities: [
    Asset,
    Servidor,
    Red,
    Ups,
    BaseDatos,
    Vpn,
    Movil,
    Bitacora,
  ],
});