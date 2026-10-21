import { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Bike,
  History,
  Bell,
  User,
  LogOut,
  Coffee,
  Zap,
} from "lucide-react";
import { updateVolunteerAvailability, getUnreadNotificationCount } from "../services/api";

function VolunteerSidebar({
  activeDeliveryId = null,
  currentAvailability = null,
  onAvailabilityChange = null,
}) {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "null");
  const [availability, setAvailability] = useState(
    currentAvailability || user?.availability || "AVAILABLE"
  );
  const [updatingDuty, setUpdatingDuty] = useState(false);
  const [unreadNotifs, setUnreadNotifs] = useState(0);

  useEffect(() => {
    if (currentAvailability) {
      setAvailability(currentAvailability);
    }
  }, [currentAvailability]);

  useEffect(() => {
    if (user?.user_id) {
      getUnreadNotificationCount(user.user_id)
        .then((res) => setUnreadNotifs(res.unread_count || 0))
        .catch(() => {});
    }
  }, [user?.user_id]);

  const handleToggleAvailability = async () => {
    if (!user?.volunteer_id) return;
    const newStatus = availability === "AVAILABLE" ? "UNAVAILABLE" : "AVAILABLE";
    try {
      setUpdatingDuty(true);
      await updateVolunteerAvailability(user.volunteer_id, newStatus);
      setAvailability(newStatus);
      user.availability = newStatus;
      localStorage.setItem("user", JSON.stringify(user));
      if (onAvailabilityChange) {
        onAvailabilityChange(newStatus);
      }
    } catch (err) {
      console.error("Failed to toggle duty status:", err);
      alert(err.message || "Failed to update availability status");
    } finally {
      setUpdatingDuty(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  const menuItems = [
    {
      to: "/volunteer/dashboard",
      icon: LayoutDashboard,
      label: "Dashboard",
    },
    {
      to: "/volunteer/tasks",
      icon: Bike,
      label: "Rescue Tasks",
    },
    {
      to: "/volunteer/history",
      icon: History,
      label: "Activity History",
    },
    {
      to: "/volunteer/notifications",
      icon: Bell,
      label: "Notifications",
      badge: unreadNotifs > 0 ? unreadNotifs : null,
    },
    {
      to: "/volunteer/profile",
      icon: User,
      label: "My Profile",
    },
  ];

  const isAvailable = availability === "AVAILABLE";

  return (
    <aside
      className={`donor-sidebar vol-sidebar ${
        collapsed ? "sidebar-collapsed" : "sidebar-expanded"
      }`}
    >
      {/* =========================
          HEADER / LOGO
      ========================= */}
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

      {/* =========================
          VOLUNTEER USER BADGE
      ========================= */}
      <div className="sidebar-user vol-user-wrap">
        <div className="sidebar-avatar vol-avatar">
          {user?.name?.charAt(0)?.toUpperCase() || "V"}
        </div>

        {!collapsed && (
          <div className="sidebar-user-info">
            <strong title={user?.name || "Volunteer"}>
              {user?.name || "Rescue Volunteer"}
            </strong>
            <span className="vol-role-pill">
              <Bike size={12} /> Food Rescue Hero
            </span>
          </div>
        )}
      </div>

      {/* =========================
          DUTY / AVAILABILITY CARD
      ========================= */}
      {!collapsed ? (
        <div className="vol-sidebar-duty-card">
          <div className="vol-sidebar-duty-header">
            <span className="vol-sidebar-duty-title">Rescue Duty</span>
            <span
              className={`vol-sidebar-duty-status ${
                isAvailable ? "status-on" : "status-off"
              }`}
            >
              <span className="vol-duty-indicator-dot"></span>
              {isAvailable ? "On Duty" : "Off Duty"}
            </span>
          </div>

          <button
            type="button"
            className={`vol-sidebar-duty-btn ${
              isAvailable ? "btn-on-duty" : "btn-off-duty"
            }`}
            onClick={handleToggleAvailability}
            disabled={updatingDuty}
          >
            {updatingDuty ? (
              "Updating..."
            ) : isAvailable ? (
              <>
                <Coffee size={14} /> Take a Break
              </>
            ) : (
              <>
                <Zap size={14} /> Go On Duty
              </>
            )}
          </button>
        </div>
      ) : (
        <div
          className="vol-sidebar-duty-collapsed"
          onClick={handleToggleAvailability}
          title={`Duty: ${isAvailable ? "On Duty" : "Off Duty"} (Click to toggle)`}
        >
          <span
            className={`duty-collapsed-dot ${
              isAvailable ? "dot-on" : "dot-off"
            }`}
          ></span>
        </div>
      )}

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
              className={({ isActive }) =>
                `sidebar-link ${isActive ? "active" : ""}`
              }
              aria-label={item.label}
              title={collapsed ? item.label : undefined}
            >
              <span className="sidebar-icon">
                <IconComponent size={19} />
              </span>

              {!collapsed && (
                <span className="sidebar-label">{item.label}</span>
              )}

              {!collapsed && item.badge && (
                <span className="sidebar-badge">{item.badge}</span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* =========================
          LOGOUT / BOTTOM
      ========================= */}
      <div className="sidebar-bottom">
        <button
          type="button"
          className="sidebar-link logout-link"
          onClick={handleLogout}
          title={collapsed ? "Log out" : undefined}
        >
          <span className="sidebar-icon">
            <LogOut size={19} />
          </span>
          {!collapsed && <span className="sidebar-label">Log out</span>}
        </button>
      </div>
    </aside>
  );
}

export default VolunteerSidebar;
