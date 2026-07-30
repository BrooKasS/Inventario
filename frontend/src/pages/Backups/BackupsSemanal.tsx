import SimpleBackupReportPage from "./SimpleBackupReportPage";

export default function BackupsSemanal() {
  return (
    <SimpleBackupReportPage
      tipo="semanal"
      titulo="Backup Semanal"
      icono="📆"
      descripcion="Informe semanal de backups Veeam — rango por defecto: sábado anterior a hoy."
    />
  );
}
