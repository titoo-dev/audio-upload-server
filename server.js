const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { exec } = require("child_process");
const cors = require("cors");
const SSE = require("express-sse");
const sse = new SSE();

// Initialize Express app
const app = express();
const port = 8000;

// Set up storage for multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "input");

    // Create the input directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Create unique filename with timestamp
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

// File filter to accept only audio files
const fileFilter = (req, file, cb) => {
  // Check if the file is an audio file
  if (file.mimetype.startsWith("audio/")) {
    cb(null, true);
  } else {
    cb(new Error("Only audio files are allowed!"), false);
  }
};

// Configure multer upload
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
});

app.use(cors());
// Serve static files from public directory
app.use("/output", express.static(path.join(__dirname, "output")));

app.get("/stream", sse.init);

// Serve separated audio files
app.get("/output/htdemucs/:filename/:type.mp3", (req, res) => {
  const { filename, type } = req.params;
  const filePath = path.join(
    __dirname,
    "output",
    "htdemucs",
    filename,
    `${type}.mp3`
  );

  // Check if file exists
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ error: "Audio file not found" });
  }
});

// Handle file upload
app.post("/upload", upload.single("audio"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No audio file uploaded" });
    }

    // Print blob information to console
    console.log("--- Audio Blob Information ---");
    console.log("Original filename:", req.file.originalname);
    console.log("File size:", req.file.size, "bytes");
    console.log("MIME type:", req.file.mimetype);
    console.log("Saved as:", req.file.filename);
    console.log("Path:", req.file.path);
    console.log("----------------------------");

    res.status(200).json({
      message: "Audio file uploaded successfully",
      file: {
        name: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        storedFilename: req.file.filename, // Added stored filename
      },
    });
  } catch (error) {
    console.error("Error handling upload:", error);
    res.status(500).json({ error: "Failed to upload file" });
  }
});

// Handle audio separation
app.post("/separate/:filename", (req, res) => {
  const inputFile = req.params.filename;
  const inputPath = path.join(__dirname, "input", inputFile);
  const outputDir = path.join(__dirname, "output");

  // Verify file exists
  if (!fs.existsSync(inputPath)) {
    return res.status(404).json({ error: "Audio file not found" });
  }

  console.log("--- Starting Audio Separation ---");
  console.log("Input file:", inputFile);
  console.log("Input path:", inputPath);
  console.log("Output directory:", outputDir);

  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log("Created output directory");
  }

  // Send initial status
  sse.send({
    status: "started",
    message: "Starting audio separation",
    progress: 0
  }, "separation-progress");

  const command = `docker run --rm -v "${__dirname}/input:/data/input" -v "${__dirname}/output:/data/output" -v "${__dirname}/models:/data/models" xserrat/facebook-demucs:latest "python3 -m demucs.separate -d cpu --mp3 --mp3-bitrate 320 -n htdemucs --two-stems=vocals --clip-mode rescale --overlap 0.25 '/data/input/${inputFile}' -o '/data/output'"`;

  console.log("Executing command:", command);

  const process = exec(command);

  // Track process output
  process.stdout.on("data", (data) => {
    console.log("Demucs output:", data.toString());
    
    // Parse progress information if available
    const output = data.toString();
    const progressMatch = output.match(/([0-9]+)%/);
    if (progressMatch) {
      const progressPercent = parseInt(progressMatch[1], 10);
      sse.send({
        status: "processing",
        message: `Processing: ${progressPercent}% complete`,
        progress: progressPercent
      }, "separation-progress");
    }
  });

  process.stderr.on("data", (data) => {
    console.error("Demucs error:", data.toString());
    sse.send({
      status: "error",
      message: `Error: ${data.toString()}`,
      progress: -1
    }, "separation-progress");
  });

  process.on("close", (code) => {
    console.log("Demucs process exited with code:", code);

    if (code !== 0) {
      console.error("Process failed with code:", code);
      sse.send({
        status: "failed",
        message: `Process failed with code: ${code}`,
        progress: -1
      }, "separation-progress");
      return res.status(500).json({ error: "Failed to process audio" });
    }

    // Get paths to generated files
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

    // Send completion event
    sse.send({
      status: "completed",
      message: "Audio separation completed",
      progress: 100,
      files: {
        vocals: `/output/htdemucs/${baseFilename}/vocals.mp3`,
        instrumental: `/output/htdemucs/${baseFilename}/no_vocals.mp3`
      }
    }, "separation-progress");

    console.log("Generated output files:", outputFiles);
    res.json({
      message: "Audio separated successfully",
      files: outputFiles,
    });
  });

  process.on("error", (error) => {
    console.error("Failed to start Demucs process:", error);
    sse.send({
      status: "failed",
      message: `Failed to start process: ${error.message}`,
      progress: -1
    }, "separation-progress");
    res.status(500).json({ error: "Failed to start audio processing" });
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // A Multer error occurred when uploading
    if (err.code === "LIMIT_FILE_SIZE") {
      return res
        .status(413)
        .json({ error: "File is too large. Maximum size is 10MB." });
    }
    return res.status(400).json({ error: err.message });
  } else if (err) {
    // An unknown error occurred
    return res.status(500).json({ error: err.message });
  }
  next();
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
