import React, { useEffect, useState } from "react";
import "./RecordsPage.css";

function RecordsPage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("http://localhost:5000/api/records")
      .then((res) => res.json())
      .then((data) => {
        setRecords(data);
        setLoading(false);
      })
      .catch((err) => {
        setError("Failed to load records");
        setLoading(false);
      });
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
              href={`http://localhost:5000/api/record/${rec._id}/pdf`}
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
