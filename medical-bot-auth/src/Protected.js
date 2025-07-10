import React from "react"; 
import { Navigate } from "react-router-dom";
import {jwtDecode} from "jwt-decode";

const ProtectedRoute = ({ element: Component, requiredRole }) => {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/" />;
  }

  try {
    const decoded = jwtDecode(token);
    if (requiredRole && decoded.role !== requiredRole) {
      return <Navigate to="/" />;
    }
    return <Component />;
  } catch (err) {
    return <Navigate to="/" />;
  }
};

export default ProtectedRoute;

