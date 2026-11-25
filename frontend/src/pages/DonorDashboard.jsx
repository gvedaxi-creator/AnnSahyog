import { useEffect, useState } from "react";
import StatusBadge from "../components/StatusBadge";
import Footer from "../components/Footer";
import { Link } from "react-router-dom";
import DonorSidebar from "../components/DonorSidebar";
import { getDonorDonations } from "../services/api";
import {
  PlusCircle,
  Utensils,
  Scale,
  CheckCircle2,
  Clock,
  ArrowRight,
  Package,
  AlertCircle,
  MapPin,
} from "lucide-react";

function DonorDashboard() {
  const user = JSON.parse(localStorage.getItem("user") || "null");

  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDonations = async () => {
      if (!user?.donor_id) {
        setError(
          "Donor profile information is missing. Please log out and log in again."
        );
        setLoading(false);
        return;
      }

      try {
        const data = await getDonorDonations(user.donor_id);
        setDonations(data.donations || []);
      } catch (err) {
        console.error(err);
        setError(err.message || "Failed to load donor dashboard.");
      } finally {
        setLoading(false);
      }
    };

    fetchDonations();
  }, [user?.donor_id]);

  // ======================================================
  // DASHBOARD STATISTICS
  // ======================================================

  const totalDonations = donations.length;

  const foodShared = donations
    .filter((donation) => String(donation.unit).toLowerCase() === "kg")
    .reduce((total, donation) => total + Number(donation.quantity || 0), 0);

  const completedDonations = donations.filter(
    (donation) => donation.status === "COMPLETED" || donation.status === "DELIVERED"
  ).length;

  const activeDonations = donations.filter(
    (donation) => donation.status === "AVAILABLE" || donation.status === "REQUESTED" || donation.status === "ACCEPTED" || donation.status === "IN_TRANSIT"
  ).length;

  // Latest 3 donations
  const recentDonations = donations.slice(0, 3);


  return (
    <div className="donor-layout">
      {/* SIDEBAR */}
      <DonorSidebar />

      {/* MAIN CONTENT */}
      <main className="donor-main">
        <div className="dashboard-page">
          <div className="container">

            {/* =========================
                HEADER
            ========================= */}
            <div className="dashboard-header">
              <div>
                <span className="dashboard-eyebrow">FOOD DONOR HUB</span>
                <h1>Welcome back, {user?.name || "Food Hero"}.</h1>
                <p>Every listed meal helps eliminate hunger and reduce food waste in our city.</p>
              </div>

              <Link to="/donor/add-donation" className="btn btn-primary btn-header-action">
                <PlusCircle size={18} />
                <span>Add Donation</span>
              </Link>
            </div>

            {/* Error Message */}
            {error && (
              <div className="auth-alert alert-error" style={{ marginBottom: "1.5rem" }}>
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            {/* =========================
                STATISTICS GRID
            ========================= */}
            <div className="dashboard-stats-grid">
              <div className="stat-card">
                <div className="stat-icon-wrap icon-green">
                  <Package size={22} />
                </div>
                <div className="stat-body">
                  <span>Total Donations</span>
                  <strong>{loading ? "—" : totalDonations}</strong>
                  <small>All time listings</small>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon-wrap icon-orange">
                  <Scale size={22} />
                </div>
                <div className="stat-body">
                  <span>Food Shared</span>
                  <strong>{loading ? "—" : `${foodShared.toFixed(1)} kg`}</strong>
                  <small>Safe surplus diverted</small>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon-wrap icon-blue">
                  <CheckCircle2 size={22} />
                </div>
                <div className="stat-body">
                  <span>Completed Rescues</span>
                  <strong>{loading ? "—" : completedDonations}</strong>
                  <small>Delivered to shelters</small>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon-wrap icon-amber">
                  <Clock size={22} />
                </div>
                <div className="stat-body">
                  <span>Active In Pipeline</span>
                  <strong>{loading ? "—" : activeDonations}</strong>
                  <small>Available or in transit</small>
                </div>
              </div>
            </div>

            {/* =========================
                RECENT DONATIONS SECTION
            ========================= */}
            <section className="dashboard-section">
              <div className="section-heading-row">
                <div>
                  <span className="dashboard-eyebrow">ACTIVITY OVERVIEW</span>
                  <h2>Recent Donations</h2>
                </div>

                <Link to="/donor/donations" className="link-view-all">
                  <span>View all donations</span>
                  <ArrowRight size={14} />
                </Link>
              </div>

              {/* Loading State */}
              {loading && (
                <div className="dashboard-empty-card">
                  <div className="food-spinner"></div>
                  <h3>Loading your donations...</h3>
                  <p>Fetching your latest surplus contributions.</p>
                </div>
              )}

              {/* Empty State */}
              {!loading && !error && recentDonations.length === 0 && (
                <div className="dashboard-empty-card">
                  <div className="empty-icon-wrap">
                    <Utensils size={36} />
                  </div>
                  <h3>No donations listed yet</h3>
                  <p>
                    Turn your event or kitchen surplus into nutritious meals for local shelters.
                  </p>
                  <Link to="/donor/add-donation" className="btn btn-primary btn-sm">
                    <PlusCircle size={16} />
                    <span>Add your first donation</span>
                  </Link>
                </div>
              )}

              {/* Recent donation cards */}
              {!loading && !error && recentDonations.length > 0 && (
                <div className="dashboard-recent-grid">
                  {recentDonations.map((donation) => (
                    <article
                      className="dashboard-recent-card"
                      key={donation.donation_id}
                    >
                      <div className="recent-card-left">
                        <div className="recent-card-icon">
                          <Utensils size={20} />
                        </div>

                        <div className="recent-card-info">
                          <span className="recent-card-tag">
                            DONATION #{donation.donation_id}
                          </span>
                          <h3>{donation.food_type}</h3>
                          <div className="recent-card-meta">
                            <span>
                              <Scale size={13} /> {donation.quantity} {donation.unit}
                            </span>
                            <span>•</span>
                            <span>
                              <MapPin size={13} /> {donation.city || "Ahmedabad"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="recent-card-right">
                        <StatusBadge status={donation.status} />

                        <Link
                          to={`/donor/donations/${donation.donation_id}`}
                          className="btn-view-details"
                        >
                          <span>Details</span>
                          <ArrowRight size={14} />
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
        <Footer variant="app" />
      </main>
    </div>
  );
}

export default DonorDashboard;
