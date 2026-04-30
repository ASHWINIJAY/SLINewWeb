import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Login.css";
import logo from "../assets/sli-logo.png";
const API_URL = "http://154.66.196.144:5000";

const Login = () => {
    const [formData, setFormData] = useState({ username: "", password: "" });
    const [responseMessage, setResponseMessage] = useState("");
    const [responseColor, setResponseColor] = useState("black");
    const navigate = useNavigate();

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setResponseMessage("Logging in...");
        setResponseColor("black");

        try {
            const response = await axios.post(`${API_URL}/login`, {
                username: formData.username,
                password: formData.password,
            });

            // Store all user info in localStorage
            localStorage.setItem("username", response.data.username);
            localStorage.setItem("first_name", response.data.first_name);
            localStorage.setItem("last_name", response.data.last_name);
            localStorage.setItem("email", response.data.email);
            localStorage.setItem("roles", response.data.roles);
            localStorage.setItem("mobile", response.data.mobile);

            navigate("/dashboard");
        } catch (error) {
            setResponseColor("red");
            setResponseMessage(error.response?.data?.error || "An error occurred.");
        }
    };

   return (
<div className="login-wrapper">
  
  {/* 🔷 Animated background layer */}
  <div className="bg-animation"></div>

  <div className="login-box">

    <div className="login-header">
      <img src={logo} alt="SLI Logo" className="login-logo" />
    </div>

    <p className="login-sub">Secure Access Portal</p>

    <form onSubmit={handleSubmit}>
      <input
        type="text"
        name="username"
        placeholder="Username"
        value={formData.username}
        onChange={handleChange}
        required
      />

      <input
        type="password"
        name="password"
        placeholder="Password"
        value={formData.password}
        onChange={handleChange}
        required
      />

      <button type="submit">Login</button>
    </form>

    {responseMessage && (
      <div className={`login-msg ${responseColor === "red" ? "error" : "info"}`}>
        {responseMessage}
      </div>
    )}

  </div>
</div>
);
};

export default Login;