import React, { useState } from "react";
import axios from "axios";

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await axios.post("http://127.0.0.1:8000/api/auth/login", null, {
        params: { username, password }
      });
      localStorage.setItem("token", response.data.access_token);
      localStorage.setItem("user", JSON.stringify({ 
        id: response.data.user_id, 
        username: response.data.username, 
        role: response.data.role 
      }));
      onLogin({ id: response.data.user_id, username: response.data.username, role: response.data.role });
    } catch (err) {
      setError("Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#0f172a" }}>
      <div style={{ backgroundColor: "#1e293b", padding: "40px", borderRadius: "8px", width: "400px" }}>
        <h1 style={{ color: "#38bdf8", textAlign: "center" }}>TraceLock Forensic</h1>
        {error && <div style={{ backgroundColor: "#7f1d1d", color: "#fca5a5", padding: "10px", margin: "10px 0", borderRadius: "4px" }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} style={{ width: "100%", padding: "10px", marginBottom: "10px", backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: "4px", color: "white" }} required />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: "100%", padding: "10px", marginBottom: "10px", backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: "4px", color: "white" }} required />
          <button type="submit" disabled={loading} style={{ width: "100%", padding: "10px", backgroundColor: "#38bdf8", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>{loading ? "Loading..." : "Login"}</button>
        </form>
        <p style={{ textAlign: "center", marginTop: "20px", color: "#64748b" }}>Demo: admin / admin123</p>
      </div>
    </div>
  );
};

export default Login;
