import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity("MOBILE_STAGING")
export class MobileStaging {

  @PrimaryGeneratedColumn("uuid", { name: "ID" })
  id!: string;

  @Column({ name: "SERIAL", type: "varchar2", length: 200, unique: true, nullable: false })
  serial!: string;

  @Column({ name: "IMEI1", type: "varchar2", length: 50, nullable: true })
  imei1!: string | null;

  @Column({ name: "IMEI2", type: "varchar2", length: 50, nullable: true })
  imei2!: string | null;

  @Column({ name: "USADO", type: "varchar2", length: 5, default: "false" })
  usado!: string;

  @CreateDateColumn({ name: "CREADO_EN" })
  creadoEn!: Date;
}