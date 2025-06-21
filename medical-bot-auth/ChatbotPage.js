import React, { useState } from "react";
import axios from "axios";
import "./ChatbotPage.css";

const ACKS = [
  "Got it.",
  "Noted!",
  "Symptom received.",
  "Understood."
];

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

    // Send to backend to match symptoms
    try {
      await axios.post("http://localhost:6969/process", { message: trimmed });
      // Random friendly ack
      const ack = ACKS[Math.floor(Math.random() * ACKS.length)];
      setSymptomHistory([...symptomHistory, trimmed]);
      setChat(prev => [...prev, { sender: "bot", text: ack }]);
    } catch (err) {
      setChat(prev => [...prev, { sender: "bot", text: "⚠️ Error processing symptom." }]);
    }
  };

  const fetchResults = async () => {
    try {
      const combinedInput = symptomHistory.join(", ");
      const response = await axios.post("http://localhost:6969/process", { message: combinedInput });
      setResults(response.data);
    } catch (err) {
      setChat(prev => [...prev, { sender: "bot", text: "❌ Failed to fetch results." }]);
    }
  };

  const downloadResults = () => {
    if (!results) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(results, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", "medibot_results.json");
    dlAnchorElem.click();
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
          <h3>🩺 MediBot: Based on your symptoms, here are some possible conditions:</h3>
          <ol>
            {results.diagnosis && results.diagnosis.length > 0 ? results.diagnosis.map((d, i) => (
              <li key={i}>{`${i+1}. ${d.disease} (match score: ${d.score})`}</li>
            )) : <li>No diagnosis found.</li>}
          </ol>
          <button className="download-btn" onClick={downloadResults}>Download Results</button>
        </div>
      )}
    </div>
  );
}

export default ChatbotPage;
