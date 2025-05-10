import { Router } from 'express';
import { uploadConfig } from '../config';
import { uploadController } from '../controllers/upload.controller';

const router = Router();

// Route for file upload
router.post('/', uploadConfig.single('audio'), uploadController.uploadFile);

export const uploadRoutes = router;
