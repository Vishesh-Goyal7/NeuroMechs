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
        <Route path="/landing/*" element={<ProtectedRoute element={LandingPage} requiredRole="DOCTOR"/>} />
        <Route path="/about" element={<ProtectedRoute element={AboutPage} requiredRole="DOCTOR"/>} />
        <Route path="/records" element={<ProtectedRoute element={RecordsPage} requiredRole="DOCTOR"/>} />
        <Route path="/contact" element={<ProtectedRoute element={ContactPage} requiredRole="DOCTOR"/>} />
        <Route path="/chatbot" element={<ProtectedRoute element={ChatbotPage} requiredRole="DOCTOR"/>} />
        <Route path="/download" element={<ProtectedRoute element={Downloadform} requiredRole="DOCTOR"/>} />
        {/* Patient-specific routes */}
        <Route path="/login-patient" element={<LoginPatient/>}/>
        <Route path="/signup-patient" element={<SignupPatient/>}/>
        <Route path="/landing-patient/*" element={<ProtectedRoute element={LandingPatient} requiredRole="PATIENT"/>} />
        <Route path="/about-patient/*" element={<ProtectedRoute element={AboutPatient} requiredRole="PATIENT"/>} />
        <Route path="/records-patient" element={<ProtectedRoute element={RecordsPatient} requiredRole="PATIENT"/>} />
        <Route path="/contact-patient" element={<ProtectedRoute element={ContactPatient} requiredRole="PATIENT"/>} />
      </Routes>
    </Router>
  );
}

export default App;