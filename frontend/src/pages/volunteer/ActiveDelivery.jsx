import { formatPhone } from "../../utils/phone";
import { estimateMeals } from "../../utils/meals";
import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import VolunteerSidebar from "../../components/VolunteerSidebar";
import Footer from "../../components/Footer";
import RouteMap from "../../components/RouteMap";
import { getVolunteerTaskById, updateVolunteerTaskStatus } from "../../services/api";
import {
  Truck,
  CheckCircle2,
  Phone,
  ArrowLeft,
  ShieldCheck,
  CheckSquare,
  X,
  AlertCircle,
} from "lucide-react";

function ActiveDelivery() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [handoverNotes, setHandoverNotes] = useState("");
  const [completedSuccess, setCompletedSuccess] = useState(false);

  // Quality check checkboxes
  const [checks, setChecks] = useState({
    sealed: false,
    temperature: false,
    clean: false,
  });

  const loadTask = async () => {
    try {
      setLoading(true);
      const res = await getVolunteerTaskById(id);
      setTask(res.task);
    } catch (err) {
      console.error("Error loading task:", err);
      setError(err.message || "Failed to load active delivery");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTask();
  }, [id]);

  const handleUpdateStatus = async (newStatus, notes = "") => {
    try {
      setUpdating(true);
      await updateVolunteerTaskStatus(id, newStatus, notes);
      if (newStatus === "DELIVERED") {
        setCompletedSuccess(true);
        setShowCompleteModal(false);
      }
      loadTask();
    } catch (err) {
      alert(err.message || "Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  const currentStatus = task?.status || "ASSIGNED";

  // Step indices: ASSIGNED = 0, PICKED_UP = 1, IN_TRANSIT = 2, DELIVERED = 3
  const getStepIndex = (status) => {
    switch (status) {
      case "ASSIGNED":
        return 0;
      case "PICKED_UP":
        return 1;
      case "IN_TRANSIT":
        return 2;
      case "DELIVERED":
        return 3;
      default:
        return 0;
    }
  };

  const stepIndex = getStepIndex(currentStatus);

  return (
    <div className="donor-layout vol-layout">
      <VolunteerSidebar activeDeliveryId={task?.status !== "DELIVERED" ? task?.pickup_id : null} />

      <main className="donor-main vol-main">
        <div className="vol-content">
          <div className="admin-back-bar">
            <Link to="/volunteer/tasks" className="admin-back-link">
              <ArrowLeft size={16} />
              <span>Back to Tasks</span>
            </Link>
          </div>

          {loading ? (
            <div className="dashboard-empty-card">
              <div className="food-spinner"></div>
              <p>Loading live delivery tracker...</p>
            </div>
          ) : error || !task ? (
            <div className="dashboard-empty-card">
              <div className="empty-icon-wrap icon-danger">
                <AlertCircle size={32} />
              </div>
              <h3>Delivery Not Found</h3>
              <p>{error || "Could not find active delivery mission."}</p>
            </div>
          ) : (
            <div className="vol-active-container">
              {/* SUCCESS CELEBRATION IF COMPLETED */}
              {completedSuccess || currentStatus === "DELIVERED" ? (
                <div className="vol-celebrate-card">
                  <div className="celebrate-icon-box">
                    <CheckCircle2 size={48} />
                  </div>
                  <h2>Rescue Mission Completed!</h2>
                  <p>
                    You successfully delivered <strong>{task.quantity} {task.unit} of {task.food_type}</strong> to {task.delivery_location}.
                  </p>
                  <div className="celebrate-stats">
                    <div className="c-stat">
                      <span className="c-number">~{Math.round(estimateMeals(task.quantity, task.unit))}</span>
                      <span className="c-label">Meals Provided</span>
                    </div>
                    <div className="c-stat">
                      <span className="c-number">0 kg</span>
                      <span className="c-label">Food Wasted</span>
                    </div>
                  </div>
                  <div className="celebrate-actions">
                    <Link to="/volunteer/history" className="btn btn-primary">
                      View My Activity History →
                    </Link>
                    <Link to="/volunteer/tasks" className="btn btn-secondary">
                      Pick Next Rescue Mission
                    </Link>
                  </div>
                </div>
              ) : (
                <>
                  {/* ACTIVE HEADER */}
                  <div className="active-tracker-header">
                    <span className="tracker-badge">
                      <span className="live-pulse-dot"></span> Live Food Rescue Mission #{task.pickup_id}
                    </span>
                    <h1>
                      {task.quantity} {task.unit} of {task.food_type}
                    </h1>
                    <p className="tracker-sub">
                      Move safe surplus food from the donor to the receiving shelter. Keep food sealed and handle with care.
                    </p>
                  </div>

                  <RouteMap
                    pickup={{ lat: task.pickup_latitude, lng: task.pickup_longitude }}
                    delivery={{ lat: task.delivery_latitude, lng: task.delivery_longitude }}
                    status={task.status}
                    pickupAddress={`${task.pickup_address || task.pickup_location || ""}${task.city ? ", " + task.city : ""}`}
                    deliveryAddress={task.delivery_location || ""}
                  />

                  {/* VISUAL STEPPER TIMELINE */}
                  <div className="vol-stepper-card">
                    <div className="stepper-track">
                      <div
                        className="stepper-fill"
                        style={{ width: `${(stepIndex / 3) * 100}%` }}
                      ></div>
                    </div>

                    <div className="stepper-nodes">
                      <div className={`stepper-node ${stepIndex >= 0 ? "completed" : ""}`}>
                        <div className="node-circle">1</div>
                        <div className="node-label">Assigned</div>
                      </div>
                      <div className={`stepper-node ${stepIndex >= 1 ? "completed" : stepIndex === 0 ? "active" : ""}`}>
                        <div className="node-circle">2</div>
                        <div className="node-label">Picked Up</div>
                      </div>
                      <div className={`stepper-node ${stepIndex >= 2 ? "completed" : stepIndex === 1 ? "active" : ""}`}>
                        <div className="node-circle">3</div>
                        <div className="node-label">In Transit</div>
                      </div>
                      <div className={`stepper-node ${stepIndex === 3 ? "completed" : stepIndex === 2 ? "active" : ""}`}>
                        <div className="node-circle">4</div>
                        <div className="node-label">Delivered</div>
                      </div>
                    </div>
                  </div>

                  {/* ACTIVE ACTION STAGE CARD */}
                  <div className="vol-active-action-card">
                    {/* Stage 1: ASSIGNED (Need to Pick Up) */}
                    {currentStatus === "ASSIGNED" && (
                      <div className="action-stage">
                        <div className="stage-header">
                          <div className="stage-num-tag">STEP 1 OF 3</div>
                          <h2>Proceed to Donor Location for Pickup</h2>
                          <p>Navigate to the donor's address, verify food portion and quality, then confirm collection.</p>
                        </div>

                        <div className="contact-card-highlight">
                          <div className="contact-col">
                            <small>Food Donor Contact</small>
                            <strong>{task.donor_name}</strong>
                            {task.donor_phone && (
                              <a href={`tel:${task.donor_phone}`} className="phone-btn">
                                <Phone size={14} /> Call Donor: {formatPhone(task.donor_phone)}
                              </a>
                            )}
                          </div>
                          <div className="contact-col">
                            <small>Pickup Address</small>
                            <strong>{task.pickup_address || task.pickup_location}</strong>
                          </div>
                        </div>

                        <div className="quality-checklist-box">
                          <h4>
                            <ShieldCheck size={16} /> Pre-Pickup Quality & Hygiene Checklist
                          </h4>
                          <label className="checkbox-item">
                            <input
                              type="checkbox"
                              checked={checks.sealed}
                              onChange={(e) => setChecks({ ...checks, sealed: e.target.checked })}
                            />
                            <span>Food packaging is securely sealed and covered</span>
                          </label>
                          <label className="checkbox-item">
                            <input
                              type="checkbox"
                              checked={checks.clean}
                              onChange={(e) => setChecks({ ...checks, clean: e.target.checked })}
                            />
                            <span>Containers are clean and safe for transport</span>
                          </label>
                        </div>

                        <button
                          onClick={() => handleUpdateStatus("PICKED_UP", "Food collected and verified.")}
                          disabled={updating || !checks.sealed || !checks.clean}
                          className="btn btn-primary btn-large btn-full-width"
                        >
                          <CheckSquare size={18} />
                          <span>{updating ? "Updating Milestone..." : "Confirm Food Collected from Donor"}</span>
                        </button>
                      </div>
                    )}

                    {/* Stage 2: PICKED_UP (Ready to start transit) */}
                    {currentStatus === "PICKED_UP" && (
                      <div className="action-stage">
                        <div className="stage-header">
                          <div className="stage-num-tag">STEP 2 OF 3</div>
                          <h2>Start Delivery Transit to Shelter</h2>
                          <p>Food is collected. Proceed directly to the destination community center.</p>
                        </div>

                        <div className="contact-card-highlight">
                          <div className="contact-col">
                            <small>Destination Shelter</small>
                            <strong>{task.delivery_location}</strong>
                          </div>
                          <div className="contact-col">
                            <small>Shelter Contact Person</small>
                            <strong>{task.ngo_contact_name || task.ngo_name || "Not provided"}</strong>
                            {task.ngo_contact_phone && (
                              <a href={`tel:${task.ngo_contact_phone}`} className="phone-btn">
                                <Phone size={14} /> Call Shelter: {formatPhone(task.ngo_contact_phone)}
                              </a>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => handleUpdateStatus("IN_TRANSIT", "Driver in transit to destination.")}
                          disabled={updating}
                          className="btn btn-primary btn-large btn-full-width"
                        >
                          <Truck size={18} />
                          <span>{updating ? "Updating..." : "Start Driving / In Transit"}</span>
                        </button>
                      </div>
                    )}

                    {/* Stage 3: IN_TRANSIT (Arriving at drop-off) */}
                    {currentStatus === "IN_TRANSIT" && (
                      <div className="action-stage">
                        <div className="stage-header">
                          <div className="stage-num-tag">STEP 3 OF 3</div>
                          <h2>Arriving at Drop-off Destination</h2>
                          <p>Hand over food containers to shelter staff and complete the mission.</p>
                        </div>

                        <div className="contact-card-highlight">
                          <div className="contact-col">
                            <small>Receiving Shelter</small>
                            <strong>{task.delivery_location}</strong>
                          </div>
                          <div className="contact-col">
                            <small>Shelter Contact Person</small>
                            <strong>{task.ngo_contact_name || task.ngo_name || "Not provided"}</strong>
                            {task.ngo_contact_phone && (
                              <a href={`tel:${task.ngo_contact_phone}`} className="phone-btn">
                                <Phone size={14} /> Call Shelter: {formatPhone(task.ngo_contact_phone)}
                              </a>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => setShowCompleteModal(true)}
                          disabled={updating}
                          className="btn btn-primary btn-large btn-full-width"
                        >
                          <CheckCircle2 size={18} />
                          <span>Complete Handover & Mark Delivered</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* COMPLETE HANDOVER MODAL */}
                  {showCompleteModal && (
                    <div className="ngo-modal-backdrop" onClick={() => setShowCompleteModal(false)}>
                      <div className="ngo-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="ngo-modal-header">
                          <div>
                            <span className="dashboard-eyebrow">MISSION CLOSURE</span>
                            <h2>Complete Delivery Handover</h2>
                          </div>
                          <button
                            type="button"
                            className="ngo-modal-close"
                            onClick={() => setShowCompleteModal(false)}
                          >
                            <X size={20} />
                          </button>
                        </div>

                        <div className="ngo-modal-summary">
                          <strong>{task.food_type}</strong>
                          <p>Delivered to {task.delivery_location}</p>
                        </div>

                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            handleUpdateStatus("DELIVERED", handoverNotes);
                          }}
                          className="ngo-modal-form"
                        >
                          <div className="form-field">
                            <label>Handover Notes / Verification Name (Optional)</label>
                            <textarea
                              rows={3}
                              value={handoverNotes}
                              onChange={(e) => setHandoverNotes(e.target.value)}
                              placeholder="e.g. Handed over to center manager, food verified hot & fresh..."
                              className="admin-search-input"
                            />
                          </div>

                          <div className="ngo-modal-actions">
                            <button
                              type="button"
                              className="btn btn-secondary"
                              onClick={() => setShowCompleteModal(false)}
                              disabled={updating}
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="btn btn-primary"
                              disabled={updating}
                            >
                              {updating ? "Submitting..." : "Confirm Handover & Finish Mission"}
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
        <Footer variant="app" />
      </main>
    </div>
  );
}

export default ActiveDelivery;
