import {
  Entity, PrimaryColumn, Column, OneToOne, JoinColumn, BeforeInsert,
} from "typeorm";
import { v4 as uuidv4 } from "uuid";
import { Asset } from "./Asset";

@Entity("BASE_DATOS")
export class BaseDatos {
  @PrimaryColumn({ type: "varchar2", length: 36 })
  id!: string;

  @BeforeInsert()
  generateId() {
    if (!this.id) this.id = uuidv4();
  }

  @OneToOne(() => Asset, (a) => a.baseDatos, { onDelete: "CASCADE" })
  @JoinColumn({ name: "ASSET_ID" })
  asset!: Asset;

  @Column({ type: "varchar2", length: 500, nullable: true })
  servidor1!: string | null;

  @Column({ type: "varchar2", length: 500, nullable: true })
  servidor2!: string | null;

  @Column({ type: "varchar2", length: 500, nullable: true })
  racScan!: string | null;

  @Column({ type: "varchar2", length: 100, nullable: true })
  ambiente! : string | null;

  @Column({ type: "varchar2", length: 1000, nullable: true })
  appSoporta!: string | null;

  @Column({ type: "varchar2", length: 100, nullable: true })
  versionBd!: string | null;

  @Column({ type: "timestamp", nullable: true })
  fechaFinalSoporte!: Date | null;

  @Column({ type: "varchar2", length: 500, nullable: true })
  contenedorFisico!: string | null;

  @Column({ type: "varchar2", length: 500, nullable: true })
  contratoQueSoporta!: string | null;
}