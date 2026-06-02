SERVIDOR NODE.JS (ya corriendo)
│
├── 3:00am → node-cron dispara
│       │
│       ▼
│   ocs-sync.service.ts
│       │
│       ├── 1. Query MySQL OCS (OcsDataSource ya conectado)
│       │      SELECT h.ID, h.NAME, n.IPADDRESS, s.NAME, s.VERSION
│       │      FROM hardware h
│       │      LEFT JOIN networks n ON h.ID = n.HARDWARE_ID
│       │      LEFT JOIN softwares s ON h.ID = s.HARDWARE_ID
│       │
│       ├── 2. Para cada hardware encontrado:
│       │      Query Oracle → busca IP en SERVIDORES
│       │      WHERE ipInterna=? OR ipGestion=? OR ipServicio=?
│       │
│       ├── 3. Si hay match:
│       │      INSERT en OCS_SERVER_MAPPING
│       │      INSERT en SOFTWARE_INSTALADO (bulk)
│       │
│       └── 4. Log resultado: {mapped: 72, unmapped: 12}
│
├── Usuario abre detalle de servidor en UI
│       │
│       ▼
│   GET /assets/:id/applications
│       │
│       └── Query Oracle → SOFTWARE_INSTALADO where asset_id = ?
│              Respuesta instantánea, sin tocar MySQL ni SSH
│