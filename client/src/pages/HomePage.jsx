import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FileUpload from '../components/FileUpload';
import ProgressTracker from '../components/ProgressTracker';
import { api } from '../utils/api';
import { ShieldCheck, Zap, BarChart3, Database } from 'lucide-react';

export default function HomePage() {
  const navigate = useNavigate();
  const [jobId, setJobId] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  const handleUpload = async (file, countryCode) => {
    try {
      setError('');
      setIsProcessing(true);
      const res = await api.uploadFile(file, countryCode);
      setJobId(res.jobId);
    } catch (err) {
      setError(err.message);
      setIsProcessing(false);
    }
  };

  const handleComplete = () => {
    if (jobId) {
      navigate(`/dashboard/${jobId}`);
    }
  };

  return (
    <div>
      <div className="flex-col items-center justify-center text-center mb-12 mt-8">
        <div style={{ display: 'inline-flex', marginBottom: '16px', background: 'rgba(79, 70, 229, 0.1)', padding: '12px 24px', borderRadius: '30px', border: '1px solid rgba(79, 70, 229, 0.2)' }}>
          <span className="text-gradient" style={{ fontWeight: 600, letterSpacing: '0.05em', fontSize: '0.85rem', textTransform: 'uppercase' }}>
            Enterprise Data Quality Platform
          </span>
        </div>
        
        <h1 style={{ fontSize: '3.5rem', lineHeight: 1.1, marginBottom: '24px', maxWidth: '800px', margin: '0 auto 24px' }}>
          Smart data validation <br />
          <span className="text-gradient" style={{ fontFamily: 'Outfit, sans-serif' }}>for global teams</span>
        </h1>
        
        <p className="text-muted" style={{ fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto' }}>
          Upload your messy transaction data. We'll validate phone numbers by country, fix date formats, catch duplicates, and score the quality.
        </p>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {error && (
          <div className="glass-panel" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', marginBottom: '24px' }}>
            <p style={{ color: '#FCA5A5', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <strong>Error:</strong> {error}
            </p>
          </div>
        )}

        {isProcessing && jobId ? (
          <ProgressTracker jobId={jobId} onComplete={handleComplete} />
        ) : (
          <FileUpload onUpload={handleUpload} api={api} />
        )}
      </div>

      <div style={{ marginTop: '80px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
        <FeatureCard 
          icon={<ShieldCheck size={24} color="#10B981" />}
          title="Country-Specific Rules"
          description="Configurable validation rules for phones and formats tailored to 8+ global regions."
        />
        <FeatureCard 
          icon={<Zap size={24} color="#F59E0B" />}
          title="Smart Auto-Correction"
          description="Automatically fixes formatting issues and provides a transparent audit trail of all changes."
        />
        <FeatureCard 
          icon={<Database size={24} color="#3B82F6" />}
          title="Fuzzy Deduplication"
          description="Catches exact matches and fuzzy duplicates based on customer names and timestamps."
        />
        <FeatureCard 
          icon={<BarChart3 size={24} color="#8B5CF6" />}
          title="Quality Scoring"
          description="Get an instant 0-100 credit score for your dataset breaking down completeness and validity."
        />
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '12px', width: 'fit-content' }}>
        {icon}
      </div>
      <h3 style={{ fontSize: '1.1rem', margin: 0 }}>{title}</h3>
      <p className="text-muted text-sm">{description}</p>
    </div>
  );
}
