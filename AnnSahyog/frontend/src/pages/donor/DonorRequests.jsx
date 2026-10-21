import { useEffect, useState } from "react";
import StatusBadge from "../../components/StatusBadge";
import BackButton from "../../components/BackButton";
import Footer from "../../components/Footer";
import { Link } from "react-router-dom";
import DonorSidebar from "../../components/DonorSidebar";
import { getDonorRequests, respondToDonationRequest } from "../../services/api";
import {
  Building2,
  Utensils,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  MessageSquare,
  Phone,
} from "lucide-react";

function DonorRequests() {
  const user = JSON.parse(localStorage.getItem("user") || "null");

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [filterTab, setFilterTab] = useState("ALL");

  useEffect(() => {
    const fetchRequests = async () => {
      if (!user?.donor_id) {
        setError("Donor information is missing. Please login again.");
        setLoading(false);
        return;
      }

      try {
        const data = await getDonorRequests(user.donor_id);
        setRequests(data.requests || []);
      } catch (err) {
        console.error(err);
        setError(err.message || "Failed to load donation requests.");
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [user?.donor_id]);

  const handleRequestResponse = async (requestId, status) => {
    if (!user?.donor_id) {
      setError("Donor information is missing. Please login again.");
      return;
    }

    const action = status === "APPROVED" ? "approve" : "reject";
    const confirmed = window.confirm(
      `Are you sure you want to ${action} this donation request?`
    );

    if (!confirmed) return;

    setActionLoading(requestId);
    setError("");
    setSuccessMessage("");

    try {
      const response = await respondToDonationRequest(
        requestId,
        user.donor_id,
        status
      );

      setRequests((prevRequests) =>
        prevRequests.map((request) =>
          request.request_id === requestId
            ? {
                ...request,
                status,
                responded_at: new Date().toISOString(),
                donation_status:
                  response.donation_status || request.donation_status,
              }
            : request
        )
      );

      if (status === "APPROVED") {
        setSuccessMessage(
          "Donation request approved successfully! Volunteer couriers are now notified for pickup."
        );
      } else {
        setSuccessMessage("Donation request marked as rejected.");
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to update donation request.");
    } finally {
      setActionLoading(null);
    }
  };


  const filteredRequests = requests.filter((r) => {
    if (filterTab === "ALL") return true;
    return r.status === filterTab;
  });

  const pendingCount = requests.filter((r) => r.status === "PENDING").length;

  return (
    <div className="donor-layout">
      <DonorSidebar />

      <main className="donor-main">
        <div className="dashboard-page">
          <div className="container">
            <div className="page-back-bar">
              <BackButton />
            </div>

            {/* Header */}
            <div className="dashboard-header">
              <div>
                <span className="dashboard-eyebrow">COMMUNITY REQUESTS</span>
                <h1>NGO Donation Requests</h1>
                <p>
                  Review portions requested by verified local NGOs and community kitchens.
                </p>
              </div>

              <div className="admin-stat-pills">
                <span className="pill-badge pill-total">Total: {requests.length}</span>
                {pendingCount > 0 && (
                  <span className="pill-badge pill-pending">
                    {pendingCount} Awaiting Review
                  </span>
                )}
              </div>
            </div>

            {/* Notification messages */}
            {error && (
              <div className="auth-alert alert-error" style={{ marginBottom: "1.25rem" }}>
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}
            {successMessage && (
              <div className="auth-alert alert-success" style={{ marginBottom: "1.25rem" }}>
                <CheckCircle2 size={18} />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Filter Tabs */}
            <div className="status-filter-bar">
              <button
                type="button"
                className={`filter-pill ${filterTab === "ALL" ? "active" : ""}`}
                onClick={() => setFilterTab("ALL")}
              >
                All Requests ({requests.length})
              </button>
              <button
                type="button"
                className={`filter-pill ${filterTab === "PENDING" ? "active" : ""}`}
                onClick={() => setFilterTab("PENDING")}
              >
                Pending ({pendingCount})
              </button>
              <button
                type="button"
                className={`filter-pill ${filterTab === "APPROVED" ? "active" : ""}`}
                onClick={() => setFilterTab("APPROVED")}
              >
                Approved ({requests.filter((r) => r.status === "APPROVED").length})
              </button>
            </div>

            {/* Loading */}
            {loading && (
              <div className="dashboard-empty-card">
                <div className="food-spinner"></div>
                <h3>Loading NGO requests...</h3>
                <p>Checking for community claims on your surplus food.</p>
              </div>
            )}

            {/* Empty */}
            {!loading && !error && filteredRequests.length === 0 && (
              <div className="dashboard-empty-card">
                <div className="empty-icon-wrap">
                  <Building2 size={36} />
                </div>
                <h3>No requests in this category</h3>
                <p>
                  {filterTab === "PENDING"
                    ? "You have no pending requests awaiting approval."
                    : "No NGO requests recorded yet. When a shelter claims your food, it will appear here."}
                </p>
                <Link to="/donor/donations" className="btn btn-primary btn-sm">
                  View My Food Listings →
                </Link>
              </div>
            )}

            {/* Request Cards Grid */}
            {!loading && !error && filteredRequests.length > 0 && (
              <div className="request-cards-list">
                {filteredRequests.map((req) => (
                  <article key={req.request_id} className="ngo-request-item-card">
                    <div className="request-card-header">
                      <div className="request-ngo-info">
                        <div className="request-ngo-avatar">
                          <Building2 size={22} />
                        </div>
                        <div>
                          <span className="request-id-badge">REQUEST #{req.request_id}</span>
                          <h3>{req.ngo_name || req.organization_name || "Partner NGO"}</h3>
                          <span className="request-time">
                            <Clock size={12} /> Requested on{" "}
                            {new Date(req.created_at || req.requested_at).toLocaleString([], {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })}
                          </span>
                        </div>
                      </div>

                      <StatusBadge
                        status={req.status}
                        label={req.status === "PENDING" ? "Awaiting Decision" : undefined}
                      />
                    </div>

                    {/* Food Details */}
                    <div className="request-card-body">
                      <div className="request-food-highlight">
                        <div className="food-thumb-icon">
                          <Utensils size={18} />
                        </div>
                        <div>
                          <strong>{req.food_type || "Food Batch"}</strong>
                          <span>
                            Claimed: {req.requested_quantity} {req.unit || "portions"}
                          </span>
                        </div>
                      </div>

                      {req.message && (
                        <div className="request-ngo-note">
                          <MessageSquare size={14} className="note-icon" />
                          <p>"{req.message}"</p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="request-card-footer">
                      <div className="request-footer-info">
                        {req.ngo_phone && (
                          <span className="ngo-contact-hint">
                            <Phone size={13} /> {req.ngo_phone}
                          </span>
                        )}
                      </div>

                      {req.status === "PENDING" && (
                        <div className="request-action-btns">
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm btn-reject"
                            onClick={() => handleRequestResponse(req.request_id, "REJECTED")}
                            disabled={actionLoading === req.request_id}
                          >
                            <XCircle size={15} />
                            <span>Decline</span>
                          </button>

                          <button
                            type="button"
                            className="btn btn-primary btn-sm btn-approve"
                            onClick={() => handleRequestResponse(req.request_id, "APPROVED")}
                            disabled={actionLoading === req.request_id}
                          >
                            <CheckCircle2 size={15} />
                            <span>
                              {actionLoading === req.request_id
                                ? "Approving..."
                                : "Approve Claim"}
                            </span>
                          </button>
                        </div>
                      )}

                      {req.status !== "PENDING" && (
                        <div className="request-decision-stamp">
                          {req.status === "APPROVED" ? (
                            <span className="stamp-approved">
                              <CheckCircle2 size={14} /> Approved · Volunteer Assigned
                            </span>
                          ) : (
                            <span className="stamp-rejected"><XCircle size={14} /> Declined</span>
                          )}
                        </div>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
        <Footer variant="app" />
      </main>
    </div>
  );
}

export default DonorRequests;
