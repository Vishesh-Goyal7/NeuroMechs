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
import LoginPatient from "./LoginPatient";
import SignupPatient from "./SignupPatient";
import LandingPatient from "./LandingPatient";
import RecordsPatient from "./RecordsPatient";

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
        {/* Patient-specific routes */}
        <Route path="/login-patient" element={<LoginPatient />} />
        <Route path="/signup-patient" element={<SignupPatient />} />
        <Route path="/landing-patient/*" element={<LandingPatient />} />
        <Route path="/records-patient" element={<RecordsPatient />} />
      </Routes>
    </Router>
  );
}

export default App;