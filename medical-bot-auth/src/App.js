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
import ProtectedRoute from "./Protected";
import AboutPatient from "./AboutPatient";
import ContactPatient from "./ContactPatient";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Main />} />
        <Route path="/login-doctor" element={<LoginPage />} />
        <Route path="/signup-doctor" element={<SignUpPage />} />
        <Route path="/landing/*" element={<ProtectedRoute><LandingPage /> </ProtectedRoute>} />
        <Route path="/about" element={<ProtectedRoute><AboutPage /> </ProtectedRoute>} />
        <Route path="/records" element={<ProtectedRoute><RecordsPage /> </ProtectedRoute>} />
        <Route path="/contact" element={<ProtectedRoute><ContactPage /> </ProtectedRoute>} />
        <Route path="/chatbot" element={<ProtectedRoute><ChatbotPage /> </ProtectedRoute>} />
        <Route path="/download" element={<ProtectedRoute><Downloadform /> </ProtectedRoute>} />
        {/* Patient-specific routes */}
        <Route path="/login-patient" element={<LoginPatient />} />
        <Route path="/signup-patient" element={<SignupPatient />} />
        <Route path="/landing-patient/*" element={<LandingPatient />} />
        <Route path="/about-patient/*" element={<AboutPatient />} />
        <Route path="/records-patient" element={<RecordsPatient />} />
        <Route path="/contact-patient" element={<ContactPatient />} />
      </Routes>
    </Router>
  );
}

export default App;