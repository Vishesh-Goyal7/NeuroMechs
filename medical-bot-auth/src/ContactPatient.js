import React from "react";
import { Link } from "react-router-dom";
import "./ContactPage.css";
import logo from "./neuro.png";
import nameImg from "./name.png";
import linkedinIcon from "./linkedin.png";
import githubIcon from "./github.png";
import gmailIcon from "./gmail.png";
import TanishtaImg from './TANISHTA.jpeg'
import VisheshImg from './VISHESH.JPG'
import SakethImg from './SAKETH.jpg'

function ContactPatient() {
  return (
    <div className="landing-bg">
      {/* Header */}
      <header className="landing-header">
        <div className="logo-area">
          <img src={logo} alt="Logo" className="logo-img" />
          <img src={nameImg} alt="VITA.AI" className="name-img" />
        </div>
        <nav className="nav-links">
          <Link to="/landing-patient" className="nav-link">Home</Link>
          <Link to="/about-patient" className="nav-link">About</Link>
          <Link to="/records-patient" className="nav-link">Records</Link>
          <Link to="/contact-patient" className="nav-link">Contact</Link>
        </nav>
      </header>
      <div className="contact-container">
        <h1 className="contact-title">Meet the Team</h1>
        <p className="contact-subtitle">The humans behind the honest AI.</p>
        <div className="contact-grid">
          <div className="contact-card">
            <img src={VisheshImg} alt="Vishesh" className="contact-photo" />
            <h2>Vishesh Goyal</h2>
            <p className="contact-desc">Big brain behind the bot. Believes AI should always say "why."</p>
            <div className="contact-icons">
              <a href="https://www.linkedin.com/in/vishesh-goyal-2k5/" target="_blank" rel="noopener noreferrer">
                <img src={linkedinIcon} alt="LinkedIn" className="icon-img" />
              </a>
              <a href="https://github.com/Vishesh-Goyal7" target="_blank" rel="noopener noreferrer">
                <img src={githubIcon} alt="GitHub" className="icon-img" />
              </a>
              <a href="mailto:visheshvishu1@gmail.com" target="_blank" rel="noopener noreferrer">
                <img src={gmailIcon} alt="Gmail" className="icon-img" />
              </a>
            </div>
          </div>
          <div className="contact-card">
            <img src={TanishtaImg} alt="TanishtaImg" className="contact-photo" />
            <h2>Tanishta</h2>
            <p className="contact-desc">Drinking Java to code in Python</p>
            <div className="contact-icons">
              <a href="https://www.linkedin.com/in/tanishta-b1116b255/" target="_blank" rel="noopener noreferrer">
                <img src={linkedinIcon} alt="LinkedIn" className="icon-img" />
              </a>
              <a href="https://github.com/Tanishta15" target="_blank" rel="noopener noreferrer">
                <img src={githubIcon} alt="GitHub" className="icon-img" />
              </a>
              <a href="mailto:tanishtak15@gmail.com" target="_blank" rel="noopener noreferrer">
                <img src={gmailIcon} alt="Gmail" className="icon-img" />
              </a>
            </div>
          </div>
          <div className="contact-card">
            <img src={SakethImg} alt="SakethImg" className="contact-photo" />
            <h2>Saketh Pradyumna</h2>
            <p className="contact-desc">Training my model for the next run(way)</p>
            <div className="contact-icons">
              <a href="https://www.linkedin.com/in/saketh-pradyumna-3b3b0b264/" target="_blank" rel="noopener noreferrer">
                <img src={linkedinIcon} alt="LinkedIn" className="icon-img" />
              </a>
              <a href="https://github.com/pradyumna4" target="_blank" rel="noopener noreferrer">
                <img src={githubIcon} alt="GitHub" className="icon-img" />
              </a>
              <a href="mailto:parasarampradyumna@gmail.com" target="_blank" rel="noopener noreferrer">
                <img src={gmailIcon} alt="Gmail" className="icon-img" />
              </a>
            </div>
          </div>
          </div>
        <div className="contact-footer">
          <p>
            Thanks for dropping by. We hope you leave a little more curious than you came.
          </p>
          <p className="highlight">Stay honest. Stay curious. Stay human.</p>
        </div>
      </div>
    </div>
  );
}

export default ContactPatient;