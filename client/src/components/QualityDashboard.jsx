export default function QualityDashboard({ job }) {
  if (!job) return null;

  const scoreColor = 
    job.quality_grade === 'A' ? '#10B981' : 
    job.quality_grade === 'B' ? '#3B82F6' : 
    job.quality_grade === 'C' ? '#FCD34D' : 
    job.quality_grade === 'D' ? '#F59E0B' : '#EF4444';

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
      
      {/* Score Card */}
      <div className="glass-panel flex-col items-center justify-center text-center py-8">
        <h3 className="text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.85rem', marginBottom: '24px' }}>
          Data Quality Score
        </h3>
        
        <div style={{ position: 'relative', width: '200px', height: '200px', marginBottom: '16px' }}>
          <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
            <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
            <circle 
              cx="50" cy="50" r="45" fill="none" stroke={scoreColor} strokeWidth="8" 
              strokeDasharray="283" 
              strokeDashoffset={283 - (283 * job.quality_score) / 100}
              style={{ transition: 'stroke-dashoffset 1s ease-out' }}
            />
          </svg>
          <div style={{ position: 'absolute', top: '0', left: '0', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
            <span style={{ fontSize: '3.5rem', fontWeight: 700, lineHeight: 1, color: scoreColor }}>
              {Math.round(job.quality_score)}
            </span>
            <span style={{ fontSize: '1.2rem', fontWeight: 600, color: 'white', marginTop: '4px' }}>
              Grade {job.quality_grade}
            </span>
          </div>
        </div>
      </div>

      {/* Metrics Breakdown */}
      <div className="glass-panel flex-col justify-center">
        <h3 style={{ marginBottom: '20px' }}>Score Breakdown</h3>
        
        <div className="flex-col gap-6">
          <MetricBar label="Completeness (No missing required fields)" score={job.completeness_score} weight="30%" />
          <MetricBar label="Validity (Passed format & length rules)" score={job.validity_score} weight="30%" />
          <MetricBar label="Uniqueness (No exact or fuzzy duplicates)" score={job.uniqueness_score} weight="20%" />
          <MetricBar label="Consistency (Format uniformity)" score={job.consistency_score} weight="20%" />
        </div>
      </div>

      {/* Quick Stats */}
      <div className="glass-panel" style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', padding: '20px' }}>
        <StatBox label="Total Rows" value={job.total_rows} />
        <StatBox label="Valid Rows" value={job.valid_rows} color="#10B981" />
        <StatBox label="Auto-Corrected" value={job.corrected_rows} color="#FCD34D" />
        <StatBox label="Errors Found" value={job.error_rows} color="#EF4444" />
      </div>

      {/* Error Summary Chart */}
      {job.errorSummary && job.errorSummary.length > 0 && (
        <div className="glass-panel" style={{ gridColumn: '1 / -1' }}>
          <h3 style={{ marginBottom: '16px' }}>Top Validation Issues</h3>
          <div className="flex-col gap-4">
            {job.errorSummary.slice(0, 5).map((err, i) => (
              <div key={i} className="flex items-center justify-between" style={{ background: 'rgba(255,255,255,0.02)', padding: '12px 16px', borderRadius: '8px' }}>
                <div className="flex items-center gap-3">
                  <span className={`badge ${err.severity === 'error' ? 'badge-error' : 'badge-warning'}`}>
                    {err.severity}
                  </span>
                  <span style={{ fontWeight: 500 }}>{err.error_type.replace(/_/g, ' ')}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '150px', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(err.count / job.error_rows) * 100}%`, background: err.severity === 'error' ? '#EF4444' : '#F59E0B' }} />
                  </div>
                  <span style={{ fontWeight: 600, width: '40px', textAlign: 'right' }}>{err.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MetricBar({ label, score, weight }) {
  return (
    <div>
      <div className="flex justify-between items-end mb-2">
        <div>
          <span style={{ display: 'block', fontSize: '0.9rem', fontWeight: 500 }}>{label}</span>
          <span className="text-muted text-xs">Weight: {weight}</span>
        </div>
        <span style={{ fontWeight: 600, color: score > 80 ? '#10B981' : score > 60 ? '#FCD34D' : '#EF4444' }}>
          {score}%
        </span>
      </div>
      <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
        <div 
          style={{ 
            height: '100%', 
            width: `${score}%`, 
            background: score > 80 ? '#10B981' : score > 60 ? '#FCD34D' : '#EF4444',
            transition: 'width 1s ease-out'
          }} 
        />
      </div>
    </div>
  );
}

function StatBox({ label, value, color = 'white' }) {
  return (
    <div style={{ borderRight: '1px solid rgba(255,255,255,0.05)', padding: '0 12px' }}>
      <p className="text-muted text-sm mb-1">{label}</p>
      <p style={{ fontSize: '1.8rem', fontWeight: 700, color, lineHeight: 1 }}>
        {value.toLocaleString()}
      </p>
    </div>
  );
}
