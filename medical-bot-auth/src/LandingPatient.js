import React from "react";
import { Link, Route, Routes } from "react-router-dom";
import { logout } from "./utils/auth";
import logo from "./neuro.png";
import nameImg from "./name.png"; 
import doctorsImg from "./doctors.png";
import consultationIcon from "./consultation.png";
import availabilityIcon from "./availability.png";
import secureIcon from "./secure.png";
import multiuserIcon from "./multiuser.png";
import AboutPage from "./AboutPage";
import RecordsPage from "./RecordsPage";
import ContactPage from "./ContactPage";
import "./LandingPatient.css";

function LandingPage() {

  return (
    <div className="landing-bg">
      {/* Header */}
      <header className="landing-header">
        <div className="logo-area">
          <img src={logo} alt="Logo" className="logo-img" />
          <img src={nameImg} alt="VITA.AI" className="name-img" />
        </div>
        <nav className="nav-links">
          <Link to="/landing-patient" className="nav-link nav-btn">Home</Link>
          <Link to="/about-patient" className="nav-link nav-btn">About</Link>
          <Link to="/records-patient" className="nav-link nav-btn">Records</Link>
          <Link to="/contact-patient" className="nav-link nav-btn">Contact</Link>
          <span className="nav-link" onClick={logout}>Logout</span>        </nav>
      </header>
      {/* No back button on the landing page */}

      {/* Main Content */}
      <main className="landing-main">
        <Routes>
          <Route
            path="/"
            element={
              <div>
                <section className="hero-section">
                  <img src={doctorsImg} alt="Doctors" className="doctors-img" />
                  <div className="hero-text">
                    <h1>Your Symptoms, Answered</h1>
                    <p>
                      Connect with healthcare professionals and get medical advice anytime, anywhere.
                    </p>
                  </div>
                </section>

                <section className="features-section">
                  <h2>Features</h2>
                  <p>
                    Our platform offers a range of features designed to make healthcare more accessible and convenient.
                  </p>
                  <div className="features-grid">
                    <div className="feature-card">
                      <img src={consultationIcon} alt="Instant Consultations" className="feature-icon-img" />
                      <div>
                        <strong>Instant Consultations</strong>
                        <p>Connect with doctors in real-time for immediate medical advice.</p>
                      </div>
                    </div>
                    <div className="feature-card">
                      <img src={availabilityIcon} alt="24/7 Availability" className="feature-icon-img" />
                      <div>
                        <strong>24/7 Availability</strong>
                        <p>Access healthcare records anytime, day or night.</p>
                      </div>
                    </div>
                    <div className="feature-card">
                      <img src={secureIcon} alt="Secure & Private" className="feature-icon-img" />
                      <div>
                        <strong>Secure & Private</strong>
                        <p>Your data is protected with the highest security standards.</p>
                      </div>
                    </div>
                    <div className="feature-card">
                      <img src={multiuserIcon} alt="Multi-User Support" className="feature-icon-img" />
                      <div>
                        <strong>Multi-User Support</strong>
                        <p>Manage healthcare for your entire family with ease.</p>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            }
          />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/records" element={<RecordsPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/landing" element={<LandingPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default LandingPage;