// frontend/src/pages/AssetDetail/OcsSoftwareSection.tsx
import { useEffect, useState } from "react";
import { getOcsSoftware, getOcsStatus } from "../../api/client";
import { C } from "./constants";

interface SoftwareItem {
  id: string;
  softwareName: string;
  softwareVersion: string | null;
  softwarePublisher: string | null;
}

interface OcsStatus {
  lastSync: string | null;
  totalMappings: number;
  totalSoftware: number;
}

export function OcsSoftwareSection({ assetId }: { assetId: string }) {
  const [software, setSoftware] = useState<SoftwareItem[]>([]);
  const [status, setStatus] = useState<OcsStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  useEffect(() => {
    Promise.all([getOcsSoftware(assetId), getOcsStatus()])
      .then(([sw, st]) => {
        setSoftware(Array.isArray(sw) ? sw : (sw?.data ?? []));
        setStatus(st ?? null);
      })
      .catch(() => {
        setSoftware([]);
        setStatus(null);
      })
      .finally(() => setLoading(false));
  }, [assetId]);

  useEffect(() => {
    setPage(1);
  }, [search, assetId]);

  const filtered = software.filter((s) =>
    s.softwareName.toLowerCase().includes(search.toLowerCase()) ||
    (s.softwarePublisher ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const pageItems = filtered.slice(startIndex, startIndex + pageSize);

  const lastSyncStr = status?.lastSync
    ? new Date(status.lastSync).toLocaleString("es-CO", {
        timeZone: "America/Bogota",
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      })
    : "—";

  return (
    <div
      style={{
        borderRadius: 16,
        overflow: "hidden",
        border: "1.5px solid #f0e8e8",
        boxShadow: "0 4px 16px rgba(183,49,44,.06)",
        marginBottom: 18,
      }}
    >
      {/* Header — idéntico a Section */}
      <div
        style={{
          background: C.grad,
          padding: "16px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 18 }}>💿</span>
          <span
            style={{
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "#fff",
            }}
          >
            Software Instalado (OCS)
          </span>
        </div>
        <span
          style={{
            fontSize: 11,
            color: "rgba(255,255,255,.75)",
            fontFamily: "Calibri, sans-serif",
          }}
        >
          Último sync: {lastSyncStr}
          {software.length > 0 && ` · ${software.length} aplicaciones`}
        </span>
      </div>

      {/* Body */}
      <div style={{ background: "#fff", padding: "20px" }}>
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 0" }}>
            <div
              style={{
                width: 20, height: 20, borderRadius: "50%",
                border: "3px solid rgba(183,49,44,.15)",
                borderTop: "3px solid #B7312C",
                animation: "spin 1s linear infinite",
              }}
            />
            <span style={{ fontSize: 13, color: "#999" }}>Cargando software...</span>
            <style>{`@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}`}</style>
          </div>
        ) : software.length === 0 ? (
          <p style={{ fontSize: 13, color: "#999", margin: 0, padding: "8px 0" }}>
            Sin software registrado en OCS para este servidor.
          </p>
        ) : (
          <>
            {/* Buscador */}
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre o fabricante..."
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1.5px solid #e8d8d8",
                borderRadius: 8,
                fontSize: 13,
                fontFamily: "Calibri, sans-serif",
                outline: "none",
                marginBottom: 14,
                boxSizing: "border-box",
                color: "#333",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#B7312C")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#e8d8d8")}
            />

            {filtered.length > 0 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: 12,
                  color: "#777",
                  marginBottom: 10,
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <span>
                  Mostrando {Math.min(startIndex + 1, filtered.length)}-
                  {Math.min(startIndex + pageSize, filtered.length)} de {filtered.length}
                </span>
                {filtered.length > pageSize && (
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={safePage === 1}
                      style={{
                        padding: "6px 10px",
                        borderRadius: 6,
                        border: "1px solid #e8d8d8",
                        background: safePage === 1 ? "#f6f1f1" : "#fff",
                        color: "#555",
                        fontSize: 12,
                        cursor: safePage === 1 ? "not-allowed" : "pointer",
                      }}
                    >
                      Anterior
                    </button>
                    <span style={{ alignSelf: "center", fontSize: 12, color: "#777" }}>
                      {safePage} / {totalPages}
                    </span>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={safePage === totalPages}
                      style={{
                        padding: "6px 10px",
                        borderRadius: 6,
                        border: "1px solid #e8d8d8",
                        background: safePage === totalPages ? "#f6f1f1" : "#fff",
                        color: "#555",
                        fontSize: 12,
                        cursor: safePage === totalPages ? "not-allowed" : "pointer",
                      }}
                    >
                      Siguiente
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Tabla */}
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: 13,
                  fontFamily: "Calibri, sans-serif",
                }}
              >
                <thead>
                  <tr style={{ background: "#fdf5f5" }}>
                    {["Nombre", "Versión", "Fabricante"].map((h) => (
                      <th
                        key={h}
                        style={{
                          textAlign: "left",
                          padding: "8px 12px",
                          fontSize: 11,
                          fontWeight: 700,
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          color: "#B7312C",
                          borderBottom: "2px solid #f0e8e8",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((s, i) => (
                    <tr
                      key={s.id}
                      style={{
                        background: i % 2 === 0 ? "#fff" : "#fdfafa",
                        transition: "background .15s",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "#fdf0f0")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background =
                          i % 2 === 0 ? "#fff" : "#fdfafa")
                      }
                    >
                      <td style={{ padding: "7px 12px", color: "#333", fontWeight: 500 }}>
                        {s.softwareName}
                      </td>
                      <td style={{ padding: "7px 12px", color: "#666" }}>
                        {s.softwareVersion ?? "—"}
                      </td>
                      <td style={{ padding: "7px 12px", color: "#666" }}>
                        {s.softwarePublisher ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && search && (
                <p style={{ fontSize: 13, color: "#999", marginTop: 10, textAlign: "center" }}>
                  Sin resultados para "{search}"
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}