"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const importExcel_1 = require("./importer/importExcel");
async function main() {
    await (0, importExcel_1.importExcel)("Inventario de Infraestructura - 2026.xlsx");
}
main();
