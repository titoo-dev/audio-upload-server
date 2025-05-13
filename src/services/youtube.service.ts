import { exec } from 'child_process';
import { fileService } from './file.service';
import { dockerUtils } from '../utils';
import { sse } from '../routes/audio.routes';

class YoutubeService {
  private sendProgressUpdate(status: string, message: string, progress: number, file?: string) {
    const payload: any = { status, message, progress };
    if (file) payload.file = file;
    sse.send(payload, 'download-progress');
  }

  private parseProgress(data: string): number | null {
    const downloadMatch = data.match(/(\d+\.?\d*)%/);
    if (downloadMatch) {
      return parseFloat(downloadMatch[1]);
    }
    return null;
  }

  private handleProcessOutput(process: any): void {
    process.stderr?.on('data', (data: string) => {
      const percentage = this.parseProgress(data.toString());
      if (percentage !== null) {
        this.sendProgressUpdate(
          'downloading',
          `Downloading: ${percentage}% complete`,
          percentage
        );
      }
    });
  }

  private createProcessPromise(process: any): Promise<{success: boolean, error?: string}> {
    return new Promise((resolve, reject) => {
      process.on('close', (code: number) => {
        if (code === 0) {
          this.sendProgressUpdate('completed', 'Download completed successfully', 100);
          resolve({ success: true });
        } else {
          const errorMsg = `Process exited with code ${code}`;
          this.sendProgressUpdate('error', errorMsg, 0);
          reject(new Error(errorMsg));
        }
      });

      process.on('error', (error: Error) => {
        this.sendProgressUpdate('error', error.message, 0);
        reject(error);
      });
    });
  }

  async downloadVideo(url: string): Promise<{success: boolean, error?: string, filename?: string}> {
    try {
      fileService.ensureDirectoriesExist();
      this.sendProgressUpdate('started', 'Starting download', 0);

      const command = dockerUtils.buildYoutubeCommand(url);
      const process = exec(command);

      this.handleProcessOutput(process);
      const result = await this.createProcessPromise(process);
      
      if (result.success) {
        const filename = fileService.getLatestDownloadedFile();
        if (!filename) {
          return {
            success: false,
            error: 'Failed to locate downloaded file'
          };
        }
        
        // Move file from downloads to input directory if needed
        const movedFilename = fileService.moveDownloadToInput(filename);
        
        return { 
          success: true,
          filename: movedFilename
        };
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.sendProgressUpdate('error', errorMessage, 0);
      return { 
        success: false, 
        error: errorMessage 
      };
    }
  }
}

export const youtubeService = new YoutubeService();
