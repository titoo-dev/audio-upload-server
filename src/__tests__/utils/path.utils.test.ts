import { pathUtils } from '../../utils/path.utils';
import path from 'path';

describe('Path Utils', () => {
  const testFilename = 'test-file.mp3';
  
  test('getInputPath returns correct path', () => {
    const result = pathUtils.getInputPath(testFilename);
    expect(result).toContain(testFilename);
    expect(path.basename(result)).toBe(testFilename);
  });
  
  test('getOutputPath returns correct path for vocals', () => {
    const result = pathUtils.getOutputPath(testFilename, 'vocals');
    expect(result).toContain('vocals.mp3');
    expect(path.basename(path.dirname(result))).toBe('test-file');
  });
  
  test('getOutputPath returns correct path for no_vocals', () => {
    const result = pathUtils.getOutputPath(testFilename, 'no_vocals');
    expect(result).toContain('no_vocals.mp3');
    expect(path.basename(path.dirname(result))).toBe('test-file');
  });
  
  test('getOutputUrl returns correct URL for vocals', () => {
    const result = pathUtils.getOutputUrl(testFilename, 'vocals');
    expect(result).toBe('/output/htdemucs/test-file/vocals.mp3');
  });
  
  test('getOutputUrl returns correct URL for no_vocals', () => {
    const result = pathUtils.getOutputUrl(testFilename, 'no_vocals');
    expect(result).toBe('/output/htdemucs/test-file/no_vocals.mp3');
  });
});
