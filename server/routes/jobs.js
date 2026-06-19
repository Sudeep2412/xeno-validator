const express = require('express');
const router = express.Router();
const { 
  getAllJobs, getJob, getErrorSummary, getAuditSummary, getJobErrors, getJobAudit 
} = require('../db/database');

/**
 * GET /api/v1/jobs
 * List all jobs
 */
router.get('/', (req, res, next) => {
  try {
    const jobs = getAllJobs.all();
    res.json(jobs);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/jobs/:id
 * Get full job details, quality scores, and summaries
 */
router.get('/:id', (req, res, next) => {
  try {
    const { id } = req.params;
    const job = getJob.get(id);
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    // Only fetch summaries if the job is done
    if (job.status === 'done') {
      const errorSummary = getErrorSummary.all(id);
      const auditSummary = getAuditSummary.all(id);
      
      // We can also fetch the full errors/audits if explicitly requested,
      // but usually we just want the summary for the dashboard initial load
      const fullErrors = req.query.full === 'true' ? getJobErrors.all(id) : [];
      const fullAudits = req.query.full === 'true' ? getJobAudit.all(id) : [];
      
      return res.json({
        ...job,
        errorSummary,
        auditSummary,
        errors: fullErrors,
        audits: fullAudits
      });
    }
    
    res.json(job);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/jobs/:id/errors
 * Paginated or full error list for the table view
 */
router.get('/:id/errors', (req, res, next) => {
  try {
    const { id } = req.params;
    const errors = getJobErrors.all(id);
    res.json(errors);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/jobs/:id/audits
 * Full audit list for the dashboard
 */
router.get('/:id/audits', (req, res, next) => {
  try {
    const { id } = req.params;
    const audits = getJobAudit.all(id);
    res.json(audits);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
