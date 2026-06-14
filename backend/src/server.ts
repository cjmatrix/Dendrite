import "reflect-metadata";
import "./config/di";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import authRoutes from "./presentation/routes/authRoutes";
import folderRoutes from "./presentation/routes/folderRoutes";
import chatRoutes from "./presentation/routes/chatRoutes";
import recallRoutes from "./presentation/routes/recallRoutes";
import branchRoutes from "./presentation/routes/branchRoutes";
import shareLinkRoutes from "./presentation/routes/shareLinkRoutes";
import "./worker/embeddingWorker";
import "./worker/descriptionWorker";
import "./worker/summaryWorker";
import "./worker/recallWorker";
import "./worker/documentChunkingWorker";
import "./cron/outboxSweeper";
import "./cron/descriptionSweeper";
import "./cron/searchCacheSweeper";
import "./cron/documentCacheSweeper";
import userRouter from "./presentation/routes/admin/userRoutes";
import { initQdrant } from "./config/qdrant";
import { embeddingService } from "./services/EmbeddingService";
import { setupSuspensionListener } from "./infrastructure/cache/suspendListener";
import { connectDatabase } from "./infrastructure/database/mongoose";
import adminAuthRoutes from "./presentation/routes/admin/adminAuthRoutes";
import { errorHandler } from "./presentation/middleware/errorHandler";
import { container } from "tsyringe";
import { IMetricsService } from "./application/common/ports/IMetricsService";
import { metricsMiddleware } from "./infrastructure/monitoring/middleware/middleware";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
app.use(metricsMiddleware);


app.get('/metrics', async (req, res) => {
  try {
    const metricsService = container.resolve<IMetricsService>("IMetricsService");
    res.setHeader('Content-Type', metricsService.getContentType());
    res.send(await metricsService.getMetrics());
  } catch (error) {
    res.status(500).send("Error generating metrics");
  }
});



app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: [process.env.CLIENT_URL || "http://localhost:5173","https://vc92w9h5-5173.inc1.devtunnels.ms"],
    credentials: true,
  }),
);





app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/admin/auth", adminAuthRoutes);
app.use("/api/v1/folders", folderRoutes);
app.use("/api/v1/chats", chatRoutes);
app.use("/api/v1/recall", recallRoutes);
app.use("/api/v1/branch", branchRoutes);
app.use("/api/v1/share", shareLinkRoutes);

app.use("/api/v1/admin/user", userRouter);

app.get("/", (req, res) => {
  res.send("API is running...");
});

app.use(errorHandler);

async function startServer() {
  try {
    
    await connectDatabase();

   
    try {
      await setupSuspensionListener();
      console.log(" Redis suspension listener started running");
    } catch (redisListenerError) {
      console.error(
        " Failed to start Redis suspension listener:",
        redisListenerError,
      );
    }

   
    await initQdrant();

    const isEmbeddingHealthy = await embeddingService.healthCheck();
    if (isEmbeddingHealthy) {
      console.log("✅ Embedding service is healthy");
    } else {
      console.warn(
        " Embedding service is not responding.",
      );
    }
  
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Critical server boot failure:", error);
  }
}

startServer();
