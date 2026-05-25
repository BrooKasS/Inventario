import {
  Entity, PrimaryColumn, Column, ManyToOne, JoinColumn, BeforeInsert,
} from "typeorm";
import { v4 as uuidv4 } from "uuid";
import { Vpn } from "./Vpn";

@Entity("VPN_RULES")
export class VpnRule {
  @PrimaryColumn({ type: "varchar2", length: 36 })
  id!: string;

  @BeforeInsert()
  generateId() {
    if (!this.id) this.id = uuidv4();
  }

  @ManyToOne(() => Vpn, (vpn) => vpn.reglas, {
    onDelete: "CASCADE",
    eager: false,
    nullable: false,
  })
  @JoinColumn({ name: "VPN_ID" })
  vpn!: Vpn;

  @Column({ type: "varchar2", length: 500, nullable: true })
  conexion!: string | null;

  @Column({ type: "varchar2", length: 500, nullable: true })
  fases!: string | null;

  @Column({ type: "varchar2", length: 500, nullable: true })
  origen!: string | null;

  @Column({ type: "varchar2", length: 500, nullable: true })
  destino!: string | null;
}