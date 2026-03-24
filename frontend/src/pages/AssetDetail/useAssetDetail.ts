import { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import {
  getAssetById,
  updateAsset,
  addObservacion,
} from "../../api/client";
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
  obsAutor: string;
  setObsAutor: (v: string) => void;
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
  handleChange: (section: string | null, field: string, val: string) => void;
  handleSave: () => Promise<void>;
  handleAddObs: () => Promise<void>;
  handleExportExcel: () => Promise<void>;
  handleExportPDF: () => Promise<void>;
  limpiarFiltros: () => void;
}

export function useAssetDetail(): UseAssetDetailReturn {
  const { id } = useParams<{ id: string }>();

  /* ── asset state ── */
  const [asset, setAsset] = useState<Asset | null>(null);
  const [editing, setEditing] = useState(false);
  const [changes, setChanges] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);

  /* ── nueva observación ── */
  const [showObs, setShowObs] = useState(false);
  const [obsAutor, setObsAutor] = useState("");
  const [obsTipo, setObsTipo] = useState<TipoEvento>("NOTA");
  const [obsDesc, setObsDesc] = useState("");
  const [obsLoading, setObsLoading] = useState(false);

  /* ── filtros de bitácora ── */
  const [fTipo, setFTipo] = useState<string>("");
  const [fAutor, setFAutor] = useState("");
  const [fDesde, setFDesde] = useState("");
  const [fHasta, setFHasta] = useState("");

  /* ── export loading ── */
  const [exporting, setExporting] = useState<"excel" | "pdf" | null>(null);

  const load = () => {
    if (id) getAssetById(id).then(setAsset);
  };

  useEffect(() => {
    load();
  }, [id]);

  /* ── bitácora filtrada (memo para no recalcular en cada render) ── */
  const bitacoraFiltrada = useMemo(() => {
    const entries = asset?.bitacora ?? [];
    return entries.filter((e) => {
      /* tipo */
      if (fTipo && e.tipoEvento !== fTipo) return false;
      /* autor (case-insensitive, parcial) */
      if (fAutor && !e.autor.toLowerCase().includes(fAutor.toLowerCase()))
        return false;
      /* rango de fechas */
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

  /* ── autores únicos para el datalist (memoizado) ── */
  const autoresUnicos = useMemo(
    () =>
      Array.from(new Set((asset?.bitacora ?? []).map((e) => e.autor))).sort(),
    [asset?.bitacora]
  );

  const limpiarFiltros = () => {
    setFTipo("");
    setFAutor("");
    setFDesde("");
    setFHasta("");
  };

  /* ── handlers ── */
  const handleChange = (section: string | null, field: string, val: string) => {
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
    setSaving(true);
    try {
      await updateAsset(id, changes);
      setEditing(false);
      setChanges({});
      load();
    } finally {
      setSaving(false);
    }
  };

  const handleAddObs = async () => {
    if (!id || !obsAutor || !obsDesc) return;
    setObsLoading(true);
    try {
      await addObservacion(id, {
        autor: obsAutor,
        tipoEvento: obsTipo,
        descripcion: obsDesc,
      });
      setShowObs(false);
      setObsAutor("");
      setObsDesc("");
      setObsTipo("NOTA");
      load();
    } finally {
      setObsLoading(false);
    }
  };

  /* ── export handlers ── */
  const handleExportExcel = async () => {
    if (!asset) return;
    setExporting("excel");
    try {
      await exportarExcel(bitacoraFiltrada, asset.nombre ?? "Activo");
    } catch (err) {
      console.error("Error exportando Excel:", err);
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
    } catch (err) {
      console.error("Error exportando PDF:", err);
      alert("Error al generar PDF");
    } finally {
      setExporting(null);
    }
  };

  return {
    asset,
    editing,
    setEditing,
    changes,
    saving,
    showObs,
    setShowObs,
    obsAutor,
    setObsAutor,
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
