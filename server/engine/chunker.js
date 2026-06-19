const { validateData } = require('./validator');
const { autoCorrectData } = require('./autoCorrect');
const { detectDuplicates } = require('./duplicateDetector');
const { calculateQualityScore } = require('./qualityScorer');
const { generateCleanFile, generateAnnotatedReport } = require('./reportGenerator');
const { parseFile, getFileType } = require('../utils/fileHelpers');
const { 
  updateJobStatus, updateJobResults, bulkInsertErrors, bulkInsertAudit 
} = require('../db/database');
const path = require('path');

// Simulated SSE progress emitter (to be wired to an actual Express SSE route if needed)
const activeJobs = new Map();

function emitProgress(jobId, progress, stage) {
  if (activeJobs.has(jobId)) {
    activeJobs.get(jobId)(progress, stage);
  }
}

function registerProgressCallback(jobId, cb) {
  activeJobs.set(jobId, cb);
}

/**
 * Main processing pipeline orchestrator
 */
async function processFilePipeline(jobId, filePath, originalFilename, countryCode) {
  const startTime = Date.now();
  try {
    updateJobStatus.run('processing', jobId);
    emitProgress(jobId, 10, 'Parsing File');
    
    // 1. Detect and Parse
    const fileType = getFileType(originalFilename, null);
    const rawData = await parseFile(filePath, fileType);
    const totalRows = rawData.length;
    
    if (totalRows === 0) {
      throw new Error('File is empty or could not be parsed');
    }

    // Since this is a simple implementation, we process all rows at once.
    // For a true "chunker", we would slice rawData and process in loops.
    // Given memory limits, Node can comfortably handle 10k-50k rows in memory like this.
    // Chunking logic:
    const CHUNK_SIZE = 5000;
    let allErrors = [];
    let allAudits = [];
    let allCorrectedData = [];
    
    // Process in chunks
    for (let i = 0; i < totalRows; i += CHUNK_SIZE) {
      const chunk = rawData.slice(i, i + CHUNK_SIZE);
      const chunkProgress = 10 + Math.floor((i / totalRows) * 30);
      emitProgress(jobId, chunkProgress, `Validating Chunk ${Math.floor(i/CHUNK_SIZE) + 1}`);
      
      // 2. Validate
      const { errors: chunkErrors } = validateData(chunk, countryCode, jobId);
      allErrors = allErrors.concat(chunkErrors);
      
      emitProgress(jobId, chunkProgress + 10, `Auto-Correcting Chunk ${Math.floor(i/CHUNK_SIZE) + 1}`);
      // 3. Auto-Correct
      const { correctedData, auditLogs } = autoCorrectData(chunk, countryCode, jobId);
      allAudits = allAudits.concat(auditLogs);
      allCorrectedData = allCorrectedData.concat(correctedData);
    }

    emitProgress(jobId, 60, 'Detecting Duplicates');
    // 4. Duplicate Detection (Needs full dataset context ideally, so run on combined corrected data)
    const { errors: duplicateErrors, duplicateRowsCount } = detectDuplicates(allCorrectedData, jobId);
    allErrors = allErrors.concat(duplicateErrors);

    emitProgress(jobId, 70, 'Calculating Quality Score');
    // 5. Quality Score
    const qualityMetrics = calculateQualityScore(totalRows, allErrors, duplicateRowsCount, allCorrectedData);

    emitProgress(jobId, 80, 'Generating Reports');
    // 6. Generate Outputs
    // Ensure allAudits have original data context if needed, but our engine modified objects directly.
    const cleanFileName = await generateCleanFile(allCorrectedData, jobId);
    const reportFileName = await generateAnnotatedReport(rawData, allErrors, allAudits, qualityMetrics, jobId);

    emitProgress(jobId, 90, 'Saving Results');
    // 7. Save to Database
    bulkInsertErrors(allErrors);
    bulkInsertAudit(allAudits);
    
    // Calculate stats
    const validRows = totalRows - new Set(allErrors.map(e => e.rowNumber)).size;
    const correctedRows = new Set(allAudits.map(a => a.rowNumber)).size;
    const errorRows = new Set(allErrors.map(e => e.rowNumber)).size;
    const processingTime = Date.now() - startTime;
    
    updateJobResults.run(
      totalRows, validRows, correctedRows, duplicateRowsCount, errorRows,
      qualityMetrics.qualityScore, qualityMetrics.qualityGrade,
      qualityMetrics.completenessScore, qualityMetrics.validityScore,
      qualityMetrics.consistencyScore, qualityMetrics.uniquenessScore,
      processingTime,
      cleanFileName, reportFileName,
      jobId
    );

    emitProgress(jobId, 100, 'Done');
    activeJobs.delete(jobId);
    
    return { success: true, jobId };

  } catch (err) {
    console.error(`Job ${jobId} Failed:`, err);
    updateJobStatus.run('failed', jobId);
    emitProgress(jobId, -1, `Failed: ${err.message}`);
    activeJobs.delete(jobId);
    throw err;
  }
}

module.exports = {
  processFilePipeline,
  registerProgressCallback
};
