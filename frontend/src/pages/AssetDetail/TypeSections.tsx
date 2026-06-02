import type { Asset, Vpn, VpnRule } from "../../types";
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
    <>
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

      {/* Reglas Asociadas */}
      {(() => {
        const reglasNuevas = v.reglas ?? [];
        const reglasHistoricas = (v as any).reglasHistoricas ?? [];
        const totalReglas = reglasNuevas.length + reglasHistoricas.length;
        
        if (totalReglas === 0) return null;
        
        return (
          <Section title={`Reglas Asociadas (${totalReglas})`} icon="🔗">
            <div className="space-y-3">
              {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
              {/* NUEVAS REGLAS (VPN_RULES) */}
              {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
              {reglasNuevas.length > 0 && (
                <div className="mb-4">
                  <div className="text-xs font-bold text-green-700 bg-green-50 px-3 py-1 rounded inline-block mb-2">
                    ✨ Reglas Nuevas ({reglasNuevas.length})
                  </div>
                  <div className="space-y-2">
                    {reglasNuevas.map((regla: VpnRule, idx: number) => (
                      <div
                        key={idx}
                        className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg hover:shadow-md transition-all"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className="inline-block w-6 h-6 bg-green-600 text-white rounded-full text-center text-xs font-bold leading-6">
                            {idx + 1}
                          </span>
                          <span className="font-bold text-green-900">Regla #{idx + 1}</span>
                        </div>
                        {regla.conexion && (
                          <div className="mb-2 p-2 bg-white rounded border-l-4 border-blue-500">
                            <div className="text-xs font-semibold text-gray-500 uppercase">🌐 Conexión</div>
                            <div className="text-sm font-mono text-blue-700 font-bold mt-1">{regla.conexion}</div>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          {regla.origen && (
                            <div className="flex-1 p-2 bg-white rounded border-l-4 border-green-500">
                              <div className="text-xs font-semibold text-gray-500">← Origen</div>
                              <div className="text-xs font-mono text-green-700 mt-1 break-all">{regla.origen}</div>
                            </div>
                          )}
                          <div className="flex-shrink-0 text-2xl text-green-500 font-bold">→</div>
                          {regla.destino && (
                            <div className="flex-1 p-2 bg-white rounded border-l-4 border-red-500">
                              <div className="text-xs font-semibold text-gray-500">Destino →</div>
                              <div className="text-xs font-mono text-red-700 mt-1 break-all">{regla.destino}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
              {/* REGLAS HISTÓRICAS (VPNS - existentes) */}
              {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
              {reglasHistoricas.length > 0 && (
                <div>
                  <div className="text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded inline-block mb-2">
                    📋 Reglas Históricas ({reglasHistoricas.length})
                  </div>
                  <div className="space-y-2">
                    {reglasHistoricas.map((regla: Vpn, idx: number) => (
                      <div
                        key={idx}
                        className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-lg hover:shadow-md transition-all opacity-85"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className="inline-block w-6 h-6 bg-amber-600 text-white rounded-full text-center text-xs font-bold leading-6">
                            {idx + 1}
                          </span>
                          <span className="font-bold text-amber-900">{regla.conexion || `Regla ${idx + 1}`}</span>
                        </div>
                        {regla.conexion && (
                          <div className="mb-2 p-2 bg-white rounded border-l-4 border-blue-400">
                            <div className="text-xs font-semibold text-gray-500 uppercase">🌐 Conexión</div>
                            <div className="text-sm font-mono text-blue-600 font-bold mt-1">{regla.conexion}</div>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          {regla.origen && (
                            <div className="flex-1 p-2 bg-white rounded border-l-4 border-green-400">
                              <div className="text-xs font-semibold text-gray-500">← Origen</div>
                              <div className="text-xs font-mono text-green-600 mt-1 break-all">{regla.origen}</div>
                            </div>
                          )}
                          <div className="flex-shrink-0 text-2xl text-amber-500 font-bold">→</div>
                          {regla.destino && (
                            <div className="flex-1 p-2 bg-white rounded border-l-4 border-red-400">
                              <div className="text-xs font-semibold text-gray-500">Destino →</div>
                              <div className="text-xs font-mono text-red-600 mt-1 break-all">{regla.destino}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Section>
        );
      })()}
    </>
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

  const estado = m.estados;
  const procesoCerrado = estado === "DEVUELTO";
  const actaEntregaFirmada = !!m.firmaPath;
  const puedeEditarCorreo = editing && !procesoCerrado;
  const puedeEditarActaEntrega = editing && !procesoCerrado && !actaEntregaFirmada;
  const puedeEditarDevolucion =
    editing && !procesoCerrado && (estado === "DEVOLUCION" || estado === "PENDIENTE_DEVOLUCION");

  return (
    <>
      <Section title="Datos del Usuario" icon="Usuario">
        <Field
          label="# Caso"
          value={m.numeroCaso}
          editing={puedeEditarActaEntrega}
          field="numeroCaso"
          onChange={(f, v) => handleChange("movil", f, v)}
        />
        <Field
          label="Region/Departamento"
          value={m.region}
          editing={puedeEditarActaEntrega}
          field="region"
          onChange={(f, v) => handleChange("movil", f, v)}
        />
        <Field
          label="Dependencia/Area"
          value={m.dependencia}
          editing={puedeEditarActaEntrega}
          field="dependencia"
          onChange={(f, v) => handleChange("movil", f, v)}
        />
        <Field
          label="Sede"
          value={m.sede}
          editing={puedeEditarActaEntrega}
          field="sede"
          onChange={(f, v) => handleChange("movil", f, v)}
        />
        <Field
          label="C.C."
          value={m.cedula}
          editing={puedeEditarActaEntrega}
          field="cedula"
          onChange={(f, v) => handleChange("movil", f, v)}
        />
        <Field
          label="Usuario de Red"
          value={m.usuarioRed}
          editing={puedeEditarActaEntrega}
          field="usuarioRed"
          onChange={(f, v) => handleChange("movil", f, v)}
        />
        <Field
          label="Correo Responsable"
          value={m.correoResponsable}
          editing={puedeEditarCorreo}
          field="correoResponsable"
          onChange={(f, v) => handleChange("movil", f, v)}
        />
      </Section>

      <Section title="Datos del Equipo Entregado" icon="Movil">
        <Field
          label="UNI"
          value={m.uni}
          editing={puedeEditarActaEntrega}
          field="uni"
          onChange={(f, v) => handleChange("movil", f, v)}
        />
        <Field
          label="Marca"
          value={m.marca}
          editing={puedeEditarActaEntrega}
          field="marca"
          onChange={(f, v) => handleChange("movil", f, v)}
        />
        <Field
          label="Modelo"
          value={m.modelo}
          editing={puedeEditarActaEntrega}
          field="modelo"
          onChange={(f, v) => handleChange("movil", f, v)}
        />
        <Field
          label="Serial"
          value={m.serial}
          editing={puedeEditarActaEntrega}
          field="serial"
          onChange={(f, v) => handleChange("movil", f, v)}
        />
        <Field
          label="IMEI 1"
          value={m.imei1}
          editing={puedeEditarActaEntrega}
          field="imei1"
          onChange={(f, v) => handleChange("movil", f, v)}
        />
        <Field
          label="IMEI 2"
          value={m.imei2}
          editing={puedeEditarActaEntrega}
          field="imei2"
          onChange={(f, v) => handleChange("movil", f, v)}
        />
        <Field
          label="SIM"
          value={m.sim}
          editing={puedeEditarActaEntrega}
          field="sim"
          onChange={(f, v) => handleChange("movil", f, v)}
        />
        <Field
          label="Numero de Linea"
          value={m.numeroLinea}
          editing={puedeEditarActaEntrega}
          field="numeroLinea"
          onChange={(f, v) => handleChange("movil", f, v)}
        />
        <Field
          label="Fecha de Entrega"
          value={m.fechaEntrega}
          editing={puedeEditarActaEntrega}
          field="fechaEntrega"
          onChange={(f, v) => handleChange("movil", f, v)}
        />
        <Field
          label="Observaciones Entrega"
          value={m.observacionesEntrega}
          editing={puedeEditarActaEntrega}
          field="observacionesEntrega"
          onChange={(f, v) => handleChange("movil", f, v)}
        />
      </Section>

      {(estado === "DEVOLUCION" || estado === "PENDIENTE_DEVOLUCION" || estado === "DEVUELTO" || editing) && (
        <Section title="Datos de Devolucion" icon="Devolucion">
          <Field
            label="Fecha de Devolucion"
            value={m.fechaDevolucion}
            editing={false}
            field="fechaDevolucion"
            onChange={(f, v) => handleChange("movil", f, v)}
          />
          <Field
            label="Observaciones Devolucion"
            value={m.observacionesDevolucion}
            editing={puedeEditarDevolucion}
            field="observacionesDevolucion"
            onChange={(f, v) => handleChange("movil", f, v)}
          />
        </Section>
      )}
    </>
  );
}
