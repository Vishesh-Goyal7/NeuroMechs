import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./LoginPage.css";
import logo from "./neuro.png";
import nameImg from "./name.png"; 
import axios from "axios"

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
      const response = await axios.post("https://vitaaiapi.neuromechs.in/login-doctor", {
        username : email,
        password
      });

      localStorage.setItem("username", response.data.username);
      localStorage.setItem("token", response.data.token);
      navigate('/landing');

    } catch (err) {
      if (err.response) {
        const code = err.response.status;
        if (code === 401) {
          alert("No such username exists");
        } else if (code === 402) {
          alert("You are not a doctor");
        } else if (code === 403) {
          alert("Invalid Password doctor");
        }
      } else {
        console.error("Login error:", err);
        alert("Server not reachable.");
      }
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
          <h1 className="welcome-title">Hello Doctor</h1>
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
            <Link to="/signup-doctor" className="underline-link">
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
