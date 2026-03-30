import {
  Entity, PrimaryColumn, Column, OneToOne, JoinColumn, BeforeInsert,
} from "typeorm";
import { v4 as uuidv4 } from "uuid";
import { Asset } from "./Asset";

@Entity("SERVIDORES")
export class Servidor {
  @PrimaryColumn({ type: "varchar2", length: 36 })
  id!: string;

  @BeforeInsert()
  generateId() {
    if (!this.id) this.id = uuidv4();
  }

  @OneToOne(() => Asset, (a) => a.servidor, { onDelete: "CASCADE" })
  @JoinColumn({ name: "ASSET_ID" })
  asset!: Asset;

  @Column({ type: "varchar2", length: 500, nullable: true })
  monitoreo!: string | null;

  @Column({ type: "varchar2", length: 500, nullable: true })
  backup!: string | null;

  @Column({ type: "varchar2", length: 100, nullable: true })
  ipInterna!: string | null;

  @Column({ type: "varchar2", length: 100, nullable: true })
  ipGestion!: string | null;

  @Column({ type: "varchar2", length: 100, nullable: true })
  ipServicio!: string | null;

  @Column({ type: "varchar2", length: 100, nullable: true })
  ambiente!: string | null;

  @Column({ type: "varchar2", length: 100, nullable: true })
  tipoServidor! : string | null;

  @Column({ type: "varchar2", length: 1000, nullable: true })
  appSoporta!: string | null;

  @Column({ type: "number", nullable: true })
  vcpu!: number | null;

  @Column({ type: "number", nullable: true })
  vramMb!: number | null;

  @Column({ type: "varchar2", length: 500, nullable: true })
  sistemaOperativo!: string | null;

  @Column({ type: "timestamp", nullable: true })
  fechaFinSoporte!: Date | null;

  @Column({ type: "varchar2", length: 1000, nullable: true })
  rutasBackup!: string | null;

  @Column({ type: "varchar2", length: 500, nullable: true })
  contratoQueSoporta!: string | null;
}