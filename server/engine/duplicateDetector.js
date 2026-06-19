const crypto = require('crypto');

/**
 * Detects exact and fuzzy duplicates in the dataset
 */
function detectDuplicates(data, jobId) {
  const errors = [];
  let duplicateRowsCount = 0;
  
  // Track seen hashes for exact matches
  const seenHashes = new Map(); // hash -> { rowNumber, index }
  
  // Track seen customers for fuzzy matching (assuming customer_id exists)
  const seenCustomers = new Map(); // customer_id -> [{ rowNumber, amount, timestamp, ... }]

  // Levenshtein distance helper for fuzzy name matching
  const getLevenshteinDistance = (a, b) => {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    
    const matrix = [];
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            Math.min(
              matrix[i][j - 1] + 1, // insertion
              matrix[i - 1][j] + 1  // deletion
            )
          );
        }
      }
    }
    return matrix[b.length][a.length];
  };

  data.forEach((row, index) => {
    const rowNumber = index + 2; // Assuming row 1 is headers
    let isDuplicate = false;

    // 1. Exact Match Detection
    // Create a hash of the entire row (ignoring minor whitespace)
    const rowString = Object.values(row).map(v => String(v).trim().toLowerCase()).join('|');
    const hash = crypto.createHash('md5').update(rowString).digest('hex');

    if (seenHashes.has(hash)) {
      const originalRow = seenHashes.get(hash);
      errors.push({
        jobId,
        rowNumber,
        field: 'row',
        errorType: 'EXACT_DUPLICATE',
        message: `Row is an exact duplicate of row ${originalRow.rowNumber}`,
        severity: 'error',
        originalValue: null
      });
      isDuplicate = true;
    } else {
      seenHashes.set(hash, { rowNumber, index });
    }

    // 2. Fuzzy Match Detection (if not already an exact duplicate)
    if (!isDuplicate && row.customer_id) {
      const customerId = String(row.customer_id).trim();
      const previousRecords = seenCustomers.get(customerId) || [];
      
      // Look for fuzzy matches among previous records for this customer
      for (const prev of previousRecords) {
        let isFuzzyDuplicate = false;
        let fuzzyReason = '';

        // Case A: Transaction dataset check (same amount + near timestamp)
        // Note: The sample dataset doesn't have amount/timestamp, but we handle it if present
        if (row.amount && prev.amount && row.amount === prev.amount) {
          // If we have timestamp, check if within 60s
          if (row.timestamp && prev.timestamp) {
             const t1 = new Date(row.timestamp).getTime();
             const t2 = new Date(prev.timestamp).getTime();
             if (!isNaN(t1) && !isNaN(t2) && Math.abs(t1 - t2) < 60000) {
                 isFuzzyDuplicate = true;
                 fuzzyReason = 'Same customer, amount, and timestamp within 60s';
             }
          } else {
             // If no timestamp but same amount, flag as possible duplicate transaction
             isFuzzyDuplicate = true;
             fuzzyReason = 'Same customer and amount (potential double-charge)';
          }
        }
        
        // Case B: Customer dataset check (Same name typo check, assuming same email/phone)
        if (!isFuzzyDuplicate && row.full_name && prev.full_name) {
          // If they have the same email or phone but names are slightly different
          const sameEmail = row.email && prev.email && row.email.toLowerCase() === prev.email.toLowerCase();
          const samePhone = row.phone_number && prev.phone_number && String(row.phone_number).replace(/\D/g, '') === String(prev.phone_number).replace(/\D/g, '');
          
          if (sameEmail || samePhone) {
            const name1 = String(row.full_name).toLowerCase();
            const name2 = String(prev.full_name).toLowerCase();
            const dist = getLevenshteinDistance(name1, name2);
            
            // If names are different but very close (1-2 chars)
            if (dist > 0 && dist <= 2) {
              isFuzzyDuplicate = true;
              fuzzyReason = `Likely same customer as row ${prev.rowNumber} (Name typo: '${row.full_name}' vs '${prev.full_name}')`;
            }
          }
        }

        if (isFuzzyDuplicate) {
          errors.push({
            jobId,
            rowNumber,
            field: 'customer_id',
            errorType: 'FUZZY_DUPLICATE',
            message: fuzzyReason || `Potential duplicate transaction of row ${prev.rowNumber}`,
            severity: 'warning',
            originalValue: customerId
          });
          isDuplicate = true;
          break; // Stop checking previous records for this row once flagged
        }
      }

      // Add current row to seen customers for future comparisons
      previousRecords.push({
        rowNumber,
        amount: row.amount,
        timestamp: row.timestamp,
        full_name: row.full_name,
        email: row.email,
        phone_number: row.phone_number
      });
      seenCustomers.set(customerId, previousRecords);
    }

    if (isDuplicate) {
      duplicateRowsCount++;
    }
  });

  return { errors, duplicateRowsCount };
}

module.exports = {
  detectDuplicates
};
