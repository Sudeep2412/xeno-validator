import { FileJson, Code, Check } from 'lucide-react';
import { useState } from 'react';

export default function ApiDocsPage() {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [responseBody, setResponseBody] = useState('');
  const [requestBody, setRequestBody] = useState(JSON.stringify({
    countryCode: "IN",
    data: [
      {
        customer_id: "CUST123",
        full_name: "Shanaya Madan",
        email: "  AHANA-VORA@gmail.com  ",
        phone_number: "+91 73328 67654",
        city: "chennai",
        signup_date: "21/04/2023"
      }
    ]
  }, null, 2));

  const handleTryIt = async () => {
    setIsLoading(true);
    setResponseBody('');
    try {
      const parsedBody = JSON.parse(requestBody);
      const baseUrl = import.meta.env.PROD ? '/api/v1' : 'http://localhost:3001/api/v1';
      
      const res = await fetch(`${baseUrl}/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsedBody)
      });
      
      const data = await res.json();
      setResponseBody(JSON.stringify(data, null, 2));
    } catch (err) {
      setResponseBody(`Error: ${err.message}\nMake sure your request body is valid JSON.`);
    } finally {
      setIsLoading(false);
    }
  };

  const copyUrl = (url) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <div style={{ background: 'rgba(236, 72, 153, 0.1)', padding: '12px', borderRadius: '12px' }}>
          <FileJson size={28} color="#EC4899" />
        </div>
        <div>
          <h1 style={{ margin: 0 }}>API Specifications</h1>
          <p className="text-muted">Integrate XenoValidator directly into your own applications.</p>
        </div>
      </div>

      <div className="glass-panel mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="badge badge-success" style={{ fontSize: '1rem', padding: '4px 12px' }}>POST</span>
            <h2 style={{ margin: 0, fontFamily: 'monospace' }}>/api/v1/validate</h2>
          </div>
          <button 
            className="btn btn-outline" 
            onClick={() => copyUrl('http://localhost:3001/api/v1/validate')}
          >
            {copiedUrl ? <Check size={16} color="#10B981" /> : <Code size={16} />}
            Copy URL
          </button>
        </div>
        
        <p className="mb-6">
          Synchronously validate a JSON array of transaction data. Perfect for real-time validation in your own checkout flows or CRM integrations.
        </p>

        <h3 style={{ fontSize: '1.1rem', marginBottom: '12px' }}>Request Body</h3>
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <textarea 
              value={requestBody}
              onChange={(e) => setRequestBody(e.target.value)}
              style={{ 
                width: '100%', height: '300px', background: 'rgba(15, 23, 42, 0.8)', 
                color: '#E2E8F0', padding: '16px', borderRadius: '8px', 
                fontFamily: 'monospace', fontSize: '0.9rem', border: '1px solid rgba(255,255,255,0.1)' 
              }}
            />
            <div className="mt-4">
              <button className="btn btn-primary" onClick={handleTryIt} disabled={isLoading}>
                {isLoading ? 'Sending...' : 'Send Request (Try It)'}
              </button>
            </div>
          </div>
          <div>
            <div style={{ 
              width: '100%', height: '300px', background: 'rgba(15, 23, 42, 0.8)', 
              color: responseBody.startsWith('Error') ? '#EF4444' : '#10B981', 
              padding: '16px', borderRadius: '8px', overflowY: 'auto',
              fontFamily: 'monospace', fontSize: '0.9rem', border: '1px solid rgba(255,255,255,0.1)' 
            }}>
              <pre style={{ margin: 0 }}>{responseBody || 'Response will appear here...'}</pre>
            </div>
          </div>
        </div>

        <h3 style={{ fontSize: '1.1rem', marginBottom: '12px' }}>Response (200 OK)</h3>
        <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '16px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '0.9rem' }}>
<pre style={{ margin: 0, color: '#E2E8F0' }}>{`{
  "meta": {
    "totalRows": 1,
    "validRows": 1,
    "qualityScore": 100,
    "grade": "A",
    "countryCode": "IN"
  },
  "results": [
    {
      "rowNumber": 2,
      "data": {
        "customer_id": "CUST123",
        "full_name": "Shanaya Madan",
        "email": "ahana-vora@gmail.com",
        "phone_number": "7332867654",
        "city": "Chennai",
        "signup_date": "2023-04-21"
      },
      "isValid": true,
      "errors": []
    }
  ]
}`}</pre>
        </div>
      </div>

      <div className="glass-panel">
        <h2 style={{ marginBottom: '16px' }}>Other Endpoints</h2>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Method</th>
                <th>Endpoint</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><span className="badge badge-success">POST</span></td>
                <td><code style={{ color: '#818CF8' }}>/api/v1/upload</code></td>
                <td>Upload a file (multipart/form-data) for async background processing.</td>
              </tr>
              <tr>
                <td><span className="badge badge-info">GET</span></td>
                <td><code style={{ color: '#818CF8' }}>/api/v1/jobs/:id</code></td>
                <td>Check status and get quality score for an async job.</td>
              </tr>
              <tr>
                <td><span className="badge badge-info">GET</span></td>
                <td><code style={{ color: '#818CF8' }}>/api/v1/rules</code></td>
                <td>Fetch all active country validation rules.</td>
              </tr>
              <tr>
                <td><span className="badge badge-info">GET</span></td>
                <td><code style={{ color: '#818CF8' }}>/api/v1/download/:id/report</code></td>
                <td>Download the annotated Excel report for a completed job.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
