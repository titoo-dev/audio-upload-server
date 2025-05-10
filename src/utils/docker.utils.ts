import { appConfig } from '../config';

/**
 * Utility functions for Docker commands
 */
export const dockerUtils = {
  /**
   * Build Docker command for Demucs audio separation
   */
  buildDemucsCommand: (filename: string): string => {
    const options = appConfig.docker.demucsOptions;
    
    return `docker run --rm \
      -v "${appConfig.storage.input}:/data/input" \
      -v "${appConfig.storage.output}:/data/output" \
      -v "${appConfig.storage.models}:/data/models" \
      ${appConfig.docker.imageName} \
      "python3 -m demucs.separate -d ${options.device} \
      --${options.format} --${options.format}-bitrate ${options.bitrate} \
      -n ${options.model} --two-stems=${options.stems} \
      --clip-mode ${options.clipMode} --overlap ${options.overlap} \
      '/data/input/${filename}' -o '/data/output'"`;
  }
};
