import path from 'path';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

export const appConfig = {
  port: process.env.PORT || 8000,
  environment: process.env.NODE_ENV || 'development',
  storage: {
    downloads: process.env.DOWNLOAD_DIR || path.join(__dirname, '../../storage/download'),
    input: process.env.INPUT_DIR || path.join(__dirname, '../../storage/input'),
    output: process.env.OUTPUT_DIR || path.join(__dirname, '../../storage/output'),
    models: process.env.MODELS_DIR || path.join(__dirname, '../../storage/models'),
  },
  fileSize: {
    maxSize: 10 * 1024 * 1024, // 10MB
  },
  docker: {
    imageName: process.env.DOCKER_IMAGE || 'xserrat/facebook-demucs:latest',
    demucsOptions: {
      device: process.env.DEMUCS_DEVICE || 'cpu',
      format: process.env.DEMUCS_FORMAT || 'mp3',
      bitrate: process.env.DEMUCS_BITRATE || '320',
      model: process.env.DEMUCS_MODEL || 'htdemucs',
      stems: process.env.DEMUCS_STEMS || 'vocals',
      clipMode: process.env.DEMUCS_CLIP_MODE || 'rescale',
      overlap: process.env.DEMUCS_OVERLAP || '0.25'
    }
  }
};
