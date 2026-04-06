/**
 * useDashboardFilters.ts
 * CORREGIDO:
 * - CAMBIO_CAMPO se excluye por defecto a menos que esté en eventosSel
 * - Deshabilitar/Habilitar (tipoEvento NOTA con autor = usuario logueado) SÍ aparece
 * - incluirSistema controla si se muestran entradas con autor "Sistema"
 */
import { useCallback } from "react";

export function useDashboardFilters() {

  /**
   * Determina si una entrada de bitácora pasa los filtros activos.
   *
   * Reglas:
   * 1. Si incluirSistema=false → excluir entradas con autor "Sistema"
   * 2. Si eventosSel tiene elementos → solo incluir esos tipos de evento
   *    EXCEPCIÓN: CAMBIO_CAMPO nunca se incluye a menos que esté
   *    explícitamente en eventosSel
   * 3. Filtros de autor, desde, hasta — aplican siempre
   */
  const pasaFiltroObservacion = useCallback((
    e: any,
    autor: string,
    desde: string,
    hasta: string,
    eventosSel: string[],
    incluirSistema: boolean
  ): boolean => {

    // 1. Excluir autor "Sistema" si no se quiere incluir
    if (!incluirSistema && e.autor === "Sistema") return false;

    // 2. CAMBIO_CAMPO: excluir SIEMPRE a menos que esté explícitamente seleccionado
    if (e.tipoEvento === "CAMBIO_CAMPO") {
      if (!eventosSel.includes("CAMBIO_CAMPO")) return false;
    }

    // 3. Si hay eventos seleccionados, filtrar por ellos
    if (eventosSel.length > 0 && !eventosSel.includes(e.tipoEvento)) return false;

    // 4. Filtro por autor (parcial, case-insensitive)
    if (autor && !e.autor.toLowerCase().includes(autor.toLowerCase())) return false;

    // 5. Filtro por rango de fechas
    const fecha = new Date(e.creadoEn);
    if (desde) {
      const d = new Date(desde);
      d.setHours(0, 0, 0, 0);
      if (fecha < d) return false;
    }
    if (hasta) {
      const h = new Date(hasta);
      h.setHours(23, 59, 59, 999);
      if (fecha > h) return false;
    }

    return true;
  }, []);

  return { pasaFiltroObservacion };
}
