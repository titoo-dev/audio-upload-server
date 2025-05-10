import path from 'path';
import { appConfig } from '../config';

/**
 * Utility functions for handling file paths
 */
export const pathUtils = {
  /**
   * Get absolute path to an input file
   */
  getInputPath: (filename: string): string => {
    return path.join(appConfig.storage.input, filename);
  },

  /**
   * Get absolute path to an output file
   */
  getOutputPath: (filename: string, type: string = 'vocals'): string => {
    const baseName = path.basename(filename, path.extname(filename));
    return path.join(
      appConfig.storage.output,
      'htdemucs',
      baseName,
      `${type}.mp3`
    );
  },

  /**
   * Get client-side URL for a processed file
   */
  getOutputUrl: (filename: string, type: string = 'vocals'): string => {
    const baseName = path.basename(filename, path.extname(filename));
    return `/output/htdemucs/${baseName}/${type}.mp3`;
  }
};
