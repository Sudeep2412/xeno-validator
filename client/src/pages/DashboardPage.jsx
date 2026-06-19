import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../utils/api';
import QualityDashboard from '../components/QualityDashboard';
import ValidationReport from '../components/ValidationReport';
import { Download, AlertCircle, ArrowLeft } from 'lucide-react';

export default function DashboardPage() {
  const { jobId } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview'); // overview, errors, audits

  useEffect(() => {
    async function fetchJob() {
      try {
        setLoading(true);
        // Fetch job with full errors/audits for the tabs
        const data = await api.getJob(jobId, true);
        setJob(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchJob();
  }, [jobId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center" style={{ height: '50vh' }}>
        <div className="animate-spin" style={{ width: '40px', height: '40px', border: '3px solid rgba(79,70,229,0.3)', borderTopColor: '#4F46E5', borderRadius: '50%' }}></div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="glass-panel text-center py-12">
        <AlertCircle size={48} color="#EF4444" style={{ margin: '0 auto 16px' }} />
        <h2 style={{ marginBottom: '8px' }}>Failed to load results</h2>
        <p className="text-muted mb-6">{error || 'Job not found'}</p>
        <Link to="/" className="btn btn-primary">Try Another File</Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <Link to="/" style={{ color: 'var(--text-muted)', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.8rem' }}>Processing Results</h1>
            <p className="text-muted text-sm">{job.original_filename} • Processed {new Date(job.created_at).toLocaleString()}</p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <a href={api.getDownloadUrl(jobId, 'audit')} className="btn btn-outline" download>
            <Download size={16} /> Audit Trail (CSV)
          </a>
          <a href={api.getDownloadUrl(jobId, 'report')} className="btn btn-outline" download>
            <Download size={16} /> Error Report (Excel)
          </a>
          <a href={api.getDownloadUrl(jobId, 'clean')} className="btn btn-primary" download>
            <Download size={16} /> Clean Data (CSV)
          </a>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1px', background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '10px', width: 'fit-content', marginBottom: '24px' }}>
        <button 
          onClick={() => setActiveTab('overview')}
          style={{ 
            padding: '8px 24px', 
            background: activeTab === 'overview' ? 'rgba(79,70,229,0.2)' : 'transparent',
            color: activeTab === 'overview' ? '#818CF8' : 'var(--text-muted)',
            border: 'none', borderRadius: '6px', fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s'
          }}
        >
          Quality Dashboard
        </button>
        <button 
          onClick={() => setActiveTab('errors')}
          style={{ 
            padding: '8px 24px', 
            background: activeTab === 'errors' ? 'rgba(239,68,68,0.15)' : 'transparent',
            color: activeTab === 'errors' ? '#FCA5A5' : 'var(--text-muted)',
            border: 'none', borderRadius: '6px', fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s'
          }}
        >
          Validation Errors ({job.error_rows})
        </button>
        <button 
          onClick={() => setActiveTab('audits')}
          style={{ 
            padding: '8px 24px', 
            background: activeTab === 'audits' ? 'rgba(245,158,11,0.15)' : 'transparent',
            color: activeTab === 'audits' ? '#FCD34D' : 'var(--text-muted)',
            border: 'none', borderRadius: '6px', fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s'
          }}
        >
          Auto-Corrections ({job.corrected_rows})
        </button>
      </div>

      {activeTab === 'overview' && <QualityDashboard job={job} />}
      
      {activeTab === 'errors' && (
        <div className="glass-panel">
          <h2 style={{ marginBottom: '16px' }}>Detailed Validation Errors</h2>
          <ValidationReport errors={job.errors || []} type="error" />
        </div>
      )}

      {activeTab === 'audits' && (
        <div className="glass-panel">
          <h2 style={{ marginBottom: '16px' }}>Auto-Correction Audit Trail</h2>
          <p className="text-muted mb-4">Values that were automatically cleaned or normalized by the engine.</p>
          <ValidationReport errors={job.audits || []} type="audit" />
        </div>
      )}
    </div>
  );
}
