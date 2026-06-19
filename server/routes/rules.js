const express = require('express');
const router = express.Router();
const { 
  getAllCountryRules, getCountryRule, insertCountryRule, deleteCountryRule 
} = require('../db/database');

/**
 * GET /api/v1/rules
 * List all country rules
 */
router.get('/', (req, res, next) => {
  try {
    const rules = getAllCountryRules.all();
    
    // Parse JSON string fields back to objects
    const formattedRules = rules.map(rule => ({
      ...rule,
      phone_prefixes: JSON.parse(rule.phone_prefixes || '[]'),
      date_formats: JSON.parse(rule.date_formats || '["YYYY-MM-DD"]')
    }));
    
    res.json(formattedRules);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/rules/:code
 * Get specific country rule
 */
router.get('/:code', (req, res, next) => {
  try {
    const { code } = req.params;
    const rule = getCountryRule.get(code.toUpperCase());
    
    if (!rule) {
      return res.status(404).json({ error: `Rule for country ${code} not found` });
    }
    
    rule.phone_prefixes = JSON.parse(rule.phone_prefixes || '[]');
    rule.date_formats = JSON.parse(rule.date_formats || '["YYYY-MM-DD"]');
    
    res.json(rule);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/rules
 * Create or update a country rule
 */
router.post('/', (req, res, next) => {
  try {
    const { 
      country_code, name, phone_length, phone_regex, 
      phone_prefixes = [], date_formats = ['YYYY-MM-DD'],
      currency_code, currency_symbol, postal_code_regex 
    } = req.body;

    if (!country_code || !name || !phone_length || !phone_regex) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    insertCountryRule.run(
      country_code.toUpperCase(),
      name,
      phone_length,
      phone_regex,
      JSON.stringify(phone_prefixes),
      JSON.stringify(date_formats),
      currency_code || null,
      currency_symbol || null,
      postal_code_regex || null,
      1 // is_custom = 1
    );

    res.status(201).json({ message: 'Rule created successfully', country_code: country_code.toUpperCase() });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/v1/rules/:code
 * Delete a country rule
 */
router.delete('/:code', (req, res, next) => {
  try {
    const { code } = req.params;
    const result = deleteCountryRule.run(code.toUpperCase());
    
    if (result.changes === 0) {
      return res.status(404).json({ error: `Rule for country ${code} not found` });
    }
    
    res.json({ message: 'Rule deleted successfully' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
