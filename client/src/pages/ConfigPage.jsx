import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import CountryRulesEditor from '../components/CountryRulesEditor';
import { Settings, ShieldCheck, Database } from 'lucide-react';

export default function ConfigPage() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchRules = async () => {
    try {
      setLoading(true);
      const data = await api.getCountryRules();
      setRules(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '12px', borderRadius: '12px' }}>
          <Settings size={28} color="#10B981" />
        </div>
        <div>
          <h1 style={{ margin: 0 }}>Rules Engine Configuration</h1>
          <p className="text-muted">Manage country-specific validation rules for phones, dates, and formats.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        <div className="glass-panel" style={{ display: 'flex', gap: '16px' }}>
          <ShieldCheck size={32} color="#8B5CF6" />
          <div>
            <h3 style={{ margin: '0 0 8px 0' }}>Config-Driven Validation</h3>
            <p className="text-muted text-sm m-0">Unlike hardcoded if/else statements, XenoValidator reads from this configuration table dynamically. Add a new country here and it works instantly without code changes.</p>
          </div>
        </div>
        <div className="glass-panel" style={{ display: 'flex', gap: '16px' }}>
          <Database size={32} color="#3B82F6" />
          <div>
            <h3 style={{ margin: '0 0 8px 0' }}>Live Updates</h3>
            <p className="text-muted text-sm m-0">Any changes made here are immediately applied to the next uploaded file or API request.</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="glass-panel mb-6" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
          <p style={{ color: '#FCA5A5', margin: 0 }}>Error: {error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin" style={{ width: '40px', height: '40px', border: '3px solid rgba(79,70,229,0.3)', borderTopColor: '#4F46E5', borderRadius: '50%' }}></div>
        </div>
      ) : (
        <CountryRulesEditor rules={rules} onRuleSaved={fetchRules} />
      )}
    </div>
  );
}
