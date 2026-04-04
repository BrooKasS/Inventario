import type { Asset } from "../../types";
import { Field, Section } from "./DetailComponents";

/* ═══════════════════════════════════════════
   SERVIDOR SECTIONS
═══════════════════════════════════════════ */
export function ServidorSections({
  asset,
  editing,
  handleChange,
}: {
  asset: Asset;
  editing: boolean;
  handleChange: (section: string | null, field: string, val: string) => void;
}) {
  const s = asset.servidor;

  if (!s) return null;

  return (
    <>
      <Section title="Red" icon="🌐">
        <Field
          label="IP Interna"
          value={s.ipInterna}
          editing={editing}
          field="ipInterna"
          onChange={(f, v) => handleChange("servidor", f, v)}
        />
        <Field
          label="IP Gestión"
          value={s.ipGestion}
          editing={editing}
          field="ipGestion"
          onChange={(f, v) => handleChange("servidor", f, v)}
        />
        <Field
          label="IP Servicio"
          value={s.ipServicio}
          editing={editing}
          field="ipServicio"
          onChange={(f, v) => handleChange("servidor", f, v)}
        />
      </Section>

      <Section title="Recursos" icon="⚙️">
        <Field
          label="vCPU"
          value={s.vcpu}
          editing={editing}
          field="vcpu"
          onChange={(f, v) => handleChange("servidor", f, v)}
        />
     <Field
  label="vRAM (MB)"
  value={s.vramMb ? String(s.vramMb) : null}
  editing={editing}
  field="vramMb"
  onChange={(f, v) => handleChange("servidor", f, v)}
/>
        <Field
          label="Sistema Operativo"
          value={s.sistemaOperativo}
          editing={editing}
          field="sistemaOperativo"
          onChange={(f, v) => handleChange("servidor", f, v)}
        />
      </Section>

      <Section title="Operación" icon="🔧">
        <Field
          label="Ambiente"
          value={s.ambiente}
          editing={editing}
          field="ambiente"
          onChange={(f, v) => handleChange("servidor", f, v)}
        />
        <Field
          label="Tipo Servidor"
          value={s.tipoServidor}
          editing={editing}
          field="tipoServidor"
          onChange={(f, v) => handleChange("servidor", f, v)}
        />
        <Field
          label="Aplicación que soporta"
          value={s.appSoporta}
          editing={editing}
          field="appSoporta"
          onChange={(f, v) => handleChange("servidor", f, v)}
        />
        <Field
          label="Monitoreo"
          value={s.monitoreo}
          editing={editing}
          field="monitoreo"
          onChange={(f, v) => handleChange("servidor", f, v)}
        />
        <Field
          label="Backup"
          value={s.backup}
          editing={editing}
          field="backup"
          onChange={(f, v) => handleChange("servidor", f, v)}
        />
        <Field
          label="Rutas de Backup"
          value={s.rutasBackup}
          editing={editing}
          field="rutasBackup"
          onChange={(f, v) => handleChange("servidor", f, v)}
        />
        <Field
          label="Fecha Fin Soporte"
          value={s.fechaFinSoporte}
          editing={editing}
          field="fechaFinSoporte"
          onChange={(f, v) => handleChange("servidor", f, v)}
        />
        <Field
          label="Contrato que lo soporta"
          value={s.contratoQueSoporta}
          editing={editing}
          field="contratoQueSoporta"
          onChange={(f, v) => handleChange("servidor", f, v)}
        />
      </Section>
    </>
  );
}

/* ═══════════════════════════════════════════
   RED SECTION
═══════════════════════════════════════════ */
export function RedSection({
  asset,
  editing,
  handleChange,
}: {
  asset: Asset;
  editing: boolean;
  handleChange: (section: string | null, field: string, val: string) => void;
}) {
  const r = asset.red;

  if (!r) return null;

  return (
    <Section title="Equipo de Red" icon="🔌">
      <Field
        label="Serial"
        value={r.serial}
        editing={editing}
        field="serial"
        onChange={(f, v) => handleChange("red", f, v)}
      />
      <Field
        label="MAC"
        value={r.mac}
        editing={editing}
        field="mac"
        onChange={(f, v) => handleChange("red", f, v)}
      />
      <Field
        label="Modelo"
        value={r.modelo}
        editing={editing}
        field="modelo"
        onChange={(f, v) => handleChange("red", f, v)}
      />
      <Field
        label="IP Gestión"
        value={r.ipGestion}
        editing={editing}
        field="ipGestion"
        onChange={(f, v) => handleChange("red", f, v)}
      />
      <Field
        label="Estado"
        value={r.estado}
        editing={editing}
        field="estado"
        onChange={(f, v) => handleChange("red", f, v)}
      />
      <Field
        label="Fecha Fin Soporte"
        value={r.fechaFinSoporte}
        editing={editing}
        field="fechaFinSoporte"
        onChange={(f, v) => handleChange("red", f, v)}
      />
      <Field
        label="Contrato que lo soporta"
        value={r.contratoQueSoporta}
        editing={editing}
        field="contratoQueSoporta"
        onChange={(f, v) => handleChange("red", f, v)}
      />
    </Section>
  );
}

/* ═══════════════════════════════════════════
   UPS SECTION
═══════════════════════════════════════════ */
export function UpsSection({
  asset,
  editing,
  handleChange,
}: {
  asset: Asset;
  editing: boolean;
  handleChange: (section: string | null, field: string, val: string) => void;
}) {
  const u = asset.ups;

  if (!u) return null;

  return (
    <Section title="UPS" icon="🔋">
      <Field
        label="Serial"
        value={u.serial}
        editing={editing}
        field="serial"
        onChange={(f, v) => handleChange("ups", f, v)}
      />
      <Field
        label="Placa"
        value={u.placa}
        editing={editing}
        field="placa"
        onChange={(f, v) => handleChange("ups", f, v)}
      />
      <Field
        label="Modelo"
        value={u.modelo}
        editing={editing}
        field="modelo"
        onChange={(f, v) => handleChange("ups", f, v)}
      />
      <Field
        label="Estado"
        value={u.estado}
        editing={editing}
        field="estado"
        onChange={(f, v) => handleChange("ups", f, v)}
      />
    </Section>
  );
}

/* ═══════════════════════════════════════════
   BASE DATOS SECTION
═══════════════════════════════════════════ */
export function BaseDatosSection({
  asset,
  editing,
  handleChange,
}: {
  asset: Asset;
  editing: boolean;
  handleChange: (section: string | null, field: string, val: string) => void;
}) {
  const b = asset.baseDatos;

  if (!b) return null;

  return (
    <Section title="Base de Datos" icon="🗄️">
      <Field
        label="Servidor 1"
        value={b.servidor1}
        editing={editing}
        field="servidor1"
        onChange={(f, v) => handleChange("baseDatos", f, v)}
      />
      <Field
        label="Servidor 2"
        value={b.servidor2}
        editing={editing}
        field="servidor2"
        onChange={(f, v) => handleChange("baseDatos", f, v)}
      />
      <Field
        label="RAC/Scan"
        value={b.racScan}
        editing={editing}
        field="racScan"
        onChange={(f, v) => handleChange("baseDatos", f, v)}
      />
      <Field
        label="Ambiente"
        value={b.ambiente}
        editing={editing}
        field="ambiente"
        onChange={(f, v) => handleChange("baseDatos", f, v)}
      />
      <Field
        label="Aplicación"
        value={b.appSoporta}
        editing={editing}
        field="appSoporta"
        onChange={(f, v) => handleChange("baseDatos", f, v)}
      />
      <Field
        label="Versión BD"
        value={b.versionBd}
        editing={editing}
        field="versionBd"
        onChange={(f, v) => handleChange("baseDatos", f, v)}
      />
      <Field
        label="Fecha Final Soporte"
        value={b.fechaFinalSoporte}
        editing={editing}
        field="fechaFinalSoporte"
        onChange={(f, v) => handleChange("baseDatos", f, v)}
      />
      <Field
        label="Contenedor Físico"
        value={b.contenedorFisico}
        editing={editing}
        field="contenedorFisico"
        onChange={(f, v) => handleChange("baseDatos", f, v)}
      />
      <Field
        label="Contrato que lo soporta"
        value={b.contratoQueSoporta}
        editing={editing}
        field="contratoQueSoporta"
        onChange={(f, v) => handleChange("baseDatos", f, v)}
      />
    </Section>
  );
}

/* ═══════════════════════════════════════════
   VPN SECTION
═══════════════════════════════════════════ */
export function VpnSection({
  asset,
  editing,
  handleChange,
}: {
  asset: Asset;
  editing: boolean;
  handleChange: (section: string | null, field: string, val: string) => void;
}) {
  const v = asset.vpn;

  if (!v) return null;

  return (
    <Section title="VPN" icon="🔒">
      <Field
        label="Conexión"
        value={v.conexion}
        editing={editing}
        field="conexion"
        onChange={(f, val) => handleChange("vpn", f, val)}
      />
      <Field
        label="Fases"
        value={v.fases}
        editing={editing}
        field="fases"
        onChange={(f, val) => handleChange("vpn", f, val)}
      />
      <Field
        label="Origen"
        value={v.origen}
        editing={editing}
        field="origen"
        onChange={(f, val) => handleChange("vpn", f, val)}
      />
      <Field
        label="Destino"
        value={v.destino}
        editing={editing}
        field="destino"
        onChange={(f, val) => handleChange("vpn", f, val)}
      />
    </Section>
  );
}

/* ═══════════════════════════════════════════
   MOVIL SECTION
═══════════════════════════════════════════ */
export function MovilSection({
  asset,
  editing,
  handleChange,
}: {
  asset: Asset;
  editing: boolean;
  handleChange: (section: string | null, field: string, val: string) => void;
}) {
  const m = asset.movil;

  if (!m) return null;

  const tieneEntrega = !!m.fechaEntrega;

  return (
    <>
      {/* ── Datos del usuario ── */}
      <Section title="Datos del Usuario" icon="👤">
        <Field
          label="# Caso"
          value={m.numeroCaso}
          editing={editing}
          field="numeroCaso"
          onChange={(f, v) => handleChange("movil", f, v)}
        />
        <Field
          label="Región/Departamento"
          value={m.region}
          editing={editing}
          field="region"
          onChange={(f, v) => handleChange("movil", f, v)}
        />
        <Field
          label="Dependencia/Área"
          value={m.dependencia}
          editing={editing}
          field="dependencia"
          onChange={(f, v) => handleChange("movil", f, v)}
        />
        <Field
          label="Sede"
          value={m.sede}
          editing={editing}
          field="sede"
          onChange={(f, v) => handleChange("movil", f, v)}
        />
        <Field
          label="C.C."
          value={m.cedula}
          editing={editing}
          field="cedula"
          onChange={(f, v) => handleChange("movil", f, v)}
        />
        <Field
          label="Usuario de Red"
          value={m.usuarioRed}
          editing={editing}
          field="usuarioRed"
          onChange={(f, v) => handleChange("movil", f, v)}
        />
        <Field
          label="Correo Responsable"
          value={m.correoResponsable}
          editing={editing}
          field="correoResponsable"
          onChange={(f, v) => handleChange("movil", f, v)}
        />
      </Section>

      {/* ── Datos del equipo entregado ── */}
      <Section title="Datos del Equipo Entregado" icon="📱">
        <Field
          label="UNI"
          value={m.uni}
          editing={editing}
          field="uni"
          onChange={(f, v) => handleChange("movil", f, v)}
        />
        <Field
          label="Marca"
          value={m.marca}
          editing={editing}
          field="marca"
          onChange={(f, v) => handleChange("movil", f, v)}
        />
        <Field
          label="Modelo"
          value={m.modelo}
          editing={editing}
          field="modelo"
          onChange={(f, v) => handleChange("movil", f, v)}
        />
        <Field
          label="Serial"
          value={m.serial}
          editing={editing}
          field="serial"
          onChange={(f, v) => handleChange("movil", f, v)}
        />
        <Field
          label="IMEI 1"
          value={m.imei1}
          editing={editing}
          field="imei1"
          onChange={(f, v) => handleChange("movil", f, v)}
        />
        <Field
          label="IMEI 2"
          value={m.imei2}
          editing={editing}
          field="imei2"
          onChange={(f, v) => handleChange("movil", f, v)}
        />
        <Field
          label="SIM"
          value={m.sim}
          editing={editing}
          field="sim"
          onChange={(f, v) => handleChange("movil", f, v)}
        />
        <Field
          label="Número de Línea"
          value={m.numeroLinea}
          editing={editing}
          field="numeroLinea"
          onChange={(f, v) => handleChange("movil", f, v)}
        />
        <Field
          label="Fecha de Entrega"
          value={m.fechaEntrega}
          editing={editing}
          field="fechaEntrega"
          onChange={(f, v) => handleChange("movil", f, v)}
        />
        <Field
          label="Observaciones Entrega"
          value={m.observacionesEntrega}
          editing={editing}
          field="observacionesEntrega"
          onChange={(f, v) => handleChange("movil", f, v)}
        />
      </Section>

      {/* ── Devolución — solo si ya fue entregado o se está editando ── */}
      {(tieneEntrega || editing) && (
        <Section title="Datos de Devolución" icon="↩️">
          <Field
            label="Fecha de Devolución"
            value={m.fechaDevolucion}
            editing={editing}
            field="fechaDevolucion"
            onChange={(f, v) => handleChange("movil", f, v)}
          />
          <Field
            label="Observaciones Devolución"
            value={m.observacionesDevolucion}
            editing={editing}
            field="observacionesDevolucion"
            onChange={(f, v) => handleChange("movil", f, v)}
          />
        </Section>
      )}
    </>
  );
}