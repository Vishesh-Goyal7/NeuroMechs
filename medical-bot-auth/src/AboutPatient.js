import React from "react";
import { Link } from "react-router-dom";
import { logout } from "./utils/auth";
import logo from "./neuro.png";
import nameImg from "./name.png";
import "./LandingPage.css"; // Reuse your background/header styles
import "./AboutPage.css";   // Add custom styles for About

function AboutPatient() {
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
          <button onClick={logout} className="logout-btn">Logout</button>
        </nav>
      </header>

      <main className="about-main">
        <section className="about-hero">
          <h1>Meet the Brain Behind the Bot</h1>
          <h2>Why We Built <span className="highlight">Explainable AI</span> for Doctors</h2>
          <p className="about-story">
            Imagine this: a brilliant doctor staring at a screen. The AI tool says <span className="italic">“Diagnosis: Condition X”</span> — but when the doctor asks <span className="italic">“Why X?”</span>, the machine just blinks like it’s keeping secrets.<br /><br />
            No clues. No explanations. Just trust the mystery box.<br /><br />
            This wasn't just frustrating — it was dangerous. Doctors <span className="bold">hesitating to use AI</span> not because it wasn't smart, but because it couldn’t <span className="bold">explain itself</span>. And in healthcare, trust is <span className="italic">everything</span>.
          </p>
          <div className="about-sidekick">
            <span className="sidekick-title">So we built <a href="https://vitaai.neuromechs.in" target="_blank" rel="noopener noreferrer" className="highlight-link">Vita.AI</a> — The Honest AI Sidekick</span>
            <p>
              We wanted to create an AI system that doesn’t just throw medical guesses at doctors — it <span className="bold">talks</span> to them, <span className="bold">walks</span> them through its logic, and even shows <span className="bold">how confident</span> it is.
            </p>
          </div>
        </section>

        <section className="about-what">
          <h3>What does it do?</h3>
          <ul className="about-list">
            <li>✅ The doctor lists out your symptoms</li>
            <li>✅ It gives back <span className="bold"> diagnostic suggestions</span> — <span className="italic">with reasoning, scores, and plain-English explanations</span></li>
            <li>✅ You understand the <span className="italic"> why</span>, not just the <span className="italic"> what</span></li>
          </ul>
          <div className="about-transparency">
            <span>No black boxes. No mystery medicine. Just <span className="bold">transparency</span> with a touch of tech magic.</span>
          </div>
        </section>

        <section className="about-metrics">
          <h3>How We Know It’s Working</h3>
          <ul className="about-metrics-list">
            <li><span className="metric">85%+</span> doctor trust rate</li>
            <li>Higher diagnostic accuracy than traditional look-ups</li>
            <li>Diagnoses <span className="metric">~20% faster</span> (hello, more patients helped!)</li>
            <li>Real doctors actually want to use it (we’re proud of that)</li>
            <li>Every diagnosis comes with a story — not just a guess</li>
          </ul>
        </section>

        <section className="about-impact">
          <h3>What This Means for the World</h3>
          <ul className="about-impact-list">
            <li><span className="bold">Faster treatment decisions</span></li>
            <li><span className="bold">Fewer diagnostic errors</span></li>
            <li><span className="bold">More confident doctors and happier patients</span></li>
            <li><span className="bold">Lower legal risk</span> with traceable AI logic</li>
          </ul>
        </section>

        <section className="about-closing">
          <p>
            So yeah — we built this because we love AI, but we love <span className="bold">humans trusting AI</span> even more.<br /><br />
            <span className="highlight">Want to see it in action?</span><br />
            Try a symptom, get an explanation. Because <span className="bold">smart AI</span> is good — but <span className="bold">smart + transparent AI</span> is a game-changer.
          </p>
        </section>
      </main>
    </div>
  );
}

export default AboutPatient;
