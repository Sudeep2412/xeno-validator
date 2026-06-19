const { getCountryRule } = require('../db/database');

/**
 * Attempts to automatically correct data and logs all changes
 */
function autoCorrectData(data, countryCode, jobId) {
  const auditLogs = [];
  const correctedData = [];
  let correctedRowsCount = 0;
  
  // Get the specific rule for this country to aid in corrections
  const ruleRow = getCountryRule.get(countryCode);
  const phonePrefixes = ruleRow ? JSON.parse(ruleRow.phone_prefixes || '[]') : [];

  data.forEach((row, index) => {
    const rowNumber = index + 2; // Assuming row 1 is headers
    const newRow = { ...row };
    let rowModified = false;

    // 1. Whitespace Trimming (All fields)
    for (const key in newRow) {
      if (typeof newRow[key] === 'string') {
        const trimmed = newRow[key].trim();
        if (trimmed !== newRow[key]) {
          // We don't necessarily need to log every single whitespace trim as it's too noisy,
          // but we apply it to the data
          newRow[key] = trimmed;
        }
      }
    }

    // 2. Email Normalization
    if (newRow.email) {
      const lowerEmail = newRow.email.toLowerCase();
      if (lowerEmail !== newRow.email) {
        auditLogs.push({
          jobId,
          rowNumber,
          field: 'email',
          action: 'LOWERCASE_NORMALIZED',
          originalValue: newRow.email,
          correctedValue: lowerEmail
        });
        newRow.email = lowerEmail;
        rowModified = true;
      }
    }

    // 3. Phone Number Correction
    if (newRow.phone_number) {
      const originalPhone = newRow.phone_number;
      // Strip everything except digits and plus sign
      let cleanPhone = String(originalPhone).replace(/[^0-9+]/g, '');
      
      // Check if it starts with a country prefix and remove it if the raw number is requested
      // For instance, if prefix is +91 or 91 or 0 for India
      let prefixRemoved = false;
      for (const prefix of phonePrefixes) {
        if (cleanPhone.startsWith(prefix) && cleanPhone.length > prefix.length) {
          cleanPhone = cleanPhone.substring(prefix.length);
          prefixRemoved = true;
          break; // Stop at first matching prefix
        }
      }

      if (cleanPhone !== originalPhone) {
        auditLogs.push({
          jobId,
          rowNumber,
          field: 'phone_number',
          action: prefixRemoved ? 'FORMAT_AND_PREFIX_REMOVED' : 'FORMAT_CLEANED',
          originalValue: originalPhone,
          correctedValue: cleanPhone
        });
        newRow.phone_number = cleanPhone;
        rowModified = true;
      }
    }

    // 4. Date Normalization (Attempt to convert to YYYY-MM-DD)
    if (newRow.signup_date) {
      const origDate = newRow.signup_date;
      // Try to parse different formats. 
      // Simple logic: check if it matches YYYY-MM-DD already
      const isoRegex = /^\d{4}-\d{2}-\d{2}$/;
      
      if (!isoRegex.test(origDate)) {
         let newDate = origDate;
         
         // Try to parse DD-MM-YYYY or DD/MM/YYYY
         const ddMmYyyyRegex = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/;
         const match = origDate.match(ddMmYyyyRegex);
         if (match) {
           const day = match[1].padStart(2, '0');
           const month = match[2].padStart(2, '0');
           const year = match[3];
           newDate = `${year}-${month}-${day}`;
         } else {
           // Try JS Date parsing as fallback
           const parsedDate = new Date(origDate);
           if (!isNaN(parsedDate.getTime())) {
             newDate = parsedDate.toISOString().split('T')[0];
           }
         }

         if (newDate !== origDate && isoRegex.test(newDate)) {
           auditLogs.push({
             jobId,
             rowNumber,
             field: 'signup_date',
             action: 'DATE_FORMAT_NORMALIZED',
             originalValue: origDate,
             correctedValue: newDate
           });
           newRow.signup_date = newDate;
           rowModified = true;
         }
      }
    }

    // 5. City Title Case
    if (newRow.city) {
      const origCity = newRow.city;
      // Simple Title Case implementation
      const titleCaseCity = origCity.toLowerCase().split(' ').map(word => {
        return word.charAt(0).toUpperCase() + word.slice(1);
      }).join(' ');
      
      if (titleCaseCity !== origCity) {
        // We log city corrections to show off the audit trail
        auditLogs.push({
          jobId,
          rowNumber,
          field: 'city',
          action: 'TITLE_CASE_NORMALIZED',
          originalValue: origCity,
          correctedValue: titleCaseCity
        });
        newRow.city = titleCaseCity;
        rowModified = true;
      }
    }

    correctedData.push(newRow);
    if (rowModified) correctedRowsCount++;
  });

  return { correctedData, auditLogs, correctedRowsCount };
}

module.exports = {
  autoCorrectData
};
