import { Request, Response } from 'express';
import path from 'path';
import { demucsService, fileService } from '../services';
import { appConfig } from '../config';


export const audioController = {
  
  /**
   * Handle audio separation process
   */
  separateAudio: async (req: Request, res: Response) => {
    const inputFile = req.params.filename;
    
    // Validate file exists
    if (!fileService.validateFileExists(inputFile)) {
      return res.status(404).json({ 
        error: 'Input file not found' 
      });
    }
    
    // Start audio separation process with SSE
    const result = await demucsService.separateAudio(inputFile);
    
    if (!result.success) {
      return res.status(500).json({ 
        error: result.error || 'Failed to process audio' 
      });
    }
    
    // Return response with file URLs
    const files = fileService.getProcessedFilePaths(inputFile);
    return res.status(200).json({
      message: 'Audio separation completed',
      files
    });
  },
  
  /**
   * Handle audio separation from YouTube URL
   */
  separateYoutubeAudio: async (req: Request, res: Response) => {
    const { url } = req.body;
    
    // Validate URL
    if (!url) {
      return res.status(400).json({
        error: 'YouTube URL is required'
      });
    }
    
    // Start audio separation process with SSE
    const result = await demucsService.downloadAndSeparate(url);
    
    if (!result.success) {
      return res.status(500).json({
        error: result.error || 'Failed to process YouTube audio'
      });
    }
    
    // Return response with file URLs
    if (result.filename) {
      const files = fileService.getProcessedFilePaths(result.filename);
      return res.status(200).json({
        message: 'YouTube audio separation completed',
        files
      });
    }
    
    return res.status(200).json({
      message: 'YouTube audio separation completed'
    });
  },
  
  /**
   * Serve processed audio files
   */
  getProcessedAudio: (req: Request, res: Response) => {
    const { filename, type } = req.params;
    const filePath = path.join(
      appConfig.storage.output,
      'htdemucs',
      filename,
      `${type}.mp3`
    );
    
    // Check if file exists
    if (!path.isAbsolute(filePath) || !fileService.validateFileExists(path.relative(appConfig.storage.input, filePath))) {
      return res.status(404).json({ 
        error: 'Audio file not found' 
      });
    }
    
    res.sendFile(filePath);
  }
};

