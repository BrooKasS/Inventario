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
}

export default function ObservationsModal({
  open,
  onClose,
  obsModalTipo,
  obsModalLoading,
  obsModalRows,
  incluirSistema,
}: ObservationsModalProps) {
  const shouldShowSystemWarning =
    obsModalTipo && !incluirSistema && (obsModalTipo === "CAMBIO_CAMPO" || obsModalTipo === "IMPORTACION");

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={obsModalTipo ? `Observaciones — ${EVENTO_LABEL_MAP[obsModalTipo] ?? obsModalTipo}` : "Observaciones"}
      width={1150}
    >
      <div style={{ background: "#fff", borderRadius: 12, overflow: "hidden", border: "1px solid rgba(0,0,0,.06)" }}>
        <div style={{ padding: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontWeight: 700, color: "#333" }}>
            {obsModalTipo ? `Tipo de evento: ${EVENTO_LABEL_MAP[obsModalTipo] ?? obsModalTipo}` : ""}
          </div>
          {obsModalLoading && <span style={{ fontSize: 12, color: "#777" }}>Cargando…</span>}
        </div>

        {shouldShowSystemWarning && (
          <div style={{ padding: "8px 12px", color: "#b35b00", background: "#fff6e8", borderTop: "1px solid #ffe2bf" }}>
            Mostrando registros del autor <b>sistema</b> para este tipo de evento.
          </div>
        )}

        {obsModalRows.length === 0 && !obsModalLoading ? (
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
                {obsModalRows.map((r, idx) => (
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
      </div>
    </Modal>
  );
}
