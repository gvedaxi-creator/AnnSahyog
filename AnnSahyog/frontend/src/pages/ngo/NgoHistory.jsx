import { useEffect, useState } from "react";
import BackButton from "../../components/BackButton";
import Footer from "../../components/Footer";
import NgoSidebar from "../../components/NgoSidebar";
import { getNgoRequests } from "../../services/api";
import {
  History,
  Utensils,
  Search,
  X,
  Scale,
  Sparkles,
  AlertCircle,
} from "lucide-react";

const formatDate = (value) => {
  if (!value) return "—";
  const dt = new Date(value);
  if (isNaN(dt)) return "—";
  return dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

function NgoHistory() {
  const user = JSON.parse(localStorage.getItem("user") || "null");

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchHistoryList = async () => {
    if (!user?.ngo_id) return;
    try {
      setLoading(true);
      const data = await getNgoRequests(user.ngo_id);
      // Completed or Delivered items
      const completed = (data.requests || []).filter(
        (r) =>
          r.donation_status === "DELIVERED" ||
          r.donation_status === "COMPLETED" ||
          r.delivery_status === "DELIVERED"
      );
      setHistory(completed);
    } catch (err) {
      console.error("Fetch history error:", err);
      setError(err.message || "Failed to load donation history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistoryList();
  }, [user?.ngo_id]);

  const filteredHistory = history.filter((h) => {
    const q = searchQuery.toLowerCase();
    return (
      !searchQuery ||
      h.food_type?.toLowerCase().includes(q) ||
      h.donor_name?.toLowerCase().includes(q) ||
      h.city?.toLowerCase().includes(q)
    );
  });

  const totalKg = history
    .filter((h) => String(h.unit).toLowerCase() === "kg")
    .reduce((sum, h) => sum + Number(h.requested_quantity || 0), 0);

  const estimatedMeals = Math.round(totalKg * 2.5);

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
                  IMPACT ARCHIVE
                </span>
                <h1>Donation History & Impact</h1>
                <p>
                  Historical record of all completed food rescue operations received and distributed by your shelter.
                </p>
              </div>

              <div className="admin-stat-pills">
                <span className="pill-badge pill-total">
                  Completed Receipts: {history.length}
                </span>
              </div>
            </div>

            {error && (
              <div className="auth-alert alert-error" style={{ marginBottom: "1.25rem" }}>
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            {/* Impact Metric Cards */}
            <div className="dashboard-stats-grid">
              <div className="stat-card">
                <div className="stat-icon-wrap icon-green">
                  <Scale size={22} />
                </div>
                <div className="stat-body">
                  <span>Food Rescued</span>
                  <strong>{loading ? "—" : `${totalKg.toFixed(1)} kg`}</strong>
                  <small>Total weight received</small>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon-wrap icon-orange">
                  <Utensils size={22} />
                </div>
                <div className="stat-body">
                  <span>Estimated Meals</span>
                  <strong>{loading ? "—" : estimatedMeals}</strong>
                  <small>Community members fed</small>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon-wrap icon-blue">
                  <Sparkles size={22} />
                </div>
                <div className="stat-body">
                  <span>Completed Rescues</span>
                  <strong>{loading ? "—" : history.length}</strong>
                  <small>Fulfillments confirmed</small>
                </div>
              </div>
            </div>

            {/* Search Toolbar */}
            <div className="admin-toolbar">
              <div className="admin-search-wrap">
                <Search size={16} className="search-icon" />
                <input
                  type="text"
                  placeholder="Search history by food type, donor name, city..."
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
            </div>

            {/* Table */}
            {loading ? (
              <div className="dashboard-empty-card">
                <div className="food-spinner"></div>
                <p>Loading donation history...</p>
              </div>
            ) : filteredHistory.length === 0 ? (
              <div className="dashboard-empty-card">
                <div className="empty-icon-wrap">
                  <History size={36} />
                </div>
                <h3>No historical records found</h3>
                <p>
                  {searchQuery
                    ? "No records match your search filter."
                    : "Completed deliveries confirmed by your NGO will be archived here."}
                </p>
              </div>
            ) : (
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Batch ID</th>
                      <th>Food Item</th>
                      <th>Portion Received</th>
                      <th>Donor Name</th>
                      <th>City Zone</th>
                      <th>Received On</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHistory.map((h) => (
                      <tr key={h.request_id || h.pickup_id}>
                        <td className="table-mono">#{h.request_id}</td>
                        <td>
                          <strong>{h.food_type}</strong>
                        </td>
                        <td>
                          <strong>
                            {h.requested_quantity} {h.unit}
                          </strong>
                        </td>
                        <td>{h.donor_name || "Food Donor"}</td>
                        <td>{h.city || "Ahmedabad"}</td>
                        <td>
                          {formatDate(h.delivery_timestamp || h.responded_at || h.requested_at)}
                        </td>
                        <td>
                          <span className="donation-status status-completed">
                            ✓ RECEIVED & DISTRIBUTED
                          </span>
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

export default NgoHistory;
