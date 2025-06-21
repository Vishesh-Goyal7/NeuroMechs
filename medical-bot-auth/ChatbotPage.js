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

    // Send to backend to match symptoms
    try {
      const response = await axios.post("http://localhost:6969/chatbot", { message: trimmed });
      const reply = response.data.reply && response.data.reply.diagnosis && response.data.reply.diagnosis.length > 0
        ? response.data.reply.diagnosis.map(d => `${d.disease}: ${d.score.toFixed(2)}`).join("\n")
        : "Got it.";
      setSymptomHistory([...symptomHistory, trimmed]);
      setChat(prev => [...prev, { sender: "bot", text: reply }]);
    } catch (err) {
      setChat(prev => [...prev, { sender: "bot", text: "⚠️ Error processing symptom." }]);
    }
  };

  const fetchResults = async () => {
    try {
      const combinedInput = symptomHistory.join(", ");
      const response = await axios.post("http://localhost:6969/chatbot", { message: combinedInput });
      setResults(response.data.reply);
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
            {results.diagnosis.map((d, i) => (
              <li key={i}>{d.disease} (score: {d.score.toFixed(2)})</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default ChatbotPage;
