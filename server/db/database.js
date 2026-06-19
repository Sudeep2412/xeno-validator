const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '..', 'data', 'xeno_validator.db');

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ─── Schema ───────────────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS jobs (
    id TEXT PRIMARY KEY,
    filename TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    file_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    country_code TEXT DEFAULT 'IN',
    total_rows INTEGER DEFAULT 0,
    valid_rows INTEGER DEFAULT 0,
    corrected_rows INTEGER DEFAULT 0,
    duplicate_rows INTEGER DEFAULT 0,
    error_rows INTEGER DEFAULT 0,
    quality_score REAL DEFAULT 0,
    quality_grade TEXT DEFAULT 'F',
    completeness_score REAL DEFAULT 0,
    validity_score REAL DEFAULT 0,
    consistency_score REAL DEFAULT 0,
    uniqueness_score REAL DEFAULT 0,
    processing_time_ms INTEGER DEFAULT 0,
    clean_file_path TEXT,
    report_file_path TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME
  );

  CREATE TABLE IF NOT EXISTS error_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id TEXT NOT NULL,
    row_number INTEGER NOT NULL,
    field TEXT NOT NULL,
    error_type TEXT NOT NULL,
    message TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'error',
    original_value TEXT,
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id TEXT NOT NULL,
    row_number INTEGER NOT NULL,
    field TEXT NOT NULL,
    action TEXT NOT NULL,
    original_value TEXT,
    corrected_value TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS country_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    country_code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    phone_length INTEGER NOT NULL,
    phone_regex TEXT NOT NULL,
    phone_prefixes TEXT DEFAULT '[]',
    date_formats TEXT DEFAULT '["YYYY-MM-DD"]',
    currency_code TEXT,
    currency_symbol TEXT,
    postal_code_regex TEXT,
    is_custom INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_error_log_job ON error_log(job_id);
  CREATE INDEX IF NOT EXISTS idx_audit_log_job ON audit_log(job_id);
  CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
  CREATE INDEX IF NOT EXISTS idx_jobs_created ON jobs(created_at);
`);

// ─── Job Operations ───────────────────────────────────────────────

const createJob = db.prepare(`
  INSERT INTO jobs (id, filename, original_filename, file_type, status, country_code)
  VALUES (?, ?, ?, ?, 'processing', ?)
`);

const updateJobStatus = db.prepare(`
  UPDATE jobs SET status = ?, completed_at = CURRENT_TIMESTAMP WHERE id = ?
`);

const updateJobResults = db.prepare(`
  UPDATE jobs SET
    total_rows = ?, valid_rows = ?, corrected_rows = ?, duplicate_rows = ?,
    error_rows = ?, quality_score = ?, quality_grade = ?,
    completeness_score = ?, validity_score = ?, consistency_score = ?,
    uniqueness_score = ?, processing_time_ms = ?,
    clean_file_path = ?, report_file_path = ?,
    status = 'done', completed_at = CURRENT_TIMESTAMP
  WHERE id = ?
`);

const getJob = db.prepare(`SELECT * FROM jobs WHERE id = ?`);
const getAllJobs = db.prepare(`SELECT * FROM jobs ORDER BY created_at DESC`);
const getRecentJobs = db.prepare(`SELECT * FROM jobs ORDER BY created_at DESC LIMIT ?`);

// ─── Error Log Operations ─────────────────────────────────────────

const insertError = db.prepare(`
  INSERT INTO error_log (job_id, row_number, field, error_type, message, severity, original_value)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const getJobErrors = db.prepare(`SELECT * FROM error_log WHERE job_id = ? ORDER BY row_number, field`);

const getErrorSummary = db.prepare(`
  SELECT error_type, COUNT(*) as count, severity
  FROM error_log WHERE job_id = ?
  GROUP BY error_type, severity
  ORDER BY count DESC
`);

// ─── Audit Log Operations ─────────────────────────────────────────

const insertAudit = db.prepare(`
  INSERT INTO audit_log (job_id, row_number, field, action, original_value, corrected_value)
  VALUES (?, ?, ?, ?, ?, ?)
`);

const getJobAudit = db.prepare(`SELECT * FROM audit_log WHERE job_id = ? ORDER BY row_number, field`);

const getAuditSummary = db.prepare(`
  SELECT action, field, COUNT(*) as count
  FROM audit_log WHERE job_id = ?
  GROUP BY action, field
  ORDER BY count DESC
`);

// ─── Country Rules Operations ─────────────────────────────────────

const insertCountryRule = db.prepare(`
  INSERT OR REPLACE INTO country_rules
    (country_code, name, phone_length, phone_regex, phone_prefixes, date_formats,
     currency_code, currency_symbol, postal_code_regex, is_custom, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
`);

const getCountryRule = db.prepare(`SELECT * FROM country_rules WHERE country_code = ?`);
const getAllCountryRules = db.prepare(`SELECT * FROM country_rules ORDER BY country_code`);
const deleteCountryRule = db.prepare(`DELETE FROM country_rules WHERE country_code = ?`);

// ─── Bulk Insert Helpers ──────────────────────────────────────────

const bulkInsertErrors = db.transaction((errors) => {
  for (const err of errors) {
    insertError.run(err.jobId, err.rowNumber, err.field, err.errorType, err.message, err.severity, err.originalValue);
  }
});

const bulkInsertAudit = db.transaction((audits) => {
  for (const audit of audits) {
    insertAudit.run(audit.jobId, audit.rowNumber, audit.field, audit.action, audit.originalValue, audit.correctedValue);
  }
});

// ─── Seed Default Country Rules ───────────────────────────────────

function seedDefaultRules() {
  const defaultRules = require('../config/countryRules.json');
  const existingCount = db.prepare('SELECT COUNT(*) as count FROM country_rules').get().count;

  if (existingCount === 0) {
    const insertRule = db.transaction(() => {
      for (const [code, rule] of Object.entries(defaultRules)) {
        insertCountryRule.run(
          code, rule.name, rule.phoneLength, rule.phoneRegex,
          JSON.stringify(rule.phonePrefixes || []),
          JSON.stringify(rule.dateFormats || ['YYYY-MM-DD']),
          rule.currencyCode || null, rule.currencySymbol || null,
          rule.postalCodeRegex || null, 0
        );
      }
    });
    insertRule();
    console.log(`✓ Seeded ${Object.keys(defaultRules).length} default country rules`);
  }
}

seedDefaultRules();

// ─── Exports ──────────────────────────────────────────────────────

module.exports = {
  db,
  // Jobs
  createJob, updateJobStatus, updateJobResults, getJob, getAllJobs, getRecentJobs,
  // Errors
  insertError, getJobErrors, getErrorSummary, bulkInsertErrors,
  // Audit
  insertAudit, getJobAudit, getAuditSummary, bulkInsertAudit,
  // Country Rules
  insertCountryRule, getCountryRule, getAllCountryRules, deleteCountryRule
};
