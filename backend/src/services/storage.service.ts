import path from 'path';
import fs from 'fs';
import { env } from '../config/env';
import logger from '../config/logger';

export interface StoredFileResult {
  url: string;
  key: string;
  fileName: string;
  mimeType: string;
  size: number;
}

class StorageService {
  private driver = env.STORAGE_DRIVER;
  private uploadDir = path.resolve(process.cwd(), 'uploads');

  constructor() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  public getFileUrl(filename: string): string {
    return `${env.API_BASE_URL}/uploads/${filename}`;
  }

  public async deleteFile(filename: string): Promise<boolean> {
    try {
      const fullPath = path.join(this.uploadDir, filename);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        return true;
      }
      return false;
    } catch (err) {
      logger.error('Failed to delete file %s: %o', filename, err);
      return false;
    }
  }
}

export const storageService = new StorageService();
export default storageService;
