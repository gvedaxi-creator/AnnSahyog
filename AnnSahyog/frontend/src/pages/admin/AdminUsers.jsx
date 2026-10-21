import { useEffect, useState } from "react";
import { Search, X, Users } from "lucide-react";
import StatusBadge from "../../components/StatusBadge";
import BackButton from "../../components/BackButton";
import Footer from "../../components/Footer";
import AdminSidebar from "../../components/AdminSidebar";
import { getAdminUsers, updateAdminUserStatus } from "../../services/api";

function AdminUsers() {
  const currentUser = JSON.parse(localStorage.getItem("user") || "null");

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await getAdminUsers();
      setUsers(data.users || []);
    } catch (err) {
      console.error("Fetch users error:", err);
      setError(err.message || "Failed to load users list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleStatus = async (user) => {
    if (user.user_id === currentUser?.user_id) {
      alert("You cannot change the status of your own administrator account.");
      return;
    }

    const nextStatus = user.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    const confirmMsg = `Are you sure you want to mark ${user.name} (${user.email}) as ${nextStatus}?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      setActionLoadingId(user.user_id);
      setError("");
      setSuccessMsg("");
      await updateAdminUserStatus(user.user_id, nextStatus);

      setSuccessMsg(`User "${user.name}" status updated to ${nextStatus}.`);
      setUsers((prev) =>
        prev.map((u) =>
          u.user_id === user.user_id ? { ...u, status: nextStatus } : u
        )
      );
    } catch (err) {
      console.error("Status update error:", err);
      setError(err.message || "Failed to update user status.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filtered users list
  const filteredUsers = users.filter((u) => {
    const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
    const matchesStatus = statusFilter === "ALL" || u.status === statusFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.phone?.toLowerCase().includes(q);

    return matchesRole && matchesStatus && matchesSearch;
  });

  const activeCount = users.filter((u) => u.status === "ACTIVE").length;
  const inactiveCount = users.filter((u) => u.status === "INACTIVE").length;

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
                  ACCOUNT DIRECTORY
                </span>
                <h1>User Management</h1>
                <p>
                  Manage all platform users including Donors, Partner NGOs,
                  Volunteers, and Platform Admins.
                </p>
              </div>

              <div className="admin-stat-pills">
                <span className="pill-badge pill-total">
                  Total: {users.length}
                </span>
                <span className="pill-badge pill-active">
                  Active: {activeCount}
                </span>
                <span className="pill-badge pill-inactive">
                  Inactive: {inactiveCount}
                </span>
              </div>
            </div>

            {/* Notifications */}
            {error && <div className="form-error">{error}</div>}
            {successMsg && <div className="form-success">{successMsg}</div>}

            {/* Filter & Search Toolbar */}
            <div className="admin-toolbar">
              <div className="admin-search-wrap">
                <Search size={16} className="search-icon" aria-hidden="true" />
                <input
                  type="text"
                  placeholder="Search by name, email, or phone..."
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
                  <label>Role</label>
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="admin-select"
                  >
                    <option value="ALL">All Roles</option>
                    <option value="DONOR">Donor</option>
                    <option value="NGO">NGO</option>
                    <option value="VOLUNTEER">Volunteer</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>

                <div className="filter-item">
                  <label>Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="admin-select"
                  >
                    <option value="ALL">All Status</option>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="admin-card-section">
              {loading ? (
                <div className="admin-loading-state">
                  <p>Loading users directory...</p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="admin-empty-state">
                  <div className="empty-icon"><Users size={26} /></div>
                  <h3>No matching users found</h3>
                  <p>Try adjusting your search query or filter options.</p>
                </div>
              ) : (
                <div className="admin-table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Contact</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Registered</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((u) => {
                        const isSelf = u.user_id === currentUser?.user_id;
                        const isActionLoading = actionLoadingId === u.user_id;

                        return (
                          <tr key={u.user_id}>
                            <td>
                              <strong>{u.name}</strong>
                              <span className="table-sub">ID: #{u.user_id}</span>
                            </td>
                            <td>
                              <div>{u.email}</div>
                              <span className="table-sub">
                                {u.phone || "No phone"}
                              </span>
                            </td>
                            <td>
                              <span className="admin-role-badge">
                                {u.role}
                              </span>
                            </td>
                            <td>
                              <StatusBadge status={u.status} />
                            </td>
                            <td className="table-date">
                              {new Date(u.created_at).toLocaleDateString()}
                            </td>
                            <td>
                              {isSelf ? (
                                <span className="admin-self-pill">
                                  Current User
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleToggleStatus(u)}
                                  disabled={isActionLoading}
                                  className={`btn-table-action ${
                                    u.status === "ACTIVE"
                                      ? "btn-deactivate"
                                      : "btn-activate"
                                  }`}
                                >
                                  {isActionLoading
                                    ? "Updating..."
                                    : u.status === "ACTIVE"
                                    ? "Deactivate"
                                    : "Activate"}
                                </button>
                              )}
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

export default AdminUsers;
