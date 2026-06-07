import { Request, Response } from "express";
import { AppDataSource } from "../../config/database";
import { MobileStaging } from "../../entities/MobileStaging.entity";
import { ILike } from "typeorm";

const repo = () => AppDataSource.getRepository(MobileStaging);

// POST /api/mobile-staging — guardar un registro pre-escaneado
export const crearStaging = async (req: Request, res: Response) => {
  try {
    const { serial, imei1, imei2 } = req.body;

    if (!serial || serial.trim() === "") {
      return res.status(400).json({ message: "El serial es obligatorio" });
    }

    const existe = await repo().findOne({ where: { serial: serial.trim().toUpperCase() } });
    if (existe) {
      return res.status(409).json({ message: "Este serial ya está en staging" });
    }

    const nuevo = repo().create({
      serial: serial.trim().toUpperCase(),
      imei1: imei1?.trim() || null,
      imei2: imei2?.trim() || null,
      usado: "false",
    });

    await repo().save(nuevo);
    return res.status(201).json(nuevo);
  } catch (err) {
    console.error("Error crearStaging:", err);
    return res.status(500).json({ message: "Error interno" });
  }
};

// GET /api/mobile-staging — listar todos
export const listarStaging = async (_req: Request, res: Response) => {
  try {
    const registros = await repo().find({ order: { creadoEn: "DESC" } });
    return res.json(registros);
  } catch (err) {
    return res.status(500).json({ message: "Error interno" });
  }
};

// GET /api/mobile-staging/search?q=xxx — autocompletado en Create
export const buscarStaging = async (req: Request, res: Response) => {
  try {
    const q = (req.query.q as string) || "";
    if (q.length < 2) return res.json([]);

    const resultados = await repo().find({
      where: { serial: ILike(`%${q}%`) },
      take: 8,
      order: { serial: "ASC" },
    });

    return res.json(resultados);
  } catch (err) {
    return res.status(500).json({ message: "Error interno" });
  }
};

// GET /api/mobile-staging/stats — contadores
export const statsStaging = async (_req: Request, res: Response) => {
  try {
    const total = await repo().count();
    const usados = await repo().count({ where: { usado: "true" } });
    return res.json({ total, usados, pendientes: total - usados });
  } catch (err) {
    return res.status(500).json({ message: "Error interno" });
  }
};

// PATCH /api/mobile-staging/:serial/usado — marcar como usado al crear activo
export const marcarUsado = async (req: Request, res: Response) => {
  try {
    const { serial } = req.params as { serial: string };
    const registro = await repo().findOne({ where: { serial: serial.toUpperCase() } });
    if (!registro) return res.status(404).json({ message: "No encontrado" });

    registro.usado = "true";
    await repo().save(registro);
    return res.json(registro);
  } catch (err) {
    return res.status(500).json({ message: "Error interno" });
  }
};

// DELETE /api/mobile-staging/:id — eliminar registro mal escaneado
export const eliminarStaging = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const registro = await repo().findOne({ where: { id } });
    if (!registro) return res.status(404).json({ message: "No encontrado" });
    if (registro.usado === "true") {
      return res.status(400).json({ message: "No se puede eliminar, ya fue registrado como activo" });
    }
    await repo().remove(registro);
    return res.json({ message: "Eliminado" });
  } catch (err) {
    return res.status(500).json({ message: "Error interno" });
  }
};