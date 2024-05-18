import React, { createContext, useEffect, useState } from "react";
import axios from "axios";

const AuthContext = createContext();
const backendUrl = "http://localhost:5000";
const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authUser, setAuthUser] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await axios.get(`${backendUrl}/api/auth/status`, {
          withCredentials: true,
        });
        console.log("respons :", response.data);
        setIsLoggedIn(response.data.isAuthenticated);
        setAuthUser(response.data.user);
      } catch (error) {
        console.log("Error fetching authenticated status: ", error);
      }
    };
    checkStatus();
  }, []);

  return (
    <AuthContext.Provider value={{ isLoggedIn, authUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
export { AuthContext };
