const BASE_URL = process.env.REACT_APP_API_URL || '';

const getToken = () => localStorage.getItem('token');

const request = async (method, path, body = null) => {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const config = { method, headers };
  if (body) config.body = JSON.stringify(body);

  const res = await fetch(`${BASE_URL}/api${path}`, config);
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    throw new Error(data.error || `Request failed: ${res.status}`);
  }
  return data;
};

export const api = {
  // Auth
  login: (credentials) => request('POST', '/auth/login', credentials),
  changePassword: (data) => request('POST', '/auth/change-password', data),

  // Audiences
  getAudiences: () => request('GET', '/audiences'),
  getAudience: (id) => request('GET', `/audiences/${id}`),
  createAudience: (data) => request('POST', '/audiences', data),
  updateAudience: (id, data) => request('PUT', `/audiences/${id}`, data),
  deleteAudience: (id) => request('DELETE', `/audiences/${id}`),
  addMembers: (id, members) => request('POST', `/audiences/${id}/members`, { members }),
  removeMember: (audId, memberId) => request('DELETE', `/audiences/${audId}/members/${memberId}`),

  // Campaigns
  getCampaigns: () => request('GET', '/campaigns'),
  getCampaign: (id) => request('GET', `/campaigns/${id}`),
  createCampaign: (data) => request('POST', '/campaigns', data),
  updateCampaign: (id, data) => request('PUT', `/campaigns/${id}`, data),
  deleteCampaign: (id) => request('DELETE', `/campaigns/${id}`),
  updateReport: (id, data) => request('PUT', `/campaigns/${id}/report`, data),

  // Reports
  getDashboard: () => request('GET', '/reports/dashboard'),
  getWeeklyReport: (params) => {
    const qs = new URLSearchParams(params).toString();
    return request('GET', `/reports/weekly?${qs}`);
  },
  compareCampaigns: (ids) => request('GET', `/reports/compare?campaign_ids=${ids.join(',')}`),
};

export const exportToCSV = (data, filename) => {
  if (!data || !data.length) return;
  const headers = Object.keys(data[0]);
  const rows = data.map(row => headers.map(h => {
    const val = row[h];
    if (val === null || val === undefined) return '';
    const str = String(val);
    return str.includes(',') || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str;
  }).join(','));
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};
