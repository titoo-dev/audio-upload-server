import { Request, Response, NextFunction } from 'express';
import multer from 'multer';

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  // Handle Multer errors
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ 
        error: 'File is too large. Maximum size is 10MB.' 
      });
    }
    return res.status(400).json({ 
      error: err.message 
    });
  } 
  
  // Handle general errors
  if (err) {
    console.error('Server error:', err);
    return res.status(500).json({ 
      error: 'An unexpected error occurred' 
    });
  }
  
  next();
};
