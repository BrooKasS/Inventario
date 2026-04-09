import {
  Entity, PrimaryColumn, Column, OneToOne, JoinColumn, BeforeInsert,
} from "typeorm";
import { v4 as uuidv4 } from "uuid";
import { Asset } from "./Asset";

@Entity("MOVILES")
export class Movil {
  @PrimaryColumn({ type: "varchar2", length: 36 })
  id!: string;

  @BeforeInsert()
  generateId() {
    if (!this.id) this.id = uuidv4();
  }

  @OneToOne(() => Asset, (a) => a.movil, { onDelete: "CASCADE" })
  @JoinColumn({ name: "ASSET_ID" })
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


  // Ruta del archivo de firma (PNG)
  @Column({ type: "varchar2", length: 500, nullable: true })
  firmaPath!: string | null;

  // Fecha exacta en que se firmó
  @Column({ type: "timestamp", nullable: true })
  fechaFirma!: Date | null;

}