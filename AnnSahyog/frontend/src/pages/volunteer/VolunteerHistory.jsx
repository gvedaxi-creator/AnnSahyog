import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import VolunteerSidebar from "../../components/VolunteerSidebar";
import BackButton from "../../components/BackButton";
import Footer from "../../components/Footer";
import { getVolunteerHistory } from "../../services/api";
import {
  History,
  Bike,
  Search,
  X,
  Utensils,
  Building2,
  Sparkles,
  Scale,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { estimateMeals } from "../../utils/meals";

function VolunteerHistory() {
  const user = JSON.parse(localStorage.getItem("user") || "null");

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const loadHistory = async () => {
      if (!user?.volunteer_id) return;
      try {
        setLoading(true);
        const res = await getVolunteerHistory(user.volunteer_id);
        setHistory(res.history || []);
      } catch (err) {
        console.error("Error loading volunteer history:", err);
        setError(err.message || "Failed to load activity history");
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [user?.volunteer_id]);

  // Only kg quantities add to the kg total; plates etc. are not weights
  const totalKg = history
    .filter((item) => String(item.unit || "").toLowerCase() === "kg")
    .reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const estimatedMeals = Math.round(
    history.reduce((sum, item) => sum + estimateMeals(item.quantity, item.unit), 0)
  );

  const filteredHistory = history.filter((item) => {
    return (
      item.food_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.delivery_location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.donor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.city?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="donor-layout vol-layout">
      <VolunteerSidebar />

      <main className="donor-main vol-main">
        <div className="vol-content">
          <div className="page-back-bar">
            <BackButton />
          </div>

          {/* HEADER */}
          <div className="vol-page-header">
            <div className="vol-header-top">
              <div>
                <span className="dashboard-eyebrow">COMMUNITY SERVICE LOG</span>
                <h1>Rescue Activity History</h1>
                <p>
                  Every delivery logged here represents food that was saved from waste and delivered to shelters in need.
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="auth-alert alert-error" style={{ marginBottom: "1.25rem" }}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {/* IMPACT METRICS BANNER */}
          <div className="dashboard-stats-grid">
            <div className="stat-card">
              <div className="stat-icon-wrap icon-blue">
                <Bike size={22} />
              </div>
              <div className="stat-body">
                <span>Missions Completed</span>
                <strong>{loading ? "—" : history.length}</strong>
                <small>Verified drop-offs</small>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon-wrap icon-green">
                <Scale size={22} />
              </div>
              <div className="stat-body">
                <span>Food Transported</span>
                <strong>{loading ? "—" : `${totalKg} kg`}</strong>
                <small>Nutritious surplus moved</small>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon-wrap icon-orange">
                <Utensils size={22} />
              </div>
              <div className="stat-body">
                <span>Meals Provided</span>
                <strong>{loading ? "—" : `~${estimatedMeals}`}</strong>
                <small>People fed in community</small>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon-wrap icon-amber">
                <Sparkles size={22} />
              </div>
              <div className="stat-body">
                <span>Volunteer Status</span>
                <strong>Food Hero</strong>
                <small>Community Champion</small>
              </div>
            </div>
          </div>

          {/* SEARCH & FILTERS */}
          <div className="admin-toolbar">
            <div className="admin-search-wrap">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search history by food, shelter, donor, city..."
                className="admin-search-input"
              />
              {searchTerm && (
                <button
                  type="button"
                  className="clear-search-btn"
                  onClick={() => setSearchTerm("")}
                  aria-label="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* HISTORY RECORDS */}
          {loading ? (
            <div className="dashboard-empty-card">
              <div className="food-spinner"></div>
              <p>Loading rescue activity history...</p>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="dashboard-empty-card">
              <div className="empty-icon-wrap">
                <History size={36} />
              </div>
              <h3>No completed rescue missions found</h3>
              <p>
                {searchTerm
                  ? "No records match your search filter."
                  : "Completed food rescue missions will appear here."}
              </p>
              <Link to="/volunteer/tasks" className="btn btn-primary btn-sm">
                Browse Open Rescues →
              </Link>
            </div>
          ) : (
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Mission ID</th>
                    <th>Food Rescued</th>
                    <th>Pickup (Donor)</th>
                    <th>Drop-off (Shelter)</th>
                    <th>Date & Time</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.map((item) => (
                    <tr key={item.pickup_id}>
                      <td className="table-mono">#{item.pickup_id}</td>
                      <td>
                        <strong>{item.quantity} {item.unit} {item.food_type}</strong>
                      </td>
                      <td>
                        <span className="table-sub">{item.donor_name || "Food Donor"} ({item.city || "Ahmedabad"})</span>
                      </td>
                      <td>
                        <div className="table-ngo-cell">
                          <Building2 size={13} />
                          <strong>{item.delivery_location || "Shelter Center"}</strong>
                        </div>
                      </td>
                      <td className="table-date">
                        {item.delivery_timestamp
                          ? new Date(item.delivery_timestamp).toLocaleString([], {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })
                          : "Completed"}
                      </td>
                      <td>
                        <span className="donation-status status-completed">
                          <CheckCircle2 size={12} /> DELIVERED
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <Footer variant="app" />
      </main>
    </div>
  );
}

export default VolunteerHistory;
