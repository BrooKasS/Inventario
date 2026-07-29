import {
  Entity, PrimaryColumn, Column, ManyToOne, JoinColumn, BeforeInsert,
} from "typeorm";
import { v4 as uuidv4 } from "uuid";
import { CertificadoSsl } from "./CertificadoSsl";

@Entity("CERTIFICADOS_SSL_APPS")
export class CertificadoSslApp {
  @PrimaryColumn({ type: "varchar2", length: 36 })
  id!: string;

  @BeforeInsert()
  generateId() {
    if (!this.id) this.id = uuidv4();
  }

  @ManyToOne(() => CertificadoSsl, (c) => c.aplicaciones, { onDelete: "CASCADE" })
  @JoinColumn({ name: "CERTIFICADO_SSL_ID" })
  certificadoSsl!: CertificadoSsl;

  @Column({ type: "varchar2", length: 500, nullable: true })
  nombreAplicacion!: string | null;

  @Column({ type: "varchar2", length: 1000, nullable: true })
  url!: string | null;

  @Column({ type: "timestamp", nullable: true })
  fechaInicio!: Date | null;

  @Column({ type: "timestamp", nullable: true })
  fechaFin!: Date | null;
}
