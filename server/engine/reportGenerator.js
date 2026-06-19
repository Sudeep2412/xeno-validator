const exceljs = require('exceljs');
const { parse } = require('json2csv');
const path = require('path');
const fs = require('fs');

const OUTPUTS_DIR = path.join(__dirname, '../../outputs');
if (!fs.existsSync(OUTPUTS_DIR)) {
  fs.mkdirSync(OUTPUTS_DIR, { recursive: true });
}

/**
 * Generates a clean CSV file
 */
async function generateCleanFile(data, jobId) {
  return new Promise((resolve, reject) => {
    try {
      const fileName = `clean_${jobId}.csv`;
      const filePath = path.join(OUTPUTS_DIR, fileName);
      
      const csv = parse(data);
      fs.writeFileSync(filePath, csv);
      
      resolve(fileName);
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Generates an annotated Excel report with highlighted errors and comments
 */
async function generateAnnotatedReport(originalData, errors, auditLogs, qualityMetrics, jobId) {
  const fileName = `report_${jobId}.xlsx`;
  const filePath = path.join(OUTPUTS_DIR, fileName);
  
  const workbook = new exceljs.Workbook();
  workbook.creator = 'XenoValidator';
  workbook.created = new Date();

  // --- SHEET 1: Summary ---
  const summarySheet = workbook.addWorksheet('Summary');
  summarySheet.columns = [
    { header: 'Metric', key: 'metric', width: 30 },
    { header: 'Value', key: 'value', width: 20 }
  ];
  
  summarySheet.addRow({ metric: 'Job ID', value: jobId });
  summarySheet.addRow({ metric: 'Quality Score', value: `${qualityMetrics.qualityScore}/100` });
  summarySheet.addRow({ metric: 'Quality Grade', value: qualityMetrics.qualityGrade });
  summarySheet.addRow({});
  summarySheet.addRow({ metric: 'Completeness', value: `${qualityMetrics.completenessScore}%` });
  summarySheet.addRow({ metric: 'Validity', value: `${qualityMetrics.validityScore}%` });
  summarySheet.addRow({ metric: 'Uniqueness', value: `${qualityMetrics.uniquenessScore}%` });
  summarySheet.addRow({ metric: 'Consistency', value: `${qualityMetrics.consistencyScore}%` });
  summarySheet.addRow({});
  summarySheet.addRow({ metric: 'Total Rows Analyzed', value: originalData.length });
  summarySheet.addRow({ metric: 'Rows with Errors', value: new Set(errors.map(e => e.rowNumber)).size });
  summarySheet.addRow({ metric: 'Rows Auto-Corrected', value: new Set(auditLogs.map(a => a.rowNumber)).size });
  
  summarySheet.getRow(1).font = { bold: true };
  
  // --- SHEET 2: Annotated Data ---
  const dataSheet = workbook.addWorksheet('Annotated Data');
  
  if (originalData.length > 0) {
    const headers = Object.keys(originalData[0]);
    dataSheet.columns = headers.map(h => ({ header: h, key: h, width: 20 }));
    
    // Add data
    dataSheet.addRows(originalData);
    
    dataSheet.getRow(1).font = { bold: true };
    dataSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD3D3D3' } };

    // Group errors and audits by row and field for easy lookup
    const errorMap = {}; // { rowNumber: { field: [error1, error2] } }
    errors.forEach(err => {
      if (!errorMap[err.rowNumber]) errorMap[err.rowNumber] = {};
      if (!errorMap[err.rowNumber][err.field]) errorMap[err.rowNumber][err.field] = [];
      errorMap[err.rowNumber][err.field].push(err);
    });

    const auditMap = {}; // { rowNumber: { field: [audit] } }
    auditLogs.forEach(audit => {
      if (!auditMap[audit.rowNumber]) auditMap[audit.rowNumber] = {};
      if (!auditMap[audit.rowNumber][audit.field]) auditMap[audit.rowNumber][audit.field] = [];
      auditMap[audit.rowNumber][audit.field].push(audit);
    });

    // Apply highlights and comments
    originalData.forEach((row, index) => {
      const rowNumber = index + 2; // +1 for 1-based index in Excel, +1 for header row
      
      headers.forEach((header, colIndex) => {
        const cell = dataSheet.getCell(rowNumber, colIndex + 1);
        
        const cellErrors = errorMap[rowNumber] && errorMap[rowNumber][header];
        const cellAudits = auditMap[rowNumber] && auditMap[rowNumber][header];
        
        let commentText = '';
        
        if (cellErrors && cellErrors.length > 0) {
          // Highlight Red for Error
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC7CE' } };
          cell.font = { color: { argb: 'FF9C0006' } };
          
          commentText += 'ERRORS:\n' + cellErrors.map(e => `- [${e.errorType}] ${e.message}`).join('\n');
        } 
        else if (cellAudits && cellAudits.length > 0) {
          // Highlight Yellow for Auto-corrected
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEB9C' } };
          cell.font = { color: { argb: 'FF9C6500' } };
          
          commentText += 'AUTO-CORRECTED:\n' + cellAudits.map(a => `- [${a.action}] Changed to: ${a.correctedValue}`).join('\n');
        }
        
        if (commentText) {
          cell.note = commentText;
        }
      });
    });
  }

  // --- SHEET 3: Audit Trail ---
  const auditSheet = workbook.addWorksheet('Audit Trail');
  auditSheet.columns = [
    { header: 'Row Number', key: 'rowNumber', width: 15 },
    { header: 'Field', key: 'field', width: 20 },
    { header: 'Action', key: 'action', width: 30 },
    { header: 'Original Value', key: 'originalValue', width: 30 },
    { header: 'Corrected Value', key: 'correctedValue', width: 30 }
  ];
  auditSheet.addRows(auditLogs);
  auditSheet.getRow(1).font = { bold: true };

  await workbook.xlsx.writeFile(filePath);
  return fileName;
}

module.exports = {
  generateCleanFile,
  generateAnnotatedReport
};
