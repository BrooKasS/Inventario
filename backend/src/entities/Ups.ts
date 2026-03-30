import {
  Entity, PrimaryColumn, Column, OneToOne, JoinColumn, BeforeInsert,
} from "typeorm";
import { v4 as uuidv4 } from "uuid";
import { Asset } from "./Asset";

@Entity("UPS")
export class Ups {
  @PrimaryColumn({ type: "varchar2", length: 36 })
  id!: string;

  @BeforeInsert()
  generateId() {
    if (!this.id) this.id = uuidv4();
  }

  @OneToOne(() => Asset, (a) => a.ups, { onDelete: "CASCADE" })
  @JoinColumn({ name: "ASSET_ID" })
  asset!: Asset;

  @Column({ type: "varchar2", length: 200, nullable: true })
  serial!: string | null;

  @Column({ type: "varchar2", length: 200, nullable: true })
  placa!: string | null;

  @Column({ type: "varchar2", length: 500, nullable: true })
  modelo!: string | null;

  @Column({ type: "varchar2", length: 100, nullable: true })
  estado!: string | null;
}