import React, { useState } from 'react';
import axios from 'axios';

const Intake = ({ onEvidenceAdded }) => {
  const [caseNumber, setCaseNumber] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Digital');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');

    try {
      const token = localStorage.getItem('token');
      await axios.post('http://127.0.0.1:8000/api/evidence', null, {
        params: { case_number: caseNumber, description, category },
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setMessage('Evidence created successfully!');
      setCaseNumber('');
      setDescription('');
      setCategory('Digital');
      if (onEvidenceAdded) onEvidenceAdded();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('Error: ' + (err.response?.data?.detail || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>New Evidence Intake</h3>
      {message && <div style={styles.message}>{message}</div>}
      <form onSubmit={handleSubmit}>
        <input 
          type="text" 
          placeholder="Case Number (e.g., CASE-2024-001)" 
          value={caseNumber}
          onChange={(e) => setCaseNumber(e.target.value)} 
          style={styles.input} 
          required 
        />
        <textarea 
          placeholder="Description" 
          value={description}
          onChange={(e) => setDescription(e.target.value)} 
          style={styles.textarea} 
          required 
        />
        <select 
          value={category} 
          onChange={(e) => setCategory(e.target.value)} 
          style={styles.select}
        >
          <option value="Digital">Digital Evidence</option>
          <option value="Physical">Physical Evidence</option>
          <option value="Biological">Biological Evidence</option>
          <option value="Document">Documentary Evidence</option>
          <option value="Network">Network Evidence</option>
        </select>
        <button type="submit" disabled={submitting} style={styles.button}>
          {submitting ? 'Creating...' : 'Create Evidence'}
        </button>
      </form>
    </div>
  );
};

const styles = {
  container: { backgroundColor: '#1e293b', padding: '20px', borderRadius: '8px', marginBottom: '20px' },
  title: { color: '#38bdf8', marginBottom: '15px' },
  message: { backgroundColor: '#064e3b', color: '#10b981', padding: '10px', borderRadius: '4px', marginBottom: '15px' },
  input: { width: '100%', padding: '10px', marginBottom: '10px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '4px', color: '#f8fafc', boxSizing: 'border-box' },
  textarea: { width: '100%', padding: '10px', marginBottom: '10px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '4px', color: '#f8fafc', boxSizing: 'border-box', minHeight: '80px' },
  select: { width: '100%', padding: '10px', marginBottom: '10px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '4px', color: '#f8fafc', boxSizing: 'border-box' },
  button: { width: '100%', padding: '10px', backgroundColor: '#38bdf8', color: '#0f172a', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }
};

export default Intake;