import { useEffect, useMemo, useState } from "react";
import type { ObsModalRow } from "../types";
import { EVENTO_LABEL_MAP } from "../constants";
import Modal from "../../../components/Modal";

interface ObservationsModalProps {
  open: boolean;
  onClose: () => void;
  obsModalTipo: string | null;
  obsModalLoading: boolean;
  obsModalRows: ObsModalRow[];
  incluirSistema: boolean;
  onToggleIncluirSistema: (value: boolean) => void;
}

export default function ObservationsModal({
  open,
  onClose,
  obsModalTipo,
  obsModalLoading,
  obsModalRows,
  incluirSistema,
  onToggleIncluirSistema,
}: ObservationsModalProps) {
  const [page, setPage] = useState(1);
  const [filtroTipo, setFiltroTipo] = useState("TODOS");
  const [filtroUsuario, setFiltroUsuario] = useState("");
  const pageSize = 10;

  const supportedEventTypes = ["NOTA", "MANTENIMIENTO", "INCIDENTE", "CAMBIO_CAMPO"];
  const shouldShowSystemWarning = obsModalTipo && !incluirSistema && supportedEventTypes.includes(obsModalTipo);
  const showSystemToggle = Boolean(obsModalTipo && supportedEventTypes.includes(obsModalTipo));

  useEffect(() => {
    setPage(1);
  }, [obsModalTipo, obsModalRows, incluirSistema, filtroTipo, filtroUsuario]);

  const tiposDisponibles = useMemo(() => {
    const tipos = Array.from(new Set(obsModalRows.map((r) => r.tipo).filter(Boolean))).sort();
    return tipos;
  }, [obsModalRows]);

  const filasFiltradas = useMemo(() => {
    const usuario = filtroUsuario.trim().toLowerCase();
    return obsModalRows.filter((r) => {
      const coincideTipo = filtroTipo === "TODOS" || r.tipo === filtroTipo;
      const coincideUsuario = !usuario || (r.autor ?? "").toLowerCase().includes(usuario);
      return coincideTipo && coincideUsuario;
    });
  }, [obsModalRows, filtroTipo, filtroUsuario]);

  const totalPages = Math.max(1, Math.ceil(filasFiltradas.length / pageSize));
  const visibleRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filasFiltradas.slice(start, start + pageSize);
  }, [filasFiltradas, page]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={obsModalTipo ? `Observaciones — ${EVENTO_LABEL_MAP[obsModalTipo] ?? obsModalTipo}` : "Observaciones"}
      width={1150}
    >
      <div style={{ background: "#fff", borderRadius: 12, overflow: "hidden", border: "1px solid rgba(0,0,0,.06)" }}>
        <div style={{ padding: 12, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <div style={{ fontWeight: 700, color: "#333" }}>
            {obsModalTipo ? `Tipo de evento: ${EVENTO_LABEL_MAP[obsModalTipo] ?? obsModalTipo}` : ""}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {showSystemToggle && (
              <button
                onClick={() => onToggleIncluirSistema(!incluirSistema)}
                style={{
                  border: "1px solid #d9d9d9",
                  background: incluirSistema ? "#f5f7ff" : "#fff",
                  color: incluirSistema ? "#2446b3" : "#666",
                  borderRadius: 999,
                  padding: "6px 10px",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {incluirSistema ? "Ocultar registros del sistema" : "Ver registros del sistema"}
              </button>
            )}
            {obsModalLoading && <span style={{ fontSize: 12, color: "#777" }}>Cargando…</span>}
          </div>
        </div>

        {shouldShowSystemWarning && (
          <div style={{ padding: "8px 12px", color: "#b35b00", background: "#fff6e8", borderTop: "1px solid #ffe2bf" }}>
            Se están ocultando registros del autor <b>sistema</b> por defecto. Usa el botón para mostrarlos.
          </div>
        )}

        <div style={{ padding: "10px 12px", display: "flex", flexWrap: "wrap", gap: 10, borderTop: "1px solid rgba(0,0,0,.06)", background: "#fafafa" }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, color: "#444", minWidth: 180 }}>
            Tipo de activo
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              style={{ border: "1px solid #d9d9d9", borderRadius: 6, padding: "6px 8px", fontSize: 12 }}
            >
              <option value="TODOS">Todos</option>
              {tiposDisponibles.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {tipo}
                </option>
              ))}
            </select>
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, color: "#444", minWidth: 220 }}>
            Usuario
            <input
              value={filtroUsuario}
              onChange={(e) => setFiltroUsuario(e.target.value)}
              placeholder="Buscar por usuario"
              style={{ border: "1px solid #d9d9d9", borderRadius: 6, padding: "6px 8px", fontSize: 12 }}
            />
          </label>

          {(filtroTipo !== "TODOS" || filtroUsuario.trim()) && (
            <button
              onClick={() => {
                setFiltroTipo("TODOS");
                setFiltroUsuario("");
              }}
              style={{ alignSelf: "flex-end", border: "1px solid #d9d9d9", background: "#fff", borderRadius: 6, padding: "6px 10px", fontSize: 12, cursor: "pointer" }}
            >
              Limpiar filtros
            </button>
          )}
        </div>

        {filasFiltradas.length === 0 && !obsModalLoading ? (
          <div style={{ padding: 16, color: "#666" }}>
            No se encontraron observaciones para este tipo con los filtros actuales.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 980 }}>
              <thead>
                <tr style={{ background: "rgba(0,0,0,.05)" }}>
                  {[
                    "Activo",
                    "Tipo",
                    "Código",
                    "Fecha",
                    "Autor",
                    "Evento",
                    "Descripción",
                    "Campo modificado",
                    "Valor anterior",
                    "Valor nuevo",
                    
              
                  ].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "10px 14px",
                        textAlign: "left",
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: ".08em",
                        color: "#444",
                        borderBottom: "1px solid rgba(0,0,0,.06)",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((r, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid rgba(0,0,0,.06)" }}>
                    <td style={{ padding: "10px 14px" }}>{r.activo}</td>
                    <td style={{ padding: "10px 14px" }}>{r.tipo}</td>
                    <td style={{ padding: "10px 14px" }}>{r.codigo}</td>
                    <td style={{ padding: "10px 14px" }}>{r.fecha}</td>
                    <td style={{ padding: "10px 14px" }}>{r.autor}</td>
                    <td style={{ padding: "10px 14px" }}>{r.evento}</td>
                    <td style={{ padding: "10px 14px" }}>{r.descripcion}</td>
                    <td style={{ padding: "10px 14px" }}>{r.campo}</td>
                    <td style={{ padding: "10px 14px" }}>{r.anterior}</td>
                    <td style={{ padding: "10px 14px" }}>{r.nuevo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {filasFiltradas.length > 0 && totalPages > 1 && (
          <div style={{ padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(0,0,0,.06)", gap: 12 }}>
            <span style={{ fontSize: 12, color: "#666" }}>
              Mostrando {Math.min((page - 1) * pageSize + 1, filasFiltradas.length)}-{Math.min(page * pageSize, filasFiltradas.length)} de {filasFiltradas.length}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{
                  border: "1px solid #d9d9d9",
                  background: "#fff",
                  color: page === 1 ? "#999" : "#333",
                  borderRadius: 6,
                  padding: "6px 10px",
                  fontSize: 12,
                  cursor: page === 1 ? "not-allowed" : "pointer",
                }}
              >
                Anterior
              </button>
              <span style={{ fontSize: 12, color: "#666" }}>Página {page} de {totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{
                  border: "1px solid #d9d9d9",
                  background: "#fff",
                  color: page === totalPages ? "#999" : "#333",
                  borderRadius: 6,
                  padding: "6px 10px",
                  fontSize: 12,
                  cursor: page === totalPages ? "not-allowed" : "pointer",
                }}
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
