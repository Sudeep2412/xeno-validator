import { useState, useEffect } from 'react';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ProgressTracker({ jobId, onComplete }) {
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState('Initializing...');
  const [status, setStatus] = useState('connecting'); // connecting, processing, done, failed

  const steps = [
    { label: 'Parsing File', threshold: 10 },
    { label: 'Validating & Correcting', threshold: 20 },
    { label: 'Detecting Duplicates', threshold: 60 },
    { label: 'Scoring & Reporting', threshold: 70 },
    { label: 'Saving Results', threshold: 90 }
  ];

  const currentStepIndex = steps.reduce((acc, step, index) => {
    if (progress >= step.threshold) return index;
    return acc;
  }, 0);

  useEffect(() => {
    if (!jobId) return;

    const baseUrl = import.meta.env.PROD 
      ? '/api/v1' 
      : 'http://localhost:3001/api/v1';
    
    const eventSource = new EventSource(`${baseUrl}/progress/${jobId}`);

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setProgress(data.progress);
      setStage(data.stage);
      setStatus(data.status);

      if (data.status === 'done') {
        eventSource.close();
        setTimeout(() => {
          onComplete();
        }, 1500); // Give user a moment to see 100%
      } else if (data.status === 'failed') {
        eventSource.close();
      }
    };

    eventSource.onerror = () => {
      // If we lose connection but we're not done/failed, it might just be the stream closing
      // Let's rely on the status updates
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [jobId, onComplete]);

  return (
    <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Processing Data</h2>
      <p className="text-muted mb-8">Please wait while our engine validates and cleans your dataset.</p>

      <div style={{ position: 'relative', width: '120px', height: '120px', margin: '0 auto 24px' }}>
        {status === 'failed' ? (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '50%' }}>
            <AlertCircle size={48} color="#EF4444" />
          </div>
        ) : status === 'done' ? (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '50%' }}>
            <CheckCircle2 size={48} color="#10B981" />
          </div>
        ) : (
          <>
            <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
              {/* Background circle */}
              <circle 
                cx="50" cy="50" r="45" 
                fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" 
              />
              {/* Progress circle */}
              <circle 
                cx="50" cy="50" r="45" 
                fill="none" stroke="url(#gradient)" strokeWidth="8" 
                strokeDasharray="283" 
                strokeDashoffset={283 - (283 * progress) / 100}
                style={{ transition: 'stroke-dashoffset 0.3s ease' }}
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#4F46E5" />
                  <stop offset="100%" stopColor="#10B981" />
                </linearGradient>
              </defs>
            </svg>
            <div style={{ position: 'absolute', top: '0', left: '0', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
              <span style={{ fontSize: '1.5rem', fontWeight: 700 }}>{Math.max(0, progress)}%</span>
            </div>
          </>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
        {status === 'processing' && <Loader2 size={18} className="animate-spin text-primary" />}
        <span style={{ 
          fontSize: '1.1rem', 
          fontWeight: 500,
          color: status === 'failed' ? '#EF4444' : status === 'done' ? '#10B981' : 'white'
        }}>
          {stage}
        </span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px', position: 'relative' }}>
        <div style={{ position: 'absolute', top: '12px', left: '10%', right: '10%', height: '2px', background: 'rgba(255,255,255,0.1)', zIndex: 0 }} />
        <div style={{ 
          position: 'absolute', top: '12px', left: '10%', 
          width: `${(currentStepIndex / (steps.length - 1)) * 80}%`, 
          height: '2px', background: '#4F46E5', zIndex: 0,
          transition: 'width 0.5s ease'
        }} />
        
        {steps.map((step, index) => {
          const isCompleted = progress > step.threshold || status === 'done';
          const isCurrent = currentStepIndex === index && status !== 'done';
          return (
            <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1, width: '20%' }}>
              <div style={{ 
                width: '24px', height: '24px', borderRadius: '50%', 
                background: isCompleted ? '#10B981' : isCurrent ? '#4F46E5' : '#1E293B',
                border: `2px solid ${isCompleted ? '#10B981' : isCurrent ? '#4F46E5' : 'rgba(255,255,255,0.2)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '8px', transition: 'all 0.3s ease'
              }}>
                {isCompleted && <CheckCircle2 size={14} color="white" />}
              </div>
              <span style={{ 
                fontSize: '0.75rem', 
                color: isCompleted || isCurrent ? 'white' : 'var(--text-muted)',
                fontWeight: isCurrent ? 600 : 400,
                textAlign: 'center'
              }}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
