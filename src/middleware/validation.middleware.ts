import { Request, Response, NextFunction } from 'express';

export const validateFileParam = (req: Request, res: Response, next: NextFunction) => {
  const { filename } = req.params;
  
  if (!filename) {
    return res.status(400).json({ error: 'Filename parameter is required' });
  }
  
  next();
};
