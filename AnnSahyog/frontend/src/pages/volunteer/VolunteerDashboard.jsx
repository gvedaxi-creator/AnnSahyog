import { formatPhone } from "../../utils/phone";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import VolunteerSidebar from "../../components/VolunteerSidebar";
import StatusBadge from "../../components/StatusBadge";
import { getStatusLabel } from "../../utils/status";
import Footer from "../../components/Footer";
import {
  Navigation,
  MapPin,
  Flag,
  Bike,
  Package,
  CheckCircle2,
  Utensils,
  ClipboardList,
  Siren,
  Zap,
  Clock,
  Check,
  Search,
  CircleDot,
  PauseCircle,
  ArrowRight,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import {
  getVolunteerDashboard,
  getVolunteerTasks,
  acceptVolunteerTask,
  updateVolunteerAvailability,
} from "../../services/api";

function VolunteerDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "null");

  const [dashboardData, setDashboardData] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [acceptingId, setAcceptingId] = useState(null);

  const loadData = async () => {
    if (!user?.volunteer_id) {
      setError("Volunteer profile details not found. Please log in again.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [dashRes, tasksRes] = await Promise.all([
        getVolunteerDashboard(user.volunteer_id),
        getVolunteerTasks(user.volunteer_id),
      ]);

      setDashboardData(dashRes);
      setTasks(tasksRes.tasks || []);
    } catch (err) {
      console.error("Dashboard error:", err);
      setError(err.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.volunteer_id]);

  const handleAcceptTask = async (pickupId) => {
    if (!user?.volunteer_id) return;
    try {
      setError("");
      setAcceptingId(pickupId);
      await acceptVolunteerTask(pickupId, user.volunteer_id);
      setActionSuccess("Rescue task accepted! You are now the assigned driver.");
      setTimeout(() => setActionSuccess(""), 4000);
      loadData();
    } catch (err) {
      setError(err.message || "Failed to accept task");
      loadData();
    } finally {
      setAcceptingId(null);
    }
  };

  const handleDutyToggle = (newStatus) => {
    if (dashboardData) {
      setDashboardData({
        ...dashboardData,
        volunteer: { ...dashboardData.volunteer, availability: newStatus },
        stats: { ...dashboardData.stats, availability: newStatus },
      });
    }
  };

  const activeTask = dashboardData?.active_task;
  const stats = dashboardData?.stats || {};
  const isAvailable = (dashboardData?.volunteer?.availability || user?.availability) === "AVAILABLE";

  const openTasks = tasks.filter((t) => t.task_assignment_type === "OPEN").slice(0, 3);
  const myAssignedTasks = tasks.filter(
    (t) => t.volunteer_id === user?.volunteer_id && t.status !== "DELIVERED"
  );

  return (
    <div className="donor-layout vol-layout">
      <VolunteerSidebar
        activeDeliveryId={activeTask?.pickup_id}
        currentAvailability={dashboardData?.volunteer?.availability}
        onAvailabilityChange={handleDutyToggle}
      />

      <main className="donor-main vol-main">
        {/* DUTY STATUS BANNER */}
        <div className={`vol-banner ${isAvailable ? "banner-duty-on" : "banner-duty-off"}`}>
          <div className="banner-content">
            <span className="banner-icon" aria-hidden="true">{isAvailable ? <CircleDot size={16} /> : <PauseCircle size={16} />}</span>
            <span>
              {isAvailable
                ? "You are currently ON DUTY. Accept open rescues in your area, or the admin may assign you one."
                : "You are currently OFF DUTY. Switch on duty to accept rescue tasks in your area."}
            </span>
          </div>
          <button
            onClick={() => {
              const newStatus = isAvailable ? "UNAVAILABLE" : "AVAILABLE";
              updateVolunteerAvailability(user.volunteer_id, newStatus).then(() => handleDutyToggle(newStatus));
            }}
            className="banner-toggle-btn"
          >
            {isAvailable ? "Take a Break" : "Go On Duty"}
          </button>
        </div>

        <div className="vol-content">

          {/* HEADER */}
          <div className="vol-page-header">
            <div className="vol-header-top">
              <div>
                <span className="dashboard-eyebrow">RESCUE MISSION CONTROL</span>
                <h1>Volunteer Mission Control</h1>
                <p>
                  Welcome back, <strong>{user?.name || "Rescue Hero"}</strong>! Every meal you move feeds someone in need today.
                </p>
              </div>
              <div className="vol-header-actions">
                <Link to="/volunteer/tasks" className="vol-btn-primary">
                  <Search size={16} />
                  <span>Find Rescues</span>
                </Link>
              </div>
            </div>
          </div>

          {error && <div className="vol-alert vol-alert-error"><AlertCircle size={17} /><span>{error}</span></div>}
          {actionSuccess && <div className="vol-alert vol-alert-success"><CheckCircle2 size={17} /><span>{actionSuccess}</span></div>}

          {/* ACTIVE RESCUE IN PROGRESS ALERT CARD */}
          {activeTask && (
            <div className="vol-active-rescue-card">
              <div className="active-card-badge"><Navigation size={13} /> Active rescue in progress</div>
              <div className="active-card-body">
                <div className="active-card-info">
                  <h3>
                    Delivering {activeTask.quantity} {activeTask.unit} of {activeTask.food_type}
                  </h3>
                  <p>
                    <MapPin size={14} aria-hidden="true" /> <strong>Pickup:</strong> {activeTask.pickup_location} (Donor: {activeTask.donor_name}, {formatPhone(activeTask.donor_phone)})
                  </p>
                  <p>
                    <Flag size={14} aria-hidden="true" /> <strong>Destination:</strong> {activeTask.delivery_location}
                  </p>
                  <div className="active-status-tag">
                    Current Milestone: <strong>{getStatusLabel(activeTask.status)}</strong>
                  </div>
                </div>
                <div className="active-card-actions">
                  <button
                    onClick={() => navigate(`/volunteer/active/${activeTask.pickup_id}`)}
                    className="btn-resume-delivery"
                  >
                    <Navigation size={16} /> <span>Open Live Tracker</span> <ArrowRight size={15} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STATS GRID */}
          <div className="dashboard-stats-grid">
            <div className="stat-card">
              <div className="stat-icon-wrap icon-green">
                <Bike size={22} />
              </div>
              <div className="stat-body">
                <span>Active Deliveries</span>
                <strong>{stats.active_tasks ?? 0}</strong>
                <small>In progress</small>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon-wrap icon-amber">
                <Package size={22} />
              </div>
              <div className="stat-body">
                <span>Open Rescues</span>
                <strong>{stats.open_tasks ?? 0}</strong>
                <small>In your area, waiting for a driver</small>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon-wrap icon-blue">
                <CheckCircle2 size={22} />
              </div>
              <div className="stat-body">
                <span>Rescues Completed</span>
                <strong>{stats.completed_tasks ?? 0}</strong>
                <small>All time</small>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon-wrap icon-orange">
                <Utensils size={22} />
              </div>
              <div className="stat-body">
                <span>Meals Provided</span>
                <strong>{stats.estimated_meals ?? 0}</strong>
                <small>~{stats.total_kg_delivered ?? 0} kg food</small>
              </div>
            </div>
          </div>

          {/* TWO COLUMN WORKFLOW SECTION */}
          <div className="vol-dashboard-grid">
            {/* MY ASSIGNED TASKS */}
            <div className="vol-section-card">
              <div className="section-card-header">
                <h2><ClipboardList size={19} /> My Assigned Tasks ({myAssignedTasks.length})</h2>
                <Link to="/volunteer/tasks" className="link-see-all">
                  View all <ArrowRight size={14} />
                </Link>
              </div>

              {myAssignedTasks.length === 0 ? (
                <div className="vol-empty-state">
                  <div className="empty-icon"><Bike size={26} /></div>
                  <p>You have no pickups right now. Accept an open rescue nearby, or the admin may assign you one.</p>
                  <Link to="/volunteer/tasks" className="btn-secondary-sm">
                    Browse Open Rescues
                  </Link>
                </div>
              ) : (
                <div className="vol-task-list">
                  {myAssignedTasks.map((task) => (
                    <div key={task.pickup_id} className="vol-task-item">
                      <div className="task-item-main">
                        <div className="task-item-title">
                          <strong>
                            {task.quantity} {task.unit} {task.food_type}
                          </strong>
                          <StatusBadge status={task.status} />
                        </div>
                        <div className="task-item-meta">
                          <span><MapPin size={13} /> Pickup: {task.pickup_address || task.pickup_location}</span>
                          <span><Flag size={13} /> Drop-off: {task.delivery_location}</span>
                        </div>
                      </div>
                      <div className="task-item-actions">
                        <Link to={`/volunteer/tasks/${task.pickup_id}`} className="btn-outline-sm">
                          Details
                        </Link>
                        <Link to={`/volunteer/active/${task.pickup_id}`} className="btn-primary-sm">
                          {task.status === "ASSIGNED" ? "Start Pickup" : "Track Delivery"}
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* OPEN RESCUES IN YOUR AREA */}
            <div className="vol-section-card">
              <div className="section-card-header">
                <h2><Siren size={19} /> Open Rescues in Your Area ({stats.open_tasks ?? openTasks.length})</h2>
                <Link to="/volunteer/tasks" className="link-see-all">
                  Browse all <ArrowRight size={14} />
                </Link>
              </div>

              {openTasks.length === 0 ? (
                <div className="vol-empty-state">
                  <div className="empty-icon"><Sparkles size={26} /></div>
                  <p>No open rescues in your area right now. Great job!</p>
                </div>
              ) : (
                <div className="vol-task-list">
                  {openTasks.map((task) => (
                    <div key={task.pickup_id} className="vol-task-item open-task-item">
                      <div className="task-item-main">
                        <div className="task-item-title">
                          <strong>
                            {task.quantity} {task.unit} {task.food_type}
                          </strong>
                          <span className="vol-urgency-badge"><Zap size={12} /> Needs a driver</span>
                        </div>
                        <div className="task-item-meta">
                          <span><MapPin size={13} /> From: {task.pickup_address || task.pickup_location}</span>
                          <span><Flag size={13} /> To: {task.delivery_location}</span>
                          {task.expiry_date && (
                            <span className="expiry-hint">
                              <Clock size={12} /> Pickup by: {new Date(task.expiry_date).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="task-item-actions">
                        <Link to={`/volunteer/tasks/${task.pickup_id}`} className="btn-outline-sm">
                          Inspect
                        </Link>
                        <button
                          onClick={() => handleAcceptTask(task.pickup_id)}
                          disabled={acceptingId === task.pickup_id || !isAvailable}
                          className="btn-accept-sm"
                          title={!isAvailable ? "Go on duty to accept tasks" : ""}
                        >
                          {acceptingId === task.pickup_id ? "Accepting..." : (<><Check size={14} /> Accept Task</>)}
                        </button>
                      </div>
                    </div>
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

export default VolunteerDashboard;
