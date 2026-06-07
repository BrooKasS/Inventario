import type { Asset, Vpn, VpnRule } from "../../types";
import { Field, Section } from "./DetailComponents";
import { useState } from "react";

/* ═══════════════════════════════════════════
   SERVIDOR SECTIONS
═══════════════════════════════════════════ */
export function ServidorSections({
  asset,
  editing,
  handleChange,
}: {
  asset: Asset;//
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

function ReglaHistorica({ regla, idx, editing, onEliminar }: { 
  regla: Vpn; 
  idx: number; 
  editing: boolean;
  onEliminar: () => void;
}) {
  const [editando, setEditando] = useState(false);
  const [valores, setValores] = useState({
    conexion: regla.conexion ?? "",
    origen:   regla.origen   ?? "",
    destino:  regla.destino  ?? "",
    fases:    regla.fases    ?? "",
  });
  const [guardando, setGuardando] = useState(false);
  const [eliminando, setEliminando] = useState(false);

  const guardarRegla = async () => {
    setGuardando(true);
    try {
      const token = sessionStorage.getItem("inventario_token");
      await fetch(`${import.meta.env.VITE_API_URL}/assets/${regla.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ vpn: valores }),
      });
      setEditando(false);
    } catch {
      alert("Error al guardar la regla");
    } finally {
      setGuardando(false);
    }
  };

  const eliminarRegla = async () => {
    if (!window.confirm("¿Eliminar esta regla permanentemente?")) return;
    setEliminando(true);
    try {
      const token = sessionStorage.getItem("inventario_token");
      await fetch(`${import.meta.env.VITE_API_URL}/assets/${regla.id}/hard`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      onEliminar();
    } catch {
      alert("Error al eliminar la regla");
      setEliminando(false);
    }
  };

  return (
    <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-lg hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="inline-block w-6 h-6 bg-amber-600 text-white rounded-full text-center text-xs font-bold leading-6">{idx + 1}</span>
          <span className="font-bold text-amber-900">{valores.conexion || `Regla ${idx + 1}`}</span>
        </div>
        {editing && (
          <div className="flex gap-2">
            {editando ? (
              <>
                <button onClick={guardarRegla} disabled={guardando}
                  style={{ padding:"4px 12px", background:"#22c55e", color:"#fff", border:"none", borderRadius:6, fontWeight:700, fontSize:12, cursor:"pointer" }}>
                  {guardando ? "Guardando..." : "💾 Guardar"}
                </button>
                <button onClick={() => setEditando(false)}
                  style={{ padding:"4px 12px", background:"#6b7280", color:"#fff", border:"none", borderRadius:6, fontWeight:700, fontSize:12, cursor:"pointer" }}>
                  Cancelar
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setEditando(true)}
                  style={{ padding:"4px 12px", background:"#f59e0b", color:"#fff", border:"none", borderRadius:6, fontWeight:700, fontSize:12, cursor:"pointer" }}>
                  ✏️ Editar
                </button>
                <button onClick={eliminarRegla} disabled={eliminando}
                  style={{ padding:"4px 12px", background:"#ef4444", color:"#fff", border:"none", borderRadius:6, fontWeight:700, fontSize:12, cursor:"pointer" }}>
                  {eliminando ? "..." : "✕"}
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <div className="mb-2 p-2 bg-white rounded border-l-4 border-blue-400">
        <div className="text-xs font-semibold text-gray-500 uppercase">🌐 Conexión</div>
        {editando ? (
          <input value={valores.conexion} onChange={e => setValores(v => ({ ...v, conexion: e.target.value }))}
            style={{ width:"100%", padding:"4px 8px", border:"1px solid #d1d5db", borderRadius:4, fontSize:13, marginTop:4, boxSizing:"border-box" as any }} />
        ) : (
          <div className="text-sm font-mono text-blue-600 font-bold mt-1">{valores.conexion || "—"}</div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className="flex-1 p-2 bg-white rounded border-l-4 border-green-400">
          <div className="text-xs font-semibold text-gray-500">← Origen</div>
          {editando ? (
            <input value={valores.origen} onChange={e => setValores(v => ({ ...v, origen: e.target.value }))}
              style={{ width:"100%", padding:"4px 8px", border:"1px solid #d1d5db", borderRadius:4, fontSize:13, marginTop:4, boxSizing:"border-box" as any }} />
          ) : (
            <div className="text-xs font-mono text-green-600 mt-1 break-all">{valores.origen || "—"}</div>
          )}
        </div>
        <div className="flex-shrink-0 text-2xl text-amber-500 font-bold">→</div>
        <div className="flex-1 p-2 bg-white rounded border-l-4 border-red-400">
          <div className="text-xs font-semibold text-gray-500">Destino →</div>
          {editando ? (
            <input value={valores.destino} onChange={e => setValores(v => ({ ...v, destino: e.target.value }))}
              style={{ width:"100%", padding:"4px 8px", border:"1px solid #d1d5db", borderRadius:4, fontSize:13, marginTop:4, boxSizing:"border-box" as any }} />
          ) : (
            <div className="text-xs font-mono text-red-600 mt-1 break-all">{valores.destino || "—"}</div>
          )}
        </div>
      </div>
    </div>
  );
}

export function VpnSection({
  asset,
  editing,
  handleChange,
}: {
  asset: Asset;
  editing: boolean;
  handleChange: (section: string | null, field: string, val: any) => void;
}) {
  const v = asset.vpn;
  const [historicas, setHistoricas] = useState<Vpn[]>((v as any)?.reglasHistoricas ?? []);
  const [nuevaRegla, setNuevaRegla] = useState({ conexion:"", fases:"", origen:"", destino:"" });
  const [reglas, setReglas] = useState<Partial<VpnRule>[]>(v?.reglas ?? []);

  if (!v) return null;

  const agregarRegla = () => {
    if (!nuevaRegla.conexion && !nuevaRegla.origen && !nuevaRegla.destino) return;
    const actualizadas = [...reglas, nuevaRegla];
    setReglas(actualizadas);
    setNuevaRegla({ conexion:"", fases:"", origen:"", destino:"" });
    handleChange("vpn", "reglas", actualizadas as any);
  };

  const eliminarRegla = (idx: number) => {
    const actualizadas = reglas.filter((_, i) => i !== idx);
    setReglas(actualizadas);
    handleChange("vpn", "reglas", actualizadas as any);
  };

  const totalReglas = reglas.length + historicas.length;

  return (
    <>
      <Section title="VPN" icon="🔒">
        <Field label="Conexión" value={v.conexion} editing={editing} field="conexion" onChange={(f, val) => handleChange("vpn", f, val)} />
        <Field label="Fases"    value={v.fases}    editing={editing} field="fases"    onChange={(f, val) => handleChange("vpn", f, val)} />
        <Field label="Origen"   value={v.origen}   editing={editing} field="origen"   onChange={(f, val) => handleChange("vpn", f, val)} />
        <Field label="Destino"  value={v.destino}  editing={editing} field="destino"  onChange={(f, val) => handleChange("vpn", f, val)} />
      </Section>

      {(totalReglas > 0 || editing) && (
        <Section title={`Reglas Asociadas (${totalReglas})`} icon="🔗">
          <div className="space-y-3">

            {/* TODAS LAS REGLAS JUNTAS */}
            {reglas.map((regla, idx) => (
              <div key={idx} className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-6 h-6 bg-green-600 text-white rounded-full text-center text-xs font-bold leading-6">{idx + 1}</span>
                    <span className="font-bold text-green-900">{regla.conexion || `Regla #${idx + 1}`}</span>
                  </div>
                  {editing && (
                    <button onClick={() => eliminarRegla(idx)}
                      style={{ padding:"4px 10px", background:"#ef4444", color:"#fff", border:"none", borderRadius:6, fontSize:12, fontWeight:700, cursor:"pointer" }}>
                      ✕
                    </button>
                  )}
                </div>
                <div className="mb-2 p-2 bg-white rounded border-l-4 border-blue-500">
                  <div className="text-xs font-semibold text-gray-500 uppercase">🌐 Conexión</div>
                  <div className="text-sm font-mono text-blue-700 font-bold mt-1">{regla.conexion || "—"}</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 p-2 bg-white rounded border-l-4 border-green-500">
                    <div className="text-xs font-semibold text-gray-500">← Origen</div>
                    <div className="text-xs font-mono text-green-700 mt-1 break-all">{regla.origen || "—"}</div>
                  </div>
                  <div className="flex-shrink-0 text-2xl text-green-500 font-bold">→</div>
                  <div className="flex-1 p-2 bg-white rounded border-l-4 border-red-500">
                    <div className="text-xs font-semibold text-gray-500">Destino →</div>
                    <div className="text-xs font-mono text-red-700 mt-1 break-all">{regla.destino || "—"}</div>
                  </div>
                </div>
              </div>
            ))}

            {historicas.map((regla, idx) => (
              <ReglaHistorica
                key={regla.id ?? idx}
                regla={regla}
                idx={reglas.length + idx}
                editing={editing}
                onEliminar={() => setHistoricas(h => h.filter(r => r.id !== regla.id))}
              />
            ))}

            {/* FORMULARIO AGREGAR */}
            {editing && (
              <div style={{ marginTop:16, background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:8, padding:16 }}>
                <div style={{ fontSize:11, fontWeight:700, color:"#374151", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:12 }}>
                  📝 Agregar Nueva Regla
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:12 }}>
                  {["conexion","fases","origen","destino"].map(campo => (
                    <div key={campo}>
                      <label style={{ fontSize:11, fontWeight:700, color:"#374151", display:"block", marginBottom:4, textTransform:"uppercase" as any }}>{campo}</label>
                      <input
                        value={(nuevaRegla as any)[campo]}
                        onChange={e => setNuevaRegla(r => ({ ...r, [campo]: e.target.value }))}
                        style={{ width:"100%", padding:"6px 10px", border:"1px solid #d1d5db", borderRadius:6, fontSize:13, boxSizing:"border-box" as any }}
                      />
                    </div>
                  ))}
                </div>
                <button onClick={agregarRegla}
                  style={{ width:"100%", padding:"10px", background:"#6366f1", color:"#fff", border:"none", borderRadius:6, fontWeight:700, fontSize:13, cursor:"pointer" }}>
                  + Agregar Regla
                </button>
              </div>
            )}

          </div>
        </Section>
      )}
    </>
  );
}

/* ═══════════════════════════════════════════
   MOVIL

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
