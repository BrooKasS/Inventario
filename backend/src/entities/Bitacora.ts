import {
  Entity, PrimaryColumn, Column, ManyToOne, JoinColumn,
  CreateDateColumn, BeforeInsert, Index,
} from "typeorm";
import { v4 as uuidv4 } from "uuid";
import { Asset } from "./Asset";

export type TipoEvento =
  | "IMPORTACION"
  | "CAMBIO_CAMPO"
  | "MANTENIMIENTO"
  | "INCIDENTE"
  | "NOTA";

@Entity("BITACORA")
@Index("IDX_BITACORA_ASSET", ["asset"])
@Index("IDX_BITACORA_CREADO", ["creadoEn"])
export class Bitacora {
  @PrimaryColumn({ type: "varchar2", length: 36 })
  id!: string;

  @BeforeInsert()
  generateId() {
    if (!this.id) this.id = uuidv4();
  }

  @ManyToOne(() => Asset, (a) => a.bitacora, { onDelete: "CASCADE" })
  @JoinColumn({ name: "ASSET_ID" })
  asset!: Asset;

  @Column({ type: "varchar2", length: 500 })
  autor!: string;

  @Column({ type: "varchar2", length: 20 })
  tipoEvento!: TipoEvento;

  @Column({ type: "varchar2", length: 2000 })
  descripcion!: string;

  @Column({ type: "varchar2", length: 200, nullable: true })
  campoModificado!: string | null;

  @Column({ type: "varchar2", length: 2000, nullable: true })
  valorAnterior!: string | null;

  @Column({ type: "varchar2", length: 2000, nullable: true })
  valorNuevo!: string | null;

  @CreateDateColumn({ type: "timestamp" })
  creadoEn!: Date;
}