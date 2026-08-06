import { useEffect, useState } from "react";
import StatCard from "../Dashboard/components/StatCard";
import { listRuns, createRun, sendRun, deleteRun, downloadRunExcel } from "../../api/backups";
import type { BackupRun } from "../../api/backups";
import {
  MAIN_GRADIENT,
  isAdmin,
  toIsoStart,
  toIsoEnd,
  formatFecha,
  formatFechaHora,
  todayStr,
  daysAgoStr,
  firstOfMonthStr,
  lastOfPrevMonthStr,
  parseEmailList,
} from "./shared";

export default function KpiBackupReportPage() {
  const [runs, setRuns] = useState<BackupRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<BackupRun | null>(null);

  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");

  const [sendTarget, setSendTarget] = useState<BackupRun | null>(null);
  const [to, setTo] = useState("");
  const [cc, setCc] = useState("");
  const [asunto, setAsunto] = useState("");
  const [mensaje, setMensaje] = useState(
    "Estimado(a),\n\nAdjunto encontrará el informe general de backup de servidores.\n\nSaludos."
  );
  const [sending, setSending] = useState(false);
  const [sendMsg, setSendMsg] = useState<string | null>(null);

  const admin = isAdmin();

  async function cargar() {
    setLoading(true);
    try {
      const data = await listRuns("kpi");
      setRuns(data);
      if (data.length > 0) setSelected(data[0]);
    } catch {
      setError("No se pudieron cargar las ejecuciones anteriores.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  const handleCrear = async () => {
    setCreating(true);
    setError(null);
    try {
      const params =
        desde && hasta ? { fechaInicio: toIsoStart(desde), fechaFin: toIsoEnd(hasta) } : undefined;
      const run = await createRun("kpi", params);
      setRuns((prev) => [run, ...prev]);
      setSelected(run);
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || "Error al descargar y procesar el informe.");
    } finally {
      setCreating(false);
    }
  };

  const handleDescargar = async (run: BackupRun) => {
    try {
      await downloadRunExcel("kpi", run.runId);
    } catch {
      setError("No se pudo descargar el Excel.");
    }
  };

  const abrirEnviar = (run: BackupRun) => {
    setSendTarget(run);
    setTo("");
    setCc("");
    setAsunto(
      `Informe General de Backup Servidores — ${new Date().toLocaleDateString("es-CO", { month: "long", year: "numeric" })}`
    );
    setSendMsg(null);
  };

  const handleEnviar = async () => {
    if (!sendTarget) return;
    if (!to.trim()) {
      setSendMsg("❌ Ingresa al menos un destinatario.");
      return;
    }
    setSending(true);
    setSendMsg(null);
    try {
      const updated = await sendRun("kpi", sendTarget.runId, {
        to: parseEmailList(to),
        cc: cc ? parseEmailList(cc) : undefined,
        asunto: asunto || undefined,
        mensaje,
      });
      setRuns((prev) => prev.map((r) => (r.runId === updated.runId ? updated : r)));
      setSendMsg("✅ Correo enviado correctamente.");
      setTimeout(() => setSendTarget(null), 1200);
    } catch (err: any) {
      setSendMsg(`❌ ${err?.response?.data?.error || err?.message || "Error al enviar"}`);
    } finally {
      setSending(false);
    }
  };

  const handleEliminar = async (run: BackupRun) => {
    if (!window.confirm(`¿Eliminar la ejecución del ${formatFechaHora(run.creadoEn)}?`)) return;
    try {
      await deleteRun("kpi", run.runId);
      setRuns((prev) => prev.filter((r) => r.runId !== run.runId));
      if (selected?.runId === run.runId) setSelected(null);
    } catch {
      setError("No se pudo eliminar la ejecución.");
    }
  };

  const s = selected?.resumen as any;

  return (
    <div
      style={{
        minHeight: "100%",
        padding: "32px 28px",
        fontFamily: "Calibri, 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        background: "linear-gradient(160deg, #FA8200 0%, #843952 60%, #b6433f 100%, #D86018)",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* ── HEADER ── */}
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, color: "#fff", display: "flex", alignItems: "center", gap: 10 }}>
            <span>📊</span> KPI Backup
          </h1>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,.85)", margin: "6px 0 0" }}>
            Dashboard completo de backups (File System / BD + VMware) — sin envío automático, se dispara bajo demanda.
          </p>
        </div>

        {error && (
          <div style={{ background: "#fee2e2", color: "#991b1b", padding: "10px 16px", borderRadius: 10, marginBottom: 16, fontSize: 13, fontWeight: 600 }}>
            {error}
          </div>
        )}

        {/* ── PANEL: NUEVA EJECUCIÓN ── */}
        <div style={{ borderRadius: 14, overflow: "hidden", border: "1px solid rgba(255,255,255,.08)", boxShadow: "0 8px 32px rgba(0,0,0,.35)", marginBottom: 24 }}>
          <div style={{ background: MAIN_GRADIENT, padding: "14px 20px" }}>
            <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#fff" }}>Nueva ejecución</span>
          </div>
          <div style={{ background: "#fff", padding: 18 }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
              <PresetBtn label="Últimos 7 días" onClick={() => { setDesde(daysAgoStr(7)); setHasta(todayStr()); }} />
              <PresetBtn label="Mes actual" onClick={() => { setDesde(firstOfMonthStr()); setHasta(todayStr()); }} />
              <PresetBtn label="Mes anterior" onClick={() => { setDesde(firstOfMonthStr(-1)); setHasta(lastOfPrevMonthStr()); }} />
              <PresetBtn label="Limpiar (mes anterior por defecto)" onClick={() => { setDesde(""); setHasta(""); }} />
            </div>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
              <Field label="Desde">
                <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} style={inputStyle} />
              </Field>
              <Field label="Hasta">
                <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} style={inputStyle} />
              </Field>
              <button onClick={handleCrear} disabled={creating} style={primaryBtnStyle(creating)}>
                {creating ? "⏳ Procesando…" : "⬇ Descargar y procesar"}
              </button>
            </div>
          </div>
        </div>

        {/* ── STAT CARDS ── */}
        {s && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: 14, marginBottom: 14 }}>
              <StatCard label="Total Jobs" value={s.totalJobs} grad={MAIN_GRADIENT} />
              <StatCard label="Completados" value={s.completados} grad="linear-gradient(135deg, #16A34A, #15803D)" />
              <StatCard label="% Éxito" value={`${s.pctExito}%`} grad="linear-gradient(135deg, #2563EB, #1D4ED8)" />
              <StatCard label="Fallidos" value={s.fallidos} grad="linear-gradient(135deg, #DC2626, #991B1B)" />
              <StatCard label="Clientes" value={s.clientes} grad="linear-gradient(135deg, #7C3AED, #6D28D9)" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: 14, marginBottom: 24 }}>
              <StatCard label="VMs respaldadas" value={s.totalVms} grad="linear-gradient(135deg, #0F766E, #115E59)" />
              <StatCard label="VMs completadas" value={s.vmsCompletadas} grad="linear-gradient(135deg, #16A34A, #15803D)" />
              <StatCard label="% Éxito VMs" value={`${s.pctExitoVms}%`} grad="linear-gradient(135deg, #2563EB, #1D4ED8)" />
              <StatCard label="VMs con Fallas" value={s.vmsConFallas?.length ?? 0} grad="linear-gradient(135deg, #DC2626, #991B1B)" />
              <StatCard label="Compresión prom. (%)" value={`${s.promedioCompresionPct}%`} grad="linear-gradient(135deg, #FA8200, #D86018)" />
            </div>

            {/* VMs con fallas */}
            {s.vmsConFallas?.length > 0 && (
              <MiniTable
                title="VMs con fallas"
                headers={["VM", "Estado", "SO", "Razón de falla", "Fecha"]}
                rows={s.vmsConFallas.map((v: any) => [v.nombreVm, v.estado, v.sistemaOperativo, v.razonFalla, v.fecha])}
                alert
              />
            )}

            {/* Jobs fallidos (File System/BD) */}
            {s.jobsFallidos?.length > 0 && (
              <MiniTable
                title="Jobs fallidos — File System/BD"
                headers={["Cliente / Máquina", "Tipo de Agente", "Tipo de Backup", "Razón de falla", "Fecha"]}
                rows={s.jobsFallidos.map((j: any) => [j.clienteMaquina, j.tipoAgente, j.tipoBackup, j.razonFalla, j.fecha])}
                alert
              />
            )}
          </>
        )}

        {/* ── HISTÓRICO ── */}
        <div style={{ borderRadius: 14, overflow: "hidden", border: "1px solid rgba(255,255,255,.08)", boxShadow: "0 8px 32px rgba(0,0,0,.35)" }}>
          <div style={{ background: MAIN_GRADIENT, padding: "14px 20px" }}>
            <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#fff" }}>Histórico de ejecuciones</span>
          </div>
          <div style={{ background: "#fff" }}>
            {loading ? (
              <div style={{ padding: 40, textAlign: "center", color: "#888" }}>Cargando…</div>
            ) : runs.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center", color: "#888" }}>Aún no hay ejecuciones registradas.</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}>
                  <thead>
                    <tr style={{ background: "rgb(90, 56, 112)" }}>
                      {["Creado", "Rango", "Correos", "Archivos", "% Éxito", "Enviado", "Acciones"].map((h) => (
                        <th key={h} style={thStyle}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {runs.map((r) => (
                      <tr
                        key={r.runId}
                        onClick={() => setSelected(r)}
                        style={{ cursor: "pointer", background: selected?.runId === r.runId ? "#fff3e6" : "#fff", borderBottom: "1px solid #eee" }}
                      >
                        <td style={tdStyle}>{formatFechaHora(r.creadoEn)}</td>
                        <td style={tdStyle}>{formatFecha(r.fechaInicio)} → {formatFecha(r.fechaFin)}</td>
                        <td style={tdStyle}>{r.correosEncontrados}</td>
                        <td style={tdStyle}>{r.archivosProcesados}</td>
                        <td style={tdStyle}>{r.resumen ? `${(r.resumen as any).pctExito}%` : "—"}</td>
                        <td style={tdStyle}>{r.enviado ? "✅" : "—"}</td>
                        <td style={tdStyle} onClick={(e) => e.stopPropagation()}>
                          <div style={{ display: "flex", gap: 6 }}>
                            <IconBtn title="Descargar Excel" onClick={() => handleDescargar(r)}>📥</IconBtn>
                            <IconBtn title="Enviar por correo" onClick={() => abrirEnviar(r)}>✉️</IconBtn>
                            {admin && <IconBtn title="Eliminar" onClick={() => handleEliminar(r)}>🗑️</IconBtn>}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── MODAL ENVIAR CORREO ── */}
      {sendTarget && (
        <div style={overlayStyle} onClick={() => !sending && setSendTarget(null)}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: "0 0 4px", fontSize: 17 }}>Enviar informe por correo</h3>
            <p style={{ margin: "0 0 16px", fontSize: 12, color: "#777" }}>Se adjuntará el Excel generado.</p>
            <Field label="Destinatario(s) — separados por ;">
              <input value={to} onChange={(e) => setTo(e.target.value)} style={inputStyle} placeholder="correo1@fiduprevisora.com.co; correo2@..." />
            </Field>
            <div style={{ height: 10 }} />
            <Field label="CC (opcional)">
              <input value={cc} onChange={(e) => setCc(e.target.value)} style={inputStyle} />
            </Field>
            <div style={{ height: 10 }} />
            <Field label="Asunto">
              <input value={asunto} onChange={(e) => setAsunto(e.target.value)} style={inputStyle} />
            </Field>
            <div style={{ height: 10 }} />
            <Field label="Mensaje">
              <textarea value={mensaje} onChange={(e) => setMensaje(e.target.value)} style={{ ...inputStyle, minHeight: 90, resize: "vertical" }} />
            </Field>
            {sendMsg && <div style={{ marginTop: 12, fontSize: 13, fontWeight: 600 }}>{sendMsg}</div>}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
              <button onClick={() => setSendTarget(null)} disabled={sending} style={secondaryBtnStyle}>Cancelar</button>
              <button onClick={handleEnviar} disabled={sending} style={primaryBtnStyle(sending)}>
                {sending ? "Enviando…" : "Enviar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── SUB-COMPONENTS / ESTILOS ─────────────────────────────────────────────────

function MiniTable({ title, headers, rows, alert }: { title: string; headers: string[]; rows: (string | number)[][]; alert?: boolean }) {
  return (
    <div style={{ borderRadius: 14, overflow: "hidden", border: "1px solid rgba(255,255,255,.08)", boxShadow: "0 8px 32px rgba(0,0,0,.35)", marginBottom: 24 }}>
      <div style={{ background: alert ? "linear-gradient(135deg, #DC2626, #991B1B)" : MAIN_GRADIENT, padding: "12px 20px" }}>
        <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#fff" }}>{title}</span>
      </div>
      <div style={{ background: "#fff", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 500 }}>
          <thead>
            <tr style={{ background: "#f3f3f3" }}>
              {headers.map((h) => (
                <th key={h} style={{ ...thStyle, color: "#555" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} style={{ borderBottom: "1px solid #eee", background: alert ? "#fef2f2" : i % 2 === 0 ? "#fafafa" : "#fff" }}>
                {row.map((cell, ci) => (
                  <td key={ci} style={tdStyle}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, minWidth: 160 }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase" }}>{label}</span>
      {children}
    </div>
  );
}

function PresetBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #ddd", background: "#fafafa", color: "#555", fontSize: 12, cursor: "pointer" }}>
      {label}
    </button>
  );
}

function IconBtn({ title, onClick, children }: { title: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button title={title} onClick={onClick} style={{ border: "none", background: "#f2f2f2", borderRadius: 6, width: 30, height: 30, cursor: "pointer", fontSize: 14 }}>
      {children}
    </button>
  );
}

const inputStyle: React.CSSProperties = { padding: "8px 10px", borderRadius: 8, border: "1px solid #ddd", fontSize: 13, width: "100%", fontFamily: "inherit" };

const thStyle: React.CSSProperties = { padding: "11px 15px", textAlign: "left", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#fff", whiteSpace: "nowrap" };

const tdStyle: React.CSSProperties = { padding: "10px 15px", fontSize: 13, color: "#333" };

function primaryBtnStyle(disabled: boolean): React.CSSProperties {
  return { padding: "9px 18px", borderRadius: 8, border: "none", background: disabled ? "#ddb8ae" : MAIN_GRADIENT, color: "#fff", fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer", fontSize: 13 };
}

const secondaryBtnStyle: React.CSSProperties = { padding: "9px 18px", borderRadius: 8, border: "1px solid #ddd", background: "#fff", color: "#555", fontWeight: 700, cursor: "pointer", fontSize: 13 };

const overlayStyle: React.CSSProperties = { position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 };

const modalStyle: React.CSSProperties = { background: "#fff", borderRadius: 14, padding: 24, width: 460, maxWidth: "90vw", boxShadow: "0 20px 60px rgba(0,0,0,.3)", maxHeight: "85vh", overflowY: "auto" };
