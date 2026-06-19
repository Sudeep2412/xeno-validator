import { useState, useRef, useEffect } from 'react';
import { UploadCloud, File, X, CheckCircle, Activity } from 'lucide-react';

export default function FileUpload({ onUpload, api }) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [countryCode, setCountryCode] = useState('IN');
  const [countries, setCountries] = useState([]);
  const [previewData, setPreviewData] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    async function loadCountries() {
      try {
        const rules = await api.getCountryRules();
        setCountries(rules);
      } catch (err) {
        console.error('Failed to load countries', err);
      }
    }
    if (api) loadCountries();
  }, [api]);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = async (selectedFile) => {
    const validTypes = [
      'text/csv', 
      'application/json', 
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    const validExtensions = ['.csv', '.json', '.xlsx'];
    const ext = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase();
    
    if (validTypes.includes(selectedFile.type) || validExtensions.includes(ext)) {
      setFile(selectedFile);
      setPreviewData(null);
      if (api && api.previewFile) {
        setPreviewLoading(true);
        try {
          const res = await api.previewFile(selectedFile);
          setPreviewData(res);
        } catch (err) {
          console.error("Preview failed", err);
        } finally {
          setPreviewLoading(false);
        }
      }
    } else {
      alert('Please upload a valid CSV, JSON, or Excel file.');
    }
  };

  const triggerUpload = () => {
    if (file) {
      onUpload(file, countryCode);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '32px' }}>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Upload Transaction Data</h2>
      <p className="text-muted mb-6">Support for CSV, Excel, and JSON files up to 50MB.</p>

      <div 
        style={{
          border: `2px dashed ${dragActive ? '#10B981' : 'rgba(148, 163, 184, 0.3)'}`,
          borderRadius: '12px',
          padding: '40px 20px',
          textAlign: 'center',
          backgroundColor: dragActive ? 'rgba(16, 185, 129, 0.05)' : 'rgba(15, 23, 42, 0.4)',
          transition: 'all 0.2s',
          cursor: file ? 'default' : 'pointer',
          marginBottom: '24px'
        }}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !file && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx,.json"
          onChange={handleChange}
          style={{ display: 'none' }}
        />

        {!file ? (
          <div className="flex-col items-center gap-4">
            <div style={{ 
              background: 'rgba(79, 70, 229, 0.1)', 
              padding: '16px', 
              borderRadius: '50%',
              display: 'inline-flex'
            }}>
              <UploadCloud size={40} color="#4F46E5" />
            </div>
            <div>
              <p style={{ fontWeight: 500, fontSize: '1.1rem', marginBottom: '4px' }}>
                Drag and drop your file here
              </p>
              <p className="text-muted text-sm">or click to browse from your computer</p>
            </div>
          </div>
        ) : (
          <div className="flex-col items-center gap-4">
            <div style={{ 
              background: 'rgba(16, 185, 129, 0.1)', 
              padding: '16px', 
              borderRadius: '50%',
              display: 'inline-flex'
            }}>
              <CheckCircle size={40} color="#10B981" />
            </div>
            <div>
              <p style={{ fontWeight: 500, fontSize: '1.1rem', marginBottom: '4px' }}>
                {file.name}
              </p>
              <p className="text-muted text-sm">
                {(file.size / 1024 / 1024).toFixed(2)} MB • Ready to process
              </p>
            </div>
            <button 
              className="btn btn-outline" 
              onClick={(e) => { e.stopPropagation(); setFile(null); setPreviewData(null); }}
              style={{ marginTop: '12px' }}
            >
              <X size={16} /> Remove File
            </button>
          </div>
        )}
      </div>

      {previewLoading && (
        <div className="flex justify-center my-4">
          <div className="animate-spin" style={{ width: '24px', height: '24px', border: '2px solid rgba(79,70,229,0.3)', borderTopColor: '#4F46E5', borderRadius: '50%' }}></div>
        </div>
      )}

      {previewData && previewData.preview && previewData.preview.length > 0 && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <h3 style={{ fontSize: '1rem', margin: 0 }}>Data Preview</h3>
            <span className="text-muted text-xs">Showing 5 of {previewData.totalRows} rows</span>
          </div>
          <div className="table-container" style={{ maxHeight: '200px' }}>
            <table>
              <thead>
                <tr>
                  {Object.keys(previewData.preview[0]).map(key => (
                    <th key={key}>{key}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewData.preview.map((row, i) => (
                  <tr key={i}>
                    {Object.values(row).map((val, j) => (
                      <td key={j} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '150px' }}>
                        {val}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex gap-4 items-end">
        <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
          <label className="form-label">Primary Country Context</label>
          <select 
            className="form-control form-select"
            value={countryCode}
            onChange={(e) => setCountryCode(e.target.value)}
          >
            {countries.length > 0 ? (
              countries.map(c => (
                <option key={c.country_code} value={c.country_code}>
                  {c.name} ({c.country_code})
                </option>
              ))
            ) : (
              <option value="IN">India (IN)</option>
            )}
          </select>
        </div>
        
        <button 
          className="btn btn-primary" 
          disabled={!file}
          onClick={triggerUpload}
          style={{ height: '44px', padding: '0 32px' }}
        >
          <Activity size={18} />
          Start Processing
        </button>
      </div>
    </div>
  );
}
