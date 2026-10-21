import { useEffect, useState } from "react";
import { Search, X, MessageSquare } from "lucide-react";
import BackButton from "../../components/BackButton";
import Footer from "../../components/Footer";
import AdminSidebar from "../../components/AdminSidebar";
import { getAdminFeedback } from "../../services/api";

function AdminFeedback() {
  const [feedbackList, setFeedbackList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      const data = await getAdminFeedback();
      setFeedbackList(data.feedback || []);
    } catch (err) {
      console.error("Fetch feedback error:", err);
      setError(err.message || "Failed to load feedback.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, []);

  const filteredFeedback = feedbackList.filter((f) => {
    const matchesRole = roleFilter === "ALL" || f.user_role === roleFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      f.user_name?.toLowerCase().includes(q) ||
      f.user_email?.toLowerCase().includes(q) ||
      f.comments?.toLowerCase().includes(q) ||
      f.food_type?.toLowerCase().includes(q);

    return matchesRole && matchesSearch;
  });

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
                  COMMUNITY SENTIMENT
                </span>
                <h1>Feedback & Reviews</h1>
                <p>
                  Read feedback submitted by donors, receiving NGOs, and volunteers
                  to maintain food quality and delivery standards.
                </p>
              </div>

              <div className="admin-stat-pills">
                <span className="pill-badge pill-total">
                  Total Reviews: {feedbackList.length}
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
                  placeholder="Search feedback comments, user, or food item..."
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
                  <label>Submitted by Role</label>
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="admin-select"
                  >
                    <option value="ALL">All Roles</option>
                    <option value="DONOR">Donor</option>
                    <option value="NGO">NGO</option>
                    <option value="VOLUNTEER">Volunteer</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="admin-card-section">
              {loading ? (
                <div className="admin-loading-state">
                  <p>Loading community feedback...</p>
                </div>
              ) : filteredFeedback.length === 0 ? (
                <div className="admin-empty-state">
                  <div className="empty-icon"><MessageSquare size={26} /></div>
                  <h3>No feedback found</h3>
                  <p>
                    {searchQuery || roleFilter !== "ALL"
                      ? "No records matched your search terms."
                      : "No feedback has been submitted by community members yet."}
                  </p>
                </div>
              ) : (
                <div className="admin-table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Feedback ID</th>
                        <th>User</th>
                        <th>Role</th>
                        <th>Associated Food</th>
                        <th>Comments</th>
                        <th>Submitted</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredFeedback.map((f) => (
                        <tr key={f.feedback_id}>
                          <td className="table-mono">#{f.feedback_id}</td>
                          <td>
                            <strong>{f.user_name || "Anonymous"}</strong>
                            <span className="table-sub">{f.user_email || "—"}</span>
                          </td>
                          <td>
                            <span className="admin-role-badge">
                              {f.user_role || "USER"}
                            </span>
                          </td>
                          <td>
                            {f.food_type ? (
                              <strong>{f.food_type}</strong>
                            ) : (
                              <span className="table-sub">General</span>
                            )}
                          </td>
                          <td>
                            <p className="feedback-comment-cell">
                              "{f.comments}"
                            </p>
                          </td>
                          <td className="table-date">
                            {f.submitted_date
                              ? new Date(f.submitted_date).toLocaleDateString()
                              : "—"}
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

export default AdminFeedback;
