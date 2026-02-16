import { importExcel } from "./importer/importExcel";

async function main() {
  await importExcel("Inventario de Infraestructura - 2026.xlsx");
}

main();
