import React, { useEffect, useState } from "react";
import axios from "axios";
import "./RecordsPage.css";

function RecordsPage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchRecords = async() => {
      try {
        const doctorEmail = localStorage.getItem("username");
        const token = localStorage.getItem("token");

        const response = await axios.post('http://localhost:6969/api/records-doctor', {doctorEmail}, {headers:{Authorization:`Bearer ${token}`}});

        setLoading(false);
        setRecords(response.data.records);
      } catch (error) {
        setError("Failed to fetch records");
        setLoading(false);
      }
    }

    fetchRecords();
  }, []);

  return (
    <div className="records-page">
      <h1>Patient Records</h1>
      {loading && <div className="records-loading">Loading...</div>}
      {error && <div className="records-error">{error}</div>}
      <div className="records-list">
        {records.map((rec) => (
          <div className="record-card" key={rec._id}>
            <div className="record-info">
              <div><b>Name:</b> {rec.name}</div>
              <div><b>Email:</b> {rec.email}</div>
              <div><b>Age:</b> {rec.age}</div>
              <div><b>Gender:</b> {rec.gender}</div>
              <div><b>Date:</b> {new Date(rec.createdAt).toLocaleString()}</div>
            </div>
            <a
              className="record-pdf-btn"
              href={`http://localhost:6969/api/records/${rec._id}/pdf`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Open PDF
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}

export default RecordsPage;
