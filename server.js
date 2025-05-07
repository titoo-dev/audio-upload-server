const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
// const { exec } = require('child_process');

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
        mimetype: req.file.mimetype
      }
    });
  } catch (error) {
    console.error('Error handling upload:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});


// Route to execute process on uploaded file
// app.post('/process/:filename', (req, res) => {
//   const filename = req.params.filename;
//   const filePath = path.join(__dirname, 'uploads', filename);

//   if (!fs.existsSync(filePath)) {
//     return res.status(404).json({ error: 'File not found' });
//   }

//   exec(`ffmpeg -i ${filePath} -f null -`, (error, stdout, stderr) => {
//     if (error) {
//       console.error(`Process error: ${error}`);
//       return res.status(500).json({ error: 'Process execution failed' });
//     }
//     res.json({ message: 'Process completed successfully' });
//   });
// });

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