import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  PlusCircle,
  Package,
  ClipboardList,
  History,
  Bell,
  User,
  LogOut,
  HeartHandshake,
} from "lucide-react";

function DonorSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "null");

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  const menuItems = [
    {
      to: "/donor/dashboard",
      icon: LayoutDashboard,
      label: "Dashboard",
    },
    {
      to: "/donor/add-donation",
      icon: PlusCircle,
      label: "Add Donation",
    },
    {
      to: "/donor/donations",
      icon: Package,
      label: "My Donations",
    },
    {
      to: "/donor/requests",
      icon: ClipboardList,
      label: "Donation Requests",
    },
    {
      to: "/donor/history",
      icon: History,
      label: "Donation History",
    },
    {
      to: "/donor/notifications",
      icon: Bell,
      label: "Notifications",
    },
    {
      to: "/donor/profile",
      icon: User,
      label: "Profile",
    },
  ];

  return (
    <aside
      className={`donor-sidebar ${
        collapsed ? "sidebar-collapsed" : "sidebar-expanded"
      }`}
    >
      {/* ==================================================
          HEADER / LOGO
      ================================================== */}
      <div className="sidebar-header">
        {/* The logo itself expands / collapses the sidebar */}
        <button
          type="button"
          className="sidebar-logo sidebar-logo-toggle"
          onClick={() => setCollapsed(!collapsed)}
          aria-expanded={!collapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {/* Full logo */}
          <img
            src="/annsahyog-logo-trim.png"
            alt="AnnSahyog"
            className="sidebar-full-logo"
          />

          {/* Icon logo */}
          <img
            src="/annsahyog-icon.png"
            alt="AnnSahyog"
            className="sidebar-icon-logo"
          />
        </button>
      </div>

      {/* ==================================================
          USER PROFILE CARD
      ================================================== */}
      <div className="sidebar-user">
        <div className="sidebar-avatar">
          {user?.name?.charAt(0)?.toUpperCase() || "D"}
        </div>

        {!collapsed && (
          <div className="sidebar-user-info">
            <strong title={user?.name || "Food Donor"}>
              {user?.name || "Food Donor"}
            </strong>
            <span className="sidebar-role-badge">
              <HeartHandshake size={12} /> Food Donor
            </span>
          </div>
        )}
      </div>

      {/* ==================================================
          NAVIGATION LINKS
      ================================================== */}
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

      {/* ==================================================
          LOGOUT / FOOTER
      ================================================== */}
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

export default DonorSidebar;
