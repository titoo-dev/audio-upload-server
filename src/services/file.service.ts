import fs from 'fs';
import path from 'path';
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
      appConfig.storage.models,
      appConfig.storage.downloads,
    ];
    
    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
  }

  getDownloadFiles(): string[] {
    return fs.readdirSync(appConfig.storage.downloads)
      .map(filename => ({
        name: filename,
        time: fs.statSync(`${appConfig.storage.downloads}/${filename}`).mtime.getTime()
      }))
      .sort((a, b) => b.time - a.time)
      .map(file => file.name);
  }

  getLatestDownloadedFile(): string | null {
    const files = this.getDownloadFiles();
    return files.length > 0 ? files[0] : null;
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

  /**
   * Move a file from downloads directory to input directory
   */
  moveDownloadToInput(filename: string): string {
    const sourcePath = path.join(appConfig.storage.downloads, filename);
    const targetPath = path.join(appConfig.storage.input, filename);
    
    // If file already exists in input directory, don't copy it again
    if (fs.existsSync(targetPath)) {
      return filename;
    }
    
    // Copy file to input directory
    fs.copyFileSync(sourcePath, targetPath);
    
    return filename;
  }
}

export const fileService = new FileService();
