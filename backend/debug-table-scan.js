// Script temporal de diagnostico. Uso:
//   node debug-table-scan.js "ruta\al\archivo.html"
const fs = require("fs");
const cheerio = require("cheerio");

const filePath = process.argv[2];
if (!filePath) {
  console.error("Uso: node debug-table-scan.js <ruta-al-html>");
  process.exit(1);
}

const html = fs.readFileSync(filePath, "utf-8");

const openTags = (html.match(/<table\b/gi) || []).length;
const closeTags = (html.match(/<\/table\s*>/gi) || []).length;
console.log(`Ocurrencias en texto crudo: <table = ${openTags} | </table> = ${closeTags}`);

const machineNameIdx = [];
let searchFrom = 0;
while (true) {
  const idx = html.indexOf("Machine Name", searchFrom);
  if (idx === -1) break;
  machineNameIdx.push(idx);
  searchFrom = idx + 1;
}
console.log(`"Machine Name" aparece ${machineNameIdx.length} veces en el texto crudo.`);
if (machineNameIdx.length > 0) {
  const firstIdx = machineNameIdx[0];
  console.log(`Primera aparicion en offset ${firstIdx}, contexto:`);
  console.log(JSON.stringify(html.slice(Math.max(0, firstIdx - 300), firstIdx + 300)));
}

const $ = cheerio.load(html);
const tables = $("table");
console.log(`\ncheerio encontro ${tables.length} <table> (vs ${openTags} en texto crudo).`);

tables.each((i, table) => {
  const $table = $(table);
  const rows = $table.find("tr");
  const headerCells = $(rows[0]).find("td");
  const headerTh = $(rows[0]).find("th");
  const texts = headerCells.toArray().map((td) => $(td).text().replace(/\s+/g, " ").trim());
  const hasMachineName = $table.text().includes("Machine Name");
  console.log(
    `Tabla ${i}: ${rows.length} filas | ${headerCells.length} td / ${headerTh.length} th en fila0 | contieneMachineName=${hasMachineName} | header=[${texts.join(" | ")}]`
  );
});
