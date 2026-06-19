import React, { useState, useEffect } from 'react';
import axios from 'axios';

// ===== LOGIN COMPONENT =====
const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await axios.post('http://127.0.0.1:8000/api/auth/login', null, {
        params: { username, password }
      });
      const { access_token, user_id, username: userName, role } = response.data;
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify({ id: user_id, username: userName, role }));
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      onLogin({ id: user_id, username: userName, role });
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={loginStyles.container}>
      <div style={loginStyles.box}>
        <h1 style={loginStyles.title}>🔒 TraceLock Forensic</h1>
        <p style={loginStyles.subtitle}>Evidence Management System</p>
        {error && <div style={loginStyles.error}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} style={loginStyles.input} required />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} style={loginStyles.input} required />
          <button type="submit" disabled={loading} style={loginStyles.button}>{loading ? 'Loading...' : 'Login'}</button>
        </form>
        <p style={loginStyles.demo}>admin / admin123</p>
      </div>
    </div>
  );
};

const loginStyles = {
  container: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a' },
  box: { backgroundColor: '#1e293b', padding: '40px', borderRadius: '8px', width: '400px', textAlign: 'center' },
  title: { color: '#38bdf8', marginBottom: '10px' },
  subtitle: { color: '#94a3b8', marginBottom: '30px' },
  error: { backgroundColor: '#7f1d1d', color: '#fca5a5', padding: '10px', borderRadius: '4px', marginBottom: '20px' },
  input: { width: '100%', padding: '10px', marginBottom: '10px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '4px', color: 'white', boxSizing: 'border-box' },
  button: { width: '100%', padding: '10px', backgroundColor: '#38bdf8', color: '#0f172a', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' },
  demo: { marginTop: '20px', color: '#64748b', fontSize: '12px' }
};

// ===== USER MANAGEMENT =====
const UserManagement = ({ user, onLogout, fetchEvidence }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRegister, setShowRegister] = useState(false);
  const [registerData, setRegisterData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'viewer'
  });
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://127.0.0.1:8000/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://127.0.0.1:8000/api/auth/register', null, {
        params: {
          username: registerData.username,
          email: registerData.email,
          password: registerData.password,
          role: registerData.role
        },
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessageType('success');
      setMessage('✅ User created successfully!');
      setRegisterData({ username: '', email: '', password: '', role: 'viewer' });
      fetchUsers();
      setTimeout(() => setShowRegister(false), 2000);
    } catch (err) {
      setMessageType('error');
      setMessage('❌ ' + (err.response?.data?.detail || 'Registration failed'));
    }
  };

  const updateUserRole = async (userId, newRole) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`http://127.0.0.1:8000/api/admin/users/${userId}/role`, null, {
        params: { new_role: newRole },
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchUsers();
      setMessageType('success');
      setMessage('✅ User role updated!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessageType('error');
      setMessage('❌ ' + (err.response?.data?.detail || 'Update failed'));
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const getRoleColor = (role) => {
    const colors = { 'admin': '#8b5cf6', 'analyst': '#3b82f6', 'viewer': '#10b981' };
    return colors[role] || '#6b7280';
  };

  const getRoleBadge = (role) => {
    const badges = { 'admin': '🛡️ Admin', 'analyst': '🔍 Analyst', 'viewer': '👀 Viewer' };
    return badges[role] || role;
  };

  if (loading) {
    return <div style={{ color: '#38bdf8', textAlign: 'center', padding: '20px' }}>Loading users...</div>;
  }

  return (
    <div style={userStyles.container}>
      <div style={userStyles.header}>
        <div>
          <h2 style={userStyles.title}>👥 User Management</h2>
          <p style={userStyles.subtitle}>Create and manage system users with different roles</p>
        </div>
        <div style={userStyles.headerActions}>
          <button onClick={() => setShowRegister(!showRegister)} style={userStyles.addBtn}>
            {showRegister ? '✖ Close' : '➕ Add User'}
          </button>
          <button onClick={() => { fetchUsers(); setMessage('✅ Users refreshed!'); setTimeout(() => setMessage(''), 2000); }} style={userStyles.refreshBtn}>
            🔄 Refresh
          </button>
        </div>
      </div>

      {message && (
        <div style={{ ...userStyles.message, backgroundColor: messageType === 'success' ? '#064e3b' : '#7f1d1d', color: messageType === 'success' ? '#10b981' : '#fca5a5' }}>
          {message}
        </div>
      )}

      {showRegister && (
        <div style={userStyles.registerBox}>
          <h3 style={userStyles.registerTitle}>📝 Create New User</h3>
          <form onSubmit={handleRegister}>
            <input
              type="text"
              placeholder="Username *"
              value={registerData.username}
              onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
              style={userStyles.input}
              required
            />
            <input
              type="email"
              placeholder="Email *"
              value={registerData.email}
              onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
              style={userStyles.input}
              required
            />
            <input
              type="password"
              placeholder="Password *"
              value={registerData.password}
              onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
              style={userStyles.input}
              required
              minLength="6"
            />
            <select
              value={registerData.role}
              onChange={(e) => setRegisterData({ ...registerData, role: e.target.value })}
              style={userStyles.select}
            >
              <option value="viewer">👀 Viewer - View only</option>
              <option value="analyst">🔍 Analyst - Create & edit</option>
              <option value="admin">🛡️ Admin - Full access</option>
            </select>
            <button type="submit" style={userStyles.submitBtn}>➕ Create User</button>
          </form>
        </div>
      )}

      <div style={userStyles.legend}>
        <span style={userStyles.legendTitle}>Roles:</span>
        <span style={{ ...userStyles.legendBadge, backgroundColor: '#8b5cf6' }}>🛡️ Admin - Full Access</span>
        <span style={{ ...userStyles.legendBadge, backgroundColor: '#3b82f6' }}>🔍 Analyst - Create & Edit</span>
        <span style={{ ...userStyles.legendBadge, backgroundColor: '#10b981' }}>👀 Viewer - View Only</span>
      </div>

      <div style={userStyles.tableContainer}>
        <table style={userStyles.table}>
          <thead>
            <tr style={userStyles.tableHeader}>
              <th style={userStyles.th}>ID</th>
              <th style={userStyles.th}>Username</th>
              <th style={userStyles.th}>Email</th>
              <th style={userStyles.th}>Role</th>
              <th style={userStyles.th}>Status</th>
              <th style={userStyles.th}>Created</th>
              <th style={userStyles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} style={userStyles.tableRow}>
                <td style={userStyles.td}>#{u.id}</td>
                <td style={userStyles.td}>
                  <strong style={{ color: '#38bdf8' }}>{u.username}</strong>
                  {u.id === user.id && <span style={userStyles.meBadge}> (You)</span>}
                </td>
                <td style={userStyles.td}>{u.email}</td>
                <td style={userStyles.td}>
                  <span style={{ ...userStyles.roleBadge, backgroundColor: getRoleColor(u.role) }}>
                    {getRoleBadge(u.role)}
                  </span>
                </td>
                <td style={userStyles.td}>
                  <span style={{ ...userStyles.statusBadge, backgroundColor: u.is_active ? '#10b981' : '#ef4444' }}>
                    {u.is_active ? '✅ Active' : '❌ Inactive'}
                  </span>
                </td>
                <td style={userStyles.td}>{new Date(u.created_at).toLocaleDateString()}</td>
                <td style={userStyles.td}>
                  {u.id !== user.id ? (
                    <select
                      value={u.role}
                      onChange={(e) => updateUserRole(u.id, e.target.value)}
                      style={{ ...userStyles.roleSelect, backgroundColor: getRoleColor(u.role) }}
                    >
                      <option value="viewer">👀 Viewer</option>
                      <option value="analyst">🔍 Analyst</option>
                      <option value="admin">🛡️ Admin</option>
                    </select>
                  ) : (
                    <span style={userStyles.currentUserBadge}>Current User</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && (
          <div style={userStyles.noData}>No users found</div>
        )}
      </div>
    </div>
  );
};

const userStyles = {
  container: { backgroundColor: '#1e293b', padding: '20px', borderRadius: '8px', marginBottom: '20px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' },
  title: { color: '#38bdf8', margin: 0 },
  subtitle: { color: '#94a3b8', fontSize: '11px', marginTop: '5px' },
  headerActions: { display: 'flex', gap: '10px' },
  addBtn: { padding: '8px 16px', backgroundColor: '#38bdf8', color: '#0f172a', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' },
  refreshBtn: { padding: '8px 16px', backgroundColor: '#0f172a', color: '#94a3b8', border: '1px solid #334155', borderRadius: '4px', cursor: 'pointer' },
  message: { padding: '10px', borderRadius: '4px', marginBottom: '15px', textAlign: 'center' },
  registerBox: { backgroundColor: '#0f172a', padding: '20px', borderRadius: '8px', marginBottom: '20px' },
  registerTitle: { color: '#38bdf8', marginBottom: '15px' },
  input: { width: '100%', padding: '10px', marginBottom: '10px', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '4px', color: '#f8fafc', boxSizing: 'border-box' },
  select: { width: '100%', padding: '10px', marginBottom: '10px', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '4px', color: '#f8fafc', boxSizing: 'border-box' },
  submitBtn: { width: '100%', padding: '10px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' },
  legend: { display: 'flex', gap: '15px', padding: '10px', backgroundColor: '#0f172a', borderRadius: '4px', marginBottom: '15px', flexWrap: 'wrap', alignItems: 'center' },
  legendTitle: { color: '#94a3b8', fontSize: '12px', fontWeight: 'bold' },
  legendBadge: { padding: '2px 10px', borderRadius: '4px', fontSize: '11px', color: 'white' },
  tableContainer: { backgroundColor: '#0f172a', borderRadius: '8px', overflow: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', color: '#f8fafc' },
  tableHeader: { backgroundColor: '#1e293b', borderBottom: '1px solid #334155' },
  th: { padding: '10px', textAlign: 'left', fontSize: '11px', color: '#94a3b8' },
  tableRow: { borderBottom: '1px solid #1e293b' },
  td: { padding: '10px', fontSize: '12px' },
  roleBadge: { padding: '2px 10px', borderRadius: '4px', fontSize: '11px', color: 'white', display: 'inline-block' },
  statusBadge: { padding: '2px 8px', borderRadius: '4px', fontSize: '10px', color: 'white' },
  meBadge: { color: '#38bdf8', fontSize: '10px' },
  currentUserBadge: { padding: '2px 6px', backgroundColor: '#1e293b', borderRadius: '4px', fontSize: '10px', color: '#94a3b8' },
  roleSelect: { padding: '4px 8px', borderRadius: '4px', border: 'none', cursor: 'pointer', color: 'white' },
  noData: { textAlign: 'center', padding: '40px', color: '#64748b' }
};

// ===== MAIN DASHBOARD =====
const Dashboard = ({ user, onLogout }) => {
  const [evidence, setEvidence] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEvidence, setSelectedEvidence] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [expandedCases, setExpandedCases] = useState({});
  const [showUserManagement, setShowUserManagement] = useState(false);
  
  // File Preview
  const [previewFile, setPreviewFile] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  
  // Filters
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    dateFrom: '',
    dateTo: '',
    fileType: '',
    hasFile: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  
  // Case Notes
  const [caseNotes, setCaseNotes] = useState({});
  const [showNotes, setShowNotes] = useState({});
  const [newNote, setNewNote] = useState('');
  
  // Tags
  const [caseTags, setCaseTags] = useState({});
  const [allTags, setAllTags] = useState([]);
  const [showTagManager, setShowTagManager] = useState(false);
  const [newTag, setNewTag] = useState('');
  
  // Comparison
  const [compareList, setCompareList] = useState([]);
  const [showComparison, setShowComparison] = useState(false);
  
  // Case Dashboard
  const [showCaseDashboard, setShowCaseDashboard] = useState(false);

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

  const groupByCase = (items) => {
    const grouped = {};
    items.forEach(item => {
      const caseNum = item.case_number;
      if (!grouped[caseNum]) {
        grouped[caseNum] = [];
      }
      grouped[caseNum].push(item);
    });
    Object.keys(grouped).forEach(caseNum => {
      grouped[caseNum].sort((a, b) => a.id - b.id);
    });
    return grouped;
  };

  const getSortedItems = (items) => {
    return [...items].sort((a, b) => a.id - b.id);
  };

  const toggleCase = (caseNumber) => {
    setExpandedCases(prev => ({
      ...prev,
      [caseNumber]: !prev[caseNumber]
    }));
  };

  const getCaseStatus = (items) => {
    const statuses = items.map(i => i.status);
    if (statuses.every(s => s === 'Completed')) return 'Completed';
    if (statuses.every(s => s === 'Archived')) return 'Archived';
    if (statuses.some(s => s === 'Analyzing')) return 'Analyzing';
    if (statuses.some(s => s === 'Scanning')) return 'Scanning';
    return 'Intake';
  };

  const getCaseColor = (status) => {
    const colors = { 'Intake': '#f59e0b', 'Scanning': '#3b82f6', 'Analyzing': '#8b5cf6', 'Completed': '#10b981', 'Archived': '#64748b' };
    return colors[status] || '#6b7280';
  };

  // ===== CREATE EVIDENCE =====
  const createEvidence = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const token = localStorage.getItem('token');
    try {
      await axios.post('http://127.0.0.1:8000/api/evidence', null, {
        params: {
          case_number: formData.get('case_number'),
          description: formData.get('description'),
          category: formData.get('category')
        },
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchEvidence();
      e.target.reset();
      alert('✅ Evidence created successfully!');
    } catch (err) {
      alert('❌ Failed: ' + (err.response?.data?.detail || err.message));
    }
  };

  // ===== UPDATE STATUS =====
  const updateStatus = async (id, newStatus) => {
    const token = localStorage.getItem('token');
    try {
      await axios.patch(`http://127.0.0.1:8000/api/evidence/${id}/status`, null, {
        params: { new_status: newStatus, technician: user.username },
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchEvidence();
      alert('✅ Status updated!');
    } catch (err) {
      alert('❌ Failed to update status');
    }
  };

  // ===== UPLOAD FILE =====
  const uploadFile = async (id, file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    const token = localStorage.getItem('token');
    try {
      await axios.post(`http://127.0.0.1:8000/api/evidence/${id}/upload`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchEvidence();
      alert('✅ File uploaded successfully!');
    } catch (err) {
      alert('❌ Upload failed');
    }
  };

  // ===== DELETE EVIDENCE =====
  const deleteEvidence = async (id, caseNumber) => {
    if (window.confirm(`Delete this evidence from case "${caseNumber}"?`)) {
      const token = localStorage.getItem('token');
      try {
        await axios.delete(`http://127.0.0.1:8000/api/evidence/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchEvidence();
        alert('✅ Deleted!');
      } catch (err) {
        alert('❌ Delete failed');
      }
    }
  };

  // ===== VIEW DETAILS =====
  const viewDetails = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://127.0.0.1:8000/api/evidence/${id}/details`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedEvidence(response.data);
      setShowDetails(true);
    } catch (err) {
      alert('❌ Failed to load details');
    }
  };

  // ===== DOWNLOAD REPORT =====
  const downloadReport = (item) => {
    const report = 
`TRACELOCK FORENSIC REPORT
=========================
Generated: ${new Date().toLocaleString()}
Generated by: ${user.username} (${user.role})

EVIDENCE DETAILS
---------------
Case Number: ${item.case_number}
Evidence: ${item.description}
Category: ${item.category}
Status: ${item.status}
Created: ${new Date(item.created_at).toLocaleString()}

FORENSIC INTEGRITY
------------------
SHA-256 Hash: ${item.hash_value || 'Not calculated'}
File Attached: ${item.file_name || 'No file attached'}

This report is digitally signed by TraceLock Forensic System`;
    
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${item.case_number}_Evidence_${item.id}_Report.txt`;
    a.click();
    URL.revokeObjectURL(url);
    alert('✅ Report downloaded!');
  };

  // ===== DOWNLOAD CASE REPORT =====
  const downloadCaseReport = (caseNumber, items) => {
    let report = 
`TRACELOCK FORENSIC CASE REPORT
===============================
Generated: ${new Date().toLocaleString()}
Generated by: ${user.username} (${user.role})

CASE: ${caseNumber}
================================
Total Evidence Items: ${items.length}
Case Status: ${getCaseStatus(items)}

EVIDENCE ITEMS (in serial order):
`;
    const sortedItems = getSortedItems(items);
    sortedItems.forEach((item, index) => {
      const serialNumber = index + 1;
      report += `
--- Evidence #${serialNumber} ---
ID: ${item.id}
Evidence: ${item.description}
Category: ${item.category}
Status: ${item.status}
Hash: ${item.hash_value || 'Not calculated'}
File: ${item.file_name || 'No file attached'}
Created: ${new Date(item.created_at).toLocaleString()}
`;
    });

    report += `
This report is digitally signed by TraceLock Forensic System`;
    
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${caseNumber}_Case_Report.txt`;
    a.click();
    URL.revokeObjectURL(url);
    alert('✅ Case Report downloaded!');
  };

  // ===== BULK UPLOAD =====
  const bulkUploadToCase = (caseNumber) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = '*/*';
    input.onchange = async (e) => {
      const files = Array.from(e.target.files);
      if (files.length === 0) return;
      
      const token = localStorage.getItem('token');
      let success = 0;
      let failed = 0;
      
      for (let i = 0; i < files.length; i++) {
        try {
          const file = files[i];
          const formData = new FormData();
          formData.append('file', file);
          
          const evidenceRes = await axios.post('http://127.0.0.1:8000/api/evidence', null, {
            params: {
              case_number: caseNumber,
              description: file.name,
              category: 'Digital'
            },
            headers: { Authorization: `Bearer ${token}` }
          });
          
          await axios.post(`http://127.0.0.1:8000/api/evidence/${evidenceRes.data.id}/upload`, formData, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          success++;
        } catch (err) {
          failed++;
        }
      }
      
      fetchEvidence();
      alert(`✅ Bulk upload complete!\n📂 Case: ${caseNumber}\n✅ Success: ${success}\n❌ Failed: ${failed}`);
    };
    input.click();
  };

  // ===== EXPORT TO EXCEL =====
  const exportToExcel = async () => {
    const token = localStorage.getItem('token');
    const response = await axios.get('http://127.0.0.1:8000/api/evidence', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = response.data;
    if (data.length === 0) {
      alert('No data to export');
      return;
    }
    let csv = 'ID,Case Number,Serial Number,Evidence,Category,Status,File,Hash,Created\n';
    const grouped = groupByCase(data);
    Object.keys(grouped).sort().forEach(caseNum => {
      const items = getSortedItems(grouped[caseNum]);
      items.forEach((item, index) => {
        const serialNumber = index + 1;
        csv += `${item.id},"${item.case_number || ''}","${serialNumber}","${item.description || ''}","${item.category || ''}","${item.status || ''}","${item.file_name || ''}","${item.hash_value || ''}","${new Date(item.created_at).toLocaleString()}"\n`;
      });
    });
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `evidence_export_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    alert(`✅ Exported ${data.length} records`);
  };

  // ===== ANALYTICS =====
  const showAnalytics = async () => {
    const token = localStorage.getItem('token');
    const response = await axios.get('http://127.0.0.1:8000/api/evidence', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = response.data;
    const grouped = groupByCase(data);
    const total = data.length;
    const totalCases = Object.keys(grouped).length;
    const completed = data.filter(i => i.status === 'Completed').length;
    const analyzing = data.filter(i => i.status === 'Analyzing').length;
    const scanning = data.filter(i => i.status === 'Scanning').length;
    const intake = data.filter(i => i.status === 'Intake').length;
    const archived = data.filter(i => i.status === 'Archived').length;
    
    let caseBreakdown = '';
    Object.keys(grouped).sort().forEach(caseNum => {
      const items = getSortedItems(grouped[caseNum]);
      caseBreakdown += `  ${caseNum}: ${items.length} items\n`;
    });

    alert(
      `📊 ANALYTICS DASHBOARD\n` +
      `═══════════════════════\n\n` +
      `📈 Total Evidence: ${total}\n` +
      `📁 Total Cases: ${totalCases}\n` +
      `📁 With Files: ${data.filter(i => i.file_name).length}\n\n` +
      `📋 Status Breakdown:\n` +
      `  Intake: ${intake}\n` +
      `  Scanning: ${scanning}\n` +
      `  Analyzing: ${analyzing}\n` +
      `  Completed: ${completed}\n` +
      `  Archived: ${archived}\n\n` +
      `📂 Cases:\n${caseBreakdown}`
    );
  };

  // ============================================================
  // === FILE PREVIEW - WORKING VERSION ===
  // ============================================================
  const viewFilePreview = async (item) => {
    if (!item.file_name) {
      alert('No file attached to this evidence');
      return;
    }
    
    setPreviewLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.get(`http://127.0.0.1:8000/api/evidence/${item.id}/file`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Accept': '*/*'
        },
        responseType: 'blob'
      });
      
      const fileUrl = URL.createObjectURL(response.data);
      const fileType = item.file_name.split('.').pop().toLowerCase();
      
      setPreviewFile({
        name: item.file_name,
        type: fileType,
        size: item.file_size || response.data.size,
        hash: item.hash_value,
        url: fileUrl
      });
      setShowPreview(true);
      
    } catch (err) {
      console.error('Preview error:', err);
      if (err.response?.status === 404) {
        alert('File not found. Please upload the file again using the 📤 button.');
      } else {
        alert('Failed to load preview: ' + (err.response?.data?.detail || err.message));
      }
    } finally {
      setPreviewLoading(false);
    }
  };

  // ===== EVIDENCE COMPARISON =====
  const toggleCompare = (item) => {
    if (compareList.find(i => i.id === item.id)) {
      setCompareList(compareList.filter(i => i.id !== item.id));
    } else if (compareList.length < 3) {
      setCompareList([...compareList, item]);
    } else {
      alert('Maximum 3 items can be compared at once');
    }
  };

  const showComparisonModal = () => {
    if (compareList.length < 2) {
      alert('Select at least 2 items to compare');
      return;
    }
    setShowComparison(true);
  };

  // ===== TAGS =====
  const addTag = (caseNum) => {
    if (!newTag.trim()) return;
    const tag = newTag.trim();
    setCaseTags(prev => ({
      ...prev,
      [caseNum]: [...(prev[caseNum] || []), tag]
    }));
    if (!allTags.includes(tag)) {
      setAllTags([...allTags, tag]);
    }
    setNewTag('');
  };

  const removeTag = (caseNum, tag) => {
    setCaseTags(prev => ({
      ...prev,
      [caseNum]: (prev[caseNum] || []).filter(t => t !== tag)
    }));
  };

  const getTagColor = (tag) => {
    const colors = {
      'Urgent': '#ef4444', 'Confidential': '#8b5cf6',
      'Pending Review': '#f59e0b', 'Completed': '#10b981',
      'High Priority': '#dc2626', 'Low Priority': '#64748b',
      'Critical': '#dc2626', 'Normal': '#3b82f6'
    };
    return colors[tag] || '#64748b';
  };

  // ===== CASE NOTES =====
  const addNote = (caseNum) => {
    if (!newNote.trim()) return;
    const note = {
      id: Date.now(),
      text: newNote.trim(),
      author: user.username,
      timestamp: new Date().toISOString()
    };
    setCaseNotes(prev => ({
      ...prev,
      [caseNum]: [...(prev[caseNum] || []), note]
    }));
    setNewNote('');
  };

  const deleteNote = (caseNum, noteId) => {
    setCaseNotes(prev => ({
      ...prev,
      [caseNum]: (prev[caseNum] || []).filter(n => n.id !== noteId)
    }));
  };

  // ===== ADVANCED SEARCH =====
  const applyFilters = (items) => {
    return items.filter(item => {
      if (filters.status && item.status !== filters.status) return false;
      if (filters.category && item.category !== filters.category) return false;
      if (filters.hasFile === 'yes' && !item.file_name) return false;
      if (filters.hasFile === 'no' && item.file_name) return false;
      if (filters.dateFrom && new Date(item.created_at) < new Date(filters.dateFrom)) return false;
      if (filters.dateTo && new Date(item.created_at) > new Date(filters.dateTo)) return false;
      if (filters.fileType && item.file_name && !item.file_name.toLowerCase().endsWith(filters.fileType.toLowerCase())) return false;
      return true;
    });
  };

  // ===== CASE DASHBOARD =====
  const getCaseDashboardStats = () => {
    const grouped = groupByCase(evidence);
    const cases = Object.keys(grouped);
    const totalCases = cases.length;
    const totalEvidence = evidence.length;
    const withFiles = evidence.filter(i => i.file_name).length;
    
    const statusCount = {};
    evidence.forEach(i => {
      statusCount[i.status] = (statusCount[i.status] || 0) + 1;
    });
    
    const caseActivity = cases.map(c => ({
      case: c,
      count: grouped[c].length,
      status: getCaseStatus(grouped[c])
    })).sort((a, b) => b.count - a.count).slice(0, 5);
    
    return { totalCases, totalEvidence, withFiles, statusCount, caseActivity };
  };

  const getStatusColor = (status) => {
    const colors = { 'Intake': '#f59e0b', 'Scanning': '#3b82f6', 'Analyzing': '#8b5cf6', 'Completed': '#10b981', 'Archived': '#64748b' };
    return colors[status] || '#6b7280';
  };

  const filteredEvidence = applyFilters(evidence.filter(item =>
    item.case_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ));

  const groupedEvidence = groupByCase(filteredEvidence);
  const caseNumbers = Object.keys(groupedEvidence).sort();

  const dashboardStats = getCaseDashboardStats();

  if (loading) {
    return <div style={{ color: '#38bdf8', textAlign: 'center', marginTop: '50px' }}>Loading...</div>;
  }

  return (
    <div style={styles.container}>

      {/* HEADER */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>🔒 TraceLock Forensic Suite</h1>
          <p style={styles.subtitle}>Secure Evidence Management System</p>
        </div>
        <div style={styles.headerRight}>
          <span style={styles.userInfo}>{user.role.toUpperCase()} | {user.username}</span>
          <button 
            onClick={() => setShowCaseDashboard(!showCaseDashboard)} 
            style={{ ...styles.userMgmtBtn, backgroundColor: showCaseDashboard ? '#ef4444' : '#f59e0b' }}
          >
            {showCaseDashboard ? '✖ Close Dashboard' : '📊 Case Dashboard'}
          </button>
          {user.role === 'admin' && (
            <button 
              onClick={() => setShowUserManagement(!showUserManagement)} 
              style={{ ...styles.userMgmtBtn, backgroundColor: showUserManagement ? '#ef4444' : '#8b5cf6' }}
            >
              {showUserManagement ? '✖ Close Users' : '👥 Manage Users'}
            </button>
          )}
          <button onClick={onLogout} style={styles.logoutBtn}>🚪 Logout</button>
        </div>
      </div>

      {/* CASE DASHBOARD */}
      {showCaseDashboard && (
        <div style={styles.dashboardContainer}>
          <div style={styles.dashboardHeader}>
            <h2 style={styles.dashboardTitle}>📊 Case Dashboard Overview</h2>
            <button onClick={() => setShowCaseDashboard(false)} style={styles.dashboardClose}>✖</button>
          </div>
          
          <div style={styles.dashboardStatsGrid}>
            <div style={styles.dashboardStatCard}>
              <div style={styles.dashboardStatIcon}>📂</div>
              <div style={styles.dashboardStatNumber}>{dashboardStats.totalCases}</div>
              <div style={styles.dashboardStatLabel}>Total Cases</div>
            </div>
            <div style={styles.dashboardStatCard}>
              <div style={styles.dashboardStatIcon}>📄</div>
              <div style={styles.dashboardStatNumber}>{dashboardStats.totalEvidence}</div>
              <div style={styles.dashboardStatLabel}>Total Evidence</div>
            </div>
            <div style={styles.dashboardStatCard}>
              <div style={styles.dashboardStatIcon}>📁</div>
              <div style={styles.dashboardStatNumber}>{dashboardStats.withFiles}</div>
              <div style={styles.dashboardStatLabel}>With Files</div>
            </div>
            <div style={styles.dashboardStatCard}>
              <div style={styles.dashboardStatIcon}>✅</div>
              <div style={styles.dashboardStatNumber}>{dashboardStats.statusCount['Completed'] || 0}</div>
              <div style={styles.dashboardStatLabel}>Completed</div>
            </div>
          </div>

          <div style={styles.dashboardCharts}>
            <div style={styles.dashboardChart}>
              <h4>Status Distribution</h4>
              <div style={styles.dashboardChartBars}>
                {Object.entries(dashboardStats.statusCount).map(([status, count]) => (
                  <div key={status} style={styles.dashboardChartBar}>
                    <span style={styles.dashboardChartLabel}>{status}</span>
                    <div style={styles.dashboardChartTrack}>
                      <div style={{...styles.dashboardChartFill, width: `${(count / dashboardStats.totalEvidence) * 100}%`, backgroundColor: getStatusColor(status)}} />
                    </div>
                    <span style={styles.dashboardChartCount}>{count}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div style={styles.dashboardChart}>
              <h4>Most Active Cases</h4>
              <div style={styles.dashboardActiveList}>
                {dashboardStats.caseActivity.map((item, idx) => (
                  <div key={idx} style={styles.dashboardActiveItem}>
                    <span style={styles.dashboardActiveRank}>#{idx + 1}</span>
                    <span style={styles.dashboardActiveCase}>{item.case}</span>
                    <span style={styles.dashboardActiveCount}>{item.count} items</span>
                    <span style={{...styles.caseStatusBadge, backgroundColor: getCaseColor(item.status), fontSize: '10px', padding: '2px 6px'}}>{item.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={styles.dashboardActivity}>
            <h4>Recent Activity</h4>
            <div style={styles.dashboardActivityList}>
              {evidence.slice(0, 10).map(item => (
                <div key={item.id} style={styles.dashboardActivityItem}>
                  <span>📋 {item.case_number}</span>
                  <span style={{...styles.statusBadge, backgroundColor: getStatusColor(item.status)}}>{item.status}</span>
                  <span style={styles.dashboardActivityDate}>{new Date(item.created_at).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* USER MANAGEMENT */}
      {user.role === 'admin' && showUserManagement && (
        <UserManagement user={user} onLogout={onLogout} fetchEvidence={fetchEvidence} />
      )}

      {/* FEATURE BUTTONS */}
      <div style={styles.featureBox}>
        <div style={styles.featureHeader}>
          <h2 style={styles.featureTitle}>📊 FEATURES</h2>
          <div style={styles.featureActions}>
            <button onClick={() => setShowFilters(!showFilters)} style={styles.btnFilter}>
              {showFilters ? '✖ Close Filters' : '🔍 Advanced Search'}
            </button>
            <button onClick={showComparisonModal} style={styles.btnCompare}>
              📊 Compare ({compareList.length})
            </button>
            <button onClick={() => setShowTagManager(!showTagManager)} style={styles.btnTag}>
              🏷️ Tags
            </button>
          </div>
        </div>
        <div style={styles.featureButtons}>
          <button onClick={exportToExcel} style={styles.btnGreen}>📊 Export to Excel</button>
          <button onClick={showAnalytics} style={styles.btnPurple}>📈 Analytics</button>
        </div>
      </div>

      {/* ADVANCED FILTERS */}
      {showFilters && (
        <div style={styles.filterBox}>
          <h3 style={styles.filterTitle}>🔍 Advanced Search Filters</h3>
          <div style={styles.filterGrid}>
            <div style={styles.filterGroup}>
              <label>Status</label>
              <select value={filters.status} onChange={(e) => setFilters({...filters, status: e.target.value})} style={styles.filterSelect}>
                <option value="">All Status</option>
                <option value="Intake">Intake</option>
                <option value="Scanning">Scanning</option>
                <option value="Analyzing">Analyzing</option>
                <option value="Completed">Completed</option>
                <option value="Archived">Archived</option>
              </select>
            </div>
            <div style={styles.filterGroup}>
              <label>Category</label>
              <select value={filters.category} onChange={(e) => setFilters({...filters, category: e.target.value})} style={styles.filterSelect}>
                <option value="">All Categories</option>
                <option value="Digital">Digital</option>
                <option value="Physical">Physical</option>
                <option value="Biological">Biological</option>
                <option value="Document">Document</option>
                <option value="Network">Network</option>
              </select>
            </div>
            <div style={styles.filterGroup}>
              <label>Has File</label>
              <select value={filters.hasFile} onChange={(e) => setFilters({...filters, hasFile: e.target.value})} style={styles.filterSelect}>
                <option value="">All</option>
                <option value="yes">With File</option>
                <option value="no">Without File</option>
              </select>
            </div>
            <div style={styles.filterGroup}>
              <label>Date From</label>
              <input type="date" value={filters.dateFrom} onChange={(e) => setFilters({...filters, dateFrom: e.target.value})} style={styles.filterInput} />
            </div>
            <div style={styles.filterGroup}>
              <label>Date To</label>
              <input type="date" value={filters.dateTo} onChange={(e) => setFilters({...filters, dateTo: e.target.value})} style={styles.filterInput} />
            </div>
            <div style={styles.filterGroup}>
              <label>File Type</label>
              <select value={filters.fileType} onChange={(e) => setFilters({...filters, fileType: e.target.value})} style={styles.filterSelect}>
                <option value="">All Files</option>
                <option value="jpg">JPG</option>
                <option value="png">PNG</option>
                <option value="pdf">PDF</option>
                <option value="docx">DOCX</option>
                <option value="txt">TXT</option>
              </select>
            </div>
          </div>
          <div style={styles.filterActions}>
            <button onClick={() => setFilters({status: '', category: '', dateFrom: '', dateTo: '', fileType: '', hasFile: ''})} style={styles.filterClear}>Clear Filters</button>
            <span style={styles.filterCount}>{filteredEvidence.length} items found</span>
          </div>
        </div>
      )}

      {/* TAG MANAGER */}
      {showTagManager && (
        <div style={styles.tagBox}>
          <h3 style={styles.tagTitle}>🏷️ Tag Manager</h3>
          <div style={styles.tagList}>
            {allTags.map(tag => (
              <span key={tag} style={{...styles.tag, backgroundColor: getTagColor(tag)}}>
                {tag}
                <button onClick={() => setAllTags(allTags.filter(t => t !== tag))} style={styles.tagRemove}>×</button>
              </span>
            ))}
          </div>
          <div style={styles.tagAdd}>
            <input type="text" placeholder="New tag name..." value={newTag} onChange={(e) => setNewTag(e.target.value)} style={styles.tagInput} />
            <button onClick={() => { if (newTag.trim() && !allTags.includes(newTag.trim())) { setAllTags([...allTags, newTag.trim()]); setNewTag(''); } }} style={styles.tagAddBtn}>Add Tag</button>
          </div>
        </div>
      )}

      {/* INTAKE FORM */}
      {(user.role === 'analyst' || user.role === 'admin') && (
        <div style={styles.intakeBox}>
          <h3 style={styles.intakeTitle}>📋 New Evidence Intake</h3>
          <form onSubmit={createEvidence}>
            <input name="case_number" placeholder="Case Number (e.g., CASE-001)" required style={styles.input} />
            <textarea name="description" placeholder="Evidence Description" required style={styles.textarea} />
            <select name="category" style={styles.select}>
              <option value="Digital">Digital Evidence</option>
              <option value="Physical">Physical Evidence</option>
              <option value="Biological">Biological Evidence</option>
              <option value="Document">Documentary Evidence</option>
              <option value="Network">Network Evidence</option>
            </select>
            <button type="submit" style={styles.createBtn}>➕ Create Evidence</button>
          </form>
        </div>
      )}

      {/* STATISTICS CARDS */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>📊</div>
          <h3>Total Evidence</h3>
          <p style={styles.statNumber}>{evidence.length}</p>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>📂</div>
          <h3>Total Cases</h3>
          <p style={styles.statNumber}>{Object.keys(groupByCase(evidence)).length}</p>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>✅</div>
          <h3>Verified</h3>
          <p style={styles.statNumber}>{evidence.filter(i => i.status === 'Completed').length}</p>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>📁</div>
          <h3>With Files</h3>
          <p style={styles.statNumber}>{evidence.filter(i => i.file_name).length}</p>
        </div>
      </div>

      {/* SEARCH */}
      <input
        type="text"
        placeholder="🔍 Search by case number or evidence description..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={styles.searchInput}
      />

      {/* EVIDENCE TABLE */}
      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.tableHeader}>
              <th style={styles.th}>Case Number</th>
              <th style={styles.th}>Evidence</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {caseNumbers.map(caseNum => {
              const items = groupedEvidence[caseNum];
              const sortedItems = getSortedItems(items);
              const caseStatus = getCaseStatus(items);
              const isExpanded = expandedCases[caseNum] || false;
              const evidenceCount = items.length;
              
              return (
                <React.Fragment key={caseNum}>
                  <tr style={styles.caseRow} onClick={() => toggleCase(caseNum)}>
                    <td style={styles.caseTd}>
                      <span style={styles.expandIcon}>{isExpanded ? '▼' : '▶'}</span>
                      <strong style={{ color: '#38bdf8' }}>{caseNum}</strong>
                      {(caseTags[caseNum] || []).length > 0 && (
                        <span style={styles.tagContainer}>
                          {(caseTags[caseNum] || []).map(tag => (
                            <span key={tag} style={{...styles.tagSmall, backgroundColor: getTagColor(tag)}}>{tag}</span>
                          ))}
                        </span>
                      )}
                    </td>
                    <td style={styles.caseTd}>{evidenceCount} Evidence</td>
                    <td style={styles.caseTd}>
                      <span style={{ ...styles.caseStatusBadge, backgroundColor: getCaseColor(caseStatus) }}>
                        {caseStatus}
                      </span>
                    </td>
                    <td style={styles.caseTd}>
                      <div style={styles.actionButtons}>
                        <button onClick={(e) => { e.stopPropagation(); bulkUploadToCase(caseNum); }} style={styles.iconBtn} title="Bulk Upload">📦</button>
                        <button onClick={(e) => { e.stopPropagation(); downloadCaseReport(caseNum, items); }} style={styles.iconBtn} title="Download Case Report">📄</button>
                        <button onClick={(e) => { e.stopPropagation(); const tag = prompt('Enter tag name:'); if (tag && tag.trim()) { setCaseTags(prev => ({...prev, [caseNum]: [...(prev[caseNum] || []), tag.trim()]})); if (!allTags.includes(tag.trim())) setAllTags([...allTags, tag.trim()]); } }} style={styles.iconBtn} title="Add Tag">🏷️</button>
                        <button onClick={(e) => { e.stopPropagation(); setShowNotes(prev => ({...prev, [caseNum]: !prev[caseNum]})); }} style={styles.iconBtn} title="Notes">📝</button>
                        <button onClick={(e) => { e.stopPropagation(); toggleCompare({case_number: caseNum, items: items}); }} style={{...styles.iconBtn, backgroundColor: compareList.find(c => c.case_number === caseNum) ? '#10b981' : '#0f172a'}} title="Compare">📊</button>
                      </div>
                    </td>
                  </tr>
                  
                  {/* Notes Section */}
                  {isExpanded && showNotes[caseNum] && (
                    <tr>
                      <td colSpan="4" style={styles.notesSection}>
                        <div style={styles.notesContainer}>
                          <h4 style={styles.notesTitle}>📝 Case Notes</h4>
                          <div style={styles.notesList}>
                            {(caseNotes[caseNum] || []).map(note => (
                              <div key={note.id} style={styles.noteItem}>
                                <div style={styles.noteText}>{note.text}</div>
                                <div style={styles.noteMeta}>
                                  <span style={styles.noteAuthor}>👤 {note.author}</span>
                                  <span style={styles.noteDate}>{new Date(note.timestamp).toLocaleString()}</span>
                                  <button onClick={() => deleteNote(caseNum, note.id)} style={styles.noteDelete}>🗑️</button>
                                </div>
                              </div>
                            ))}
                          </div>
                          <div style={styles.noteAdd}>
                            <input type="text" placeholder="Add a note... @mention" value={newNote} onChange={(e) => setNewNote(e.target.value)} style={styles.noteInput} />
                            <button onClick={() => addNote(caseNum)} style={styles.noteAddBtn}>Add Note</button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                  
                  {/* Evidence Items */}
                  {isExpanded && sortedItems.map((item, index) => {
                    const serialNumber = index + 1;
                    return (
                      <tr key={item.id} style={styles.evidenceRow}>
                        <td style={{ ...styles.evidenceTd, paddingLeft: '40px' }}>
                          <span style={{ color: '#64748b', fontSize: '11px' }}>└─</span>
                          <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>#{serialNumber}</span>
                          <span style={{ color: '#64748b', fontSize: '10px', marginLeft: '5px' }}>(ID: {item.id})</span>
                        </td>
                        <td style={styles.evidenceTd}>
                          <span style={styles.evidenceDesc}>{item.description?.substring(0, 40)}...</span>
                        </td>
                        <td style={styles.evidenceTd}>
                          {user.role !== 'viewer' ? (
                            <select
                              value={item.status}
                              onChange={(e) => updateStatus(item.id, e.target.value)}
                              style={{ ...styles.statusBadge, backgroundColor: getStatusColor(item.status) }}
                            >
                              <option value="Intake">Intake</option>
                              <option value="Scanning">Scanning</option>
                              <option value="Analyzing">Analyzing</option>
                              <option value="Completed">Completed</option>
                              <option value="Archived">Archived</option>
                            </select>
                          ) : (
                            <span style={{ ...styles.statusBadge, backgroundColor: getStatusColor(item.status) }}>{item.status}</span>
                          )}
                        </td>
                        <td style={styles.evidenceTd}>
                          <div style={styles.actionButtons}>
                            <button onClick={() => viewDetails(item.id)} style={styles.iconBtn} title="Chain of Custody">👁️</button>
                            <button onClick={() => downloadReport(item)} style={styles.iconBtn} title="Download Report">📄</button>
                            
                            {/* FILE PREVIEW BUTTON */}
                            {item.file_name && (
                              <button 
                                onClick={() => viewFilePreview(item)} 
                                style={{...styles.iconBtn, backgroundColor: previewLoading ? '#64748b' : '#0f172a'}} 
                                title="Preview File" 
                                disabled={previewLoading}
                              >
                                {previewLoading ? '⏳' : '🖼️'}
                              </button>
                            )}
                            
                            {user.role !== 'viewer' && (
                              <>
                                <label style={styles.iconBtn} title="Upload File">
                                  📤
                                  <input
                                    type="file"
                                    style={{ display: 'none' }}
                                    onChange={(e) => uploadFile(item.id, e.target.files[0])}
                                  />
                                </label>
                                <button onClick={() => alert('Hash: ' + (item.hash_value || 'N/A'))} style={styles.iconBtn} title="View Hash">🔑</button>
                              </>
                            )}
                            {user.role === 'admin' && (
                              <button onClick={() => deleteEvidence(item.id, item.case_number)} style={{ ...styles.iconBtn, backgroundColor: '#7f1d1d' }} title="Delete">🗑️</button>
                            )}
                            <button 
                              onClick={() => toggleCompare(item)} 
                              style={{...styles.iconBtn, backgroundColor: compareList.find(i => i.id === item.id) ? '#10b981' : '#0f172a'}} 
                              title="Compare"
                            >📊</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
        {caseNumbers.length === 0 && (
          <div style={styles.noData}>
            {searchTerm ? 'No matching cases found' : 'No evidence records yet. Create your first evidence!'}
          </div>
        )}
      </div>

      {/* CHAIN OF CUSTODY MODAL */}
      {showDetails && selectedEvidence && (
        <div style={styles.modalOverlay} onClick={() => setShowDetails(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Chain of Custody</h2>
              <button onClick={() => setShowDetails(false)} style={styles.modalClose}>✖</button>
            </div>
            <div style={styles.modalBody}>
              <p><strong>Case:</strong> {selectedEvidence.case_number}</p>
              <p><strong>Evidence:</strong> {selectedEvidence.description}</p>
              <p><strong>Category:</strong> {selectedEvidence.category}</p>
              <p><strong>Status:</strong> {selectedEvidence.status}</p>
              <p><strong>Hash:</strong> <code>{selectedEvidence.hash}</code></p>
              <hr style={styles.divider} />
              <h3>Activity Log</h3>
              {selectedEvidence.history?.map((log, idx) => (
                <div key={idx} style={styles.logEntry}>
                  <strong>📋 {log.action}</strong><br />
                  <small>👤 {log.technician} | 📅 {new Date(log.timestamp).toLocaleString()}</small>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* FILE PREVIEW MODAL */}
      {showPreview && previewFile && (
        <div style={styles.modalOverlay} onClick={() => { 
          setShowPreview(false); 
          if (previewFile.url) URL.revokeObjectURL(previewFile.url); 
        }}>
          <div style={{...styles.modal, maxWidth: '800px'}} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>🖼️ File Preview</h2>
              <button onClick={() => { 
                setShowPreview(false); 
                if (previewFile.url) URL.revokeObjectURL(previewFile.url); 
              }} style={styles.modalClose}>✖</button>
            </div>
            <div style={styles.modalBody}>
              <p><strong>File:</strong> {previewFile.name}</p>
              <p><strong>Size:</strong> {(previewFile.size / 1024).toFixed(2)} KB</p>
              <p><strong>Hash:</strong> <code style={{ wordBreak: 'break-all', fontSize: '10px' }}>{previewFile.hash}</code></p>
              <div style={styles.previewContainer}>
                {['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(previewFile.type) && previewFile.url ? (
                  <img 
                    src={previewFile.url} 
                    alt="Preview" 
                    style={styles.previewImage} 
                    onError={() => {
                      alert('Error displaying image. The file may be corrupted.');
                    }}
                  />
                ) : previewFile.type === 'pdf' ? (
                  <embed src={previewFile.url} type="application/pdf" style={styles.previewPdf} />
                ) : (
                  <div style={styles.previewPlaceholder}>
                    <div style={styles.previewIcon}>📄</div>
                    <p>Preview not available for .{previewFile.type} files</p>
                  </div>
                )}
              </div>
              <div style={styles.previewActions}>
                <a href={previewFile.url} download={previewFile.name} style={styles.previewDownloadBtn}>📥 Download File</a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* COMPARISON MODAL */}
      {showComparison && (
        <div style={styles.modalOverlay} onClick={() => setShowComparison(false)}>
          <div style={{...styles.modal, maxWidth: '900px'}} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>📊 Evidence Comparison</h2>
              <button onClick={() => setShowComparison(false)} style={styles.modalClose}>✖</button>
            </div>
            <div style={styles.modalBody}>
              <div style={styles.comparisonGrid}>
                {compareList.map(item => (
                  <div key={item.id} style={styles.comparisonCard}>
                    <h4 style={styles.comparisonTitle}>{item.case_number}</h4>
                    <div style={styles.comparisonField}><strong>ID:</strong> #{item.id}</div>
                    <div style={styles.comparisonField}><strong>Description:</strong> {item.description}</div>
                    <div style={styles.comparisonField}><strong>Category:</strong> {item.category}</div>
                    <div style={styles.comparisonField}><strong>Status:</strong> <span style={{...styles.statusBadge, backgroundColor: getStatusColor(item.status)}}>{item.status}</span></div>
                    <div style={styles.comparisonField}><strong>Hash:</strong> <code>{item.hash_value?.substring(0, 16)}...</code></div>
                    <div style={styles.comparisonField}><strong>File:</strong> {item.file_name || 'None'}</div>
                    <div style={styles.comparisonField}><strong>Created:</strong> {new Date(item.created_at).toLocaleDateString()}</div>
                    <button onClick={() => setCompareList(compareList.filter(i => i.id !== item.id))} style={styles.comparisonRemove}>Remove</button>
                  </div>
                ))}
              </div>
              {compareList.length < 2 && <p style={styles.comparisonNote}>Select at least 2 items to compare</p>}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

// ===== STYLES =====
const styles = {
  container: { backgroundColor: '#0f172a', minHeight: '100vh', padding: '20px', fontFamily: 'monospace' },
  header: { backgroundColor: '#1e293b', padding: '20px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' },
  title: { color: '#38bdf8', margin: 0, fontSize: '22px' },
  subtitle: { color: '#94a3b8', fontSize: '11px', marginTop: '4px' },
  headerRight: { display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' },
  userInfo: { color: '#f8fafc', fontSize: '13px' },
  userMgmtBtn: { padding: '8px 16px', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' },
  logoutBtn: { padding: '8px 16px', backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' },
  
  featureBox: { backgroundColor: '#1e293b', padding: '20px', borderRadius: '8px', marginBottom: '20px', border: '3px solid #38bdf8' },
  featureHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' },
  featureTitle: { color: '#38bdf8', fontSize: '18px', margin: 0 },
  featureActions: { display: 'flex', gap: '10px', flexWrap: 'wrap' },
  featureButtons: { display: 'flex', gap: '15px', flexWrap: 'wrap' },
  btnGreen: { padding: '12px 25px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' },
  btnPurple: { padding: '12px 25px', backgroundColor: '#8b5cf6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' },
  btnFilter: { padding: '8px 16px', backgroundColor: '#f59e0b', color: '#0f172a', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' },
  btnCompare: { padding: '8px 16px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' },
  btnTag: { padding: '8px 16px', backgroundColor: '#8b5cf6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' },
  
  filterBox: { backgroundColor: '#1e293b', padding: '20px', borderRadius: '8px', marginBottom: '20px' },
  filterTitle: { color: '#38bdf8', marginBottom: '15px' },
  filterGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' },
  filterGroup: { display: 'flex', flexDirection: 'column', gap: '5px' },
  filterSelect: { padding: '8px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '4px', color: '#f8fafc' },
  filterInput: { padding: '8px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '4px', color: '#f8fafc' },
  filterActions: { display: 'flex', justifyContent: 'space-between', marginTop: '15px', alignItems: 'center' },
  filterClear: { padding: '6px 12px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  filterCount: { color: '#94a3b8', fontSize: '12px' },
  
  tagBox: { backgroundColor: '#1e293b', padding: '20px', borderRadius: '8px', marginBottom: '20px' },
  tagTitle: { color: '#38bdf8', marginBottom: '15px' },
  tagList: { display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '15px' },
  tag: { padding: '4px 12px', borderRadius: '4px', color: 'white', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' },
  tagRemove: { background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '14px' },
  tagAdd: { display: 'flex', gap: '10px' },
  tagInput: { flex: 1, padding: '8px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '4px', color: '#f8fafc' },
  tagAddBtn: { padding: '8px 16px', backgroundColor: '#38bdf8', color: '#0f172a', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' },
  tagContainer: { display: 'inline-flex', gap: '4px', marginLeft: '8px' },
  tagSmall: { padding: '2px 6px', borderRadius: '3px', fontSize: '8px', color: 'white' },
  
  notesSection: { padding: '10px 20px', backgroundColor: '#0f172a' },
  notesContainer: { backgroundColor: '#0f172a', padding: '15px', borderRadius: '4px' },
  notesTitle: { color: '#38bdf8', marginBottom: '10px' },
  notesList: { maxHeight: '200px', overflow: 'auto', marginBottom: '10px' },
  noteItem: { backgroundColor: '#1e293b', padding: '10px', borderRadius: '4px', marginBottom: '8px' },
  noteText: { color: '#f8fafc' },
  noteMeta: { display: 'flex', gap: '10px', marginTop: '5px', fontSize: '10px', color: '#94a3b8', alignItems: 'center' },
  noteAuthor: { color: '#38bdf8' },
  noteDate: { color: '#64748b' },
  noteDelete: { background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' },
  noteAdd: { display: 'flex', gap: '10px' },
  noteInput: { flex: 1, padding: '8px', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '4px', color: '#f8fafc' },
  noteAddBtn: { padding: '8px 16px', backgroundColor: '#38bdf8', color: '#0f172a', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' },
  
  dashboardContainer: { backgroundColor: '#1e293b', padding: '20px', borderRadius: '8px', marginBottom: '20px' },
  dashboardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  dashboardTitle: { color: '#38bdf8', margin: 0 },
  dashboardClose: { background: 'none', border: 'none', color: '#94a3b8', fontSize: '20px', cursor: 'pointer' },
  dashboardStatsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', marginBottom: '20px' },
  dashboardStatCard: { backgroundColor: '#0f172a', padding: '15px', borderRadius: '8px', textAlign: 'center' },
  dashboardStatIcon: { fontSize: '24px' },
  dashboardStatNumber: { fontSize: '28px', fontWeight: 'bold', color: '#38bdf8' },
  dashboardStatLabel: { fontSize: '11px', color: '#94a3b8' },
  dashboardCharts: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' },
  dashboardChart: { backgroundColor: '#0f172a', padding: '15px', borderRadius: '8px' },
  dashboardChartBars: { marginTop: '10px' },
  dashboardChartBar: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' },
  dashboardChartLabel: { width: '80px', fontSize: '11px', color: '#94a3b8' },
  dashboardChartTrack: { flex: 1, height: '16px', backgroundColor: '#1e293b', borderRadius: '8px', overflow: 'hidden' },
  dashboardChartFill: { height: '100%', borderRadius: '8px', transition: 'width 0.5s' },
  dashboardChartCount: { width: '30px', fontSize: '11px', color: '#94a3b8' },
  dashboardActiveList: { marginTop: '10px' },
  dashboardActiveItem: { display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 0', borderBottom: '1px solid #1e293b' },
  dashboardActiveRank: { color: '#64748b', fontSize: '11px', width: '30px' },
  dashboardActiveCase: { flex: 1, color: '#38bdf8', fontSize: '13px' },
  dashboardActiveCount: { color: '#94a3b8', fontSize: '11px' },
  dashboardActivity: { backgroundColor: '#0f172a', padding: '15px', borderRadius: '8px' },
  dashboardActivityList: { marginTop: '10px' },
  dashboardActivityItem: { display: 'flex', alignItems: 'center', gap: '10px', padding: '4px 0', borderBottom: '1px solid #1e293b', fontSize: '12px' },
  dashboardActivityDate: { marginLeft: 'auto', color: '#64748b', fontSize: '10px' },
  
  intakeBox: { backgroundColor: '#1e293b', padding: '20px', borderRadius: '8px', marginBottom: '20px' },
  intakeTitle: { color: '#38bdf8', marginBottom: '15px' },
  input: { width: '100%', padding: '10px', marginBottom: '10px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '4px', color: '#f8fafc', boxSizing: 'border-box' },
  textarea: { width: '100%', padding: '10px', marginBottom: '10px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '4px', color: '#f8fafc', minHeight: '80px', boxSizing: 'border-box' },
  select: { width: '100%', padding: '10px', marginBottom: '10px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '4px', color: '#f8fafc', boxSizing: 'border-box' },
  createBtn: { width: '100%', padding: '10px', backgroundColor: '#38bdf8', color: '#0f172a', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' },
  
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '20px' },
  statCard: { backgroundColor: '#1e293b', padding: '20px', borderRadius: '8px', textAlign: 'center' },
  statIcon: { fontSize: '32px' },
  statNumber: { fontSize: '28px', color: '#38bdf8', margin: '10px 0 0 0' },
  
  searchInput: { width: '100%', padding: '12px', marginBottom: '20px', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f8fafc', fontSize: '14px', boxSizing: 'border-box' },
  
  tableContainer: { backgroundColor: '#1e293b', borderRadius: '8px', overflow: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', color: '#f8fafc' },
  tableHeader: { backgroundColor: '#0f172a', borderBottom: '1px solid #334155' },
  th: { padding: '12px', textAlign: 'left', fontSize: '12px', color: '#94a3b8' },
  caseRow: { backgroundColor: '#1e293b', borderBottom: '1px solid #334155', cursor: 'pointer' },
  caseTd: { padding: '12px', fontSize: '14px', fontWeight: 'bold' },
  expandIcon: { marginRight: '10px', color: '#94a3b8', fontSize: '12px' },
  caseStatusBadge: { padding: '4px 10px', borderRadius: '4px', fontSize: '12px', color: 'white' },
  evidenceRow: { backgroundColor: '#0f172a', borderBottom: '1px solid #1e293b' },
  evidenceTd: { padding: '10px 12px', fontSize: '12px' },
  evidenceDesc: { color: '#94a3b8', fontSize: '12px' },
  statusBadge: { padding: '4px 8px', borderRadius: '4px', fontSize: '11px', border: 'none', cursor: 'pointer', color: 'white' },
  actionButtons: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  iconBtn: { padding: '5px 8px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' },
  noData: { textAlign: 'center', padding: '40px', color: '#64748b' },
  
  comparisonGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' },
  comparisonCard: { backgroundColor: '#0f172a', padding: '15px', borderRadius: '8px', border: '1px solid #334155' },
  comparisonTitle: { color: '#38bdf8', marginBottom: '10px' },
  comparisonField: { marginBottom: '5px', fontSize: '12px' },
  comparisonRemove: { marginTop: '10px', padding: '4px 12px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  comparisonNote: { textAlign: 'center', color: '#64748b', padding: '20px' },
  
  previewContainer: { marginTop: '15px', padding: '20px', backgroundColor: '#0f172a', borderRadius: '4px', textAlign: 'center' },
  previewImage: { maxWidth: '100%', maxHeight: '500px', objectFit: 'contain', borderRadius: '4px', backgroundColor: '#0f172a' },
  previewPdf: { width: '100%', height: '500px', border: 'none' },
  previewPlaceholder: { textAlign: 'center', padding: '40px', color: '#64748b' },
  previewIcon: { fontSize: '64px', marginBottom: '10px' },
  previewActions: { marginTop: '15px', textAlign: 'center' },
  previewDownloadBtn: { padding: '10px 20px', backgroundColor: '#38bdf8', color: '#0f172a', border: 'none', borderRadius: '4px', cursor: 'pointer', textDecoration: 'none', display: 'inline-block', fontWeight: 'bold' },
  
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { backgroundColor: '#1e293b', borderRadius: '8px', maxWidth: '500px', width: '90%', maxHeight: '80vh', overflow: 'auto' },
  modalHeader: { padding: '20px', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { color: '#38bdf8', margin: 0 },
  modalClose: { background: 'none', border: 'none', color: '#94a3b8', fontSize: '20px', cursor: 'pointer' },
  modalBody: { padding: '20px' },
  divider: { borderColor: '#334155', margin: '15px 0' },
  logEntry: { padding: '10px', margin: '10px 0', backgroundColor: '#0f172a', borderRadius: '4px' }
};

// ===== MAIN APP =====
function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setUser(JSON.parse(userData));
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
  };

  if (loading) {
    return <div style={{ textAlign: 'center', marginTop: '50px', color: '#38bdf8' }}>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return <Dashboard user={user} onLogout={handleLogout} />;
}

export default App;