const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { getJob } = require('../db/database');

const OUTPUTS_DIR = path.join(__dirname, '../../outputs');

/**
 * Helper to download a file if it exists
 */
const downloadFile = (res, filePath, fallbackName) => {
  const fullPath = path.join(OUTPUTS_DIR, filePath);
  if (fs.existsSync(fullPath)) {
    res.download(fullPath, filePath || fallbackName);
  } else {
    res.status(404).json({ error: 'File not found on server' });
  }
};

/**
 * GET /api/v1/download/:id/clean
 * Download the clean CSV file
 */
router.get('/:id/clean', (req, res, next) => {
  try {
    const { id } = req.params;
    const job = getJob.get(id);
    
    if (!job || !job.clean_file_path) {
      return res.status(404).json({ error: 'Clean file not found for this job' });
    }
    
    downloadFile(res, job.clean_file_path, `clean_${id}.csv`);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/download/:id/report
 * Download the annotated Excel report
 */
router.get('/:id/report', (req, res, next) => {
  try {
    const { id } = req.params;
    const job = getJob.get(id);
    
    if (!job || !job.report_file_path) {
      return res.status(404).json({ error: 'Report file not found for this job' });
    }
    
    downloadFile(res, job.report_file_path, `report_${id}.xlsx`);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/download/:id/audit
 * Download the audit trail as CSV
 */
router.get('/:id/audit', (req, res, next) => {
  try {
    const { id } = req.params;
    const { getJobAudit } = require('../db/database');
    const { parse } = require('json2csv');
    
    const audits = getJobAudit.all(id);
    if (!audits || audits.length === 0) {
      return res.status(404).json({ error: 'No audit logs found for this job' });
    }
    
    const csv = parse(audits);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="audit_${id}.csv"`);
    res.send(csv);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
