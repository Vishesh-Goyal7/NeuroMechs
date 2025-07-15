import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./LoginPatient.css";
import logo from "./neuro.png";
import nameImg from "./name.png"; 
import axios from "axios";

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
      const user = await axios.post('https://vitaaiapi.neuromechs.in/login-patient', {username : email, password});
      localStorage.setItem("username", user.data.username);
      localStorage.setItem("token", user.data.token);
      navigate('/landing-patient')
    } catch (error) {
      if(error.response){
        const code = error.response.status;
        if(code === 401) alert("No such user exist");
        else if(code === 402) alert("You are not a patient");
        else if(code === 403) alert("Invalid credentials");
      } else {
        alert("Server not responsive");
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
            <Link to="/signup-patient" className="underline-link">
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
