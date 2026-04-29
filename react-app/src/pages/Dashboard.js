import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL = "http://154.66.196.144:5000";
const Dashboard = () => {
    const [showProcurementDropdown, setShowProcurementDropdown] = useState(false);
    const [showAdminDropdown, setShowAdminDropdown] = useState(false);
    const navigate = useNavigate();

    const username = localStorage.getItem("username");
    const firstName = localStorage.getItem("first_name");
    const lastName = localStorage.getItem("last_name");
    const role = localStorage.getItem("roles");

    const isAdmin = role === "Admin";

    const handleLogout = () => {
        localStorage.clear();
        navigate("/");
    };

    return (
        <div style={{ fontFamily: "Arial, sans-serif", minHeight: "100vh", backgroundColor: "#ececec" }}>

            {/* Top Blue Header */}
            <div
                style={{
                    backgroundColor: "#1a73e8",
                    color: "white",
                    padding: "8px 15px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    fontSize: "15px",
                    fontWeight: "600",
                }}
            >
                <span>SLI REQUISITION</span>
                <button
                    onClick={handleLogout}
                    style={{
                        background: "none",
                        border: "1px solid white",
                        color: "white",
                        padding: "4px 12px",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "12px",
                    }}
                >
                    Logout
                </button>
            </div>

            {/* Navigation Tab Bar */}
            <div
                style={{
                    backgroundColor: "#1a73e8",
                    padding: "0 15px",
                    display: "flex",
                    gap: "5px",
                }}
            >
                <div
                    style={{
                        backgroundColor: "white",
                        padding: "6px 18px",
                        borderRadius: "4px 4px 0 0",
                        fontSize: "13px",
                        fontWeight: "600",
                        cursor: "pointer",
                        color: "#333",
                    }}
                >
                    Main Menu
                </div>
            </div>

            {/* Sidebar + Content Area */}
            <div style={{ display: "flex", minHeight: "calc(100vh - 90px - 28px)" }}>

                {/* Left Sidebar */}
                <div
                    style={{
                        width: "75px",
                        backgroundColor: "#f0f0f0",
                        borderRight: "1px solid #ccc",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        paddingTop: "15px",
                        gap: "5px",
                    }}
                >
                    {/* Procurement */}
                    <div
                        onClick={() => setShowProcurementDropdown(!showProcurementDropdown)}
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            cursor: "pointer",
                            padding: "8px 5px",
                            borderRadius: "4px",
                            fontSize: "11px",
                            color: "#333",
                            textAlign: "center",
                            width: "100%",
                            backgroundColor: showProcurementDropdown ? "#ddd" : "transparent",
                        }}
                    >
                        <span style={{ fontSize: "26px" }}>🛒</span>
                        <span>Procurement</span>
                        <span style={{ fontSize: "10px" }}>▼</span>
                    </div>

                    {showProcurementDropdown && (
                        <div
                            style={{
                                width: "100%",
                                backgroundColor: "#e8e8e8",
                                borderTop: "1px solid #ccc",
                                borderBottom: "1px solid #ccc",
                            }}
                        >
                            <div
                                onClick={() => navigate("/requisitions")}
                                style={{
                                    padding: "8px 10px",
                                    fontSize: "11px",
                                    cursor: "pointer",
                                    color: "#1a73e8",
                                    fontWeight: "600",
                                    textAlign: "center",
                                    borderBottom: "1px solid #ccc",
                                }}
                            >
                                Requisitions
                            </div>
                        </div>
                    )}

                    {/* Admin - ONLY visible to Admin role */}
                    {isAdmin && (
                        <>
                            <div
                                onClick={() => setShowAdminDropdown(!showAdminDropdown)}
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    cursor: "pointer",
                                    padding: "8px 5px",
                                    borderRadius: "4px",
                                    fontSize: "11px",
                                    color: "#333",
                                    textAlign: "center",
                                    width: "100%",
                                    backgroundColor: showAdminDropdown ? "#ddd" : "transparent",
                                }}
                            >
                                <span style={{ fontSize: "26px" }}>⚙️</span>
                                <span>Admin</span>
                                <span style={{ fontSize: "10px" }}>▼</span>
                            </div>

                            {showAdminDropdown && (
                                <div
                                    style={{
                                        width: "100%",
                                        backgroundColor: "#e8e8e8",
                                        borderTop: "1px solid #ccc",
                                        borderBottom: "1px solid #ccc",
                                    }}
                                >
                                    <div
                                        onClick={() => navigate("/users")}
                                        style={{
                                            padding: "8px 10px",
                                            fontSize: "11px",
                                            cursor: "pointer",
                                            color: "#1a73e8",
                                            fontWeight: "600",
                                            textAlign: "center",
                                            borderBottom: "1px solid #ccc",
                                        }}
                                    >
                                        Users
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Main Content */}
                <div style={{ flex: 1, backgroundColor: "#ececec" }} />
            </div>

            {/* Bottom Status Bar */}
            <div
                style={{
                    position: "fixed",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    backgroundColor: "#f8f9fa",
                    borderTop: "1px solid #ccc",
                    padding: "4px 15px",
                    fontSize: "12px",
                    color: "#444",
                    display: "flex",
                    gap: "15px",
                    alignItems: "center",
                }}
            >
                <span>SLI - V0.0.1</span>
                <span>|</span>
                <span>Logged in as {firstName} {lastName} on {new Date().toLocaleDateString("en-ZA")}</span>
                <span>|</span>
                <span>Role - {role}</span>
                <span>|</span>
            </div>
        </div>
    );
};

export default Dashboard;