import { useEffect, useState } from "react";
import {
  Search,
  X,
  Building2,
} from "lucide-react";
import StatusBadge from "../../components/StatusBadge";
import BackButton from "../../components/BackButton";
import Footer from "../../components/Footer";
import AdminSidebar from "../../components/AdminSidebar";
import { getAdminNgos, verifyAdminNgo } from "../../services/api";

// Actions offered for each NGO status (mirrors the backend rules)
const NGO_ACTIONS = {
  PENDING: [
    { label: "Accept", status: "ACTIVE" },
    { label: "Reject", status: "REJECTED" },
  ],
  ACTIVE: [{ label: "Deactive", status: "DEACTIVE" }],
  DEACTIVE: [{ label: "Active", status: "ACTIVE" }],
  REJECTED: [
    { label: "Accept", status: "ACTIVE" },
    { label: "Reject", status: "REJECTED" },
  ],
};

const STATUS_LABELS = {
  PENDING: "Pending",
  ACTIVE: "Active",
  DEACTIVE: "Deactive",
  REJECTED: "Rejected",
};

function AdminNgos() {
  const [ngos, setNgos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  // Green for Active, red for Deactive / Rejected
  const [successTone, setSuccessTone] = useState("success");

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Load NGOs once on mount (`loading` already starts as true)
  useEffect(() => {
    getAdminNgos()
      .then((data) => setNgos(data.ngos || []))
      .catch((err) => {
        console.error("Fetch NGOs error:", err);
        setError(err.message || "Failed to load NGOs.");
      })
      .finally(() => setLoading(false));
  }, []);

  // Success / error banners disappear after 5 seconds
  useEffect(() => {
    if (!successMsg && !error) return undefined;
    const timer = setTimeout(() => {
      setSuccessMsg("");
      setError("");
    }, 5000);
    return () => clearTimeout(timer);
  }, [successMsg, error]);

  const handleStatusAction = async (ngo, action) => {
    const confirmMsg = `${action.label} "${ngo.organization_name}"? Its status will be ${STATUS_LABELS[action.status]}.`;

    if (!window.confirm(confirmMsg)) return;

    try {
      setActionLoadingId(ngo.ngo_id);
      setError("");
      setSuccessMsg("");

      await verifyAdminNgo(ngo.ngo_id, action.status);

      setSuccessTone(action.status === "ACTIVE" ? "success" : "error");
      setSuccessMsg(
        `NGO "${ngo.organization_name}" is now ${STATUS_LABELS[action.status]}.`
      );
      setNgos((prev) =>
        prev.map((n) =>
          n.ngo_id === ngo.ngo_id
            ? { ...n, verification_status: action.status }
            : n
        )
      );
    } catch (err) {
      console.error("NGO status update error:", err);
      setError(err.message || "Failed to update NGO status.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredNgos = ngos.filter((n) => {
    const matchesStatus =
      statusFilter === "ALL" || (n.verification_status || "PENDING") === statusFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      n.organization_name?.toLowerCase().includes(q) ||
      n.registration_number?.toLowerCase().includes(q) ||
      n.name?.toLowerCase().includes(q) ||
      n.email?.toLowerCase().includes(q) ||
      n.city?.toLowerCase().includes(q);

    return matchesStatus && matchesSearch;
  });

  const countByStatus = (status) =>
    ngos.filter((n) => (n.verification_status || "PENDING") === status).length;

  return (
    <div className="donor-layout admin-layout">
      <AdminSidebar />

      <main className="donor-main admin-main">
        <div className="dashboard-page admin-dashboard-page">
          <div className="container">
            <div className="page-back-bar">
              <BackButton />
            </div>

            {/* Header */}
            <div className="dashboard-header admin-header">
              <div>
                <span className="dashboard-eyebrow admin-eyebrow">
                  PARTNER VERIFICATION
                </span>
                <h1>NGO Verifications</h1>
                <p>
                  Review and verify registered NGOs and receiving organizations
                  before they claim surplus food.
                </p>
              </div>

              <div className="admin-stat-pills">
                <span className="pill-badge pill-total">Total: {ngos.length}</span>
                <span className="pill-badge pill-pending">
                  Pending: {countByStatus("PENDING")}
                </span>
                <span className="pill-badge pill-active">
                  Active: {countByStatus("ACTIVE")}
                </span>
                <span className="pill-badge pill-deactive">
                  Deactive: {countByStatus("DEACTIVE")}
                </span>
                <span className="pill-badge pill-inactive">
                  Rejected: {countByStatus("REJECTED")}
                </span>
              </div>
            </div>

            {/* Notifications */}
            {error && <div className="form-error">{error}</div>}
            {successMsg && (
              <div className={successTone === "success" ? "form-success" : "form-error"}>
                {successMsg}
              </div>
            )}

            {/* Toolbar */}
            <div className="admin-toolbar">
              <div className="admin-search-wrap">
                <Search size={16} className="search-icon" aria-hidden="true" />
                <input
                  type="text"
                  placeholder="Search by NGO name, reg no, person, city..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="admin-search-input"
                />
                {searchQuery && (
                  <button
                    type="button"
                    className="clear-search-btn"
                    onClick={() => setSearchQuery("")}
                    aria-label="Clear search"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <div className="admin-filter-group">
                <div className="filter-item">
                  <label>Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="admin-select"
                  >
                    <option value="ALL">All Status</option>
                    <option value="PENDING">Pending</option>
                    <option value="ACTIVE">Active</option>
                    <option value="DEACTIVE">Deactive</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="admin-card-section">
              {loading ? (
                <div className="admin-loading-state">
                  <p>Loading NGO partners...</p>
                </div>
              ) : filteredNgos.length === 0 ? (
                <div className="admin-empty-state">
                  <div className="empty-icon"><Building2 size={26} /></div>
                  <h3>No NGOs found</h3>
                  <p>
                    {searchQuery || statusFilter !== "ALL"
                      ? "Try changing your search keywords or filter."
                      : "No NGOs have registered yet."}
                  </p>
                </div>
              ) : (
                <div className="admin-table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Organization</th>
                        <th>Reg. Number</th>
                        <th>Contact Person</th>
                        <th>Location</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredNgos.map((ngo) => {
                        const isActionLoading = actionLoadingId === ngo.ngo_id;
                        const vStatus = ngo.verification_status || "PENDING";

                        return (
                          <tr key={ngo.ngo_id}>
                            <td>
                              <strong>{ngo.organization_name}</strong>
                              <span className="table-sub">
                                User: {ngo.name} (#{ngo.user_id})
                              </span>
                            </td>
                            <td>
                              <span className="table-mono">
                                {ngo.registration_number || "Not provided"}
                              </span>
                            </td>
                            <td>
                              <div>{ngo.name}</div>
                              <span className="table-sub">
                                {ngo.email} • {ngo.phone || "—"}
                              </span>
                            </td>
                            <td>
                              <div>{ngo.city || "—"}</div>
                              <span className="table-sub table-address">
                                {ngo.address || "—"}
                              </span>
                            </td>
                            <td>
                              <StatusBadge status={vStatus} />
                            </td>
                            <td>
                              <select
                                value=""
                                onChange={(e) => {
                                  const action = (NGO_ACTIONS[vStatus] || []).find(
                                    (act) => act.label === e.target.value
                                  );
                                  if (action) handleStatusAction(ngo, action);
                                }}
                                disabled={isActionLoading}
                                className="admin-status-dropdown"
                                aria-label={`Actions for ${ngo.organization_name}`}
                              >
                                <option value="" disabled>
                                  {isActionLoading ? "Saving…" : "Actions"}
                                </option>
                                {(NGO_ACTIONS[vStatus] || []).map((act) => (
                                  <option key={act.label} value={act.label}>
                                    {act.label}
                                  </option>
                                ))}
                              </select>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
        <Footer variant="app" />
      </main>
    </div>
  );
}

export default AdminNgos;
