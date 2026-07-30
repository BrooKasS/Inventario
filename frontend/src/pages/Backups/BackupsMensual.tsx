import SimpleBackupReportPage from "./SimpleBackupReportPage";

export default function BackupsMensual() {
  return (
    <SimpleBackupReportPage
      tipo="mensual"
      titulo="Backup Mensual"
      icono="🗓"
      descripcion="Informe mensual de backups Veeam — rango por defecto: desde el día 1 del mes hasta hoy."
    />
  );
}
