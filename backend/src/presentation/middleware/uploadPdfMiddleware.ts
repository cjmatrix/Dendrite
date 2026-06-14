import { Request, Response, NextFunction } from "express";
import Busboy from "busboy";
import fs from "fs";
import { FileUploadService } from "../../services/FileUploadService";
import { CHAT_MESSAGES } from "../constants/chatMessages";

export const uploadPdfMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (!req.headers["content-type"]?.includes("multipart/form-data")) {
    return res.status(400).json({ message: "Invalid content-type" });
  }

  const busboy = Busboy({
    headers: req.headers,
    limits: { fileSize: 50 * 1024 * 1024 },
  });

  let filePath = "";
  let fileName = "";
  let fileProcessPromise: Promise<void> | null = null;
  let responseSent = false;

  const sendError = (status: number, message: string) => {
    if (responseSent) return;
    responseSent = true;
    res.status(status).json({ message });
  };

  busboy.on("field", (fieldname, val) => {
    if (fieldname === "fileName") fileName = val;
  });

  busboy.on("file", (fieldname, file, info) => {
    const { filename } = info;
    filePath = FileUploadService.generateTempFilePath(filename);

    fileProcessPromise = new Promise(async (resolve, reject) => {
      const chunks: Buffer[] = [];
      let headerLength = 0;
      const HEADER_BYTES = 4200;
      let isValidated = false;
      let writeStream: fs.WriteStream | null = null;

      const startWriting = async (finalChunks: Buffer[]) => {
        try {
          const total = Buffer.concat(finalChunks);
          await FileUploadService.validateDocumentFile(total, filename);
          isValidated = true;

          writeStream = fs.createWriteStream(filePath);
          writeStream.on("error", (err) => {
            sendError(500, CHAT_MESSAGES.FAILED_TO_SAVE_FILE);
            reject(err);
          });

          writeStream.write(total);
          file.resume();
        } catch (error: any) {
          sendError(error.statusCode || 415, error.message);
          file.resume();
          reject(error);
        }
      };

      file.on("data", (chunk: Buffer) => {
        if (responseSent) return;
        if (!isValidated) {
          chunks.push(chunk);
          headerLength += chunk.length;
          if (headerLength >= HEADER_BYTES) {
            file.pause();
            startWriting(chunks).catch(reject);
          }
        } else if (writeStream) {
          writeStream.write(chunk);
        }
      });

      file.on("end", async () => {
        if (responseSent) return resolve();
        try {
          if (!isValidated) await startWriting(chunks);
          if (writeStream) writeStream.end(() => resolve());
          else resolve();
        } catch (err) {
          reject(err);
        }
      });

      file.on("limit", () => {
        sendError(413, CHAT_MESSAGES.FILE_TOO_LARGE);
        file.resume();
        resolve();
      });
    });
  });

  busboy.on("finish", async () => {
    if (responseSent) return;
    try {
      if (fileProcessPromise) await fileProcessPromise;
      if (!filePath) return sendError(400, CHAT_MESSAGES.NO_FILE_UPLOADED);

   
      req.file = {
        path: filePath,
        originalname: fileName || "document",
      } as any;

      next();
    } catch (error: any) {
      if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
      sendError(error.statusCode || 500, error.message || CHAT_MESSAGES.FAILED_TO_QUEUE);
    }
  });

  busboy.on("error", () => sendError(500, CHAT_MESSAGES.FAILED_TO_PROCESS));
  req.pipe(busboy);
};
