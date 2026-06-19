import { useState } from 'react';
import { api } from '../utils/api';
import { Plus, Edit2, Trash2, Check, X, Save } from 'lucide-react';

export default function CountryRulesEditor({ rules, onRuleSaved }) {
  const [editingCode, setEditingCode] = useState(null);
  const [formData, setFormData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);

  const handleEdit = (rule) => {
    setEditingCode(rule.country_code);
    setFormData({
      country_code: rule.country_code,
      name: rule.name,
      phone_length: rule.phone_length,
      phone_regex: rule.phone_regex,
      phone_prefixes: rule.phone_prefixes.join(', '),
      date_formats: rule.date_formats.join(', '),
      currency_code: rule.currency_code || '',
      currency_symbol: rule.currency_symbol || ''
    });
  };

  const handleAddNew = () => {
    setIsAddingNew(true);
    setEditingCode('NEW');
    setFormData({
      country_code: '',
      name: '',
      phone_length: 10,
      phone_regex: '^\\\d{10}$',
      phone_prefixes: '',
      date_formats: 'YYYY-MM-DD, DD/MM/YYYY',
      currency_code: '',
      currency_symbol: ''
    });
  };

  const handleCancel = () => {
    setEditingCode(null);
    setFormData(null);
    setIsAddingNew(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      setIsSubmitting(true);
      
      const payload = {
        ...formData,
        phone_length: parseInt(formData.phone_length, 10),
        phone_prefixes: formData.phone_prefixes.split(',').map(p => p.trim()).filter(Boolean),
        date_formats: formData.date_formats.split(',').map(f => f.trim()).filter(Boolean)
      };

      await api.saveCountryRule(payload);
      await onRuleSaved();
      handleCancel();
    } catch (err) {
      alert(`Failed to save: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (code) => {
    if (window.confirm(`Are you sure you want to delete the rules for ${code}?`)) {
      try {
        await api.deleteCountryRule(code);
        await onRuleSaved();
      } catch (err) {
        alert(`Failed to delete: ${err.message}`);
      }
    }
  };

  const handleExportJSON = () => {
    const dataStr = JSON.stringify(rules, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'xeno_country_rules.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const importedRules = JSON.parse(event.target.result);
        if (!Array.isArray(importedRules)) throw new Error("Expected an array of rules");
        
        if (window.confirm(`Import ${importedRules.length} rules? This will overwrite existing rules with the same country code.`)) {
          for (const rule of importedRules) {
            await api.saveCountryRule(rule);
          }
          await onRuleSaved();
          alert('Import successful!');
        }
      } catch (err) {
        alert(`Import failed: ${err.message}`);
      }
    };
    reader.readAsText(file);
    e.target.value = null; // reset
  };

  return (
    <div className="glass-panel">
      <div className="flex justify-between items-center mb-6">
        <h2 style={{ margin: 0 }}>Active Rules</h2>
        <div className="flex gap-2">
          <button className="btn btn-outline" onClick={handleExportJSON} style={{ padding: '8px 16px' }}>
            Export JSON
          </button>
          <label className="btn btn-outline" style={{ padding: '8px 16px', margin: 0, cursor: 'pointer' }}>
            Import JSON
            <input type="file" accept=".json" onChange={handleImportJSON} style={{ display: 'none' }} />
          </label>
          {!editingCode && (
            <button className="btn btn-primary" onClick={handleAddNew} style={{ padding: '8px 16px' }}>
              <Plus size={16} /> Add Country
            </button>
          )}
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Code</th>
              <th>Country Name</th>
              <th>Phone Validation</th>
              <th>Date Formats</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isAddingNew && (
              <tr style={{ background: 'rgba(79, 70, 229, 0.1)' }}>
                <td colSpan="5" style={{ padding: '24px' }}>
                  <EditForm 
                    formData={formData} 
                    onChange={handleChange} 
                    onSave={handleSave} 
                    onCancel={handleCancel} 
                    isSubmitting={isSubmitting}
                    isNew={true}
                  />
                </td>
              </tr>
            )}
            
            {rules.map(rule => (
              editingCode === rule.country_code ? (
                <tr key={rule.country_code} style={{ background: 'rgba(79, 70, 229, 0.1)' }}>
                  <td colSpan="5" style={{ padding: '24px' }}>
                    <EditForm 
                      formData={formData} 
                      onChange={handleChange} 
                      onSave={handleSave} 
                      onCancel={handleCancel} 
                      isSubmitting={isSubmitting}
                    />
                  </td>
                </tr>
              ) : (
                <tr key={rule.country_code}>
                  <td style={{ fontWeight: 600 }}>{rule.country_code}</td>
                  <td>{rule.name}</td>
                  <td>
                    <div className="text-sm">
                      Length: <strong>{rule.phone_length}</strong><br />
                      Regex: <code style={{ fontSize: '0.8rem', color: '#818CF8' }}>{rule.phone_regex}</code><br />
                      <span className="text-muted text-xs">Prefixes: {rule.phone_prefixes.join(', ') || 'none'}</span>
                    </div>
                  </td>
                  <td>
                    <div className="text-sm">
                      {rule.date_formats.map(f => <div key={f}>{f}</div>)}
                    </div>
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleEdit(rule)}
                        style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '4px' }}
                        title="Edit Rule"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(rule.country_code)}
                        style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '4px' }}
                        title="Delete Rule"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EditForm({ formData, onChange, onSave, onCancel, isSubmitting, isNew }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
      <div className="form-group">
        <label className="form-label">Country Code (e.g. IN, US)</label>
        <input 
          type="text" name="country_code" className="form-control" 
          value={formData.country_code} onChange={onChange} 
          disabled={!isNew}
          placeholder="2-letter ISO code"
        />
      </div>
      
      <div className="form-group">
        <label className="form-label">Country Name</label>
        <input 
          type="text" name="name" className="form-control" 
          value={formData.name} onChange={onChange} 
          placeholder="e.g. India"
        />
      </div>
      
      <div className="form-group">
        <label className="form-label">Phone Length (raw digits)</label>
        <input 
          type="number" name="phone_length" className="form-control" 
          value={formData.phone_length} onChange={onChange} 
        />
      </div>
      
      <div className="form-group">
        <label className="form-label">Phone Regex</label>
        <input 
          type="text" name="phone_regex" className="form-control" 
          value={formData.phone_regex} onChange={onChange} 
          placeholder="e.g. ^[6-9]\d{9}$"
        />
      </div>

      <div className="form-group">
        <label className="form-label">Phone Prefixes (comma separated)</label>
        <input 
          type="text" name="phone_prefixes" className="form-control" 
          value={formData.phone_prefixes} onChange={onChange} 
          placeholder="e.g. +91, 91, 0"
        />
      </div>

      <div className="form-group">
        <label className="form-label">Allowed Date Formats (comma separated)</label>
        <input 
          type="text" name="date_formats" className="form-control" 
          value={formData.date_formats} onChange={onChange} 
          placeholder="e.g. YYYY-MM-DD, DD/MM/YYYY"
        />
      </div>

      <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
        <button className="btn btn-outline" onClick={onCancel} disabled={isSubmitting}>
          <X size={16} /> Cancel
        </button>
        <button className="btn btn-primary" onClick={onSave} disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : <><Save size={16} /> Save Rule</>}
        </button>
      </div>
    </div>
  );
}
