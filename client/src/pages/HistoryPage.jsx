import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import ProcessingHistory from '../components/ProcessingHistory';
import { History } from 'lucide-react';

export default function HistoryPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchJobs() {
      try {
        setLoading(true);
        const data = await api.getAllJobs();
        setJobs(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchJobs();
  }, []);

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '12px', borderRadius: '12px' }}>
          <History size={28} color="#3B82F6" />
        </div>
        <div>
          <h1 style={{ margin: 0 }}>Processing History</h1>
          <p className="text-muted">Review previous data validation jobs and download their reports.</p>
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
        <ProcessingHistory jobs={jobs} />
      )}
    </div>
  );
}
