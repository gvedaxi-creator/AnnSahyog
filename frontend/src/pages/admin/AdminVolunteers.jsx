import { useEffect, useState } from "react";
import { Search, X, HeartHandshake } from "lucide-react";
import StatusBadge from "../../components/StatusBadge";
import BackButton from "../../components/BackButton";
import Footer from "../../components/Footer";
import AdminSidebar from "../../components/AdminSidebar";
import { getAdminVolunteers } from "../../services/api";

function AdminVolunteers() {
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [availabilityFilter, setAvailabilityFilter] = useState("ALL");

  const fetchVolunteers = async () => {
    try {
      setLoading(true);
      const data = await getAdminVolunteers();
      setVolunteers(data.volunteers || []);
    } catch (err) {
      console.error("Fetch volunteers error:", err);
      setError(err.message || "Failed to load volunteers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVolunteers();
  }, []);

  const filteredVolunteers = volunteers.filter((v) => {
    const matchesAvail =
      availabilityFilter === "ALL" || v.availability === availabilityFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      v.name?.toLowerCase().includes(q) ||
      v.email?.toLowerCase().includes(q) ||
      v.phone?.toLowerCase().includes(q) ||
      v.city?.toLowerCase().includes(q);

    return matchesAvail && matchesSearch;
  });

  const availableCount = volunteers.filter(
    (v) => v.availability === "AVAILABLE"
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
                  VOLUNTEER CORPS
                </span>
                <h1>Volunteer Network</h1>
                <p>
                  View and manage registered local volunteers who power community food
                  collection and deliveries.
                </p>
              </div>

              <div className="admin-stat-pills">
                <span className="pill-badge pill-total">
                  Total: {volunteers.length}
                </span>
                <span className="pill-badge pill-active">
                  Available Now: {availableCount}
                </span>
                <span className="pill-badge pill-inactive">
                  Unavailable: {volunteers.length - availableCount}
                </span>
              </div>
            </div>

            {error && <div className="form-error">{error}</div>}

            {/* Toolbar */}
            <div className="admin-toolbar">
              <div className="admin-search-wrap">
                <Search size={16} className="search-icon" aria-hidden="true" />
                <input
                  type="text"
                  placeholder="Search volunteers by name, email, phone, city..."
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
                  <label>Availability</label>
                  <select
                    value={availabilityFilter}
                    onChange={(e) => setAvailabilityFilter(e.target.value)}
                    className="admin-select"
                  >
                    <option value="ALL">All Availability</option>
                    <option value="AVAILABLE">Available</option>
                    <option value="UNAVAILABLE">Unavailable</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Content Table */}
            <div className="admin-card-section">
              {loading ? (
                <div className="admin-loading-state">
                  <p>Loading volunteer roster...</p>
                </div>
              ) : filteredVolunteers.length === 0 ? (
                <div className="admin-empty-state">
                  <div className="empty-icon"><HeartHandshake size={26} /></div>
                  <h3>No volunteers found</h3>
                  <p>
                    {searchQuery || availabilityFilter !== "ALL"
                      ? "Try adjusting your search terms or filters."
                      : "No volunteers have joined the network yet."}
                  </p>
                </div>
              ) : (
                <div className="admin-table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Volunteer</th>
                        <th>Contact</th>
                        <th>City / Address</th>
                        <th>Availability</th>
                        <th>Account Status</th>
                        <th>Joined</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredVolunteers.map((v) => (
                        <tr key={v.volunteer_id}>
                          <td>
                            <strong>{v.name}</strong>
                            <span className="table-sub">
                              Volunteer ID: #{v.volunteer_id}
                            </span>
                          </td>
                          <td>
                            <div>{v.email}</div>
                            <span className="table-sub">
                              {v.phone || "No phone"}
                            </span>
                          </td>
                          <td>
                            <div>{v.city || "—"}</div>
                            <span className="table-sub table-address">
                              {v.address || "—"}
                            </span>
                          </td>
                          <td>
                            <StatusBadge status={v.availability || "UNAVAILABLE"} />
                          </td>
                          <td>
                            <StatusBadge status={v.status} />
                          </td>
                          <td className="table-date">
                            {new Date(v.created_at).toLocaleDateString()}
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
        <Footer variant="app" />
      </main>
    </div>
  );
}

export default AdminVolunteers;
