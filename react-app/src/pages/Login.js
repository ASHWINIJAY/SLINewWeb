import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

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
        <div
            style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100vh",
                backgroundColor: "#f4f4f4",
            }}
        >
            <div
                style={{
                    padding: "20px",
                    backgroundColor: "white",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                    width: "400px",
                    textAlign: "center",
                }}
            >
                <h2>SLI REQUISITION</h2>
                <h4 style={{ color: "#555", marginBottom: "20px" }}>Please Login</h4>
                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        name="username"
                        placeholder="Username"
                        value={formData.username}
                        onChange={handleChange}
                        style={{
                            width: "90%",
                            padding: "10px",
                            margin: "10px 0",
                            border: "1px solid #ccc",
                            borderRadius: "4px",
                        }}
                        required
                    />
                    <input
                        type="password"
                        name="password"
                        placeholder="Password"
                        value={formData.password}
                        onChange={handleChange}
                        style={{
                            width: "90%",
                            padding: "10px",
                            margin: "10px 0",
                            border: "1px solid #ccc",
                            borderRadius: "4px",
                        }}
                        required
                    />
                    <button
                        type="submit"
                        style={{
                            backgroundColor: "#007bff",
                            color: "white",
                            padding: "10px 20px",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            width: "94%",
                            marginTop: "10px",
                            fontWeight: "600",
                        }}
                    >
                        Login
                    </button>
                </form>
                <div style={{ marginTop: "15px", fontSize: "14px", color: responseColor }}>
                    {responseMessage}
                </div>
            </div>
        </div>
    );
};

export default Login;