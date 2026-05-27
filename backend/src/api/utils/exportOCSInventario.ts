import * as XLSX from "xlsx";
import fs from "fs";
import path from "path";
import os from "os"; 

export const generarExcelOCS = (data: any[]) => {
  
  const outputdir = path.join(os.homedir(), "Downloads");

  if (!fs.existsSync(outputdir)) {
    fs.mkdirSync(outputdir, { recursive: true });
  }

  // Agrupa por nombre del equipo 
  const grupos = data.reduce((acc: any, item: any) => {
    const nombre = (item.NAME || "SIN_NOMBRE")
      .replace(/[\\/:*?"<>|]/g, "_");

    if (!acc[nombre]) acc[nombre] = [];
    acc[nombre].push(item);

    return acc;
  }, {});

  const archivosGenerados: string[] = [];

  for (const nombre in grupos) {

    const datosFiltrados = grupos[nombre].map((item: any) => ({
      SOFTWARE: item.SOFTWARE,
      VERSION: item.VERSION,
    }));

    const worksheet = XLSX.utils.json_to_sheet(datosFiltrados);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Software");

 
    const filePath = path.join(outputdir, `${nombre}.xlsx`);

    XLSX.writeFile(workbook, filePath);

    archivosGenerados.push(filePath);
  }

  return archivosGenerados;
};
``