import react from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home/Home";
import Register from "./pages/Auth/Register";
import SignIn from "./pages/Auth/SignIn";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import ProtectedRoute from "./components/Auth/ProtectedRoute";
import AuthProvider from "./pages/Auth/AuthProvider";
import Logout from "./pages/Auth/Logout";
function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route path="/register" element={<Register />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/logout" element={<Logout />} />
        </Routes>
      </Router>
      <ToastContainer />
    </AuthProvider>
  );
}

export default App;
