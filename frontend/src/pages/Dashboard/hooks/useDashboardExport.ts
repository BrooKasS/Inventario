import { useState } from "react";
import type { Asset } from "../../../types";
import { getAssets, getAssetById } from "../../../api/client";
import {
  exportarActivosExcel,
  exportarActivosPDF,
  exportarObservacionesExcel,
  exportarObservacionesPDF,
  type ObservacionRow,
} from "../../../utils/exporters";
import { TIPO_LABEL_SINGULAR, EVENTO_LABEL_MAP } from "../constants";

interface UseDashboardExportOptions {
  pasaFiltroObservacion: (e: any, autor: string, desde: string, hasta: string, eventos: string[], incluirSis: boolean) => boolean;
}

export function useDashboardExport({ pasaFiltroObservacion }: UseDashboardExportOptions) {
  const [exporting, setExporting] = useState<"excel" | "pdf" | null>(null);

  /**
   * Obtiene todos los activos con paginación
   */
  const fetchAllActivos = async (tipos: string[], search: string): Promise<Asset[]> => {
    const limit = 500;
    let page = 1;
    let out: Asset[] = [];

    for (let i = 0; i < 20; i++) {
      const resp = await getAssets({ limit, page, tipos, search });
      const items = resp.assets || [];
      out = out.concat(items);
      const total = resp.total || out.length;
      if (out.length >= total || items.length === 0) break;
      page++;
    }

    // Filtro client-side defensivo
    const q = search.trim().toLowerCase();
    return out.filter((a) => {
      const okTipo = tipos.length === 0 ? true : tipos.includes(a.tipo);
      const okSearch = !q
        ? true
        : (a.nombre?.toLowerCase().includes(q) ||
            a.codigoServicio?.toLowerCase().includes(q) ||
            a.ubicacion?.toLowerCase().includes(q));
      return okTipo && okSearch;
    });
  };

  /**
   * Obtiene los activos para exportar (según selección o filtros)
   */
  const activosParaExportar = async (tiposSel: string[], buscar: string, seleccion: Set<string>): Promise<Asset[]> => {
    if (seleccion.size === 0) {
      return await fetchAllActivos(tiposSel, buscar);
    }
    const todos = await fetchAllActivos(tiposSel, buscar);
    const ids = new Set(seleccion);
    return todos.filter((a) => ids.has(a.id));
  };

  /**
   * Prepara filas de observaciones para exportación
   */
  const prepararObservacionesRows = async (
    tiposSel: string[],
    buscar: string,
    seleccion: Set<string>,
    obsAutor: string,
    obsDesde: string,
    obsHasta: string,
    eventosSel: string[],
    incluirSistema: boolean
  ): Promise<ObservacionRow[]> => {
    const base = await activosParaExportar(tiposSel, buscar, seleccion);

    const detalles = await Promise.all(base.map((a) => getAssetById(a.id).catch(() => null)));
    const activosDetallados = detalles.filter((d): d is Asset => !!d);

    const rows: ObservacionRow[] = [];
    for (const a of activosDetallados) {
      const bit = (a as any).bitacora ?? [];
      for (const e of bit) {
        if (!pasaFiltroObservacion(e, obsAutor, obsDesde, obsHasta, eventosSel, incluirSistema)) continue;
        rows.push({
          Activo: a.nombre ?? "—",
          Tipo: TIPO_LABEL_SINGULAR[a.tipo] ?? a.tipo,
          Código: a.codigoServicio ?? "—",
          Ubicación: a.ubicacion ?? "—",
          Fecha: new Date(e.creadoEn).toLocaleString("es-CO"),
          Autor: e.autor,
          "Tipo de evento": EVENTO_LABEL_MAP[e.tipoEvento] ?? e.tipoEvento,
          Descripción: e.descripcion,
          "Campo modificado": e.campoModificado ?? "",
          "Valor anterior": e.valorAnterior ?? "",
          "Valor nuevo": e.valorNuevo ?? "",
        });
      }
    }
    return rows;
  };

  /**
   * Exporta activos a Excel
   */
  const handleExportActvosExcel = async (
    tiposSel: string[],
    buscar: string,
    seleccion: Set<string>
  ): Promise<void> => {
    try {
      setExporting("excel");
      const nombre = tiposSel.length === 0 ? "Todos" : tiposSel.join("_");
      const data = await activosParaExportar(tiposSel, buscar, seleccion);

      if (data.length === 0) {
        alert("No hay activos para exportar con los filtros/selección actuales.");
        return;
      }
      await exportarActivosExcel(data, nombre);
    } catch (e) {
      console.error("Error exportando Excel:", e);
      alert("Error exportando a Excel");
    } finally {
      setExporting(null);
    }
  };

  /**
   * Exporta activos a PDF
   */
  const handleExportActivosPDF = async (
    tiposSel: string[],
    buscar: string,
    seleccion: Set<string>
  ): Promise<void> => {
    try {
      setExporting("pdf");
      const nombre = tiposSel.length === 0 ? "Todos" : tiposSel.join("_");
      const data = await activosParaExportar(tiposSel, buscar, seleccion);

      if (data.length === 0) {
        alert("No hay activos para exportar con los filtros/selección actuales.");
        return;
      }
      await exportarActivosPDF(data, nombre);
    } catch (e) {
      console.error("Error exportando PDF:", e);
      alert("Error exportando a PDF");
    } finally {
      setExporting(null);
    }
  };

  /**
   * Exporta observaciones a Excel
   */
  const handleExportObservacionesExcel = async (
    tiposSel: string[],
    buscar: string,
    seleccion: Set<string>,
    obsAutor: string,
    obsDesde: string,
    obsHasta: string,
    eventosSel: string[],
    incluirSistema: boolean
  ): Promise<void> => {
    try {
      setExporting("excel");
      const nombre = tiposSel.length === 0 ? "Todos" : tiposSel.join("_");
      const rows = await prepararObservacionesRows(
        tiposSel,
        buscar,
        seleccion,
        obsAutor,
        obsDesde,
        obsHasta,
        eventosSel,
        incluirSistema
      );

      if (rows.length === 0) {
        alert("No hay observaciones con los filtros/selección actuales.");
        return;
      }
      await exportarObservacionesExcel(rows, nombre);
    } catch (e) {
      console.error("Error exportando Excel:", e);
      alert("Error exportando a Excel");
    } finally {
      setExporting(null);
    }
  };

  /**
   * Exporta observaciones a PDF
   */
  const handleExportObservacionesPDF = async (
    tiposSel: string[],
    buscar: string,
    seleccion: Set<string>,
    obsAutor: string,
    obsDesde: string,
    obsHasta: string,
    eventosSel: string[],
    incluirSistema: boolean
  ): Promise<void> => {
    try {
      setExporting("pdf");
      const nombre = tiposSel.length === 0 ? "Todos" : tiposSel.join("_");
      const rows = await prepararObservacionesRows(
        tiposSel,
        buscar,
        seleccion,
        obsAutor,
        obsDesde,
        obsHasta,
        eventosSel,
        incluirSistema
      );

      if (rows.length === 0) {
        alert("No hay observaciones con los filtros/selección actuales.");
        return;
      }
      await exportarObservacionesPDF(rows, nombre);
    } catch (e) {
      console.error("Error exportando PDF:", e);
      alert("Error exportando a PDF");
    } finally {
      setExporting(null);
    }
  };

  return {
    exporting,
    handleExportActvosExcel,
    handleExportActivosPDF,
    handleExportObservacionesExcel,
    handleExportObservacionesPDF,
  };
}
