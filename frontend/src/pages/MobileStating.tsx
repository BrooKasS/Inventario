import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

const API   = import.meta.env.VITE_API_URL;
const token = () => sessionStorage.getItem("inventario_token");

const MARCAS       = ["Samsung", "Motorola", "Xiaomi", "Huawei", "Apple"];
const MODELOS_BASE = ["Galaxy S26", "Galaxy S26 Ultra", "Galaxy A56"];

interface StagingRow {
  id:       string;
  serial:   string;
  imei1:    string | null;
  imei2:    string | null;
  marca:    string | null;
  modelo:   string | null;
  usado:    string;
  creadoEn: string;
}

interface Stats { total: number; usados: number; pendientes: number; }

// Estado de edición por fila
interface EditState {
  serial: string;
  imei1:  string;
  marca:  string;
  marcaOtro: string;
  modelo: string;
  modeloOtro: string;
}

export default function MobileStagingPage() {
  const navigate = useNavigate();

  // ─── Formulario nuevo ───
  const [serial,     setSerial]     = useState("");
  const [imei1,      setImei1]      = useState("");
  const [marca,      setMarca]      = useState("Samsung");
  const [marcaOtro,  setMarcaOtro]  = useState("");
  const [modelo,     setModelo]     = useState("Galaxy S26 Ultra");
  const [modeloOtro, setModeloOtro] = useState("");

  // ─── Datos ───
  const [registros, setRegistros] = useState<StagingRow[]>([]);
  const [stats,     setStats]     = useState<Stats>({ total: 0, usados: 0, pendientes: 0 });
  const [error,     setError]     = useState("");
  const [exito,     setExito]     = useState("");

  // ─── Edición inline ───
  const [editandoId,   setEditandoId]   = useState<string | null>(null);
  const [editState,    setEditState]    = useState<EditState | null>(null);
  const [guardandoEdit, setGuardandoEdit] = useState(false);
  const [errorEdit,    setErrorEdit]    = useState("");

  // ─── Refs ───
  const serialRef = useRef<HTMLInputElement>(null);
  const imei1Ref  = useRef<HTMLInputElement>(null);

  // ─── Modelos dinámicos ───
  const modelosDeDB = Array.from(new Set(
    registros
      .map(r => r.modelo)
      .filter((m): m is string => !!m && !MODELOS_BASE.includes(m))
  ));
  const modeloOptions = [...MODELOS_BASE, ...modelosDeDB];

  const cargar = async () => {
    const [r1, r2] = await Promise.all([
      fetch(`${API}/mobile-staging`,       { headers: { Authorization: `Bearer ${token()}` } }),
      fetch(`${API}/mobile-staging/stats`, { headers: { Authorization: `Bearer ${token()}` } }),
    ]);
    setRegistros(await r1.json());
    setStats(await r2.json());
  };

  useEffect(() => { cargar(); }, []);

  const getMarcaFinal  = () => marca  === "Otra" ? marcaOtro.trim()  : marca;
  const getModeloFinal = () => modelo === "Otro" ? modeloOtro.trim() : modelo;

  const guardar = async () => {
    setError(""); setExito("");
    if (!serial.trim()) { setError("El serial es obligatorio"); return; }

    const res = await fetch(`${API}/mobile-staging`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
      body: JSON.stringify({
        serial,
        imei1:  imei1 || null,
        imei2:  null,
        marca:  getMarcaFinal()  || null,
        modelo: getModeloFinal() || null,
      }),
    });

    if (res.status === 409) { setError("Este serial ya está registrado en staging"); return; }
    if (!res.ok)            { setError("Error al guardar"); return; }
    
    

    setExito(`✅ ${serial.trim().toUpperCase()} guardado`);
    setSerial(""); setImei1("");
    setMarca("Samsung"); setMarcaOtro("");
    setModelo("Galaxy S26 Ultra"); setModeloOtro("");
    cargar();
    setTimeout(() => serialRef.current?.focus(), 50);
  };

  // ─── Eliminar normal (solo pendientes) ───
  const eliminar = async (id: string, usado: string) => {
    if (usado === "true") { alert("No se puede eliminar, ya fue registrado como activo"); return; }
    if (!confirm("¿Eliminar este registro?")) return;
    await fetch(`${API}/mobile-staging/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token()}` },
    });
    cargar();
  };

  // ─── Eliminar forzoso (registrados huérfanos) ───
  const forzarEliminar = async (id: string, serial: string) => {
    if (!confirm(`¿Quieres eliminar este registro? "${serial}"?\nEsto borrará el registro aunque esté marcado como Registrado.`)) return;
    const res = await fetch(`${API}/mobile-staging/${id}/force`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token()}` },
    });
    if (!res.ok) { alert("Error al eliminar"); return; }
    cargar();
  };

  // ─── Iniciar edición ───
  const iniciarEdicion = (r: StagingRow) => {
    const marcaVal  = r.marca  || "";
    const modeloVal = r.modelo || "";
    const marcaEnLista  = MARCAS.includes(marcaVal);
    const modeloEnLista = modeloOptions.includes(modeloVal);

    setEditandoId(r.id);
    setErrorEdit("");
    setEditState({
      serial:     r.serial,
      imei1:      r.imei1  || "",
      marca:      marcaEnLista  ? marcaVal  : "Otra",
      marcaOtro:  marcaEnLista  ? ""        : marcaVal,
      modelo:     modeloEnLista ? modeloVal : "Otro",
      modeloOtro: modeloEnLista ? ""        : modeloVal,
    });
  };

  const cancelarEdicion = () => {
    setEditandoId(null);
    setEditState(null);
    setErrorEdit("");
  };

  // ─── Guardar edición ───
  const guardarEdicion = async (id: string) => {
    if (!editState) return;
    setGuardandoEdit(true);
    setErrorEdit("");

    const marcaFinal  = editState.marca  === "Otra" ? editState.marcaOtro.trim()  : editState.marca;
    const modeloFinal = editState.modelo === "Otro" ? editState.modeloOtro.trim() : editState.modelo;

    const res = await fetch(`${API}/mobile-staging/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
      body: JSON.stringify({
        serial: editState.serial,
        imei1:  editState.imei1  || null,
        marca:  marcaFinal       || null,
        modelo: modeloFinal      || null,
      }),
    });

    setGuardandoEdit(false);

    if (res.status === 409) { setErrorEdit("Ese serial ya existe"); return; }
    if (!res.ok)            { setErrorEdit("Error al guardar");     return; }

    setEditandoId(null);
    setEditState(null);
    cargar();
  };

  // ─── Estilos ───
  const labelSt: React.CSSProperties = {
    display: "block", fontSize: 12, fontWeight: 800,
    color: "#374151", marginBottom: 5,
    textTransform: "uppercase", letterSpacing: ".05em",
  };
  const inputSt: React.CSSProperties = {
    width: "100%", padding: "10px 12px",
    border: "1.5px solid #d1d5db", borderRadius: 8,
    fontSize: 14, background: "#fff", outline: "none",
    transition: "border .2s, box-shadow .2s", boxSizing: "border-box",
  };
  const inputStSmall: React.CSSProperties = {
    ...inputSt, padding: "6px 8px", fontSize: 12,
  };
  const selectStSmall: React.CSSProperties = {
    ...inputStSmall, cursor: "pointer", appearance: "none" as any,
  };
  const onFocusI = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.currentTarget.style.border    = "1.5px solid #6366f1";
    e.currentTarget.style.boxShadow = "0 0 0 2px rgba(99,102,241,.15)";
  };
  const onBlurI = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.currentTarget.style.border    = "1.5px solid #d1d5db";
    e.currentTarget.style.boxShadow = "none";
  };
  const selectSt: React.CSSProperties = {
    ...inputSt, cursor: "pointer", appearance: "none" as any,
  };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 28, fontFamily: "Calibri, sans-serif" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <h2 style={{ margin: 0, fontWeight: 700 }}>📱 Registro general de móviles</h2>
        <button
          onClick={() => navigate("/inventario/MOVIL")}
          style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #d1d5db", background: "#fff", cursor: "pointer", fontWeight: 600 }}
        >
          ← Volver
        </button>
      </div>

      {/* Contadores */}
      <div style={{ display: "flex", gap: 14, marginBottom: 22 }}>
        {[
          { label: "Escaneados",  value: stats.total,      color: "#6366f1" },
          { label: "Registrados", value: stats.usados,     color: "#22c55e" },
          { label: "Pendientes",  value: stats.pendientes, color: "#f59e0b" },
        ].map(s => (
          <div key={s.label} style={{
            flex: 1, background: "#f8fafc",
            border: `2px solid ${s.color}`, borderRadius: 10,
            padding: "14px 16px", textAlign: "center",
          }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Formulario nuevo registro */}
      <div style={{
        background: "#f8fafc", border: "1px solid #e2e8f0",
        borderRadius: 12, padding: 22, marginBottom: 26,
      }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>

          {/* Marca */}
          <div>
            <label style={labelSt}>Marca</label>
            <select value={marca} onChange={e => { setMarca(e.target.value); setMarcaOtro(""); }}
              style={selectSt} onFocus={onFocusI} onBlur={onBlurI}>
              {MARCAS.map(m => <option key={m} value={m}>{m}</option>)}
              <option value="Otra">Otra</option>
            </select>
            {marca === "Otra" && (
              <input type="text" value={marcaOtro} onChange={e => setMarcaOtro(e.target.value)}
                placeholder="Escribe la marca..." style={{ ...inputSt, marginTop: 8 }}
                onFocus={onFocusI} onBlur={onBlurI} autoFocus />
            )}
          </div>

          {/* Modelo */}
          <div>
            <label style={labelSt}>Modelo</label>
            <select value={modelo} onChange={e => { setModelo(e.target.value); setModeloOtro(""); }}
              style={selectSt} onFocus={onFocusI} onBlur={onBlurI}>
              {modeloOptions.map(m => <option key={m} value={m}>{m}</option>)}
              <option value="Otro">Otro</option>
            </select>
            {modelo === "Otro" && (
              <input type="text" value={modeloOtro} onChange={e => setModeloOtro(e.target.value)}
                placeholder="Escribe el modelo..." style={{ ...inputSt, marginTop: 8 }}
                onFocus={onFocusI} onBlur={onBlurI} autoFocus />
            )}
          </div>
        </div>

        {/* Serial */}
        <div style={{ marginBottom: 14 }}>
          <label style={labelSt}>Serial *</label>
          <input ref={serialRef} value={serial} onChange={e => setSerial(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); imei1Ref.current?.focus(); } }}
            placeholder="Escanea o escribe el serial"
            style={inputSt} onFocus={onFocusI} onBlur={onBlurI} />
        </div>

        {/* IMEI 1 */}
        <div style={{ marginBottom: 14 }}>
          <label style={labelSt}>IMEI 1</label>
          <input ref={imei1Ref} value={imei1} onChange={e => setImei1(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); guardar(); } }}
            placeholder="Escanea IMEI 1 → Enter para guardar"
            style={inputSt} onFocus={onFocusI} onBlur={onBlurI} />
        </div>

        {error && <p style={{ color: "#ef4444", margin: "10px 0", fontSize: 13, fontWeight: 600 }}>⚠️ {error}</p>}
        {exito && <p style={{ color: "#22c55e", margin: "10px 0", fontSize: 13, fontWeight: 600 }}>{exito}</p>}

        <button onClick={guardar} style={{
          marginTop: 10, padding: "10px 26px",
          background: "linear-gradient(135deg,#6366f1,#4f46e5)",
          color: "#fff", border: "none", borderRadius: 8,
          fontSize: 14, fontWeight: 700, cursor: "pointer",
        }}
          onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 6px 16px rgba(99,102,241,.3)"; }}
          onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)";    e.currentTarget.style.boxShadow = "none"; }}
        >
          GUARDAR
        </button>
      </div>

      {/* Tabla */}
      <h3 style={{ marginBottom: 10, fontWeight: 700 }}>
        Registros ({registros.length}) — Pendientes: {stats.pendientes}
      </h3>

      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, borderRadius: 10, overflow: "hidden" }}>
        <thead>
          <tr style={{ background: "#f1f5f9" }}>
            {["Marca", "Modelo", "Serial", "IMEI 1", "Estado", "Acciones"].map(h => (
              <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontWeight: 700, borderBottom: "2px solid #e2e8f0" }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {registros.map(r => {
            const editando = editandoId === r.id;

            if (editando && editState) {
              // ─── FILA EN MODO EDICIÓN ───
             

              return (
                <tr key={r.id} style={{ background: "#fffbeb", borderBottom: "1px solid #f1f5f9" }}>
                  {/* Marca edit */}
                  <td style={{ padding: 8, verticalAlign: "top" }}>
                    <select value={editState.marca}
                      onChange={e => setEditState(s => s ? { ...s, marca: e.target.value, marcaOtro: "" } : s)}
                      style={selectStSmall}>
                      {MARCAS.map(m => <option key={m} value={m}>{m}</option>)}
                      <option value="Otra">Otra</option>
                    </select>
                    {editState.marca === "Otra" && (
                      <input type="text" value={editState.marcaOtro}
                        onChange={e => setEditState(s => s ? { ...s, marcaOtro: e.target.value } : s)}
                        placeholder="Marca..." style={{ ...inputStSmall, marginTop: 4 }} autoFocus />
                    )}
                  </td>

                  {/* Modelo edit */}
                  <td style={{ padding: 8, verticalAlign: "top" }}>
                    <select value={editState.modelo}
                      onChange={e => setEditState(s => s ? { ...s, modelo: e.target.value, modeloOtro: "" } : s)}
                      style={selectStSmall}>
                      {modeloOptions.map(m => <option key={m} value={m}>{m}</option>)}
                      <option value="Otro">Otro</option>
                    </select>
                    {editState.modelo === "Otro" && (
                      <input type="text" value={editState.modeloOtro}
                        onChange={e => setEditState(s => s ? { ...s, modeloOtro: e.target.value } : s)}
                        placeholder="Modelo..." style={{ ...inputStSmall, marginTop: 4 }} />
                    )}
                  </td>

                  {/* Serial edit */}
                  <td style={{ padding: 8, verticalAlign: "top" }}>
                    <input type="text" value={editState.serial}
                      onChange={e => setEditState(s => s ? { ...s, serial: e.target.value } : s)}
                      style={inputStSmall} />
                  </td>

                  {/* IMEI1 edit */}
                  <td style={{ padding: 8, verticalAlign: "top" }}>
                    <input type="text" value={editState.imei1}
                      onChange={e => setEditState(s => s ? { ...s, imei1: e.target.value } : s)}
                      style={inputStSmall} />
                  </td>

                  {/* Estado */}
                  <td style={{ padding: 8, verticalAlign: "top" }}>
                    <span style={{
                      padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700,
                      background: r.usado === "true" ? "#dcfce7" : "#fef9c3",
                      color:      r.usado === "true" ? "#16a34a" : "#854d0e",
                    }}>
                      {r.usado === "true" ? "Registrado" : "Pendiente"}
                    </span>
                  </td>

                  {/* Acciones edit */}
                  <td style={{ padding: 8, verticalAlign: "top" }}>
                    {errorEdit && <p style={{ color: "#ef4444", fontSize: 11, margin: "0 0 4px" }}>⚠️ {errorEdit}</p>}
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => guardarEdicion(r.id)} disabled={guardandoEdit}
                        style={{
                          padding: "5px 10px", fontSize: 11, fontWeight: 700,
                          background: "#22c55e", color: "#fff",
                          border: "none", borderRadius: 6, cursor: "pointer",
                        }}>
                        {guardandoEdit ? "..." : "✓ Guardar"}
                      </button>
                      <button onClick={cancelarEdicion}
                        style={{
                          padding: "5px 10px", fontSize: 11, fontWeight: 700,
                          background: "#f1f5f9", color: "#374151",
                          border: "1px solid #d1d5db", borderRadius: 6, cursor: "pointer",
                        }}>
                        Cancelar
                      </button>
                    </div>
                  </td>
                </tr>
              );
            }

            // ─── FILA NORMAL ───
            return (
              <tr key={r.id} style={{ background: r.usado === "true" ? "#f0fdf4" : "#fff", borderBottom: "1px solid #f1f5f9" }}>
                <td style={{ padding: 10 }}>{r.marca  || "—"}</td>
                <td style={{ padding: 10 }}>{r.modelo || "—"}</td>
                <td style={{ padding: 10, fontWeight: 700 }}>{r.serial}</td>
                <td style={{ padding: 10 }}>{r.imei1  || "—"}</td>
                <td style={{ padding: 10 }}>
                  <span style={{
                    padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700,
                    background: r.usado === "true" ? "#dcfce7" : "#fef9c3",
                    color:      r.usado === "true" ? "#16a34a" : "#854d0e",
                  }}>
                    {r.usado === "true" ? "Registrado" : "Pendiente"}
                  </span>
                </td>
                <td style={{ padding: 10 }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    {/* Editar — disponible para todos */}
                    <button onClick={() => iniciarEdicion(r)}
                      style={{
                        background: "none", border: "1px solid #d1d5db",
                        borderRadius: 6, padding: "4px 8px",
                        fontSize: 12, cursor: "pointer", color: "#374151",
                      }}
                      title="Editar">
                      ✏️
                    </button>

                    {/* Eliminar normal — solo pendientes */}
                    {r.usado !== "true" && (
                      <button onClick={() => eliminar(r.id, r.usado)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", fontSize: 16 }}
                        title="Eliminar">
                        ✕
                      </button>
                    )}

                    {/* Forzar eliminación — solo registrados (huérfanos) */}
                    {r.usado === "true" && (
                      <button onClick={() => forzarEliminar(r.id, r.serial)}
                        style={{
                          background: "none", border: "1px solid #fca5a5",
                          borderRadius: 6, padding: "4px 8px",
                          fontSize: 11, cursor: "pointer", color: "#ef4444", fontWeight: 700,
                        }}
                        title="Eliminar registro de la lista">
                        🗑️
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}