import { Request, Response } from 'express';
import { fileService } from '../services';
import { MulterFile } from '../types';

export const uploadController = {
  /**
   * Handle file upload
   */
  uploadFile: (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const file = req.file as MulterFile;
      console.log("--- Audio Blob Information ---");
      console.log("Original filename:", file.originalname);
      console.log("File size:", file.size, "bytes");
      console.log("MIME type:", file.mimetype);
      console.log("Saved as:", file.filename);
      console.log("Path:", file.path);
      console.log("----------------------------");
      
      // Send file information to client
      return res.status(200).json({
        message: 'File uploaded successfully',
        file: fileService.getFileInfo(file)
      });
    } catch (error) {
      console.error('Upload error:', error);
      return res.status(500).json({ 
        error: 'An error occurred during upload' 
      });
    }
  }
};
