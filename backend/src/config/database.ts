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
  sid: process.env.DB_SID ?? "XE",
  username: process.env.DB_USER ?? "system",
  password: process.env.DB_PASS ?? "1234",
  synchronize: true,
  logging: process.env.NODE_ENV === "development",
  entities: [Asset, Servidor, Red, Ups, BaseDatos, Vpn, Movil, Bitacora],
});
