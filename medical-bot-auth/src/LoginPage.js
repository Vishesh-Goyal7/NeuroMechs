import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./LoginPage.css";
import logo from "./neuro.png";
import nameImg from "./name.png"; 

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      alert("Please enter email and password");
      return;
    }
    try {
      const response = await fetch("http://localhost:6969/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: email, password }),
      });
      const data = await response.json();
      if (response.ok) {
        navigate("/landing");
      } else {
        alert(data.error || "Login failed");
      }
    } catch (err) {
      console.error("Login error:", err);
      alert("Something went wrong.");
    }
  };

  return (
    <div className="login-bg">
      <div className="login-bg">
        <div className="logo-fixed">
          <img src={logo} alt="Medibot Logo" className="logo-img" />
          <img src={nameImg} alt="Medibot Name" className="name-img" />
        </div>
        <div className="hex-left"></div>
        <div className="hex-right"></div>
        <div className="hex-outline hex-outline-1"></div>
        <div className="hex-outline hex-outline-2"></div>
        <div className="hex-outline hex-outline-3"></div>
        {/* Centered login card */}
        <div className="login-container">
          <h1 className="welcome-title">Welcome Back</h1>
          <form className="login-form" onSubmit={handleLogin}>
            <input
              type="email"
              placeholder="Email"
              className="login-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              className="login-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <div className="forgot-text">Forgot Password?</div>
            <button type="submit" className="login-btn">
              Login
            </button>
          </form>
          <div className="signup-link">
            Don’t have an account?{" "}
            <Link to="/signup" className="underline-link">
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
