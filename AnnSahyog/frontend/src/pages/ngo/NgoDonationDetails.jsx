import { useEffect, useState } from "react";
import Footer from "../../components/Footer";
import { Link, useParams } from "react-router-dom";
import NgoSidebar from "../../components/NgoSidebar";
import { getDonationById, createDonationRequest } from "../../services/api";
import {
  ArrowLeft,
  Utensils,
  Scale,
  Clock,
  MapPin,
  User,
  Send,
  CheckCircle2,
  AlertCircle,
  X,
  ShieldCheck,
  Package,
} from "lucide-react";

function NgoDonationDetails() {
  const { id } = useParams();
  const user = JSON.parse(localStorage.getItem("user") || "null");

  const [donation, setDonation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Request Modal State
  const [showModal, setShowModal] = useState(false);
  const [requestedQty, setRequestedQty] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState("");

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const data = await getDonationById(id);
      const d = data.donation || null;
      setDonation(d);
      if (d) {
        setRequestedQty(d.quantity);
        setMessage("We would like to request this food for distribution at our community center.");
      }
    } catch (err) {
      console.error("Donation fetch error:", err);
      setError(err.message || "Failed to load donation details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    if (!donation || !user?.ngo_id) return;

    if (Number(requestedQty) <= 0 || Number(requestedQty) > Number(donation.quantity)) {
      setModalError(`Please request between 1 and ${donation.quantity} ${donation.unit}.`);
      return;
    }

    try {
      setSubmitting(true);
      setModalError("");
      await createDonationRequest({
        donation_id: donation.donation_id,
        ngo_id: user.ngo_id,
        requested_quantity: requestedQty,
        message,
      });

      setSuccessMsg(`Food request sent successfully! Donor has been notified.`);
      setShowModal(false);
    } catch (err) {
      console.error("Submit request error:", err);
      setModalError(err.message || "Failed to submit food request.");
    } finally {
      setSubmitting(false);
    }
  };

  const isAvailable = donation ? donation.status === "AVAILABLE" : false;

  return (
    <div className="donor-layout ngo-layout">
      <NgoSidebar />

      <main className="donor-main ngo-main">
        <div className="dashboard-page ngo-dashboard-page">
          <div className="container">
            <div className="admin-back-bar">
              <Link to="/ngo/donations" className="admin-back-link">
                <ArrowLeft size={16} />
                <span>Back to Available Food</span>
              </Link>
            </div>

            {loading ? (
              <div className="dashboard-empty-card">
                <div className="food-spinner"></div>
                <p>Loading donation details...</p>
              </div>
            ) : error ? (
              <div className="auth-alert alert-error">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            ) : !donation ? (
              <div className="dashboard-empty-card">
                <div className="empty-icon-wrap">
                  <Utensils size={36} />
                </div>
                <h3>Donation Not Found</h3>
                <p>This surplus batch may have already been claimed or expired.</p>
                <Link to="/ngo/donations" className="btn btn-primary btn-sm">
                  Browse Other Food
                </Link>
              </div>
            ) : (
              <div className="donation-detail-wrapper">
                {successMsg && (
                  <div className="auth-alert alert-success" style={{ marginBottom: "1.25rem" }}>
                    <CheckCircle2 size={18} />
                    <span>{successMsg}</span>
                  </div>
                )}

                {/* Hero Header */}
                <div className="detail-hero-card">
                  <div className="detail-hero-top">
                    <div>
                      <span className="hero-eyebrow">
                        DONATION #{donation.donation_id} · AVAILABLE SURPLUS
                      </span>
                      <h1 className="hero-food-title">{donation.food_type}</h1>
                      <p className="hero-desc">
                        {donation.description || "Fresh surplus food available for community distribution."}
                      </p>
                    </div>

                    <span className={`donation-status ${isAvailable ? "status-available" : "status-default"}`}>
                      {donation.status || "AVAILABLE"}
                    </span>
                  </div>

                  <div className="hero-meta-badges">
                    <span className="meta-badge">
                      <Scale size={13} /> {donation.quantity} {donation.unit}
                    </span>
                    <span className="meta-badge">
                      <MapPin size={13} /> {donation.city || "Ahmedabad"}
                    </span>
                    <span className="meta-badge">
                      <User size={13} /> Donor: {donation.donor_name || "Food Donor"}
                    </span>
                    {donation.expiry_date && (
                      <span className="meta-badge badge-warning">
                        <Clock size={13} /> Best Before: {new Date(donation.expiry_date).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                      </span>
                    )}
                  </div>
                </div>

                {/* 2-Column Split */}
                <div className="detail-two-col">
                  {/* Food Details */}
                  <div className="detail-card">
                    <div className="detail-card-header">
                      <h3>
                        <Utensils size={18} /> Food & Portion Details
                      </h3>
                    </div>
                    <div className="detail-card-body">
                      <div className="detail-row">
                        <span className="row-label">Category / Food Item:</span>
                        <strong className="row-val">{donation.food_type}</strong>
                      </div>
                      <div className="detail-row">
                        <span className="row-label">Available Portions / Weight:</span>
                        <strong className="row-val">{donation.quantity} {donation.unit}</strong>
                      </div>
                      <div className="detail-row">
                        <span className="row-label">Preparation Time:</span>
                        <span className="row-val">
                          {donation.prepared_date
                            ? new Date(donation.prepared_date).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })
                            : "Freshly prepared"}
                        </span>
                      </div>
                      <div className="detail-row">
                        <span className="row-label">Best Before / Expiry:</span>
                        <span className="row-val text-warning">
                          {donation.expiry_date
                            ? new Date(donation.expiry_date).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })
                            : "Same-day distribution recommended"}
                        </span>
                      </div>

                      {/* Portions table if items exist */}
                      {donation.items && donation.items.length > 0 && (
                        <div className="detail-sub-section">
                          <h4 className="sub-section-title">
                            <Package size={14} /> Itemized Portion Breakdown ({donation.items.length})
                          </h4>
                          <div className="detail-items-table-wrap">
                            <table className="mini-detail-table">
                              <thead>
                                <tr>
                                  <th>Item Name</th>
                                  <th>Portion</th>
                                </tr>
                              </thead>
                              <tbody>
                                {donation.items.map((item, idx) => (
                                  <tr key={item.item_id || idx}>
                                    <td>
                                      <strong>{item.food_item}</strong>
                                    </td>
                                    <td>
                                      {item.quantity} {item.unit}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Pickup & Donor Info */}
                  <div className="detail-card">
                    <div className="detail-card-header">
                      <h3>
                        <MapPin size={18} /> Pickup & Donor Information
                      </h3>
                    </div>
                    <div className="detail-card-body">
                      <div className="detail-row">
                        <span className="row-label">Donor Name:</span>
                        <strong className="row-val">{donation.donor_name || "Food Donor"}</strong>
                      </div>
                      <div className="detail-row">
                        <span className="row-label">Pickup Address:</span>
                        <strong className="row-val text-address">
                          {donation.pickup_address || "Provided upon donor claim approval"}
                        </strong>
                      </div>
                      <div className="detail-row">
                        <span className="row-label">City Zone:</span>
                        <span className="row-val">{donation.city || "Ahmedabad"}</span>
                      </div>

                      <div className="action-hint-box hint-green">
                        <ShieldCheck size={16} />
                        <div>
                          <strong>Zero-Cost Redistribution:</strong>
                          <p>
                            All food rescue logistics on AnnSahyog are free for verified community shelters and NGOs.
                          </p>
                        </div>
                      </div>

                      {isAvailable && (
                        <button
                          type="button"
                          className="btn btn-primary btn-large btn-full-width"
                          style={{ marginTop: "1.25rem" }}
                          onClick={() => setShowModal(true)}
                        >
                          <Send size={16} />
                          <span>Claim This Food Batch</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Claim Modal */}
                {showModal && (
                  <div className="ngo-modal-backdrop" onClick={() => setShowModal(false)}>
                    <div
                      className="ngo-modal-content"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="ngo-modal-header">
                        <div>
                          <span className="dashboard-eyebrow">FOOD REQUEST</span>
                          <h2>Claim Surplus Food</h2>
                        </div>
                        <button
                          type="button"
                          className="ngo-modal-close"
                          onClick={() => setShowModal(false)}
                        >
                          <X size={20} />
                        </button>
                      </div>

                      {modalError && (
                        <div className="auth-alert alert-error" style={{ marginBottom: "1rem" }}>
                          <AlertCircle size={16} />
                          <span>{modalError}</span>
                        </div>
                      )}

                      <form onSubmit={handleRequestSubmit} className="ngo-modal-form">
                        <div className="form-field">
                          <label>
                            Requested Quantity ({donation.unit}) <span className="req-star">*</span>
                          </label>
                          <input
                            type="number"
                            step="any"
                            min="0.1"
                            max={donation.quantity}
                            value={requestedQty}
                            onChange={(e) => setRequestedQty(e.target.value)}
                            required
                            className="admin-search-input"
                          />
                        </div>

                        <div className="form-field">
                          <label>Shelter Distribution Purpose</label>
                          <textarea
                            rows={3}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="admin-search-input"
                            required
                          />
                        </div>

                        <div className="ngo-modal-actions">
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => setShowModal(false)}
                            disabled={submitting}
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={submitting}
                          >
                            {submitting ? "Submitting..." : "Send Food Request →"}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        <Footer variant="app" />
      </main>
    </div>
  );
}

export default NgoDonationDetails;
