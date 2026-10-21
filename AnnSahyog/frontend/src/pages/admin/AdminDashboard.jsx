import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AdminSidebar from "../../components/AdminSidebar";
import StatusBadge from "../../components/StatusBadge";
import Footer from "../../components/Footer";
import {
  getAdminDashboard,
  getAdminDonations,
  getAdminUsers,
  getAdminNgos,
  getAdminPendingPickups,
} from "../../services/api";
import {
  Users,
  Utensils,
  Truck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Building2,
  MessageSquare,
  ChevronRight,
  Eye,
} from "lucide-react";

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [recentDonations, setRecentDonations] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [pendingNgosCount, setPendingNgosCount] = useState(0);
  const [urgentPickups, setUrgentPickups] = useState({ count: 0, hours: 2 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [dashData, donationsData, usersData, ngosData, pendingPickups] = await Promise.all([
          getAdminDashboard(),
          getAdminDonations(),
          getAdminUsers(),
          getAdminNgos(),
          getAdminPendingPickups(),
        ]);

        setUrgentPickups({
          count: pendingPickups.needs_admin_count || 0,
          hours: pendingPickups.alert_hours || 2,
        });

        setStats(dashData.statistics || {});
        setRecentDonations((donationsData.donations || []).slice(0, 5));
        setRecentUsers((usersData.users || []).slice(0, 5));

        const pendingNgos = (ngosData.ngos || []).filter(
          (ngo) => ngo.verification_status === "PENDING"
        );
        setPendingNgosCount(pendingNgos.length);
      } catch (err) {
        console.error("Dashboard error:", err);
        setError(err.message || "Failed to load admin dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);


  const quickLinks = [
    { to: "/admin/users", icon: Users, tone: "icon-green", title: "User Directory", text: "Accounts, roles & status" },
    { to: "/admin/ngos", icon: Building2, tone: "icon-orange", title: "NGO Verifications", text: "Review partner applications" },
    { to: "/admin/pickups", icon: Truck, tone: "icon-blue", title: "Live Tracking", text: "Food pickups & drop-offs" },
    { to: "/admin/feedback", icon: MessageSquare, tone: "icon-purple", title: "Feedback Log", text: "Community ratings & notes" },
  ];

  return (
    <div className="donor-layout admin-layout">
      <AdminSidebar />

      <main className="donor-main admin-main">
        <div className="dashboard-page admin-dashboard-page">
          <div className="container">

            {/* HEADER */}
            <div className="dashboard-header admin-header">
              <div>
                <span className="dashboard-eyebrow">ADMINISTRATIVE COMMAND CENTER</span>
                <h1>Platform Overview</h1>
                <p>
                  Real-time visibility into surplus food recovery, NGO partners, volunteers, and community logistics.
                </p>
              </div>

              <div className="admin-header-actions">
                <Link to="/admin/ngos" className="btn btn-secondary">
                  <Building2 size={16} />
                  <span>
                    Verify NGOs {pendingNgosCount > 0 && `(${pendingNgosCount})`}
                  </span>
                </Link>
                <Link to="/admin/donations" className="btn btn-primary">
                  <span>View All Donations</span>
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="vol-alert vol-alert-error">
                <AlertTriangle size={17} />
                <span>{error}</span>
              </div>
            )}

            {/* UNCLAIMED PICKUP ALERT: nobody accepted and pickup time is near */}
            {urgentPickups.count > 0 && (
              <div className="admin-alert-banner admin-alert-urgent" role="alert">
                <div className="banner-icon-box">
                  <Truck size={18} />
                </div>
                <div className="banner-text">
                  <strong>
                    {urgentPickups.count} pickup{urgentPickups.count > 1 ? "s" : ""} need{urgentPickups.count > 1 ? "" : "s"} a volunteer now
                  </strong>
                  <span>
                    No volunteer has accepted {urgentPickups.count > 1 ? "them" : "it"} and the pickup time is within {urgentPickups.hours} hours or has passed. Assign a volunteer so the food isn't wasted.
                  </span>
                </div>
                <Link to="/admin/pickups" className="btn btn-sm btn-primary">
                  <span>Assign Volunteer</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            )}

            {/* PENDING NGO ALERT BANNER */}
            {pendingNgosCount > 0 && (
              <div className="admin-alert-banner">
                <div className="banner-icon-box">
                  <AlertTriangle size={18} />
                </div>
                <div className="banner-text">
                  <strong>
                    {pendingNgosCount} NGO application{pendingNgosCount > 1 ? "s" : ""} pending verification
                  </strong>
                  <span>
                    New NGO accounts require admin verification before requesting food donations.
                  </span>
                </div>
                <Link to="/admin/ngos" className="btn btn-sm btn-primary">
                  <span>Review Applications</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            )}

            {/* PRIMARY KPI METRICS */}
            <div className="dashboard-stats-grid">
              <div className="stat-card">
                <div className="stat-icon-wrap icon-green">
                  <Users size={22} />
                </div>
                <div className="stat-body">
                  <span>Total Users</span>
                  <strong>{loading ? "—" : stats?.total_users ?? 0}</strong>
                  <small>
                    {stats?.total_donors ?? 0} Donors • {stats?.total_ngos ?? 0} NGOs
                  </small>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon-wrap icon-orange">
                  <Utensils size={22} />
                </div>
                <div className="stat-body">
                  <span>Total Donations</span>
                  <strong>{loading ? "—" : stats?.total_donations ?? 0}</strong>
                  <small>{stats?.available_donations ?? 0} currently available</small>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon-wrap icon-blue">
                  <Truck size={22} />
                </div>
                <div className="stat-body">
                  <span>Active Logistics</span>
                  <strong>{loading ? "—" : stats?.active_pickups ?? 0}</strong>
                  <small>{stats?.total_volunteers ?? 0} registered volunteers</small>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon-wrap icon-amber">
                  <CheckCircle2 size={22} />
                </div>
                <div className="stat-body">
                  <span>Completed Rescues</span>
                  <strong>
                    {loading
                      ? "—"
                      : Number(stats?.delivered_donations || 0) +
                        Number(stats?.completed_donations || 0)}
                  </strong>
                  <small>Successfully delivered meals</small>
                </div>
              </div>
            </div>

            {/* QUICK MODULE NAVIGATION */}
            <div className="admin-quick-links">
              {quickLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.to} to={item.to} className="quick-link-card">
                    <span className={`quick-link-icon stat-icon-wrap ${item.tone}`}>
                      <Icon size={20} />
                    </span>
                    <div>
                      <strong>{item.title}</strong>
                      <p>{item.text}</p>
                    </div>
                    <ChevronRight size={18} className="quick-link-arrow" />
                  </Link>
                );
              })}
            </div>

            {/* RECENT ACTIVITY TABLES */}
            <div className="admin-dashboard-two-col">
              {/* RECENT DONATIONS */}
              <div className="admin-card-section">
                <div className="section-heading-row">
                  <div>
                    <span className="dashboard-eyebrow">FOOD RESCUE</span>
                    <h2>Recent Donations</h2>
                  </div>
                  <Link to="/admin/donations" className="link-view-all">
                    <span>View all</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>

                {loading ? (
                  <div className="dashboard-empty-card">
                    <div className="food-spinner"></div>
                    <p className="admin-loading-text">Loading donations...</p>
                  </div>
                ) : recentDonations.length === 0 ? (
                  <div className="dashboard-empty-card">
                    <Utensils size={28} />
                    <p className="admin-empty-text">No donations recorded yet.</p>
                  </div>
                ) : (
                  <div className="admin-table-wrapper">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Donation</th>
                          <th>Donor</th>
                          <th>Qty</th>
                          <th>Status</th>
                          <th>
                            <span className="sr-only">Action</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentDonations.map((d) => (
                          <tr key={d.donation_id}>
                            <td>
                              <strong>{d.food_type}</strong>
                              <span className="table-sub">
                                #{d.donation_id} · {d.city || "—"}
                              </span>
                            </td>
                            <td className="nowrap">{d.donor_name}</td>
                            <td className="nowrap">
                              {d.quantity} {d.unit}
                            </td>
                            <td>
                              <StatusBadge status={d.status} />
                            </td>
                            <td>
                              <Link
                                to={`/admin/donations/${d.donation_id}`}
                                className="table-action-link"
                              >
                                <Eye size={14} /> View
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* RECENT USERS */}
              <div className="admin-card-section">
                <div className="section-heading-row">
                  <div>
                    <span className="dashboard-eyebrow">MEMBERSHIP</span>
                    <h2>Recent Users</h2>
                  </div>
                  <Link to="/admin/users" className="link-view-all">
                    <span>View all</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>

                {loading ? (
                  <div className="dashboard-empty-card">
                    <div className="food-spinner"></div>
                    <p className="admin-loading-text">Loading users...</p>
                  </div>
                ) : recentUsers.length === 0 ? (
                  <div className="dashboard-empty-card">
                    <Users size={28} />
                    <p className="admin-empty-text">No users found.</p>
                  </div>
                ) : (
                  <div className="admin-table-wrapper">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Role</th>
                          <th>Status</th>
                          <th>Joined</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentUsers.map((u) => (
                          <tr key={u.user_id}>
                            <td>
                              <strong>{u.name}</strong>
                              <span className="table-sub">{u.email}</span>
                            </td>
                            <td>
                              <span className={`admin-role-badge role-${String(u.role || "").toLowerCase()}`}>
                                {u.role}
                              </span>
                            </td>
                            <td>
                              <StatusBadge status={u.status} />
                            </td>
                            <td className="table-date">
                              {new Date(u.created_at).toLocaleDateString()}
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

export default AdminDashboard;
