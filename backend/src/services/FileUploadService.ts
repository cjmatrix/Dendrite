import fs from 'fs';
import path from 'path';
import os from 'os';
import fsp from 'fs/promises';
import FileType from 'file-type';
import cloudinary from '../config/cloudinary';
import { AppError } from '../utils/AppError';


export class FileUploadService {
  private static readonly PDF_TEMP_DIR = path.join(
    os.tmpdir(),
    'dendrites-file-uploads',
  );

  private static readonly ALLOWED_IMAGE_MIMES = new Set([
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/avif',
  ]);

  private static readonly ALLOWED_DOCUMENT_MIMES = new Set([
    'application/pdf',
    'text/plain',
    'text/markdown',
    'text/csv',
    'application/json',
    'application/xml',
    'text/xml',
    'application/yaml',
    'text/yaml',
    'application/x-yaml',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/rtf',
  ]);

  private static readonly ALLOWED_DOCUMENT_EXTENSIONS = new Set([
    '.pdf',
    '.txt',
    '.md',
    '.csv',
    '.json',
    '.xml',
    '.yaml',
    '.yml',
    '.doc',
    '.docx',
    '.xls',
    '.xlsx',
    '.ppt',
    '.pptx',
    '.rtf',
    '.py',
    '.js',
    '.ts',
    '.tsx',
    '.jsx',
    '.java',
    '.c',
    '.cpp',
    '.h',
    '.hpp',
    '.go',
    '.rs',
    '.php',
    '.sql',
    '.html',
    '.css',
  ]);

  static {
    if (!fs.existsSync(this.PDF_TEMP_DIR)) {
      fs.mkdirSync(this.PDF_TEMP_DIR, { recursive: true });
    }
  }

  

  static validateCloudinaryConfig(): void {
    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      throw new AppError('Cloudinary is not configured', 500);
    }
  }

  
   // Upload image buffer to Cloudinary
   


  static async uploadImageToCloudinary(
    buffer: Buffer,
    mimetype: string,
  ): Promise<{ secure_url: string }> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'dendrites/chat-images',
          resource_type: 'image',
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (error: any, result: any) => {
          if (error || !result) {
            reject(error || new Error('Cloudinary upload failed'));
            return;
          }
          resolve({ secure_url: result.secure_url });
        },
      );

      stream.end(buffer);
    });
  }

  
   
   
  static async uploadDocumentToCloudinary(
    filePath: string,
  ): Promise<{ secure_url: string }> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'dendrites/docs',
          resource_type: 'raw',
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (error: any, result: any) => {
          if (error || !result) {
            reject(error || new Error('Cloudinary upload failed'));
            return;
          }
          resolve({ secure_url: result.secure_url });
        },
      );

      fs.createReadStream(filePath).on('error', reject).pipe(stream);
    });
  }

  
   
   
  static async validateImageFile(buffer: Buffer): Promise<void> {
    const detected = await FileType.fromBuffer(buffer);

    if (!detected || !this.ALLOWED_IMAGE_MIMES.has(detected.mime)) {
      throw new AppError(
        'Unsupported file type. Only JPEG, PNG, GIF, WebP, and AVIF are allowed.',
        415,
      );
    }
  }

  
   
   
  static async validateDocumentFile(buffer: Buffer, filename?: string): Promise<void> {
    const detected = await FileType.fromBuffer(buffer);
    const detectedMime = detected?.mime ?? 'application/octet-stream';
    const detectedExt = detected?.ext ? `.${detected.ext}` : '';
    
    const isAllowedMime =
      this.ALLOWED_DOCUMENT_MIMES.has(detectedMime) ||
      detectedMime.startsWith('text/');


    let isAllowedByExt = false;
    
     isAllowedByExt = this.ALLOWED_DOCUMENT_EXTENSIONS.has(detectedExt);

    if (!isAllowedMime && !isAllowedByExt) {
      throw new AppError(
        'Unsupported file type. Allowed: PDF, text, markdown, csv, json, xml, yaml, office docs, and common code files.',
        415,
      );
    }
  }

  
 
  static generateTempFilePath(originalFilename: string): string {
    const safeName = path.basename(originalFilename || 'document');
    return path.join(this.PDF_TEMP_DIR, `${Date.now()}-${safeName}`);
  }

  

   
  static async getMimeType(filePath: string): Promise<string> {
    try {
      const buffer = await fsp.readFile(filePath, { flag: 'r' });
      const detected = await FileType.fromBuffer(buffer);
      return detected?.mime || 'application/octet-stream';
    } catch {
      // Fall back to extension-based detection
      const ext = path.extname(filePath).toLowerCase();
      const mimeMap: { [key: string]: string } = {
        '.pdf': 'application/pdf',
        '.txt': 'text/plain',
        '.md': 'text/markdown',
        '.csv': 'text/csv',
        '.json': 'application/json',
        '.xml': 'application/xml',
        '.yaml': 'application/yaml',
        '.yml': 'application/yaml',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.doc': 'application/msword',
        '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      };
      return mimeMap[ext] || 'application/octet-stream';
    }
  }

  
  // Clean up temporary file
   
  static async cleanupTempFile(filePath: string): Promise<void> {
    try {
      await fsp.unlink(filePath);
    } catch (err) {
     
    }
  }
}
