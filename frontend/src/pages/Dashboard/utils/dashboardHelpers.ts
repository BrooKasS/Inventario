import type { Asset } from "../../../types";
import type { ChartDataPoint } from "../types";
import { EVENTOS, EVENTO_LABEL_MAP, EVENT_COLOR_MAP } from "../constants";
import { getAssets, getAssetById } from "../../../api/client";

/**
 * Calcula y retorna los datos para la gráfica de observaciones por tipo de evento
 */
export async function buildObservationsChartData(): Promise<ChartDataPoint[]> {
  try {
    const resp = await getAssets({ limit: 50, page: 1 });
    const items: Asset[] = resp.assets || [];

    // Traer detalle (bitácora) por activo en paralelo
    const detallados = await Promise.all(items.map((a) => getAssetById(a.id).catch(() => null)));

    // Inicializar contadores por tipo de evento
    const counts: Record<string, number> = {};
    for (const ev of EVENTOS) counts[ev] = 0;

    for (const det of detallados) {
      if (!det) continue;
      const bit = (det as any).bitacora ?? [];
      for (const e of bit) {
        const ev = e?.tipoEvento as string | undefined;
        if (!ev) continue;
        if (EVENTOS.includes(ev as any)) {
          counts[ev] = (counts[ev] ?? 0) + 1;
        }
      }
    }

    return EVENTOS.map((ev) => ({
      key: ev,
      tipo: EVENTO_LABEL_MAP[ev],
      count: counts[ev] ?? 0,
      color: EVENT_COLOR_MAP[ev] ?? "#7a7a7a",
    }));
  } catch (err) {
    console.error("Error cargando datos de observaciones:", err);
    return [];
  }
}

/**
 * Filtra activos por tipo y búsqueda (client-side)
 */
export function filterAssets(assets: Asset[], tipos: string[], search: string): Asset[] {
  return assets.filter((a) => {
    const okTipo = tipos.length === 0 ? true : tipos.includes(a.tipo);
    const q = search.trim().toLowerCase();
    const okSearch = !q
      ? true
      : (a.nombre?.toLowerCase().includes(q) ||
          a.codigoServicio?.toLowerCase().includes(q) ||
          a.ubicacion?.toLowerCase().includes(q));
    return okTipo && okSearch;
  });
}

/**
 * Obtiene observaciones para un tipo de evento específico
 */
export async function getObservacionesPorTipoEvento(
  tipoEvento: string,
  pasaFiltroObservacion: (e: any, autor: string, desde: string, hasta: string, eventos: string[], incluirSis: boolean) => boolean,
  obsAutor: string,
  obsDesde: string,
  obsHasta: string,
  incluirSis: boolean
): Promise<
  Array<{
    activo: string;
    tipo: string;
    codigo: string;
    fecha: string;
    autor: string;
    evento: string;
    descripcion: string;
    campo: string;
    anterior: string;
    nuevo: string;
  }>
> {
  const resp = await getAssets({ limit: 100, page: 1 });
  const items: Asset[] = resp.assets || [];

  const detalles = await Promise.all(items.map((a) => getAssetById(a.id).catch(() => null)));
  const activosDetallados = detalles.filter((d): d is Asset => !!d);

  const incluirSisAuto =
    incluirSis || tipoEvento === "CAMBIO_CAMPO" || tipoEvento === "IMPORTACION";

  const rows: Array<{
    activo: string;
    tipo: string;
    codigo: string;
    fecha: string;
    autor: string;
    evento: string;
    descripcion: string;
    campo: string;
    anterior: string;
    nuevo: string;
  }> = [];

  for (const a of activosDetallados) {
    const bit = (a as any).bitacora ?? [];
    for (const e of bit) {
      if (e?.tipoEvento !== tipoEvento) continue;
      if (!pasaFiltroObservacion(e, obsAutor, obsDesde, obsHasta, [], incluirSisAuto)) continue;

      rows.push({
        activo: a.nombre ?? "—",
        tipo: a.tipo,
        codigo: a.codigoServicio ?? "—",
        fecha: e.creadoEn ? new Date(e.creadoEn).toLocaleString("es-CO") : "—",
        autor: e.autor ?? "—",
        evento: e.tipoEvento ?? "—",
        descripcion: e.descripcion ?? "",
        campo: e.campoModificado ?? "",
        anterior: e.valorAnterior ?? "",
        nuevo: e.valorNuevo ?? "",
      });
    }
  }

  return rows;
}
