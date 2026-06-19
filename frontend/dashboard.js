import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Dashboard = ({ user, onLogout }) => {
  const [evidence, setEvidence] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchEvidence = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://127.0.0.1:8000/api/evidence', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEvidence(response.data);
    } catch (err) {
      if (err.response?.status === 401) onLogout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvidence();
  }, []);

  const exportToExcel = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://127.0.0.1:8000/api/evidence', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = response.data;
      if (data.length === 0) {
        alert('No data to export');
        return;
      }
      let csv = 'ID,Case Number,Description,Category,Status,Created\n';
      data.forEach(item => {
        csv += `${item.id},"${item.case_number || ''}","${item.description || ''}","${item.category || ''}","${item.status || ''}","${new Date(item.created_at).toLocaleString()}"\n`;
      });
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `evidence_export_${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      alert('✅ Exported successfully!');
    } catch (error) {
      alert('❌ Export failed');
    }
  };

  const bulkUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.onchange = async (e) => {
      const files = Array.from(e.target.files);
      const token = localStorage.getItem('token');
      let success = 0;
      for (let i = 0; i < files.length; i++) {
        try {
          await axios.post('http://127.0.0.1:8000/api/evidence', null, {
            params: { case_number: `BULK-${Date.now()}-${i}`, description: files[i].name, category: 'Digital' },
            headers: { Authorization: `Bearer ${token}` }
          });
          success++;
        } catch(err) {}
      }
      fetchEvidence();
      alert(`Uploaded ${success} of ${files.length} files`);
    };
    input.click();
  };

  const showAnalytics = async () => {
    const token = localStorage.getItem('token');
    const response = await axios.get('http://127.0.0.1:8000/api/evidence', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = response.data;
    alert(`📊 ANALYTICS\n\nTotal: ${data.length}\nCompleted: ${data.filter(i => i.status === 'Completed').length}\nAnalyzing: ${data.filter(i => i.status === 'Analyzing').length}\nIntake: ${data.filter(i => i.status === 'Intake').length}`);
  };

  const getStatusColor = (status) => {
    const colors = { 'Intake': '#f59e0b', 'Scanning': '#3b82f6', 'Analyzing': '#8b5cf6', 'Completed': '#10b981', 'Archived': '#64748b' };
    return colors[status] || '#6b7280';
  };

  const filteredEvidence = evidence.filter(item =>
    item.case_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div style={{ color: '#38bdf8', textAlign: 'center', marginTop: '50px' }}>Loading...</div>;
  }

  return (
    <div style={{ backgroundColor: '#0f172a', minHeight: '100vh', padding: '20px', fontFamily: 'monospace' }}>
      
      <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ color: '#38bdf8', margin: 0 }}>🔒 TraceLock Forensic Suite</h1>
          <p style={{ color: '#94a3b8', fontSize: '12px' }}>Secure Evidence Management System</p>
        </div>
        <div>
          <span style={{ color: '#f8fafc', marginRight: '15px' }}>{user.role} | {user.username}</span>
          <button onClick={onLogout} style={{ padding: '8px 16px', backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>🚪 Logout</button>
        </div>
      </div>

      {/* ✅✅✅ THREE BUTTONS - VISIBLE HERE ✅✅✅ */}
      <div style={{ 
        backgroundColor: '#1e293b', 
        padding: '25px', 
        borderRadius: '8px', 
        marginBottom: '20px',
        border: '4px solid #38bdf8'
      }}>
        <h2 style={{ color: '#38bdf8', marginBottom: '15px', fontSize: '20px' }}>📊 FEATURES</h2>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          <button 
            onClick={bulkUpload} 
            style={{ 
              padding: '15px 35px', 
              backgroundColor: '#38bdf8', 
              color: '#0f172a', 
              border: 'none', 
              borderRadius: '8px', 
              cursor: 'pointer', 
              fontWeight: 'bold', 
              fontSize: '18px' 
            }}
          >
            📦 Bulk Upload
          </button>
          <button 
            onClick={exportToExcel} 
            style={{ 
              padding: '15px 35px', 
              backgroundColor: '#10b981', 
              color: 'white', 
              border: 'none', 
              borderRadius: '8px', 
              cursor: 'pointer', 
              fontWeight: 'bold', 
              fontSize: '18px' 
            }}
          >
            📊 Export to Excel
          </button>
          <button 
            onClick={showAnalytics} 
            style={{ 
              padding: '15px 35px', 
              backgroundColor: '#8b5cf6', 
              color: 'white', 
              border: 'none', 
              borderRadius: '8px', 
              cursor: 'pointer', 
              fontWeight: 'bold', 
              fontSize: '18px' 
            }}
          >
            📈 Analytics
          </button>
        </div>
      </div>

      <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '8px' }}>
        <input 
          type="text" 
          placeholder="🔍 Search by case number..." 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
          style={{ width: '100%', padding: '10px', marginBottom: '15px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '4px', color: 'white' }} 
        />
        <table style={{ width: '100%', borderCollapse: 'collapse', color: '#f8fafc' }}>
          <thead>
            <tr style={{ backgroundColor: '#0f172a', borderBottom: '1px solid #334155' }}>
              <th style={{ padding: '10px' }}>ID</th>
              <th style={{ padding: '10px' }}>Case</th>
              <th style={{ padding: '10px' }}>Status</th>
              <th style={{ padding: '10px' }}>Created</th>
            </tr>
          </thead>
          <tbody>
            {filteredEvidence.map(item => (
              <tr key={item.id} style={{ borderBottom: '1px solid #334155' }}>
                <td style={{ padding: '10px' }}>#{item.id}</td>
                <td style={{ padding: '10px', color: '#38bdf8' }}>{item.case_number}</td>
                <td style={{ padding: '10px' }}><span style={{ padding: '4px 8px', borderRadius: '4px', backgroundColor: getStatusColor(item.status) }}>{item.status}</span></td>
                <td style={{ padding: '10px' }}>{new Date(item.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;