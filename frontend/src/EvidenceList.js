import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Database, ShieldCheck, FileText, Activity, Upload, Search, Eye, Download } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const EvidenceList = ({ userRole }) => {
    const [evidence, setEvidence] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState({});

    const fetchEvidence = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://127.0.0.1:8000/api/evidence', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setEvidence(response.data);
        } catch (err) { 
            console.error(err);
            if (err.response?.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.reload();
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvidence();
        const interval = setInterval(fetchEvidence, 10000);
        return () => clearInterval(interval);
    }, []);

    const handleFileUpload = async (id) => {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.onchange = async (e) => {
            const file = e.target.files[0];
            const formData = new FormData();
            formData.append('file', file);
            
            setUploading(prev => ({ ...prev, [id]: true }));
            
            try {
                const token = localStorage.getItem('token');
                await axios.post(`http://127.0.0.1:8000/api/evidence/${id}/upload`, formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                alert("File Uploaded & Hashed Successfully!");
                fetchEvidence();
            } catch (err) { 
                alert("Upload Failed: " + (err.response?.data?.detail || err.message));
            } finally {
                setUploading(prev => ({ ...prev, [id]: false }));
            }
        };
        fileInput.click();
    };

    const downloadReport = (item) => {
        const doc = new jsPDF();
        doc.setTextColor(15, 23, 42);
        doc.setFont("helvetica", "bold");
        doc.text("TRACELOCK FORENSIC REPORT", 14, 20);
        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
        
        autoTable(doc, {
            startY: 40,
            head: [['Field', 'Value']],
            body: [
                ['Case Number', item.case_number],
                ['Description', item.description],
                ['Category', item.category],
                ['Status', item.status],
                ['File Name', item.file_name || 'No file attached'],
                ['File Size', item.file_size ? `${(item.file_size / 1024).toFixed(2)} KB` : 'N/A'],
                ['Integrity Hash (SHA-256)', item.hash_value || 'Not calculated'],
                ['Created', new Date(item.created_at).toLocaleString()]
            ],
            theme: 'striped',
            headStyles: { fillColor: [56, 189, 248], textColor: [15, 23, 42] },
            styles: { fontSize: 10 }
        });
        
        doc.save(`${item.case_number}_Forensic_Report.pdf`);
    };

    const viewDetails = (item) => {
        alert(`Case: ${item.case_number}\nStatus: ${item.status}\nHash: ${item.hash_value?.substring(0, 32)}...\nDescription: ${item.description}`);
    };

    const updateStatus = async (id, newStatus) => {
        const technician = localStorage.getItem('username') || 'Forensic Analyst';
        try {
            const token = localStorage.getItem('token');
            await axios.patch(`http://127.0.0.1:8000/api/evidence/${id}/status`, null, {
                params: { new_status: newStatus, technician: technician },
                headers: { Authorization: `Bearer ${token}` }
            });
            alert("Status updated successfully!");
            fetchEvidence();
        } catch (err) {
            alert("Status update failed: " + (err.response?.data?.detail || err.message));
        }
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
        return <div style={styles.loading}>Loading evidence records...</div>;
    }

    return (
        <div style={styles.container}>
            <div style={styles.statsBar}>
                <div style={styles.statCard}>
                    <Database size={20} color="#38bdf8" />
                    <div>
                        <div style={styles.statValue}>{evidence.length}</div>
                        <div style={styles.statLabel}>Total Evidence</div>
                    </div>
                </div>
                <div style={styles.statCard}>
                    <Activity size={20} color="#fbbf24" />
                    <div>
                        <div style={styles.statValue}>{evidence.filter(i => i.status !== 'Completed' && i.status !== 'Archived').length}</div>
                        <div style={styles.statLabel}>Active Cases</div>
                    </div>
                </div>
                <div style={styles.statCard}>
                    <ShieldCheck size={20} color="#10b981" />
                    <div>
                        <div style={styles.statValue}>{evidence.filter(i => i.status === 'Completed').length}</div>
                        <div style={styles.statLabel}>Verified</div>
                    </div>
                </div>
            </div>

            <div style={styles.tableContainer}>
                <div style={styles.toolbar}>
                    <h3 style={styles.tableTitle}>EVIDENCE DATABASE</h3>
                    <div style={styles.searchWrapper}>
                        <Search size={14} color="#94a3b8" />
                        <input 
                            type="text" 
                            placeholder="Search case number or description..." 
                            style={styles.searchInput} 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div style={styles.tableWrapper}>
                    <table style={styles.table}>
                        <thead>
                            <tr style={styles.tableHeader}>
                                <th style={styles.th}>ID</th>
                                <th style={styles.th}>CASE NUMBER</th>
                                <th style={styles.th}>DESCRIPTION</th>
                                <th style={styles.th}>STATUS</th>
                                <th style={styles.th}>FILE</th>
                                <th style={styles.th}>ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredEvidence.map(item => (
                                <tr key={item.id} style={styles.tableRow}>
                                    <td style={styles.td}>{item.id}</td>
                                    <td style={styles.td}>
                                        <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>{item.case_number}</span>
                                    </td>
                                    <td style={styles.td}>
                                        {item.description?.length > 50 ? `${item.description.substring(0, 50)}...` : item.description}
                                    </td>
                                    <td style={styles.td}>
                                        {userRole !== 'viewer' ? (
                                            <select 
                                                value={item.status} 
                                                onChange={(e) => updateStatus(item.id, e.target.value)}
                                                style={{...styles.statusBadge, backgroundColor: getStatusColor(item.status)}}
                                            >
                                                <option value="Intake">Intake</option>
                                                <option value="Scanning">Scanning</option>
                                                <option value="Analyzing">Analyzing</option>
                                                <option value="Completed">Completed</option>
                                                <option value="Archived">Archived</option>
                                            </select>
                                        ) : (
                                            <span style={{...styles.statusBadge, backgroundColor: getStatusColor(item.status)}}>
                                                {item.status}
                                            </span>
                                        )}
                                    </td>
                                    <td style={styles.td}>
                                        {item.file_name ? (
                                            <span style={styles.fileBadge}>
                                                <FileText size={12} /> {item.file_name.length > 20 ? item.file_name.substring(0, 20) + '...' : item.file_name}
                                            </span>
                                        ) : (
                                            <span style={styles.noFile}>No file</span>
                                        )}
                                    </td>
                                    <td style={styles.td}>
                                        <div style={styles.actionButtons}>
                                            <button onClick={() => viewDetails(item)} style={styles.iconBtn} title="View Details">
                                                <Eye size={14} />
                                            </button>
                                            <button onClick={() => downloadReport(item)} style={styles.iconBtn} title="Download Report">
                                                <Download size={14} />
                                            </button>
                                            {userRole !== 'viewer' && (
                                                <>
                                                    <button 
                                                        onClick={() => handleFileUpload(item.id)} 
                                                        style={styles.iconBtn} 
                                                        title="Upload File"
                                                        disabled={uploading[item.id]}
                                                    >
                                                        <Upload size={14} />
                                                    </button>
                                                    <button 
                                                        onClick={() => alert(`SHA-256 Hash:\n${item.hash_value}`)} 
                                                        style={styles.iconBtn} 
                                                        title="View Hash"
                                                    >
                                                        <ShieldCheck size={14} />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                
                {filteredEvidence.length === 0 && (
                    <div style={styles.noData}>
                        No evidence records found
                    </div>
                )}
            </div>
        </div>
    );
};

const styles = {
    container: {
        backgroundColor: '#0f172a',
        padding: '20px',
        minHeight: '100vh'
    },
    statsBar: {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '20px',
        marginBottom: '30px'
    },
    statCard: {
        backgroundColor: '#1e293b',
        padding: '15px',
        borderRadius: '8px',
        border: '1px solid #334155',
        display: 'flex',
        alignItems: 'center',
        gap: '15px',
        color: '#f8fafc'
    },
    statValue: {
        fontSize: '24px',
        fontWeight: 'bold',
        color: '#38bdf8'
    },
    statLabel: {
        fontSize: '11px',
        color: '#94a3b8',
        fontFamily: 'monospace'
    },
    tableContainer: {
        backgroundColor: '#1e293b',
        borderRadius: '8px',
        border: '1px solid #334155',
        overflow: 'hidden'
    },
    toolbar: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '15px 20px',
        borderBottom: '1px solid #334155',
        flexWrap: 'wrap',
        gap: '10px'
    },
    tableTitle: {
        color: '#38bdf8',
        fontFamily: 'monospace',
        fontSize: '14px',
        margin: 0
    },
    searchWrapper: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        backgroundColor: '#0f172a',
        padding: '6px 12px',
        borderRadius: '6px',
        border: '1px solid #334155'
    },
    searchInput: {
        background: 'none',
        border: 'none',
        color: '#f8fafc',
        outline: 'none',
        fontSize: '12px',
        fontFamily: 'monospace',
        width: '200px'
    },
    tableWrapper: {
        overflowX: 'auto'
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        fontFamily: 'monospace'
    },
    tableHeader: {
        backgroundColor: '#0f172a',
        borderBottom: '1px solid #334155'
    },
    th: {
        padding: '12px',
        textAlign: 'left',
        fontSize: '11px',
        color: '#94a3b8',
        fontWeight: 'bold'
    },
    tableRow: {
        borderBottom: '1px solid #334155',
        transition: 'background-color 0.2s'
    },
    td: {
        padding: '12px',
        fontSize: '12px',
        color: '#cbd5e1'
    },
    statusBadge: {
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '10px',
        border: 'none',
        cursor: 'pointer',
        fontFamily: 'monospace',
        fontWeight: 'bold',
        color: 'white'
    },
    fileBadge: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: '3px 8px',
        backgroundColor: '#0f172a',
        borderRadius: '4px',
        fontSize: '10px',
        color: '#94a3b8'
    },
    noFile: {
        fontSize: '10px',
        color: '#64748b',
        fontStyle: 'italic'
    },
    actionButtons: {
        display: 'flex',
        gap: '8px',
        flexWrap: 'wrap'
    },
    iconBtn: {
        padding: '5px',
        backgroundColor: '#0f172a',
        border: '1px solid #334155',
        color: '#38bdf8',
        borderRadius: '4px',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px'
    },
    loading: {
        textAlign: 'center',
        padding: '40px',
        color: '#94a3b8',
        fontFamily: 'monospace',
        backgroundColor: '#0f172a',
        minHeight: '100vh'
    },
    noData: {
        textAlign: 'center',
        padding: '40px',
        color: '#64748b',
        fontFamily: 'monospace'
    }
};

export default EvidenceList;