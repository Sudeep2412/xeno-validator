import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Database, UploadCloud, Settings, History, FileJson, Activity } from 'lucide-react';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import ConfigPage from './pages/ConfigPage';
import HistoryPage from './pages/HistoryPage';
import ApiDocsPage from './pages/ApiDocsPage';

function Navbar() {
  const location = useLocation();
  
  const navItems = [
    { path: '/', label: 'Upload', icon: <UploadCloud size={18} /> },
    { path: '/history', label: 'History', icon: <History size={18} /> },
    { path: '/rules', label: 'Rules Engine', icon: <Settings size={18} /> },
    { path: '/api-docs', label: 'API Specs', icon: <FileJson size={18} /> }
  ];

  return (
    <nav style={{ 
      background: 'rgba(15, 23, 42, 0.8)', 
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      padding: '16px 0'
    }}>
      <div className="container flex justify-between items-center">
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', color: 'white' }}>
          <div style={{ 
            background: 'linear-gradient(135deg, #4F46E5 0%, #10B981 100%)',
            padding: '8px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Database size={20} color="white" />
          </div>
          <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.25rem', fontWeight: 700 }}>
            Xeno<span style={{ color: '#10B981' }}>Validator</span>
          </span>
        </Link>
        
        <div style={{ display: 'flex', gap: '24px' }}>
          {navItems.map(item => {
            const isActive = location.pathname === item.path || 
                             (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link 
                key={item.path} 
                to={item.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  textDecoration: 'none',
                  color: isActive ? '#10B981' : '#94A3B8',
                  fontSize: '0.9rem',
                  fontWeight: isActive ? 600 : 500,
                  transition: 'color 0.2s'
                }}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

function App() {
  return (
    <Router>
      <Navbar />
      <main className="container" style={{ padding: '40px 20px', minHeight: 'calc(100vh - 72px)' }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/dashboard/:jobId" element={<DashboardPage />} />
          <Route path="/rules" element={<ConfigPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/api-docs" element={<ApiDocsPage />} />
        </Routes>
      </main>
      
      <footer style={{ 
        padding: '24px 0', 
        textAlign: 'center', 
        borderTop: '1px solid rgba(148, 163, 184, 0.1)',
        color: '#94A3B8',
        fontSize: '0.85rem'
      }}>
        <div className="container">
          <p>Xeno Implementation Internship Task • Built with React & Node.js</p>
        </div>
      </footer>
    </Router>
  )
}

export default App;
