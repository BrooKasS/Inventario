import { useState, useEffect } from "react";
import type { StatsResponse, Asset } from "../../../types";
import { getStats, getAssets } from "../../../api/client";
import { DEFAULT_RECENT_LIMIT } from "../constants";

export function useDashboardData() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [recent, setRecent] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [statsData, recentData] = await Promise.all([
          getStats(),
          getAssets({ limit: DEFAULT_RECENT_LIMIT, page: 1 }),
        ]);
        setStats(statsData);
        setRecent(recentData.assets || []);
      } catch (err) {
        console.error("Error cargando dashboard:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { stats, recent, loading };
}
