import { inject, injectable } from "tsyringe";
import mongoose from "mongoose";
import { qdrantClient } from "../../../../config/qdrant";
import { ICacheService } from "../../../common/ports/ICacheService";
import { IEmbeddingService } from "../../../common/ports/IEmbeddingService";
import { IEmailService } from "../../../common/ports/IEmailService";
import { IFileStorageService } from "../../../common/ports/IFileStorageService";

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

@injectable()
export class GetSystemHealth {
  constructor(
    @inject("ICacheService") private cacheService: ICacheService,
    @inject("IEmbeddingService") private embeddingService: IEmbeddingService,
    @inject("IEmailService") private emailService: IEmailService,
    @inject("IFileStorageService") private storageService: IFileStorageService
  ) {}

  async execute(): Promise<SystemHealthReport> {
    const services: any = {};

   
    services.mongodb = await this.checkService(async () => {
      const state = mongoose.connection.readyState;
      if (state !== 1) {
        throw new Error(`MongoDB connection state is not connected (state: ${state})`);
      }
      const db = mongoose.connection.db;
      if (!db) {
        throw new Error("MongoDB database instance is not initialized");
      }
      await db.admin().ping();
    });

  
    services.redis = await this.checkService(async () => {
      const ok = await this.cacheService.healthCheck();
      if (!ok) throw new Error("Redis ping returned negative or failed");
    });

    
    services.qdrant = await this.checkService(async () => {
      await qdrantClient.getCollections();
    });

   
    services.embedding = await this.checkService(async () => {
      const hasConfig = await this.embeddingService.healthCheck();
      if (!hasConfig) {
        throw new Error("Embedding API key is missing or not configured");
      }
      await this.embeddingService.embed("ping", "RETRIEVAL_QUERY");
    });

    
    services.email = await this.checkService(async () => {
      const ok = await this.emailService.healthCheck();
      if (!ok) throw new Error("SMTP server verification failed or is unconfigured");
    });

  
    services.storage = await this.checkService(async () => {
      const ok = await this.storageService.healthCheck();
      if (!ok) throw new Error("Cloudinary API credentials failed or could not be verified");
    });

  
    let overall: "healthy" | "unhealthy" | "degraded" = "healthy";
    const statuses = Object.values(services).map((s: any) => s.status);
    
    if (statuses.includes("unhealthy")) {
      overall = "unhealthy";
    } else if (statuses.includes("degraded")) {
      overall = "degraded";
    }

    return {
      overall,
      services: services as SystemHealthReport["services"]
    };
  }

  private async checkService(checkFn: () => Promise<void>): Promise<HealthStatus> {
    const startTime = Date.now();
    try {
      await checkFn();
      const latencyMs = Date.now() - startTime;
      return {
        status: "healthy",
        latencyMs,
      };
    } catch (error: any) {
      const latencyMs = Date.now() - startTime;
      return {
        status: "unhealthy",
        latencyMs,
        error: error?.message || String(error),
      };
    }
  }
}
