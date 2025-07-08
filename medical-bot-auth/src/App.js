import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./LoginPage";
import SignUpPage from "./SignUpPage";
import Main from "./main";
import LandingPage from "./LandingPage";
import AboutPage from "./AboutPage";
import RecordsPage from "./RecordsPage";
import ContactPage from "./ContactPage";
import ChatbotPage from "./ChatbotPage";
import Downloadform from "./Downloadform";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Main />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/landing/*" element={<LandingPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/records" element={<RecordsPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/chatbot" element={<ChatbotPage />} />
        <Route path="/download" element={<Downloadform />} />
      </Routes>
    </Router>
  );
}

export default App;