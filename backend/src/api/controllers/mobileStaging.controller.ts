import { Request, Response } from "express";
import { AppDataSource } from "../../config/database";
import { MobileStaging } from "../../entities/MobileStaging.entity";
import { ILike } from "typeorm";

const repo = () => AppDataSource.getRepository(MobileStaging);

export const crearStaging = async (req: Request, res: Response) => {
  try {
    const { serial, imei1, imei2, marca, modelo } = req.body;
    if (!serial || serial.trim() === "") {
      return res.status(400).json({ message: "El serial es obligatorio" });
    }
    const existe = await repo().findOne({ where: { serial: serial.trim().toUpperCase() } });
    if (existe) {
      return res.status(409).json({ message: "Este serial ya está en staging" });
    }
    const nuevo = repo().create({
      serial:  serial.trim().toUpperCase(),
      imei1:   imei1?.trim()  || null,
      imei2:   imei2?.trim()  || null,
      marca:   marca?.trim()  || null,
      modelo:  modelo?.trim() || null,
      usado:   "false",
    });
    await repo().save(nuevo);
    return res.status(201).json(nuevo);
  } catch (err) {
    console.error("Error crearStaging:", err);
    return res.status(500).json({ message: "Error interno" });
  }
};

export const listarStaging = async (_req: Request, res: Response) => {
  try {
    const registros = await repo().find({ order: { creadoEn: "DESC" } });
    return res.json(registros);
  } catch (err) {
    return res.status(500).json({ message: "Error interno" });
  }
};

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

export const statsStaging = async (_req: Request, res: Response) => {
  try {
    const total   = await repo().count();
    const usados  = await repo().count({ where: { usado: "true" } });
    return res.json({ total, usados, pendientes: total - usados });
  } catch (err) {
    return res.status(500).json({ message: "Error interno" });
  }
};

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
//2 métodos que se agregan para completar crud del mobilestaging

export const forzarEliminarStaging = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const registro = await repo().findOne({ where: { id } });
    if (!registro) return res.status(404).json({ message: "No encontrado" });
    await repo().remove(registro);
    return res.json({ message: "Eliminado forzosamente" });
  } catch (err) {
    console.error("Error forzarEliminarStaging:", err);
    return res.status(500).json({ message: "Error interno" });
  }
};

// PATCH /api/mobile-staging/:id — editar campos del registro
export const editarStaging = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const { serial, imei1, marca, modelo } = req.body;
    const registro = await repo().findOne({ where: { id } });
    if (!registro) return res.status(404).json({ message: "No encontrado" });

    // Si cambia el serial, verificar que no exista ya
    if (serial && serial.trim().toUpperCase() !== registro.serial) {
      const existe = await repo().findOne({
        where: { serial: serial.trim().toUpperCase() },
      });
      if (existe) {
        return res.status(409).json({ message: "Ese serial ya existe en staging" });
      }
      registro.serial = serial.trim().toUpperCase();
    }

    if (imei1  !== undefined) registro.imei1  = imei1?.trim()  || null;
    if (marca  !== undefined) registro.marca  = marca?.trim()  || null;
    if (modelo !== undefined) registro.modelo = modelo?.trim() || null;

    await repo().save(registro);
    return res.json(registro);
  } catch (err) {
    console.error("Error editarStaging:", err);
    return res.status(500).json({ message: "Error interno" });
  }
};
export const obtenerOpciones = async (req: Request, res: Response) => {
  const repo = AppDataSource.getRepository(MobileStaging); // ajusta el nombre de tu repo/import si es distinto al resto del archivo
  const rows = await repo.find({ select: ["marca", "modelo"] });

  const marcas = Array.from(new Set(
    rows.map(r => r.marca).filter((m): m is string => !!m && m.trim() !== "")
  ));
  const modelos = Array.from(new Set(
    rows.map(r => r.modelo).filter((m): m is string => !!m && m.trim() !== "")
  ));

  res.json({ marcas, modelos });
};