import {
  Entity, PrimaryColumn, Column, OneToOne, OneToMany, JoinColumn, BeforeInsert,
} from "typeorm";
import { v4 as uuidv4 } from "uuid";
import { Asset } from "./Asset";
import { CertificadoSslApp } from "./CertificadoSslApp";

export type TipoCertificado = "DOMINIO" | "APLICACION" | "PROVEEDOR";

@Entity("CERTIFICADOS_SSL")
export class CertificadoSsl {
  @PrimaryColumn({ type: "varchar2", length: 36 })
  id!: string;

  @BeforeInsert()
  generateId() {
    if (!this.id) this.id = uuidv4();
  }

  @OneToOne(() => Asset, (a) => a.certificadoSsl, { onDelete: "CASCADE" })
  @JoinColumn({ name: "ASSET_ID" })
  asset!: Asset;

  @Column({ type: "varchar2", length: 20, nullable: true })
  tipoCertificado!: TipoCertificado | null;

  @Column({ type: "varchar2", length: 500, nullable: true })
  nombreAplicacion!: string | null;

  @Column({ type: "varchar2", length: 500, nullable: true })
  nombreDominio!: string | null;

  @Column({ type: "varchar2", length: 500, nullable: true })
  proveedor!: string | null;

  @Column({ type: "varchar2", length: 1000, nullable: true })
  url!: string | null;

  @Column({ type: "timestamp", nullable: true })
  fechaInicio!: Date | null;

  @Column({ type: "timestamp", nullable: true })
  fechaFin!: Date | null;

  @OneToMany(() => CertificadoSslApp, (app) => app.certificadoSsl, { cascade: true, eager: false })
  aplicaciones!: CertificadoSslApp[];
}

