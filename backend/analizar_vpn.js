const XLSX = require('xlsx');

const filePath = 'C:\\Users\\p_scorrea\\OneDrive - Fiduprevisora S.A\\Escritorio\\Archivos\\Export_VPN_S2S_Fidu.xlsx';

try {
  const wb = XLSX.readFile(filePath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(ws);

  console.log(`\n📊 Total de filas: ${data.length}\n`);

  // Agrupar por IP
  const porIp = {};
  data.forEach(row => {
    const nombre = row['Nombre de la VPN'] || 'SIN NOMBRE';
    const ip = row['Conexión'] || 'N/A';
    if (!porIp[ip]) porIp[ip] = [];
    porIp[ip].push(nombre);
  });

  console.log('🔍 AGRUPACIONES POR IP (conexión):\n');
  const ipsOrdenadas = Object.keys(porIp).sort();
  ipsOrdenadas.forEach(ip => {
    const nombres = porIp[ip];
    console.log(`IP: ${ip} → ${nombres.length} registros`);
    nombres.slice(0, 4).forEach(n => console.log(`   ✓ ${n}`));
    if (nombres.length > 4) console.log(`   ... y ${nombres.length - 4} más\n`);
    else console.log('');
  });

  console.log(`\n📈 RESUMEN:`);
  console.log(`   • IPs únicas: ${ipsOrdenadas.length}`);
  console.log(`   • Total registros: ${data.length}`);
  console.log(`   • Promedio registros/IP: ${(data.length / ipsOrdenadas.length).toFixed(1)}`);

} catch (err) {
  console.error('❌ Error:', err.message);
}
