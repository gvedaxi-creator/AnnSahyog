import { useEffect, useState } from "react";
import {
  Search,
  X,
  Utensils,
  ArrowRight,
} from "lucide-react";
import StatusBadge from "../../components/StatusBadge";
import BackButton from "../../components/BackButton";
import Footer from "../../components/Footer";
import { Link } from "react-router-dom";
import AdminSidebar from "../../components/AdminSidebar";
import {
  getAdminDonations,
  updateAdminDonationStatus,
} from "../../services/api";

function AdminDonations() {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const fetchDonations = async () => {
    try {
      setLoading(true);
      const data = await getAdminDonations();
      setDonations(data.donations || []);
    } catch (err) {
      console.error("Fetch donations error:", err);
      setError(err.message || "Failed to load donations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonations();
  }, []);

  const handleStatusChange = async (donationId, newStatus) => {
    if (!window.confirm(`Update donation #${donationId} status to ${newStatus}?`)) {
      return;
    }

    try {
      setActionLoadingId(donationId);
      setError("");
      setSuccessMsg("");
      await updateAdminDonationStatus(donationId, newStatus);

      setSuccessMsg(`Donation #${donationId} updated to ${newStatus}.`);
      setDonations((prev) =>
        prev.map((d) =>
          d.donation_id === donationId ? { ...d, status: newStatus } : d
        )
      );
    } catch (err) {
      console.error("Donation status change error:", err);
      setError(err.message || "Failed to update donation status.");
    } finally {
      setActionLoadingId(null);
    }
  };


  const filteredDonations = donations.filter((d) => {
    const matchesStatus =
      statusFilter === "ALL" || d.status === statusFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      d.food_type?.toLowerCase().includes(q) ||
      d.donor_name?.toLowerCase().includes(q) ||
      d.city?.toLowerCase().includes(q) ||
      d.pickup_address?.toLowerCase().includes(q) ||
      String(d.donation_id).includes(q);

    return matchesStatus && matchesSearch;
  });

  const availableCount = donations.filter((d) => d.status === "AVAILABLE").length;
  const inProgressCount = donations.filter((d) =>
    ["REQUESTED", "ACCEPTED", "PICKED_UP"].includes(d.status)
  ).length;
  const deliveredCount = donations.filter((d) =>
    ["DELIVERED", "COMPLETED"].includes(d.status)
  ).length;

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
                  FOOD RECOVERY
                </span>
                <h1>All Donations</h1>
                <p>
                  Comprehensive log and status management of all food rescue listings
                  across donors.
                </p>
              </div>

              <div className="admin-stat-pills">
                <span className="pill-badge pill-total">
                  Total: {donations.length}
                </span>
                <span className="pill-badge pill-active">
                  Available: {availableCount}
                </span>
                <span className="pill-badge pill-pending">
                  In Transit: {inProgressCount}
                </span>
                <span className="pill-badge pill-completed">
                  Delivered: {deliveredCount}
                </span>
              </div>
            </div>

            {/* Notifications */}
            {error && <div className="form-error">{error}</div>}
            {successMsg && <div className="form-success">{successMsg}</div>}

            {/* Toolbar */}
            <div className="admin-toolbar">
              <div className="admin-search-wrap">
                <Search size={16} className="search-icon" aria-hidden="true" />
                <input
                  type="text"
                  placeholder="Search by food, donor, city, or ID..."
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
                    <option value="AVAILABLE">Available</option>
                    <option value="REQUESTED">Requested</option>
                    <option value="ACCEPTED">Accepted</option>
                    <option value="PICKED_UP">Picked Up</option>
                    <option value="DELIVERED">Delivered</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="admin-card-section">
              {loading ? (
                <div className="admin-loading-state">
                  <p>Loading donations log...</p>
                </div>
              ) : filteredDonations.length === 0 ? (
                <div className="admin-empty-state">
                  <div className="empty-icon"><Utensils size={26} /></div>
                  <h3>No donations match your query</h3>
                  <p>Try refining your search terms or filter selection.</p>
                </div>
              ) : (
                <div className="admin-table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Donation</th>
                        <th>Donor</th>
                        <th>Quantity</th>
                        <th>City / Address</th>
                        <th>Expiry</th>
                        <th>Status</th>
                        <th>Moderate Status</th>
                        <th>Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDonations.map((d) => {
                        const isActionLoading =
                          actionLoadingId === d.donation_id;

                        return (
                          <tr key={d.donation_id}>
                            <td>
                              <strong>{d.food_type}</strong>
                              <span className="table-sub">
                                #{d.donation_id} •{" "}
                                {new Date(d.created_at).toLocaleDateString()}
                              </span>
                            </td>
                            <td>
                              <div>{d.donor_name}</div>
                              <span className="table-sub">{d.donor_email}</span>
                            </td>
                            <td>
                              <strong>
                                {d.quantity} {d.unit}
                              </strong>
                            </td>
                            <td>
                              <div>{d.city || "—"}</div>
                              <span className="table-sub table-address">
                                {d.pickup_address || "—"}
                              </span>
                            </td>
                            <td className="table-date">
                              {d.expiry_date
                                ? new Date(d.expiry_date).toLocaleDateString()
                                : "—"}
                            </td>
                            <td>
                              <StatusBadge status={d.status} />
                            </td>
                            <td>
                              <select
                                value={d.status}
                                onChange={(e) =>
                                  handleStatusChange(
                                    d.donation_id,
                                    e.target.value
                                  )
                                }
                                disabled={isActionLoading}
                                className="admin-status-dropdown"
                                aria-label={`Change status for donation #${d.donation_id}`}
                              >
                                <option value="AVAILABLE">Available</option>
                                <option value="REQUESTED">Requested</option>
                                <option value="ACCEPTED">Accepted</option>
                                <option value="PICKED_UP">Picked Up</option>
                                <option value="DELIVERED">Delivered</option>
                                <option value="CANCELLED">Cancelled</option>
                              </select>
                            </td>
                            <td>
                              <Link
                                to={`/admin/donations/${d.donation_id}`}
                                className="table-action-link"
                              >
                                View <ArrowRight size={14} />
                              </Link>
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

export default AdminDonations;
