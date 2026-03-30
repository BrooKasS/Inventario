import {
  Entity, PrimaryColumn, Column, OneToOne, OneToMany,
  CreateDateColumn, UpdateDateColumn, Index, BeforeInsert,
} from "typeorm";
import { v4 as uuidv4 } from "uuid";
import { Servidor } from "./Servidor";
import { Red } from "./Red";
import { Ups } from "./Ups";
import { BaseDatos } from "./BaseDatos";
import { Vpn } from "./Vpn";
import { Movil } from "./Movil";
import { Bitacora } from "./Bitacora";

export type TipoActivo = "SERVIDOR" | "RED" | "UPS" | "BASE_DATOS" | "VPN" | "MOVIL";

@Entity("ASSETS")
@Index("IDX_ASSET_TIPO", ["tipo"])
@Index("IDX_ASSET_NOMBRE", ["nombre"])
@Index("IDX_ASSET_CODIGO", ["codigoServicio"])
export class Asset {
  @PrimaryColumn({ type: "varchar2", length: 36 })
  id!: string;

  @BeforeInsert()
  generateId() {
    if (!this.id) this.id = uuidv4();
  }

  @Column({ type: "varchar2", length: 20 })
  tipo!: TipoActivo;

  @Column({ type: "varchar2", length: 500, nullable: true })
  nombre!: string | null;

  @Column({ type: "varchar2", length: 100, nullable: true })
  codigoServicio!: string | null;

  @Column({ type: "varchar2", length: 500, nullable: true })
  ubicacion!: string | null;

  @Column({ type: "varchar2", length: 500, nullable: true })
  propietario!: string | null;

  @Column({ type: "varchar2", length: 500, nullable: true })
  custodio!: string | null;

  @CreateDateColumn({ type: "timestamp" })
  creadoEn!: Date;

  @UpdateDateColumn({ type: "timestamp" })
  actualizadoEn!: Date;

  @Column({ type: "timestamp", nullable: true })
  deletedAt!: Date | null;

  @OneToOne(() => Servidor, (s) => s.asset, { cascade: true })
  servidor!: Servidor | null;

  @OneToOne(() => Red, (r) => r.asset, { cascade: true })
  red!: Red | null;

  @OneToOne(() => Ups, (u) => u.asset, { cascade: true })
  ups!: Ups | null;

  @OneToOne(() => BaseDatos, (b) => b.asset, { cascade: true })
  baseDatos!: BaseDatos | null;

  @OneToOne(() => Vpn, (v) => v.asset, { cascade: true })
  vpn!: Vpn | null;

  @OneToOne(() => Movil, (m) => m.asset, { cascade: true })
  movil!: Movil | null;

  @OneToMany(() => Bitacora, (b) => b.asset, { cascade: true })
  bitacora!: Bitacora[];
}