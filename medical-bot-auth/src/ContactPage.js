import React, { useState } from "react";
import "./ContactPage.css";
import logo from "./neuro.png";
import nameImg from "./name.png";

function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    // Here you would send the form data to your backend or email service
  };

  return (
    <div className="landing-bg">
      <header className="landing-header">
        <div className="logo-area">
          <img src={logo} alt="Logo" className="logo-img" />
          <img src={nameImg} alt="VITA.AI" className="name-img" />
        </div>
        <nav className="nav-links">
          <a href="/landing" className="nav-link">Home</a>
          <a href="/about" className="nav-link">About</a>
          <a href="/services" className="nav-link">Services</a>
          <a href="/contact" className="nav-link active">Contact</a>
        </nav>
      </header>
      <main className="contact-main">
        <section className="contact-card">
          <h1 className="contact-title">Contact Us</h1>
          <p className="contact-desc">
            Have a question, suggestion, or just want to say hello? Fill out the form below and our team will get back to you soon!
          </p>
          {submitted ? (
            <div className="contact-success">
              <h2>Thank you!</h2>
              <p>Your message has been received. We'll be in touch soon.</p>
            </div>
          ) : (
            <form className="contact-form" onSubmit={handleSubmit}>
              <input
                type="text"
                name="name"
                className="contact-input"
                placeholder="Your Name"
                value={form.name}
                onChange={handleChange}
                required
              />
              <input
                type="email"
                name="email"
                className="contact-input"
                placeholder="Your Email"
                value={form.email}
                onChange={handleChange}
                required
              />
              <textarea
                name="message"
                className="contact-textarea"
                placeholder="Your Message"
                value={form.message}
                onChange={handleChange}
                required
                rows={5}
              />
              <button type="submit" className="contact-btn">Send Message</button>
            </form>
          )}
        </section>
      </main>
    </div>
  );
}

export default ContactPage;