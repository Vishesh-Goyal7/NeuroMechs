import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './Downloadform.css';

const initialState = {
  name: '',
  email: '',
  age: '',
  gender: '',
};

function Downloadform() {
  const location = useLocation();
  const navigate = useNavigate();
  const diagnosisResults = location.state?.results || null;
  const prescription = location.state?.prescription || '';
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem("token");
      const doctorEmail = localStorage.getItem("username");
      const res = await fetch('http://localhost:6969/api/download', {
        method: 'POST',
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...form, results: diagnosisResults, prescription, doctorEmail }),
      });
      if (!res.ok) throw new Error('Failed to save or download');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'patient_report.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setForm(initialState);
      navigate('/landing');
    } catch (err) {
      setError('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="download-form-bg">
      <form className="download-form" onSubmit={handleSubmit}>
        <h2>Download Patient Report</h2>
        <label>
          Patient Name
          <input name="name" value={form.name} onChange={handleChange} required />
        </label>
        <label>
          Patient Email
          <input name="email" type="email" value={form.email} onChange={handleChange} required />
        </label>
        <label>
          Age
          <input name="age" type="number" min="0" value={form.age} onChange={handleChange} required />
        </label>
        <label>
          Gender
          <select name="gender" value={form.gender} onChange={handleChange} required>
            <option value="">Select</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </label>
        {error && <div className="form-error">{error}</div>}
        <button className="save-download-btn" type="submit" disabled={loading}>
          {loading ? 'Saving & Downloading...' : 'Save and Download'}
        </button>
      </form>
    </div>
  );
}

export default Downloadform;
