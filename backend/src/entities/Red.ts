import {
  Entity, PrimaryColumn, Column, OneToOne, JoinColumn, BeforeInsert,
} from "typeorm";
import { v4 as uuidv4 } from "uuid";
import { Asset } from "./Asset";

@Entity("REDES")
export class Red {
  @PrimaryColumn({ type: "varchar2", length: 36 })
  id!: string;

  @BeforeInsert()
  generateId() {
    if (!this.id) this.id = uuidv4();
  }

  @OneToOne(() => Asset, (a) => a.red, { onDelete: "CASCADE" })
  @JoinColumn({ name: "ASSET_ID" })
  asset!: Asset;

  @Column({ type: "varchar2", length: 200, nullable: true })
  serial!: string | null;

  @Column({ type: "varchar2", length: 200, nullable: true })
  mac!: string | null;

  @Column({ type: "varchar2", length: 500, nullable: true })
  modelo!: string | null;

  @Column({ type: "timestamp", nullable: true })
  fechaFinSoporte!: Date | null;

  @Column({ type: "varchar2", length: 100, nullable: true })
  ipGestion!: string | null;

  @Column({ type: "varchar2", length: 100, nullable: true })
  estado!: string | null;

  @Column({ type: "varchar2", length: 500, nullable: true })
  contratoQueSoporta!: string | null;
}