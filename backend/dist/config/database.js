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
  host: process.env.DB_HOST ?? "localhost",
  port: Number(process.env.DB_PORT) || 1521,

  // ✅ ORACLE 21c XE → SIEMPRE SERVICE NAME
  serviceName: process.env.DB_SERVICE ?? "XEPDB1",

  username: process.env.DB_USER ?? "INVENTARIO",
  password: process.env.DB_PASSWORD ?? "inventario123",

  synchronize: true,
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