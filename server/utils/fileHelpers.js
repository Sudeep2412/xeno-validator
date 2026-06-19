const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const exceljs = require('exceljs');

/**
 * Detects file type from extension and mime type
 */
function getFileType(filename, mimetype) {
  const ext = path.extname(filename).toLowerCase();
  
  if (ext === '.csv' || mimetype === 'text/csv') return 'csv';
  if (ext === '.xlsx' || mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') return 'xlsx';
  if (ext === '.json' || mimetype === 'application/json') return 'json';
  
  return 'unknown';
}

/**
 * Parses any supported file into an array of row objects
 */
async function parseFile(filePath, fileType) {
  return new Promise(async (resolve, reject) => {
    try {
      const results = [];
      
      if (fileType === 'csv') {
        fs.createReadStream(filePath)
          .pipe(csv())
          .on('data', (data) => results.push(data))
          .on('end', () => resolve(results))
          .on('error', reject);
          
      } else if (fileType === 'xlsx') {
        const workbook = new exceljs.Workbook();
        await workbook.xlsx.readFile(filePath);
        const worksheet = workbook.worksheets[0]; // Get first sheet
        
        let headers = [];
        worksheet.eachRow((row, rowNumber) => {
          if (rowNumber === 1) {
            // First row is headers
            row.eachCell((cell, colNumber) => {
              headers[colNumber] = cell.value ? cell.value.toString().trim() : `Column${colNumber}`;
            });
          } else {
            // Data rows
            const rowData = {};
            row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
              const header = headers[colNumber];
              if (header) {
                // Handle dates from excel
                let value = cell.value;
                if (value instanceof Date) {
                  value = value.toISOString().split('T')[0]; // Format as YYYY-MM-DD
                } else if (value && typeof value === 'object' && value.text) {
                   value = value.text; // Handle rich text
                } else if (value && typeof value === 'object' && value.hyperlink) {
                   value = value.hyperlink; // Handle hyperlinks
                }
                
                rowData[header] = value !== null && value !== undefined ? String(value).trim() : '';
              }
            });
            results.push(rowData);
          }
        });
        resolve(results);
        
      } else if (fileType === 'json') {
        const data = fs.readFileSync(filePath, 'utf8');
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          resolve(parsed);
        } else {
          // If it's an object with a data array, extract it, else wrap in array
          resolve(parsed.data && Array.isArray(parsed.data) ? parsed.data : [parsed]);
        }
      } else {
        reject(new Error(`Unsupported file type: ${fileType}`));
      }
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = {
  getFileType,
  parseFile
};
