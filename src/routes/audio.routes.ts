import { Router } from 'express';
import SSE from 'express-sse';
import { audioController } from '../controllers/audio.controller';

// Create SSE instance for progress updates
export const sse = new SSE();

const router = Router();

// Route for SSE stream
router.get('/stream', sse.init);

// Route for audio separation
router.post('/separate/:filename', audioController.separateAudio);

// Route for YouTube audio separation
router.post('/separate-youtube', audioController.separateYoutubeAudio);

// Route for accessing processed audio files
router.get('/htdemucs/:filename/:type.mp3', audioController.getProcessedAudio);

export const audioRoutes = router;
