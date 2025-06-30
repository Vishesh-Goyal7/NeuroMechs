import React, { useState } from "react";
import axios from "axios";
import "./ChatbotPage.css";

function ChatbotPage() {
  const [chat, setChat] = useState([
    { sender: "bot", text: "Hello! I'm MediBot, your personal symptom checker powered by AI." },
    { sender: "bot", text: "Enter symptoms one at a time (like 'fever', 'headache'). Type 'done' to finish." }
  ]);
  const [input, setInput] = useState("");
  const [symptomHistory, setSymptomHistory] = useState([]);
  const [done, setDone] = useState(false);
  const [results, setResults] = useState(null);

  const handleSend = async () => {
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
      });
      setSymptomHistory([...symptomHistory, trimmed]);
      setChat(prev => [...prev, { sender: "bot", text: "✔️ Symptom noted." }]);
    } catch (err) {
      setChat(prev => [...prev, { sender: "bot", text: "⚠️ Error processing symptom." }]);
    }
  };

  const fetchResults = async () => {
    try {
      const response = await axios.post("http://localhost:6969/process");
      setResults(response.data.summary);
    } catch (err) {
      setChat(prev => [...prev, { sender: "bot", text: "❌ Failed to fetch results." }]);
    }
  };

  return (
    <div className="chat-page">
      <div className="chat-window">
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
          <button className="view-results-btn" onClick={fetchResults}>View Results</button>
        )}
      </div>
      {results && (
        <div className="results">
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
      )}
    </div>
  );
}

export default ChatbotPage;
