import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./ChatbotPage.css";

function ChatbotPage() {
  const [chat, setChat] = useState([
    { sender: "bot", text: "Hello! I'm MediBot, your personal symptom checker powered by AI." },
    { sender: "bot", text: "Enter symptoms one at a time (like 'fever', 'headache'). Type 'done' to finish." }
  ]);
  const [input, setInput] = useState("");
  const [symptomHistory, setSymptomHistory] = useState([]);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  const navigate = useNavigate();

  const handleSend = async () => {
    const token = localStorage.getItem("token");
    const trimmed = input.trim();
    if (!trimmed) return;
    setChat([...chat, { sender: "user", text: trimmed }]);
    setInput("");
    if (trimmed.toLowerCase() === "done") {
      setDone(true);
      setChat(prev => [...prev, { sender: "bot", text: "Thanks! Click 'View Results' to continue." }]);
      return;
    }
    try {
      await axios.post("http://localhost:6969/chat", {
        symptom: trimmed,
        score: 1.0  
      }, {headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }});
      setSymptomHistory([...symptomHistory, trimmed]);
      setChat(prev => [...prev, { sender: "bot", text: "✔️ Symptom noted." }]);
    } catch (err) {
      setChat(prev => [...prev, { sender: "bot", text: "⚠️ Error processing symptom." }]);
    }
  };

  const fetchResults = async () => {
    setLoading(true);
    setResults(null);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post("http://localhost:6969/process", {}, {headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }});
      setResults(response.data.summary);
    } catch (err) {
      setChat(prev => [...prev, { sender: "bot", text: "❌ Failed to fetch results." }]);
    }
    setLoading(false);
  };

  const chatWindowRef = useRef(null);

  useEffect(() => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  }, [chat]);

  return (
    <div className={results ? "chat-page results-shown" : "chat-page"}>
      <div className={results ? "chat-layout results-shown" : "chat-layout"}>
        <div className="chat-column">
          <div className="chat-window" ref={chatWindowRef}>
            {chat.map((msg, index) => (
              <div key={index} className={`chat-bubble ${msg.sender}`}>
                {msg.text}
              </div>
            ))}
          </div>
          <div className="chat-input-area">
            {!done ? (
              <>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Type a symptom..."
                />
                <button onClick={handleSend}>Send</button>
              </>
            ) : (
              <button className="view-results-btn" onClick={fetchResults} disabled={loading}>
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', whiteSpace: 'nowrap' }}>
                    <div className="loading-dots">
                      <div className="dot"></div>
                      <div className="dot"></div>
                      <div className="dot"></div>
                    </div>
                    Generating results...
                  </span>
                ) : (
                  'View Results'
                )}
              </button>
            )}
          </div>
        </div>
        <div className="results-column">
          {results && (
            <>
              <div className="results">
                <div>
                  <h3>Diagnosis Results</h3>
                  <ul>
                    {Object.entries(results).map(([disease, explanation], i) => (
                      <li key={i} style={{ marginBottom: "1em" }}>
                        <strong>{disease.replace(/_/g, " ")}</strong>
                        <p>{explanation}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div style={{ textAlign: 'center', marginTop: '20px' }}>
                <button className="download-form-btn" onClick={() => navigate('/download', { state: { results: results } })}>
                  Download Results
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ChatbotPage;