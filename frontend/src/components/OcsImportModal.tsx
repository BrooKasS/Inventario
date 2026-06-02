import { useEffect, useState } from "react";
import { getOcsUnmatched } from "../api/client";

interface OcsEquipo {
  ID: number;
  NAME: string;
  IPADDR: string;
  OSNAME: string | null;
  MEMORY: number | null;
  VCPU: number | null;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (equipo: OcsEquipo) => void;
}

const C = {
  grad: "linear-gradient(135deg, #FA8200 0%, #861F41 35%, #B7312C 70%, #D86018 100%)",
  primary: "#B7312C",
};

export default function OcsImportModal({ open, onClose, onSelect }: Props) {
  const [equipos, setEquipos] = useState<OcsEquipo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);
    getOcsUnmatched()
      .then(data => setEquipos(Array.isArray(data) ? data : []))
      .catch(() => setError("Error cargando equipos OCS"))
      .finally(() => setLoading(false));
  }, [open]);

  if (!open) return null;

  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,.65)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1100, padding: 16,
      }}
    >
      <div style={{
        background: "#fff", borderRadius: 12,
        width: "100%", maxWidth: 660,
        maxHeight: "85vh", display: "flex", flexDirection: "column",
        boxShadow: "0 20px 60px rgba(0,0,0,.2)",
        overflow: "hidden",
      }}>

        {/* Header */}
        <div style={{
          background: C.grad, padding: "22px 28px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 10,
              background: "rgba(255,255,255,.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20,
            }}>🖥️</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#fff" }}>
                Servidores OCS sin inventario
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,.7)", marginTop: 2 }}>
                Selecciona un equipo para pre-llenar el formulario
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,.15)", border: "none",
              color: "#fff", borderRadius: 8, width: 34, height: 34,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", fontSize: 20,
            }}
          >×</button>
        </div>

        {/* Body */}
        <div style={{ overflowY: "auto", flex: 1, padding: "20px 24px" }}>
          {loading && (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#888", fontFamily: "Calibri, sans-serif" }}>
              Cargando equipos OCS...
            </div>
          )}

          {error && (
            <div style={{
              background: "#fff5f5", border: "1px solid #f08080",
              borderRadius: 8, padding: "12px 16px",
              color: "#c0392b", fontFamily: "Calibri, sans-serif", fontSize: 13,
            }}>
              {error}
            </div>
          )}

          {!loading && !error && equipos.length === 0 && (
            <div style={{
              textAlign: "center", padding: "48px 0",
              fontFamily: "Calibri, sans-serif",
            }}>
              <div style={{ fontSize: 42, marginBottom: 12 }}>✅</div>
              <div style={{ color: "#555", fontSize: 14, fontWeight: 600 }}>
                Todos los servidores OCS ya están en el inventario
              </div>
            </div>
          )}

          {!loading && !error && equipos.length > 0 && (
            <>
              <div style={{
                fontSize: 11, fontWeight: 700, letterSpacing: "0.1em",
                textTransform: "uppercase", color: "#888",
                marginBottom: 14, fontFamily: "Calibri, sans-serif",
              }}>
                {equipos.length} equipo{equipos.length !== 1 ? "s" : ""} encontrado{equipos.length !== 1 ? "s" : ""}
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f5f0f0" }}>
                    {["Nombre", "IP", "OS", "RAM", "CPU", ""].map(h => (
                      <th key={h} style={{
                        padding: "10px 14px", textAlign: "left",
                        fontSize: 10, fontWeight: 800, letterSpacing: "0.1em",
                        textTransform: "uppercase", color: "#5a4a45",
                        fontFamily: "Calibri, sans-serif",
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {equipos.map((eq, i) => (
                    <tr key={eq.ID} style={{
                      borderBottom: "1px solid #f0e8e8",
                      background: i % 2 === 0 ? "#fff" : "#fdfafa",
                    }}>
                      <td style={{ padding: "12px 14px", fontFamily: "Calibri, sans-serif" }}>
                        <strong style={{ color: "#1A1A1A" }}>{eq.NAME}</strong>
                      </td>
                      <td style={{ padding: "12px 14px", fontFamily: "Calibri, sans-serif" }}>
                        <code style={{ fontSize: 13, color: "#333" }}>{eq.IPADDR}</code>
                      </td>
                      <td style={{ padding: "12px 14px", fontFamily: "Calibri, sans-serif", fontSize: 13, color: "#555" }}>
                        {eq.OSNAME ?? "—"}
                      </td>
                      <td style={{ padding: "12px 14px", fontFamily: "Calibri, sans-serif", fontSize: 13, color: "#555" }}>
                        {eq.MEMORY ? `${eq.MEMORY} MB` : "—"}
                      </td>
                      <td style={{ padding: "12px 14px", fontFamily: "Calibri, sans-serif", fontSize: 13, color: "#555" }}>
                        {eq.VCPU ? `${eq.VCPU} vCPU` : "—"}
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        <button
                          onClick={() => { onSelect(eq); onClose(); }}
                          style={{
                            background: C.grad, color: "#fff",
                            border: "none", borderRadius: 6,
                            padding: "7px 16px", cursor: "pointer",
                            fontWeight: 700, fontSize: 12,
                            fontFamily: "Calibri, sans-serif",
                            whiteSpace: "nowrap",
                            boxShadow: "0 2px 8px rgba(183,49,44,.2)",
                          }}
                        >
                          Añadir →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: "16px 24px", borderTop: "1px solid #f0e8e8",
          background: "#fafaf9", display: "flex",
          justifyContent: "flex-end", flexShrink: 0,
        }}>
          <button
            onClick={onClose}
            style={{
              padding: "10px 24px", borderRadius: 8,
              border: "1px solid #e0d8d8", background: "#fff",
              color: "#555", fontWeight: 700, cursor: "pointer",
              fontSize: 13, fontFamily: "Calibri, sans-serif",
            }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}