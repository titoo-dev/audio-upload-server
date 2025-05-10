import fs from 'fs';
import { appConfig } from '../config';
import { MulterFile } from '../types';
import { pathUtils } from '../utils';

export class FileService {
  /**
   * Validates if a file exists at the given path
   */
  validateFileExists(filename: string): boolean {
    const inputPath = pathUtils.getInputPath(filename);
    return fs.existsSync(inputPath);
  }

  /**
   * Ensures required directories exist
   */
  ensureDirectoriesExist(): void {
    const dirs = [
      appConfig.storage.input,
      appConfig.storage.output,
      appConfig.storage.models
    ];
    
    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
  }
  
  /**
   * Get file paths for processed audio files
   */
  getProcessedFilePaths(filename: string) {
    return {
      vocals: pathUtils.getOutputUrl(filename, 'vocals'),
      instrumental: pathUtils.getOutputUrl(filename, 'no_vocals')
    };
  }
  
  /**
   * Check if processed files exist
   */
  checkProcessedFilesExist(filename: string): boolean {
    const vocalsPath = pathUtils.getOutputPath(filename, 'vocals');
    const instPath = pathUtils.getOutputPath(filename, 'no_vocals');
    
    return fs.existsSync(vocalsPath) && fs.existsSync(instPath);
  }
  
  /**
   * Get file information from a multer file
   */
  getFileInfo(file: MulterFile) {
    return {
      name: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      storedFilename: file.filename
    };
  }
}

export const fileService = new FileService();
