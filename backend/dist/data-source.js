"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
require("dotenv/config");
require("reflect-metadata");
const typeorm_1 = require("typeorm");
const Asset_1 = require("./entities/Asset");
const Servidor_1 = require("./entities/Servidor");
const Red_1 = require("./entities/Red");
const Ups_1 = require("./entities/Ups");
const BaseDatos_1 = require("./entities/BaseDatos");
const Vpn_1 = require("./entities/Vpn");
const VpnRule_1 = require("./entities/VpnRule");
const Movil_1 = require("./entities/Movil");
const Bitacora_1 = require("./entities/Bitacora");
exports.AppDataSource = new typeorm_1.DataSource({
    type: "oracle",
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    serviceName: process.env.DB_SERVICE,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    synchronize: process.env.NODE_ENV !== "production", // true en desarrollo, false en producción
    logging: false,
    entities: [
        Asset_1.Asset,
        Servidor_1.Servidor,
        Red_1.Red,
        Ups_1.Ups,
        BaseDatos_1.BaseDatos,
        Vpn_1.Vpn,
        VpnRule_1.VpnRule,
        Movil_1.Movil,
        Bitacora_1.Bitacora,
    ],
    migrationsRun: process.env.NODE_ENV === "production",
    migrations: ["dist/migrations/*.js"],
});
