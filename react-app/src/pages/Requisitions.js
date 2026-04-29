import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL = "http://41.87.206.94:5000";

axios.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token && !config.url.includes("/login"))
        config.headers["Authorization"] = `Bearer ${token}`;
    return config;
}, (e) => Promise.reject(e));

axios.interceptors.response.use(
    (r) => r,
    (e) => {
        if (e.response?.status === 401 && !e.config?.url?.includes("/login")) {
            localStorage.clear(); window.location.href = "/login";
        }
        return Promise.reject(e);
    }
);

/* ── Toast ── */
const Toast = ({ toasts }) => (
    <div style={{ position: "fixed", bottom: "45px", right: "20px", zIndex: 9999, display: "flex", flexDirection: "column", gap: "8px" }}>
        {toasts.map(t => (
            <div key={t.id} style={{
                padding: "12px 20px", borderRadius: "6px", fontSize: "13px", fontWeight: "600",
                color: "white", boxShadow: "0 4px 12px rgba(0,0,0,0.25)", minWidth: "260px",
                backgroundColor: t.type === "success" ? "#28a745" : t.type === "error" ? "#dc3545" : "#007bff",
            }}>{t.msg}</div>
        ))}
    </div>
);

/* ── Confirm Dialog ── */
const ConfirmDialog = ({ cfg, onYes, onNo }) => {
    if (!cfg) return null;
    return (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.55)", zIndex: 8000, display: "flex", justifyContent: "center", alignItems: "center" }}>
            <div style={{ background: "white", borderRadius: "10px", width: "380px", overflow: "hidden", boxShadow: "0 8px 32px rgba(0,0,0,0.3)" }}>
                <div style={{ backgroundColor: cfg.danger ? "#dc3545" : "#2c3e50", color: "white", padding: "14px 20px", fontWeight: "700", fontSize: "15px" }}>{cfg.title || "Confirm"}</div>
                <div style={{ padding: "20px 24px", fontSize: "13px", color: "#333", lineHeight: "1.6" }}>{cfg.message}</div>
                <div style={{ padding: "12px 24px 20px", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                    <button onClick={onNo} style={{ padding: "8px 20px", border: "1px solid #ccc", borderRadius: "4px", cursor: "pointer", fontSize: "13px", backgroundColor: "white" }}>Cancel</button>
                    <button onClick={onYes} style={{ padding: "8px 20px", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "13px", fontWeight: "600", color: "white", backgroundColor: cfg.danger ? "#dc3545" : "#007bff" }}>{cfg.confirmLabel || "OK"}</button>
                </div>
            </div>
        </div>
    );
};

/* ── Button helper ── */
const btn = (bg, color = "white", border = "none") => ({
    padding: "8px 15px", backgroundColor: bg, color, border, borderRadius: "4px",
    cursor: "pointer", fontWeight: "600", fontSize: "13px", whiteSpace: "nowrap",
});

const styles = {
    tableHeader: { backgroundColor: "#f8f9fa", textAlign: "left", fontWeight: "600", color: "#333", borderBottom: "2px solid #ddd", padding: "10px", whiteSpace: "nowrap", fontSize: "13px" },
    tableCell: { padding: "8px 10px", borderBottom: "1px solid #eee", whiteSpace: "nowrap", fontSize: "13px" },
    modalOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 },
    declineModalContent: { background: "white", padding: "30px", borderRadius: "10px", width: "420px", boxShadow: "0 4px 8px rgba(0,0,0,0.2)" },
    select: { width: "100%", padding: "10px", marginBottom: "15px", borderRadius: "5px", border: "1px solid #ddd", boxSizing: "border-box", backgroundColor: "#ffffff", cursor: "pointer" },
    textArea: { width: "100%", padding: "10px", marginBottom: "15px", borderRadius: "5px", border: "1px solid #ddd", boxSizing: "border-box", minHeight: "100px", resize: "vertical" },
    label: { display: "block", marginBottom: "8px", fontWeight: "600", color: "#333" },
    statusBadge: { padding: "4px 8px", borderRadius: "4px", fontWeight: "600", color: "white", display: "inline-block", fontSize: "11px" },
    checkbox: { width: "18px", height: "18px", cursor: "pointer" },
    whiteButton: { padding: "8px 15px", backgroundColor: "#ffffff", color: "#007bff", border: "1px solid #007bff", borderRadius: "4px", cursor: "pointer", fontWeight: "600", fontSize: "13px" },
};

const toolbarBtn = {
    display: "flex", flexDirection: "column", alignItems: "center", gap: "2px",
    padding: "4px 10px", border: "none", background: "transparent", cursor: "pointer",
    fontSize: "11px", color: "#333",
};

const gridCell = {
    padding: "3px 4px", borderBottom: "1px solid #e0e0e0", borderRight: "1px solid #e0e0e0",
    fontSize: "12px", fontWeight: "600", textAlign: "left",
};

const gridInput = {
    border: "1px solid #ccc", borderRadius: "2px", padding: "3px 5px", fontSize: "12px",
    boxSizing: "border-box", outline: "none",
};

/* ── Status helpers ── */
const isGreenStage = (status, supplier, viewerRole) => {
    if (status !== "Approver 1") return false;
    if (["Approvar1", "Approvar2", "Admin"].includes(viewerRole)) return true;
    return !!(supplier && supplier.trim() !== "");
};
const getBadgeColor = (status, supplier, viewerRole) => {
    switch (status) {
        case "Created": return "#e65c00";
        case "Approver 1": return isGreenStage(status, supplier, viewerRole) ? "#155724" : "#6610f2";
        case "Final Approval": return "#155724";
        case "PO Created": return "#007bff";
        case "Declined": return "#dc3545";
        case "Cancelled": return "#7f8c8d";
        default: return "#6c757d";
    }
};
const getRowBgColor = (status, supplier, viewerRole) => {
    switch (status) {
        case "Created": return "#FFF9E6";
        case "Approver 1": return isGreenStage(status, supplier, viewerRole) ? "#E6F4EA" : "#f0e6ff";
        case "Final Approval": return "#c3e6cb";
        case "PO Created": return "#ffe4f0";
        case "Declined": return "#f8d7da";
        case "Cancelled": return "#F0F0F0";
        default: return "#ffffff";
    }
};
const getStatusBadgeStyle = (s, sup, r) => ({ ...styles.statusBadge, backgroundColor: getBadgeColor(s, sup, r) });
const canAssignSupplier = (req, isBuyer, isAdmin) => {
    if (isAdmin) return true;
    if (isBuyer && (!req.supplier || req.supplier.trim() === "")) return true;
    return false;
};

const emptyLine = () => ({
    id: Date.now() + Math.random(),
    line: "", company: "", line_type: "", stock_code: "",
    description: "", order_unit: "", qty: "", unit_price: "",
    total_price: "", due_date: "", reqn_reason_notes: "", line_notes: "",
});

const groupByReqNumber = (rows) => {
    const map = new Map();
    for (const r of rows) {
        const key = r.req_number || r.req_id;
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(r);
    }
    return Array.from(map.entries()).map(([key, lines]) => ({ key, lines }));
};

/* ── Status legend (image3) ── */
const legendItems = [
    { label: "Created", color: "#e65c00" },
    { label: "Samantha", color: "#e91e63" },
    { label: "Final Approval", color: "#155724" },
    { label: "PO Created", color: "#007bff" },
    { label: "Received", color: "#28a745" },
    { label: "Declined", color: "#dc3545" },
    { label: "Delayed", color: "#ff9800" },
    { label: "Cancelled", color: "#7f8c8d" },
];

/* ── Export to Excel (CSV) ── */
const exportToExcel = (requisitions) => {
    if (!requisitions || requisitions.length === 0) return;
    const headers = ["Req #", "Reqn Date", "Line", "PO Number", "Status", "Order Status", "Received Date", "Expected Date", "Supplier", "Supplier Name", "Type", "STK", "Description", "Unit Price", "Quantity", "Total Price"];
    const rows = requisitions.map(r => [
        r.req_number || "", r.reqn_date || "", r.line || "", r.po_number || "",
        r.status || "", r.order_status || "", r.received_date || "", r.expected_date || "",
        r.supplier || "", r.supplier_name || "", r.type || "",
        r.stk || r.stock_code || "", r.description || "",
        r.unit_price || "", r.quantity || "", r.total_price || "",
    ]);
    const csvContent = [headers, ...rows].map(row =>
        row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    ).join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Requisitions_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
};

/* ══════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════ */
const Requisitions = () => {
    const navigate = useNavigate();
    const role = localStorage.getItem("roles");
    const username = localStorage.getItem("username");
    const firstName = localStorage.getItem("first_name");
    const lastName = localStorage.getItem("last_name");

    const isAdmin = role === "Admin";
    const isOriginator = role === "Originator";
    const isApprover1 = role === "Approvar1";
    const isApprover2 = role === "Approvar2";
    const isBuyer = role === "Buyer";

    const [toasts, setToasts] = useState([]);
    const [confirmCfg, setConfirmCfg] = useState(null);
    const [confirmRes, setConfirmRes] = useState(null);

    const toast = useCallback((msg, type = "success") => {
        const id = Date.now();
        setToasts(p => [...p, { id, msg, type }]);
        setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500);
    }, []);

    const confirm = useCallback((title, message, danger = false, confirmLabel = "OK") =>
        new Promise(resolve => {
            setConfirmCfg({ title, message, danger, confirmLabel });
            setConfirmRes(() => resolve);
        }), []);

    const handleConfirmYes = () => { setConfirmCfg(null); confirmRes && confirmRes(true); };
    const handleConfirmNo = () => { setConfirmCfg(null); confirmRes && confirmRes(false); };

    const [allRequisitions, setAllRequisitions] = useState([]);
    const [requisitions, setRequisitions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [statusFilter, setStatusFilter] = useState(null);

    const [showDeclineModal, setShowDeclineModal] = useState(false);
    const [showApprove1RouteModal, setShowApprove1RouteModal] = useState(false);
    const [showApprove2RouteModal, setShowApprove2RouteModal] = useState(false);
    const [showRouteModal, setShowRouteModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [managers, setManagers] = useState([]);
    const [admins, setAdmins] = useState([]);
    const [selectedManager, setSelectedManager] = useState("");
    const [selectedAdmin, setSelectedAdmin] = useState("");
    const [declineReason, setDeclineReason] = useState("");

    const [showNewReqModal, setShowNewReqModal] = useState(false);
    const [requisitionNo, setRequisitionNo] = useState("");
    const [requisitionDate, setRequisitionDate] = useState(new Date().toISOString().split("T")[0]);
    const [jobNo, setJobNo] = useState("");
    const [smartLine, setSmartLine] = useState("");
    const [lines, setLines] = useState([{ ...emptyLine(), line: "1" }]);
    const [selectedLineId, setSelectedLineId] = useState(null);
    const [saving, setSaving] = useState(false);

    const [showJobNoModal, setShowJobNoModal] = useState(false);
    const [jobNumbers, setJobNumbers] = useState([]);
    const [jobNoSearch, setJobNoSearch] = useState("");
    const [loadingJobNos, setLoadingJobNos] = useState(false);
    const [loadingJobLines, setLoadingJobLines] = useState(false);

    const [showSupplierModal, setShowSupplierModal] = useState(false);
    const [suppliers, setSuppliers] = useState([]);
    const [supplierSearch, setSupplierSearch] = useState("");
    const [loadingSuppliers, setLoadingSuppliers] = useState(false);
    const [supplierTargetGroup, setSupplierTargetGroup] = useState(null);

    const [inventoryItems, setInventoryItems] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [lineTypes, setLineTypes] = useState([]);
    const [uomList, setUomList] = useState([]);

    const [attachments, setAttachments] = useState([]);

    const selectedGroupLines = selectedGroup
        ? requisitions.filter(r => (r.req_number || r.req_id) === selectedGroup)
        : [];
    const selectedLine = selectedGroupLines[0] || null;

    /* ── Fetch ── */
    const fetchRequisitions = async () => {
        setLoading(true);
        try {
            const url = isAdmin
                ? `${API_URL}/api/requisitions`
                : `${API_URL}/api/requisitions/my/${username}`;
            const r = await axios.get(url);
            const data = r.data.map(req => ({
                ...req,
                supplier: (req.supplier || "").trim(),
                supplier_name: (req.supplier_name || "").trim(),
            }));
            setAllRequisitions(data);
            setRequisitions(data);
            setStatusFilter(null);
        } catch (e) {
            if (e.response?.status === 401) navigate("/login");
            else toast("Failed to fetch requisitions.", "error");
            setAllRequisitions([]);
            setRequisitions([]);
        } finally { setLoading(false); }
    };

    useEffect(() => { fetchRequisitions(); }, []);

    const handleShowAll = () => fetchRequisitions();
    const handleClearFilter = () => { setRequisitions(allRequisitions); setSelectedGroup(null); setStatusFilter(null); };

    /* ── Status filter (clicking legend dots) ── */
    const handleStatusFilter = (label) => {
        if (statusFilter === label) {
            setRequisitions(allRequisitions);
            setStatusFilter(null);
        } else {
            const filtered = allRequisitions.filter(r => {
                const s = (r.status || "").toLowerCase();
                return s === label.toLowerCase();
            });
            setRequisitions(filtered);
            setStatusFilter(label);
            setSelectedGroup(null);
        }
    };

    const putGroup = async (reqNumber, payload) =>
        axios.put(`${API_URL}/api/requisitions/update-group/${encodeURIComponent(reqNumber)}`, payload);

    const getRouteToTitle = () => {
        if (isOriginator) return "Buyer";
        if (isBuyer) return "Approver 1";
        return "Approver";
    };

    /* ── Route To ── */
    const handleRouteTo = async () => {
        if (!selectedGroup) { toast("Please select a requisition first.", "error"); return; }
        let ep = `${API_URL}/api/buyers`;
        if (isBuyer) ep = `${API_URL}/api/managers`;
        try {
            const r = await axios.get(ep);
            setManagers(r.data); setSelectedManager(""); setShowRouteModal(true);
        } catch { toast("Failed to fetch approvers.", "error"); }
    };

    const handleConfirmRouteTo = async () => {
        if (!selectedManager) { toast("Please select an approver.", "error"); return; }
        try {
            await putGroup(selectedGroup, { status: "Approver 1", order_status: selectedManager });
            toast(`Routed to ${selectedManager}!`);
            setShowRouteModal(false); setSelectedGroup(null); setSelectedManager(""); handleShowAll();
        } catch (err) { toast(`Failed: ${err.response?.data?.error || err.message}`, "error"); }
    };

    /* ── Approve 1 ── */
    const handleApprove = async () => {
        if (!selectedGroup) { toast("Please select a requisition first.", "error"); return; }
        if (isApprover1) {
            try {
                const r = await axios.get(`${API_URL}/api/managers2`);
                setManagers(r.data); setSelectedManager(""); setShowApprove1RouteModal(true);
            } catch { toast("Failed to load Approver 2 list.", "error"); }
        } else if (isApprover2) {
            try {
                const r = await axios.get(`${API_URL}/api/admins`);
                setAdmins(r.data); setSelectedAdmin(""); setShowApprove2RouteModal(true);
            } catch { toast("Failed to load admin list.", "error"); }
        } else if (isAdmin) {
            try {
                const r = await axios.get(`${API_URL}/api/managers`);
                setManagers(r.data); setSelectedManager(""); setShowApprove1RouteModal(true);
            } catch { toast("Failed to load approver list.", "error"); }
        } else {
            toast("You don't have approval permissions.", "error");
        }
    };

    const handleConfirmApprove1Route = async () => {
        if (!selectedManager) { toast("Please select an Approver 2.", "error"); return; }
        try {
            await putGroup(selectedGroup, { status: "Final Approval", order_status: selectedManager });
            toast(`✅ Routed to ${selectedManager} for Final Approval!`);
            setShowApprove1RouteModal(false); setSelectedManager(""); setSelectedGroup(null); handleShowAll();
        } catch (err) { toast(`Failed: ${err.response?.data?.error || err.message}`, "error"); }
    };

    const handleConfirmApprove2Route = async () => {
        if (!selectedAdmin) { toast("Please select an Admin.", "error"); return; }
        try {
            await putGroup(selectedGroup, { status: "PO Created", order_status: selectedAdmin });
            toast(`✅ REQ #${selectedGroup} — PO Created, routed to ${selectedAdmin}!`);
            setShowApprove2RouteModal(false); setSelectedAdmin(""); setSelectedGroup(null); handleShowAll();
        } catch (err) { toast(`Failed: ${err.response?.data?.error || err.message}`, "error"); }
    };

    /* ── Decline ── */
    const handleDecline = () => {
        if (!selectedGroup) { toast("Please select a requisition first.", "error"); return; }
        setDeclineReason(""); setShowDeclineModal(true);
    };

    const handleConfirmDecline = async () => {
        if (!declineReason.trim()) { toast("Please enter a reason.", "error"); return; }
        try {
            await putGroup(selectedGroup, { status: "Declined", order_status: username });
            toast(`REQ #${selectedGroup} declined.`, "info");
            setShowDeclineModal(false); setDeclineReason(""); setSelectedGroup(null); handleShowAll();
        } catch (err) { toast(`Failed: ${err.response?.data?.error || err.message}`, "error"); }
    };

    /* ── Cancel Requisition ── */
    const handleCancelRequisition = async () => {
        if (!selectedGroup) { toast("Please select a requisition first.", "error"); return; }
        const ok = await confirm("Cancel Requisition", `Are you sure you want to cancel REQ #${selectedGroup}? This cannot be undone.`, true, "Yes, Cancel It");
        if (!ok) return;
        try {
            await putGroup(selectedGroup, { status: "Cancelled", order_status: username });
            toast(`REQ #${selectedGroup} cancelled.`);
            setSelectedGroup(null); handleShowAll();
        } catch (err) { toast(`Failed: ${err.response?.data?.error || err.message}`, "error"); }
    };

    /* ── Mark as PO Created ── */
    const handleMarkPOCreated = async () => {
        if (!selectedGroup) { toast("Please select a requisition first.", "error"); return; }
        const ok = await confirm("Mark as PO Created", `Mark REQ #${selectedGroup} as PO Created?`, false, "Confirm");
        if (!ok) return;
        try {
            await putGroup(selectedGroup, { status: "PO Created", order_status: username });
            toast(`REQ #${selectedGroup} marked as PO Created!`);
            setSelectedGroup(null); handleShowAll();
        } catch (err) { toast(`Failed: ${err.response?.data?.error || err.message}`, "error"); }
    };

    /* ── View Requisition ── */
    const handleViewRequisition = () => {
        if (!selectedGroup) { toast("Please select a requisition first.", "error"); return; }
        setShowViewModal(true);
    };

    /* ── Print ── */
    const handlePrintRequisition = () => {
        if (!selectedGroup) { toast("Please select a requisition first.", "error"); return; }
        toast(`Printing REQ #${selectedGroup}…`, "info");
        window.print();
    };

    const handlePrintFullRequisition = () => {
        if (!selectedGroup) { toast("Please select a requisition first.", "error"); return; }
        toast(`Printing full REQ #${selectedGroup}…`, "info");
        window.print();
    };

    /* ── Archive ── */
    const handleArchive = async () => {
        if (!selectedGroup) { toast("Please select a requisition first.", "error"); return; }
        toast(`REQ #${selectedGroup} archived.`, "info");
    };

    const handleViewArchive = () => { toast("View Archive — coming soon.", "info"); };
    const handleRestoreGridLayout = () => { toast("Grid layout restored.", "info"); };

    /* ── Export ── */
    const handleExportToExcel = () => {
        if (requisitions.length === 0) { toast("No data to export.", "error"); return; }
        exportToExcel(requisitions);
        toast(`Exported ${requisitions.length} row(s) to Excel.`);
    };

    /* ── Logout ── */
    const handleLogout = () => {
        localStorage.clear();
        navigate("/login");
    };

    /* ── Supplier ── */
    const fetchSuppliers = async () => {
        setLoadingSuppliers(true);
        try { const r = await axios.get(`${API_URL}/api/suppliers`); setSuppliers(r.data); }
        catch { toast("Failed to load suppliers.", "error"); }
        finally { setLoadingSuppliers(false); }
    };

    const handleOpenSupplierModal = (groupKey, firstLine) => {
        if (!canAssignSupplier(firstLine, isBuyer, isAdmin)) return;
        setSupplierTargetGroup(groupKey); setSupplierSearch(""); fetchSuppliers(); setShowSupplierModal(true);
    };

    const handleSelectSupplier = async (supplierCode, supplierName) => {
        try {
            await axios.put(`${API_URL}/api/requisitions/update-supplier`, {
                req_number: supplierTargetGroup,
                supplier: supplierCode.trim(),
                supplier_name: supplierName.trim(),
            });
            setShowSupplierModal(false); setSupplierTargetGroup(null); setSupplierSearch(""); handleShowAll();
            toast(`Supplier ${supplierCode} assigned to all lines!`);
        } catch (err) { toast(`Failed: ${err.response?.data?.error || err.message}`, "error"); }
    };

    const filteredSuppliers = suppliers.filter(s =>
        s.code.toLowerCase().includes(supplierSearch.toLowerCase()) ||
        s.name.toLowerCase().includes(supplierSearch.toLowerCase())
    );

    /* ── Lookup fetchers ── */
    const fetchInventory = async () => { try { const r = await axios.get(`${API_URL}/api/inventory`); setInventoryItems(r.data); } catch (e) { console.error(e); } };
    const fetchCompanies = async () => { try { const r = await axios.get(`${API_URL}/api/companies`); setCompanies(r.data); } catch (e) { console.error(e); } };
    const fetchLineTypes = async () => { try { const r = await axios.get(`${API_URL}/api/linetypes`); setLineTypes(r.data); } catch (e) { console.error(e); } };
    const fetchUOM = async () => { try { const r = await axios.get(`${API_URL}/api/uom`); setUomList(r.data); } catch (e) { console.error(e); } };

    const fetchNextReqNumber = async () => {
        try { const r = await axios.get(`${API_URL}/api/next-req-number`); setRequisitionNo(String(r.data.next_req_number)); }
        catch (e) { console.error(e); setRequisitionNo(""); }
    };

    const fetchJobNumbers = async () => {
        setLoadingJobNos(true);
        try { const r = await axios.get(`${API_URL}/api/job-numbers`); setJobNumbers(r.data); }
        catch (e) { console.error(e); }
        finally { setLoadingJobNos(false); }
    };

    const handleOpenJobNoModal = () => { setJobNoSearch(""); fetchJobNumbers(); setShowJobNoModal(true); };

    const handleSelectJobNo = async (selectedJobNo) => {
        setJobNo(selectedJobNo);
        setShowJobNoModal(false);
        setJobNoSearch("");

        const hasUserEnteredData = lines.some(l =>
            (l.description && l.description.trim()) ||
            (l.stock_code && l.stock_code.trim()) ||
            (l.qty && parseFloat(l.qty) > 0) ||
            (l.unit_price && parseFloat(l.unit_price) > 0)
        );

        if (hasUserEnteredData) {
            toast(`Job # ${selectedJobNo} set. Your existing lines were kept.`, "success");
            return;
        }
return;
        setLoadingJobLines(true);
        try {
            const res = await axios.get(`${API_URL}/api/requisition-by-job/${encodeURIComponent(selectedJobNo)}`);
            if (res.data && res.data.length > 0) {
                const dbLines = res.data.map((row, i) => ({
                    id: Date.now() + i, line: row.line || String(i + 1),
                    company: row.company || "", line_type: row.line_type || "",
                    stock_code: row.stock_code || "", description: row.description || "",
                    order_unit: row.order_unit || "", qty: row.qty || "",
                    unit_price: row.unit_price || "", total_price: row.total_price || "",
                    due_date: row.due_date || "", reqn_reason_notes: row.reqn_reason_notes || "",
                    line_notes: row.line_notes || "",
                }));
                setLines(dbLines);
                if (res.data[0].reqn_date) setRequisitionDate(res.data[0].reqn_date);
                toast(`Loaded ${dbLines.length} line(s) from Job: ${selectedJobNo}`);
            } else {
                setLines([{ ...emptyLine(), line: "1" }]);
                toast(`No lines found for Job: ${selectedJobNo}. Starting fresh.`, "info");
            }
        } catch { toast("Failed to load job lines.", "error"); setLines([{ ...emptyLine(), line: "1" }]); }
        finally { setLoadingJobLines(false); }
    };

    const filteredJobNumbers = jobNumbers.filter(j => j.job_no.toLowerCase().includes(jobNoSearch.toLowerCase()));

    /* ── New Req modal ── */
    const handleOpenNewReq = () => {
        setRequisitionDate(new Date().toISOString().split("T")[0]);
        setJobNo(""); setSmartLine(""); setLines([{ ...emptyLine(), line: "1" }]);
        setSelectedLineId(null); setShowNewReqModal(true);
        setAttachments([]);
        fetchNextReqNumber(); fetchInventory(); fetchCompanies(); fetchLineTypes(); fetchUOM();
    };

    const handleExitNewReq = () => { setShowNewReqModal(false); };

    const handleCancelNewReq = async () => {
        const ok = await confirm("Cancel Requisition", "Are you sure you want to cancel? All unsaved changes will be lost.", true, "Yes, Cancel");
        if (ok) {
            setShowNewReqModal(false);
            setLines([{ ...emptyLine(), line: "1" }]);
            setJobNo(""); setSmartLine(""); setRequisitionNo(""); setAttachments([]);
        }
    };

    const handleStockCodeChange = (id, itemCode) => {
        const found = inventoryItems.find(i => String(i.item_code).trim() === String(itemCode).trim());
        setLines(prev => prev.map(l => l.id !== id ? l : {
            ...l, stock_code: itemCode,
            description: found ? String(found.description).trim() : "",
            order_unit: found ? String(found.unit_size).trim() : "",
        }));
    };

    const handleAddLine = () => setLines(prev => [...prev, { ...emptyLine(), line: String(prev.length + 1) }]);

    const handleDeleteLine = async () => {
        if (!selectedLineId) { toast("Select a line to delete.", "error"); return; }
        if (lines.length === 1) { toast("At least one line is required.", "error"); return; }
        const ok = await confirm("Delete Line", "Delete this line?", true, "Delete");
        if (!ok) return;
        setLines(prev => prev.filter(l => l.id !== selectedLineId).map((l, i) => ({ ...l, line: String(i + 1) })));
        setSelectedLineId(null);
    };

    const handleCellChange = (id, field, value) => {
        setLines(prev => prev.map(l => {
            if (l.id !== id) return l;
            const u = { ...l, [field]: value };
            if (field === "line_type" && value.toUpperCase().includes("NON")) { u.stock_code = ""; u.description = ""; u.order_unit = ""; }
            if (field === "qty" || field === "unit_price") {
                const q = parseFloat(field === "qty" ? value : l.qty) || 0;
                const p = parseFloat(field === "unit_price" ? value : l.unit_price) || 0;
                u.total_price = (q * p).toFixed(2);
            }
            return u;
        }));
    };

    /* ── Save + upload attachments ── */
    const handleSaveNewReq = async () => {
        if (!requisitionNo) { toast("Please enter a Requisition #.", "error"); return; }
        if (!jobNo) { toast("Please enter a JOB NO #.", "error"); return; }
        if (!username) { toast("Session expired. Please log in again.", "error"); navigate("/login"); return; }
        setSaving(true);
        try {
            for (const l of lines) {
                await axios.post(`${API_URL}/api/requisitions`, {
                    req_id: `${requisitionNo}-L${l.line}`,
                    req_number: requisitionNo,
                    reqn_date: requisitionDate || "",
                    line: l.line,
                    job_no: jobNo || "",
                    originator: username || "",
                    po_number: "",
                    status: "Created",
                    order_status: "",
                    received_date: "",
                    expected_date: l.due_date || "",
                    supplier: "",
                    supplier_name: smartLine || "",
                    type: l.line_type || "",
                    stk: l.stock_code || "",
                    description: l.description || "",
                    unit_price: parseFloat(l.unit_price) || 0,
                    quantity: parseFloat(l.qty) || 0,
                    total_price: (parseFloat(l.unit_price) || 0) * (parseFloat(l.qty) || 0),
                    order_unit: l.order_unit || "",
                    company: l.company || "",
                    reqn_reason_notes: l.reqn_reason_notes || "",
                    line_notes: l.line_notes || "",
                });
            }

            if (attachments && attachments.length > 0 && requisitionNo) {
                for (const file of attachments) {
                    const formData = new FormData();
                    formData.append("file", file);
                    formData.append("uploaded_by", username);
                    try {
                        await axios.post(`${API_URL}/api/requisitions/${encodeURIComponent(requisitionNo)}/attachments`, formData, {
                            headers: { "Content-Type": "multipart/form-data" },
                        });
                    } catch (err) {
                        console.error("Attachment upload failed:", err);
                        toast(`Failed to upload: ${file.name}`, "error");
                    }
                }
                toast(`${attachments.length} attachment(s) uploaded!`);
                setAttachments([]);
            }

            toast(`Requisition ${requisitionNo} saved — ${lines.length} line(s)!`);
            setShowNewReqModal(false); handleShowAll();
        } catch (err) { toast(`Failed to save: ${err.response?.data?.error || err.message}`, "error"); }
        finally { setSaving(false); }
    };

    const groups = groupByReqNumber(requisitions);

    /* ══════════════════════════════════════════════════════════════
       RENDER
    ══════════════════════════════════════════════════════════════ */
    return (
        <div style={{ fontFamily: "Segoe UI, sans-serif", height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden", backgroundColor: "#f5f5f5" }}>
            <Toast toasts={toasts} />
            <ConfirmDialog cfg={confirmCfg} onYes={handleConfirmYes} onNo={handleConfirmNo} />

            {/* ── Dark header bar ── */}
            <div style={{ backgroundColor: "#2c3e50", color: "white", padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "700" }}>Requisitions - SLI REQUISITION</h2>
                <button onClick={handleLogout} style={{ padding: "6px 16px", backgroundColor: "#dc3545", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "600", fontSize: "13px" }}>🔓 Logout</button>
            </div>

            {/* ── Status legend (clickable filters) ── */}
            <div style={{ padding: "8px 20px", display: "flex", gap: "18px", flexWrap: "wrap", fontSize: "13px", borderBottom: "1px solid #eee" }}>
                {legendItems.map((item, i) => (
                    <span key={i}
                        onClick={() => handleStatusFilter(item.label)}
                        style={{
                            display: "flex", alignItems: "center", gap: "5px", color: item.color, fontWeight: "600",
                            cursor: "pointer", opacity: statusFilter && statusFilter !== item.label ? 0.4 : 1,
                            textDecoration: statusFilter === item.label ? "underline" : "none",
                            transition: "opacity 0.2s",
                        }}>
                        <span style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: item.color, display: "inline-block" }}></span>
                        {item.label}
                    </span>
                ))}
                {statusFilter && (
                    <span onClick={() => { setRequisitions(allRequisitions); setStatusFilter(null); }}
                        style={{ color: "#007bff", cursor: "pointer", fontWeight: "600", textDecoration: "underline", fontSize: "12px" }}>
                        ✕ Clear Filter
                    </span>
                )}
            </div>

            {/* ── Main toolbar (all buttons from image3) ── */}
            <div style={{ padding: "8px 15px", borderBottom: "1px solid #ccc", display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                <button onClick={handleShowAll} style={btn("#ffffff", "#555", "1px solid #ccc")}>Show All</button>
                <button onClick={handleClearFilter} style={btn("#ffffff", "#555", "1px solid #ccc")}>Clear Filter</button>
                <button onClick={handleShowAll} style={btn("#007bff")}>Refresh</button>
                <button onClick={handleOpenNewReq} style={btn("#007bff")}>New Requisition</button>
                <button onClick={handleApprove} style={btn("#28a745")}>Approve</button>
                <button onClick={handleDecline} style={btn("#ffc107", "#212529")}>Decline</button>
                <button onClick={handlePrintRequisition} style={btn("#dc3545")}>Print Requisition</button>
                <button onClick={handlePrintFullRequisition} style={btn("#6c757d")}>Print Full Requisition</button>
                <button onClick={handleRouteTo} style={btn("#6c757d")}>Route To</button>
                <button onClick={handleCancelRequisition} style={btn("#ffffff", "#28a745", "1px solid #28a745")}>Cancel Requisition</button>
                <button onClick={handleArchive} style={btn("#6610f2")}>Archive</button>
                <button onClick={handleViewArchive} style={btn("#ffffff", "#28a745", "1px solid #28a745")}>View Archive</button>
                <button onClick={handleMarkPOCreated} style={btn("#343a40")}>Mark as PO Created</button>
                <button onClick={handleRestoreGridLayout} style={btn("#ffffff", "#000", "1px solid #000")}>Restore Grid Layout</button>
                <button onClick={handleViewRequisition} style={btn("#17a2b8")}>View Requisition</button>
                <button onClick={handleExportToExcel} style={btn("#155724")}>Export to Excel</button>
            </div>

            {/* ── Main table ── */}
            <div style={{ flex: 1, overflowY: "auto", overflowX: "auto", padding: "0" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                    <thead style={{ position: "sticky", top: 0, zIndex: 1 }}>
                        <tr>
                            <th style={styles.tableHeader}></th>
                            <th style={styles.tableHeader}>Req #</th>
                            <th style={styles.tableHeader}>Reqn Date</th>
                            <th style={styles.tableHeader}>Line</th>
                            <th style={styles.tableHeader}>PO Number</th>
                            <th style={styles.tableHeader}>Status</th>
                            <th style={styles.tableHeader}>Order Status</th>
                            <th style={styles.tableHeader}>Received Date</th>
                            <th style={styles.tableHeader}>Expected Date</th>
                            <th style={styles.tableHeader}>Supplier</th>
                            <th style={styles.tableHeader}>Supplier Name</th>
                            <th style={styles.tableHeader}>Type</th>
                            <th style={styles.tableHeader}>STK</th>
                            <th style={styles.tableHeader}>Description</th>
                            <th style={styles.tableHeader}>Unit Price</th>
                            <th style={styles.tableHeader}>Quantity</th>
                            <th style={styles.tableHeader}>Total Price</th>
                        </tr>
                    </thead>
                    <tbody>
                        {groups.length > 0 ? groups.map(({ key, lines: groupLines }) => {
                            const totalLines = groupLines.length;
                            const firstLine = groupLines[0];
                            const isSelected = selectedGroup === key;
                            const canEdit = canAssignSupplier(firstLine, isBuyer, isAdmin);
                            const hasSupplier = !!(firstLine.supplier && firstLine.supplier.trim());
                            const hasSupName = !!(firstLine.supplier_name && firstLine.supplier_name.trim());

                            return groupLines.map((req, idx) => {
                                const isFirst = idx === 0;
                                const bgColor = isSelected ? "#d0e8ff" : getRowBgColor(req.status, req.supplier, role);
                                const cellStyle = {
                                    ...styles.tableCell,
                                    borderBottom: idx === totalLines - 1 ? "2px solid #999" : "1px solid #eee",
                                };
                                const rowStyle = { backgroundColor: bgColor, cursor: "pointer", transition: "background-color 0.15s" };

                                return (
                                    <tr key={req.req_id || `${key}-${idx}`} style={rowStyle} onClick={() => setSelectedGroup(isSelected ? null : key)}>

                                        {isFirst && (
                                            <td rowSpan={totalLines} style={{ ...cellStyle, borderBottom: "2px solid #999", textAlign: "center", verticalAlign: "middle", width: "40px" }}>
                                                <input type="checkbox" style={styles.checkbox} checked={isSelected}
                                                    onChange={() => setSelectedGroup(isSelected ? null : key)}
                                                    onClick={e => e.stopPropagation()} />
                                            </td>
                                        )}

                                        {isFirst && (
                                            <td rowSpan={totalLines} style={{ ...cellStyle, borderBottom: "2px solid #999", fontWeight: "700", color: "#007bff", verticalAlign: "middle", textAlign: "center" }}>
                                                {key}
                                                {totalLines > 1 && <div style={{ fontSize: "10px", color: "#6c757d", fontWeight: "400", marginTop: "2px" }}>{totalLines} lines</div>}
                                            </td>
                                        )}

                                        <td style={cellStyle}>{isFirst ? (req.reqn_date || "-") : ""}</td>
                                        <td style={{ ...cellStyle, fontWeight: "600", textAlign: "center" }}>{req.line || "-"}</td>
                                        <td style={cellStyle}>{isFirst ? (req.po_number || "-") : ""}</td>

                                        {isFirst ? (
                                            <td rowSpan={totalLines} style={{ ...cellStyle, borderBottom: "2px solid #999", verticalAlign: "middle" }}>
                                                <span style={getStatusBadgeStyle(req.status, req.supplier, role)}>{req.status || "-"}</span>
                                            </td>
                                        ) : null}

                                        {isFirst ? (
                                            <td rowSpan={totalLines} style={{ ...cellStyle, borderBottom: "2px solid #999", verticalAlign: "middle", fontWeight: req.order_status ? "700" : "400", color: req.order_status ? "#007bff" : "#999" }}>
                                                {req.order_status || "-"}
                                            </td>
                                        ) : null}

                                        <td style={cellStyle}>{isFirst ? (req.received_date || "-") : ""}</td>
                                        <td style={cellStyle}>{req.expected_date || "-"}</td>

                                        {isFirst && (
                                            <td rowSpan={totalLines}
                                                style={{
                                                    ...cellStyle, borderBottom: "2px solid #999", verticalAlign: "middle",
                                                    cursor: canEdit ? "pointer" : "default",
                                                    color: hasSupplier ? "#6610f2" : (canEdit ? "#007bff" : "#999"),
                                                    textDecoration: canEdit ? "underline" : "none",
                                                    fontWeight: hasSupplier ? "700" : (canEdit ? "600" : "400"),
                                                }}
                                                onClick={e => { e.stopPropagation(); canEdit && handleOpenSupplierModal(key, firstLine); }}
                                                title={canEdit ? "Click to assign supplier" : (hasSupplier ? firstLine.supplier : "")}>
                                                {hasSupplier ? firstLine.supplier : (canEdit ? "📦 Assign" : "-")}
                                            </td>
                                        )}

                                        {isFirst && (
                                            <td rowSpan={totalLines} style={{ ...cellStyle, borderBottom: "2px solid #999", verticalAlign: "middle", color: hasSupName ? "#6610f2" : "#999", fontWeight: hasSupName ? "600" : "400" }}>
                                                {hasSupName ? firstLine.supplier_name : "-"}
                                            </td>
                                        )}

                                        <td style={cellStyle}>{req.type || "-"}</td>
                                        <td style={cellStyle}>{req.stk || req.stock_code || "-"}</td>
                                        <td style={cellStyle}>{req.description || "-"}</td>
                                        <td style={{ ...cellStyle, textAlign: "right" }}>{req.unit_price || "-"}</td>
                                        <td style={{ ...cellStyle, textAlign: "right" }}>{req.quantity || "-"}</td>
                                        <td style={{ ...cellStyle, textAlign: "right", fontWeight: "600", color: "#155724" }}>{req.total_price || "-"}</td>
                                    </tr>
                                );
                            });
                        }) : (
                            <tr><td colSpan="17" style={{ textAlign: "center", padding: "30px", color: "#999" }}>{loading ? "Loading…" : "No Records Found"}</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* ══════ View Requisition Modal ══════ */}
            {showViewModal && selectedGroup && (
                <div style={styles.modalOverlay}>
                    <div style={{ background: "white", borderRadius: "10px", width: "700px", maxHeight: "80vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 8px 32px rgba(0,0,0,0.3)" }}>
                        <div style={{ backgroundColor: "#17a2b8", color: "white", padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <h3 style={{ margin: 0, fontSize: "16px" }}>📋 View Requisition — REQ #{selectedGroup}</h3>
                            <button onClick={() => setShowViewModal(false)} style={{ background: "none", border: "none", color: "white", fontSize: "20px", cursor: "pointer" }}>✕</button>
                        </div>
                        <div style={{ padding: "15px 20px", borderBottom: "1px solid #ddd", backgroundColor: "#f8f9fa", fontSize: "13px", display: "flex", gap: "20px", flexWrap: "wrap" }}>
                            <div><strong>Status:</strong> <span style={getStatusBadgeStyle(selectedLine?.status, selectedLine?.supplier, role)}>{selectedLine?.status || "-"}</span></div>
                            <div><strong>Reqn Date:</strong> {selectedLine?.reqn_date || "-"}</div>
                            <div><strong>PO #:</strong> {selectedLine?.po_number || "-"}</div>
                            <div><strong>Supplier:</strong> {selectedLine?.supplier || "-"} — {selectedLine?.supplier_name || "-"}</div>
                            <div><strong>Routed To:</strong> {selectedLine?.order_status || "-"}</div>
                        </div>
                        <div style={{ flex: 1, overflowY: "auto", padding: "0" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                                <thead>
                                    <tr>
                                        <th style={styles.tableHeader}>Line</th>
                                        <th style={styles.tableHeader}>Type</th>
                                        <th style={styles.tableHeader}>STK</th>
                                        <th style={styles.tableHeader}>Description</th>
                                        <th style={styles.tableHeader}>Qty</th>
                                        <th style={styles.tableHeader}>Unit Price</th>
                                        <th style={styles.tableHeader}>Total</th>
                                        <th style={styles.tableHeader}>Expected</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedGroupLines.map((r, i) => (
                                        <tr key={i} style={{ backgroundColor: i % 2 === 0 ? "white" : "#f8f9fa" }}>
                                            <td style={styles.tableCell}>{r.line || "-"}</td>
                                            <td style={styles.tableCell}>{r.type || "-"}</td>
                                            <td style={styles.tableCell}>{r.stk || r.stock_code || "-"}</td>
                                            <td style={styles.tableCell}>{r.description || "-"}</td>
                                            <td style={{ ...styles.tableCell, textAlign: "right" }}>{r.quantity || "-"}</td>
                                            <td style={{ ...styles.tableCell, textAlign: "right" }}>{r.unit_price || "-"}</td>
                                            <td style={{ ...styles.tableCell, textAlign: "right", fontWeight: "600", color: "#155724" }}>{r.total_price || "-"}</td>
                                            <td style={styles.tableCell}>{r.expected_date || "-"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div style={{ padding: "12px 20px", borderTop: "1px solid #ddd", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: "12px", color: "#666" }}>{selectedGroupLines.length} line(s)</span>
                            <button onClick={() => setShowViewModal(false)} style={btn("#6c757d")}>Close</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ══════ New Requisition Modal ══════ */}
            {showNewReqModal && (
                <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.6)", zIndex: 2000, display: "flex", justifyContent: "center", alignItems: "center" }}>
                    <div style={{ width: "95vw", height: "90vh", backgroundColor: "white", borderRadius: "8px", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 8px 32px rgba(0,0,0,0.3)" }}>
                        <div style={{ backgroundColor: "#1a73e8", color: "white", padding: "6px 15px", fontSize: "13px", fontWeight: "600" }}>SLI REQUISITION</div>
                        <div style={{ backgroundColor: "#1a73e8", padding: "0 10px", display: "flex" }}>
                            <div style={{ backgroundColor: "white", padding: "5px 20px", borderRadius: "4px 4px 0 0", fontSize: "13px", fontWeight: "600", color: "#333" }}>Requisition</div>
                        </div>

                        {/* Toolbar */}
                        <div style={{ backgroundColor: "#f8f8f8", borderBottom: "1px solid #ddd", padding: "6px 10px", display: "flex", alignItems: "center", flexWrap: "wrap", gap: "4px" }}>
                            <div style={{ display: "flex", paddingRight: "15px", borderRight: "1px solid #ccc" }}>
                                <button onClick={handleExitNewReq} style={toolbarBtn}><span style={{ fontSize: "22px" }}>🚪</span>Exit</button>
                                <button onClick={handleSaveNewReq} disabled={saving} style={{ ...toolbarBtn, color: saving ? "#aaa" : "#333" }}><span style={{ fontSize: "22px" }}>💾</span>{saving ? "Saving…" : "Save"}</button>
                                <button onClick={handleAddLine} style={toolbarBtn}><span style={{ fontSize: "22px" }}>➕</span>Add Line</button>
                                <button onClick={handleDeleteLine} style={toolbarBtn}><span style={{ fontSize: "22px" }}>🗑️</span>Delete Line</button>
                                <button onClick={handleCancelNewReq} style={{ ...toolbarBtn, color: "#dc3545" }}><span style={{ fontSize: "22px" }}>❌</span>Cancel</button>
                                <button type="button" onClick={() => document.getElementById("reqAttachmentInput").click()} style={toolbarBtn}>
                                    <span style={{ fontSize: "22px" }}>📎</span>
                                    {attachments.length > 0 ? `Attach (${attachments.length})` : "Attach"}
                                </button>
                                <input id="reqAttachmentInput" type="file" multiple style={{ display: "none" }}
                                    onChange={(e) => {
                                        const files = Array.from(e.target.files || []);
                                        if (files.length > 0) { setAttachments((prev) => [...prev, ...files]); toast(`${files.length} file(s) added.`); }
                                        e.target.value = "";
                                    }}
                                />
                            </div>

                            <div style={{ display: "flex", gap: "20px", paddingLeft: "15px", fontSize: "12px", flexWrap: "wrap", alignItems: "flex-start" }}>
                                <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                        <label style={{ fontWeight: "600", whiteSpace: "nowrap", fontSize: "12px" }}>Requisition #:</label>
                                        <input value={requisitionNo} readOnly style={{ border: "1px solid #ccc", borderRadius: "3px", padding: "3px 6px", fontSize: "12px", width: "120px", backgroundColor: "#f0fff0", fontWeight: "700", color: "#155724" }} />
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                        <label style={{ fontWeight: "600", whiteSpace: "nowrap", fontSize: "12px" }}>Requisition Date:</label>
                                        <input type="date" value={requisitionDate} onChange={e => setRequisitionDate(e.target.value)} style={{ border: "1px solid #ccc", borderRadius: "3px", padding: "3px 6px", fontSize: "12px", width: "130px" }} />
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                        <label style={{ fontWeight: "600", whiteSpace: "nowrap", fontSize: "12px" }}>Requisition User:</label>
                                        <input value={`${firstName} ${lastName}`} readOnly style={{ border: "1px solid #ccc", borderRadius: "3px", padding: "3px 6px", fontSize: "12px", width: "130px", backgroundColor: "#f0f0f0", color: "#666" }} />
                                    </div>
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                        <label style={{ fontWeight: "600", whiteSpace: "nowrap", fontSize: "12px" }}>JOB NO #:</label>
                                        <input value={jobNo} onChange={e => setJobNo(e.target.value)} placeholder="Type or pick…" style={{ border: "1px solid #ccc", borderRadius: "3px", padding: "3px 6px", fontSize: "12px", width: "110px" }} />
                                        <button onClick={handleOpenJobNoModal} style={{ padding: "3px 8px", fontSize: "11px", backgroundColor: "#007bff", color: "white", border: "none", borderRadius: "3px", cursor: "pointer" }}>📋 Pick</button>
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                        <label style={{ fontWeight: "600", whiteSpace: "nowrap", fontSize: "12px" }}>Smart Line:</label>
                                        <input value={smartLine} onChange={e => setSmartLine(e.target.value)} style={{ border: "1px solid #ccc", borderRadius: "3px", padding: "3px 6px", fontSize: "12px", width: "100px" }} />
                                    </div>
                                    {loadingJobLines && <div style={{ fontSize: "11px", color: "#007bff", fontWeight: "600" }}>⏳ Loading…</div>}
                                </div>
                                <div style={{ display: "flex", alignItems: "center" }}>
                                    <div style={{ backgroundColor: "#e8f0fe", border: "1px solid #007bff", borderRadius: "6px", padding: "6px 14px", fontSize: "13px", fontWeight: "700", color: "#007bff" }}>
                                        {lines.length} line{lines.length !== 1 ? "s" : ""} — REQ #{requisitionNo || "…"}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Search row */}
                        <div style={{ padding: "5px 10px", backgroundColor: "#f8f8f8", borderBottom: "1px solid #ddd", display: "flex", gap: "6px" }}>
                            <input placeholder="Search…" style={{ padding: "4px 8px", border: "1px solid #ccc", borderRadius: "3px", fontSize: "12px", width: "200px" }} />
                            <button style={{ padding: "4px 12px", backgroundColor: "#f0f0f0", border: "1px solid #ccc", borderRadius: "3px", cursor: "pointer", fontSize: "12px" }}>Find</button>
                            <button style={{ padding: "4px 12px", backgroundColor: "#f0f0f0", border: "1px solid #ccc", borderRadius: "3px", cursor: "pointer", fontSize: "12px" }}>Clear</button>
                        </div>

                        {/* Grid */}
                        <div style={{ flex: 1, overflowY: "auto", overflowX: "auto" }}>
                            {loadingJobLines ? (
                                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "200px", flexDirection: "column", gap: "10px" }}>
                                    <div style={{ fontSize: "36px" }}>⏳</div>
                                    <div style={{ fontSize: "14px", color: "#007bff", fontWeight: "600" }}>Loading lines…</div>
                                </div>
                            ) : (
                                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                                    <thead style={{ position: "sticky", top: 0, backgroundColor: "#f8f9fa", zIndex: 1 }}>
                                        <tr>
                                            <th style={{ ...gridCell, width: "30px" }}></th>
                                            <th style={{ ...gridCell, minWidth: "50px" }}>Line</th>
                                            <th style={{ ...gridCell, minWidth: "100px" }}>Company</th>
                                            <th style={{ ...gridCell, minWidth: "110px" }}>Line Type</th>
                                            <th style={{ ...gridCell, minWidth: "200px" }}>Stock Code</th>
                                            <th style={{ ...gridCell, minWidth: "200px" }}>Description</th>
                                            <th style={{ ...gridCell, minWidth: "80px" }}>Order UOM</th>
                                            <th style={{ ...gridCell, minWidth: "60px" }}>Qty</th>
                                            <th style={{ ...gridCell, minWidth: "90px" }}>Unit Price</th>
                                            <th style={{ ...gridCell, minWidth: "90px" }}>Total Price</th>
                                            <th style={{ ...gridCell, minWidth: "120px" }}>Due Date</th>
                                            <th style={{ ...gridCell, minWidth: "200px" }}>Reqn Reason Notes</th>
                                            <th style={{ ...gridCell, minWidth: "200px" }}>Line Notes</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {lines.map(line => (
                                            <tr key={line.id} onClick={() => setSelectedLineId(line.id)} style={{ backgroundColor: selectedLineId === line.id ? "#cce5ff" : "white", cursor: "pointer" }}>
                                                <td style={gridCell}><input type="checkbox" checked={selectedLineId === line.id} onChange={() => setSelectedLineId(selectedLineId === line.id ? null : line.id)} onClick={e => e.stopPropagation()} /></td>
                                                <td style={gridCell}><input value={line.line} readOnly style={{ ...gridInput, width: "40px", color: "#666" }} /></td>
                                                <td style={gridCell}>
                                                    <select value={line.company} onChange={e => handleCellChange(line.id, "company", e.target.value)} style={{ ...gridInput, width: "95px" }} onClick={e => e.stopPropagation()}>
                                                        <option value="">--</option>
                                                        {companies.map((c, i) => <option key={i} value={c.company}>{c.company}</option>)}
                                                    </select>
                                                </td>
                                                <td style={gridCell}>
                                                    <select value={line.line_type} onChange={e => handleCellChange(line.id, "line_type", e.target.value)} style={{ ...gridInput, width: "105px" }} onClick={e => e.stopPropagation()}>
                                                        <option value="">--</option>
                                                        {lineTypes.map((lt, i) => <option key={i} value={lt.type}>{lt.type}</option>)}
                                                    </select>
                                                </td>
                                                <td style={{ ...gridCell, position: "relative" }}>
                                                    {line.line_type.toUpperCase().includes("NON") ? (
                                                        <input value="N/A" readOnly style={{ ...gridInput, width: "195px", backgroundColor: "#e0e0e0", color: "#999", cursor: "not-allowed", borderRadius: "3px" }} />
                                                    ) : (
                                                        <div style={{ position: "relative", width: "195px" }}>
                                                            <input
                                                                value={line._stockSearch !== undefined ? line._stockSearch : (line.stock_code || "")}
                                                                onChange={e => { const val = e.target.value; handleCellChange(line.id, "_stockSearch", val); handleCellChange(line.id, "_stockDropdownOpen", true); if (!val.trim()) handleStockCodeChange(line.id, ""); }}
                                                                onFocus={e => { handleCellChange(line.id, "_stockSearch", e.target.value || line.stock_code || ""); handleCellChange(line.id, "_stockDropdownOpen", true); }}
                                                                onBlur={() => { setTimeout(() => handleCellChange(line.id, "_stockDropdownOpen", false), 200); }}
                                                                placeholder="🔍 Search stock…"
                                                                style={{ ...gridInput, width: "195px" }}
                                                                onClick={e => e.stopPropagation()}
                                                            />
                                                            {line._stockDropdownOpen && (() => {
                                                                const searchVal = (line._stockSearch !== undefined ? line._stockSearch : "").toLowerCase();
                                                                const filtered = inventoryItems.filter(item =>
                                                                    item.item_code.trim().toLowerCase().includes(searchVal) ||
                                                                    item.description.trim().toLowerCase().includes(searchVal)
                                                                ).slice(0, 50);
                                                                return filtered.length > 0 ? (
                                                                    <div style={{ position: "absolute", top: "100%", left: 0, width: "320px", maxHeight: "180px", overflowY: "auto", backgroundColor: "white", border: "1px solid #ccc", borderRadius: "4px", zIndex: 9999, boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}>
                                                                        {filtered.map((item, i) => (
                                                                            <div key={i}
                                                                                onMouseDown={e => { e.preventDefault(); handleStockCodeChange(line.id, item.item_code.trim()); handleCellChange(line.id, "_stockSearch", item.item_code.trim()); handleCellChange(line.id, "_stockDropdownOpen", false); }}
                                                                                style={{ padding: "6px 10px", cursor: "pointer", fontSize: "11px", borderBottom: "1px solid #f0f0f0" }}
                                                                                onMouseEnter={e => e.currentTarget.style.backgroundColor = "#e8f0fe"}
                                                                                onMouseLeave={e => e.currentTarget.style.backgroundColor = "white"}>
                                                                                <strong>{item.item_code.trim()}</strong> — {item.description.trim()}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                ) : null;
                                                            })()}
                                                        </div>
                                                    )}
                                                </td>
                                                <td style={gridCell}><input value={line.description} onChange={e => handleCellChange(line.id, "description", e.target.value)} style={{ ...gridInput, width: "190px", backgroundColor: line.stock_code ? "#f0fff0" : "transparent" }} onClick={e => e.stopPropagation()} /></td>
                                                <td style={gridCell}>
                                                    <select value={line.order_unit} onChange={e => handleCellChange(line.id, "order_unit", e.target.value)} style={{ ...gridInput, width: "70px" }} onClick={e => e.stopPropagation()}>
                                                        <option value="">--</option>
                                                        {uomList.map((u, i) => <option key={i} value={u.uom}>{u.uom}</option>)}
                                                    </select>
                                                </td>
                                                <td style={gridCell}><input type="number" value={line.qty} onChange={e => handleCellChange(line.id, "qty", e.target.value)} style={{ ...gridInput, width: "55px" }} onClick={e => e.stopPropagation()} /></td>
                                                <td style={gridCell}><input type="number" value={line.unit_price} onChange={e => handleCellChange(line.id, "unit_price", e.target.value)} style={{ ...gridInput, width: "80px" }} onClick={e => e.stopPropagation()} /></td>
                                                <td style={gridCell}><input value={line.total_price || ""} readOnly style={{ ...gridInput, width: "80px", color: "#155724", fontWeight: "600", backgroundColor: "#f0fff0" }} /></td>
                                                <td style={gridCell}><input type="date" value={line.due_date} onChange={e => handleCellChange(line.id, "due_date", e.target.value)} style={{ ...gridInput, width: "115px" }} onClick={e => e.stopPropagation()} /></td>
                                                <td style={gridCell}><textarea value={line.reqn_reason_notes} onChange={e => handleCellChange(line.id, "reqn_reason_notes", e.target.value)} style={{ ...gridInput, width: "190px", minHeight: "50px", resize: "vertical", fontFamily: "inherit", fontSize: "12px" }} onClick={e => e.stopPropagation()} /></td>
                                                <td style={gridCell}><textarea value={line.line_notes} onChange={e => handleCellChange(line.id, "line_notes", e.target.value)} style={{ ...gridInput, width: "190px", minHeight: "50px", resize: "vertical", fontFamily: "inherit", fontSize: "12px" }} onClick={e => e.stopPropagation()} /></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        {/* Attachments list */}
                        {attachments.length > 0 && (
                            <div style={{ borderTop: "1px solid #ddd", padding: "8px 15px", backgroundColor: "#fffef5", maxHeight: "120px", overflowY: "auto" }}>
                                <div style={{ fontSize: "12px", fontWeight: "600", marginBottom: "6px", color: "#333" }}>📎 Attachments ({attachments.length})</div>
                                {attachments.map((file, idx) => (
                                    <div key={idx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", fontSize: "11px", padding: "2px 0" }}>
                                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>📄 {file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
                                        <button type="button" onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))} style={{ background: "none", border: "none", color: "#dc3545", cursor: "pointer", fontSize: "13px", padding: "0 4px" }} title="Remove">✕</button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div style={{ borderTop: "1px solid #ddd", padding: "4px 15px", fontSize: "11px", color: "#666", backgroundColor: "#f8f9fa", display: "flex", gap: "15px" }}>
                            <span>Lines: {lines.length}</span><span>|</span>
                            <span>Job: {jobNo || "—"}</span><span>|</span>
                            <span>User: {firstName} {lastName}</span><span>|</span>
                            <span>Role: {role}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* ══════ Job No Modal ══════ */}
            {showJobNoModal && (
                <div style={{ ...styles.modalOverlay, zIndex: 3000 }}>
                    <div style={{ backgroundColor: "white", borderRadius: "8px", width: "480px", maxHeight: "75vh", display: "flex", flexDirection: "column", boxShadow: "0 8px 32px rgba(0,0,0,0.3)" }}>
                        <div style={{ backgroundColor: "#007bff", color: "white", padding: "12px 20px", borderRadius: "8px 8px 0 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <h3 style={{ margin: 0, fontSize: "15px" }}>📋 Select Job Number</h3>
                            <button onClick={() => setShowJobNoModal(false)} style={{ background: "none", border: "none", color: "white", fontSize: "18px", cursor: "pointer" }}>✕</button>
                        </div>
                        <div style={{ padding: "12px 15px", borderBottom: "1px solid #ddd" }}>
                            <input value={jobNoSearch} onChange={e => setJobNoSearch(e.target.value)} placeholder="🔍 Search…" autoFocus style={{ width: "100%", padding: "8px 10px", border: "1px solid #ccc", borderRadius: "4px", fontSize: "13px", boxSizing: "border-box" }} />
                        </div>
                        <div style={{ padding: "8px 15px", borderBottom: "1px solid #eee", backgroundColor: "#f8f9fa" }}>
                            <div style={{ display: "flex", gap: "8px" }}>
                                <input value={jobNoSearch} onChange={e => setJobNoSearch(e.target.value)} placeholder="Or type a NEW job number…" style={{ flex: 1, padding: "6px 10px", border: "1px solid #ccc", borderRadius: "4px", fontSize: "12px" }} />
                                <button onClick={() => { if (jobNoSearch.trim()) handleSelectJobNo(jobNoSearch.trim()); else toast("Please enter a job number.", "error"); }}
                                    style={{ padding: "6px 14px", backgroundColor: "#28a745", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "12px", fontWeight: "600" }}>✔ Use</button>
                            </div>
                        </div>
                        <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
                            {loadingJobNos ? <div style={{ textAlign: "center", padding: "20px", color: "#666" }}>Loading…</div>
                                : filteredJobNumbers.length > 0 ? filteredJobNumbers.map((j, i) => (
                                    <div key={i} onClick={() => handleSelectJobNo(j.job_no)}
                                        style={{ padding: "10px 20px", cursor: "pointer", borderBottom: "1px solid #f0f0f0", fontSize: "13px" }}
                                        onMouseEnter={e => e.currentTarget.style.backgroundColor = "#e8f0fe"}
                                        onMouseLeave={e => e.currentTarget.style.backgroundColor = "white"}>
                                        📁 {j.job_no}
                                    </div>
                                )) : <div style={{ textAlign: "center", padding: "20px", color: "#999" }}>No job numbers found</div>}
                        </div>
                        <div style={{ padding: "10px 15px", borderTop: "1px solid #ddd", display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#666" }}>
                            <span>{filteredJobNumbers.length} found</span>
                            <button onClick={() => setShowJobNoModal(false)} style={{ padding: "6px 15px", backgroundColor: "#6c757d", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "12px" }}>Close</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ══════ Supplier Modal ══════ */}
            {showSupplierModal && (
                <div style={{ ...styles.modalOverlay, zIndex: 3000 }}>
                    <div style={{ backgroundColor: "white", borderRadius: "8px", width: "520px", maxHeight: "75vh", display: "flex", flexDirection: "column", boxShadow: "0 8px 32px rgba(0,0,0,0.3)" }}>
                        <div style={{ backgroundColor: "#6610f2", color: "white", padding: "12px 20px", borderRadius: "8px 8px 0 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <h3 style={{ margin: 0, fontSize: "15px" }}>📦 Select Supplier</h3>
                            <button onClick={() => { setShowSupplierModal(false); setSupplierTargetGroup(null); }} style={{ background: "none", border: "none", color: "white", fontSize: "18px", cursor: "pointer" }}>✕</button>
                        </div>
                        <div style={{ padding: "12px 15px", borderBottom: "1px solid #ddd" }}>
                            <input value={supplierSearch} onChange={e => setSupplierSearch(e.target.value)} placeholder="🔍 Search by code or name…" autoFocus style={{ width: "100%", padding: "8px 10px", border: "1px solid #ccc", borderRadius: "4px", fontSize: "13px", boxSizing: "border-box" }} />
                        </div>
                        <div style={{ flex: 1, overflowY: "auto" }}>
                            {loadingSuppliers ? <div style={{ textAlign: "center", padding: "30px" }}>Loading…</div>
                                : filteredSuppliers.length > 0 ? (
                                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                                        <thead style={{ position: "sticky", top: 0, backgroundColor: "#f8f9fa" }}>
                                            <tr>
                                                <th style={{ padding: "8px 15px", textAlign: "left", borderBottom: "1px solid #ddd", fontWeight: "600" }}>Code</th>
                                                <th style={{ padding: "8px 15px", textAlign: "left", borderBottom: "1px solid #ddd", fontWeight: "600" }}>Supplier Name</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredSuppliers.map((s, i) => (
                                                <tr key={i} onClick={() => handleSelectSupplier(s.code, s.name)}
                                                    style={{ cursor: "pointer", borderBottom: "1px solid #f0f0f0" }}
                                                    onMouseEnter={e => e.currentTarget.style.backgroundColor = "#e8f0fe"}
                                                    onMouseLeave={e => e.currentTarget.style.backgroundColor = "white"}>
                                                    <td style={{ padding: "9px 15px", fontWeight: "600", color: "#6610f2" }}>{s.code}</td>
                                                    <td style={{ padding: "9px 15px" }}>{s.name}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : <div style={{ textAlign: "center", padding: "30px", color: "#999" }}>No suppliers found</div>}
                        </div>
                        <div style={{ padding: "10px 15px", borderTop: "1px solid #ddd", display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#666" }}>
                            <span>{filteredSuppliers.length} found</span>
                            <button onClick={() => { setShowSupplierModal(false); setSupplierTargetGroup(null); }} style={{ padding: "6px 15px", backgroundColor: "#6c757d", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "12px" }}>Close</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ══════ Approve1 Modal ══════ */}
            {showApprove1RouteModal && (
                <div style={styles.modalOverlay}>
                    <div style={{ background: "white", borderRadius: "10px", width: "420px", overflow: "hidden", boxShadow: "0 8px 32px rgba(0,0,0,0.3)" }}>
                        <div style={{ backgroundColor: "#155724", color: "white", padding: "15px 20px", display: "flex", justifyContent: "space-between" }}>
                            <h3 style={{ margin: 0, fontSize: "16px" }}>✅ Approve — Route to Approver 2</h3>
                            <button onClick={() => { setShowApprove1RouteModal(false); setSelectedManager(""); }} style={{ background: "none", border: "none", color: "white", fontSize: "20px", cursor: "pointer" }}>✕</button>
                        </div>
                        <div style={{ padding: "25px" }}>
                            <div style={{ backgroundColor: "#c3e6cb", border: "1px solid #155724", borderRadius: "6px", padding: "12px 15px", marginBottom: "20px", fontSize: "13px", lineHeight: "1.7" }}>
                                <div><strong>REQ #:</strong> {selectedGroup}</div>
                                <div><strong>Lines:</strong> {selectedGroupLines.length}</div>
                                <div><strong>Descriptions:</strong> {selectedGroupLines.map(l => l.description).filter(Boolean).join(" | ") || "—"}</div>
                                {selectedLine?.supplier && (
                                    <div style={{ marginTop: "6px", padding: "6px 10px", backgroundColor: "#fff", border: "1px solid #155724", borderRadius: "4px" }}>
                                        <strong>📦 Supplier:</strong> <span style={{ color: "#6610f2", fontWeight: "700" }}>{selectedLine.supplier}</span> — {selectedLine.supplier_name}
                                    </div>
                                )}
                                <div><strong>Approving as:</strong> {username}</div>
                            </div>
                            <label style={styles.label}>Select Approver 2:</label>
                            <select value={selectedManager} onChange={e => setSelectedManager(e.target.value)}
                                style={{ width: "100%", padding: "10px", marginBottom: "20px", borderRadius: "5px", border: "1px solid #ccc", fontSize: "13px", boxSizing: "border-box" }}>
                                <option value="">-- Select Approver 2 --</option>
                                {managers.map((m, i) => <option key={i} value={m.username}>{m.first_name} {m.last_name} ({m.username})</option>)}
                            </select>
                            <div style={{ display: "flex", gap: "10px" }}>
                                <button onClick={() => { setShowApprove1RouteModal(false); setSelectedManager(""); }} style={{ ...styles.whiteButton, flex: 1 }}>Cancel</button>
                                <button onClick={handleConfirmApprove1Route} disabled={!selectedManager}
                                    style={{ flex: 2, padding: "10px", backgroundColor: selectedManager ? "#155724" : "#aaa", color: "white", border: "none", borderRadius: "4px", cursor: selectedManager ? "pointer" : "not-allowed", fontWeight: "600", fontSize: "13px" }}>
                                    ✅ Confirm
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ══════ Approve2 Modal ══════ */}
            {showApprove2RouteModal && (
                <div style={styles.modalOverlay}>
                    <div style={{ background: "white", borderRadius: "10px", width: "420px", overflow: "hidden", boxShadow: "0 8px 32px rgba(0,0,0,0.3)" }}>
                        <div style={{ backgroundColor: "#ff69b4", color: "white", padding: "15px 20px", display: "flex", justifyContent: "space-between" }}>
                            <h3 style={{ margin: 0, fontSize: "16px" }}>🌸 Final Approval → PO Created</h3>
                            <button onClick={() => { setShowApprove2RouteModal(false); setSelectedAdmin(""); }} style={{ background: "none", border: "none", color: "white", fontSize: "20px", cursor: "pointer" }}>✕</button>
                        </div>
                        <div style={{ padding: "25px" }}>
                            <div style={{ backgroundColor: "#ffe4f0", border: "1px solid #ff69b4", borderRadius: "6px", padding: "12px 15px", marginBottom: "20px", fontSize: "13px", lineHeight: "1.7" }}>
                                <div><strong>REQ #:</strong> {selectedGroup}</div>
                                <div><strong>Lines:</strong> {selectedGroupLines.length}</div>
                                {selectedLine?.supplier && (
                                    <div style={{ marginTop: "6px", padding: "6px 10px", backgroundColor: "#fff", border: "1px solid #ff69b4", borderRadius: "4px" }}>
                                        <strong>📦 Supplier:</strong> <span style={{ color: "#6610f2", fontWeight: "700" }}>{selectedLine.supplier}</span> — {selectedLine.supplier_name}
                                    </div>
                                )}
                                <div><strong>Approving as:</strong> {username}</div>
                            </div>
                            <label style={styles.label}>Route to Admin:</label>
                            <select value={selectedAdmin} onChange={e => setSelectedAdmin(e.target.value)}
                                style={{ width: "100%", padding: "10px", marginBottom: "20px", borderRadius: "5px", border: "1px solid #ff69b4", fontSize: "13px", boxSizing: "border-box", cursor: "pointer" }}>
                                <option value="">-- Select Admin --</option>
                                {admins.map((a, i) => <option key={i} value={a.username}>{a.first_name} {a.last_name} ({a.username})</option>)}
                            </select>
                            <div style={{ display: "flex", gap: "10px" }}>
                                <button onClick={() => { setShowApprove2RouteModal(false); setSelectedAdmin(""); }} style={{ ...styles.whiteButton, flex: 1 }}>Cancel</button>
                                <button onClick={handleConfirmApprove2Route} disabled={!selectedAdmin}
                                    style={{ flex: 2, padding: "10px", backgroundColor: selectedAdmin ? "#ff69b4" : "#aaa", color: "white", border: "none", borderRadius: "4px", cursor: selectedAdmin ? "pointer" : "not-allowed", fontWeight: "600", fontSize: "13px" }}>
                                    🌸 Confirm PO Created
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ══════ Decline Modal ══════ */}
            {showDeclineModal && (
                <div style={styles.modalOverlay}>
                    <div style={styles.declineModalContent}>
                        <h3 style={{ marginBottom: "10px", color: "#dc3545" }}>Decline Requisition</h3>
                        <p style={{ fontSize: "13px", color: "#555", marginBottom: "15px" }}>
                            Declining: <strong>REQ #{selectedGroup}</strong> ({selectedGroupLines.length} line{selectedGroupLines.length !== 1 ? "s" : ""})
                        </p>
                        <label style={styles.label}>Reason for Declining</label>
                        <textarea value={declineReason} onChange={e => setDeclineReason(e.target.value)} placeholder="Enter reason…" style={styles.textArea} />
                        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "15px" }}>
                            <button onClick={() => { setShowDeclineModal(false); setDeclineReason(""); }} style={styles.whiteButton}>Cancel</button>
                            <button onClick={handleConfirmDecline} style={btn("#dc3545")}>Confirm Decline</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ══════ Route To Modal ══════ */}
            {showRouteModal && (
                <div style={styles.modalOverlay}>
                    <div style={{ background: "white", padding: "30px", borderRadius: "10px", width: "400px", boxShadow: "0 4px 8px rgba(0,0,0,0.2)" }}>
                        <h3 style={{ marginBottom: "10px", color: "#ff9800" }}>Route To {getRouteToTitle()}</h3>
                        <p style={{ marginBottom: "20px", fontSize: "13px", color: "#555" }}>
                            Routing: <strong>REQ #{selectedGroup}</strong> ({selectedGroupLines.length} line{selectedGroupLines.length !== 1 ? "s" : ""})
                        </p>
                        <label style={styles.label}>Select {getRouteToTitle()}</label>
                        <select value={selectedManager} onChange={e => setSelectedManager(e.target.value)} style={styles.select}>
                            <option value="">-- Select --</option>
                            {managers.map((m, i) => <option key={i} value={m.username}>{m.first_name} {m.last_name} ({m.username})</option>)}
                        </select>
                        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "20px" }}>
                            <button onClick={() => { setShowRouteModal(false); setSelectedManager(""); }} style={styles.whiteButton}>Cancel</button>
                            <button onClick={handleConfirmRouteTo} style={btn("#ff9800")}>Confirm Route To</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Footer ── */}
            <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, backgroundColor: "#f8f9fa", borderTop: "1px solid #ccc", padding: "4px 15px", fontSize: "12px", color: "#444", display: "flex", gap: "15px", alignItems: "center" }}>
                <span>SLI - V0.0.2</span><span>|</span>
                <span>Logged in as {firstName} {lastName} on {new Date().toLocaleDateString("en-ZA")}</span><span>|</span>
                <span>Role - {role}</span>
            </div>
        </div>
    );
};

export default Requisitions;