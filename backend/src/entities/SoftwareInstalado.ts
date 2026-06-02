import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
  BeforeInsert,
  CreateDateColumn,
} from "typeorm";
import { v4 as uuidv4 } from "uuid";
import { Asset } from "./Asset";
import { OcsServerMapping } from "./OcsServerMapping";

@Entity("SOFTWARE_INSTALADO")
export class SoftwareInstalado {
  @PrimaryColumn({ type: "varchar2", length: 36 })
  id!: string;

  @BeforeInsert()
  generateId() {
    if (!this.id) this.id = uuidv4();
  }

  // FK → ASSETS (para consultar directo sin pasar por mapping)
  @ManyToOne(() => Asset, { onDelete: "CASCADE", nullable: false })
  @JoinColumn({ name: "ASSET_ID" })
  asset!: Asset;

  // FK → OCS_SERVER_MAPPING
  @ManyToOne(() => OcsServerMapping, { onDelete: "CASCADE", nullable: false })
  @JoinColumn({ name: "OCS_SERVER_MAPPING_ID" })
  ocsServerMapping!: OcsServerMapping;

  @Column({ name: "SOFTWARE_NAME", type: "varchar2", length: 500, nullable: false })
  softwareName!: string;

  @Column({ name: "SOFTWARE_VERSION", type: "varchar2", length: 255, nullable: true })
  softwareVersion!: string | null;

  // Editor/Publisher del software (viene de OCS)
  @Column({ name: "SOFTWARE_PUBLISHER", type: "varchar2", length: 500, nullable: true })
  softwarePublisher!: string | null;

  @CreateDateColumn({ name: "CREATED_AT", type: "timestamp" })
  createdAt!: Date;
}