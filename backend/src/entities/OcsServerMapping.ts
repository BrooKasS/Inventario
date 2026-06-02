import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
  BeforeInsert,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { v4 as uuidv4 } from "uuid";
import { Asset } from "./Asset";

export type OcsMappingStatus = "MAPPED" | "PENDING" | "FAILED";

@Entity("OCS_SERVER_MAPPING")
export class OcsServerMapping {
  @PrimaryColumn({ type: "varchar2", length: 36 })
  id!: string;

  @BeforeInsert()
  generateId() {
    if (!this.id) this.id = uuidv4();
  }

  // FK → ASSETS
  @ManyToOne(() => Asset, { onDelete: "CASCADE", nullable: false })
  @JoinColumn({ name: "ASSET_ID" })
  asset!: Asset;

  // ID del hardware en MySQL OCS
  @Column({ name: "OCS_HARDWARE_ID", type: "number", nullable: false })
  ocsHardwareId!: number;

  // Nombre del equipo en OCS
  @Column({ name: "OCS_HARDWARE_NAME", type: "varchar2", length: 255, nullable: true })
  ocsHardwareName!: string | null;

  // IP que coincidió (ipInterna, ipGestion o ipServicio)
  @Column({ name: "IP_MATCHED", type: "varchar2", length: 100, nullable: true })
  ipMatched!: string | null;

  // Cuál campo de SERVIDORES hizo match
  @Column({ name: "IP_FIELD_MATCHED", type: "varchar2", length: 50, nullable: true })
  ipFieldMatched!: string | null; // 'ipInterna' | 'ipGestion' | 'ipServicio'

  @Column({
    name: "STATUS",
    type: "varchar2",
    length: 20,
    default: "MAPPED",
    nullable: false,
  })
  status!: OcsMappingStatus;

  @Column({ name: "SYNC_DATE", type: "timestamp", nullable: true })
  syncDate!: Date | null;

  @CreateDateColumn({ name: "CREATED_AT", type: "timestamp" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "UPDATED_AT", type: "timestamp" })
  updatedAt!: Date;
}