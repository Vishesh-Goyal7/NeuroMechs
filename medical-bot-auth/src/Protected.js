import React from "react";
import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

const ProtectedRoute = ({ element: Component, requiredRole }) => {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/" replace />;
  }

  try {
    const decoded = jwtDecode(token);
    const userRole = decoded.role;

    if (requiredRole && userRole !== requiredRole) {
      return <Navigate to="/" replace />;
    }

    return <Component />;
  } catch (err) {
    console.error("Invalid token:", err);
    return <Navigate to="/" replace />;
  }
};

export default ProtectedRoute;
