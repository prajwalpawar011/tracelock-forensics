import React from 'react';

const ExportExcel = ({ evidence }) => {
  const exportToCSV = () => {
    // Define headers
    const headers = [
      'ID', 'Case Number', 'Description', 'Category', 'Status', 
      'File Name', 'File Size (KB)', 'Hash Value', 'Created Date'
    ];
    
    // Prepare data rows
    const rows = evidence.map(item => [
      item.id,
      item.case_number,
      item.description,
      item.category,
      item.status,
      item.file_name || 'No file',
      item.file_size ? (item.file_size / 1024).toFixed(2) : 'N/A',
      item.hash_value || 'Not calculated',
      new Date(item.created_at).toLocaleString()
    ]);
    
    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', 'evidence_export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    alert(`Exported ${evidence.length} evidence records to CSV`);
  };
  
  return { exportToCSV };
};

export default ExportExcel;