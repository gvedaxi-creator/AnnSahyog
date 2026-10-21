import { useEffect, useState } from "react";
import {
  Bell,
  ClipboardList,
  Truck,
} from "lucide-react";
import BackButton from "../../components/BackButton";
import Footer from "../../components/Footer";
import NgoSidebar from "../../components/NgoSidebar";
import { getNotifications, markNotificationAsRead } from "../../services/api";

function NgoNotifications() {
  const user = JSON.parse(localStorage.getItem("user") || "null");

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("ALL");

  const fetchNotifs = async () => {
    if (!user?.user_id) return;
    try {
      setLoading(true);
      const data = await getNotifications(user.user_id);
      setNotifications(data.notifications || []);
    } catch (err) {
      console.error("Notifications error:", err);
      setError(err.message || "Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, [user?.user_id]);

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId, user.user_id);
      setNotifications((prev) =>
        prev.map((n) =>
          n.notification_id === notificationId
            ? { ...n, status: "READ" }
            : n
        )
      );
    } catch (err) {
      console.error("Mark as read error:", err);
    }
  };

  const filtered = notifications.filter((n) => {
    if (filter === "UNREAD") return n.status === "UNREAD";
    return true;
  });

  const unreadCount = notifications.filter((n) => n.status === "UNREAD").length;

  return (
    <div className="donor-layout ngo-layout">
      <NgoSidebar />

      <main className="donor-main ngo-main">
        <div className="dashboard-page ngo-dashboard-page">
          <div className="container">
            <div className="page-back-bar">
              <BackButton />
            </div>

            {/* Header */}
            <div className="dashboard-header ngo-header">
              <div>
                <span className="dashboard-eyebrow ngo-eyebrow">
                  ACTIVITY FEED
                </span>
                <h1>Notifications</h1>
                <p>
                  Real-time alerts regarding claim approvals, volunteer dispatches,
                  and platform verification updates.
                </p>
              </div>

              <div className="admin-stat-pills">
                <span className="pill-badge pill-total">
                  Total: {notifications.length}
                </span>
                {unreadCount > 0 && (
                  <span className="pill-badge pill-pending">
                    Unread: {unreadCount}
                  </span>
                )}
              </div>
            </div>

            {error && <div className="form-error">{error}</div>}

            {/* Filter Toggle */}
            <div className="admin-toolbar">
              <div className="admin-filter-group">
                <div className="filter-item">
                  <label>Filter</label>
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="admin-select"
                  >
                    <option value="ALL">All Notifications</option>
                    <option value="UNREAD">Unread Only</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Notifications List */}
            <div className="admin-card-section">
              {loading ? (
                <div className="admin-loading-state">
                  <p>Loading notifications...</p>
                </div>
              ) : filtered.length === 0 ? (
                <div className="admin-empty-state">
                  <div className="empty-icon"><Bell size={26} /></div>
                  <h3>No notifications found</h3>
                  <p>You're all caught up with your updates.</p>
                </div>
              ) : (
                <div className="ngo-notifications-list">
                  {filtered.map((n) => (
                    <article
                      key={n.notification_id}
                      className={`ngo-notif-item ${
                        n.status === "UNREAD" ? "notif-unread" : ""
                      }`}
                    >
                      <div className="notif-icon-col">
                        {n.type === "REQUEST" ? (
                          <ClipboardList size={18} />
                        ) : n.type === "DELIVERY" ? (
                          <Truck size={18} />
                        ) : (
                          <Bell size={18} />
                        )}
                      </div>
                      <div className="notif-body-col">
                        <p className="notif-message">{n.message}</p>
                        <span className="notif-time">
                          {new Date(n.created_date).toLocaleString()}
                        </span>
                      </div>
                      <div className="notif-action-col">
                        {n.status === "UNREAD" && (
                          <button
                            type="button"
                            onClick={() => handleMarkAsRead(n.notification_id)}
                            className="btn-mark-read"
                          >
                            Mark as read
                          </button>
                        )}
                      </div>
                    </article>
                  ))}
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

export default NgoNotifications;
