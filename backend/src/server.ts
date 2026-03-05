import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes";
import folderRoutes from "./routes/folderRoutes";
import chatRoutes from "./routes/chatRoutes";
import "./worker/embeddingWorker";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  }),
);
import { errorHandler } from "./middleware/errorHandler";

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/folders", folderRoutes);
app.use("/api/v1/chats", chatRoutes);

app.get("/", (req, res) => {
  res.send("API is running...");
});

app.use(errorHandler);

import { initQdrant } from "./config/qdrant";

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/dentrites";
mongoose
  .connect(MONGODB_URI)
  .then(async () => {
    console.log("Connected to MongoDB");
    await initQdrant();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB", err);
  });
