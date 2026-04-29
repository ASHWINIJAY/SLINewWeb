import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import Requisitions from "./pages/Requisitions";

const App = () => (
    <Router>
        <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/users" element={<Users />} />
            <Route path="/requisitions" element={<Requisitions />} />
            {/* Catch-all: redirect unknown routes to login */}
            <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
    </Router>
);

export default App;