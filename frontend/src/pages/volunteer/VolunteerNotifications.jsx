import { useEffect, useState } from "react";
import VolunteerSidebar from "../../components/VolunteerSidebar";
import BackButton from "../../components/BackButton";
import Footer from "../../components/Footer";
import { getNotifications, markNotificationAsRead } from "../../services/api";
import {
  Bell,
  Truck,
  Package,
  CheckCircle2,
  Inbox,
  Calendar,
} from "lucide-react";

function VolunteerNotifications() {
  const user = JSON.parse(localStorage.getItem("user") || "null");

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("ALL"); // ALL or UNREAD

  const loadNotifs = async () => {
    if (!user?.user_id) return;
    try {
      setLoading(true);
      const res = await getNotifications(user.user_id);
      setNotifications(res.notifications || []);
    } catch (err) {
      console.error("Notifications error:", err);
      setError(err.message || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifs();
  }, [user?.user_id]);

  const handleMarkAsRead = async (notifId) => {
    try {
      await markNotificationAsRead(notifId, user.user_id);
      setNotifications(
        notifications.map((n) =>
          n.notification_id === notifId ? { ...n, status: "READ" } : n
        )
      );
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  const filtered = notifications.filter((n) => {
    if (filter === "UNREAD") return n.status === "UNREAD";
    return true;
  });

  const getNotifIcon = (type) => {
    if (type === "DELIVERY" || type === "PICKUP") return <Truck size={18} className="text-moss" />;
    if (type === "REQUEST" || type === "CLAIM") return <Package size={18} className="text-orange" />;
    return <Bell size={18} className="text-moss" />;
  };

  return (
    <div className="donor-layout vol-layout">
      <VolunteerSidebar />

      <main className="donor-main vol-main">
        <div className="vol-content">
          <div className="page-back-bar">
            <BackButton />
          </div>

          <div className="vol-page-header">
            <div className="vol-header-top">
              <div>
                <span className="dashboard-eyebrow">ACTIVITY FEED</span>
                <h1>Rescue Notifications</h1>
                <p>Stay informed on new food pickup requests, delivery confirmations, and team messages.</p>
              </div>
            </div>
          </div>

          {error && (
            <div className="vol-alert vol-alert-error" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span>{error}</span>
            </div>
          )}

          {/* TOOLBAR */}
          <div className="vol-toolbar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
            <div className="vol-tab-group" style={{ display: "flex", gap: "0.5rem" }}>
              <button
                className={`vol-tab-btn ${filter === "ALL" ? "active" : ""}`}
                onClick={() => setFilter("ALL")}
              >
                All ({notifications.length})
              </button>
              <button
                className={`vol-tab-btn ${filter === "UNREAD" ? "active" : ""}`}
                onClick={() => setFilter("UNREAD")}
              >
                Unread ({notifications.filter((n) => n.status === "UNREAD").length})
              </button>
            </div>
          </div>

          {/* LIST */}
          {loading ? (
            <div className="vol-loading" style={{ padding: "3rem", textAlign: "center", color: "var(--muted)" }}>
              Loading notifications...
            </div>
          ) : filtered.length === 0 ? (
            <div className="vol-empty-state" style={{ padding: "3.5rem 1.5rem", textAlign: "center", background: "#fff", borderRadius: "14px", border: "1px dashed var(--sand-3)" }}>
              <div className="empty-icon" style={{ display: "inline-flex", padding: "1rem", borderRadius: "50%", background: "var(--sand-1)", color: "var(--moss)", marginBottom: "1rem" }}>
                <Inbox size={32} />
              </div>
              <h3 style={{ fontSize: "1.15rem", fontWeight: "700", marginBottom: "0.25rem" }}>No notifications</h3>
              <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>You're all caught up with your rescue alerts!</p>
            </div>
          ) : (
            <div className="vol-notif-list" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {filtered.map((notif) => (
                <div
                  key={notif.notification_id}
                  className={`vol-notif-card ${notif.status === "UNREAD" ? "unread" : ""}`}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "1rem",
                    padding: "1rem 1.25rem",
                    background: notif.status === "UNREAD" ? "rgba(46, 125, 50, 0.04)" : "#fff",
                    border: notif.status === "UNREAD" ? "1px solid rgba(46, 125, 50, 0.25)" : "1px solid var(--sand-2)",
                    borderRadius: "12px",
                    transition: "all 0.2s ease"
                  }}
                >
                  <div
                    className="vol-notif-icon"
                    style={{
                      width: "38px",
                      height: "38px",
                      borderRadius: "10px",
                      background: notif.status === "UNREAD" ? "var(--sand-1)" : "var(--sand-2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0
                    }}
                  >
                    {getNotifIcon(notif.type)}
                  </div>
                  <div className="vol-notif-body" style={{ flex: 1 }}>
                    <div className="vol-notif-title" style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: "700", fontSize: "0.95rem" }}>
                      <span>{notif.type || "Rescue Update"}</span>
                      {notif.status === "UNREAD" && (
                        <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "var(--orange)", display: "inline-block" }}></span>
                      )}
                    </div>
                    <div className="vol-notif-message" style={{ fontSize: "0.9rem", color: "var(--text)", margin: "0.25rem 0 0.5rem" }}>
                      {notif.message}
                    </div>
                    <div className="vol-notif-time" style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.78rem", color: "var(--muted)" }}>
                      <Calendar size={12} />
                      {new Date(notif.created_date).toLocaleString([], {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </div>
                  </div>
                  {notif.status === "UNREAD" && (
                    <button
                      onClick={() => handleMarkAsRead(notif.notification_id)}
                      className="btn-mark-read"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.35rem",
                        padding: "0.4rem 0.75rem",
                        fontSize: "0.8rem",
                        fontWeight: "600",
                        borderRadius: "8px",
                        border: "1px solid var(--moss)",
                        background: "transparent",
                        color: "var(--moss)",
                        cursor: "pointer"
                      }}
                    >
                      <CheckCircle2 size={13} /> Mark Read
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        <Footer variant="app" />
      </main>
    </div>
  );
}

export default VolunteerNotifications;
