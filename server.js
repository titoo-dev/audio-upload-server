const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

// Initialize Express app
const app = express();
const port = 3000;

// Set up storage for multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    
    // Create the uploads directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Create unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter to accept only audio files
const fileFilter = (req, file, cb) => {
  // Check if the file is an audio file
  if (file.mimetype.startsWith('audio/')) {
    cb(null, true);
  } else {
    cb(new Error('Only audio files are allowed!'), false);
  }
};

// Configure multer upload
const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max file size
  }
});

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Route to serve the upload form
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Handle file upload
app.post('/upload', upload.single('audio'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file uploaded' });
    }
    
    // Print blob information to console
    console.log('--- Audio Blob Information ---');
    console.log('Original filename:', req.file.originalname);
    console.log('File size:', req.file.size, 'bytes');
    console.log('MIME type:', req.file.mimetype);
    console.log('Saved as:', req.file.filename);
    console.log('Path:', req.file.path);
    console.log('----------------------------');
    
    res.status(200).json({
      message: 'Audio file uploaded successfully',
      file: {
        name: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        storedFilename: req.file.filename  // Added stored filename
      }
    });
  } catch (error) {
    console.error('Error handling upload:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});


// Handle audio separation
app.post('/separate/:filename', (req, res) => {
  const inputFile = req.params.filename;
  const inputPath = path.join(__dirname, 'uploads', inputFile);
  const outputDir = path.join(__dirname, 'outputs');

  // Verify file exists
  if (!fs.existsSync(inputPath)) {
    return res.status(404).json({ error: 'Audio file not found' });
  }

  console.log('--- Starting Audio Separation ---');
  console.log('Input file:', inputFile);
  console.log('Input path:', inputPath);
  console.log('Output directory:', outputDir);

  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log('Created output directory');
  }

  const command = `python -m demucs.separate --mp3 --mp3-bitrate 320 -n htdemucs --two-stems=vocals --clip-mode rescale --overlap 0.25 "${inputPath}" -o "${outputDir}"`;
  console.log('Executing command:', command);

  const process = exec(command);

  // Track process output
  process.stdout.on('data', (data) => {
    console.log('Demucs output:', data.toString());
  });

  process.stderr.on('data', (data) => {
    console.error('Demucs error:', data.toString());
  });

  process.on('close', (code) => {
    console.log('Demucs process exited with code:', code);

    if (code !== 0) {
      console.error('Process failed with code:', code);
      return res.status(500).json({ error: 'Failed to process audio' });
    }

    // Get paths to generated files
    const baseFilename = path.parse(inputFile).name;
    const outputFiles = {
      vocals: path.join(outputDir, 'htdemucs', baseFilename, 'vocals.mp3'),
      instrumental: path.join(outputDir, 'htdemucs', baseFilename, 'no_vocals.mp3')
    };

    console.log('Generated output files:', outputFiles);
    res.json({
      message: 'Audio separated successfully',
      files: outputFiles
    });
  });

  process.on('error', (error) => {
    console.error('Failed to start Demucs process:', error);
    res.status(500).json({ error: 'Failed to start audio processing' });
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // A Multer error occurred when uploading
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'File is too large. Maximum size is 10MB.' });
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