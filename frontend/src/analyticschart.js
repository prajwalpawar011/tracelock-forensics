import React, { useState } from 'react';

const AnalyticsChart = ({ evidence }) => {
  const [showChart, setShowChart] = useState(false);
  
  const getStatusCounts = () => {
    const counts = {
      Intake: 0, Scanning: 0, Analyzing: 0, Completed: 0, Archived: 0
    };
    evidence.forEach(item => {
      if (counts[item.status] !== undefined) counts[item.status]++;
    });
    return counts;
  };
  
  const getCategoryCounts = () => {
    const counts = {};
    evidence.forEach(item => {
      counts[item.category] = (counts[item.category] || 0) + 1;
    });
    return counts;
  };
  
  const statusCounts = getStatusCounts();
  const categoryCounts = getCategoryCounts();
  const total = evidence.length;
  
  const ChartBar = ({ label, count, color, total }) => {
    const percentage = total > 0 ? (count / total) * 100 : 0;
    return (
      <div style={styles.chartBar}>
        <div style={styles.chartLabel}>{label}</div>
        <div style={styles.chartBarBg}>
          <div style={{...styles.chartBarFill, width: `${percentage}%`, backgroundColor: color}} />
        </div>
        <div style={styles.chartCount}>{count} ({percentage.toFixed(1)}%)</div>
      </div>
    );
  };
  
  if (!showChart) {
    return (
      <button onClick={() => setShowChart(true)} style={styles.showBtn}>
        📊 Show Analytics Dashboard
      </button>
    );
  }
  
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>Analytics Dashboard</h3>
        <button onClick={() => setShowChart(false)} style={styles.closeBtn}>✖ Close</button>
      </div>
      
      <div style={styles.statsGrid}>
        <div style={styles.statBox}>
          <div style={styles.statNumber}>{total}</div>
          <div style={styles.statLabel}>Total Evidence</div>
        </div>
        <div style={styles.statBox}>
          <div style={styles.statNumber}>{evidence.filter(i => i.file_name).length}</div>
          <div style={styles.statLabel}>With Files</div>
        </div>
        <div style={styles.statBox}>
          <div style={styles.statNumber}>{evidence.filter(i => i.status === 'Completed').length}</div>
          <div style={styles.statLabel}>Completed</div>
        </div>
        <div style={styles.statBox}>
          <div style={styles.statNumber}>{evidence.filter(i => i.status === 'Analyzing').length}</div>
          <div style={styles.statLabel}>In Analysis</div>
        </div>
      </div>
      
      <div style={styles.section}>
        <h4>Status Distribution</h4>
        {Object.entries(statusCounts).map(([status, count]) => (
          <ChartBar 
            key={status} 
            label={status} 
            count={count} 
            total={total}
            color={status === 'Intake' ? '#f59e0b' : status === 'Scanning' ? '#3b82f6' : status === 'Analyzing' ? '#8b5cf6' : status === 'Completed' ? '#10b981' : '#64748b'}
          />
        ))}
      </div>
      
      <div style={styles.section}>
        <h4>Category Distribution</h4>
        {Object.entries(categoryCounts).map(([category, count]) => (
          <ChartBar key={category} label={category} count={count} total={total} color="#38bdf8" />
        ))}
      </div>
      
      <div style={styles.section}>
        <h4>Recent Activity (Last 7 days)</h4>
        <div style={styles.activityList}>
          {evidence.slice(0, 5).map(item => (
            <div key={item.id} style={styles.activityItem}>
              <span>🔍 {item.case_number}</span>
              <span style={styles.activityStatus}>{item.status}</span>
              <span style={styles.activityDate}>{new Date(item.created_at).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: { backgroundColor: '#1e293b', padding: '20px', borderRadius: '8px', marginBottom: '20px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  title: { color: '#38bdf8', margin: 0 },
  closeBtn: { padding: '5px 10px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  showBtn: { padding: '10px 20px', backgroundColor: '#38bdf8', color: '#0f172a', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', marginBottom: '20px' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', marginBottom: '20px' },
  statBox: { backgroundColor: '#0f172a', padding: '15px', borderRadius: '8px', textAlign: 'center' },
  statNumber: { fontSize: '24px', fontWeight: 'bold', color: '#38bdf8' },
  statLabel: { fontSize: '11px', color: '#94a3b8' },
  section: { marginBottom: '20px' },
  chartBar: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' },
  chartLabel: { width: '100px', fontSize: '12px' },
  chartBarBg: { flex: 1, height: '20px', backgroundColor: '#0f172a', borderRadius: '10px', overflow: 'hidden' },
  chartBarFill: { height: '100%', transition: 'width 0.5s' },
  chartCount: { width: '80px', fontSize: '11px', color: '#94a3b8' },
  activityList: { backgroundColor: '#0f172a', borderRadius: '8px', overflow: 'hidden' },
  activityItem: { padding: '10px', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  activityStatus: { padding: '2px 6px', backgroundColor: '#1e293b', borderRadius: '4px', fontSize: '10px' },
  activityDate: { fontSize: '10px', color: '#64748b' }
};

export default AnalyticsChart;