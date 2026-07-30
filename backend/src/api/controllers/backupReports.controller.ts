import { Request, Response } from "express";
import { backupReportsService } from "../services/backupReports.service";

export class BackupReportsController {
  async listRuns(req: Request, res: Response) {
    const tipo = req.params.tipo as string;
    const runs = await backupReportsService.listRuns(tipo);
    res.json({ success: true, data: runs });
  }

  async getRun(req: Request, res: Response) {
    const tipo = req.params.tipo as string;
    const runId = req.params.runId as string;
    const run = await backupReportsService.getRun(tipo, runId);
    res.json({ success: true, data: run });
  }

  async downloadExcel(req: Request, res: Response) {
    const tipo = req.params.tipo as string;
    const runId = req.params.runId as string;
    const buffer = await backupReportsService.getRunExcelBuffer(tipo, runId);
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="Informe_Backup_${tipo}_${runId}.xlsx"`
    );
    res.send(buffer);
  }

  async createRun(req: Request, res: Response) {
    const tipo = req.params.tipo as string;
    const { fechaInicio, fechaFin } = req.body ?? {};
    const run = await backupReportsService.createRun(tipo, {
      fechaInicio,
      fechaFin,
      trigger: "manual",
    });
    res.status(201).json({ success: true, data: run });
  }

  async sendRun(req: Request, res: Response) {
    const tipo = req.params.tipo as string;
    const runId = req.params.runId as string;
    const { to, cc, asunto, mensaje } = req.body ?? {};
    const run = await backupReportsService.sendRun(tipo, runId, { to, cc, asunto, mensaje });
    res.json({ success: true, data: run, message: "Informe enviado correctamente." });
  }

  async deleteRun(req: Request, res: Response) {
    const tipo = req.params.tipo as string;
    const runId = req.params.runId as string;
    await backupReportsService.deleteRun(tipo, runId);
    res.json({ success: true, message: "Ejecución eliminada." });
  }
}

export const backupReportsController = new BackupReportsController();
