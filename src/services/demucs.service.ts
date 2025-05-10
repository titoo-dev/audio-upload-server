import { exec } from 'child_process';
import { fileService } from './file.service';
import { dockerUtils } from '../utils';
import { sse } from '../routes/audio.routes';

class DemucsService {
  /**
   * Sends error status update via SSE
   */
  private sendErrorStatus(message: string, progress: number) {
    sse.send({
      status: 'error',
      message: `Error: ${message}`,
      progress
    }, 'separation-progress');
  }

  /**
   * Sends progress update via SSE
   */
  private sendProgressUpdate(status: string, message: string, progress: number, files?: any) {
    const payload: any = { status, message, progress };
    if (files) payload.files = files;
    sse.send(payload, 'separation-progress');
  }

  /**
   * Validates input file and prepares environment
   */
  private validateAndPrepare(filename: string): boolean {
    // Check if file exists
    if (!fileService.validateFileExists(filename)) {
      this.sendProgressUpdate('error', 'Input file not found', 0);
      return false;
    }
    
    // Ensure output directory exists
    fileService.ensureDirectoriesExist();
    
    // Send initial progress status
    this.sendProgressUpdate('started', 'Starting audio separation', 0);
    return true;
  }

  /**
   * Parses process output to extract progress information
   */
  private parseProgress(data: string): number | null {
    console.log(`stdout: ${data}`);
    
    // Parse progress information using a more specific regex
    const matches = data.match(/(\d+)%\|[█▒ ]+\|/g);
    if (matches && matches.length > 0) {
      // Extract just the number before the % symbol
      return parseInt(matches[0].match(/(\d+)%/)?.[1] || '0', 10);
    }
    return null;
  }

  /**
   * Handles process output and sends progress updates
   */
  private handleProcessOutput(process: any): void {
    let progress = 0;
    
    process.stderr?.on('data', (data: string) => {
      const percentage = this.parseProgress(data);
      if (percentage !== null) {
        progress = percentage;
        this.sendProgressUpdate(
          'processing', 
          `Processing: ${progress}% complete`, 
          progress
        );
      }
    });
  }

  /**
   * Creates a promise that resolves when the process is complete
   */
  private createProcessPromise(process: any, filename: string): Promise<{success: boolean, error?: string}> {
    let progress = 0;
    
    return new Promise<{success: boolean, error?: string}>((resolve, reject) => {
      process.on('close', (code: number | null) => {
        if (code === 0) {
          // Get file paths for separated tracks
          const files = fileService.getProcessedFilePaths(filename);
          
          this.sendProgressUpdate(
            'completed',
            'Audio separation completed successfully',
            100,
            files
          );
          
          resolve({ success: true });
        } else {
          const errorMsg = `Process exited with code ${code}`;
          this.sendProgressUpdate('failed', errorMsg, progress);
          
          reject(new Error(errorMsg));
        }
      });
      
      process.on('error', (error: Error) => {
        this.sendErrorStatus(error.message, progress);
        reject(error);
      });
    });
  }

  /**
   * Executes the separation process
   */
  private async executeProcess(command: string, filename: string): Promise<{success: boolean, error?: string}> {
    try {
      // Execute the command
      const process = exec(command);
      
      // Track process output
      this.handleProcessOutput(process);
      
      // Wait for process to complete
      return await this.createProcessPromise(process, filename)
        .catch((error: Error) => {
          return {
            success: false,
            error: error.message
          };
        });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.sendErrorStatus(errorMessage, 0);
      return { 
        success: false, 
        error: errorMessage 
      };
    }
  }

  /**
   * Separates audio file into vocals and instrumental tracks using Demucs
   */
  async separateAudio(filename: string): Promise<{success: boolean, error?: string}> {
    // Validate input and prepare environment
    if (!this.validateAndPrepare(filename)) {
      return { success: false, error: 'Input file not found' };
    }
    
    // Build the Docker command
    const command = dockerUtils.buildDemucsCommand(filename);
    
    // Execute the process
    return this.executeProcess(command, filename);
  }
}

export const demucsService = new DemucsService();
