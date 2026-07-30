import { getRol } from "../../api/auth";

export const MAIN_GRADIENT = "linear-gradient(135deg, #fa8100 0%, #861F41 35%, #B7312C 70%, #D86018 100%)";

export function isAdmin(): boolean {
  return getRol() === "ADMIN";
}

export function toIsoStart(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00.000Z`).toISOString();
}

export function toIsoEnd(dateStr: string): string {
  return new Date(`${dateStr}T23:59:59.999Z`).toISOString();
}

export function formatFecha(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatFechaHora(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function daysAgoStr(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export function firstOfMonthStr(offsetMonths = 0): string {
  const d = new Date();
  d.setMonth(d.getMonth() + offsetMonths, 1);
  return d.toISOString().slice(0, 10);
}

export function lastOfPrevMonthStr(): string {
  const d = new Date();
  d.setDate(0); // último día del mes anterior
  return d.toISOString().slice(0, 10);
}

export function parseEmailList(text: string): string[] {
  return text
    .split(/[;,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}
