import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import './Downloadform.css';

const initialState = {
  name: '',
  email: '',
  age: '',
  gender: '',
};

function Downloadform() {
  const location = useLocation();
  const diagnosisResults = location.state?.results || null;
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
      // Send form data + diagnosis results to backend to save in MongoDB and generate PDF
      const res = await fetch('http://localhost:5000/api/download', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ ...form, results: diagnosisResults }),
});
      if (!res.ok) throw new Error('Failed to save or download');
      // Download PDF
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
