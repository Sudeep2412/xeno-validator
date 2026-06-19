const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Routes
const uploadRouter = require('./routes/upload');
const validateRouter = require('./routes/validate');
const rulesRouter = require('./routes/rules');
const jobsRouter = require('./routes/jobs');
const downloadRouter = require('./routes/download');

// Middleware & Utilities
const errorHandler = require('./middleware/errorHandler');
const { registerProgressCallback } = require('./engine/chunker');

const app = express();
const PORT = process.env.PORT || 3001;

// Basic middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// API Routes
app.use('/api/v1/upload', uploadRouter);
app.use('/api/v1/validate', validateRouter);
app.use('/api/v1/rules', rulesRouter);
app.use('/api/v1/jobs', jobsRouter);
app.use('/api/v1/download', downloadRouter);

// SSE Endpoint for real-time progress
app.get('/api/v1/progress/:jobId', (req, res) => {
  const { jobId } = req.params;
  
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Prevents Railway/Nginx from buffering SSE
  
  res.flushHeaders();
  
  // Send initial ping to establish connection
  res.write(`data: ${JSON.stringify({ progress: 0, stage: 'Connecting...', status: 'connecting' })}\n\n`);

  const { getJob } = require('./db/database');
  const job = getJob.get(jobId);
  if (job) {
    if (job.status === 'done') {
      res.write(`data: ${JSON.stringify({ progress: 100, stage: 'Done', status: 'done' })}\n\n`);
      return res.end();
    }
    if (job.status === 'failed') {
      res.write(`data: ${JSON.stringify({ progress: -1, stage: 'Failed', status: 'failed' })}\n\n`);
      return res.end();
    }
  }

  // Register callback for this job
  registerProgressCallback(jobId, (progress, stage) => {
    let status = 'processing';
    if (progress === 100) status = 'done';
    if (progress < 0) status = 'failed';
    
    res.write(`data: ${JSON.stringify({ progress, stage, status })}\n\n`);
    
    if (status === 'done' || status === 'failed') {
      res.end();
    }
  });

  // Handle client disconnect
  req.on('close', () => {
    // We could clean up the callback here, but leaving it is harmless
    // since it just won't write to the closed stream
  });
});



// Serve static frontend files in production (For Easy Deployment)
const clientBuildPath = path.join(__dirname, '../client/dist');
app.use(express.static(clientBuildPath));

// Catch-all route to serve React app for client-side routing
app.get('*', (req, res) => {
  if (fs.existsSync(clientBuildPath)) {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  } else {
    res.status(404).send('Frontend build not found. Run npm run build in client directory.');
  }
});

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 XenoValidator Server running on http://localhost:${PORT}`);
  
  // Ensure required directories exist
  const dirs = ['../data', '../uploads', '../outputs'];
  dirs.forEach(dir => {
    const fullPath = path.join(__dirname, dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
  });
});
