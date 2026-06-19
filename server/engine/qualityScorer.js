/**
 * Calculates a Data Quality Score (0-100) and grade based on various metrics
 */
function calculateQualityScore(totalRows, validationErrors, duplicateErrors, data) {
  if (totalRows === 0) {
    return {
      qualityScore: 0,
      qualityGrade: 'F',
      completenessScore: 0,
      validityScore: 0,
      consistencyScore: 0,
      uniquenessScore: 0
    };
  }

  // 1. Completeness Score (30%)
  // % of rows that are not missing required fields
  const missingRequiredErrors = validationErrors.filter(e => e.errorType === 'MISSING_REQUIRED').length;
  // Estimate impacted rows (some rows might have multiple missing fields, so we cap at totalRows)
  const rowsWithMissingData = Math.min(missingRequiredErrors, totalRows);
  const completenessScore = ((totalRows - rowsWithMissingData) / totalRows) * 100;

  // 2. Validity Score (30%)
  // % of rows passing strict format validation (regex, length)
  const formatErrors = validationErrors.filter(e => ['INVALID_FORMAT', 'INVALID_LENGTH', 'INVALID_DATE'].includes(e.errorType)).length;
  const rowsWithFormatErrors = Math.min(formatErrors, totalRows);
  const validityScore = ((totalRows - rowsWithFormatErrors) / totalRows) * 100;

  // 3. Uniqueness Score (20%)
  // % of unique rows
  const uniquenessScore = ((totalRows - duplicateErrors) / totalRows) * 100;

  // 4. Consistency Score (20%)
  // We'll proxy consistency by looking at the variance in data formats across the dataset.
  // A simpler proxy: how many rows required auto-correction? 
  // Since we don't have the auto-correct count passed in this scope, we'll proxy it by the 
  // ratio of warnings to total rows, or default to 100 if we have no specific inconsistency markers.
  // Let's assume a baseline of 100 and subtract for any "warning" level errors.
  const warningErrors = validationErrors.filter(e => e.severity === 'warning').length;
  const impactedConsistencyRows = Math.min(warningErrors, totalRows);
  const consistencyScore = ((totalRows - impactedConsistencyRows) / totalRows) * 100;

  // Calculate Weighted Average
  const weights = {
    completeness: 0.30,
    validity: 0.30,
    uniqueness: 0.20,
    consistency: 0.20
  };

  let qualityScore = 
    (completenessScore * weights.completeness) +
    (validityScore * weights.validity) +
    (uniquenessScore * weights.uniqueness) +
    (consistencyScore * weights.consistency);
    
  qualityScore = Math.round(qualityScore * 10) / 10; // Round to 1 decimal place

  // Assign Letter Grade
  let qualityGrade = 'F';
  if (qualityScore >= 90) qualityGrade = 'A';
  else if (qualityScore >= 80) qualityGrade = 'B';
  else if (qualityScore >= 70) qualityGrade = 'C';
  else if (qualityScore >= 60) qualityGrade = 'D';

  return {
    qualityScore,
    qualityGrade,
    completenessScore: Math.round(completenessScore),
    validityScore: Math.round(validityScore),
    consistencyScore: Math.round(consistencyScore),
    uniquenessScore: Math.round(uniquenessScore)
  };
}

module.exports = {
  calculateQualityScore
};
