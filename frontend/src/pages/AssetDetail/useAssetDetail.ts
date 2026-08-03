import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams } from "react-router-dom";
import {
  getAssetById,
  updateAsset,
  addObservacion,
} from "../../api/client";
import { getUsuario } from "../../api/auth";
import type { Asset, BitacoraEntry, TipoEvento } from "../../types";
import { exportarExcel, exportarPDF } from "./exportUtils";

export interface UseAssetDetailReturn {
  asset: Asset | null;
  editing: boolean;
  setEditing: (v: boolean) => void;
  changes: Record<string, any>;
  saving: boolean;
  showObs: boolean;
  setShowObs: (v: boolean) => void;
  obsTipo: TipoEvento;
  setObsTipo: (v: TipoEvento) => void;
  obsDesc: string;
  setObsDesc: (v: string) => void;
  obsLoading: boolean;
  fTipo: string;
  setFTipo: (v: string) => void;
  fAutor: string;
  setFAutor: (v: string) => void;
  fDesde: string;
  setFDesde: (v: string) => void;
  fHasta: string;
  setFHasta: (v: string) => void;
  exporting: "excel" | "pdf" | null;
  bitacoraFiltrada: BitacoraEntry[];
  hayFiltros: boolean;
  autoresUnicos: string[];
  handleChange: (section: string | null, field: string, val: any) => void;
  handleSave: () => Promise<void>;
  handleAddObs: () => Promise<void>;
  handleExportExcel: () => Promise<void>;
  handleExportPDF: () => Promise<void>;
  limpiarFiltros: () => void;
}

function getApiErrorMessage(error: any, fallback: string) {
  return error?.response?.data?.error || error?.response?.data?.message || error?.message || fallback;
}

function mergeAssetWithChanges(asset: Asset, changes: Record<string, any>): Asset {
  return {
    ...asset,
    ...changes,
    servidor: asset.servidor || changes.servidor ? { ...(asset.servidor ?? {}), ...(changes.servidor ?? {}) } as any : asset.servidor,
    red: asset.red || changes.red ? { ...(asset.red ?? {}), ...(changes.red ?? {}) } as any : asset.red,
    ups: asset.ups || changes.ups ? { ...(asset.ups ?? {}), ...(changes.ups ?? {}) } as any : asset.ups,
    baseDatos: asset.baseDatos || changes.baseDatos ? { ...(asset.baseDatos ?? {}), ...(changes.baseDatos ?? {}) } as any : asset.baseDatos,
    vpn: asset.vpn || changes.vpn ? { ...(asset.vpn ?? {}), ...(changes.vpn ?? {}) } as any : asset.vpn,
    movil: asset.movil || changes.movil ? { ...(asset.movil ?? {}), ...(changes.movil ?? {}) } as any : asset.movil,
    certificadoSsl: asset.certificadoSsl || changes.certificadoSsl ? { ...(asset.certificadoSsl ?? {}), ...(changes.certificadoSsl ?? {}) } as any : asset.certificadoSsl,
  };
}

export function useAssetDetail(): UseAssetDetailReturn {
  const { id } = useParams<{ id: string }>();

  const [asset, setAsset] = useState<Asset | null>(null);
  const [editing, setEditingState] = useState(false);
  const [changes, setChanges] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);

  const [showObs, setShowObs] = useState(false);
  const [obsTipo, setObsTipo] = useState<TipoEvento>("NOTA");
  const [obsDesc, setObsDesc] = useState("");
  const [obsLoading, setObsLoading] = useState(false);

  const [fTipo, setFTipo] = useState<string>("");
  const [fAutor, setFAutor] = useState("");
  const [fDesde, setFDesde] = useState("");
  const [fHasta, setFHasta] = useState("");

  const [exporting, setExporting] = useState<"excel" | "pdf" | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const data = await getAssetById(id);
      setAsset(data);
    } catch (error) {
      console.error("Error cargando activo:", error);
      alert(getApiErrorMessage(error, "No se pudo cargar el activo"));
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const setEditing = (v: boolean) => {
    setEditingState(v);
    if (!v) setChanges({});
  };

  const visibleAsset = useMemo(() => {
    if (!asset) return null;
    return mergeAssetWithChanges(asset, changes);
  }, [asset, changes]);

  const bitacoraFiltrada = useMemo(() => {
    const entries = asset?.bitacora ?? [];
    return entries.filter((e) => {
      if (fTipo && e.tipoEvento !== fTipo) return false;
      if (fAutor && !e.autor.toLowerCase().includes(fAutor.toLowerCase())) return false;

      const fecha = new Date(e.creadoEn);
      if (fDesde) {
        const desde = new Date(fDesde);
        desde.setHours(0, 0, 0, 0);
        if (fecha < desde) return false;
      }
      if (fHasta) {
        const hasta = new Date(fHasta);
        hasta.setHours(23, 59, 59, 999);
        if (fecha > hasta) return false;
      }
      return true;
    });
  }, [asset?.bitacora, fTipo, fAutor, fDesde, fHasta]);

  const hayFiltros = !!(fTipo || fAutor || fDesde || fHasta);

  const autoresUnicos = useMemo(
    () => Array.from(new Set((asset?.bitacora ?? []).map((e) => e.autor))).sort(),
    [asset?.bitacora]
  );

  const limpiarFiltros = () => {
    setFTipo("");
    setFAutor("");
    setFDesde("");
    setFHasta("");
  };

  const handleChange = (section: string | null, field: string, val: any) => {
    if (section) {
      setChanges((prev) => ({
        ...prev,
        [section]: { ...(prev[section] || {}), [field]: val },
      }));
    } else {
      setChanges((prev) => ({ ...prev, [field]: val }));
    }
  };

  const handleSave = async () => {
    if (!id) return;

    if (Object.keys(changes).length === 0) {
      setEditing(false);
      return;
    }

    setSaving(true);
    try {
      const updated = await updateAsset(id, changes);
      setAsset(updated);
      setEditingState(false);
      setChanges({});
    } catch (error) {
      console.error("Error guardando activo:", error);
      alert(getApiErrorMessage(error, "No se pudo guardar el activo"));
    } finally {
      setSaving(false);
    }
  };

  const handleAddObs = async () => {
    if (!id || !obsDesc.trim()) return;

    setObsLoading(true);
    const autor = getUsuario() ?? "Sistema";
    try {
      await addObservacion(id, {
        autor,
        tipoEvento: obsTipo,
        descripcion: obsDesc.trim(),
      });
      setShowObs(false);
      setObsDesc("");
      setObsTipo("NOTA");
      await load();
    } catch (error) {
      console.error("Error agregando observacion:", error);
      alert(getApiErrorMessage(error, "No se pudo agregar la observacion"));
    } finally {
      setObsLoading(false);
    }
  };

  const handleExportExcel = async () => {
    if (!asset) return;
    setExporting("excel");
    try {
      await exportarExcel(bitacoraFiltrada, asset.nombre ?? "Activo");
    } catch (error) {
      console.error("Error exportando Excel:", error);
      alert("Error al generar Excel");
    } finally {
      setExporting(null);
    }
  };

  const handleExportPDF = async () => {
    if (!asset) return;
    setExporting("pdf");
    try {
      await exportarPDF(bitacoraFiltrada, asset);
    } catch (error) {
      console.error("Error exportando PDF:", error);
      alert("Error al generar PDF");
    } finally {
      setExporting(null);
    }
  };

  return {
    asset: visibleAsset,
    editing,
    setEditing,
    changes,
    saving,
    showObs,
    setShowObs,
    obsTipo,
    setObsTipo,
    obsDesc,
    setObsDesc,
    obsLoading,
    fTipo,
    setFTipo,
    fAutor,
    setFAutor,
    fDesde,
    setFDesde,
    fHasta,
    setFHasta,
    exporting,
    bitacoraFiltrada,
    hayFiltros,
    autoresUnicos,
    handleChange,
    handleSave,
    handleAddObs,
    handleExportExcel,
    handleExportPDF,
    limpiarFiltros,
  };
}
