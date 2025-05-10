import { exec } from 'child_process';
import { fileService } from './file.service';
import { dockerUtils } from '../utils';
import { sse } from '../routes/audio.routes';

class DemucsService {
  private sendErrorStatus(message: string, progress: number) {
    sse.send({
      status: 'error',
      message: `Error: ${message}`,
      progress
    }, 'separation-progress');
  }

  /**
   * Separates audio file into vocals and instrumental tracks using Demucs
   */
  async separateAudio(filename: string): Promise<{success: boolean, error?: string}> {
    // Check if file exists
    if (!fileService.validateFileExists(filename)) {
      return { 
        success: false, 
        error: 'Input file not found' 
      };
    }
    
    // Ensure output directory exists
    fileService.ensureDirectoriesExist();
    
    // Send initial progress status
    sse.send({
      status: 'started',
      message: 'Starting audio separation',
      progress: 0
    }, 'separation-progress');
    
    // Build the Docker command
    const command = dockerUtils.buildDemucsCommand(filename);
    
    try {
      // Execute the command
      const process = exec(command);
      let progress = 0;
      
      // Track process output
      process.stderr?.on('data', (data: string) => {
        console.log(`stdout: ${data}`);
        
        // Parse progress information using a more specific regex
        const matches = data.match(/(\d+)%\|[█▒ ]+\|/g);
        if (matches && matches.length > 0) {
          // Extract just the number before the % symbol
          const percentage = parseInt(matches[0].match(/(\d+)%/)?.[1] || '0', 10);
          progress = percentage;
          sse.send({
            status: 'processing',
            message: `Processing: ${progress}% complete`,
            progress
          }, 'separation-progress');
        }
      });
      
      // Wait for process to complete
      return new Promise<{success: boolean, error?: string}>((resolve, reject) => {
        process.on('close', (code: number | null) => {
          if (code === 0) {
            // Get file paths for separated tracks
            const files = fileService.getProcessedFilePaths(filename);
            
            sse.send({
              status: 'completed',
              message: 'Audio separation completed successfully',
              progress: 100,
              files
            }, 'separation-progress');
            
            resolve({ success: true });
          } else {
            const errorMsg = `Process exited with code ${code}`;
            sse.send({
              status: 'failed',
              message: errorMsg,
              progress
            }, 'separation-progress');
            
            reject(new Error(errorMsg));
          }
        });
        
        process.on('error', (error: Error) => {
          this.sendErrorStatus(error.message, progress);
          reject(error);
        });
      }).catch((error: Error) => {
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
}

export const demucsService = new DemucsService();
