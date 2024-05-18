import React, { useContext, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { AuthContext } from "./AuthProvider";

// Define backendUrl outside of the component to avoid re-initialization
const backendUrl = "http://localhost:5000";

function Register() {
  const { isLoggedIn } = useContext(AuthContext);
  const [user, setUser] = useState({ email: "", password: "" });
  // Initialize showPassword as a boolean
  const [showPassword, setShowPassword] = useState(false);

  if (isLoggedIn) {
    return <Navigate to="/" replace />;
  }

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        `${backendUrl}/api/auth/register`,
        user,
        {
          withCredentials: true,
        }
      );
      if (response.status === 200) {
        toast.success("Registered Successfully");
        window.location.href = "/";
      }
    } catch (error) {
      console.log("Error registering user: ", error);

      toast.error("Error registering user, Check email and password");
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-r from-purple-400 to-red-500">
      <form
        onSubmit={handleRegister}
        className="w-full max-w-sm bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <h3 className="mb-4 text-xl font-bold text-center text-red-500">
          Register{" "}
        </h3>
        <div className="mb-4">
          <label
            htmlFor="email"
            className="block text-gray-700 text-sm font-bold mb-2">
            Email
          </label>
          <input
            type="email"
            name="email"
            id="email"
            className="shadow border rounded w-full py-2 px-2 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            onChange={(e) => setUser({ ...user, email: e.target.value })}
          />
        </div>
        <div className="mb-4">
          <label
            htmlFor="password"
            className="block text-gray-700 text-sm font-bold mb-2">
            Password
          </label>
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            id="password"
            className="shadow border rounded w-full py-2 px-2 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            onChange={(e) => setUser({ ...user, password: e.target.value })}
          />
        </div>
        <div className="flex items-center mt-1">
          <input
            type="checkbox"
            checked={showPassword}
            id="show-password"
            onChange={(e) => setShowPassword(e.target.checked)}
          />
          <label htmlFor="show-password" className="text-xs text-gray-600 pl-1">
            {" "}
            Show Password
          </label>
        </div>
        <div className="flex items-center justify-between mb-6 mt-6">
          <button
            type="submit"
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none">
            Register
          </button>
          <p className="text-sm text-red-500 hover:text-red-700">
            Already Registered
            <Link to="/signin" className="font-bold ml-2 underline">
              Sign In
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}

export default Register;
