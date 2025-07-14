import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./SignUpPage.css";
import logo from "./neuro.png";
import nameImg from "./name.png"; const passwordRules = [
  { label: "At least 8 characters", test: (pw) => pw.length >= 8 },
  { label: "One uppercase letter", test: (pw) => /[A-Z]/.test(pw) },
  { label: "One lowercase letter", test: (pw) => /[a-z]/.test(pw) },
  { label: "One number", test: (pw) => /\d/.test(pw) },
  { label: "One special character", test: (pw) => /[!@#$%^&*(),.?":{}|<>]/.test(pw) },
];

function SignUpPage() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [password, setPassword] = useState("");
  const [comparePassword, setComparePassword] = useState("");
  const [showRules, setShowRules] = useState(false);
  const [touched, setTouched] = useState(false);
  const navigate = useNavigate();

  // Define emailRegex inside the component or at the top of the file
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  const validateEmail = (value) => {
    if (!value) return "Email is required.";
    if (!emailRegex.test(value)) return "Enter a valid email address.";
    if (/\s/.test(value)) return "Email cannot contain spaces.";
    if (
      value.startsWith(".") ||
      value.endsWith(".") ||
      value.startsWith("@") ||
      value.endsWith("@")
    )
      return "Email cannot start or end with special characters.";
    if (value.includes("..")) return "Email cannot contain consecutive dots.";
    return "";
  };

  const allRulesMet = passwordRules.every((rule) => rule.test(password));
  const passwordsMatch = password === comparePassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched(true);
    if (!email || !allRulesMet || !passwordsMatch || emailError) return;
    try {
      alert("Registration successful!");
      navigate("/");
    } catch (err) {
      if(err.response){
        const code = err.response.status;
        if(code === 500) alert("You haven't been treated here");
        else if(code === 409) alert("Username already exists");
      } else {
        alert("Server not responding");
      }
    }
  };

  return (
    <div className="login-bg">
      {/* Logo and name */}
      <div className="logo-fixed">
        <img src={logo} alt="Medibot Logo" className="logo-img" />
        <img src={nameImg} alt="Medibot Name" className="name-img" />
      </div>
      {/* Hexagons */}
      <div className="hex hex-left"></div>
      <div className="hex hex-right"></div>
      <div className="hex-outline hex-outline-1"></div>
      <div className="hex-outline hex-outline-2"></div>
      <div className="hex-outline hex-outline-3"></div>
      <div className="login-container">
        <h1 className="welcome-title">Create Your Account</h1>
        <form className="login-form" onSubmit={handleSubmit} autoComplete="off">
          <input
            type="email"
            placeholder="Email"
            className="login-input"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setEmailError(validateEmail(e.target.value));
            }}
            required
          />
          {emailError && <div className="password-error">{emailError}</div>}
          <input
            type="password"
            placeholder="Enter Password"
            className="login-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onFocus={() => setShowRules(true)}
            onBlur={() => setShowRules(false)}
            required
          />
          {/* Password rules pop-up */}
          {showRules && (
            <div className="password-rules">
              {passwordRules.map((rule, idx) => (
                <div
                  key={idx}
                  className={rule.test(password) ? "rule-met" : "rule-unmet"}
                >
                  {rule.test(password) ? "✔" : "✖"} {rule.label}
                </div>
              ))}
            </div>
          )}
          <input
            type="password"
            placeholder="Confirm Password"
            className="login-input"
            value={comparePassword}
            onChange={(e) => setComparePassword(e.target.value)}
            required
          />
          {touched && !passwordsMatch && (
            <div className="password-error">Passwords do not match.</div>
          )}
          <button
            type="submit"
            className="login-btn"
            disabled={
              !email ||
              !allRulesMet ||
              !passwordsMatch ||
              !!emailError
            }
          >
            Sign Up
          </button>
        </form>
        <div className="signup-link">
          Already have an account?{" "}
          <Link to="/login-patient" className="underline-link">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default SignUpPage;
