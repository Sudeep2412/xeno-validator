const { getCountryRule } = require('../db/database');

/**
 * Validates a dataset against general rules and specific country rules
 */
function validateData(data, countryCode, jobId) {
  const errors = [];
  let validRowsCount = 0;
  
  // Get the specific rule for this country
  const ruleRow = getCountryRule.get(countryCode);
  
  // Fallback to minimal defaults if rule not found in DB
  const rules = ruleRow ? {
    phoneLength: ruleRow.phone_length,
    phoneRegex: new RegExp(ruleRow.phone_regex),
    dateFormats: JSON.parse(ruleRow.date_formats || '["YYYY-MM-DD"]')
  } : {
    phoneLength: 10,
    phoneRegex: /^\d{10}$/,
    dateFormats: ["YYYY-MM-DD", "DD/MM/YYYY"]
  };

  data.forEach((row, index) => {
    const rowNumber = index + 2; // Assuming row 1 is headers
    let isRowValid = true;

    // 1. Check Required Fields
    const requiredFields = ['customer_id', 'email', 'phone_number'];
    for (const field of requiredFields) {
      if (!row[field] || String(row[field]).trim() === '') {
        errors.push({
          jobId,
          rowNumber,
          field,
          errorType: 'MISSING_REQUIRED',
          message: `${field} is a required field but is missing or empty`,
          severity: 'error',
          originalValue: row[field]
        });
        isRowValid = false;
      }
    }

    // 2. Validate Email
    if (row.email && String(row.email).trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(String(row.email).trim())) {
        errors.push({
          jobId,
          rowNumber,
          field: 'email',
          errorType: 'INVALID_FORMAT',
          message: 'Email address format is invalid',
          severity: 'error',
          originalValue: row.email
        });
        isRowValid = false;
      }
    }

    // 3. Validate Phone Number (Country Specific)
    if (row.phone_number && String(row.phone_number).trim() !== '') {
      // Basic cleanup for validation (remove spaces, dashes)
      const cleanPhone = String(row.phone_number).replace(/[\s\-\(\)\.]/g, '');
      
      // Check length first (e.g., must be 10 digits for IN)
      // Note: Auto-correct might fix length issues if it has country code prefix,
      // but validator flags it if it doesn't match the strict raw rule
      
      // Try to match the exact regex
      if (!rules.phoneRegex.test(cleanPhone)) {
        // If it fails regex, check if it's just a length issue for better error message
        const digitCount = cleanPhone.replace(/\D/g, '').length;
        if (digitCount !== rules.phoneLength) {
          errors.push({
            jobId,
            rowNumber,
            field: 'phone_number',
            errorType: 'INVALID_LENGTH',
            message: `Phone has ${digitCount} digits, expected ${rules.phoneLength} for ${countryCode}`,
            severity: 'error',
            originalValue: row.phone_number
          });
        } else {
          errors.push({
            jobId,
            rowNumber,
            field: 'phone_number',
            errorType: 'INVALID_FORMAT',
            message: `Phone does not match required format for ${countryCode}`,
            severity: 'error',
            originalValue: row.phone_number
          });
        }
        isRowValid = false;
      }
    }

    // 4. Validate Date (Signup Date)
    if (row.signup_date && String(row.signup_date).trim() !== '') {
      // Very basic date validation - auto-correct will handle parsing/formatting
      // Just check if it looks somewhat like a date
      const dateStr = String(row.signup_date).trim();
      if (dateStr.length < 8) {
        errors.push({
          jobId,
          rowNumber,
          field: 'signup_date',
          errorType: 'INVALID_DATE',
          message: 'Date value is too short to be a valid date',
          severity: 'warning',
          originalValue: row.signup_date
        });
        // We'll mark as warning since auto-correct might still salvage it
      }
    }

    if (isRowValid) {
      validRowsCount++;
    }
  });

  return { errors, validRowsCount };
}

module.exports = {
  validateData
};
