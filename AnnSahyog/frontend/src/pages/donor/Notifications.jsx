import { useEffect, useState } from "react";
import BackButton from "../../components/BackButton";
import Footer from "../../components/Footer";
import DonorSidebar from "../../components/DonorSidebar";
import NgoSidebar from "../../components/NgoSidebar";
import { getNotifications, markNotificationAsRead } from "../../services/api";
import {
  Bell,
  Utensils,
  Mail,
  Truck,
  PackageCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  Inbox,
} from "lucide-react";

function Notifications() {
  const user = JSON.parse(localStorage.getItem("user") || "null");

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadNotifications = async () => {
      if (!user?.user_id) {
        if (cancelled) return;
        setError("User information is missing. Please login again.");
        setLoading(false);
        return;
      }

      try {
        const data = await getNotifications(user.user_id);
        if (cancelled) return;
        setNotifications(data.notifications || []);
        setError("");
        setLoading(false);
      } catch (err) {
        if (cancelled) return;
        console.error("Notification error:", err);
        setError(err.message || "Failed to load notifications.");
        setLoading(false);
      }
    };

    loadNotifications();

    return () => {
      cancelled = true;
    };
  }, [user?.user_id]);

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId, user.user_id);
      setNotice("Notification marked as read");
      setTimeout(() => setNotice(""), 3000);
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.notification_id === notificationId
            ? { ...notification, status: "READ" }
            : notification
        )
      );
    } catch (err) {
      console.error("Mark notification as read error:", err);
      setError(err.message || "Failed to mark notification as read.");
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "DONATION":
        return Utensils;
      case "REQUEST":
        return Mail;
      case "ASSIGNMENT":
      case "PICKUP":
        return Truck;
      case "DELIVERY":
        return PackageCheck;
      default:
        return Bell;
    }
  };

  const getNotificationLabel = (type) => {
    switch (type) {
      case "DONATION":
        return "Donation Update";
      case "REQUEST":
        return "NGO Claim Request";
      case "ASSIGNMENT":
        return "Courier Dispatched";
      case "DELIVERY":
        return "Delivery Complete";
      default:
        return "Activity Notification";
    }
  };

  const formatDate = (date) => {
    if (!date) return "Just now";
    return new Date(date).toLocaleString([], {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const unreadCount = notifications.filter(
    (notification) => notification.status === "UNREAD"
  ).length;

  return (
    <div className={`donor-layout ${user?.role === "NGO" ? "ngo-layout" : ""}`}>
      {user?.role === "NGO" ? <NgoSidebar /> : <DonorSidebar />}

      <main className={`donor-main ${user?.role === "NGO" ? "ngo-main" : ""}`}>
        <div className="dashboard-page">
          <div className="container">
            <div className="page-back-bar">
              <BackButton />
            </div>

            {/* Header */}
            <div className="dashboard-header">
              <div>
                <span className="dashboard-eyebrow">ACTIVITY UPDATES</span>
                <h1>Notifications</h1>
                <p>
                  Stay updated about your surplus food listings, NGO requests, courier assignments, and completed rescues.
                </p>
              </div>

              <div className="admin-stat-pills">
                <span className="pill-badge pill-total">Total: {notifications.length}</span>
                {unreadCount > 0 && (
                  <span className="pill-badge pill-active">
                    {unreadCount} Unread
                  </span>
                )}
              </div>
            </div>

            {notice && (
              <div className="auth-alert alert-success" role="status">
                {notice}
              </div>
            )}
            {error && (
              <div className="auth-alert alert-error" style={{ marginBottom: "1.5rem" }}>
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            {loading && (
              <div className="dashboard-empty-card">
                <div className="food-spinner"></div>
                <h3>Loading notifications...</h3>
                <p>Checking for your latest rescue network updates.</p>
              </div>
            )}

            {!loading && !error && notifications.length === 0 && (
              <div className="dashboard-empty-card">
                <div className="empty-icon-wrap">
                  <Inbox size={36} />
                </div>
                <h3>You're all caught up!</h3>
                <p>
                  New donation requests, pickup dispatches, and delivery confirmations will appear here in real-time.
                </p>
              </div>
            )}

            {!loading && notifications.length > 0 && (
              <section className="notifications-list-container">
                {notifications.map((notification) => {
                  const unread = notification.status === "UNREAD";
                  const IconComp = getNotificationIcon(notification.type);

                  return (
                    <article
                      key={notification.notification_id}
                      className={`notification-item-card ${
                        unread ? "notification-unread" : ""
                      }`}
                    >
                      <div className={`notification-icon-wrap ${unread ? "icon-unread" : ""}`}>
                        <IconComp size={20} />
                      </div>

                      <div className="notification-main-content">
                        <div className="notification-header-row">
                          <div className="notification-tag-wrap">
                            <span className="notification-type-tag">
                              {getNotificationLabel(notification.type)}
                            </span>
                            {unread && <span className="notification-dot" />}
                          </div>

                          <span className="notification-timestamp">
                            <Clock size={12} /> {formatDate(notification.created_date || notification.created_at)}
                          </span>
                        </div>

                        <p className="notification-message-text">{notification.message}</p>

                        {unread && (
                          <button
                            type="button"
                            className="btn-mark-read"
                            onClick={() =>
                              handleMarkAsRead(notification.notification_id)
                            }
                          >
                            <CheckCircle2 size={13} />
                            <span>Mark as read</span>
                          </button>
                        )}
                      </div>
                    </article>
                  );
                })}
              </section>
            )}
          </div>
        </div>
        <Footer variant="app" />
      </main>
    </div>
  );
}

export default Notifications;
