import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_URL;
const token = () => sessionStorage.getItem("inventario_token");

interface StagingRow {
  id: string;
  serial: string;
  imei1: string | null;
  imei2: string | null;
  usado: string;
  creadoEn: string;
}

interface Stats { total: number; usados: number; pendientes: number; }

export default function MobileStagingPage() {
  const navigate = useNavigate();

  const [serial, setSerial]   = useState("");
  const [imei1, setImei1]     = useState("");
  const [imei2, setImei2]     = useState("");
  const [registros, setRegistros] = useState<StagingRow[]>([]);
  const [stats, setStats]     = useState<Stats>({ total: 0, usados: 0, pendientes: 0 });
  const [error, setError]     = useState("");
  const [exito, setExito]     = useState("");
  const serialRef = useRef<HTMLInputElement>(null);

  const cargar = async () => {
    const [r1, r2] = await Promise.all([
      fetch(`${API}/mobile-staging`, { headers: { Authorization: `Bearer ${token()}` } }),
      fetch(`${API}/mobile-staging/stats`, { headers: { Authorization: `Bearer ${token()}` } }),
    ]);
    setRegistros(await r1.json());
    setStats(await r2.json());
  };

  useEffect(() => { cargar(); }, []);

  const guardar = async () => {
    setError(""); setExito("");
    if (!serial.trim()) { setError("El serial es obligatorio"); return; }

    const res = await fetch(`${API}/mobile-staging`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
      body: JSON.stringify({ serial, imei1, imei2 }),
    });

    if (res.status === 409) { setError("Este serial ya está registrado en staging"); return; }
    if (!res.ok) { setError("Error al guardar"); return; }

    setExito(`✅ ${serial.trim().toUpperCase()} guardado`);
    setSerial(""); setImei1(""); setImei2("");
    cargar();
    setTimeout(() => serialRef.current?.focus(), 50);
  };

  const eliminar = async (id: string, usado: string) => {
    if (usado === "true") { alert("No se puede eliminar, ya fue registrado como activo"); return; }
    if (!confirm("¿Eliminar este registro?")) return;
    await fetch(`${API}/mobile-staging/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token()}` },
    });
    cargar();
  };

  const handleKeyDown = (e: React.KeyboardEvent, action: "next1" | "next2" | "save") => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    if (action === "save") guardar();
  };

  return (
  <div style={{
    maxWidth: 820,
    margin: "0 auto",
    padding: 28,
    fontFamily: "Calibri, sans-serif",
  }}>
   {/* Header */}
<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
  <h2 style={{
    marginBottom: 8,
    fontWeight: 700,
    letterSpacing: ".02em"
  }}>
    📱 Pre-escaneo de Móviles
  </h2>

  <button
    onClick={() => navigate("/inventario/MOVIL")}
    style={{
      padding: "8px 14px",
      borderRadius: 8,
      border: "1px solid #d1d5db",
      background: "#fff",
      cursor: "pointer",
      fontWeight: 600
    }}
  >
    ← Volver



  </button>



  
</div>

    {/* Contadores */}
    <div style={{ display: "flex", gap: 14, marginBottom: 22 }}>
      {[
        { label: "Escaneados", value: stats.total, color: "#6366f1" },
        { label: "Registrados", value: stats.usados, color: "#22c55e" },
        { label: "Pendientes", value: stats.pendientes, color: "#f59e0b" },
      ].map(s => (
        <div key={s.label} style={{
          flex: 1,
          background: "#f8fafc",
          border: `2px solid ${s.color}`,
          borderRadius: 10,
          padding: "14px 16px",
          textAlign: "center",
          transition: "all .2s"
        }}>
          <div style={{
            fontSize: 26,
            fontWeight: 800,
            color: s.color
          }}>{s.value}</div>
          <div style={{
            fontSize: 12,
            color: "#64748b",
            marginTop: 2
          }}>{s.label}</div>
        </div>
      ))}
    </div>

    {/* Formulario */}
    <div style={{
      background: "#f8fafc",
      border: "1px solid #e2e8f0",
      borderRadius: 12,
      padding: 22,
      marginBottom: 26,
    }}>
      {[
        { label: "Serial *", value: serial, set: setSerial, ref: serialRef, action: undefined },
        { label: "IMEI 1", value: imei1, set: setImei1, ref: undefined, action: undefined },
        { label: "IMEI 2", value: imei2, set: setImei2, ref: undefined, action: "save" as const },
      ].map(({ label, value, set, ref, action }) => (
        <div key={label} style={{ marginBottom: 14 }}>
          <label style={{
            display: "block",
            fontSize: 12,
            fontWeight: 800,
            color: "#374151",
            marginBottom: 5,
            textTransform: "uppercase",
            letterSpacing: ".05em"
          }}>
            {label}
          </label>

          <input
            ref={ref}
            value={value}
            onChange={e => set(e.target.value)}
            onKeyDown={action ? e => handleKeyDown(e, action) : undefined}
            style={{
              width: "100%",
              padding: "10px 12px",
              border: "1.5px solid #d1d5db",
              borderRadius: 8,
              fontSize: 14,
              background: "#fff",
              outline: "none",
              transition: "border .2s, box-shadow .2s"
            }}
            onFocus={e => {
              e.currentTarget.style.border = "1.5px solid #6366f1";
              e.currentTarget.style.boxShadow = "0 0 0 2px rgba(99,102,241,.15)";
            }}
            onBlur={e => {
              e.currentTarget.style.border = "1.5px solid #d1d5db";
              e.currentTarget.style.boxShadow = "none";
            }}
            placeholder={
              label === "Serial *"
                ? "Escanea o escribe el serial"
                : label === "IMEI 1"
                ? "Escanea IMEI 1"
                : "Escanea IMEI 2 → Enter para guardar"
            }
          />
        </div>
      ))}

      {error && (
        <p style={{
          color: "#ef4444",
          margin: "10px 0",
          fontSize: 13,
          fontWeight: 600
        }}>
          ⚠️ {error}
        </p>
      )}

      {exito && (
        <p style={{
          color: "#22c55e",
          margin: "10px 0",
          fontSize: 13,
          fontWeight: 600
        }}>
          {exito}
        </p>
      )}

      <button
        onClick={guardar}
        style={{
          marginTop: 10,
          padding: "10px 26px",
          background: "linear-gradient(135deg,#6366f1,#4f46e5)",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          fontSize: 14,
          fontWeight: 700,
          cursor: "pointer",
          transition: "all .2s"
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = "translateY(-1px)";
          e.currentTarget.style.boxShadow = "0 6px 16px rgba(99,102,241,.3)";
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        GUARDAR
      </button>
    </div>

    {/* Tabla */}
    <h3 style={{
      marginBottom: 10,
      fontWeight: 700
    }}>
      Seriales sin registrar ({stats.pendientes})
    </h3>

    <table style={{
      width: "100%",
      borderCollapse: "collapse",
      fontSize: 13,
      borderRadius: 10,
      overflow: "hidden"
    }}>
      <thead>
        <tr style={{ background: "#f1f5f9" }}>
          {["Serial", "IMEI 1", "IMEI 2", "Estado", ""].map(h => (
            <th key={h} style={{
              padding: "10px 12px",
              textAlign: "left",
              fontWeight: 700,
              borderBottom: "2px solid #e2e8f0"
            }}>
              {h}
            </th>
          ))}
        </tr>
      </thead>

      <tbody>
        {registros.map(r => (
          <tr key={r.id} style={{
            background: r.usado === "true" ? "#f0fdf4" : "#fff",
            borderBottom: "1px solid #f1f5f9"
          }}>
            <td style={{ padding: 10, fontWeight: 700 }}>{r.serial}</td>
            <td style={{ padding: 10 }}>{r.imei1 || "—"}</td>
            <td style={{ padding: 10 }}>{r.imei2 || "—"}</td>
            <td style={{ padding: 10 }}>
              <span style={{
                padding: "3px 10px",
                borderRadius: 99,
                fontSize: 11,
                fontWeight: 700,
                background: r.usado === "true" ? "#dcfce7" : "#fef9c3",
                color: r.usado === "true" ? "#16a34a" : "#854d0e"
              }}>
                {r.usado === "true" ? "Registrado" : "Pendiente"}
              </span>
            </td>
            <td style={{ padding: 10 }}>
              {r.usado !== "true" && (
                <button
                  onClick={() => eliminar(r.id, r.usado)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#ef4444",
                    fontSize: 16
                  }}
                >
                  ✕
                </button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
}