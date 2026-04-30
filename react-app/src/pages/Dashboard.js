import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./dashboard.css";
import logo from "../assets/sli-logo.png";
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
  <div className="dashboard-container">

    {/* 🔷 Header */}
  <div className="top-header">

  <div className="header-left">
    <img src={logo} alt="SLI Logo" className="header-logo" />
    <div className="header-text">
      <h2>SLI REQUISITION</h2>
      <span>Procurement System</span>
    </div>
  </div>

  <div className="header-right">
    <span className="user-name">{firstName}</span>

    <button className="logout-btn" onClick={handleLogout}>
     🔓 Logout
    </button>
  </div>

</div>
    {/* 🔷 Tabs */}
    <div className="tab-bar">
      <div className="tab active">Main Menu</div>
    </div>

    {/* 🔷 Layout */}
    <div className="layout">

      {/* 🔹 Sidebar */}
      <div className="sidebar">

        {/* Procurement */}
        <div
          className={`menu-item ${showProcurementDropdown ? "active" : ""}`}
          onClick={() => setShowProcurementDropdown(!showProcurementDropdown)}
        >
          <span className="icon">🛒</span>
          <span>Procurement</span>
        </div>

        {showProcurementDropdown && (
          <div className="submenu">
            <div onClick={() => navigate("/requisitions")}>Requisitions</div>
          </div>
        )}

        {/* Admin */}
        {isAdmin && (
          <>
            <div
              className={`menu-item ${showAdminDropdown ? "active" : ""}`}
              onClick={() => setShowAdminDropdown(!showAdminDropdown)}
            >
              <span className="icon">⚙️</span>
              <span>Admin</span>
            </div>

            {showAdminDropdown && (
              <div className="submenu">
                <div onClick={() => navigate("/users")}>Users</div>
              </div>
            )}
          </>
        )}
      </div>

      {/* 🔹 Main Content */}
      <div className="content-area">
        <div className="welcome-card">
          <h2>Welcome, {firstName}</h2>
          <p>Manage requisitions and system modules from here.</p>
        </div>
      </div>

    </div>

    {/* 🔷 Footer */}
    <div className="footer">
      <span>SLI - V0.0.1</span>
      <span>|</span>
      <span>{firstName} {lastName}</span>
      <span>|</span>
      <span>{role}</span>
    </div>

  </div>
);
};

export default Dashboard;