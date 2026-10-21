import { useEffect, useState } from "react";
import StatusBadge from "../../components/StatusBadge";
import { getPickupStatus } from "../../utils/status";
import BackButton from "../../components/BackButton";
import Footer from "../../components/Footer";
import NgoSidebar from "../../components/NgoSidebar";
import {
  getNgoDeliveries,
  confirmDeliveryReceipt,
  submitFeedback,
} from "../../services/api";
import {
  Truck,
  CheckCircle2,
  Phone,
  AlertCircle,
  X,
} from "lucide-react";

function NgoDeliveries() {
  const user = JSON.parse(localStorage.getItem("user") || "null");

  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Confirm Receipt & Feedback Modal
  const [confirmModalDelivery, setConfirmModalDelivery] = useState(null);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [submittingConfirm, setSubmittingConfirm] = useState(false);

  const fetchDeliveriesList = async () => {
    if (!user?.ngo_id) return;
    try {
      setLoading(true);
      const data = await getNgoDeliveries(user.ngo_id);
      setDeliveries(data.deliveries || []);
    } catch (err) {
      console.error("Fetch deliveries error:", err);
      setError(err.message || "Failed to load deliveries.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveriesList();
  }, [user?.ngo_id]);

  const openConfirmModal = (delivery) => {
    setConfirmModalDelivery(delivery);
    setFeedbackComment("Food arrived fresh, in good condition, and on time.");
  };

  const closeConfirmModal = () => {
    setConfirmModalDelivery(null);
    setFeedbackComment("");
  };

  const handleConfirmReceipt = async (e) => {
    e.preventDefault();
    if (!confirmModalDelivery) return;

    try {
      setSubmittingConfirm(true);
      setError("");
      setSuccessMsg("");

      // 1. Confirm receipt in pickup_delivery & mark donation COMPLETED
      await confirmDeliveryReceipt(confirmModalDelivery.pickup_id);

      // 2. Submit optional feedback
      if (feedbackComment.trim() && user?.user_id) {
        try {
          await submitFeedback({
            user_id: user.user_id,
            donation_id: confirmModalDelivery.donation_id,
            comments: feedbackComment.trim(),
          });
        } catch (fErr) {
          console.warn("Feedback save error:", fErr);
        }
      }

      setSuccessMsg(
        `Receipt confirmed for "${confirmModalDelivery.food_type}"! Thank you for closing the rescue loop.`
      );

      // Update state
      setDeliveries((prev) =>
        prev.map((d) =>
          d.pickup_id === confirmModalDelivery.pickup_id
            ? { ...d, delivery_status: "DELIVERED", delivery_timestamp: new Date().toISOString() }
            : d
        )
      );

      closeConfirmModal();
    } catch (err) {
      console.error("Confirm delivery error:", err);
      setError(err.message || "Failed to confirm delivery receipt.");
    } finally {
      setSubmittingConfirm(false);
    }
  };


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
                  LOGISTICS TRACKING
                </span>
                <h1>Incoming Deliveries</h1>
                <p>
                  Track volunteer couriers moving claimed surplus food to your community center and confirm receipts.
                </p>
              </div>

              <div className="admin-stat-pills">
                <span className="pill-badge pill-active">
                  <Truck size={14} /> Total Deliveries: {deliveries.length}
                </span>
              </div>
            </div>

            {error && (
              <div className="auth-alert alert-error" style={{ marginBottom: "1.25rem" }}>
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}
            {successMsg && (
              <div className="auth-alert alert-success" style={{ marginBottom: "1.25rem" }}>
                <CheckCircle2 size={18} />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Delivery List */}
            {loading ? (
              <div className="dashboard-empty-card">
                <div className="food-spinner"></div>
                <p>Loading incoming deliveries...</p>
              </div>
            ) : deliveries.length === 0 ? (
              <div className="dashboard-empty-card">
                <div className="empty-icon-wrap">
                  <Truck size={36} />
                </div>
                <h3>No active deliveries</h3>
                <p>Once a donor approves your food claim, volunteer couriers will be assigned and tracked here.</p>
              </div>
            ) : (
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Delivery ID</th>
                      <th>Food Item</th>
                      <th>Quantity</th>
                      <th>Pickup Address</th>
                      <th>Volunteer Courier</th>
                      <th>Transit Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deliveries.map((del) => (
                      <tr key={del.pickup_id}>
                        <td className="table-mono">#{del.pickup_id}</td>
                        <td>
                          <strong>{del.food_type}</strong>
                          <span className="table-sub">{del.donor_name || "Food Donor"}</span>
                        </td>
                        <td>
                          <strong>
                            {del.quantity ?? del.requested_quantity} {del.unit}
                          </strong>
                        </td>
                        <td>
                          <span className="table-sub">{del.pickup_address || "Ahmedabad"}</span>
                        </td>
                        <td>
                          <div className="table-driver-info">
                            <strong>{del.volunteer_name || "Finding a driver"}</strong>
                            {del.volunteer_phone && (
                              <a href={`tel:${del.volunteer_phone}`} className="table-phone-link">
                                <Phone size={12} /> {del.volunteer_phone}
                              </a>
                            )}
                          </div>
                        </td>
                        <td>
                          <StatusBadge status={getPickupStatus(del.delivery_status || del.status || "ASSIGNED", del.volunteer_name)} />
                        </td>
                        <td>
                          {del.delivery_status !== "DELIVERED" ? (
                            <button
                              type="button"
                              className="btn btn-xs btn-primary btn-confirm-receipt"
                              onClick={() => openConfirmModal(del)}
                            >
                              <CheckCircle2 size={13} />
                              <span>Confirm Receipt</span>
                            </button>
                          ) : (
                            <span className="text-success-bold received-stamp">
                              <CheckCircle2 size={14} />
                              <span>Received</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* CONFIRM RECEIPT MODAL */}
            {confirmModalDelivery && (
              <div className="ngo-modal-backdrop" onClick={closeConfirmModal}>
                <div
                  className="ngo-modal-content"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="ngo-modal-header">
                    <div>
                      <span className="dashboard-eyebrow">VERIFICATION PROTOCOL</span>
                      <h2>Confirm Food Delivery Receipt</h2>
                    </div>
                    <button
                      type="button"
                      className="ngo-modal-close"
                      onClick={closeConfirmModal}
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <div className="ngo-modal-summary">
                    <strong>{confirmModalDelivery.food_type}</strong>
                    <p>
                      Delivered by {confirmModalDelivery.volunteer_name || "Volunteer Courier"} • Portions:{" "}
                      <span>
                        {confirmModalDelivery.quantity ?? confirmModalDelivery.requested_quantity} {confirmModalDelivery.unit}
                      </span>
                    </p>
                  </div>

                  <form onSubmit={handleConfirmReceipt} className="ngo-modal-form">
                    <div className="form-field">
                      <label>Feedback / Food Condition Notes (Optional)</label>
                      <textarea
                        rows={3}
                        value={feedbackComment}
                        onChange={(e) => setFeedbackComment(e.target.value)}
                        placeholder="e.g. Food was received fresh and immediately distributed..."
                        className="admin-search-input"
                      />
                    </div>

                    <div className="ngo-modal-actions">
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={closeConfirmModal}
                        disabled={submittingConfirm}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={submittingConfirm}
                      >
                        {submittingConfirm ? (
                          <>
                            <div className="btn-spinner"></div>
                            <span>Confirming Receipt...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 size={16} />
                            <span>Confirm Receipt & Close Rescue</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
        <Footer variant="app" />
      </main>
    </div>
  );
}

export default NgoDeliveries;
