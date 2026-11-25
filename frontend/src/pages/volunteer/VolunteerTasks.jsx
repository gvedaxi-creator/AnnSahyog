import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import VolunteerSidebar from "../../components/VolunteerSidebar";
import StatusBadge from "../../components/StatusBadge";
import { getPickupStatus } from "../../utils/status";
import BackButton from "../../components/BackButton";
import Footer from "../../components/Footer";
import { getVolunteerTasks, acceptVolunteerTask } from "../../services/api";
import {
  Bike,
  Search,
  X,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  Zap,
  Flag,
} from "lucide-react";

// Google Maps directions link (opens the Maps app on mobile).
// Uses coordinates when we have them, otherwise the address text.
const coordsOrText = (lat, lng, text) =>
  lat != null && lng != null ? `${lat},${lng}` : text;

const mapsDirectionsUrl = (destination, origin) => {
  const params = new URLSearchParams({ api: "1", destination, travelmode: "driving" });
  if (origin) params.set("origin", origin);
  return `https://www.google.com/maps/dir/?${params.toString()}`;
};

function VolunteerTasks() {
  const user = JSON.parse(localStorage.getItem("user") || "null");

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState("ALL"); // ALL, MY_TASKS, OPEN, DELIVERED
  const [searchTerm, setSearchTerm] = useState("");
  const [acceptingId, setAcceptingId] = useState(null);

  const loadTasks = async () => {
    if (!user?.volunteer_id) return;
    try {
      setLoading(true);
      const res = await getVolunteerTasks(user.volunteer_id);
      setTasks(res.tasks || []);
    } catch (err) {
      console.error("Error loading tasks:", err);
      setError(err.message || "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [user?.volunteer_id]);

  const handleAcceptTask = async (pickupId) => {
    if (!user?.volunteer_id) return;
    try {
      setError("");
      setAcceptingId(pickupId);
      await acceptVolunteerTask(pickupId, user.volunteer_id);
      setSuccess("Task accepted! You are now the assigned driver.");
      setTimeout(() => setSuccess(""), 4000);
      loadTasks();
    } catch (err) {
      setError(err.message || "Failed to accept task");
      loadTasks();
    } finally {
      setAcceptingId(null);
    }
  };

  // Filter tasks based on activeTab and searchTerm
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.food_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.pickup_location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.delivery_location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.donor_name?.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (activeTab === "MY_TASKS") {
      return task.volunteer_id === user?.volunteer_id && task.status !== "DELIVERED";
    }
    if (activeTab === "OPEN") {
      return task.task_assignment_type === "OPEN";
    }
    if (activeTab === "DELIVERED") {
      return task.status === "DELIVERED";
    }
    return true; // ALL
  });

  const isAvailable = user?.availability === "AVAILABLE";

  return (
    <div className="donor-layout vol-layout">
      <VolunteerSidebar />

      <main className="donor-main vol-main">
        <div className="vol-content">
          <div className="page-back-bar">
            <BackButton />
          </div>

          {/* HEADER */}
          <div className="vol-page-header">
            <div className="vol-header-top">
              <div>
                <span className="dashboard-eyebrow">RESCUE MISSIONS</span>
                <h1>Food Rescue Tasks</h1>
                <p>
                  Your pickups, plus open rescues in your area that still need a driver. Tasks nobody accepts are assigned by the admin.
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="auth-alert alert-error" style={{ marginBottom: "1.25rem" }}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="auth-alert alert-success" style={{ marginBottom: "1.25rem" }}>
              <CheckCircle2 size={18} />
              <span>{success}</span>
            </div>
          )}
          {/* TABS & SEARCH BAR */}
          <div className="vol-toolbar">
            <div className="vol-tab-group">
              <button
                className={`vol-tab-btn ${activeTab === "ALL" ? "active" : ""}`}
                onClick={() => setActiveTab("ALL")}
              >
                All Tasks ({tasks.length})
              </button>
              <button
                className={`vol-tab-btn ${activeTab === "MY_TASKS" ? "active" : ""}`}
                onClick={() => setActiveTab("MY_TASKS")}
              >
                My Active Tasks ({tasks.filter((t) => t.volunteer_id === user?.volunteer_id && t.status !== "DELIVERED").length})
              </button>
              <button
                className={`vol-tab-btn ${activeTab === "OPEN" ? "active" : ""}`}
                onClick={() => setActiveTab("OPEN")}
              >
                Open in My Area ({tasks.filter((t) => t.task_assignment_type === "OPEN").length})
              </button>
              <button
                className={`vol-tab-btn ${activeTab === "DELIVERED" ? "active" : ""}`}
                onClick={() => setActiveTab("DELIVERED")}
              >
                Completed ({tasks.filter((t) => t.status === "DELIVERED").length})
              </button>
            </div>

            <div className="vol-search-wrap">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search food, donor, pickup address..."
                className="vol-search-input"
              />
              {searchTerm && (
                <button
                  type="button"
                  className="clear-search-btn"
                  onClick={() => setSearchTerm("")}
                  aria-label="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* TASKS LIST */}
          {loading ? (
            <div className="dashboard-empty-card">
              <div className="food-spinner"></div>
              <p>Loading rescue tasks...</p>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="dashboard-empty-card">
              <div className="empty-icon-wrap">
                <Bike size={36} />
              </div>
              <h3>No rescue tasks found</h3>
              <p>Try clearing your search query or check back shortly for new rescues in your area.</p>
            </div>
          ) : (
            <div className="vol-tasks-grid">
              {filteredTasks.map((task) => {
                const isAssignedToMe = task.volunteer_id === user?.volunteer_id;
                const isOpen = task.task_assignment_type === "OPEN";

                return (
                  <article key={task.pickup_id} className="vol-task-card-item">
                    <div className="task-card-header">
                      <div className="task-header-left">
                        <span className="task-num-badge">TASK #{task.pickup_id}</span>
                        <h3>{task.quantity} {task.unit} {task.food_type}</h3>
                      </div>

                      <StatusBadge status={getPickupStatus(task.status, task.volunteer_id)} />
                    </div>

                    <div className="task-route-block">
                      <div className="route-point">
                        <div className="route-marker marker-pickup"><MapPin size={15} /></div>
                        <div className="route-details">
                          <small>Pickup Point (Donor: {task.donor_name || "Food Donor"})</small>
                          <strong>{task.pickup_address || task.pickup_location || "Ahmedabad"}</strong>
                        </div>
                      </div>

                      <div className="route-connector-line"></div>

                      <div className="route-point">
                        <div className="route-marker marker-drop"><Flag size={15} /></div>
                        <div className="route-details">
                          <small>Delivery Destination (Receiving Shelter)</small>
                          <strong>{task.delivery_location || "Community Center"}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="task-card-meta-row">
                      {task.expiry_date && (
                        <span className="task-expiry-tag">
                          <Clock size={12} /> Pickup by: {new Date(task.expiry_date).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                        </span>
                      )}
                      <span className="task-city-tag">
                        <MapPin size={12} /> {task.city || "Ahmedabad"}
                      </span>
                    </div>

                    <div className="task-card-actions">
                      <a
                        href={mapsDirectionsUrl(coordsOrText(task.pickup_latitude, task.pickup_longitude, `${task.pickup_address || task.pickup_location || ""}${task.city ? ", " + task.city : ""}`))}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-secondary btn-sm"
                      >
                        Pickup Directions
                      </a>

                      <a
                        href={mapsDirectionsUrl(coordsOrText(task.delivery_latitude, task.delivery_longitude, task.delivery_location || ""), coordsOrText(task.pickup_latitude, task.pickup_longitude, `${task.pickup_address || task.pickup_location || ""}${task.city ? ", " + task.city : ""}`))}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-secondary btn-sm"
                      >
                        Delivery Directions
                      </a>

                      <Link to={`/volunteer/tasks/${task.pickup_id}`} className="btn btn-secondary btn-sm">
                        Inspect Route
                      </Link>

                      {isOpen && (
                        <button
                          type="button"
                          className="btn btn-primary btn-sm btn-accept-task"
                          onClick={() => handleAcceptTask(task.pickup_id)}
                          disabled={acceptingId === task.pickup_id || !isAvailable}
                          title={!isAvailable ? "Go on duty to accept tasks" : ""}
                        >
                          <Zap size={14} />
                          <span>
                            {acceptingId === task.pickup_id ? "Accepting..." : "Accept Task"}
                          </span>
                        </button>
                      )}

                      {isAssignedToMe && task.status !== "DELIVERED" && (
                        <Link
                          to={`/volunteer/active/${task.pickup_id}`}
                          className="btn btn-primary btn-sm btn-track-active"
                        >
                          <span>Live Delivery Tracker →</span>
                        </Link>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
        <Footer variant="app" />
      </main>
    </div>
  );
}

export default VolunteerTasks;
