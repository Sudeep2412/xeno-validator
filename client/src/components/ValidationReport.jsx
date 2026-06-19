import { useState } from 'react';
import { Search, Filter } from 'lucide-react';

export default function ValidationReport({ errors, type = 'error' }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [page, setPage] = useState(1);
  const rowsPerPage = 20;

  if (!errors || errors.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
        <p className="text-muted">No {type === 'error' ? 'errors' : 'auto-corrections'} found in this dataset. Great job!</p>
      </div>
    );
  }

  // Get unique error/action types for the filter dropdown
  const uniqueTypes = [...new Set(errors.map(e => type === 'error' ? e.error_type : e.action))].sort();

  // Filter the data
  const filteredData = errors.filter(item => {
    const matchesSearch = 
      String(item.row_number).includes(searchTerm) ||
      (item.field || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.message || item.corrected_value || '').toLowerCase().includes(searchTerm.toLowerCase());
      
    const itemType = type === 'error' ? item.error_type : item.action;
    const matchesFilter = filterType === 'ALL' || itemType === filterType;
    
    return matchesSearch && matchesFilter;
  });

  // Pagination
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const paginatedData = filteredData.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  return (
    <div>
      <div className="flex gap-4 mb-4">
        <div className="form-group" style={{ flex: 1, position: 'relative', marginBottom: 0 }}>
          <Search size={18} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '12px' }} />
          <input 
            type="text" 
            className="form-control" 
            placeholder="Search by row, field, or message..." 
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
            style={{ paddingLeft: '40px' }}
          />
        </div>
        
        <div className="form-group" style={{ width: '250px', marginBottom: 0 }}>
          <select 
            className="form-control form-select"
            value={filterType}
            onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
          >
            <option value="ALL">All Types</option>
            {uniqueTypes.map(t => (
              <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="table-container mb-4">
        <table>
          <thead>
            <tr>
              <th style={{ width: '80px' }}>Row</th>
              <th style={{ width: '150px' }}>Field</th>
              {type === 'error' ? (
                <>
                  <th style={{ width: '150px' }}>Type</th>
                  <th>Message</th>
                  <th style={{ width: '100px' }}>Severity</th>
                </>
              ) : (
                <>
                  <th style={{ width: '200px' }}>Action Taken</th>
                  <th>Original → Corrected</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((item, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 500 }}>#{item.row_number}</td>
                <td><code style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.8rem' }}>{item.field}</code></td>
                
                {type === 'error' ? (
                  <>
                    <td><span className="text-muted text-sm">{item.error_type}</span></td>
                    <td>{item.message}</td>
                    <td>
                      <span className={`badge ${item.severity === 'error' ? 'badge-error' : 'badge-warning'}`}>
                        {item.severity}
                      </span>
                    </td>
                  </>
                ) : (
                  <>
                    <td><span className="badge badge-info">{item.action.replace(/_/g, ' ')}</span></td>
                    <td>
                      <div className="flex items-center gap-2" style={{ fontSize: '0.85rem' }}>
                        <span style={{ textDecoration: 'line-through', color: '#EF4444' }}>{item.original_value || '(empty)'}</span>
                        <span style={{ color: '#94A3B8' }}>→</span>
                        <span style={{ color: '#10B981', fontWeight: 500 }}>{item.corrected_value}</span>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
            {paginatedData.length === 0 && (
              <tr>
                <td colSpan={type === 'error' ? 5 : 4} style={{ textAlign: 'center', padding: '24px' }}>
                  No results match your search filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center">
          <span className="text-muted text-sm">
            Showing {(page - 1) * rowsPerPage + 1} to {Math.min(page * rowsPerPage, filteredData.length)} of {filteredData.length} entries
          </span>
          <div className="flex gap-2">
            <button 
              className="btn btn-outline" 
              style={{ padding: '6px 12px', fontSize: '0.85rem' }}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </button>
            <span style={{ padding: '6px 12px', fontSize: '0.85rem', background: 'rgba(255,255,255,0.1)', borderRadius: '6px' }}>
              {page} / {totalPages}
            </span>
            <button 
              className="btn btn-outline" 
              style={{ padding: '6px 12px', fontSize: '0.85rem' }}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
