import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getAssetById, updateAsset, addObservacion } from "../api/client";
import type{ Asset, BitacoraEntry, TipoEvento } from "../types";

function Field({ label, value, editing, field, onChange }: {
  label: string;
  value: string | number | null;
  editing: boolean;
  field: string;
  onChange: (field: string, val: string) => void;
}) {
  return (
    <div>
      <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">{label}</div>
      {editing ? (
        <input
          className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-orange-500"
          defaultValue={value?.toString() ?? ""}
          onChange={e => onChange(field, e.target.value)}
        />
      ) : (
        <div className="text-sm text-gray-200">{value ?? <span className="text-gray-600">—</span>}</div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900 p-5 mb-4">
      <h3 className="text-xs uppercase tracking-widest mb-4" style={{ color: "#FA8241" }}>{title}</h3>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">{children}</div>
    </div>
  );
}

const EVENTO_LABEL: Record<string, string> = {
  IMPORTACION: "Importación",
  CAMBIO_CAMPO: "Cambio de campo",
  MANTENIMIENTO: "Mantenimiento",
  INCIDENTE: "Incidente",
  NOTA: "Nota",
};

export default function AssetDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [asset, setAsset] = useState<Asset | null>(null);
  const [editing, setEditing] = useState(false);
  const [changes, setChanges] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);

  // Observación modal
  const [showObs, setShowObs] = useState(false);
  const [obsAutor, setObsAutor] = useState("");
  const [obsTipo, setObsTipo] = useState<TipoEvento>("NOTA");
  const [obsDesc, setObsDesc] = useState("");
  const [obsLoading, setObsLoading] = useState(false);

  const load = () => {
    if (id) getAssetById(id).then(setAsset);
  };

  useEffect(() => { load(); }, [id]);

  const handleChange = (section: string | null, field: string, val: string) => {
    if (section) {
      setChanges(prev => ({
        ...prev,
        [section]: { ...(prev[section] || {}), [field]: val },
      }));
    } else {
      setChanges(prev => ({ ...prev, [field]: val }));
    }
  };

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    try {
      await updateAsset(id, changes);
      setEditing(false);
      setChanges({});
      load();
    } finally {
      setSaving(false);
    }
  };

  const handleAddObs = async () => {
    if (!id || !obsAutor || !obsDesc) return;
    setObsLoading(true);
    try {
      await addObservacion(id, { autor: obsAutor, tipoEvento: obsTipo, descripcion: obsDesc });
      setShowObs(false);
      setObsAutor("");
      setObsDesc("");
      setObsTipo("NOTA");
      load();
    } finally {
      setObsLoading(false);
    }
  };

  if (!asset) return <div className="p-8 text-gray-500">Cargando...</div>;

  const s = asset.servidor;
  const r = asset.red;
  const u = asset.ups;
  const b = asset.baseDatos;

  return (
    <div className="p-8 max-w-5xl">
      {/* Top bar */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <button onClick={() => navigate(-1)} className="text-xs text-gray-500 hover:text-gray-300 mb-2 transition-all">← Volver</button>
          <h1 className="text-2xl font-bold text-white">{asset.nombre ?? "Sin nombre"}</h1>
          <div className="flex gap-2 mt-2">
            <span className="text-xs px-2 py-1 rounded font-semibold" style={{ backgroundColor: "#861F2C", color: "white" }}>
              {asset.tipo.replace("_", " ")}
            </span>
            {asset.codigoServicio && (
              <span className="text-xs px-2 py-1 rounded bg-gray-800 text-gray-400">{asset.codigoServicio}</span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {editing ? (
            <>
              <button onClick={() => { setEditing(false); setChanges({}); }}
                className="px-4 py-2 rounded border border-gray-700 text-sm text-gray-400 hover:text-white transition-all">
                Cancelar
              </button>
              <button onClick={handleSave} disabled={saving}
                className="px-4 py-2 rounded text-sm text-white font-semibold transition-all"
                style={{ backgroundColor: "#D86000" }}>
                {saving ? "Guardando..." : "Guardar"}
              </button>
            </>
          ) : (
            <button onClick={() => setEditing(true)}
              className="px-4 py-2 rounded text-sm text-white font-semibold transition-all"
              style={{ backgroundColor: "#861F2C" }}>
              Editar
            </button>
          )}
        </div>
      </div>

      {/* Campos comunes */}
      <Section title="Información General">
        <Field label="Nombre" value={asset.nombre} editing={editing} field="nombre" onChange={(f, v) => handleChange(null, f, v)} />
        <Field label="Ubicación" value={asset.ubicacion} editing={editing} field="ubicacion" onChange={(f, v) => handleChange(null, f, v)} />
        <Field label="Propietario" value={asset.propietario} editing={editing} field="propietario" onChange={(f, v) => handleChange(null, f, v)} />
        <Field label="Custodio" value={asset.custodio} editing={editing} field="custodio" onChange={(f, v) => handleChange(null, f, v)} />
        <Field label="Código de Servicio" value={asset.codigoServicio} editing={editing} field="codigoServicio" onChange={(f, v) => handleChange(null, f, v)} />
      </Section>

      {/* SERVIDOR */}
      {s && (
        <>
          <Section title="Red">
            <Field label="IP Interna" value={s.ipInterna} editing={editing} field="ipInterna" onChange={(f, v) => handleChange("servidor", f, v)} />
            <Field label="IP Gestión" value={s.ipGestion} editing={editing} field="ipGestion" onChange={(f, v) => handleChange("servidor", f, v)} />
            <Field label="IP Servicio" value={s.ipServicio} editing={editing} field="ipServicio" onChange={(f, v) => handleChange("servidor", f, v)} />
          </Section>
          <Section title="Recursos">
            <Field label="vCPU" value={s.vcpu} editing={editing} field="vcpu" onChange={(f, v) => handleChange("servidor", f, v)} />
            <Field label="vRAM (MB)" value={s.vramMb} editing={editing} field="vramMb" onChange={(f, v) => handleChange("servidor", f, v)} />
            <Field label="Sistema Operativo" value={s.sistemaOperativo} editing={editing} field="sistemaOperativo" onChange={(f, v) => handleChange("servidor", f, v)} />
          </Section>
          <Section title="Operación">
            <Field label="Ambiente" value={s.ambiente} editing={editing} field="ambiente" onChange={(f, v) => handleChange("servidor", f, v)} />
            <Field label="Tipo Servidor" value={s.tipoServidor} editing={editing} field="tipoServidor" onChange={(f, v) => handleChange("servidor", f, v)} />
            <Field label="Aplicación que soporta" value={s.appSoporta} editing={editing} field="appSoporta" onChange={(f, v) => handleChange("servidor", f, v)} />
            <Field label="Monitoreo" value={s.monitoreo} editing={editing} field="monitoreo" onChange={(f, v) => handleChange("servidor", f, v)} />
            <Field label="Backup" value={s.backup} editing={editing} field="backup" onChange={(f, v) => handleChange("servidor", f, v)} />
            <Field label="Rutas de Backup" value={s.rutasBackup} editing={editing} field="rutasBackup" onChange={(f, v) => handleChange("servidor", f, v)} />
            <Field label="Fecha Fin Soporte" value={s.fechaFinSoporte} editing={editing} field="fechaFinSoporte" onChange={(f, v) => handleChange("servidor", f, v)} />
            <Field label="Contrato que lo soporta" value={s.contratoQueSoporta} editing={editing} field="contratoQueSoporta" onChange={(f, v) => handleChange("servidor", f, v)} />
          </Section>
        </>
      )}

      {/* RED */}
      {r && (
        <Section title="Equipo de Red">
          <Field label="Serial" value={r.serial} editing={editing} field="serial" onChange={(f, v) => handleChange("red", f, v)} />
          <Field label="MAC" value={r.mac} editing={editing} field="mac" onChange={(f, v) => handleChange("red", f, v)} />
          <Field label="Modelo" value={r.modelo} editing={editing} field="modelo" onChange={(f, v) => handleChange("red", f, v)} />
          <Field label="IP Gestión" value={r.ipGestion} editing={editing} field="ipGestion" onChange={(f, v) => handleChange("red", f, v)} />
          <Field label="Estado" value={r.estado} editing={editing} field="estado" onChange={(f, v) => handleChange("red", f, v)} />
          <Field label="Fecha Fin Soporte" value={r.fechaFinSoporte} editing={editing} field="fechaFinSoporte" onChange={(f, v) => handleChange("red", f, v)} />
          <Field label="Contrato que lo soporta" value={r.contratoQueSoporta} editing={editing} field="contratoQueSoporta" onChange={(f, v) => handleChange("red", f, v)} />
        </Section>
      )}

      {/* UPS */}
      {u && (
        <Section title="UPS">
          <Field label="Serial" value={u.serial} editing={editing} field="serial" onChange={(f, v) => handleChange("ups", f, v)} />
          <Field label="Placa" value={u.placa} editing={editing} field="placa" onChange={(f, v) => handleChange("ups", f, v)} />
          <Field label="Modelo" value={u.modelo} editing={editing} field="modelo" onChange={(f, v) => handleChange("ups", f, v)} />
          <Field label="Estado" value={u.estado} editing={editing} field="estado" onChange={(f, v) => handleChange("ups", f, v)} />
        </Section>
      )}

      {/* BASE DE DATOS */}
      {b && (
        <>
          <Section title="Base de Datos">
            <Field label="Servidor 1" value={b.servidor1} editing={editing} field="servidor1" onChange={(f, v) => handleChange("baseDatos", f, v)} />
            <Field label="Servidor 2" value={b.servidor2} editing={editing} field="servidor2" onChange={(f, v) => handleChange("baseDatos", f, v)} />
            <Field label="RAC/Scan" value={b.racScan} editing={editing} field="racScan" onChange={(f, v) => handleChange("baseDatos", f, v)} />
            <Field label="Ambiente" value={b.ambiente} editing={editing} field="ambiente" onChange={(f, v) => handleChange("baseDatos", f, v)} />
            <Field label="Aplicación" value={b.appSoporta} editing={editing} field="appSoporta" onChange={(f, v) => handleChange("baseDatos", f, v)} />
            <Field label="Versión BD" value={b.versionBd} editing={editing} field="versionBd" onChange={(f, v) => handleChange("baseDatos", f, v)} />
            <Field label="Fecha Final Soporte" value={b.fechaFinalSoporte} editing={editing} field="fechaFinalSoporte" onChange={(f, v) => handleChange("baseDatos", f, v)} />
            <Field label="Contenedor Físico" value={b.contenedorFisico} editing={editing} field="contenedorFisico" onChange={(f, v) => handleChange("baseDatos", f, v)} />
            <Field label="Contrato que lo soporta" value={b.contratoQueSoporta} editing={editing} field="contratoQueSoporta" onChange={(f, v) => handleChange("baseDatos", f, v)} />
          </Section>
        </>
      )}

      {/* BITÁCORA */}
      <div className="rounded-lg border border-gray-800 bg-gray-900 p-5 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs uppercase tracking-widest" style={{ color: "#FA8241" }}>Bitácora / Observaciones</h3>
          <button onClick={() => setShowObs(true)}
            className="text-xs px-3 py-1.5 rounded text-white font-semibold transition-all"
            style={{ backgroundColor: "#D86000" }}>
            + Agregar Observación
          </button>
        </div>

        {/* Modal observación */}
        {showObs && (
          <div className="mb-4 p-4 rounded border border-gray-700 bg-gray-800">
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wider block mb-1">Tu nombre</label>
                <input
                  className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-orange-500"
                  value={obsAutor}
                  onChange={e => setObsAutor(e.target.value)}
                  placeholder="Ej: Carlos"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wider block mb-1">Tipo</label>
                <select
                  className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-orange-500"
                  value={obsTipo}
                  onChange={e => setObsTipo(e.target.value as TipoEvento)}
                >
                  <option value="NOTA">Nota</option>
                  <option value="MANTENIMIENTO">Mantenimiento</option>
                  <option value="INCIDENTE">Incidente</option>
                </select>
              </div>
            </div>
            <div className="mb-3">
              <label className="text-xs text-gray-500 uppercase tracking-wider block mb-1">Descripción</label>
              <textarea
                className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500 resize-none"
                rows={3}
                value={obsDesc}
                onChange={e => setObsDesc(e.target.value)}
                placeholder="Describe el evento..."
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowObs(false)} className="text-xs px-3 py-1.5 rounded border border-gray-700 text-gray-400 hover:text-white transition-all">
                Cancelar
              </button>
              <button onClick={handleAddObs} disabled={obsLoading || !obsAutor || !obsDesc}
                className="text-xs px-3 py-1.5 rounded text-white font-semibold disabled:opacity-50 transition-all"
                style={{ backgroundColor: "#861F2C" }}>
                {obsLoading ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        )}

        {/* Entradas */}
        <div className="space-y-3">
          {(asset.bitacora ?? []).length === 0 ? (
            <div className="text-gray-600 text-sm">Sin registros</div>
          ) : (asset.bitacora ?? []).map((entry: BitacoraEntry) => (
            <div key={entry.id} className="border-l-2 pl-4 py-1" style={{ borderColor: "#861F2C" }}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-white">{entry.autor}</span>
                <span className="text-xs px-1.5 py-0.5 rounded bg-gray-800 text-gray-400">
                  {EVENTO_LABEL[entry.tipoEvento]}
                </span>
                <span className="text-xs text-gray-600">
                  {new Date(entry.creadoEn).toLocaleString("es-CO")}
                </span>
              </div>
              <div className="text-sm text-gray-300">{entry.descripcion}</div>
              {entry.campoModificado && (
                <div className="text-xs text-gray-500 mt-1 font-mono">
                  {entry.campoModificado}: <span className="text-red-400">{entry.valorAnterior || "vacío"}</span>
                  {" → "}
                  <span className="text-green-400">{entry.valorNuevo || "vacío"}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}