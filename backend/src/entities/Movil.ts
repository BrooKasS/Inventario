import {
  Entity,
  PrimaryColumn,
  Column,
  OneToOne,
  JoinColumn,
} from "typeorm";
import { Asset } from "./Asset";

@Entity("MOVILES")
export class Movil {

  // ✅ PK y FK al mismo tiempo
  @PrimaryColumn({ name: "ID", type: "varchar2", length: 36 })
  id!: string;

  @OneToOne(() => Asset, (a) => a.movil, { onDelete: "CASCADE" })
  @JoinColumn({ name: "ID", referencedColumnName: "id" })
  asset!: Asset;

  @Column({ type: "varchar2", length: 200, nullable: true })
  numeroCaso!: string | null;

  @Column({ type: "varchar2", length: 200, nullable: true })
  region!: string | null;

  @Column({ type: "varchar2", length: 500, nullable: true })
  dependencia!: string | null;

  @Column({ type: "varchar2", length: 200, nullable: true })
  sede!: string | null;

  @Column({ type: "varchar2", length: 50, nullable: true })
  cedula!: string | null;

  @Column({ type: "varchar2", length: 200, nullable: true })
  usuarioRed!: string | null;

  @Column({ type: "varchar2", length: 500, nullable: true })
  correoResponsable!: string | null;

  @Column({ type: "varchar2", length: 100, nullable: true })
  uni!: string | null;

  @Column({ type: "varchar2", length: 200, nullable: true })
  marca!: string | null;

  @Column({ type: "varchar2", length: 200, nullable: true })
  modelo!: string | null;

  @Column({ type: "varchar2", length: 200, nullable: true })
  serial!: string | null;

  @Column({ type: "varchar2", length: 50, nullable: true })
  imei1!: string | null;

  @Column({ type: "varchar2", length: 50, nullable: true })
  imei2!: string | null;

  @Column({ type: "varchar2", length: 100, nullable: true })
  sim!: string | null;

  @Column({ type: "varchar2", length: 50, nullable: true })
  numeroLinea!: string | null;

  @Column({ type: "timestamp", nullable: true })
  fechaEntrega!: Date | null;

  @Column({ type: "varchar2", length: 2000, nullable: true })
  observacionesEntrega!: string | null;

  @Column({ type: "timestamp", nullable: true })
  fechaDevolucion!: Date | null;

  @Column({ type: "varchar2", length: 2000, nullable: true })
  observacionesDevolucion!: string | null;

  @Column({ type: "varchar2", length: 500, nullable: true })
  firmaPath!: string | null;

  @Column({ type: "timestamp", nullable: true })
  fechaFirma!: Date | null;
}