import { useQuery } from "@tanstack/react-query";
import api from "../../../../lib/axios";

export interface HealthStatus {
  status: "healthy" | "unhealthy" | "degraded";
  latencyMs?: number;
  error?: string;
}

export interface SystemHealthReport {
  overall: "healthy" | "unhealthy" | "degraded";
  services: {
    mongodb: HealthStatus;
    redis: HealthStatus;
    qdrant: HealthStatus;
    embedding: HealthStatus;
    email: HealthStatus;
    storage: HealthStatus;
  };
}

export function useGetSystemHealth() {
  return useQuery<SystemHealthReport>({
    queryKey: ["systemHealth"],
    queryFn: async () => {
      const response = await api.get("/admin/dashboard/health");
      return response.data.data;
    },
    refetchInterval: 30000, 
  });
}
