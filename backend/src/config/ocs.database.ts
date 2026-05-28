import "reflect-metadata";
import { DataSource } from "typeorm";

export const OcsDataSource = new DataSource({
  type: "mysql",
  host: process.env.OCS_DB_HOST,
  port: Number(process.env.OCS_DB_PORT),
  username: process.env.OCS_DB_USER,
  password: process.env.OCS_DB_PASSWORD,
  database: process.env.OCS_DB_NAME,

  synchronize: false,
  logging: false,
});
