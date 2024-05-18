import React, { Children, useEffect, useState } from "react";
import axios from "axios";
import { Navigate } from "react-router-dom";
function ProtectedRoute({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authUser, setSuthUser] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const backendUrl = "http://localhost:5000";
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await axios.get(`${backendUrl}/api/auth/status`, {
          withCredentials: true,
        });
        console.log("respons :", response.data);
        setIsAuthenticated(response.data.isAuthenticated);
        setSuthUser(response.data.user);
        setIsLoading(false);
      } catch (error) {
        console.log("Error is :", error);
        setIsLoading(false);
      }
    };
    checkAuthStatus();
  }, []);
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">Loading</div>
    );
  }
  if (!isAuthenticated && !authUser) {
    return (window.location.href = "/signin");
  }
  return children;
}

export default ProtectedRoute;
