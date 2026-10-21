import { useState } from "react";
import { NavLink, useNavigate, Link } from "react-router-dom";
import {
  LayoutDashboard,
  Search,
  ClipboardList,
  Truck,
  History,
  Bell,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";

function NgoSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "null");

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  const menuItems = [
    {
      to: "/ngo/dashboard",
      icon: LayoutDashboard,
      label: "Dashboard",
    },
    {
      to: "/ngo/donations",
      icon: Search,
      label: "Browse Donations",
    },
    {
      to: "/ngo/requests",
      icon: ClipboardList,
      label: "My Requests",
    },
    {
      to: "/ngo/deliveries",
      icon: Truck,
      label: "Incoming Deliveries",
    },
    {
      to: "/ngo/history",
      icon: History,
      label: "Donation History",
    },
    {
      to: "/ngo/notifications",
      icon: Bell,
      label: "Notifications",
    },
    {
      to: "/ngo/profile",
      icon: Settings,
      label: "Profile",
    },
  ];

  const vStatus = user?.verification_status || "PENDING";

  return (
    <aside
      className={`donor-sidebar ngo-sidebar ${
        collapsed ? "sidebar-collapsed" : "sidebar-expanded"
      }`}
    >
      {/* =========================
          HEADER
      ========================= */}
      <div className="sidebar-header">
        <Link
          to="/ngo/dashboard"
          className="sidebar-logo"
          aria-label="NGO Dashboard"
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
          NGO USER / ORG BADGE
      ========================= */}
      <div className="sidebar-user ngo-user-wrap">
        <div className="sidebar-avatar ngo-avatar">
          {user?.organization_name?.charAt(0)?.toUpperCase() ||
            user?.name?.charAt(0)?.toUpperCase() ||
            "N"}
        </div>

        {!collapsed && (
          <div className="sidebar-user-info">
            <strong className="ngo-org-title" title={user?.organization_name || user?.name || "Partner NGO"}>
              {user?.organization_name || user?.name || "Partner NGO"}
            </strong>
            <span
              className={`ngo-verification-badge ${
                vStatus === "ACTIVE"
                  ? "badge-verified"
                  : vStatus === "PENDING"
                  ? "badge-pending"
                  : "badge-rejected"
              }`}
            >
              {vStatus === "ACTIVE" ? (
                <>
                  <CheckCircle2 size={12} /> Active NGO
                </>
              ) : vStatus === "PENDING" ? (
                <>
                  <Clock size={12} /> Verification Pending
                </>
              ) : (
                <>
                  <AlertCircle size={12} /> {vStatus === "DEACTIVE" ? "Account Deactivated" : "Verification Rejected"}
                </>
              )}
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
            </NavLink>
          );
        })}
      </nav>

      {/* =========================
          LOGOUT
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

export default NgoSidebar;
