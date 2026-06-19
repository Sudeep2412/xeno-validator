import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, AlertCircle, Clock } from 'lucide-react';

export default function ProcessingHistory({ jobs }) {
  if (!jobs || jobs.length === 0) {
    return (
      <div className="glass-panel text-center py-12">
        <Clock size={48} color="#94A3B8" style={{ margin: '0 auto 16px', opacity: 0.5 }} />
        <h2 style={{ marginBottom: '8px' }}>No Processing History</h2>
        <p className="text-muted mb-6">You haven't processed any files yet.</p>
        <Link to="/" className="btn btn-primary">Upload a File</Link>
      </div>
    );
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'done': return <CheckCircle2 size={18} color="#10B981" />;
      case 'failed': return <AlertCircle size={18} color="#EF4444" />;
      case 'processing': return <div className="animate-spin" style={{ width: '16px', height: '16px', border: '2px solid rgba(79,70,229,0.3)', borderTopColor: '#4F46E5', borderRadius: '50%' }}></div>;
      default: return <Clock size={18} color="#94A3B8" />;
    }
  };

  const getGradeColor = (grade) => {
    switch (grade) {
      case 'A': return '#10B981';
      case 'B': return '#3B82F6';
      case 'C': return '#FCD34D';
      case 'D': return '#F59E0B';
      default: return '#EF4444';
    }
  };

  return (
    <div className="glass-panel">
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Status</th>
              <th>Filename</th>
              <th>Date Processed</th>
              <th>Country Context</th>
              <th>Rows (Total / Valid)</th>
              <th>Quality Score</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map(job => (
              <tr key={job.id}>
                <td>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(job.status)}
                    <span style={{ textTransform: 'capitalize', fontWeight: 500 }}>{job.status}</span>
                  </div>
                </td>
                <td style={{ fontWeight: 500 }}>{job.original_filename}</td>
                <td className="text-muted text-sm">{new Date(job.created_at).toLocaleString()}</td>
                <td><span className="badge badge-info">{job.country_code}</span></td>
                <td>
                  {job.status === 'done' ? (
                    <span style={{ fontSize: '0.9rem' }}>
                      {job.total_rows.toLocaleString()} / <span style={{ color: '#10B981', fontWeight: 600 }}>{job.valid_rows.toLocaleString()}</span>
                    </span>
                  ) : '-'}
                </td>
                <td>
                  {job.status === 'done' ? (
                    <div className="flex items-center gap-2">
                      <span style={{ 
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: '24px', height: '24px', borderRadius: '4px',
                        background: getGradeColor(job.quality_grade), color: 'white',
                        fontWeight: 700, fontSize: '0.8rem'
                      }}>
                        {job.quality_grade}
                      </span>
                      <span style={{ fontWeight: 600 }}>{Math.round(job.quality_score)}</span>
                    </div>
                  ) : '-'}
                </td>
                <td>
                  {job.status === 'done' ? (
                    <div className="flex gap-2">
                      <Link to={`/dashboard/${job.id}`} className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
                        View Dashboard <ArrowRight size={14} />
                      </Link>
                      <Link to="/" className="btn btn-primary" title="Upload new file for processing" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
                        <Clock size={14} /> Re-process
                      </Link>
                    </div>
                  ) : (
                    <span className="text-muted text-sm">Processing...</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
