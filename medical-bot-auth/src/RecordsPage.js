import React, { useEffect, useState } from "react";
import axios from "axios";
import { FiDownload } from "react-icons/fi"; // Download icon
import "./RecordsPage.css";

function RecordsPage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const doctorEmail = localStorage.getItem("username");
        const token = localStorage.getItem("token");

        const response = await axios.post(
          "http://localhost:6969/api/records-doctor",
          { doctorEmail },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setLoading(false);
        setRecords(response.data.records);
      } catch (error) {
        setError("Failed to fetch records");
        setLoading(false);
      }
    };

    fetchRecords();
  }, []);

  const handleDownloadPDF = async (recordId, recordName) => {
    const token = localStorage.getItem("token");
    try {
      const response = await axios.get(
        `http://localhost:6969/api/records/${recordId}/pdf`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: "blob", // Ensure the response is treated as a binary file
        }
      );

      const blob = new Blob([response.data], { type: "application/pdf" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `Record_${recordName}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Failed to download PDF:", error);
    }
  };

  return (
    <div className="records-page">
      <div className="records-header-bar">
        <h1 className="records-title">Patient Records</h1>
      </div>

      {loading && <div className="records-loading">Loading...</div>}
      {error && <div className="records-error">{error}</div>}

      <div className="records-list">
        {records.map((rec) => (
          <div className="record-card" key={rec._id}>
            <div className="record-info">
              <button
                className="record-pdf-btn-circle top-right"
                onClick={() => handleDownloadPDF(rec._id, rec.name)}
                title={`Download Record for ${rec.name}`}
              >
                <FiDownload size={22} />
              </button>
              <div><b>Name:</b> {rec.name}</div>
              <div><b>Email:</b> {rec.email}</div>
              <div><b>Age:</b> {rec.age}</div>
              <div><b>Gender:</b> {rec.gender}</div>
              <div><b>Date:</b> {new Date(rec.createdAt).toLocaleString()}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default RecordsPage;
