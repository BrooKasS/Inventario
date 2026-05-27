import { OcsDataSource } from "../../config/ocs.database";

export class OcsService {
  async getInventario() {
    const result = await OcsDataSource.query(`
      SELECT
        h.NAME,                
        s.NAME AS SOFTWARE,    
        s.VERSION,
        n.IPADDRESS
      FROM hardware h
      LEFT JOIN softwares s ON h.ID = s.HARDWARE_ID
      LEFT JOIN networks n ON h.ID = n.HARDWARE_ID
      WHERE h.DEVICEID IS NOT NULL
    `);

    return result;
  }
}

export const ocsService = new OcsService();