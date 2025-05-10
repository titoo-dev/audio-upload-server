export interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
}

export interface FileUploadResponse {
  message: string;
  file: {
    name: string;
    size: number;
    mimetype: string;
    storedFilename: string;
  };
}

export interface SeparationProgress {
  status: "started" | "processing" | "completed" | "failed" | "error";
  message: string;
  progress: number;
  files?: {
    vocals: string;
    instrumental: string;
  };
}

export interface DemucsOptions {
  device: string;
  format: string;
  bitrate: string;
  model: string;
  stems: string;
  clipMode: string;
  overlap: string;
}
