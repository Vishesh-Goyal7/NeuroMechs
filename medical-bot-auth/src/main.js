import React from "react";
import { useNavigate } from "react-router-dom";
import "./main.css";
import logo from "./neuro.png"; // adjust path if needed
import nameImg from "./name.png"; // adjust path if needed

function Main() {
  const navigate = useNavigate();
  return (
    <div className="main-landing-container">
      {/* Logo and name bar */}
      <div className="main-logo-bar">
        <img src={logo} alt="VITA.ai logo" className="main-logo-img" />
        <img src={nameImg} alt="VITA.ai" className="main-name-img" />
      </div>
      {/* Floating rounded hexagons */}
      <div className="shape shape1"></div>
      <div className="shape shape2"></div>
      <div className="shape shape3"></div>
      <h1 className="main-title">Hey, welcome to <span className="brand">VITA.ai</span></h1>
      <div className="main-btn-group">
        <button className="main-btn doctor" onClick={() => navigate("/login?role=doctor")}>I'm a Doctor</button>
        <button className="main-btn patient" onClick={() => navigate("/login?role=patient")}>I'm a Patient</button>
      </div>
    </div>
  );
}

export default Main;
