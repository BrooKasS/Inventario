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

//agarra el .env del backend
export const AppDataSource = new DataSource({
  type: "oracle",
  host: process.env.DB_HOST!,
  port: Number(process.env.DB_PORT!),

  // para que en el env sea service name
  serviceName: process.env.DB_SERVICE!,

  // user de la app
  username: process.env.DB_USER!,
  password: process.env.DB_PASSWORD!,

  synchronize: false,       // solo en desarrollo
  logging: false,           // Desactivar para ver logs de LDAP claramente

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