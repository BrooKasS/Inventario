export function useDashboardFilters() {
  const esSistema = (autor?: string) => {
    return (autor ?? "").trim().toLowerCase() === "sistema";
  };

  const tieneCampoModificado = (e: any): boolean => {
    const campo = (e?.campoModificado ?? "").toString().trim();
    return campo.length > 0;
  };

  const pasaFiltroObservacion = (
    e: any,
    autor: string,
    desde: string,
    hasta: string,
    eventos: string[],
    incluirSis: boolean
  ): boolean => {
    if (esSistema(e.autor)) {
      if (!incluirSis) return false;
      if (!tieneCampoModificado(e)) return false;
    }

    if (eventos.length > 0 && !eventos.includes(e.tipoEvento)) return false;
    if (autor && !e.autor?.toLowerCase().includes(autor.toLowerCase())) return false;

    const f = new Date(e.creadoEn);
    if (desde) {
      const d = new Date(desde);
      d.setHours(0, 0, 0, 0);
      if (f < d) return false;
    }
    if (hasta) {
      const h = new Date(hasta);
      h.setHours(23, 59, 59, 999);
      if (f > h) return false;
    }

    return true;
  };

  return { esSistema, tieneCampoModificado, pasaFiltroObservacion };
}
