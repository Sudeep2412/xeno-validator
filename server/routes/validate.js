const express = require('express');
const router = express.Router();
const { validateData } = require('../engine/validator');
const { autoCorrectData } = require('../engine/autoCorrect');
const { detectDuplicates } = require('../engine/duplicateDetector');
const { calculateQualityScore } = require('../engine/qualityScorer');

/**
 * POST /api/v1/validate
 * REST API endpoint for synchronous validation of JSON data array.
 * Differentiator: Validates direct payload rather than a file.
 */
router.post('/', (req, res, next) => {
  try {
    const { data, countryCode = 'IN' } = req.body;

    if (!data || !Array.isArray(data)) {
      return res.status(400).json({ error: 'Payload must contain a "data" array' });
    }

    if (data.length === 0) {
      return res.status(400).json({ error: 'Data array is empty' });
    }
    
    // We limit synchronous payload to avoid blocking the event loop too long
    if (data.length > 5000) {
      return res.status(413).json({ 
        error: 'Payload too large for synchronous validation. Max 5000 records. Use /upload endpoint instead.' 
      });
    }

    // Run pipeline synchronously for the payload
    const jobId = 'sync-' + Date.now();
    const totalRows = data.length;

    const { errors: validationErrors } = validateData(data, countryCode, jobId);
    const { correctedData, auditLogs } = autoCorrectData(data, countryCode, jobId);
    const { errors: duplicateErrors, duplicateRowsCount } = detectDuplicates(correctedData, jobId);
    
    const allErrors = [...validationErrors, ...duplicateErrors];
    const qualityMetrics = calculateQualityScore(totalRows, allErrors, duplicateRowsCount, correctedData);

    // Group errors by row for easier consumption
    const errorsByRow = {};
    allErrors.forEach(err => {
      if (!errorsByRow[err.rowNumber]) errorsByRow[err.rowNumber] = [];
      errorsByRow[err.rowNumber].push({
        field: err.field,
        type: err.errorType,
        message: err.message,
        severity: err.severity
      });
    });

    res.status(200).json({
      meta: {
        totalRows,
        validRows: totalRows - Object.keys(errorsByRow).length,
        qualityScore: qualityMetrics.qualityScore,
        grade: qualityMetrics.qualityGrade,
        countryCode
      },
      results: correctedData.map((row, idx) => {
        const rowNumber = idx + 2;
        return {
          rowNumber,
          data: row,
          isValid: !errorsByRow[rowNumber],
          errors: errorsByRow[rowNumber] || []
        };
      })
    });

  } catch (err) {
    next(err);
  }
});

module.exports = router;
