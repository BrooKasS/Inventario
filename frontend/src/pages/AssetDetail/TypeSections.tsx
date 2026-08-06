import { useState } from "react";
import type { Asset, Vpn, VpnRule } from "../../types";
import {
  Field,
  Section,
  EditSelectField,
  EditAutoField,
  EditDateField,
  UrlField,
  DiasRestantesBadge,
} from "./DetailComponents";
import { CertificadoAplicaciones } from "./CertificadoAplicaciones";

/** En modo lectura oculta filas sin valor; en edición siempre se muestran. */
function has(v: unknown): boolean {
  return v !== null && v !== undefined && v !== "";
}

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

  const hc = (f: string, v: string) => handleChange("servidor", f, v);

  return (
    <>
      <Section title="Red" icon="🌐">
        {(editing || has(s.ipInterna)) && <Field label="IP Interna" value={s.ipInterna} editing={editing} field="ipInterna" onChange={hc} />}
        {(editing || has(s.ipGestion)) && <Field label="IP Gestión" value={s.ipGestion} editing={editing} field="ipGestion" onChange={hc} />}
        {(editing || has(s.ipServicio)) && <Field label="IP Servicio" value={s.ipServicio} editing={editing} field="ipServicio" onChange={hc} />}
      </Section>

      <Section title="Recursos" icon="⚙️">
        {(editing || has(s.vcpu)) && <EditAutoField label="vCPU" value={s.vcpu != null ? String(s.vcpu) : null} field="vcpu" editing={editing} onChange={hc} tipo="SERVIDOR" placeholder="Ej: 4" />}
        {(editing || has(s.vramMb)) && <EditAutoField label="vRAM (MB)" value={s.vramMb != null ? String(s.vramMb) : null} field="vramMb" editing={editing} onChange={hc} tipo="SERVIDOR" placeholder="Ej: 8192" />}
        {(editing || has(s.sistemaOperativo)) && <EditAutoField label="Sistema Operativo" value={s.sistemaOperativo} field="sistemaOperativo" editing={editing} onChange={hc} tipo="SERVIDOR" placeholder="Ej: Windows Server 2019" />}
      </Section>

      <Section title="Operación" icon="🔧">
        {(editing || has(s.ambiente)) && <EditSelectField label="Ambiente" value={s.ambiente} field="ambiente" editing={editing} onChange={hc} options={["DRP", "PRODUCCIÓN", "PRUEBAS", "VALIDAR"]} />}
        {(editing || has(s.tipoServidor)) && <EditSelectField label="Tipo Servidor" value={s.tipoServidor} field="tipoServidor" editing={editing} onChange={hc} options={["FÍSICO", "VIRTUAL", "NUBE"]} />}
        {(editing || has(s.appSoporta)) && <EditAutoField label="Aplicación que soporta" value={s.appSoporta} field="appSoporta" editing={editing} onChange={hc} tipo="SERVIDOR" />}
        {(editing || has(s.monitoreo)) && <EditSelectField label="Monitoreo" value={s.monitoreo} field="monitoreo" editing={editing} onChange={hc} options={["SI", "NO"]} />}
        {(editing || has(s.backup)) && <EditSelectField label="Backup" value={s.backup} field="backup" editing={editing} onChange={hc} options={["SI", "NO"]} />}
        {(editing || has(s.rutasBackup)) && <EditAutoField label="Rutas de Backup" value={s.rutasBackup} field="rutasBackup" editing={editing} onChange={hc} tipo="SERVIDOR" />}
        {(editing || has(s.fechaFinSoporte)) && <EditDateField label="Fecha Fin Soporte" value={s.fechaFinSoporte} field="fechaFinSoporte" editing={editing} onChange={hc} />}
        {(editing || has(s.contratoQueSoporta)) && <EditAutoField label="Contrato que lo soporta" value={s.contratoQueSoporta} field="contratoQueSoporta" editing={editing} onChange={hc} tipo="SERVIDOR" />}
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

  const hc = (f: string, v: string) => handleChange("red", f, v);

  return (
    <Section title="Equipo de Red" icon="🔌">
      {(editing || has(r.serial)) && <Field label="Serial" value={r.serial} editing={editing} field="serial" onChange={hc} />}
      {(editing || has(r.mac)) && <Field label="MAC" value={r.mac} editing={editing} field="mac" onChange={hc} />}
      {(editing || has(r.modelo)) && <EditAutoField label="Modelo" value={r.modelo} field="modelo" editing={editing} onChange={hc} tipo="RED" placeholder="Ej: Cisco Catalyst 9200" />}
      {(editing || has(r.ipGestion)) && <Field label="IP Gestión" value={r.ipGestion} editing={editing} field="ipGestion" onChange={hc} />}
      {(editing || has(r.estado)) && <EditSelectField label="Estado" value={r.estado} field="estado" editing={editing} onChange={hc} options={["ACTIVO", "DESACTIVADO"]} />}
      {(editing || has(r.fechaFinSoporte)) && <EditDateField label="Fecha Fin Soporte" value={r.fechaFinSoporte} field="fechaFinSoporte" editing={editing} onChange={hc} />}
      {(editing || has(r.contratoQueSoporta)) && <EditAutoField label="Contrato que lo soporta" value={r.contratoQueSoporta} field="contratoQueSoporta" editing={editing} onChange={hc} tipo="RED" />}
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

  const hc = (f: string, v: string) => handleChange("ups", f, v);

  return (
    <Section title="UPS" icon="🔋">
      {(editing || has(u.serial)) && <Field label="Serial" value={u.serial} editing={editing} field="serial" onChange={hc} />}
      {(editing || has(u.placa)) && <Field label="Placa" value={u.placa} editing={editing} field="placa" onChange={hc} />}
      {(editing || has(u.modelo)) && <EditAutoField label="Modelo" value={u.modelo} field="modelo" editing={editing} onChange={hc} tipo="UPS" placeholder="Ej: APC Smart-UPS 1500" />}
      {(editing || has(u.estado)) && <EditSelectField label="Estado" value={u.estado} field="estado" editing={editing} onChange={hc} options={["ACTIVO", "INACTIVO", "DESCONECTADO"]} />}
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

  const hc = (f: string, v: string) => handleChange("baseDatos", f, v);

  return (
    <Section title="Base de Datos" icon="🗄️">
      {(editing || has(b.servidor1)) && <Field label="Servidor 1" value={b.servidor1} editing={editing} field="servidor1" onChange={hc} />}
      {(editing || has(b.servidor2)) && <Field label="Servidor 2" value={b.servidor2} editing={editing} field="servidor2" onChange={hc} />}
      {(editing || has(b.racScan)) && <Field label="RAC/Scan" value={b.racScan} editing={editing} field="racScan" onChange={hc} />}
      {(editing || has(b.ambiente)) && <EditSelectField label="Ambiente" value={b.ambiente} field="ambiente" editing={editing} onChange={hc} options={["PRODUCCIÓN", "PRUEBAS"]} />}
      {(editing || has(b.appSoporta)) && <EditAutoField label="Aplicación que soporta" value={b.appSoporta} field="appSoporta" editing={editing} onChange={hc} tipo="BASE_DATOS" />}
      {(editing || has(b.versionBd)) && <Field label="Versión BD" value={b.versionBd} editing={editing} field="versionBd" onChange={hc} />}
      {(editing || has(b.fechaFinalSoporte)) && <EditDateField label="Fecha Final Soporte" value={b.fechaFinalSoporte} field="fechaFinalSoporte" editing={editing} onChange={hc} />}
      {(editing || has(b.contenedorFisico)) && <EditAutoField label="Contenedor Físico" value={b.contenedorFisico} field="contenedorFisico" editing={editing} onChange={hc} tipo="BASE_DATOS" />}
      {(editing || has(b.contratoQueSoporta)) && <EditAutoField label="Contrato que lo soporta" value={b.contratoQueSoporta} field="contratoQueSoporta" editing={editing} onChange={hc} tipo="BASE_DATOS" />}
    </Section>
  );
}

/* ═══════════════════════════════════════════
   VPN SECTION — NO TIENE EL BUG
   conexion/fases/origen/destino son texto libre
   tanto en Create como en Edit. No se toca nada.
═══════════════════════════════════════════ */
function ReglaHistorica({
  regla,
  idx,
  editing,
  onEliminar,
}: {
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
  const [guardando,  setGuardando]  = useState(false);
  const [eliminando, setEliminando] = useState(false);

  const guardarRegla = async () => {
    setGuardando(true);
    try {
      const token = sessionStorage.getItem("inventario_token");
      await fetch(`${import.meta.env.VITE_API_URL}/assets/${regla.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
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
          <span className="inline-block w-6 h-6 bg-amber-600 text-white rounded-full text-center text-xs font-bold leading-6">
            {idx + 1}
          </span>
          <span className="font-bold text-amber-900">
            {valores.conexion || `Regla ${idx + 1}`}
          </span>
        </div>
        {editing && (
          <div className="flex gap-2">
            {editando ? (
              <>
                <button
                  onClick={guardarRegla}
                  disabled={guardando}
                  style={{ padding: "4px 12px", background: "#22c55e", color: "#fff", border: "none", borderRadius: 6, fontWeight: 700, fontSize: 12, cursor: "pointer" }}
                >
                  {guardando ? "Guardando..." : "💾 Guardar"}
                </button>
                <button
                  onClick={() => setEditando(false)}
                  style={{ padding: "4px 12px", background: "#6b7280", color: "#fff", border: "none", borderRadius: 6, fontWeight: 700, fontSize: 12, cursor: "pointer" }}
                >
                  Cancelar
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setEditando(true)}
                  style={{ padding: "4px 12px", background: "#f59e0b", color: "#fff", border: "none", borderRadius: 6, fontWeight: 700, fontSize: 12, cursor: "pointer" }}
                >
                  ✏️ Editar
                </button>
                <button
                  onClick={eliminarRegla}
                  disabled={eliminando}
                  style={{ padding: "4px 12px", background: "#ef4444", color: "#fff", border: "none", borderRadius: 6, fontWeight: 700, fontSize: 12, cursor: "pointer" }}
                >
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
          <input
            value={valores.conexion}
            onChange={(e) => setValores((v) => ({ ...v, conexion: e.target.value }))}
            style={{ width: "100%", padding: "4px 8px", border: "1px solid #d1d5db", borderRadius: 4, fontSize: 13, marginTop: 4, boxSizing: "border-box" }}
          />
        ) : (
          <div className="text-sm font-mono text-blue-600 font-bold mt-1">{valores.conexion || "—"}</div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1 p-2 bg-white rounded border-l-4 border-green-400">
          <div className="text-xs font-semibold text-gray-500">← Origen</div>
          {editando ? (
            <input
              value={valores.origen}
              onChange={(e) => setValores((v) => ({ ...v, origen: e.target.value }))}
              style={{ width: "100%", padding: "4px 8px", border: "1px solid #d1d5db", borderRadius: 4, fontSize: 13, marginTop: 4, boxSizing: "border-box" }}
            />
          ) : (
            <div className="text-xs font-mono text-green-600 mt-1 break-all">{valores.origen || "—"}</div>
          )}
        </div>
        <div className="flex-shrink-0 text-2xl text-amber-500 font-bold">→</div>
        <div className="flex-1 p-2 bg-white rounded border-l-4 border-red-400">
          <div className="text-xs font-semibold text-gray-500">Destino →</div>
          {editando ? (
            <input
              value={valores.destino}
              onChange={(e) => setValores((v) => ({ ...v, destino: e.target.value }))}
              style={{ width: "100%", padding: "4px 8px", border: "1px solid #d1d5db", borderRadius: 4, fontSize: 13, marginTop: 4, boxSizing: "border-box" }}
            />
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
  const [historicas, setHistoricas] = useState<Vpn[]>(
    (v as any)?.reglasHistoricas ?? []
  );
  const [nuevaRegla, setNuevaRegla] = useState({
    conexion: "", fases: "", origen: "", destino: "",
  });
  const [reglas, setReglas] = useState<Partial<VpnRule>[]>(v?.reglas ?? []);

  if (!v) return null;

  const hc = (f: string, val: string) => handleChange("vpn", f, val);

  const agregarRegla = () => {
    if (!nuevaRegla.conexion && !nuevaRegla.origen && !nuevaRegla.destino) return;
    const actualizadas = [...reglas, nuevaRegla];
    setReglas(actualizadas);
    setNuevaRegla({ conexion: "", fases: "", origen: "", destino: "" });
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
        {(editing || has(v.conexion)) && <Field label="Conexión" value={v.conexion} editing={editing} field="conexion" onChange={hc} />}
        {(editing || has(v.fases))    && <Field label="Fases"    value={v.fases}    editing={editing} field="fases"    onChange={hc} />}
        {(editing || has(v.origen))   && <Field label="Origen"   value={v.origen}   editing={editing} field="origen"   onChange={hc} />}
        {(editing || has(v.destino))  && <Field label="Destino"  value={v.destino}  editing={editing} field="destino"  onChange={hc} />}
      </Section>

      {(totalReglas > 0 || editing) && (
        <Section title={`Reglas Asociadas (${totalReglas})`} icon="🔗">
          <div className="space-y-3">
            {reglas.map((regla, idx) => (
              <div
                key={idx}
                className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-6 h-6 bg-green-600 text-white rounded-full text-center text-xs font-bold leading-6">
                      {idx + 1}
                    </span>
                    <span className="font-bold text-green-900">
                      {regla.conexion || `Regla #${idx + 1}`}
                    </span>
                  </div>
                  {editing && (
                    <button
                      onClick={() => eliminarRegla(idx)}
                      style={{ padding: "4px 10px", background: "#ef4444", color: "#fff", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                    >
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
                onEliminar={() =>
                  setHistoricas((h) => h.filter((r) => r.id !== regla.id))
                }
              />
            ))}

            {editing && (
              <div style={{ marginTop: 16, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>
                  📝 Agregar Nueva Regla
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                  {(["conexion", "fases", "origen", "destino"] as const).map((campo) => (
                    <div key={campo}>
                      <label style={{ fontSize: 11, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4, textTransform: "uppercase" }}>
                        {campo}
                      </label>
                      <input
                        value={nuevaRegla[campo]}
                        onChange={(e) =>
                          setNuevaRegla((r) => ({ ...r, [campo]: e.target.value }))
                        }
                        style={{ width: "100%", padding: "6px 10px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13, boxSizing: "border-box" }}
                      />
                    </div>
                  ))}
                </div>
                <button
                  onClick={agregarRegla}
                  style={{ width: "100%", padding: "10px", background: "#6366f1", color: "#fff", border: "none", borderRadius: 6, fontWeight: 700, fontSize: 13, cursor: "pointer" }}
                >
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
   MOVIL SECTION
   ⚠️ editabilidad controlada por estado, NO por
   "editing" plano. Ver lógica puedeEditar* abajo.
   NO cambiar esta lógica — es diseño intencional.
═══════════════════════════════════════════ */

/* ═══════════════════════════════════════════
   CERTIFICADO SSL SECTION
═══════════════════════════════════════════ */
export function CertificadoSslSection({
  asset,
  editing,
  handleChange,
}: {
  asset: Asset;
  editing: boolean;
  handleChange: (section: string | null, field: string, val: any) => void;
}) {
  const c = asset.certificadoSsl;
  if (!c) return null;

  const hc = (f: string, v: string) => handleChange("certificadoSsl", f, v);
  const apps = c.aplicaciones ?? [];

  return (
    <>
      <Section title="Certificado SSL" icon="🔐">
        {/* tipoCertificado: select con 3 modos */}
        {(editing || has(c.tipoCertificado)) && (
          <EditSelectField
            label="Tipo"
            value={c.tipoCertificado}
            field="tipoCertificado"
            editing={editing}
            onChange={hc}
            options={["DOMINIO", "APLICACION", "PROVEEDOR"]}
          />
        )}
        {(editing || has(c.nombreAplicacion)) && (
          <Field
            label="Nombre de Aplicación"
            value={c.nombreAplicacion}
            editing={editing}
            field="nombreAplicacion"
            onChange={hc}
          />
        )}
        {c.tipoCertificado === "DOMINIO" && (editing || has(c.nombreDominio)) && (
          <Field
            label="Nombre del Dominio"
            value={c.nombreDominio}
            editing={editing}
            field="nombreDominio"
            onChange={hc}
          />
        )}

        {(editing || has(c.proveedor)) && (
          <Field
            label="Proveedor"
            value={c.proveedor}
            editing={editing}
            field="proveedor"
            onChange={hc}
          />
        )}
        {(editing || has(c.url)) && (
          <UrlField
            label="URL"
            value={c.url}
            editing={editing}
            field="url"
            onChange={hc}
          />
        )}
        {(editing || has(c.fechaInicio)) && (
          <EditDateField
            label="Fecha de Inicio"
            value={c.fechaInicio}
            field="fechaInicio"
            editing={editing}
            onChange={hc}
          />
        )}
        {(editing || has(c.fechaFin)) && (
          <div>
            <EditDateField
              label="Fecha de Vencimiento"
              value={c.fechaFin}
              field="fechaFin"
              editing={editing}
              onChange={hc}
            />
            {!editing && <DiasRestantesBadge fecha={c.fechaFin} />}
          </div>
        )}
      </Section>

      {/* Apps hijas del proveedor: ver/editar/agregar/eliminar */}
      {c.tipoCertificado === "PROVEEDOR" && (
        <Section title={`Aplicaciones del Proveedor${apps.length ? ` (${apps.length})` : ""}`} icon="📋">
          <div style={{ gridColumn: "1 / -1" }}>
            <CertificadoAplicaciones
              key={editing ? "editing" : "view"}
              apps={apps}
              editing={editing}
              fechaInicioProveedor={c.fechaInicio}
              fechaFinProveedor={c.fechaFin}
              onChange={(nuevasApps) => handleChange("certificadoSsl", "aplicaciones", nuevasApps)}
            />
          </div>
        </Section>
      )}
    </>
  );
}

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

  const hc = (f: string, v: string) => handleChange("movil", f, v);

  const estado              = m.estados;
  const procesoCerrado      = estado === "DEVUELTO";
  const actaEntregaFirmada  = !!m.firmaPath;

  // Lógica de editabilidad por estado — NO TOCAR
  const puedeEditarActaEntrega = editing && !procesoCerrado && !actaEntregaFirmada;
  const puedeEditarCorreo      = editing && !procesoCerrado;
  const puedeEditarDevolucion  =
    editing &&
    !procesoCerrado &&
    (estado === "DEVOLUCION" || estado === "PENDIENTE_DEVOLUCION");

  return (
    <>
      <Section title="Datos del Usuario" icon="👤">
        {/* numeroCaso / cedula / usuarioRed: texto libre siempre */}
        {(editing || has(m.numeroCaso)) && (
          <Field
            label="# Caso"
            value={m.numeroCaso}
            editing={puedeEditarActaEntrega}
            field="numeroCaso"
            onChange={hc}
          />
        )}
        {/*
          region: SelectField — vocabulario controlado.
          Mismo set que FormMovil en forms.tsx.
        */}
        {(editing || has(m.region)) && (
          <EditSelectField
            label="Región/Departamento"
            value={m.region}
            field="region"
            editing={puedeEditarActaEntrega}
            onChange={hc}
            options={[
              "Bogotá", "Bucaramanga", "Cúcuta", "Villavicencio", "Ibagué",
              "Barranquilla", "Santa Marta", "Sincelejo", "Cartagena",
              "Montería", "Medellín", "Cali", "Pereira",
            ]}
          />
        )}
        {/* dependencia: texto libre */}
        {(editing || has(m.dependencia)) && (
          <Field
            label="Dependencia/Área"
            value={m.dependencia}
            editing={puedeEditarActaEntrega}
            field="dependencia"
            onChange={hc}
          />
        )}
        {/* sede: AutocompleteField */}
        {(editing || has(m.sede)) && (
          <EditAutoField
            label="Sede"
            value={m.sede}
            field="sede"
            editing={puedeEditarActaEntrega}
            onChange={hc}
            tipo="MOVIL"
          />
        )}
        {(editing || has(m.cedula)) && (
          <Field
            label="C.C."
            value={m.cedula}
            editing={puedeEditarActaEntrega}
            field="cedula"
            onChange={hc}
          />
        )}
        {(editing || has(m.usuarioRed)) && (
          <Field
            label="Usuario de Red"
            value={m.usuarioRed}
            editing={puedeEditarActaEntrega}
            field="usuarioRed"
            onChange={hc}
          />
        )}
        {(editing || has(m.correoResponsable)) && (
          <Field
            label="Correo Responsable"
            value={m.correoResponsable}
            editing={puedeEditarCorreo}
            field="correoResponsable"
            onChange={hc}
          />
        )}
      </Section>

      <Section title="Datos del Equipo Entregado" icon="📱">
        {/* uni: texto libre */}
        {(editing || has(m.uni)) && (
          <Field
            label="UNI"
            value={m.uni}
            editing={puedeEditarActaEntrega}
            field="uni"
            onChange={hc}
          />
        )}
        {/*
          marca / modelo: SelectField y AutocompleteField.
          marca: vocabulario controlado igual que FormMovil.
          modelo: sugerencias de BD.
        */}
        {(editing || has(m.marca)) && (
          <EditSelectField
            label="Marca"
            value={m.marca}
            field="marca"
            editing={puedeEditarActaEntrega}
            onChange={hc}
            options={["Samsung", "Motorola", "Xiaomi", "Huawei", "Apple"]}
          />
        )}
        {(editing || has(m.modelo)) && (
          <EditAutoField
            label="Modelo"
            value={m.modelo}
            field="modelo"
            editing={puedeEditarActaEntrega}
            onChange={hc}
            tipo="MOVIL"
          />
        )}
        {/* serial / imei1 / imei2: texto libre SIEMPRE — nunca cambiar */}
        {(editing || has(m.serial)) && (
          <Field
            label="Serial"
            value={m.serial}
            editing={puedeEditarActaEntrega}
            field="serial"
            onChange={hc}
          />
        )}
        {(editing || has(m.imei1)) && (
          <Field
            label="IMEI 1"
            value={m.imei1}
            editing={puedeEditarActaEntrega}
            field="imei1"
            onChange={hc}
          />
        )}
        {(editing || has(m.imei2)) && (
          <Field
            label="IMEI 2"
            value={m.imei2}
            editing={puedeEditarActaEntrega}
            field="imei2"
            onChange={hc}
          />
        )}
        {/* sim: SelectField */}
        {(editing || has(m.sim)) && (
          <EditSelectField
            label="SIM"
            value={m.sim}
            field="sim"
            editing={puedeEditarActaEntrega}
            onChange={hc}
            options={["Sí", "No"]}
          />
        )}
        {/* numeroLinea: texto libre */}
        {(editing || has(m.numeroLinea)) && (
          <Field
            label="Número de Línea"
            value={m.numeroLinea}
            editing={puedeEditarActaEntrega}
            field="numeroLinea"
            onChange={hc}
          />
        )}
        {/* fechaEntrega: EditDateField */}
        {(editing || has(m.fechaEntrega)) && (
          <EditDateField
            label="Fecha de Entrega"
            value={m.fechaEntrega}
            field="fechaEntrega"
            editing={puedeEditarActaEntrega}
            onChange={hc}
          />
        )}
        {(editing || has(m.observacionesEntrega)) && (
          <Field
            label="Observaciones Entrega"
            value={m.observacionesEntrega}
            editing={puedeEditarActaEntrega}
            field="observacionesEntrega"
            onChange={hc}
          />
        )}
      </Section>

      {(estado === "DEVOLUCION" ||
        estado === "PENDIENTE_DEVOLUCION" ||
        estado === "DEVUELTO" ||
        editing) && (
        <Section title="Datos de Devolución" icon="↩️">
          {/* fechaDevolucion: editing siempre false — lo setea el sistema */}
          {(editing || has(m.fechaDevolucion)) && (
            <Field
              label="Fecha de Devolución"
              value={m.fechaDevolucion}
              editing={false}
              field="fechaDevolucion"
              onChange={hc}
            />
          )}
          {(editing || has(m.observacionesDevolucion)) && (
            <Field
              label="Observaciones Devolución"
              value={m.observacionesDevolucion}
              editing={puedeEditarDevolucion}
              field="observacionesDevolucion"
              onChange={hc}
            />
          )}
        </Section>
      )}
    </>
  );
}