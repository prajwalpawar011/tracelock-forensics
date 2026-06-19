import React, { useState } from 'react';
import axios from 'axios';

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
      
      onLogin({ id: user_id, username: userName, role });
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.loginBox}>
        <h1 style={styles.title}>TraceLock Forensic</h1>
        <p style={styles.subtitle}>Evidence Management System</p>
        
        {error && <div style={styles.error}>{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={styles.input}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
            required
          />
          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? 'Loading...' : 'Login'}
          </button>
        </form>
        
        <div style={styles.demo}>
          <p>Demo Credentials:</p>
          <p>admin / admin123</p>
          <p>analyst / analyst123</p>
          <p>viewer / viewer123</p>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f172a',
    fontFamily: 'monospace'
  },
  loginBox: {
    backgroundColor: '#1e293b',
    padding: '40px',
    borderRadius: '8px',
    width: '400px',
    textAlign: 'center'
  },
  title: {
    color: '#38bdf8',
    marginBottom: '10px'
  },
  subtitle: {
    color: '#94a3b8',
    marginBottom: '30px'
  },
  error: {
    backgroundColor: '#7f1d1d',
    color: '#fca5a5',
    padding: '10px',
    borderRadius: '4px',
    marginBottom: '20px',
    fontSize: '12px'
  },
  input: {
    width: '100%',
    padding: '10px',
    marginBottom: '15px',
    backgroundColor: '#0f172a',
    border: '1px solid #334155',
    borderRadius: '4px',
    color: '#f8fafc',
    boxSizing: 'border-box'
  },
  button: {
    width: '100%',
    padding: '10px',
    backgroundColor: '#38bdf8',
    color: '#0f172a',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold'
  },
  demo: {
    marginTop: '20px',
    color: '#64748b',
    fontSize: '12px'
  }
};

export default Login;