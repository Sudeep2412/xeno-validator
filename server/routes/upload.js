const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { createJob, updateJobStatus } = require('../db/database');
const { processFilePipeline } = require('../engine/chunker');

const UPLOADS_DIR = path.join(__dirname, '../../uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOADS_DIR);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    const allowedExtensions = ['.csv', '.xlsx', '.json'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only CSV, Excel, and JSON are allowed.'));
    }
  }
});

/**
 * POST /api/v1/upload
 * Accept CSV/Excel/JSON via multipart form, create job, and start processing
 */
router.post('/', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const countryCode = req.body.countryCode || 'IN';
    const jobId = uuidv4();
    const filePath = req.file.path;
    const fileType = path.extname(req.file.originalname).toLowerCase().replace('.', '');
    
    // Create DB record
    createJob.run(jobId, req.file.filename, req.file.originalname, fileType, countryCode);

    // Start background processing pipeline (fire and forget for true async)
    // In a real app we might use a queue (BullMQ/Redis) but for now we just 
    // run it asynchronously in the Node event loop
    processFilePipeline(jobId, filePath, req.file.originalname, countryCode)
      .catch(err => {
        console.error(`Pipeline failed for job ${jobId}:`, err);
      });

    // Return immediately to client
    res.status(202).json({
      message: 'File accepted for processing',
      jobId: jobId,
      status: 'processing'
    });

  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/upload/preview
 * Accept file, parse first 5 rows, and return without creating a job
 */
router.post('/preview', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { parseFile, getFileType } = require('../utils/fileHelpers');
    const filePath = req.file.path;
    const fileType = getFileType(req.file.originalname, req.file.mimetype);

    try {
      const rawData = await parseFile(filePath, fileType);
      const previewData = rawData.slice(0, 5);
      
      // Clean up the temporary file used for preview
      fs.unlinkSync(filePath);
      
      res.status(200).json({ preview: previewData, totalRows: rawData.length });
    } catch (parseErr) {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      throw parseErr;
    }

  } catch (err) {
    next(err);
  }
});

module.exports = router;
