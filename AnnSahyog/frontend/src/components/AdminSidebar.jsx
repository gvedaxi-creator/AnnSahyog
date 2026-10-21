import { useEffect, useState } from "react";
import { NavLink, useNavigate, Link } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Building2,
  UtensilsCrossed,
  Truck,
  HeartHandshake,
  MessageSquare,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  BarChart3,
} from "lucide-react";
import { getAdminPendingPickups } from "../services/api";

// How often the sidebar re-checks for pickups that need the admin
const ALERT_POLL_MS = 60000;

function AdminSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "null");

  // Pickups nobody accepted that are close to their pickup deadline
  const [urgentPickups, setUrgentPickups] = useState(0);

  useEffect(() => {
    const checkUrgentPickups = () => {
      getAdminPendingPickups()
        .then((data) => setUrgentPickups(data.needs_admin_count || 0))
        .catch(() => {});
    };

    checkUrgentPickups();
    const timer = setInterval(checkUrgentPickups, ALERT_POLL_MS);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  const menuItems = [
    {
      to: "/admin/dashboard",
      icon: LayoutDashboard,
      label: "Dashboard",
    },
    {
      to: "/admin/users",
      icon: Users,
      label: "User Management",
    },
    {
      to: "/admin/ngos",
      icon: Building2,
      label: "NGO Verifications",
    },
    {
      to: "/admin/donations",
      icon: UtensilsCrossed,
      label: "All Donations",
    },
    {
      to: "/admin/pickups",
      icon: Truck,
      label: "Pickups & Tracking",
      badge: urgentPickups,
      badgeTitle: `${urgentPickups} pickup(s) need a volunteer soon`,
    },
    {
      to: "/admin/volunteers",
      icon: HeartHandshake,
      label: "Volunteer Network",
    },
    {
      to: "/admin/feedback",
      icon: MessageSquare,
      label: "Feedback & Reviews",
    },
    {
      to: "/admin/reports",
      icon: BarChart3,
      label: "Reports",
    },
  ];

  return (
    <aside
      className={`donor-sidebar admin-sidebar ${
        collapsed ? "sidebar-collapsed" : "sidebar-expanded"
      }`}
    >
      {/* =========================
          HEADER
      ========================= */}
      <div className="sidebar-header">
        <Link
          to="/admin/dashboard"
          className="sidebar-logo"
          aria-label="Admin Dashboard"
        >
          {/* Full logo */}
          <img
            src="/annsahyog-horizontal.png"
            alt="AnnSahyog"
            className="sidebar-full-logo"
          />

          {/* Icon logo */}
          <img
            src="/annsahyog-icon.png"
            alt="AnnSahyog"
            className="sidebar-icon-logo"
          />
        </Link>

        <button
          type="button"
          className="sidebar-toggle"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* =========================
          USER / ADMIN BADGE
      ========================= */}
      <div className="sidebar-user admin-user-badge-wrap">
        <div className="sidebar-avatar admin-avatar">
          {user?.name?.charAt(0)?.toUpperCase() || "A"}
        </div>

        {!collapsed && (
          <div className="sidebar-user-info">
            <strong title={user?.name || "Administrator"}>
              {user?.name || "Administrator"}
            </strong>
            <span className="admin-role-pill">
              <ShieldCheck size={12} /> Platform Admin
            </span>
          </div>
        )}
      </div>

      {/* =========================
          NAVIGATION
      ========================= */}
      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              aria-label={item.label}
              title={collapsed ? item.label : undefined}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? "active" : ""}`
              }
            >
              <span className="sidebar-icon">
                <IconComponent size={19} />
              </span>
              {!collapsed && <span className="sidebar-label">{item.label}</span>}
              {item.badge > 0 && (
                <span className="sidebar-badge sidebar-badge-urgent" title={item.badgeTitle}>
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* =========================
          BOTTOM / LOGOUT
      ========================= */}
      <div className="sidebar-bottom">
        <button
          type="button"
          className="sidebar-link logout-link"
          onClick={handleLogout}
          title={collapsed ? "Logout" : undefined}
        >
          <span className="sidebar-icon">
            <LogOut size={19} />
          </span>
          {!collapsed && <span className="sidebar-label">Logout</span>}
        </button>
      </div>
    </aside>
  );
}

export default AdminSidebar;
