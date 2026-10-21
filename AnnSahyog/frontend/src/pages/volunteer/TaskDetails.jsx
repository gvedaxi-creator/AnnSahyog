import { formatPhone } from "../../utils/phone";
import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import VolunteerSidebar from "../../components/VolunteerSidebar";
import StatusBadge from "../../components/StatusBadge";
import { getPickupStatus } from "../../utils/status";
import Footer from "../../components/Footer";
import { getVolunteerTaskById, acceptVolunteerTask } from "../../services/api";
import {
  ArrowLeft,
  Building2,
  MapPin,
  Phone,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Zap,
  Truck,
  AlertCircle,
} from "lucide-react";

function TaskDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "null");

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [accepting, setAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState("");

  useEffect(() => {
    const loadTask = async () => {
      try {
        setLoading(true);
        const res = await getVolunteerTaskById(id);
        setTask(res.task);
      } catch (err) {
        console.error("Error loading task details:", err);
        setError(err.message || "Failed to load task details");
      } finally {
        setLoading(false);
      }
    };

    loadTask();
  }, [id]);

  const handleAccept = async () => {
    if (!user?.volunteer_id || !task) return;
    try {
      setAcceptError("");
      setAccepting(true);
      await acceptVolunteerTask(task.pickup_id, user.volunteer_id);
      navigate(`/volunteer/active/${task.pickup_id}`);
    } catch (err) {
      setAcceptError(err.message || "Failed to accept task");
      setAccepting(false);
    }
  };

  const isAssignedToMe = task?.volunteer_id === user?.volunteer_id;
  const isUnassigned = task && !task.volunteer_id && task.status === "ASSIGNED";

  return (
    <div className="donor-layout vol-layout">
      <VolunteerSidebar />

      <main className="donor-main vol-main">
        <div className="vol-content">
          <div className="admin-back-bar">
            <Link to="/volunteer/tasks" className="admin-back-link">
              <ArrowLeft size={16} />
              <span>Back to Rescue Tasks</span>
            </Link>
          </div>

          {loading ? (
            <div className="dashboard-empty-card">
              <div className="food-spinner"></div>
              <p>Loading rescue mission details...</p>
            </div>
          ) : error || !task ? (
            <div className="dashboard-empty-card">
              <div className="empty-icon-wrap icon-danger">
                <AlertCircle size={32} />
              </div>
              <h3>Task Not Found</h3>
              <p>{error || "This rescue task ID does not exist or has expired."}</p>
              <Link to="/volunteer/tasks" className="btn btn-primary btn-sm">
                Return to Tasks
              </Link>
            </div>
          ) : (
            <div className="vol-task-detail-container">
              {/* HERO HEADER */}
              <div className="detail-hero-card">
                <div className="detail-hero-top">
                  <div>
                    <span className="hero-eyebrow">
                      MISSION #{task.pickup_id} · FOOD RESCUE CORRIDOR
                    </span>
                    <h1 className="hero-food-title">
                      {task.quantity} {task.unit} of {task.food_type}
                    </h1>
                    <p className="hero-desc">
                      {task.food_description || "Safe surplus food verified by donor and packaged for immediate transport."}
                    </p>
                  </div>

                  <StatusBadge status={getPickupStatus(task.status, task.volunteer_id)} />
                </div>

                <div className="hero-meta-badges">
                  {task.prepared_date && (
                    <span className="meta-badge">
                      <Clock size={13} /> Prepared: {new Date(task.prepared_date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  )}
                  {task.expiry_date && (
                    <span className="meta-badge badge-warning">
                      <Clock size={13} /> Pickup by: {new Date(task.expiry_date).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                    </span>
                  )}
                  <span className="meta-badge">
                    <MapPin size={13} /> City: {task.city || "Ahmedabad"}
                  </span>
                </div>
              </div>

              {/* TWO COLUMN DETAILS */}
              <div className="detail-two-col">
                {/* DONOR PICKUP CARD */}
                <div className="detail-card">
                  <div className="detail-card-header">
                    <h3>
                      <MapPin size={18} /> 1. Pickup Details (Food Donor)
                    </h3>
                  </div>
                  <div className="detail-card-body">
                    <div className="detail-row">
                      <span className="row-label">Donor Name:</span>
                      <strong className="row-val">{task.donor_name}</strong>
                    </div>
                    <div className="detail-row">
                      <span className="row-label">Contact Phone:</span>
                      <span className="row-val">
                        <a href={`tel:${task.donor_phone}`} className="phone-link">
                          <Phone size={13} /> {formatPhone(task.donor_phone) || "Not provided"}
                        </a>
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="row-label">Pickup Address:</span>
                      <strong className="row-val text-address">{task.pickup_address || task.pickup_location}</strong>
                    </div>

                    <div className="action-hint-box">
                      <Clock size={16} />
                      <div>
                        <strong>Volunteer Tip:</strong> Call the donor 10 minutes prior to arrival to confirm food is packed and ready at the entrance.
                      </div>
                    </div>
                  </div>
                </div>

                {/* NGO DELIVERY CARD */}
                <div className="detail-card">
                  <div className="detail-card-header">
                    <h3>
                      <Building2 size={18} /> 2. Delivery Destination (Receiving Shelter)
                    </h3>
                  </div>
                  <div className="detail-card-body">
                    <div className="detail-row">
                      <span className="row-label">Delivery Shelter:</span>
                      <strong className="row-val">{task.delivery_location}</strong>
                    </div>
                    <div className="detail-row">
                      <span className="row-label">Contact Person:</span>
                      <strong className="row-val">{task.ngo_contact_name || task.ngo_name || "Not provided"}</strong>
                    </div>
                    <div className="detail-row">
                      <span className="row-label">Contact Phone:</span>
                      <span className="row-val">
                        {task.ngo_contact_phone ? (
                          <a href={`tel:${task.ngo_contact_phone}`} className="phone-link">
                            <Phone size={13} /> {formatPhone(task.ngo_contact_phone)}
                          </a>
                        ) : (
                          "Not provided"
                        )}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="row-label">Assigned Courier:</span>
                      <span className="row-val">
                        {isAssignedToMe ? "You (Assigned Driver)" : task.volunteer_name || "Open: waiting for a driver"}
                      </span>
                    </div>

                    <div className="action-hint-box hint-green">
                      <ShieldCheck size={16} />
                      <div>
                        <strong>Receiving Protocol:</strong> Inspect food containers with shelter staff and request they confirm delivery receipt on their portal.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* SAFETY & HANDLING GUIDELINES */}
              <div className="vol-safety-card">
                <h3>
                  <ShieldCheck size={18} /> Food Safety & Transportation Guidelines
                </h3>
                <div className="safety-grid">
                  <div className="safety-item">
                    <span className="safety-num">1</span>
                    <div>
                      <strong>Covered & Protected</strong>
                      <p>Ensure containers remain upright, clean, and sealed during vehicular transit.</p>
                    </div>
                  </div>
                  <div className="safety-item">
                    <span className="safety-num">2</span>
                    <div>
                      <strong>Direct Transport</strong>
                      <p>Drive directly from donor pickup to the receiving shelter without detours.</p>
                    </div>
                  </div>
                  <div className="safety-item">
                    <span className="safety-num">3</span>
                    <div>
                      <strong>Timely Handover</strong>
                      <p>Aim to complete transfer within 45–60 minutes of collection for optimal freshness.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* ACTION FOOTER */}
              <div className="task-detail-action-bar">
                {isUnassigned && (
                  <button onClick={handleAccept} disabled={accepting} className="btn btn-primary btn-large btn-hero-accept">
                    <Zap size={18} />
                    <span>{accepting ? "Accepting Task..." : "Accept This Rescue Mission"}</span>
                  </button>
                )}

                {acceptError && (
                  <div className="vol-alert vol-alert-error">
                    <AlertCircle size={17} />
                    <span>{acceptError}</span>
                  </div>
                )}

                {isAssignedToMe && task.status !== "DELIVERED" && (
                  <button
                    onClick={() => navigate(`/volunteer/active/${task.pickup_id}`)}
                    className="btn btn-primary btn-large btn-hero-start"
                  >
                    <Truck size={18} />
                    <span>Launch Live Delivery Tracker →</span>
                  </button>
                )}

                {task.status === "DELIVERED" && (
                  <div className="delivered-banner">
                    <CheckCircle2 size={18} />
                    <span>This rescue mission was successfully completed and verified!</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        <Footer variant="app" />
      </main>
    </div>
  );
}

export default TaskDetails;
