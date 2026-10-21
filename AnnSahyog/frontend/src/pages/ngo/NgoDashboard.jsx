import { useEffect, useState } from "react";
import StatusBadge from "../../components/StatusBadge";
import Footer from "../../components/Footer";
import { Link } from "react-router-dom";
import NgoSidebar from "../../components/NgoSidebar";
import {
  getNgoDashboard,
  getDonations,
  getNgoRequests,
} from "../../services/api";
import {
  Utensils,
  ClipboardList,
  Truck,
  Sparkles,
  Search,
  History,
  Clock,
  AlertCircle,
  ArrowRight,
} from "lucide-react";

function NgoDashboard() {
  const user = JSON.parse(localStorage.getItem("user") || "null");

  const [dashboardData, setDashboardData] = useState(null);
  const [availableFood, setAvailableFood] = useState([]);
  const [recentRequests, setRecentRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      if (!user?.ngo_id) {
        setError("NGO organization details are missing. Please logout and login again.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const [dashRes, donRes, reqRes] = await Promise.all([
          getNgoDashboard(user.ngo_id),
          getDonations(),
          getNgoRequests(user.ngo_id),
        ]);

        setDashboardData(dashRes.dashboard || {});
        // Filter available donations
        const available = (donRes.donations || []).filter(
          (d) => d.status === "AVAILABLE"
        );
        setAvailableFood(available.slice(0, 4));
        setRecentRequests((reqRes.requests || []).slice(0, 4));
      } catch (err) {
        console.error("NGO Dashboard error:", err);
        setError(err.message || "Failed to load NGO dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [user?.ngo_id]);

  const vStatus = dashboardData?.verification_status || user?.verification_status || "PENDING";


  return (
    <div className="donor-layout ngo-layout">
      <NgoSidebar />

      <main className="donor-main ngo-main">
        <div className="dashboard-page ngo-dashboard-page">
          <div className="container">

            {/* =========================
                HEADER
            ========================= */}
            <div className="dashboard-header ngo-header">
              <div>
                <span className="dashboard-eyebrow ngo-eyebrow">
                  RECEIVING SHELTER COMMAND
                </span>
                <h1>
                  Welcome, {user?.organization_name || user?.name || "Community Partner"}.
                </h1>
                <p>
                  Connect surplus food from generous donors to the community shelters and families who need it most.
                </p>
              </div>

              <div className="ngo-header-actions">
                <Link to="/ngo/donations" className="btn btn-primary btn-header-action">
                  <Search size={18} />
                  <span>Browse Available Food</span>
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="auth-alert alert-error" style={{ marginBottom: "1.5rem" }}>
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            {/* =========================
                VERIFICATION BANNER
            ========================= */}
            {vStatus === "PENDING" && (
              <div className="ngo-banner banner-pending">
                <div className="banner-icon-box">
                  <Clock size={20} />
                </div>
                <div className="banner-text">
                  <strong>Organization Verification in Progress</strong>
                  <span>
                    Your NGO registration is currently under review by AnnSahyog administrators. You can explore available food listings; portion claims will be activated immediately once verified.
                  </span>
                </div>
                <Link to="/ngo/profile" className="btn btn-sm btn-secondary">
                  View Org Profile →
                </Link>
              </div>
            )}

            {vStatus === "DEACTIVE" && (
              <div className="ngo-banner banner-rejected">
                <div className="banner-icon-box">
                  <AlertCircle size={20} />
                </div>
                <div className="banner-text">
                  <strong>Organization Account Deactivated</strong>
                  <span>
                    An AnnSahyog administrator has deactivated your organization, so food requests are paused. Please contact the AnnSahyog team to reactivate it.
                  </span>
                </div>
                <Link to="/ngo/profile" className="btn btn-sm btn-secondary">
                  View Org Profile →
                </Link>
              </div>
            )}

            {vStatus === "REJECTED" && (
              <div className="ngo-banner banner-rejected">
                <div className="banner-icon-box">
                  <AlertCircle size={20} />
                </div>
                <div className="banner-text">
                  <strong>Registration Needs Verification Attention</strong>
                  <span>
                    Your organization details could not be verified automatically. Please verify your registration Darpan ID or contact info on your profile.
                  </span>
                </div>
                <Link to="/ngo/profile" className="btn btn-sm btn-primary">
                  Update Profile →
                </Link>
              </div>
            )}

            {/* =========================
                KPI STATS GRID
            ========================= */}
            <div className="dashboard-stats-grid">
              <div className="stat-card">
                <div className="stat-icon-wrap icon-green">
                  <Utensils size={22} />
                </div>
                <div className="stat-body">
                  <span>Available Food</span>
                  <strong>{loading ? "—" : dashboardData?.available_donations ?? 0}</strong>
                  <small>Batches ready for claim</small>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon-wrap icon-amber">
                  <ClipboardList size={22} />
                </div>
                <div className="stat-body">
                  <span>My Active Claims</span>
                  <strong>{loading ? "—" : dashboardData?.pending_requests ?? 0}</strong>
                  <small>Pending donor approval</small>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon-wrap icon-blue">
                  <Truck size={22} />
                </div>
                <div className="stat-body">
                  <span>Incoming Deliveries</span>
                  <strong>{loading ? "—" : dashboardData?.active_deliveries ?? 0}</strong>
                  <small>With volunteer couriers</small>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon-wrap icon-orange">
                  <Sparkles size={22} />
                </div>
                <div className="stat-body">
                  <span>Rescued Food Received</span>
                  <strong>
                    {loading
                      ? "—"
                      : `${Number(dashboardData?.total_kg_received || 0).toFixed(0)} kg`}
                  </strong>
                  <small>
                    {dashboardData?.completed_deliveries ?? 0} deliveries completed
                  </small>
                </div>
              </div>
            </div>

            {/* =========================
                QUICK MODULE NAVIGATION
            ========================= */}
            <div className="admin-quick-links">
              <Link to="/ngo/donations" className="quick-link-card">
                <span className="quick-link-icon">
                  <Search size={20} />
                </span>
                <div>
                  <strong>Browse Food Listings</strong>
                  <p>Discover surplus meals near your community center</p>
                </div>
                <span className="quick-link-arrow">→</span>
              </Link>

              <Link to="/ngo/requests" className="quick-link-card">
                <span className="quick-link-icon">
                  <ClipboardList size={20} />
                </span>
                <div>
                  <strong>Track Claims & Approvals</strong>
                  <p>View donor decisions and preparation notes</p>
                </div>
                <span className="quick-link-arrow">→</span>
              </Link>

              <Link to="/ngo/deliveries" className="quick-link-card">
                <span className="quick-link-icon">
                  <Truck size={20} />
                </span>
                <div>
                  <strong>Incoming Deliveries</strong>
                  <p>Live volunteer courier transit status</p>
                </div>
                <span className="quick-link-arrow">→</span>
              </Link>

              <Link to="/ngo/history" className="quick-link-card">
                <span className="quick-link-icon">
                  <History size={20} />
                </span>
                <div>
                  <strong>Donation History</strong>
                  <p>Past receipts & cumulative meals distributed</p>
                </div>
                <span className="quick-link-arrow">→</span>
              </Link>
            </div>

            {/* =========================
                TWO-COLUMN SECTION
            ========================= */}
            <div className="admin-dashboard-two-col">
              {/* AVAILABLE FOOD LISTINGS */}
              <div className="admin-card-section">
                <div className="section-heading-row">
                  <div>
                    <span className="dashboard-eyebrow">FOOD DISCOVERY</span>
                    <h2>Available Surplus Food</h2>
                  </div>
                  <Link to="/ngo/donations" className="link-view-all">
                    <span>Explore all</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>

                {loading ? (
                  <div className="dashboard-empty-card">
                    <div className="food-spinner"></div>
                    <p>Loading available food listings...</p>
                  </div>
                ) : availableFood.length === 0 ? (
                  <div className="dashboard-empty-card">
                    <Utensils size={32} />
                    <p>No surplus food is currently listed in your area. Check back soon!</p>
                  </div>
                ) : (
                  <div className="admin-table-wrapper">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Item</th>
                          <th>Qty</th>
                          <th>Location</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {availableFood.map((food) => (
                          <tr key={food.donation_id}>
                            <td>
                              <strong>{food.food_type}</strong>
                              <span className="table-sub">{food.donor_name || "Food Donor"}</span>
                            </td>
                            <td>
                              <strong>
                                {food.quantity} {food.unit}
                              </strong>
                            </td>
                            <td>
                              <span className="table-sub">{food.city || "Ahmedabad"}</span>
                            </td>
                            <td>
                              <Link
                                to={`/ngo/donations/${food.donation_id}`}
                                className="table-action-link"
                              >
                                Claim <ArrowRight size={14} />
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* RECENT REQUESTS */}
              <div className="admin-card-section">
                <div className="section-heading-row">
                  <div>
                    <span className="dashboard-eyebrow">CLAIM STATUS</span>
                    <h2>My Recent Requests</h2>
                  </div>
                  <Link to="/ngo/requests" className="link-view-all">
                    <span>View all</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>

                {loading ? (
                  <div className="dashboard-empty-card">
                    <div className="food-spinner"></div>
                    <p>Loading recent claims...</p>
                  </div>
                ) : recentRequests.length === 0 ? (
                  <div className="dashboard-empty-card">
                    <ClipboardList size={32} />
                    <p>You haven't submitted any food claim requests yet.</p>
                    <Link to="/ngo/donations" className="btn btn-sm btn-primary" style={{ marginTop: "10px" }}>
                      Find Food to Claim →
                    </Link>
                  </div>
                ) : (
                  <div className="admin-table-wrapper">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Food Item</th>
                          <th>Qty</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentRequests.map((req) => (
                          <tr key={req.request_id}>
                            <td>
                              <strong>{req.food_type}</strong>
                              <span className="table-sub">{req.donor_name || "Donor"}</span>
                            </td>
                            <td>
                              {req.requested_quantity} {req.unit}
                            </td>
                            <td>
                              <StatusBadge status={req.request_status || req.status || "PENDING"} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <Footer variant="app" />
      </main>
    </div>
  );
}

export default NgoDashboard;
