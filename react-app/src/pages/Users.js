import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL = "http://154.66.196.144:5000";

const Users = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [userForm, setUserForm] = useState({
        username: "",
        first_name: "",
        last_name: "",
        email: "",
        roles: "",
        mobile: "",
        active: "Y",
        password: "",
        confirmPassword: "",
    });

    const navigate = useNavigate();

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = () => {
        setLoading(true);
        axios
            .get(`${API_URL}/users`)
            .then((response) => {
                setUsers(response.data);
                setLoading(false);
            })
            .catch((error) => {
                console.error("Error fetching users:", error);
                setError("Failed to fetch user data.");
                setLoading(false);
            });
    };

    const handleRowClick = (user) => {
        setSelectedUser(user);
    };

    const handleFormChange = (e) => {
        setUserForm({ ...userForm, [e.target.name]: e.target.value });
    };

    const handleSaveUser = async () => {
        if (userForm.password !== userForm.confirmPassword) {
            alert("Passwords do not match!");
            return;
        }

        try {
            if (editingUser) {
                await axios.put(`${API_URL}/users/${selectedUser.username}`, userForm);
                alert("User updated successfully!");
            } else {
                await axios.post(`${API_URL}/users`, userForm);
                alert("User added successfully!");
            }

            fetchUsers();
            setShowModal(false);
            setEditingUser(false);
        } catch (error) {
            console.error("Error saving user:", error);
            alert("Failed to save user.");
        }
    };

    const handleDeleteUser = async () => {
        if (!selectedUser) {
            alert("Please select a user to delete.");
            return;
        }

        const confirmDelete = window.confirm(
            `Are you sure you want to delete user ${selectedUser.username}?`
        );
        if (!confirmDelete) return;

        try {
            await axios.delete(`${API_URL}/users/${selectedUser.username}`);
            alert("User deleted successfully!");
            fetchUsers();
            setSelectedUser(null);
        } catch (error) {
            console.error("Error deleting user:", error);
            alert("Failed to delete user.");
        }
    };

    if (loading) {
        return <div style={{ textAlign: "center", padding: "40px", fontSize: "16px" }}>Loading...</div>;
    }

    if (error) {
        return <div style={{ color: "red", textAlign: "center", padding: "40px" }}>{error}</div>;
    }

    const inputStyle = {
        width: "100%",
        padding: "8px",
        marginBottom: "10px",
        border: "1px solid #ccc",
        borderRadius: "4px",
        boxSizing: "border-box",
        fontSize: "13px",
    };

    return (
        <div style={{ fontFamily: "Arial, sans-serif" }}>
            {/* Header */}
            <div
                style={{
                    backgroundColor: "#007bff",
                    color: "white",
                    padding: "15px",
                    fontSize: "20px",
                    display: "flex",
                    alignItems: "center",
                }}
            >
                <button
                    onClick={() => navigate("/dashboard")}
                    style={{
                        background: "none",
                        border: "none",
                        color: "white",
                        fontSize: "20px",
                        cursor: "pointer",
                        marginRight: "10px",
                    }}
                >
                    ⬅
                </button>
                <span>Users - SLI REQUISITION</span>
            </div>

            {/* Toolbar */}
            <div
                style={{
                    backgroundColor: "#f4f4f4",
                    padding: "10px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderBottom: "1px solid #ddd",
                }}
            >
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    <button
                        style={{
                            padding: "10px",
                            backgroundColor: "#007bff",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                        }}
                        onClick={fetchUsers}
                    >
                        🔄 Refresh
                    </button>
                    <button
                        style={{
                            padding: "10px",
                            backgroundColor: "#28a745",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                        }}
                    >
                        📦 Excel Export
                    </button>
                    <button
                        style={{
                            padding: "10px",
                            backgroundColor: "#17a2b8",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                        }}
                        onClick={() => {
                            setShowModal(true);
                            setEditingUser(false);
                            setUserForm({
                                username: "",
                                first_name: "",
                                last_name: "",
                                email: "",
                                roles: "",
                                mobile: "",
                                active: "Y",
                                password: "",
                                confirmPassword: "",
                            });
                        }}
                    >
                        ➕ Add User
                    </button>
                    <button
                        style={{
                            padding: "10px",
                            backgroundColor: "#ffc107",
                            color: "black",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                        }}
                        onClick={() => {
                            if (!selectedUser) {
                                alert("Please select a user to edit.");
                                return;
                            }
                            setShowModal(true);
                            setEditingUser(true);
                            setUserForm({ ...selectedUser, password: "", confirmPassword: "" });
                        }}
                    >
                        ✏️ Edit User
                    </button>
                    <button
                        style={{
                            padding: "10px",
                            backgroundColor: "#dc3545",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                        }}
                        onClick={handleDeleteUser}
                    >
                        🗑️ Delete User
                    </button>
                </div>
            </div>

            {/* ══════ User Modal (Add / Edit) ══════ */}
            {showModal && (
                <div
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        width: "100vw",
                        height: "100vh",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        backgroundColor: "rgba(0, 0, 0, 0.5)",
                        zIndex: 1000,
                    }}
                >
                    <div
                        style={{
                            width: "500px",
                            maxHeight: "85vh",
                            backgroundColor: "white",
                            borderRadius: "8px",
                            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
                            display: "flex",
                            flexDirection: "column",
                            overflow: "hidden",
                        }}
                    >
                        {/* Modal header */}
                        <div
                            style={{
                                backgroundColor: editingUser ? "#ffc107" : "#17a2b8",
                                color: editingUser ? "black" : "white",
                                padding: "14px 20px",
                                fontSize: "16px",
                                fontWeight: "700",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                            }}
                        >
                            <span>{editingUser ? "✏️ Edit User" : "➕ New User"}</span>
                            <button
                                onClick={() => setShowModal(false)}
                                style={{
                                    background: "none",
                                    border: "none",
                                    color: editingUser ? "black" : "white",
                                    fontSize: "20px",
                                    cursor: "pointer",
                                }}
                            >
                                ✕
                            </button>
                        </div>

                        {/* Modal body — scrollable */}
                        <div
                            style={{
                                padding: "20px",
                                overflowY: "auto",
                                flex: 1,
                            }}
                        >
                            <div>
                                <label style={{ fontWeight: "600", fontSize: "13px" }}>User Name:</label>
                                <input
                                    type="text"
                                    name="username"
                                    value={userForm.username}
                                    onChange={handleFormChange}
                                    style={{
                                        ...inputStyle,
                                        backgroundColor: editingUser ? "#e9ecef" : "white",
                                    }}
                                    disabled={editingUser}
                                />
                            </div>
                            <div>
                                <label style={{ fontWeight: "600", fontSize: "13px" }}>Roles:</label>
                                <select
                                    name="roles"
                                    value={userForm.roles}
                                    onChange={handleFormChange}
                                    style={inputStyle}
                                >
                                    <option value="">-- Select Role --</option>
                                    <option value="Admin">Admin</option>
                                    <option value="Originator">Originator</option>
                                    <option value="Buyer">Buyer</option>
                                    <option value="Approvar1">Approver 1</option>
                                    <option value="Approvar2">Approver 2</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ fontWeight: "600", fontSize: "13px" }}>Status:</label>
                                <select
                                    name="active"
                                    value={userForm.active}
                                    onChange={(e) =>
                                        setUserForm({ ...userForm, active: e.target.value })
                                    }
                                    style={inputStyle}
                                >
                                    <option value="Y">Active</option>
                                    <option value="N">Inactive</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ fontWeight: "600", fontSize: "13px" }}>First Name:</label>
                                <input
                                    type="text"
                                    name="first_name"
                                    value={userForm.first_name}
                                    onChange={handleFormChange}
                                    style={inputStyle}
                                />
                            </div>
                            <div>
                                <label style={{ fontWeight: "600", fontSize: "13px" }}>Last Name:</label>
                                <input
                                    type="text"
                                    name="last_name"
                                    value={userForm.last_name}
                                    onChange={handleFormChange}
                                    style={inputStyle}
                                />
                            </div>
                            <div>
                                <label style={{ fontWeight: "600", fontSize: "13px" }}>Email:</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={userForm.email}
                                    onChange={handleFormChange}
                                    style={inputStyle}
                                />
                            </div>
                            <div>
                                <label style={{ fontWeight: "600", fontSize: "13px" }}>Mobile No:</label>
                                <input
                                    type="text"
                                    name="mobile"
                                    value={userForm.mobile}
                                    onChange={handleFormChange}
                                    style={inputStyle}
                                />
                            </div>
                            <div>
                                <label style={{ fontWeight: "600", fontSize: "13px" }}>Password:</label>
                                <input
                                    type="password"
                                    name="password"
                                    value={userForm.password}
                                    onChange={handleFormChange}
                                    placeholder={editingUser ? "Leave blank to keep current" : ""}
                                    style={inputStyle}
                                />
                            </div>
                            <div>
                                <label style={{ fontWeight: "600", fontSize: "13px" }}>Confirm Password:</label>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    value={userForm.confirmPassword}
                                    onChange={handleFormChange}
                                    placeholder={editingUser ? "Leave blank to keep current" : ""}
                                    style={inputStyle}
                                />
                            </div>
                        </div>

                        {/* Modal footer — always visible */}
                        <div
                            style={{
                                padding: "15px 20px",
                                borderTop: "1px solid #ddd",
                                backgroundColor: "#f8f9fa",
                                display: "flex",
                                justifyContent: "space-between",
                                gap: "10px",
                            }}
                        >
                            <button
                                onClick={handleSaveUser}
                                style={{
                                    flex: 2,
                                    padding: "12px 20px",
                                    backgroundColor: "#007bff",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "4px",
                                    cursor: "pointer",
                                    fontWeight: "700",
                                    fontSize: "14px",
                                }}
                            >
                                💾 {editingUser ? "Save Changes" : "Save User"}
                            </button>
                            <button
                                onClick={() => setShowModal(false)}
                                style={{
                                    flex: 1,
                                    padding: "12px 20px",
                                    backgroundColor: "#dc3545",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "4px",
                                    cursor: "pointer",
                                    fontWeight: "600",
                                    fontSize: "14px",
                                }}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* User table */}
            <div style={{ padding: "20px" }}>
                <table
                    border="1"
                    style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        fontSize: "14px",
                    }}
                >
                    <thead style={{ backgroundColor: "#f4f4f4", fontWeight: "bold" }}>
                        <tr>
                            <th style={{ padding: "10px" }}>Username</th>
                            <th style={{ padding: "10px" }}>First Name</th>
                            <th style={{ padding: "10px" }}>Last Name</th>
                            <th style={{ padding: "10px" }}>Roles</th>
                            <th style={{ padding: "10px" }}>Email</th>
                            <th style={{ padding: "10px" }}>Mobile</th>
                            <th style={{ padding: "10px" }}>Active</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user, index) => (
                            <tr
                                key={index}
                                onClick={() => handleRowClick(user)}
                                style={{
                                    backgroundColor:
                                        selectedUser && selectedUser.username === user.username
                                            ? "#cce5ff"
                                            : index % 2 === 0
                                            ? "white"
                                            : "#f8f9fa",
                                    cursor: "pointer",
                                    transition: "background-color 0.15s",
                                }}
                            >
                                <td style={{ padding: "8px 10px" }}>{user.username}</td>
                                <td style={{ padding: "8px 10px" }}>{user.first_name}</td>
                                <td style={{ padding: "8px 10px" }}>{user.last_name}</td>
                                <td style={{ padding: "8px 10px" }}>{user.roles}</td>
                                <td style={{ padding: "8px 10px" }}>{user.email}</td>
                                <td style={{ padding: "8px 10px" }}>{user.mobile}</td>
                                <td style={{ padding: "8px 10px", textAlign: "center" }}>
                                    <span
                                        style={{
                                            padding: "3px 10px",
                                            borderRadius: "4px",
                                            fontWeight: "600",
                                            fontSize: "12px",
                                            color: "white",
                                            backgroundColor: user.active === "Y" ? "#28a745" : "#dc3545",
                                        }}
                                    >
                                        {user.active === "Y" ? "Active" : "Inactive"}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Users;