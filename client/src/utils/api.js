const API_BASE_URL = import.meta.env.PROD 
  ? '/api/v1' 
  : 'http://localhost:3001/api/v1';

export const api = {
  uploadFile: async (file, countryCode) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('countryCode', countryCode);

    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || error.error || 'Upload failed');
    }
    
    return response.json();
  },

  previewFile: async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/upload/preview`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || error.error || 'Preview failed');
    }
    
    return response.json();
  },

  getJob: async (jobId, full = false) => {
    const url = full 
      ? `${API_BASE_URL}/jobs/${jobId}?full=true`
      : `${API_BASE_URL}/jobs/${jobId}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch job details');
    return response.json();
  },

  getAllJobs: async () => {
    const response = await fetch(`${API_BASE_URL}/jobs`);
    if (!response.ok) throw new Error('Failed to fetch jobs');
    return response.json();
  },

  getJobErrors: async (jobId) => {
    const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/errors`);
    if (!response.ok) throw new Error('Failed to fetch job errors');
    return response.json();
  },

  getCountryRules: async () => {
    const response = await fetch(`${API_BASE_URL}/rules`);
    if (!response.ok) throw new Error('Failed to fetch rules');
    return response.json();
  },

  saveCountryRule: async (ruleData) => {
    const response = await fetch(`${API_BASE_URL}/rules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ruleData),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to save rule');
    }
    return response.json();
  },

  deleteCountryRule: async (code) => {
    const response = await fetch(`${API_BASE_URL}/rules/${code}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete rule');
    return response.json();
  },
  
  getDownloadUrl: (jobId, type) => {
    return `${API_BASE_URL}/download/${jobId}/${type}`;
  }
};
