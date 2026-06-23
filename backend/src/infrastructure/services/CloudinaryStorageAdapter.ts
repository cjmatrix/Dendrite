import { injectable } from "tsyringe";
import fs from "fs";
import FileType from "file-type";
import cloudinary from "../../config/cloudinary";
import { AppError } from "../../utils/AppError";
import {
  IFileStorageService,
  FileStorageResult,
} from "../../application/common/ports/IFileStorageService";

@injectable()
export class CloudinaryStorageAdapter implements IFileStorageService {
  private static readonly ALLOWED_IMAGE_MIMES = new Set([
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/avif",
  ]);

  constructor() {
    this.validateCloudinaryConfig();
  }

  private validateCloudinaryConfig(): void {
    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      throw new AppError("Cloudinary is not configured", 500);
    }
  }

  async uploadDocument(filePath: string): Promise<FileStorageResult> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "dendrites/docs",
          resource_type: "raw",
        },
        (error: any, result: any) => {
          if (error || !result) {
            reject(error || new Error("Cloudinary document upload failed"));
            return;
          }
          resolve({ url: result.secure_url });
        },
      );

      fs.createReadStream(filePath).on("error", reject).pipe(stream);
    });
  }

  async uploadImage(
    buffer: Buffer,
    _mimetype: string,
  ): Promise<FileStorageResult> {
    const detected = await FileType.fromBuffer(buffer);

    if (!detected || !CloudinaryStorageAdapter.ALLOWED_IMAGE_MIMES.has(detected.mime)) {
      throw new AppError(
        "Unsupported file type. Only JPEG, PNG, GIF, WebP, and AVIF are allowed.",
        415,
      );
    }

    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "dendrites/chat-images",
          resource_type: "image",
        },
        (error: any, result: any) => {
          if (error || !result) {
            reject(error || new Error("Cloudinary image upload failed"));
            return;
          }
          resolve({ url: result.secure_url });
        },
      );

      stream.end(buffer);
    });
  }

  async healthCheck(): Promise<boolean> {
    try {
      if (
        !process.env.CLOUDINARY_CLOUD_NAME ||
        !process.env.CLOUDINARY_API_KEY ||
        !process.env.CLOUDINARY_API_SECRET
      ) {
        return false;
      }
      const res = await cloudinary.api.ping();
      return res?.status === "ok";
    } catch {
      return false;
    }
  }
}
