import SimpleBackupReportPage from "./SimpleBackupReportPage";

export default function BackupsDiario() {
  return (
    <SimpleBackupReportPage
      tipo="diario"
      titulo="Backup Diario"
      icono="📅"
      descripcion="Informe diario de backups Veeam — descarga, procesa y envía el reporte del día."
    />
  );
}
