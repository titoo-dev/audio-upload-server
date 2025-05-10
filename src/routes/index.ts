import { Router } from 'express';
import { uploadRoutes } from './upload.routes';
import { audioRoutes } from './audio.routes';

const router = Router();

// Register routes
router.use('/upload', uploadRoutes);
router.use('/audio', audioRoutes);

export const routes = router;
