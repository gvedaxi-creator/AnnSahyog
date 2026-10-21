import { useEffect, useState } from "react";
import StatusBadge from "../../components/StatusBadge";
import BackButton from "../../components/BackButton";
import Footer from "../../components/Footer";
import { Link } from "react-router-dom";
import NgoSidebar from "../../components/NgoSidebar";
import { getNgoRequests, cancelDonationRequest } from "../../services/api";
import {
  ClipboardList,
  Search,
  X,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

function NgoRequests() {
  const user = JSON.parse(localStorage.getItem("user") || "null");

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const fetchRequestsList = async () => {
    if (!user?.ngo_id) return;
    try {
      setLoading(true);
      const data = await getNgoRequests(user.ngo_id);
      setRequests(data.requests || []);
    } catch (err) {
      console.error("Fetch NGO requests error:", err);
      setError(err.message || "Failed to load requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequestsList();
  }, [user?.ngo_id]);

  const handleCancelRequest = async (requestId) => {
    if (!window.confirm("Are you sure you want to cancel this food request?")) {
      return;
    }

    try {
      setActionLoadingId(requestId);
      setError("");
      setSuccessMsg("");

      await cancelDonationRequest(requestId, user.ngo_id);
      setSuccessMsg("Food request successfully cancelled.");
      setRequests((prev) =>
        prev.map((r) =>
          r.request_id === requestId
            ? { ...r, request_status: "CANCELLED" }
            : r
        )
      );
    } catch (err) {
      console.error("Cancel request error:", err);
      setError(err.message || "Failed to cancel request.");
    } finally {
      setActionLoadingId(null);
    }
  };


  const filteredRequests = requests.filter((r) => {
    const matchesStatus =
      statusFilter === "ALL" || r.request_status === statusFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      r.food_type?.toLowerCase().includes(q) ||
      r.donor_name?.toLowerCase().includes(q) ||
      r.city?.toLowerCase().includes(q);

    return matchesStatus && matchesSearch;
  });

  const pendingCount = requests.filter((r) => r.request_status === "PENDING").length;
  const approvedCount = requests.filter((r) => r.request_status === "APPROVED").length;

  return (
    <div className="donor-layout ngo-layout">
      <NgoSidebar />

      <main className="donor-main ngo-main">
        <div className="dashboard-page ngo-dashboard-page">
          <div className="container">
            <div className="page-back-bar">
              <BackButton />
            </div>

            {/* Header */}
            <div className="dashboard-header ngo-header">
              <div>
                <span className="dashboard-eyebrow ngo-eyebrow">
                  CLAIM PIPELINE
                </span>
                <h1>My Food Requests</h1>
                <p>
                  Track donor decisions, volunteer dispatch status, and fulfillment of your claimed food batches.
                </p>
              </div>

              <div className="admin-stat-pills">
                <span className="pill-badge pill-total">Total: {requests.length}</span>
                <span className="pill-badge pill-pending">Pending: {pendingCount}</span>
                <span className="pill-badge pill-active">Approved: {approvedCount}</span>
              </div>
            </div>

            {error && (
              <div className="auth-alert alert-error" style={{ marginBottom: "1.25rem" }}>
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}
            {successMsg && (
              <div className="auth-alert alert-success" style={{ marginBottom: "1.25rem" }}>
                <CheckCircle2 size={18} />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Toolbar */}
            <div className="admin-toolbar">
              <div className="admin-search-wrap">
                <Search size={16} className="search-icon" />
                <input
                  type="text"
                  placeholder="Search by food name, donor, city..."
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
                    <option value="ALL">All Statuses ({requests.length})</option>
                    <option value="PENDING">Pending Review ({pendingCount})</option>
                    <option value="APPROVED">Approved ({approvedCount})</option>
                    <option value="REJECTED">Rejected</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Content Table / Cards */}
            {loading ? (
              <div className="dashboard-empty-card">
                <div className="food-spinner"></div>
                <p>Loading your food requests...</p>
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="dashboard-empty-card">
                <div className="empty-icon-wrap">
                  <ClipboardList size={36} />
                </div>
                <h3>No requests found</h3>
                <p>
                  {searchQuery || statusFilter !== "ALL"
                    ? "Try adjusting your search query or status filter."
                    : "You haven't made any food requests yet."}
                </p>
                <Link to="/ngo/donations" className="btn btn-primary btn-sm">
                  Browse Available Food →
                </Link>
              </div>
            ) : (
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Request ID</th>
                      <th>Food Item</th>
                      <th>Quantity Claimed</th>
                      <th>Donor Information</th>
                      <th>Requested Date</th>
                      <th>Decision Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRequests.map((req) => (
                      <tr key={req.request_id}>
                        <td className="table-mono">#{req.request_id}</td>
                        <td>
                          <strong>{req.food_type}</strong>
                          <span className="table-sub">{req.city || "Ahmedabad"}</span>
                        </td>
                        <td>
                          <strong>
                            {req.requested_quantity} {req.unit || "units"}
                          </strong>
                        </td>
                        <td>
                          <strong>{req.donor_name || "Food Donor"}</strong>
                          {req.donor_phone && (
                            <span className="table-sub">{req.donor_phone}</span>
                          )}
                        </td>
                        <td className="table-date">
                          {new Date(req.requested_at || req.created_at).toLocaleDateString([], {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td>
                          <StatusBadge status={req.request_status} />
                        </td>
                        <td>
                          <div className="table-actions-group">
                            {req.request_status === "PENDING" && (
                              <button
                                type="button"
                                className="btn btn-xs btn-danger"
                                onClick={() => handleCancelRequest(req.request_id)}
                                disabled={actionLoadingId === req.request_id}
                              >
                                Cancel
                              </button>
                            )}

                            {req.request_status === "APPROVED" && (
                              <Link
                                to="/ngo/deliveries"
                                className="table-action-link"
                              >
                                View Delivery →
                              </Link>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
        <Footer variant="app" />
      </main>
    </div>
  );
}

export default NgoRequests;
