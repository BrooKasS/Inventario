import {
  Entity, PrimaryColumn, Column, OneToOne, OneToMany, JoinColumn, BeforeInsert,
} from "typeorm";
import { v4 as uuidv4 } from "uuid";
import { Asset } from "./Asset";
import { VpnRule } from "./VpnRule";

@Entity("VPNS")
export class Vpn {
  @PrimaryColumn({ type: "varchar2", length: 36 })
  id!: string;

  @BeforeInsert()
  generateId() {
    if (!this.id) this.id = uuidv4();
  }

  @OneToOne(() => Asset, (a) => a.vpn, { onDelete: "CASCADE" })
  @JoinColumn({ name: "ASSET_ID" })
  asset!: Asset;

  @Column({ type: "varchar2", length: 500, nullable: true })
  conexion!: string | null;

  @Column({ type: "varchar2", length: 500, nullable: true })
  fases!: string | null;

  @Column({ type: "varchar2", length: 1000, nullable: true })
  origen!: string | null;

  @Column({ type: "varchar2", length: 1000, nullable: true })
  destino!: string | null;

  // ─────────────────────────────────────────────────────────────────────
  // CAMPO ORIGINAL: Diferencia VPNs principales de sus reglas
  // ✅ name explícito para que TypeORM no genere "vpnPrincipalId" camelCase
  //    y Oracle lo rechace con ORA-00904
  // ─────────────────────────────────────────────────────────────────────
  @Column({ name: "VPN_PRINCIPAL_ID", type: "varchar2", length: 36, nullable: true })
  vpnPrincipalId!: string | null;

  // ─────────────────────────────────────────────────────────────────────
  // RELACIÓN A VPN_RULES (Reglas Asociadas)
  // ─────────────────────────────────────────────────────────────────────
  @OneToMany(() => VpnRule, (rule) => rule.vpn, { 
    cascade: true, 
    eager: false,
  })
  reglas!: VpnRule[];
}