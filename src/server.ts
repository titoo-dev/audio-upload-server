import express, { Request, Response, NextFunction } from "express";
import multer, { FileFilterCallback } from "multer";
import path from "path";
import fs from "fs";
import { exec } from "child_process";
import cors from "cors";
import SSE from "express-sse";

interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
}

interface FileUploadResponse {
  message: string;
  file: {
    name: string;
    size: number;
    mimetype: string;
    storedFilename: string;
  };
}

interface SeparationProgress {
  status: "started" | "processing" | "completed" | "failed" | "error";
  message: string;
  progress: number;
  files?: {
    vocals: string;
    instrumental: string;
  };
}

const sse = new SSE();
const app = express();
const port = 8000;

const storage = multer.diskStorage({
  destination: (
    req: Express.Request,
    file: Express.Multer.File,
    cb: (error: Error | null, destination: string) => void
  ) => {
    const uploadDir = path.join(__dirname, "..", "input");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (
    req: Express.Request,
    file: Express.Multer.File,
    cb: (error: Error | null, filename: string) => void
  ) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const fileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
): void => {
  if (file.mimetype.startsWith("audio/")) {
    cb(null, true);
  } else {
    cb(new Error("Only audio files are allowed!"));
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

app.use(cors());
app.use("/output", express.static(path.join(__dirname, "..", "output")));

app.get("/stream", sse.init);

app.get(
  "/output/htdemucs/:filename/:type.mp3",
  (req: Request, res: Response) => {
    const { filename, type } = req.params;
    const filePath = path.join(
      __dirname,
      "..",
      "output",
      "htdemucs",
      filename,
      `${type}.mp3`
    );

    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).json({ error: "Audio file not found" });
    }
  }
);

app.post("/upload", upload.single("audio"), (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No audio file uploaded" });
    }

    const file = req.file as MulterFile;
    console.log("--- Audio Blob Information ---");
    console.log("Original filename:", file.originalname);
    console.log("File size:", file.size, "bytes");
    console.log("MIME type:", file.mimetype);
    console.log("Saved as:", file.filename);
    console.log("Path:", file.path);
    console.log("----------------------------");

    const response: FileUploadResponse = {
      message: "Audio file uploaded successfully",
      file: {
        name: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
        storedFilename: file.filename,
      },
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Error handling upload:", error);
    res.status(500).json({ error: "Failed to upload file" });
  }
});

app.post("/separate/:filename", (req: Request, res: Response) => {
  const inputFile = req.params.filename;
  const inputPath = path.join(__dirname, "..", "input", inputFile);
  const outputDir = path.join(__dirname, "..", "output");

  if (!fs.existsSync(inputPath)) {
    return res.status(404).json({ error: "Audio file not found" });
  }

  console.log("--- Starting Audio Separation ---");
  console.log("Input file:", inputFile);
  console.log("Input path:", inputPath);
  console.log("Output directory:", outputDir);

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const progressData: SeparationProgress = {
    status: "started",
    message: "Starting audio separation",
    progress: 0,
  };

  sse.send(progressData, "separation-progress");

  const command = `docker run --rm -v "${path.join(
    __dirname,
    "..",
    "input"
  )}:/data/input" -v "${path.join(
    __dirname,
    "..",
    "output"
  )}:/data/output" -v "${path.join(
    __dirname,
    "..",
    "models"
  )}:/data/models" xserrat/facebook-demucs:latest "python3 -m demucs.separate -d cpu --mp3 --mp3-bitrate 320 -n htdemucs --two-stems=vocals --clip-mode rescale --overlap 0.25 '/data/input/${inputFile}' -o '/data/output'"`;

  const process = exec(command);

  process.stdout?.on("data", (data: string) => {
    console.log("Demucs output:", data);

    const progressMatch = data.match(/([0-9]+)%/);
    if (progressMatch) {
      const progressPercent = parseInt(progressMatch[1], 10);
      const progressUpdate: SeparationProgress = {
        status: "processing",
        message: `Processing: ${progressPercent}% complete`,
        progress: progressPercent,
      };
      sse.send(progressUpdate, "separation-progress");
    }
  });

  process.stderr?.on("data", (data: string) => {
    console.error("Demucs error:", data);
    const errorUpdate: SeparationProgress = {
      status: "error",
      message: `Error: ${data}`,
      progress: -1,
    };
    sse.send(errorUpdate, "separation-progress");
  });

  process.on("close", (code: number | null) => {
    console.log("Demucs process exited with code:", code);

    if (code !== 0) {
      const failureUpdate: SeparationProgress = {
        status: "failed",
        message: `Process failed with code: ${code}`,
        progress: -1,
      };
      sse.send(failureUpdate, "separation-progress");
      return res.status(500).json({ error: "Failed to process audio" });
    }

    const baseFilename = path.parse(inputFile).name;
    const outputFiles = {
      vocals: path.join(outputDir, "htdemucs", baseFilename, "vocals.mp3"),
      instrumental: path.join(
        outputDir,
        "htdemucs",
        baseFilename,
        "no_vocals.mp3"
      ),
    };

    const completionUpdate: SeparationProgress = {
      status: "completed",
      message: "Audio separation completed",
      progress: 100,
      files: {
        vocals: `/output/htdemucs/${baseFilename}/vocals.mp3`,
        instrumental: `/output/htdemucs/${baseFilename}/no_vocals.mp3`,
      },
    };
    sse.send(completionUpdate, "separation-progress");

    res.json({
      message: "Audio separated successfully",
      files: outputFiles,
    });
  });

  process.on("error", (error: Error) => {
    console.error("Failed to start Demucs process:", error);
    const errorUpdate: SeparationProgress = {
      status: "failed",
      message: `Failed to start process: ${error.message}`,
      progress: -1,
    };
    sse.send(errorUpdate, "separation-progress");
    res.status(500).json({ error: "Failed to start audio processing" });
  });
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res
        .status(413)
        .json({ error: "File is too large. Maximum size is 10MB." });
    }
    return res.status(400).json({ error: err.message });
  } else if (err) {
    return res.status(500).json({ error: err.message });
  }
  next();
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
